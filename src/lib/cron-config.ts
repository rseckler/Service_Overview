import { readFile } from "fs/promises";
import path from "path";
import type { CronJobsConfigFile } from "./cron-types";

function getProjectsBasePath(): string {
  return process.env.PROJECTS_BASE_PATH || path.resolve(process.cwd(), "..");
}

let configCache: { data: CronJobsConfigFile; loadedAt: number } | null = null;
const CACHE_TTL_MS = 30_000; // 30 seconds

export async function loadCronJobsConfig(): Promise<CronJobsConfigFile> {
  const now = Date.now();
  if (configCache && now - configCache.loadedAt < CACHE_TTL_MS) {
    return configCache.data;
  }

  const configPath = path.join(process.cwd(), "cron-jobs.config.json");
  const raw = await readFile(configPath, "utf-8");
  const basePath = getProjectsBasePath();
  const resolved = raw.replaceAll("{BASE}", basePath);
  const data = JSON.parse(resolved) as CronJobsConfigFile;

  configCache = { data, loadedAt: now };
  return data;
}

export function resolveLogPath(logPath: string | null): string | null {
  if (!logPath) return null;
  return logPath.replaceAll("{BASE}", getProjectsBasePath());
}
