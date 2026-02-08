"use client";

import Link from "next/link";
import type { ServiceSummary } from "@/lib/types";
import { StatusIndicator } from "./status-indicator";

const typeBadgeColors: Record<string, string> = {
  web: "bg-blue-900/50 text-blue-300 border-blue-800",
  cronjob: "bg-purple-900/50 text-purple-300 border-purple-800",
  docker: "bg-cyan-900/50 text-cyan-300 border-cyan-800",
  unknown: "bg-zinc-800 text-zinc-400 border-zinc-700",
};

export function ServiceCard({ service }: { service: ServiceSummary }) {
  return (
    <Link href={`/service/${service.slug}`}>
      <div className="group cursor-pointer rounded-lg border border-zinc-800 bg-zinc-900/50 p-5 transition-all hover:border-zinc-700 hover:bg-zinc-900">
        <div className="flex items-start justify-between">
          <div className="flex items-center gap-3">
            <StatusIndicator status={service.status} size="md" />
            <h2 className="text-lg font-semibold">{service.name}</h2>
            {service.url && (
              <a
                href={service.url}
                target="_blank"
                rel="noopener noreferrer"
                onClick={(e) => e.stopPropagation()}
                className="text-zinc-500 transition-colors hover:text-zinc-300"
                title={service.url}
              >
                <svg
                  xmlns="http://www.w3.org/2000/svg"
                  width="16"
                  height="16"
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="2"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                >
                  <path d="M18 13v6a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h6" />
                  <polyline points="15 3 21 3 21 9" />
                  <line x1="10" y1="14" x2="21" y2="3" />
                </svg>
              </a>
            )}
          </div>
          <span
            className={`rounded-full border px-2.5 py-0.5 text-xs font-medium ${typeBadgeColors[service.type] ?? typeBadgeColors.unknown}`}
          >
            {service.type}
          </span>
        </div>

        {service.description && (
          <p className="mt-2 text-sm text-zinc-400">{service.description}</p>
        )}

        {service.techStack.length > 0 && (
          <div className="mt-3 flex flex-wrap gap-1.5">
            {service.techStack.slice(0, 5).map((tech) => (
              <span
                key={tech}
                className="rounded bg-zinc-800 px-2 py-0.5 text-xs text-zinc-300"
              >
                {tech}
              </span>
            ))}
            {service.techStack.length > 5 && (
              <span className="rounded bg-zinc-800 px-2 py-0.5 text-xs text-zinc-500">
                +{service.techStack.length - 5}
              </span>
            )}
          </div>
        )}

        {service.deploymentType.length > 0 && (
          <div className="mt-2 flex flex-wrap gap-1.5">
            {service.deploymentType.map((dep) => (
              <span
                key={dep}
                className="rounded border border-zinc-700 px-2 py-0.5 text-xs text-zinc-400"
              >
                {dep}
              </span>
            ))}
          </div>
        )}

        {service.checks.length > 0 && (
          <div className="mt-3 space-y-1 border-t border-zinc-800 pt-3">
            {service.checks.map((check) => (
              <div
                key={check.name}
                className="flex items-center gap-2 text-sm"
              >
                <StatusIndicator status={check.status} size="sm" />
                <span className="text-zinc-300">{check.name}</span>
                <span className="ml-auto text-xs text-zinc-500">
                  {check.message}
                </span>
              </div>
            ))}
          </div>
        )}

        {service.checks.length === 0 && (
          <p className="mt-3 text-xs text-zinc-600">
            Keine Health-Checks konfiguriert
          </p>
        )}
      </div>
    </Link>
  );
}
