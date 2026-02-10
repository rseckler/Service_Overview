# Service Overview

**Purpose:** Zentrales Status-Dashboard für alle Services im Workspace. Zeigt Ampel-Status (grün/gelb/rot) basierend auf HTTP-Checks und Log-Freshness-Checks.

**Location:** `Service_Overview/`
**GitHub:** https://github.com/rseckler/Service_Overview
**Production:** http://72.62.148.205:3002

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

### Service Discovery
- Scannt `PROJECTS_BASE_PATH` nach Verzeichnissen mit `CLAUDE.md`
- Extrahiert Tech-Stack, Deployment-Typ, GitHub-URL per Regex
- Gleicht mit `services.config.json` ab für Health-Check-Konfiguration
- **Wichtig:** Config-Key muss exakt dem Verzeichnisnamen auf dem VPS entsprechen (case-sensitive)

### Health Checks
- **HTTP Check:** `fetch(url)` mit Timeout → grün (<3s), gelb (>3s), rot (error)
- **Log-Freshness:** `fs.stat(logPath).mtime` → prüft Alter + Error-Keywords in Log
- Services ohne Config-Eintrag erscheinen als "grau" (keine Checks konfiguriert)

### API Routes
- `GET /api/services` — Alle Services mit aggregiertem Status
- `GET /api/services/[slug]` — Einzelner Service mit Errors + Logs

### Frontend
- Dashboard: Auto-Refresh alle 60s, Grid aus Service-Cards mit Service-URL + Link-Icon
- Detail-Seite: Checks, Errors, letzte 50 Log-Einträge (farbcodiert nach Level)

## Configuration

### Environment (.env.local)
```
PROJECTS_BASE_PATH=/Users/robin/Documents/4_AI   # Lokal
# PROJECTS_BASE_PATH=/root                        # VPS
```

### Service Config (services.config.json)

Definiert Health-Checks pro Service. `url` wird als klickbarer Link auf der Karte angezeigt. Der Config-Key muss dem **exakten Verzeichnisnamen** auf dem Ziel-System entsprechen (z.B. `blackfire-service` für `/root/blackfire-service/`).

```json
{
  "services": {
    "mein-service": {
      "displayName": "Mein Service",
      "description": "Beschreibung",
      "type": "web",
      "url": "https://example.com",
      "checks": [
        { "name": "Health", "type": "http", "url": "https://example.com", "expectedStatus": 200, "timeoutMs": 5000 }
      ]
    }
  }
}
```

### Monitored Services

| Service | URL | Check-Typ |
|---------|-----|-----------|
| Blackfire Service | https://blackfire-service.vercel.app | HTTP |
| Watch Service | http://72.62.148.205:3001 | HTTP |
| Tape Mag Migration | http://72.62.148.205:3003 | HTTP |
| VOD Fest | http://72.62.148.205:8080 | HTTP |
| Blackfire Automation | — (cronjob) | Log-Freshness |
| Passive Income | — (cronjob) | Log-Freshness |
| Service Overview | http://72.62.148.205:3002 | — (self) |

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

## Key Files

- `services.config.json` — Health-Check-Konfiguration pro Service
- `ecosystem.config.js` — PM2 Konfiguration (Port 3002, PROJECTS_BASE_PATH)
- `src/lib/discovery.ts` — CLAUDE.md Scanner (Service Discovery)
- `src/lib/config.ts` — Config Loader (Key = exakter Verzeichnisname)
- `src/lib/health-check.ts` — HTTP + Log-Freshness Checks
- `src/lib/log-parser.ts` — Log-Datei Parser
- `src/app/api/services/route.ts` — Services API (Discovery + Config Merge)
- `src/app/page.tsx` — Dashboard mit Service-Cards
- `src/app/services/[slug]/page.tsx` — Service Detail-Seite
