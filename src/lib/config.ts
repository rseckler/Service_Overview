import { readFile } from "fs/promises";
import path from "path";
import type { ServicesConfigFile, ServiceConfig } from "./types";

function resolveBasePaths(raw: string, basePath: string): string {
  return raw.replaceAll("{BASE}", basePath);
}

export async function loadServicesConfig(): Promise<ServicesConfigFile> {
  const configPath = path.join(process.cwd(), "services.config.json");
  const raw = await readFile(configPath, "utf-8");
  const resolved = resolveBasePaths(raw, getProjectsBasePath());
  return JSON.parse(resolved) as ServicesConfigFile;
}

export async function getServiceConfig(
  dirName: string
): Promise<ServiceConfig | null> {
  const config = await loadServicesConfig();
  return config.services[dirName] ?? null;
}

export function getProjectsBasePath(): string {
  return process.env.PROJECTS_BASE_PATH || path.join(process.cwd(), "..");
}
