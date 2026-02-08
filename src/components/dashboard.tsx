"use client";

import { useEffect, useState, useCallback } from "react";
import type { ServiceSummary, Status } from "@/lib/types";
import { Header } from "./header";
import { ServiceCard } from "./service-card";

export function Dashboard() {
  const [services, setServices] = useState<ServiceSummary[]>([]);
  const [loading, setLoading] = useState(true);
  const [lastChecked, setLastChecked] = useState("");

  const fetchServices = useCallback(async () => {
    try {
      const res = await fetch("/api/services");
      const data = await res.json();
      setServices(data.services ?? []);
      setLastChecked(new Date().toISOString());
    } catch (err) {
      console.error("Failed to fetch services:", err);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchServices();
    const interval = setInterval(fetchServices, 60_000);
    return () => clearInterval(interval);
  }, [fetchServices]);

  const statusCounts = services.reduce(
    (acc, s) => {
      acc[s.status] = (acc[s.status] || 0) + 1;
      return acc;
    },
    { green: 0, yellow: 0, red: 0, gray: 0 } as Record<Status, number>
  );

  if (loading) {
    return (
      <div className="flex min-h-screen items-center justify-center">
        <div className="text-zinc-500">Services werden geprüft...</div>
      </div>
    );
  }

  return (
    <>
      <Header
        serviceCount={services.length}
        statusCounts={statusCounts}
        lastChecked={lastChecked}
      />
      <main className="mx-auto max-w-7xl px-6 py-6">
        {services.length === 0 ? (
          <div className="py-12 text-center text-zinc-500">
            Keine Services gefunden. Stelle sicher, dass PROJECTS_BASE_PATH
            korrekt gesetzt ist.
          </div>
        ) : (
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {services.map((service) => (
              <ServiceCard key={service.slug} service={service} />
            ))}
          </div>
        )}
      </main>
    </>
  );
}
