import { readdir, readFile, stat } from "fs/promises";
import path from "path";
import type { DiscoveredService } from "./types";
import { getProjectsBasePath } from "./config";

const TECH_PATTERNS: [RegExp, string][] = [
  [/Next\.js/i, "Next.js"],
  [/React/i, "React"],
  [/TypeScript/i, "TypeScript"],
  [/Python/i, "Python"],
  [/WordPress/i, "WordPress"],
  [/Docker/i, "Docker"],
  [/Node\.js/i, "Node.js"],
  [/Tailwind/i, "Tailwind CSS"],
  [/Supabase/i, "Supabase"],
  [/pandas/i, "pandas"],
  [/yfinance/i, "yfinance"],
  [/OpenAI/i, "OpenAI"],
  [/Notion API/i, "Notion API"],
  [/Redis/i, "Redis"],
  [/PostgreSQL/i, "PostgreSQL"],
];

const DEPLOYMENT_PATTERNS: [RegExp, string][] = [
  [/\bVPS\b/i, "VPS"],
  [/\bVercel\b/i, "Vercel"],
  [/\bDocker\b/i, "Docker"],
  [/\bcronjob\b/i, "Cronjob"],
  [/\bPM2\b/i, "PM2"],
  [/\bHostinger\b/i, "Hostinger"],
];

function cleanName(dirName: string): string {
  return dirName.replace(/[_-]/g, " ").replace(/\s+/g, " ").trim();
}

function extractTechStack(content: string): string[] {
  const found = new Set<string>();
  for (const [pattern, name] of TECH_PATTERNS) {
    if (pattern.test(content)) {
      found.add(name);
    }
  }
  return Array.from(found);
}

function extractDeploymentType(content: string): string[] {
  const found = new Set<string>();
  for (const [pattern, name] of DEPLOYMENT_PATTERNS) {
    if (pattern.test(content)) {
      found.add(name);
    }
  }
  return Array.from(found);
}

function extractGithubUrl(
  content: string,
  dirName: string
): string | undefined {
  // Find all GitHub URLs
  const allMatches = content.match(/https:\/\/github\.com\/[^\s)]+/g);
  if (!allMatches) return undefined;

  // Prefer URL that contains the directory name (case-insensitive)
  const dirLower = dirName.toLowerCase().replace(/[_\s-]/g, "");
  const specific = allMatches.find((url) => {
    const urlLower = url.toLowerCase().replace(/[_\s-]/g, "");
    return urlLower.includes(dirLower);
  });

  return specific ?? allMatches[0];
}

export async function discoverServices(): Promise<DiscoveredService[]> {
  const basePath = getProjectsBasePath();
  const entries = await readdir(basePath);
  const services: DiscoveredService[] = [];

  for (const entry of entries) {
    if (entry === "Service_Overview") continue;
    if (entry.startsWith(".")) continue;

    const dirPath = path.join(basePath, entry);

    try {
      const dirStat = await stat(dirPath);
      if (!dirStat.isDirectory()) continue;

      const claudeMdPath = path.join(dirPath, "CLAUDE.md");
      try {
        const content = await readFile(claudeMdPath, "utf-8");

        services.push({
          dirName: entry,
          name: cleanName(entry),
          techStack: extractTechStack(content),
          deploymentType: extractDeploymentType(content),
          github: extractGithubUrl(content, entry),
        });
      } catch {
        // No CLAUDE.md — skip this directory
      }
    } catch {
      // Not a directory or inaccessible — skip
    }
  }

  return services.sort((a, b) => a.name.localeCompare(b.name));
}
