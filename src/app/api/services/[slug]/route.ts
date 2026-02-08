import { NextResponse } from "next/server";
import { discoverServices } from "@/lib/discovery";
import { getServiceConfig } from "@/lib/config";
import { runCheck, aggregateStatus } from "@/lib/health-check";
import { getRecentLogs, getStructuredLogs } from "@/lib/log-parser";
import type { ServiceDetail, LogEntry, LogFileSection } from "@/lib/types";

export const dynamic = "force-dynamic";

function toSlug(dirName: string): string {
  return dirName.toLowerCase().replace(/[\s_]+/g, "-");
}

export async function GET(
  _request: Request,
  { params }: { params: Promise<{ slug: string }> }
) {
  try {
    const { slug } = await params;
    const discovered = await discoverServices();
    const svc = discovered.find((s) => toSlug(s.dirName) === slug);

    if (!svc) {
      return NextResponse.json(
        { error: "Service not found" },
        { status: 404 }
      );
    }

    const config = await getServiceConfig(svc.dirName);
    const checks = [];
    const allErrors: LogEntry[] = [];
    let recentLogs = "";
    const logSections: LogFileSection[] = [];

    if (config) {
      for (const checkConfig of config.checks) {
        const { result, errors } = await runCheck(checkConfig);
        checks.push(result);
        allErrors.push(...errors);
      }

      // Gather logs from all log-freshness checks
      const logPaths = config.checks
        .filter((c) => c.type === "log-freshness")
        .map((c) => c.logPath);

      const [rawSections, structuredSections] = await Promise.all([
        Promise.all(
          logPaths.map(async (p) => {
            const logs = await getRecentLogs(p);
            return `=== ${p} ===\n${logs}`;
          })
        ),
        Promise.all(logPaths.map((p) => getStructuredLogs(p, 50))),
      ]);

      recentLogs = rawSections.join("\n\n");
      logSections.push(...structuredSections);
    }

    const detail: ServiceDetail = {
      slug: toSlug(svc.dirName),
      name: config?.displayName ?? svc.name,
      description: config?.description ?? "",
      type: config?.type ?? "unknown",
      techStack: svc.techStack,
      deploymentType: svc.deploymentType,
      status: checks.length > 0 ? aggregateStatus(checks) : "gray",
      checks,
      github: svc.github,
      lastChecked: new Date().toISOString(),
      errors: allErrors,
      recentLogs,
      logSections,
      config,
    };

    return NextResponse.json(detail);
  } catch (err) {
    console.error("Failed to fetch service detail:", err);
    return NextResponse.json(
      { error: "Failed to fetch service detail" },
      { status: 500 }
    );
  }
}
