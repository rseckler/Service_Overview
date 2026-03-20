import { NextResponse } from "next/server";
import { loadCronJobsConfig } from "@/lib/cron-config";
import { getCronJobDetail } from "@/lib/cron-health-check";

export const dynamic = "force-dynamic";

export async function GET(
  _request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const config = await loadCronJobsConfig();
    const job = config.jobs.find((j) => j.id === id);

    if (!job) {
      return NextResponse.json(
        { error: `Cron job "${id}" not found` },
        { status: 404 }
      );
    }

    const host = config.hosts[job.host];
    const hostDisplayName = host?.displayName ?? job.host;
    const detail = await getCronJobDetail(job, hostDisplayName);

    return NextResponse.json({ job: detail });
  } catch (error) {
    console.error("Failed to load cron job detail:", error);
    return NextResponse.json(
      { error: "Failed to load cron job detail" },
      { status: 500 }
    );
  }
}
