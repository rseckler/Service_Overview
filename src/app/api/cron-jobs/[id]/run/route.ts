import { NextResponse } from "next/server";
import { exec } from "child_process";
import { loadCronJobsConfig } from "@/lib/cron-config";

export const dynamic = "force-dynamic";

function execAsync(cmd: string, timeoutMs = 60000): Promise<{ stdout: string; stderr: string; exitCode: number }> {
  return new Promise((resolve) => {
    exec(cmd, { timeout: timeoutMs }, (error, stdout, stderr) => {
      resolve({
        stdout: stdout || "",
        stderr: stderr || "",
        exitCode: error ? (error.code ?? 1) : 0,
      });
    });
  });
}

export async function POST(
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

    if (!job.enabled) {
      return NextResponse.json(
        { error: "Job ist deaktiviert" },
        { status: 400 }
      );
    }

    // Build the command based on host
    let shellCommand: string;
    const host = config.hosts[job.host];

    if (job.host === "macbook" || (!host?.sshAlias && job.host === "macbook")) {
      // Local execution
      shellCommand = job.command;
    } else if (host?.sshAlias) {
      // Remote execution via SSH
      // Escape the command for SSH
      const escapedCommand = job.command.replace(/"/g, '\\"');
      shellCommand = `ssh ${host.sshAlias} "${escapedCommand}"`;
    } else {
      return NextResponse.json(
        { error: `Kein SSH-Zugang für Host "${job.host}" konfiguriert` },
        { status: 400 }
      );
    }

    // Log the execution
    const logRedirect = job.logPath ? ` >> ${job.logPath} 2>&1` : "";
    const fullCommand = `${shellCommand}${logRedirect}`;

    console.log(`[CronRun] Starting job "${job.name}" (${job.id}): ${fullCommand}`);

    // Execute asynchronously — don't wait for completion
    // We return immediately and let the user check logs for status
    const startTime = Date.now();

    // For short jobs, we can wait a bit for the result
    const result = await execAsync(fullCommand, job.maxDurationMinutes * 60 * 1000);
    const durationMs = Date.now() - startTime;

    console.log(`[CronRun] Job "${job.name}" finished in ${durationMs}ms, exit code: ${result.exitCode}`);

    return NextResponse.json({
      success: result.exitCode === 0,
      jobId: job.id,
      jobName: job.name,
      host: job.host,
      exitCode: result.exitCode,
      durationMs,
      stdout: result.stdout.slice(-500), // Last 500 chars
      stderr: result.stderr.slice(-500),
    });
  } catch (error) {
    console.error("Failed to run cron job:", error);
    return NextResponse.json(
      { error: "Failed to run cron job" },
      { status: 500 }
    );
  }
}
