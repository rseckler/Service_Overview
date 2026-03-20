"use client";

import { useEffect, useState, useCallback } from "react";
import Link from "next/link";
import type { CronJobDetail } from "@/lib/cron-types";
import type { Status } from "@/lib/types";
import { StatusIndicator } from "../status-indicator";
import { ErrorList } from "../error-list";
import { LogViewer } from "../log-viewer";
import { HostBadge, GroupBadge, DiscoveredBadge } from "./cron-status-badge";

interface CronJobDetailViewProps {
  id: string;
}

function formatRelativeTime(iso: string | null): string {
  if (!iso) return "–";
  const diff = Date.now() - new Date(iso).getTime();
  const min = Math.round(diff / 60000);
  if (min < 0) {
    const absMin = Math.abs(min);
    if (absMin < 60) return `in ${absMin} Min`;
    const h = Math.floor(absMin / 60);
    return h < 24 ? `in ${h}h ${absMin % 60}min` : `in ${Math.floor(h / 24)}d`;
  }
  if (min < 60) return `vor ${min} Min`;
  const h = Math.floor(min / 60);
  return h < 24 ? `vor ${h}h ${min % 60}min` : `vor ${Math.floor(h / 24)}d`;
}

function formatDateTime(iso: string | null): string {
  if (!iso) return "–";
  return new Date(iso).toLocaleString("de-DE", {
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
    hour: "2-digit",
    minute: "2-digit",
    second: "2-digit",
  });
}

const STATUS_COLOR: Record<Status, string> = {
  green: "text-green-400",
  yellow: "text-yellow-400",
  red: "text-red-400",
  gray: "text-zinc-500",
};

export function CronJobDetailView({ id }: CronJobDetailViewProps) {
  const [job, setJob] = useState<CronJobDetail | null>(null);
  const [loading, setLoading] = useState(true);
  const [running, setRunning] = useState(false);
  const [runResult, setRunResult] = useState<{ success: boolean; message: string } | null>(null);

  const fetchDetail = useCallback(async () => {
    try {
      const res = await fetch(`/api/cron-jobs/${id}`);
      const data = await res.json();
      setJob(data.job ?? null);
    } catch (err) {
      console.error("Failed to fetch cron job:", err);
    } finally {
      setLoading(false);
    }
  }, [id]);

  useEffect(() => {
    fetchDetail();
    const interval = setInterval(fetchDetail, 60_000);
    return () => clearInterval(interval);
  }, [fetchDetail]);

  const handleRun = useCallback(async () => {
    setRunning(true);
    setRunResult(null);
    try {
      const res = await fetch(`/api/cron-jobs/${id}/run`, { method: "POST" });
      const data = await res.json();
      setRunResult({
        success: data.success,
        message: data.success
          ? `Erfolgreich in ${Math.round(data.durationMs / 1000)}s`
          : data.stderr || data.error || "Fehlgeschlagen",
      });
      // Refresh data
      setTimeout(() => fetchDetail(), 2000);
    } catch {
      setRunResult({ success: false, message: "Verbindungsfehler" });
    } finally {
      setRunning(false);
    }
  }, [id, fetchDetail]);

  if (loading) {
    return (
      <div className="flex min-h-screen items-center justify-center">
        <div className="text-zinc-500">Lade Job-Details...</div>
      </div>
    );
  }

  if (!job) {
    return (
      <div className="flex min-h-screen items-center justify-center">
        <div className="text-zinc-500">Cron Job nicht gefunden.</div>
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-5xl px-6 py-6">
      {/* Back Link */}
      <Link
        href="/cron-jobs"
        className="mb-6 inline-flex items-center gap-1 text-sm text-zinc-500 hover:text-zinc-300 transition-colors"
      >
        <svg className="w-4 h-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
          <path d="M15 18l-6-6 6-6" />
        </svg>
        Zurück zu Cron Jobs
      </Link>

      {/* Header */}
      <div className="flex items-start gap-4 mb-6">
        <StatusIndicator status={job.status} size="lg" />
        <div className="flex-1 min-w-0">
          <h1 className="text-xl font-bold tracking-tight flex items-center gap-3">
            {job.name}
            {job.discovered && <DiscoveredBadge />}
          </h1>
          <p className="mt-1 text-sm text-zinc-400">{job.description}</p>
        </div>
        <div className="flex items-center gap-2">
          <HostBadge host={job.host} />
          <GroupBadge group={job.group} />
          <span className={`inline-flex items-center rounded px-2 py-0.5 text-xs font-medium border ${
            job.enabled
              ? "bg-green-500/10 text-green-400 border-green-500/20"
              : "bg-zinc-800 text-zinc-500 border-zinc-700"
          }`}>
            {job.enabled ? "Aktiv" : "Deaktiviert"}
          </span>
        </div>
      </div>

      {/* Run Button + Result */}
      <div className="mb-6 flex items-center gap-3">
        <button
          onClick={handleRun}
          disabled={running || !job.enabled}
          className="inline-flex items-center gap-2 rounded-md bg-zinc-800 px-4 py-2 text-sm font-medium text-zinc-300 border border-zinc-700 hover:bg-zinc-700 hover:text-zinc-100 transition-colors disabled:opacity-40 disabled:cursor-not-allowed"
        >
          {running ? (
            <>
              <svg className="w-4 h-4 animate-spin" viewBox="0 0 24 24" fill="none">
                <circle cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="2" opacity="0.3" />
                <path d="M12 2a10 10 0 0 1 10 10" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
              </svg>
              Läuft...
            </>
          ) : (
            <>
              <svg className="w-4 h-4" viewBox="0 0 24 24" fill="currentColor">
                <path d="M8 5v14l11-7z" />
              </svg>
              Jetzt starten
            </>
          )}
        </button>
        {runResult && (
          <span className={`text-sm ${runResult.success ? "text-green-400" : "text-red-400"}`}>
            {runResult.message}
          </span>
        )}
      </div>

      {/* Info Grid */}
      <div className="rounded-xl border border-zinc-800 bg-zinc-900/50 overflow-hidden mb-6">
        <div className="grid grid-cols-2 md:grid-cols-3 gap-px bg-zinc-800">
          <InfoCell label="Schedule" value={job.scheduleHuman} sub={job.schedule} />
          <InfoCell
            label="Letzter Lauf"
            value={formatRelativeTime(job.lastRun)}
            sub={formatDateTime(job.lastRun)}
            valueClass={STATUS_COLOR[job.status]}
          />
          <InfoCell
            label="Nächster Lauf"
            value={formatRelativeTime(job.nextRun)}
            sub={formatDateTime(job.nextRun)}
          />
          <InfoCell label="Max. Laufzeit" value={`${job.maxDurationMinutes} Min`} />
          <InfoCell
            label="Status"
            value={job.statusMessage}
            valueClass={STATUS_COLOR[job.status]}
          />
          <InfoCell
            label="Fehler (Log)"
            value={`${job.errorCount} Errors / ${job.errors.filter((e) => e.level === "warning").length} Warnings`}
          />
        </div>

        {/* Command */}
        <div className="border-t border-zinc-800 px-5 py-3 bg-black/30">
          <div className="text-[11px] font-medium text-zinc-500 uppercase tracking-wider mb-1">Command</div>
          <pre className="text-xs text-zinc-400 font-mono overflow-x-auto whitespace-pre">{job.command}</pre>
        </div>
      </div>

      {/* Errors & Warnings */}
      {job.errors.length > 0 && (
        <div className="mb-6">
          <h2 className="text-sm font-semibold text-zinc-200 mb-3 flex items-center gap-2">
            Errors & Warnings
            {job.errorCount > 0 && (
              <span className="px-1.5 py-0.5 rounded-full text-[11px] font-semibold bg-red-500/10 text-red-400">
                {job.errorCount}
              </span>
            )}
          </h2>
          <ErrorList entries={job.errors} />
        </div>
      )}

      {/* Log Viewer */}
      {job.logSections.length > 0 && job.logSections[0].lines.length > 0 && (
        <div className="mb-6">
          <h2 className="text-sm font-semibold text-zinc-200 mb-3">
            Letzte Log-Einträge
          </h2>
          <LogViewer sections={job.logSections} />
        </div>
      )}
    </div>
  );
}

function InfoCell({
  label,
  value,
  sub,
  valueClass = "text-zinc-200",
}: {
  label: string;
  value: string;
  sub?: string;
  valueClass?: string;
}) {
  return (
    <div className="bg-zinc-900/50 px-5 py-4">
      <div className="text-[11px] font-medium text-zinc-500 uppercase tracking-wider mb-1">
        {label}
      </div>
      <div className={`text-sm font-medium ${valueClass}`}>{value}</div>
      {sub && <div className="text-xs text-zinc-500 font-mono mt-0.5">{sub}</div>}
    </div>
  );
}
