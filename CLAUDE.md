# Service Overview

**Purpose:** Zentrales Status-Dashboard für alle Services und Cron Jobs. Zeigt Ampel-Status (grün/gelb/rot) basierend auf HTTP-Checks und Log-Freshness-Checks. Inklusive Cron Job Kalender mit Timeline-Ansicht über 3 Hosts (VPS, MacBook, Mac Mini).

**Location:** `Service_Overview/`
**GitHub:** https://github.com/rseckler/Service_Overview
**Production:** https://status.thehotshit.de (Port 3002)
**Landing Page:** https://thehotshit.de (statisch, Nginx)

## Quick Start

```bash
cd Service_Overview
pnpm install
pnpm dev          # http://localhost:3002
pnpm build        # Production Build
pnpm start        # Production Server
```

## Tech Stack

- Next.js 16, React 19, TypeScript 5
- Tailwind CSS 4 (Dark Theme)
- PM2 (VPS Deployment)

## Architecture

### Navigation
- Sticky Navbar oben auf allen Seiten (auch auf thehotshit.de Landing Page)
- Links: Services, Cron Jobs, Status, Stocks, Invest
- Header mit Tabs: Services / Cron Jobs (interne Navigation)
- `src/components/navbar.tsx` — Cross-Site Navbar
- `src/components/header.tsx` — Interner Header mit Tabs + Status-Counts

### Service Discovery
- Scannt `PROJECTS_BASE_PATH` nach Verzeichnissen mit `CLAUDE.md`
- Extrahiert Tech-Stack, Deployment-Typ, GitHub-URL per Regex
- Gleicht mit `services.config.json` ab für Health-Check-Konfiguration
- **Wichtig:** Config-Key muss exakt dem Verzeichnisnamen auf dem VPS entsprechen (case-sensitive)

### Health Checks
- **HTTP Check:** `fetch(url)` mit Timeout → grün (<3s), gelb (>3s), rot (error)
- **Log-Freshness:** `fs.stat(logPath).mtime` → prüft Alter + Error-Keywords in Log
- Services ohne Config-Eintrag erscheinen als "grau" (keine Checks konfiguriert)

### API Routes — Services
- `GET /api/services` — Alle Services mit aggregiertem Status
- `GET /api/services/[slug]` — Einzelner Service mit Errors + Logs

### API Routes — Cron Jobs
- `GET /api/cron-jobs` — Alle 26 Jobs mit Ampel-Status, sortiert nach Schwere
- `GET /api/cron-jobs/[id]` — Einzelner Job mit Logs, Errors, Config
- `GET /api/cron-jobs/timeline` — 24h Zeitslots für Timeline-Darstellung
- `GET /api/cron-jobs/discover` — Auto-Discovery neuer Jobs via SSH (crontab + LaunchAgents)
- `POST /api/cron-jobs/[id]/run` — Manueller Job-Start via SSH auf der jeweiligen Maschine

### Frontend — Services
- Dashboard (`/`): Auto-Refresh alle 60s, Grid aus Service-Cards
- Detail-Seite (`/service/[slug]`): Checks, Errors, letzte 50 Log-Einträge

### Frontend — Cron Jobs
- Dashboard (`/cron-jobs`): Timeline- oder Listen-Ansicht, umschaltbar
- **Timeline-View:** 24h horizontale Achse, Balken pro Job (farbcodiert), "Jetzt"-Linie
- **Listen-View:** Gruppierte Tabelle mit Status, Schedule, letzter/nächster Lauf, Play-Button
- **Controls:** View-Toggle (Timeline/Liste), Group-by (Host/Projekt), Wochentag-Selector
- Detail-Seite (`/cron-jobs/[id]`): Info-Grid, Command, Errors, Log-Viewer, "Jetzt starten" Button

## Cron Jobs — 3 Hosts

| Host | SSH-Alias | Jobs | Status-Quelle |
|------|-----------|------|---------------|
| VPS (Hostinger) | `vps` | 24 Jobs | Log-Freshness (direkt auf VPS) |
| MacBook Pro | — (lokal) | 1 Job | LaunchAgent Log |
| Mac Mini | `macmini` | 1 Job | Log via SSH |

### Cron Job Config (`cron-jobs.config.json`)

```json
{
  "hosts": {
    "vps": { "displayName": "VPS (Hostinger)", "sshAlias": "vps", "type": "linux" },
    "macbook": { "displayName": "MacBook Pro", "sshAlias": null, "type": "macos" },
    "mac-mini": { "displayName": "Mac Mini", "sshAlias": "macmini", "type": "macos" }
  },
  "jobs": [
    {
      "id": "bf-morning-sync",
      "name": "Morning Sync",
      "host": "vps",
      "group": "Blackfire Automation",
      "schedule": "0 6 * * *",
      "logPath": "{BASE}/Blackfire_automation/sync_cron.log",
      "maxAgeMinutes": 1560,
      "enabled": true
    }
  ]
}
```

### Auto-Discovery
- Scannt alle 3 Maschinen via `crontab -l` (SSH) und `~/Library/LaunchAgents/` (macOS)
- Neue Jobs werden mit `"discovered": true` Flag und "NEU" Badge angezeigt
- Entfernte Jobs werden als `"removed": true` markiert
- `src/lib/cron-discovery.ts` — Discovery-Logik
- **Wichtig:** SSH-Aufrufe sequentiell wegen Hostinger Rate-Limiting (SSH Multiplexing nutzen)

## Configuration

### Environment (.env.local)
```
PROJECTS_BASE_PATH=/Users/robin/Documents/4_AI   # Lokal
# PROJECTS_BASE_PATH=/root                        # VPS
```

### Monitored Services

| Service | URL | Check-Typ | Status |
|---------|-----|-----------|--------|
| Blackfire Service | https://blackfire-service.vercel.app | HTTP | ✅ Active |
| MyNews App | https://mynews-app-eta.vercel.app | HTTP | ✅ Active |
| Blackfire Automation | — (cronjob) | Log-Freshness | ✅ Active |
| Passive Income | — (cronjob) | Log-Freshness | ✅ Active |
| Service Overview | http://72.62.148.205:3002 | — (self) | ✅ Active |
| Watch Service | http://72.62.148.205:3001 | HTTP | ⏸ Paused |
| Tape Mag Migration | http://72.62.148.205:3003 | HTTP | ⏸ Paused |
| VOD Fest | http://72.62.148.205:8080 | HTTP | ✅ Active |

## Deployment (VPS)

```bash
# Auf VPS:
cd /root/Service_Overview
git pull
pnpm install && pnpm build
pm2 restart service-overview

# Erstmalig:
pm2 start ecosystem.config.js
# → http://72.62.148.205:3002
```

### thehotshit.de Landing Page
```bash
# Statische HTML-Datei, direkt bearbeiten:
ssh vps "nano /var/www/thehotshit/index.html"
# Kein Build/Restart nötig — Nginx liefert direkt aus.
```

## Key Files

### Services
- `services.config.json` — Health-Check-Konfiguration pro Service
- `src/lib/discovery.ts` — CLAUDE.md Scanner (Service Discovery)
- `src/lib/config.ts` — Config Loader (Key = exakter Verzeichnisname)
- `src/lib/health-check.ts` — HTTP + Log-Freshness Checks
- `src/lib/log-parser.ts` — Log-Datei Parser
- `src/app/api/services/route.ts` — Services API
- `src/app/page.tsx` — Dashboard mit Service-Cards
- `src/app/service/[slug]/page.tsx` — Service Detail-Seite

### Cron Jobs
- `cron-jobs.config.json` — Alle 26 Jobs mit Schedule, Log-Pfad, Schwellwerten
- `src/lib/cron-types.ts` — TypeScript Types
- `src/lib/cron-utils.ts` — Cron-Parser (getNextRun, getRunHours, etc.)
- `src/lib/cron-config.ts` — Config-Loader mit Cache
- `src/lib/cron-health-check.ts` — Ampel-Status aus Log-Freshness
- `src/lib/cron-discovery.ts` — Auto-Discovery via SSH
- `src/app/api/cron-jobs/route.ts` — Alle Jobs API
- `src/app/api/cron-jobs/[id]/route.ts` — Einzel-Job API
- `src/app/api/cron-jobs/[id]/run/route.ts` — Manueller Job-Start
- `src/app/api/cron-jobs/timeline/route.ts` — Timeline-Daten
- `src/app/api/cron-jobs/discover/route.ts` — Discovery API
- `src/app/cron-jobs/page.tsx` — Cron Dashboard
- `src/app/cron-jobs/[id]/page.tsx` — Cron Detail-Seite
- `src/components/cron/cron-dashboard.tsx` — Dashboard mit Controls
- `src/components/cron/cron-timeline.tsx` — 24h Timeline-View
- `src/components/cron/cron-list.tsx` — Listen-View
- `src/components/cron/cron-job-detail.tsx` — Detail-Ansicht
- `src/components/cron/cron-status-badge.tsx` — Host/Group/NEU Badges

### Shared
- `src/components/navbar.tsx` — Cross-Site Navbar
- `src/components/header.tsx` — Header mit Tabs + Status-Counts
- `src/components/status-indicator.tsx` — Ampel-Punkt (grün/gelb/rot/grau)
- `src/components/error-list.tsx` — Error/Warning Liste
- `src/components/log-viewer.tsx` — Log-Viewer mit Zeilennummern
- `src/app/layout.tsx` — Root Layout mit Navbar
- `ecosystem.config.js` — PM2 Konfiguration (Port 3002)
