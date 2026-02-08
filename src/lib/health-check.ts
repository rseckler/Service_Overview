import type {
  CheckConfig,
  CheckResult,
  HttpCheckConfig,
  LogFreshnessCheckConfig,
  Status,
  LogEntry,
} from "./types";
import { parseLogFile, getLogAge } from "./log-parser";

function formatAge(minutes: number): string {
  if (minutes < 60) return `vor ${minutes} Min`;
  const hours = Math.floor(minutes / 60);
  if (hours < 24) return `vor ${hours}h ${minutes % 60}min`;
  const days = Math.floor(hours / 24);
  return `vor ${days}d ${hours % 24}h`;
}

async function runHttpCheck(config: HttpCheckConfig): Promise<CheckResult> {
  const timeout = config.timeoutMs ?? 10000;
  const expectedStatus = config.expectedStatus ?? 200;
  const start = Date.now();

  try {
    const controller = new AbortController();
    const timer = setTimeout(() => controller.abort(), timeout);

    const response = await fetch(config.url, {
      signal: controller.signal,
      redirect: "follow",
    });
    clearTimeout(timer);

    const responseTime = Date.now() - start;

    if (response.status === expectedStatus) {
      if (responseTime > 3000) {
        return {
          name: config.name,
          status: "yellow",
          message: `OK, aber langsam (${responseTime}ms)`,
          responseTimeMs: responseTime,
        };
      }
      return {
        name: config.name,
        status: "green",
        message: `OK (${responseTime}ms)`,
        responseTimeMs: responseTime,
      };
    }

    if (response.status >= 300 && response.status < 400) {
      return {
        name: config.name,
        status: "yellow",
        message: `Redirect: ${response.status}`,
        responseTimeMs: responseTime,
      };
    }

    return {
      name: config.name,
      status: "red",
      message: `Status ${response.status}`,
      responseTimeMs: responseTime,
    };
  } catch (err) {
    const responseTime = Date.now() - start;
    const message =
      err instanceof Error && err.name === "AbortError"
        ? `Timeout nach ${timeout}ms`
        : `Nicht erreichbar`;

    return {
      name: config.name,
      status: "red",
      message,
      responseTimeMs: responseTime,
    };
  }
}

async function runLogFreshnessCheck(
  config: LogFreshnessCheckConfig
): Promise<{ result: CheckResult; errors: LogEntry[] }> {
  const ageMinutes = await getLogAge(config.logPath);

  if (ageMinutes === null) {
    return {
      result: {
        name: config.name,
        status: "gray",
        message: "Log-Datei nicht gefunden",
      },
      errors: [],
    };
  }

  const { entries, hasErrors, hasWarnings } = await parseLogFile(
    config.logPath
  );
  const ageStr = formatAge(ageMinutes);
  const maxAge = config.maxAgeMinutes;
  const warnAge = Math.round(maxAge * 1.5);

  let status: Status;
  let message: string;

  if (ageMinutes > warnAge) {
    status = "red";
    message = `Veraltet: Letztes Update ${ageStr}`;
  } else if (hasErrors) {
    status = "red";
    message = `Errors gefunden, letztes Update ${ageStr}`;
  } else if (ageMinutes > maxAge) {
    status = "yellow";
    message = `Leicht veraltet: ${ageStr}`;
  } else if (hasWarnings) {
    status = "yellow";
    message = `Warnings gefunden, letztes Update ${ageStr}`;
  } else {
    status = "green";
    message = `OK, letztes Update ${ageStr}`;
  }

  return { result: { name: config.name, status, message }, errors: entries };
}

export async function runCheck(
  config: CheckConfig
): Promise<{ result: CheckResult; errors: LogEntry[] }> {
  if (config.type === "http") {
    return { result: await runHttpCheck(config), errors: [] };
  }
  return runLogFreshnessCheck(config);
}

export function aggregateStatus(results: CheckResult[]): Status {
  if (results.length === 0) return "gray";

  let worst: Status = "green";
  for (const r of results) {
    if (r.status === "red") return "red";
    if (r.status === "yellow") worst = "yellow";
    if (r.status === "gray" && worst === "green") worst = "gray";
  }
  return worst;
}
