import type { Status, LogEntry, LogFileSection } from "./types";
import type { CronJobConfig, CronJobSummary, CronJobDetail } from "./cron-types";
import { parseLogFile, getLogAge, getStructuredLogs } from "./log-parser";
import { getNextRun, getLastScheduledRun } from "./cron-utils";

function formatAge(minutes: number): string {
  if (minutes < 60) return `vor ${minutes} Min`;
  const hours = Math.floor(minutes / 60);
  if (hours < 24) return `vor ${hours}h ${minutes % 60}min`;
  const days = Math.floor(hours / 24);
  return `vor ${days}d ${hours % 24}h`;
}

function formatRelative(date: Date): string {
  const diffMs = date.getTime() - Date.now();
  const diffMin = Math.round(diffMs / 60000);

  if (diffMin < 0) {
    return formatAge(Math.abs(diffMin));
  }
  if (diffMin < 60) return `in ${diffMin} Min`;
  const hours = Math.floor(diffMin / 60);
  if (hours < 24) return `in ${hours}h ${diffMin % 60}min`;
  const days = Math.floor(hours / 24);
  return `in ${days}d ${hours % 24}h`;
}

export async function checkCronJob(
  job: CronJobConfig,
  hostDisplayName: string
): Promise<CronJobSummary> {
  const base: Omit<CronJobSummary, "status" | "statusMessage" | "errorCount" | "warningCount" | "lastRun" | "nextRun"> = {
    id: job.id,
    name: job.name,
    host: job.host,
    hostDisplayName,
    group: job.group,
    schedule: job.schedule,
    scheduleHuman: job.scheduleHuman,
    enabled: job.enabled,
    description: job.description,
    discovered: job.discovered,
    removed: job.removed,
  };

  // Disabled jobs
  if (!job.enabled) {
    return {
      ...base,
      status: "gray",
      statusMessage: "Deaktiviert",
      errorCount: 0,
      warningCount: 0,
      lastRun: null,
      nextRun: null,
    };
  }

  // Compute next run
  const nextRunDate = getNextRun(job.schedule);
  const nextRun = nextRunDate.toISOString();

  // No log path — can only show schedule, no health data
  if (!job.logPath) {
    const lastScheduled = getLastScheduledRun(job.schedule);
    return {
      ...base,
      status: "gray",
      statusMessage: "Kein Log-Pfad konfiguriert",
      errorCount: 0,
      warningCount: 0,
      lastRun: lastScheduled.toISOString(),
      nextRun,
    };
  }

  // Check log freshness
  const ageMinutes = await getLogAge(job.logPath);

  if (ageMinutes === null) {
    return {
      ...base,
      status: "gray",
      statusMessage: "Log-Datei nicht gefunden",
      errorCount: 0,
      warningCount: 0,
      lastRun: null,
      nextRun,
    };
  }

  // Parse log for errors
  const { entries, hasErrors, hasWarnings } = await parseLogFile(job.logPath, 50);
  const errorCount = entries.filter((e) => e.level === "error").length;
  const warningCount = entries.filter((e) => e.level === "warning").length;

  // Last run from log mtime
  const lastRunDate = new Date(Date.now() - ageMinutes * 60000);
  const lastRun = lastRunDate.toISOString();
  const ageStr = formatAge(ageMinutes);

  const maxAge = job.maxAgeMinutes;
  const warnAge = Math.round(maxAge * 1.5);

  let status: Status;
  let statusMessage: string;

  if (ageMinutes > warnAge) {
    status = "red";
    statusMessage = `Veraltet: Letztes Update ${ageStr}`;
  } else if (hasErrors) {
    status = "red";
    statusMessage = `${errorCount} Error${errorCount !== 1 ? "s" : ""}, letztes Update ${ageStr}`;
  } else if (ageMinutes > maxAge) {
    status = "yellow";
    statusMessage = `Leicht veraltet: ${ageStr}`;
  } else if (hasWarnings) {
    status = "yellow";
    statusMessage = `${warningCount} Warning${warningCount !== 1 ? "s" : ""}, letztes Update ${ageStr}`;
  } else {
    status = "green";
    statusMessage = `OK, letztes Update ${ageStr}`;
  }

  return {
    ...base,
    status,
    statusMessage,
    errorCount,
    warningCount,
    lastRun,
    nextRun,
  };
}

export async function getCronJobDetail(
  job: CronJobConfig,
  hostDisplayName: string
): Promise<CronJobDetail> {
  const summary = await checkCronJob(job, hostDisplayName);

  let errors: LogEntry[] = [];
  let logSections: LogFileSection[] = [];

  if (job.logPath) {
    const { entries } = await parseLogFile(job.logPath, 50);
    errors = entries;
    const section = await getStructuredLogs(job.logPath, 50);
    logSections = [section];
  }

  return {
    ...summary,
    command: job.command,
    logPath: job.logPath,
    maxDurationMinutes: job.maxDurationMinutes,
    maxAgeMinutes: job.maxAgeMinutes,
    errors,
    logSections,
    config: job,
  };
}
