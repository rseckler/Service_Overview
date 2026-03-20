"use client";

import { useEffect, useState, useCallback } from "react";
import type { CronJobSummary, CronJobsResponse, GroupBy, ViewMode } from "@/lib/cron-types";
import type { Status } from "@/lib/types";
import { Header } from "../header";
import { CronTimeline } from "./cron-timeline";
import { CronList } from "./cron-list";

const DAYS = ["So", "Mo", "Di", "Mi", "Do", "Fr", "Sa"];

export function CronDashboard() {
  const [jobs, setJobs] = useState<CronJobSummary[]>([]);
  const [loading, setLoading] = useState(true);
  const [lastChecked, setLastChecked] = useState("");
  const [viewMode, setViewMode] = useState<ViewMode>("timeline");
  const [groupBy, setGroupBy] = useState<GroupBy>("host");
  const [selectedDay, setSelectedDay] = useState(new Date().getDay());
  const [runningJobs, setRunningJobs] = useState<Set<string>>(new Set());
  const [timelineData, setTimelineData] = useState<Record<string, number[]>>({});

  const fetchJobs = useCallback(async () => {
    try {
      const [jobsRes, timelineRes] = await Promise.all([
        fetch("/api/cron-jobs"),
        fetch("/api/cron-jobs/timeline"),
      ]);
      const jobsData: CronJobsResponse = await jobsRes.json();
      const timelineRaw = await timelineRes.json();

      setJobs(jobsData.jobs ?? []);

      // Build timeline lookup: jobId -> hours[]
      const lookup: Record<string, number[]> = {};
      for (const slot of timelineRaw.slots ?? []) {
        for (const sj of slot.jobs) {
          if (!lookup[sj.id]) lookup[sj.id] = [];
          if (!lookup[sj.id].includes(slot.hour)) {
            lookup[sj.id].push(slot.hour);
          }
        }
      }
      setTimelineData(lookup);
      setLastChecked(new Date().toISOString());
    } catch (err) {
      console.error("Failed to fetch cron jobs:", err);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchJobs();
    const interval = setInterval(fetchJobs, 60_000);
    return () => clearInterval(interval);
  }, [fetchJobs]);

  const handleRunJob = useCallback(async (jobId: string) => {
    setRunningJobs((prev) => new Set(prev).add(jobId));
    try {
      const res = await fetch(`/api/cron-jobs/${jobId}/run`, { method: "POST" });
      const data = await res.json();
      if (!data.success) {
        console.error(`Job failed: ${data.stderr || data.error}`);
      }
      // Refresh after job completes
      setTimeout(() => fetchJobs(), 2000);
    } catch (err) {
      console.error("Failed to run job:", err);
    } finally {
      setRunningJobs((prev) => {
        const next = new Set(prev);
        next.delete(jobId);
        return next;
      });
    }
  }, [fetchJobs]);

  const statusCounts = jobs.reduce(
    (acc, j) => {
      acc[j.status] = (acc[j.status] || 0) + 1;
      return acc;
    },
    { green: 0, yellow: 0, red: 0, gray: 0 } as Record<Status, number>
  );

  // Filter jobs for selected day
  const filteredJobs = jobs; // Day filtering is visual in timeline

  if (loading) {
    return (
      <div className="flex min-h-screen items-center justify-center">
        <div className="text-zinc-500">Cron Jobs werden geprüft...</div>
      </div>
    );
  }

  return (
    <>
      <Header
        serviceCount={jobs.length}
        statusCounts={statusCounts}
        lastChecked={lastChecked}
      />

      {/* Controls Bar */}
      <div className="border-b border-zinc-800 px-6 py-3">
        <div className="mx-auto max-w-7xl flex flex-wrap items-center justify-between gap-3">
          {/* Left: Summary Chips + Day Selector */}
          <div className="flex items-center gap-3">
            {/* Status Chips */}
            <div className="flex gap-2">
              {statusCounts.green > 0 && (
                <span className="inline-flex items-center gap-1.5 rounded-md px-2.5 py-1 text-xs font-medium bg-green-500/10 text-green-400 border border-green-500/20">
                  <span className="w-1.5 h-1.5 rounded-full bg-green-400" />
                  {statusCounts.green} OK
                </span>
              )}
              {statusCounts.yellow > 0 && (
                <span className="inline-flex items-center gap-1.5 rounded-md px-2.5 py-1 text-xs font-medium bg-yellow-500/10 text-yellow-400 border border-yellow-500/20">
                  <span className="w-1.5 h-1.5 rounded-full bg-yellow-400" />
                  {statusCounts.yellow} Warning
                </span>
              )}
              {statusCounts.red > 0 && (
                <span className="inline-flex items-center gap-1.5 rounded-md px-2.5 py-1 text-xs font-medium bg-red-500/10 text-red-400 border border-red-500/20">
                  <span className="w-1.5 h-1.5 rounded-full bg-red-400" />
                  {statusCounts.red} Error
                </span>
              )}
              {statusCounts.gray > 0 && (
                <span className="inline-flex items-center gap-1.5 rounded-md px-2.5 py-1 text-xs font-medium bg-zinc-500/10 text-zinc-400 border border-zinc-500/20">
                  <span className="w-1.5 h-1.5 rounded-full bg-zinc-400" />
                  {statusCounts.gray} Unknown
                </span>
              )}
            </div>

            {/* Day Selector */}
            <div className="flex gap-0.5">
              {DAYS.map((day, i) => {
                const isToday = i === new Date().getDay();
                return (
                  <button
                    key={day}
                    onClick={() => setSelectedDay(i)}
                    className={`w-8 h-7 flex items-center justify-center rounded text-[11px] font-medium transition-colors border ${
                      selectedDay === i
                        ? "text-zinc-100 bg-zinc-700/50 border-zinc-600"
                        : isToday
                          ? "text-blue-400 border-blue-500/30 hover:bg-zinc-800/50"
                          : i >= 6
                            ? "text-zinc-600 border-transparent hover:text-zinc-400"
                            : "text-zinc-500 border-transparent hover:text-zinc-300 hover:border-zinc-700"
                    }`}
                  >
                    {day}
                  </button>
                );
              })}
            </div>
          </div>

          {/* Right: View + GroupBy Toggles */}
          <div className="flex items-center gap-2">
            <div className="flex rounded-md border border-zinc-700 overflow-hidden">
              <button
                onClick={() => setViewMode("timeline")}
                className={`px-3 py-1 text-xs font-medium transition-colors ${
                  viewMode === "timeline"
                    ? "bg-zinc-700/60 text-zinc-100"
                    : "text-zinc-500 hover:text-zinc-300"
                }`}
              >
                Timeline
              </button>
              <button
                onClick={() => setViewMode("list")}
                className={`px-3 py-1 text-xs font-medium transition-colors border-l border-zinc-700 ${
                  viewMode === "list"
                    ? "bg-zinc-700/60 text-zinc-100"
                    : "text-zinc-500 hover:text-zinc-300"
                }`}
              >
                Liste
              </button>
            </div>
            <div className="flex rounded-md border border-zinc-700 overflow-hidden">
              <button
                onClick={() => setGroupBy("host")}
                className={`px-3 py-1 text-xs font-medium transition-colors ${
                  groupBy === "host"
                    ? "bg-zinc-700/60 text-zinc-100"
                    : "text-zinc-500 hover:text-zinc-300"
                }`}
              >
                Nach Host
              </button>
              <button
                onClick={() => setGroupBy("group")}
                className={`px-3 py-1 text-xs font-medium transition-colors border-l border-zinc-700 ${
                  groupBy === "group"
                    ? "bg-zinc-700/60 text-zinc-100"
                    : "text-zinc-500 hover:text-zinc-300"
                }`}
              >
                Nach Projekt
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Main Content */}
      <main className="mx-auto max-w-7xl px-6 py-6">
        {filteredJobs.length === 0 ? (
          <div className="py-12 text-center text-zinc-500">
            Keine Cron Jobs gefunden.
          </div>
        ) : viewMode === "timeline" ? (
          <CronTimeline
            jobs={filteredJobs}
            groupBy={groupBy}
            selectedDay={selectedDay}
            timelineData={timelineData}
          />
        ) : (
          <CronList
            jobs={filteredJobs}
            groupBy={groupBy}
            onRunJob={handleRunJob}
            runningJobs={runningJobs}
          />
        )}
      </main>
    </>
  );
}
