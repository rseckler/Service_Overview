"use client";

import type { LogEntry } from "@/lib/types";

export function ErrorList({ entries }: { entries: LogEntry[] }) {
  if (entries.length === 0) {
    return (
      <p className="text-sm text-zinc-500">Keine Errors oder Warnings.</p>
    );
  }

  return (
    <div className="space-y-2">
      {entries.map((entry, i) => (
        <div
          key={i}
          className={`rounded border px-3 py-2 text-sm font-mono ${
            entry.level === "error"
              ? "border-red-900/50 bg-red-950/30 text-red-300"
              : "border-yellow-900/50 bg-yellow-950/30 text-yellow-300"
          }`}
        >
          <div className="flex items-center gap-2">
            <span
              className={`rounded px-1.5 py-0.5 text-xs font-bold uppercase ${
                entry.level === "error"
                  ? "bg-red-900/50 text-red-400"
                  : "bg-yellow-900/50 text-yellow-400"
              }`}
            >
              {entry.level}
            </span>
            {entry.timestamp && (
              <span className="text-xs text-zinc-500">{entry.timestamp}</span>
            )}
          </div>
          <p className="mt-1 break-all text-xs leading-relaxed">
            {entry.message}
          </p>
        </div>
      ))}
    </div>
  );
}
