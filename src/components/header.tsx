"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import type { Status } from "@/lib/types";

interface HeaderProps {
  serviceCount: number;
  statusCounts: Record<Status, number>;
  lastChecked: string;
}

export function Header({
  serviceCount,
  statusCounts,
  lastChecked,
}: HeaderProps) {
  const pathname = usePathname();
  const isCronPage = pathname?.startsWith("/cron-jobs");

  const time = lastChecked
    ? new Date(lastChecked).toLocaleTimeString("de-DE", {
        hour: "2-digit",
        minute: "2-digit",
        second: "2-digit",
      })
    : "–";

  return (
    <header className="border-b border-zinc-800 px-6 py-4">
      <div className="mx-auto max-w-7xl">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold tracking-tight">
              Service Overview
            </h1>
            <p className="mt-1 text-sm text-zinc-400">
              {serviceCount} {isCronPage ? "Cron Jobs" : "Services"}
              {statusCounts.green > 0 && (
                <span className="ml-2 text-green-400">
                  {statusCounts.green} {isCronPage ? "Healthy" : "Online"}
                </span>
              )}
              {statusCounts.yellow > 0 && (
                <span className="ml-2 text-yellow-400">
                  {statusCounts.yellow} Warning
                </span>
              )}
              {statusCounts.red > 0 && (
                <span className="ml-2 text-red-400">
                  {statusCounts.red} {isCronPage ? "Error" : "Offline"}
                </span>
              )}
              {statusCounts.gray > 0 && (
                <span className="ml-2 text-zinc-500">
                  {statusCounts.gray} {isCronPage ? "Unknown" : "Nicht konfiguriert"}
                </span>
              )}
            </p>
          </div>
          <div className="text-right text-sm text-zinc-500">
            <p>Letzter Check</p>
            <p className="font-mono">{time}</p>
          </div>
        </div>

        {/* Navigation Tabs */}
        <nav className="mt-3 flex gap-1 rounded-lg bg-zinc-800/50 p-1 w-fit">
          <Link
            href="/"
            className={`rounded-md px-4 py-1.5 text-sm font-medium transition-colors ${
              !isCronPage
                ? "bg-zinc-700/60 text-zinc-100"
                : "text-zinc-500 hover:text-zinc-300"
            }`}
          >
            Services
          </Link>
          <Link
            href="/cron-jobs"
            className={`rounded-md px-4 py-1.5 text-sm font-medium transition-colors ${
              isCronPage
                ? "bg-zinc-700/60 text-zinc-100"
                : "text-zinc-500 hover:text-zinc-300"
            }`}
          >
            Cron Jobs
          </Link>
        </nav>
      </div>
    </header>
  );
}
