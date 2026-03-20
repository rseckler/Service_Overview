import { NextResponse } from "next/server";
import { loadCronJobsConfig } from "@/lib/cron-config";
import { checkCronJob } from "@/lib/cron-health-check";
import { getRunHours, getRunMinutes, getRunDays } from "@/lib/cron-utils";
import type { TimeSlot, TimeSlotJob, TimelineResponse, CronJobSummary } from "@/lib/cron-types";

export const dynamic = "force-dynamic";

export async function GET() {
  try {
    const config = await loadCronJobsConfig();

    // Build timeline slots (24 hours)
    const slots: TimeSlot[] = Array.from({ length: 24 }, (_, hour) => ({
      hour,
      jobs: [],
    }));

    const jobSummaries: CronJobSummary[] = [];

    for (const job of config.jobs) {
      const host = config.hosts[job.host];
      const hostDisplayName = host?.displayName ?? job.host;

      const summary = await checkCronJob(job, hostDisplayName);
      jobSummaries.push(summary);

      const hours = getRunHours(job.schedule);
      const minutes = getRunMinutes(job.schedule);
      const days = getRunDays(job.schedule);

      const slotJob: Omit<TimeSlotJob, "minuteInHour"> = {
        id: job.id,
        name: job.name,
        group: job.group,
        host: job.host,
        hostDisplayName,
        status: summary.status,
        daysOfWeek: days,
        enabled: job.enabled,
      };

      for (const hour of hours) {
        for (const minute of minutes) {
          slots[hour].jobs.push({
            ...slotJob,
            minuteInHour: minute,
          });
        }
      }
    }

    const response: TimelineResponse = {
      slots,
      jobs: jobSummaries,
    };

    return NextResponse.json(response);
  } catch (error) {
    console.error("Failed to build timeline:", error);
    return NextResponse.json(
      { error: "Failed to build timeline" },
      { status: 500 }
    );
  }
}
