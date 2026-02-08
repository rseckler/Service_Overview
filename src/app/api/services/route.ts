import { NextResponse } from "next/server";
import { discoverServices } from "@/lib/discovery";
import { getServiceConfig } from "@/lib/config";
import { runCheck, aggregateStatus } from "@/lib/health-check";
import type { ServiceSummary } from "@/lib/types";

export const dynamic = "force-dynamic";

function toSlug(dirName: string): string {
  return dirName.toLowerCase().replace(/[\s_]+/g, "-");
}

export async function GET() {
  try {
    const discovered = await discoverServices();
    const services: ServiceSummary[] = [];

    for (const svc of discovered) {
      const config = await getServiceConfig(svc.dirName);
      const checks = [];
      const allErrors = [];

      if (config) {
        for (const checkConfig of config.checks) {
          const { result, errors } = await runCheck(checkConfig);
          checks.push(result);
          allErrors.push(...errors);
        }
      }

      services.push({
        slug: toSlug(svc.dirName),
        name: config?.displayName ?? svc.name,
        description: config?.description ?? "",
        type: config?.type ?? "unknown",
        techStack: svc.techStack,
        deploymentType: svc.deploymentType,
        status: checks.length > 0 ? aggregateStatus(checks) : "gray",
        checks,
        url: config?.url,
        github: svc.github,
        lastChecked: new Date().toISOString(),
      });
    }

    return NextResponse.json({ services });
  } catch (err) {
    console.error("Failed to fetch services:", err);
    return NextResponse.json(
      { error: "Failed to fetch services" },
      { status: 500 }
    );
  }
}
