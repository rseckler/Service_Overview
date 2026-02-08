export type Status = "green" | "yellow" | "red" | "gray";

export type ServiceType = "web" | "cronjob" | "docker" | "unknown";

export type CheckType = "http" | "log-freshness";

export interface HttpCheckConfig {
  name: string;
  type: "http";
  url: string;
  expectedStatus?: number;
  timeoutMs?: number;
}

export interface LogFreshnessCheckConfig {
  name: string;
  type: "log-freshness";
  logPath: string;
  maxAgeMinutes: number;
}

export type CheckConfig = HttpCheckConfig | LogFreshnessCheckConfig;

export interface ServiceConfig {
  displayName: string;
  description: string;
  type: ServiceType;
  checks: CheckConfig[];
}

export interface ServicesConfigFile {
  services: Record<string, ServiceConfig>;
}

export interface CheckResult {
  name: string;
  status: Status;
  message: string;
  responseTimeMs?: number;
}

export interface LogEntry {
  timestamp: string;
  level: "error" | "warning" | "info";
  message: string;
}

export interface LogLine {
  lineNumber: number;
  level: "error" | "warning" | "info";
  text: string;
}

export interface LogFileSection {
  fileName: string;
  lines: LogLine[];
}

export interface DiscoveredService {
  dirName: string;
  name: string;
  techStack: string[];
  deploymentType: string[];
  github?: string;
}

export interface ServiceSummary {
  slug: string;
  name: string;
  description: string;
  type: ServiceType;
  techStack: string[];
  deploymentType: string[];
  status: Status;
  checks: CheckResult[];
  github?: string;
  lastChecked: string;
}

export interface ServiceDetail extends ServiceSummary {
  errors: LogEntry[];
  recentLogs: string;
  logSections: LogFileSection[];
  config: ServiceConfig | null;
}
