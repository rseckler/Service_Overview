import { readFile, stat } from "fs/promises";
import path from "path";
import type { LogEntry, LogLine, LogFileSection } from "./types";

// Patterns that are downgraded from error to warning (expected/non-critical)
const DOWNGRADE_TO_WARNING_PATTERNS = [
  /HTTP Error 404:.*Quote not found for symbol/,
];

const ERROR_PATTERNS = [
  /\bERROR\b/i,
  /\bException\b/,
  /\bTraceback\b/,
  /\bFAILED\b/i,
  /\bCritical\b/i,
];

const WARNING_PATTERNS = [/\bWARNING\b/i, /\bWARN\b/i, /\bretry\b/i];

const TIMESTAMP_PATTERN =
  /(\d{4}-\d{2}-\d{2}[\sT]\d{2}:\d{2}:\d{2})/;

function getLastNLines(content: string, n: number): string[] {
  const lines = content.split("\n").filter((l) => l.trim().length > 0);
  return lines.slice(-n);
}

function classifyLine(
  line: string
): "error" | "warning" | "info" {
  // Check downgrade patterns first — known non-critical errors become warnings
  for (const pattern of DOWNGRADE_TO_WARNING_PATTERNS) {
    if (pattern.test(line)) return "warning";
  }
  for (const pattern of ERROR_PATTERNS) {
    if (pattern.test(line)) return "error";
  }
  for (const pattern of WARNING_PATTERNS) {
    if (pattern.test(line)) return "warning";
  }
  return "info";
}

function extractTimestamp(line: string): string {
  const match = line.match(TIMESTAMP_PATTERN);
  return match ? match[1] : "";
}

export async function parseLogFile(
  logPath: string,
  lineCount: number = 20
): Promise<{ entries: LogEntry[]; hasErrors: boolean; hasWarnings: boolean }> {
  try {
    const content = await readFile(logPath, "utf-8");
    const lines = getLastNLines(content, lineCount);

    let hasErrors = false;
    let hasWarnings = false;
    const entries: LogEntry[] = [];

    for (const line of lines) {
      const level = classifyLine(line);
      if (level === "error") hasErrors = true;
      if (level === "warning") hasWarnings = true;

      if (level !== "info") {
        entries.push({
          timestamp: extractTimestamp(line),
          level,
          message: line.trim(),
        });
      }
    }

    return { entries, hasErrors, hasWarnings };
  } catch {
    return { entries: [], hasErrors: false, hasWarnings: false };
  }
}

export async function getRecentLogs(
  logPath: string,
  lineCount: number = 50
): Promise<string> {
  try {
    const content = await readFile(logPath, "utf-8");
    const lines = getLastNLines(content, lineCount);
    return lines.join("\n");
  } catch {
    return "Log-Datei nicht erreichbar.";
  }
}

export async function getStructuredLogs(
  logPath: string,
  lineCount: number = 50
): Promise<LogFileSection> {
  const fileName = path.basename(logPath);
  try {
    const content = await readFile(logPath, "utf-8");
    const allLines = content.split("\n");
    const total = allLines.length;
    const startIdx = Math.max(0, total - lineCount);
    const slice = allLines.slice(startIdx);

    const lines: LogLine[] = slice.map((text, i) => ({
      lineNumber: startIdx + i + 1,
      level: classifyLine(text),
      text: text,
    }));

    return { fileName, lines };
  } catch {
    return { fileName, lines: [] };
  }
}

export async function getLogAge(logPath: string): Promise<number | null> {
  try {
    const fileStat = await stat(logPath);
    const ageMs = Date.now() - fileStat.mtime.getTime();
    return Math.round(ageMs / 60000); // minutes
  } catch {
    return null;
  }
}
