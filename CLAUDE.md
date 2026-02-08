# Service Overview

**Purpose:** Zentrales Status-Dashboard für alle Services im Workspace. Zeigt Ampel-Status (grün/gelb/rot) basierend auf HTTP-Checks und Log-Freshness-Checks.

**Location:** `Service_Overview/`

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

### Health Checks
- **HTTP Check:** `fetch(url)` mit Timeout → grün (<3s), gelb (>3s), rot (error)
- **Log-Freshness:** `fs.stat(logPath).mtime` → prüft Alter + Error-Keywords in Log

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
Definiert Health-Checks pro Service. `url` wird als klickbarer Link auf der Karte angezeigt. Services ohne Config-Eintrag erscheinen als "grau" (nicht konfiguriert). Neue Services hinzufügen:

```json
{
  "services": {
    "MeinService": {
      "displayName": "Mein Service",
      "description": "Beschreibung",
      "type": "web",
      "url": "http://72.62.148.205:XXXX",
      "checks": [
        { "name": "Health", "type": "http", "url": "http://72.62.148.205:XXXX", "expectedStatus": 200, "timeoutMs": 5000 }
      ]
    }
  }
}
```

### Monitored Services
| Service | URL | Check-Typ |
|---------|-----|-----------|
| Blackfire Service | http://72.62.148.205:3000 | HTTP |
| Watch Service | http://72.62.148.205:3001 | HTTP |
| Service Overview | http://72.62.148.205:3002 | — (self) |
| Tape Mag Migration | http://72.62.148.205:3003 | HTTP |
| VOD Fest | http://72.62.148.205:8080 | HTTP |
| Blackfire Automation | — (cronjob) | Log-Freshness |
| Passive Income | — (cronjob) | Log-Freshness |

## Deployment (VPS)

```bash
# Auf VPS:
cd /root/Service_Overview
pnpm install && pnpm build
pm2 start ecosystem.config.js
# → http://72.62.148.205:3002
```

## Key Files
- `services.config.json` — Health-Check-Konfiguration
- `src/lib/discovery.ts` — CLAUDE.md Scanner
- `src/lib/health-check.ts` — HTTP + Log-Freshness Checks
- `src/lib/log-parser.ts` — Log-Datei Parser
- `src/app/api/services/route.ts` — Services API
- `ecosystem.config.js` — PM2 Konfiguration
