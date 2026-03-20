import { exec } from "child_process";
import { readFile, readdir } from "fs/promises";
import path from "path";
import type { DiscoveredCronJob, CronJobConfig } from "./cron-types";
import { getIntervalMinutes } from "./cron-utils";

function execAsync(cmd: string, timeoutMs = 10000): Promise<string> {
  return new Promise((resolve, reject) => {
    const child = exec(cmd, { timeout: timeoutMs }, (error, stdout, stderr) => {
      if (error) {
        // Timeout or SSH failure — return empty
        resolve("");
        return;
      }
      resolve(stdout);
    });
  });
}

/** Derive a group name from a command path. */
function deriveGroup(command: string): string {
  // Match paths like /root/Blackfire_automation/... or ~/Banking/collector/...
  const pathMatch = command.match(/(?:\/root\/|\/Users\/\w+\/)([\w_-]+)\//);
  if (pathMatch) {
    return pathMatch[1]
      .replace(/_/g, " ")
      .replace(/-/g, " ")
      .replace(/\b\w/g, (c) => c.toUpperCase());
  }
  return "Sonstige";
}

/** Derive a human-readable name from a command. */
function deriveName(command: string): string {
  // Extract script name: last .py or .sh file
  const scriptMatch = command.match(/([\w_-]+)\.(py|sh)\b/);
  if (scriptMatch) {
    return scriptMatch[1]
      .replace(/_/g, " ")
      .replace(/-/g, " ")
      .replace(/\b\w/g, (c) => c.toUpperCase());
  }
  // Fallback: last path segment
  const parts = command.trim().split(/\s+/);
  const last = parts[parts.length - 1];
  return path.basename(last).replace(/\.\w+$/, "");
}

/** Extract log path from >> redirect in command. */
function extractLogPath(raw: string): string | null {
  const match = raw.match(/>>\s*(\S+)/);
  return match ? match[1] : null;
}

/** Generate a stable ID from host + command. */
function generateId(host: string, command: string): string {
  const scriptMatch = command.match(/([\w_-]+)\.(py|sh)\b/);
  const name = scriptMatch ? scriptMatch[1] : command.slice(0, 30);
  const slug = name.toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/-+$/, "");
  return `${host}-${slug}`;
}

/** Parse crontab output into discovered jobs. */
function parseCrontab(output: string, host: string): DiscoveredCronJob[] {
  const jobs: DiscoveredCronJob[] = [];

  for (const rawLine of output.split("\n")) {
    const line = rawLine.trim();

    // Skip empty lines, variable assignments, SHELL/PATH declarations
    if (!line || line.startsWith("SHELL=") || line.startsWith("PATH=") || line.startsWith("PYTHONUNBUFFERED=")) {
      continue;
    }

    // Check if line is commented out
    const isComment = line.startsWith("#");
    const cleanLine = isComment ? line.replace(/^#\s*/, "") : line;

    // Must start with a cron schedule (5 fields: min hour dom month dow)
    const cronMatch = cleanLine.match(
      /^(\S+\s+\S+\s+\S+\s+\S+\s+\S+)\s+(.+)$/
    );
    if (!cronMatch) continue;

    const schedule = cronMatch[1];
    const fullCommand = cronMatch[2];

    // Validate that schedule fields look like cron values
    const fields = schedule.split(/\s+/);
    const validCron = fields.every((f) => /^[\d*,\/-]+$/.test(f));
    if (!validCron) continue;

    // Skip one-time jobs (contain crontab -l | grep -v ... | crontab -)
    if (fullCommand.includes("crontab -l") && fullCommand.includes("crontab -")) {
      continue;
    }

    jobs.push({
      schedule,
      command: fullCommand.replace(/\s*>>.*$/, "").trim(),
      logPath: extractLogPath(fullCommand),
      host,
      group: deriveGroup(fullCommand),
      enabled: !isComment,
      source: "crontab",
      raw: rawLine,
    });
  }

  return jobs;
}

/** Parse macOS LaunchAgent plist for cron-like schedules. */
async function parseLaunchAgent(
  plistPath: string,
  host: string
): Promise<DiscoveredCronJob | null> {
  try {
    const content = await readFile(plistPath, "utf-8");

    // Only interested in scheduled agents (StartCalendarInterval)
    if (!content.includes("StartCalendarInterval")) return null;

    // Skip KeepAlive daemons (not cron jobs)
    if (content.includes("<key>KeepAlive</key>") && content.includes("<true/>")) {
      // Only skip if there's no calendar interval — daemons with both are OK
      if (!content.includes("StartCalendarInterval")) return null;
    }

    // Extract hour and minute
    const hourMatch = content.match(/<key>Hour<\/key>\s*<integer>(\d+)<\/integer>/);
    const minuteMatch = content.match(/<key>Minute<\/key>\s*<integer>(\d+)<\/integer>/);

    const hour = hourMatch ? hourMatch[1] : "*";
    const minute = minuteMatch ? minuteMatch[1] : "0";
    const schedule = `${minute} ${hour} * * *`;

    // Extract command
    const argsMatches = [...content.matchAll(/<string>([^<]+)<\/string>/g)];
    const args = argsMatches.map((m) => m[1]);
    const command = args.slice(0, 3).join(" "); // First 3 args typically

    // Extract log path
    const stdoutMatch = content.match(/<key>StandardOutPath<\/key>\s*<string>([^<]+)<\/string>/);
    const logPath = stdoutMatch ? stdoutMatch[1] : null;

    // Extract label for naming
    const labelMatch = content.match(/<key>Label<\/key>\s*<string>([^<]+)<\/string>/);
    const label = labelMatch ? labelMatch[1] : path.basename(plistPath);

    return {
      schedule,
      command,
      logPath,
      host,
      group: "System",
      enabled: true,
      source: "launchd",
      raw: `LaunchAgent: ${label}`,
    };
  } catch {
    return null;
  }
}

// ─── Public Discovery Functions ───

export async function discoverVPS(): Promise<DiscoveredCronJob[]> {
  const output = await execAsync('ssh vps "crontab -l" 2>/dev/null');
  return parseCrontab(output, "vps");
}

export async function discoverLocal(): Promise<DiscoveredCronJob[]> {
  const jobs: DiscoveredCronJob[] = [];

  // Local crontab
  const crontab = await execAsync("crontab -l 2>/dev/null");
  jobs.push(...parseCrontab(crontab, "macbook"));

  // LaunchAgents
  const launchAgentsDir = path.join(
    process.env.HOME || "/Users/robin",
    "Library/LaunchAgents"
  );
  try {
    const files = await readdir(launchAgentsDir);
    for (const file of files) {
      if (!file.endsWith(".plist")) continue;
      // Skip system/vendor agents
      if (file.startsWith("com.google.") || file.startsWith("com.setapp.")) continue;
      const agent = await parseLaunchAgent(
        path.join(launchAgentsDir, file),
        "macbook"
      );
      if (agent) jobs.push(agent);
    }
  } catch {
    // LaunchAgents dir not accessible
  }

  return jobs;
}

export async function discoverMacMini(): Promise<DiscoveredCronJob[]> {
  const jobs: DiscoveredCronJob[] = [];

  // Remote crontab
  const crontab = await execAsync('ssh macmini "crontab -l" 2>/dev/null');
  jobs.push(...parseCrontab(crontab, "mac-mini"));

  // Remote LaunchAgents — list and read relevant ones
  const lsOutput = await execAsync(
    'ssh macmini "ls ~/Library/LaunchAgents/" 2>/dev/null'
  );
  for (const file of lsOutput.split("\n").filter((f) => f.endsWith(".plist"))) {
    if (file.startsWith("com.google.") || file.startsWith("com.setapp.")) continue;
    const content = await execAsync(
      `ssh macmini "cat ~/Library/LaunchAgents/${file}" 2>/dev/null`
    );
    if (!content || !content.includes("StartCalendarInterval")) continue;

    // Write to temp and parse
    const tmpPath = `/tmp/discovery-${file}`;
    const { writeFile } = await import("fs/promises");
    await writeFile(tmpPath, content);
    const agent = await parseLaunchAgent(tmpPath, "mac-mini");
    if (agent) jobs.push(agent);
  }

  return jobs;
}

export async function discoverAll(): Promise<DiscoveredCronJob[]> {
  // Run sequentially to avoid SSH rate limiting
  const vpsJobs = await discoverVPS();
  const localJobs = await discoverLocal();
  const miniJobs = await discoverMacMini();
  return [...vpsJobs, ...localJobs, ...miniJobs];
}

/**
 * Merge discovered jobs with existing config.
 * Returns new jobs not yet in config (for auto-adding).
 */
export function mergeDiscoveredJobs(
  configJobs: CronJobConfig[],
  discovered: DiscoveredCronJob[]
): { newJobs: CronJobConfig[]; removedIds: string[] } {
  const configCommands = new Set(
    configJobs.map((j) => normalizeCommand(j.command))
  );

  const newJobs: CronJobConfig[] = [];

  for (const disc of discovered) {
    const normalized = normalizeCommand(disc.command);
    if (configCommands.has(normalized)) continue;

    const interval = getIntervalMinutes(disc.schedule);

    newJobs.push({
      id: generateId(disc.host, disc.command),
      name: deriveName(disc.command),
      host: disc.host,
      group: disc.group,
      schedule: disc.schedule,
      scheduleHuman: disc.schedule, // Will be enriched later
      command: disc.command,
      logPath: disc.logPath,
      maxDurationMinutes: 10,
      maxAgeMinutes: Math.round(interval * 1.5),
      enabled: disc.enabled,
      description: `Automatisch entdeckt`,
      source: disc.source,
      discovered: true,
    });
  }

  // Find config jobs whose commands no longer appear in discovery
  const discoveredCommands = new Set(
    discovered.map((d) => normalizeCommand(d.command))
  );
  const removedIds = configJobs
    .filter((j) => !discoveredCommands.has(normalizeCommand(j.command)))
    .map((j) => j.id);

  return { newJobs, removedIds };
}

/** Normalize command for comparison (strip paths, whitespace). */
function normalizeCommand(cmd: string): string {
  return cmd
    .replace(/\/[\w/.-]+\/(venv\/bin\/)?python3?\s+/g, "python3 ")
    .replace(/\/[\w/.-]+\//g, "")
    .replace(/\s+/g, " ")
    .trim();
}
