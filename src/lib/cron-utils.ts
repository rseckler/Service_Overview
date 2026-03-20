/**
 * Lightweight cron expression parser for the subset of patterns used in this project.
 * Supports: specific values, ranges (7-23), intervals (asterisk/2), weekdays (0-6), wildcards.
 * Does NOT support: L, W, #, yearly/monthly specials.
 */

interface CronFields {
  minutes: number[];
  hours: number[];
  daysOfMonth: number[];
  months: number[];
  daysOfWeek: number[];
}

function expandField(field: string, min: number, max: number): number[] {
  const results = new Set<number>();

  for (const part of field.split(",")) {
    // */N interval
    const intervalMatch = part.match(/^\*\/(\d+)$/);
    if (intervalMatch) {
      const step = parseInt(intervalMatch[1], 10);
      for (let i = min; i <= max; i += step) results.add(i);
      continue;
    }

    // wildcard
    if (part === "*") {
      for (let i = min; i <= max; i++) results.add(i);
      continue;
    }

    // N-M range
    const rangeMatch = part.match(/^(\d+)-(\d+)$/);
    if (rangeMatch) {
      const start = parseInt(rangeMatch[1], 10);
      const end = parseInt(rangeMatch[2], 10);
      for (let i = start; i <= end; i++) results.add(i);
      continue;
    }

    // N-M/S range with step
    const rangeStepMatch = part.match(/^(\d+)-(\d+)\/(\d+)$/);
    if (rangeStepMatch) {
      const start = parseInt(rangeStepMatch[1], 10);
      const end = parseInt(rangeStepMatch[2], 10);
      const step = parseInt(rangeStepMatch[3], 10);
      for (let i = start; i <= end; i += step) results.add(i);
      continue;
    }

    // specific number
    const num = parseInt(part, 10);
    if (!isNaN(num)) {
      results.add(num);
    }
  }

  return [...results].sort((a, b) => a - b);
}

export function parseCron(expr: string): CronFields {
  const parts = expr.trim().split(/\s+/);
  if (parts.length !== 5) {
    throw new Error(`Invalid cron expression: "${expr}" (expected 5 fields)`);
  }

  return {
    minutes: expandField(parts[0], 0, 59),
    hours: expandField(parts[1], 0, 23),
    daysOfMonth: expandField(parts[2], 1, 31),
    months: expandField(parts[3], 1, 12),
    daysOfWeek: expandField(parts[4], 0, 6),
  };
}

/** Get all hours this cron job runs on (for timeline rendering). */
export function getRunHours(cronExpr: string): number[] {
  const fields = parseCron(cronExpr);
  return fields.hours;
}

/** Get minutes within hour at which the job runs. */
export function getRunMinutes(cronExpr: string): number[] {
  const fields = parseCron(cronExpr);
  return fields.minutes;
}

/** Get days of week this job runs on. Returns null if all days. */
export function getRunDays(cronExpr: string): number[] | null {
  const fields = parseCron(cronExpr);
  if (fields.daysOfWeek.length === 7) return null;
  return fields.daysOfWeek;
}

/** Check if a cron job runs on a given day of week (0=Sun). */
export function runsOnDay(cronExpr: string, dayOfWeek: number): boolean {
  const days = getRunDays(cronExpr);
  return days === null || days.includes(dayOfWeek);
}

/** Calculate total runs per day for this cron expression. */
export function runsPerDay(cronExpr: string): number {
  const fields = parseCron(cronExpr);
  return fields.minutes.length * fields.hours.length;
}

/**
 * Get the next run time after `from` (default: now).
 * Simple forward-search approach — sufficient for our use case.
 */
export function getNextRun(cronExpr: string, from?: Date): Date {
  const fields = parseCron(cronExpr);
  const date = from ? new Date(from) : new Date();

  // Start from next minute
  date.setSeconds(0, 0);
  date.setMinutes(date.getMinutes() + 1);

  // Search up to 400 days ahead (covers weekly + monthly edge cases)
  const maxIterations = 400 * 24 * 60;
  for (let i = 0; i < maxIterations; i++) {
    const month = date.getMonth() + 1;
    const dom = date.getDate();
    const dow = date.getDay();
    const hour = date.getHours();
    const minute = date.getMinutes();

    if (
      fields.months.includes(month) &&
      fields.daysOfMonth.includes(dom) &&
      fields.daysOfWeek.includes(dow) &&
      fields.hours.includes(hour) &&
      fields.minutes.includes(minute)
    ) {
      return date;
    }

    date.setMinutes(date.getMinutes() + 1);
  }

  // Fallback: return far future
  return new Date(Date.now() + 365 * 24 * 60 * 60 * 1000);
}

/**
 * Get the most recent run time before `from` (default: now).
 */
export function getLastScheduledRun(cronExpr: string, from?: Date): Date {
  const fields = parseCron(cronExpr);
  const date = from ? new Date(from) : new Date();

  date.setSeconds(0, 0);

  // Search up to 8 days back
  const maxIterations = 8 * 24 * 60;
  for (let i = 0; i < maxIterations; i++) {
    const month = date.getMonth() + 1;
    const dom = date.getDate();
    const dow = date.getDay();
    const hour = date.getHours();
    const minute = date.getMinutes();

    if (
      fields.months.includes(month) &&
      fields.daysOfMonth.includes(dom) &&
      fields.daysOfWeek.includes(dow) &&
      fields.hours.includes(hour) &&
      fields.minutes.includes(minute)
    ) {
      return date;
    }

    date.setMinutes(date.getMinutes() - 1);
  }

  return new Date(0);
}

/**
 * Calculate the interval between runs in minutes (approximate).
 * Used for auto-calculating maxAgeMinutes for discovered jobs.
 */
export function getIntervalMinutes(cronExpr: string): number {
  const rpd = runsPerDay(cronExpr);
  if (rpd <= 0) return 1440; // daily fallback
  return Math.round(1440 / rpd);
}
