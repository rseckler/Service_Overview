"use client";

import { useMemo, useState } from "react";
import Link from "next/link";
import type { CronJobSummary } from "@/lib/cron-types";
import type { Status } from "@/lib/types";
import { HostBadge, DiscoveredBadge } from "./cron-status-badge";

interface CronListProps {
  jobs: CronJobSummary[];
  groupBy: "host" | "group";
  onRunJob: (jobId: string) => void;
  runningJobs: Set<string>;
}

const STATUS_DOT: Record<Status, string> = {
  green: "bg-green-500 shadow-[0_0_6px_rgba(34,197,94,0.5)]",
  yellow: "bg-yellow-500 shadow-[0_0_6px_rgba(234,179,8,0.5)] animate-pulse-glow",
  red: "bg-red-500 shadow-[0_0_6px_rgba(239,68,68,0.5)] animate-pulse-glow",
  gray: "bg-zinc-500",
};

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

function groupJobs(
  jobs: CronJobSummary[],
  groupBy: "host" | "group"
): { key: string; label: string; hostKey?: string; jobs: CronJobSummary[] }[] {
  const map = new Map<string, CronJobSummary[]>();
  for (const job of jobs) {
    const key = groupBy === "host" ? job.host : job.group;
    if (!map.has(key)) map.set(key, []);
    map.get(key)!.push(job);
  }
  return [...map.entries()].map(([key, groupJobs]) => ({
    key,
    label: groupBy === "host" ? groupJobs[0].hostDisplayName : key,
    hostKey: groupBy === "host" ? key : undefined,
    jobs: groupJobs,
  }));
}

export function CronList({ jobs, groupBy, onRunJob, runningJobs }: CronListProps) {
  const groups = useMemo(() => groupJobs(jobs, groupBy), [jobs, groupBy]);

  return (
    <div className="space-y-4">
      {groups.map((group) => {
        const healthyCount = group.jobs.filter((j) => j.status === "green").length;

        return (
          <div key={group.key} className="rounded-xl border border-zinc-800 bg-zinc-900/50 overflow-hidden">
            {/* Group Header */}
            <div className="px-5 py-3 bg-zinc-800/15 border-b border-zinc-800 flex items-center justify-between">
              <div className="flex items-center gap-2 text-sm font-semibold text-zinc-400">
                {group.hostKey && <HostBadge host={group.hostKey} />}
                {group.label}
              </div>
              <span className="text-xs text-zinc-500">
                {healthyCount}/{group.jobs.length} healthy
              </span>
            </div>

            {/* Job Rows */}
            {group.jobs.map((job) => (
              <div
                key={job.id}
                className="border-b border-zinc-800/30 last:border-b-0 hover:bg-zinc-800/10 transition-colors"
              >
                <div className="grid grid-cols-[28px_1fr_160px_160px_100px_40px] gap-3 items-center px-5 py-2.5">
                  {/* Status */}
                  <span className={`w-2.5 h-2.5 rounded-full justify-self-center ${STATUS_DOT[job.status]}`} />

                  {/* Name & Description */}
                  <Link href={`/cron-jobs/${job.id}`} className="min-w-0">
                    <div className="text-[13px] font-medium text-zinc-200 flex items-center gap-2">
                      {job.name}
                      {job.discovered && <DiscoveredBadge />}
                    </div>
                    <div className="text-[11px] text-zinc-500 truncate">{job.description}</div>
                  </Link>

                  {/* Schedule */}
                  <div className="text-xs text-zinc-400 font-mono">
                    {job.scheduleHuman}
                  </div>

                  {/* Last / Next Run */}
                  <div className="text-xs text-zinc-500">
                    <div>
                      Letzter: <span className="text-zinc-400 font-medium">{formatRelativeTime(job.lastRun)}</span>
                    </div>
                    <div>
                      Nächster: <span className="text-zinc-400 font-medium">{formatRelativeTime(job.nextRun)}</span>
                    </div>
                  </div>

                  {/* Error Count */}
                  <div className="text-xs text-right">
                    {job.errorCount > 0 ? (
                      <span className="text-red-400">{job.errorCount} Errors</span>
                    ) : job.warningCount > 0 ? (
                      <span className="text-yellow-400">{job.warningCount} Warns</span>
                    ) : (
                      <span className="text-green-400">OK</span>
                    )}
                  </div>

                  {/* Run Button */}
                  <button
                    onClick={(e) => {
                      e.preventDefault();
                      onRunJob(job.id);
                    }}
                    disabled={runningJobs.has(job.id) || !job.enabled}
                    className="p-1.5 rounded-md text-zinc-500 hover:text-zinc-300 hover:bg-zinc-800 transition-colors disabled:opacity-30 disabled:cursor-not-allowed"
                    title="Jetzt starten"
                  >
                    {runningJobs.has(job.id) ? (
                      <svg className="w-4 h-4 animate-spin" viewBox="0 0 24 24" fill="none">
                        <circle cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="2" opacity="0.3" />
                        <path d="M12 2a10 10 0 0 1 10 10" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
                      </svg>
                    ) : (
                      <svg className="w-4 h-4" viewBox="0 0 24 24" fill="currentColor">
                        <path d="M8 5v14l11-7z" />
                      </svg>
                    )}
                  </button>
                </div>
              </div>
            ))}
          </div>
        );
      })}
    </div>
  );
}
