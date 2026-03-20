"use client";

interface HostBadgeProps {
  host: string;
  className?: string;
}

const hostColors: Record<string, string> = {
  vps: "bg-blue-900/50 text-blue-400 border-blue-800/50",
  macbook: "bg-purple-900/50 text-purple-400 border-purple-800/50",
  "mac-mini": "bg-purple-900/50 text-purple-400 border-purple-800/50",
};

const hostLabels: Record<string, string> = {
  vps: "VPS",
  macbook: "MAC",
  "mac-mini": "MAC",
};

export function HostBadge({ host, className = "" }: HostBadgeProps) {
  const colors = hostColors[host] ?? "bg-zinc-800 text-zinc-400 border-zinc-700";
  const label = hostLabels[host] ?? host.toUpperCase();

  return (
    <span
      className={`inline-flex items-center rounded px-1.5 py-0.5 text-[10px] font-semibold uppercase tracking-wider border ${colors} ${className}`}
    >
      {label}
    </span>
  );
}

interface GroupBadgeProps {
  group: string;
  className?: string;
}

export function GroupBadge({ group, className = "" }: GroupBadgeProps) {
  return (
    <span
      className={`inline-flex items-center rounded px-2 py-0.5 text-xs font-medium bg-zinc-800 text-zinc-400 border border-zinc-700 ${className}`}
    >
      {group}
    </span>
  );
}

interface DiscoveredBadgeProps {
  className?: string;
}

export function DiscoveredBadge({ className = "" }: DiscoveredBadgeProps) {
  return (
    <span
      className={`inline-flex items-center rounded px-1.5 py-0.5 text-[10px] font-semibold uppercase tracking-wider bg-blue-900/30 text-blue-400 border border-blue-800/40 ${className}`}
    >
      NEU
    </span>
  );
}
