import { NextResponse } from "next/server";
import { loadCronJobsConfig } from "@/lib/cron-config";
import { discoverAll, mergeDiscoveredJobs } from "@/lib/cron-discovery";

export const dynamic = "force-dynamic";

export async function GET() {
  try {
    const config = await loadCronJobsConfig();
    const discovered = await discoverAll();
    const { newJobs, removedIds } = mergeDiscoveredJobs(config.jobs, discovered);

    return NextResponse.json({
      discovered: discovered.length,
      configured: config.jobs.length,
      newJobs,
      removedIds,
    });
  } catch (error) {
    console.error("Discovery failed:", error);
    return NextResponse.json(
      { error: "Discovery failed" },
      { status: 500 }
    );
  }
}
