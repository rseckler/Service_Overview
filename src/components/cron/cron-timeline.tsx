"use client";

import { useMemo } from "react";
import Link from "next/link";
import type { CronJobSummary } from "@/lib/cron-types";
import type { Status } from "@/lib/types";
import { HostBadge } from "./cron-status-badge";

interface CronTimelineProps {
  jobs: CronJobSummary[];
  groupBy: "host" | "group";
  selectedDay: number; // 0=Sun, 1=Mon, ...
  timelineData: Record<string, number[]>; // jobId -> hours[]
}

const STATUS_DOT: Record<Status, string> = {
  green: "bg-green-500 shadow-[0_0_6px_rgba(34,197,94,0.5)]",
  yellow: "bg-yellow-500 shadow-[0_0_6px_rgba(234,179,8,0.5)] animate-pulse-glow",
  red: "bg-red-500 shadow-[0_0_6px_rgba(239,68,68,0.5)] animate-pulse-glow",
  gray: "bg-zinc-500",
};

const BAR_COLORS: Record<Status, string> = {
  green: "bg-green-500/15 border-green-500/30",
  yellow: "bg-yellow-500/15 border-yellow-500/30",
  red: "bg-red-500/15 border-red-500/30",
  gray: "bg-zinc-500/10 border-zinc-500/20",
};

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

export function CronTimeline({ jobs, groupBy, selectedDay, timelineData }: CronTimelineProps) {
  const currentHour = new Date().getHours();
  const currentMinute = new Date().getMinutes();
  const nowPosition = ((currentHour + currentMinute / 60) / 24) * 100;

  const hours = Array.from({ length: 24 }, (_, i) => i);
  const groups = useMemo(() => groupJobs(jobs, groupBy), [jobs, groupBy]);

  return (
    <div className="overflow-x-auto rounded-xl border border-zinc-800 bg-zinc-900/50">
      <div className="min-w-[1100px] relative">
        {/* Now Line */}
        <div
          className="absolute top-0 bottom-0 w-0.5 bg-blue-500 z-20 pointer-events-none shadow-[0_0_8px_rgba(59,130,246,0.4)]"
          style={{ left: `calc(200px + (100% - 200px) * ${nowPosition / 100})` }}
        >
          <div className="absolute -top-0.5 -left-1 w-2.5 h-2.5 rounded-full bg-blue-500 shadow-[0_0_8px_rgba(59,130,246,0.6)]" />
        </div>

        {/* Hour Header */}
        <div className="grid border-b border-zinc-800 sticky top-0 bg-zinc-900/95 z-10 backdrop-blur" style={{ gridTemplateColumns: "200px repeat(24, 1fr)" }}>
          <div className="px-3 py-2 text-[11px] font-medium text-zinc-500 uppercase tracking-wider border-r border-zinc-800 flex items-center">
            Job / Stunde
          </div>
          {hours.map((h) => (
            <div
              key={h}
              className={`py-2 text-[11px] font-medium text-center border-r border-zinc-800/50 tabular-nums ${
                h === currentHour ? "text-blue-400 font-semibold" : "text-zinc-500"
              }`}
            >
              {String(h).padStart(2, "0")}
            </div>
          ))}
        </div>

        {/* Groups */}
        {groups.map((group) => (
          <div key={group.key} className="border-b border-zinc-800 last:border-b-0">
            {/* Group Header */}
            <div className="grid bg-zinc-800/15 border-b border-zinc-800/50" style={{ gridTemplateColumns: "200px 1fr" }}>
              <div className="px-3 py-1.5 text-xs font-semibold text-zinc-400 border-r border-zinc-800 flex items-center gap-2">
                {group.hostKey && <HostBadge host={group.hostKey} />}
                {group.label}
                <span className="ml-auto text-[11px] font-normal text-zinc-500">
                  {group.jobs.length} Jobs
                </span>
              </div>
              <div />
            </div>

            {/* Job Rows */}
            {group.jobs.map((job) => {
              const jobHours = timelineData[job.id] ?? [];

              return (
                <Link
                  key={job.id}
                  href={`/cron-jobs/${job.id}`}
                  className="grid min-h-[36px] items-center border-b border-zinc-800/30 last:border-b-0 transition-colors hover:bg-zinc-800/10 cursor-pointer"
                  style={{ gridTemplateColumns: "200px repeat(24, 1fr)" }}
                >
                  {/* Job Name */}
                  <div className="px-3 py-1 pl-8 text-[13px] text-zinc-400 border-r border-zinc-800 flex items-center gap-2 whitespace-nowrap overflow-hidden">
                    <span className={`w-2 h-2 rounded-full flex-shrink-0 ${STATUS_DOT[job.status]}`} />
                    <span className="truncate">{job.name}</span>
                  </div>

                  {/* Hour Cells */}
                  {hours.map((h) => {
                    const hasJob = jobHours.includes(h);
                    return (
                      <div
                        key={h}
                        className="h-full border-r border-zinc-800/30 flex items-center justify-center"
                      >
                        {hasJob && (
                          <div
                            className={`w-[80%] h-5 rounded border ${BAR_COLORS[job.status]} transition-transform hover:scale-y-130`}
                          />
                        )}
                      </div>
                    );
                  })}
                </Link>
              );
            })}
          </div>
        ))}
      </div>
    </div>
  );
}
