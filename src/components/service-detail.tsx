"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import type { ServiceDetail as ServiceDetailType } from "@/lib/types";
import { StatusIndicator } from "./status-indicator";
import { ErrorList } from "./error-list";
import { LogViewer } from "./log-viewer";

const typeBadgeColors: Record<string, string> = {
  web: "bg-blue-900/50 text-blue-300 border-blue-800",
  cronjob: "bg-purple-900/50 text-purple-300 border-purple-800",
  docker: "bg-cyan-900/50 text-cyan-300 border-cyan-800",
  unknown: "bg-zinc-800 text-zinc-400 border-zinc-700",
};

export function ServiceDetailView({ slug }: { slug: string }) {
  const [service, setService] = useState<ServiceDetailType | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    async function load() {
      try {
        const res = await fetch(`/api/services/${slug}`);
        if (!res.ok) {
          setError(res.status === 404 ? "Service nicht gefunden." : "Fehler beim Laden.");
          return;
        }
        const data = await res.json();
        setService(data);
      } catch {
        setError("Verbindung fehlgeschlagen.");
      } finally {
        setLoading(false);
      }
    }
    load();
    const interval = setInterval(load, 60_000);
    return () => clearInterval(interval);
  }, [slug]);

  if (loading) {
    return (
      <div className="flex min-h-screen items-center justify-center">
        <div className="text-zinc-500">Lade Service-Details...</div>
      </div>
    );
  }

  if (error || !service) {
    return (
      <div className="mx-auto max-w-4xl px-6 py-12">
        <Link
          href="/"
          className="text-sm text-zinc-400 hover:text-zinc-200"
        >
          &larr; Zurück zur Übersicht
        </Link>
        <p className="mt-6 text-red-400">{error}</p>
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-4xl px-6 py-6">
      <Link
        href="/"
        className="text-sm text-zinc-400 transition-colors hover:text-zinc-200"
      >
        &larr; Zurück zur Übersicht
      </Link>

      {/* Header */}
      <div className="mt-6 flex items-center gap-4">
        <StatusIndicator status={service.status} size="lg" />
        <div>
          <h1 className="text-3xl font-bold">{service.name}</h1>
          {service.description && (
            <p className="mt-1 text-zinc-400">{service.description}</p>
          )}
        </div>
        <span
          className={`ml-auto rounded-full border px-3 py-1 text-sm font-medium ${typeBadgeColors[service.type] ?? typeBadgeColors.unknown}`}
        >
          {service.type}
        </span>
      </div>

      {/* Info Row */}
      <div className="mt-6 flex flex-wrap gap-4">
        {service.techStack.length > 0 && (
          <div>
            <h3 className="mb-1.5 text-xs font-medium uppercase text-zinc-500">
              Tech Stack
            </h3>
            <div className="flex flex-wrap gap-1.5">
              {service.techStack.map((tech) => (
                <span
                  key={tech}
                  className="rounded bg-zinc-800 px-2 py-0.5 text-xs text-zinc-300"
                >
                  {tech}
                </span>
              ))}
            </div>
          </div>
        )}
        {service.deploymentType.length > 0 && (
          <div>
            <h3 className="mb-1.5 text-xs font-medium uppercase text-zinc-500">
              Deployment
            </h3>
            <div className="flex flex-wrap gap-1.5">
              {service.deploymentType.map((dep) => (
                <span
                  key={dep}
                  className="rounded border border-zinc-700 px-2 py-0.5 text-xs text-zinc-400"
                >
                  {dep}
                </span>
              ))}
            </div>
          </div>
        )}
        {service.github && (
          <div>
            <h3 className="mb-1.5 text-xs font-medium uppercase text-zinc-500">
              GitHub
            </h3>
            <a
              href={service.github}
              target="_blank"
              rel="noopener noreferrer"
              className="text-sm text-blue-400 hover:underline"
            >
              {service.github.replace("https://github.com/", "")}
            </a>
          </div>
        )}
      </div>

      {/* Checks */}
      <div className="mt-8">
        <h2 className="mb-3 text-lg font-semibold">Health Checks</h2>
        {service.checks.length === 0 ? (
          <p className="text-sm text-zinc-500">
            Keine Health-Checks konfiguriert.
          </p>
        ) : (
          <div className="space-y-2">
            {service.checks.map((check) => (
              <div
                key={check.name}
                className="flex items-center gap-3 rounded-lg border border-zinc-800 bg-zinc-900/50 px-4 py-3"
              >
                <StatusIndicator status={check.status} size="md" />
                <span className="font-medium">{check.name}</span>
                <span className="ml-auto text-sm text-zinc-400">
                  {check.message}
                </span>
                {check.responseTimeMs !== undefined && (
                  <span className="text-xs text-zinc-600">
                    {check.responseTimeMs}ms
                  </span>
                )}
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Errors & Warnings */}
      <div className="mt-8">
        <h2 className="mb-3 text-lg font-semibold">Errors & Warnings</h2>
        <ErrorList entries={service.errors} />
      </div>

      {/* Log Viewer — letzte 50 Einträge */}
      <div className="mt-8">
        <h2 className="mb-3 text-lg font-semibold">
          Letzte Log-Einträge
        </h2>
        <LogViewer sections={service.logSections ?? []} />
      </div>

      {/* Last Checked */}
      <div className="mt-8 border-t border-zinc-800 pt-4 text-xs text-zinc-600">
        Zuletzt geprüft:{" "}
        {new Date(service.lastChecked).toLocaleString("de-DE")}
      </div>
    </div>
  );
}
