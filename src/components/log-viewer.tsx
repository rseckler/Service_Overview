"use client";

import type { LogFileSection } from "@/lib/types";

const levelColors = {
  error: "text-red-400",
  warning: "text-yellow-400",
  info: "text-zinc-400",
};

const levelBg = {
  error: "bg-red-950/40",
  warning: "bg-yellow-950/40",
  info: "",
};

export function LogViewer({ sections }: { sections: LogFileSection[] }) {
  if (sections.length === 0 || sections.every((s) => s.lines.length === 0)) {
    return (
      <p className="text-sm text-zinc-500">Keine Log-Dateien verfügbar.</p>
    );
  }

  return (
    <div className="space-y-4">
      {sections.map((section) => (
        <div key={section.fileName}>
          <div className="mb-2 flex items-center gap-2">
            <span className="rounded bg-zinc-800 px-2 py-0.5 font-mono text-xs text-zinc-300">
              {section.fileName}
            </span>
            <span className="text-xs text-zinc-600">
              {section.lines.length} Zeilen
            </span>
          </div>
          <div className="max-h-[500px] overflow-auto rounded-lg border border-zinc-800 bg-zinc-950">
            <table className="w-full">
              <tbody className="font-mono text-xs">
                {section.lines.map((line) => (
                  <tr
                    key={line.lineNumber}
                    className={`${levelBg[line.level]} border-b border-zinc-900/50 last:border-0`}
                  >
                    <td className="w-12 select-none px-3 py-0.5 text-right text-zinc-600">
                      {line.lineNumber}
                    </td>
                    <td
                      className={`whitespace-pre-wrap break-all px-3 py-0.5 leading-relaxed ${levelColors[line.level]}`}
                    >
                      {line.text}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      ))}
    </div>
  );
}
