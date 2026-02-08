"use client";

import type { Status } from "@/lib/types";

const colorMap: Record<Status, string> = {
  green: "bg-green-500",
  yellow: "bg-yellow-500",
  red: "bg-red-500",
  gray: "bg-zinc-500",
};

const glowMap: Record<Status, string> = {
  green: "shadow-[0_0_8px_rgba(34,197,94,0.6)]",
  yellow: "shadow-[0_0_8px_rgba(234,179,8,0.6)]",
  red: "shadow-[0_0_8px_rgba(239,68,68,0.6)]",
  gray: "",
};

const sizeMap = {
  sm: "h-3 w-3",
  md: "h-4 w-4",
  lg: "h-6 w-6",
};

export function StatusIndicator({
  status,
  size = "md",
}: {
  status: Status;
  size?: "sm" | "md" | "lg";
}) {
  const shouldPulse = status === "yellow" || status === "red";

  return (
    <span
      className={`
        inline-block rounded-full
        ${colorMap[status]}
        ${glowMap[status]}
        ${sizeMap[size]}
        ${shouldPulse ? "animate-pulse-glow" : ""}
      `}
    />
  );
}
