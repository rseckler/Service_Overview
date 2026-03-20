import type { Status, LogEntry, LogFileSection } from "./types";

// ─── Config File Shape ───

export interface CronHost {
  displayName: string;
  hostname: string;
  sshAlias: string | null;
  type: "linux" | "macos";
}

export interface CronJobConfig {
  id: string;
  name: string;
  host: string;
  group: string;
  schedule: string;
  scheduleHuman: string;
  command: string;
  logPath: string | null;
  maxDurationMinutes: number;
  maxAgeMinutes: number;
  enabled: boolean;
  description: string;
  source?: "crontab" | "launchd";
  discovered?: boolean;
  removed?: boolean;
}

export interface CronJobsConfigFile {
  hosts: Record<string, CronHost>;
  jobs: CronJobConfig[];
}

// ─── API Response Shapes ───

export interface CronJobSummary {
  id: string;
  name: string;
  host: string;
  hostDisplayName: string;
  group: string;
  schedule: string;
  scheduleHuman: string;
  status: Status;
  enabled: boolean;
  lastRun: string | null;
  nextRun: string | null;
  statusMessage: string;
  errorCount: number;
  warningCount: number;
  description: string;
  discovered?: boolean;
  removed?: boolean;
}

export interface CronJobDetail extends CronJobSummary {
  command: string;
  logPath: string | null;
  maxDurationMinutes: number;
  maxAgeMinutes: number;
  errors: LogEntry[];
  logSections: LogFileSection[];
  config: CronJobConfig;
}

export interface CronJobsSummary {
  total: number;
  green: number;
  yellow: number;
  red: number;
  gray: number;
  disabled: number;
}

export interface CronJobsResponse {
  hosts: Record<string, CronHost>;
  jobs: CronJobSummary[];
  summary: CronJobsSummary;
}

// ─── Timeline ───

export interface TimeSlotJob {
  id: string;
  name: string;
  group: string;
  host: string;
  hostDisplayName: string;
  status: Status;
  minuteInHour: number;
  daysOfWeek: number[] | null;
  enabled: boolean;
}

export interface TimeSlot {
  hour: number;
  jobs: TimeSlotJob[];
}

export interface TimelineResponse {
  slots: TimeSlot[];
  jobs: CronJobSummary[];
}

// ─── Discovery ───

export interface DiscoveredCronJob {
  schedule: string;
  command: string;
  logPath: string | null;
  host: string;
  group: string;
  enabled: boolean;
  source: "crontab" | "launchd";
  raw: string;
}

export type GroupBy = "host" | "group";
export type ViewMode = "timeline" | "list";
