"use client";

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
  const time = lastChecked
    ? new Date(lastChecked).toLocaleTimeString("de-DE", {
        hour: "2-digit",
        minute: "2-digit",
        second: "2-digit",
      })
    : "–";

  return (
    <header className="border-b border-zinc-800 px-6 py-4">
      <div className="mx-auto flex max-w-7xl items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">
            Service Overview
          </h1>
          <p className="mt-1 text-sm text-zinc-400">
            {serviceCount} Services
            {statusCounts.green > 0 && (
              <span className="ml-2 text-green-400">
                {statusCounts.green} Online
              </span>
            )}
            {statusCounts.yellow > 0 && (
              <span className="ml-2 text-yellow-400">
                {statusCounts.yellow} Warning
              </span>
            )}
            {statusCounts.red > 0 && (
              <span className="ml-2 text-red-400">
                {statusCounts.red} Offline
              </span>
            )}
            {statusCounts.gray > 0 && (
              <span className="ml-2 text-zinc-500">
                {statusCounts.gray} Nicht konfiguriert
              </span>
            )}
          </p>
        </div>
        <div className="text-right text-sm text-zinc-500">
          <p>Letzter Check</p>
          <p className="font-mono">{time}</p>
        </div>
      </div>
    </header>
  );
}
