import { NextResponse } from "next/server";
import { loadCronJobsConfig } from "@/lib/cron-config";
import { checkCronJob } from "@/lib/cron-health-check";
import type { CronJobsResponse, CronJobsSummary, CronJobSummary } from "@/lib/cron-types";
import type { Status } from "@/lib/types";

export const dynamic = "force-dynamic";

export async function GET() {
  try {
    const config = await loadCronJobsConfig();
    const jobs: CronJobSummary[] = [];

    for (const job of config.jobs) {
      const host = config.hosts[job.host];
      const hostDisplayName = host?.displayName ?? job.host;
      const summary = await checkCronJob(job, hostDisplayName);
      jobs.push(summary);
    }

    // Sort: red first, then yellow, then gray, then green
    const statusOrder: Record<Status, number> = { red: 0, yellow: 1, gray: 2, green: 3 };
    jobs.sort((a, b) => statusOrder[a.status] - statusOrder[b.status]);

    const summary: CronJobsSummary = {
      total: jobs.length,
      green: jobs.filter((j) => j.status === "green").length,
      yellow: jobs.filter((j) => j.status === "yellow").length,
      red: jobs.filter((j) => j.status === "red").length,
      gray: jobs.filter((j) => j.status === "gray").length,
      disabled: jobs.filter((j) => !j.enabled).length,
    };

    const response: CronJobsResponse = {
      hosts: config.hosts,
      jobs,
      summary,
    };

    return NextResponse.json(response);
  } catch (error) {
    console.error("Failed to load cron jobs:", error);
    return NextResponse.json(
      { error: "Failed to load cron jobs" },
      { status: 500 }
    );
  }
}
