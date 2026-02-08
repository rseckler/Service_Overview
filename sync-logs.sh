#!/bin/bash
# Sync log files from VPS to local for health-check monitoring
# Usage: ./sync-logs.sh

VPS="root@72.62.148.205"
LOCAL_BASE="/Users/robin/Documents/4_AI"

echo "Syncing logs from VPS..."

# Blackfire Automation
rsync -az "$VPS:/root/Blackfire_automation/stock_prices.log" "$LOCAL_BASE/Blackfire_automation/stock_prices.log"
rsync -az "$VPS:/root/Blackfire_automation/sync_cron.log" "$LOCAL_BASE/Blackfire_automation/sync_cron.log"

# Passive Income
rsync -az "$VPS:/root/Passive-Income-Generator/cron.log" "$LOCAL_BASE/Passive Income/cron.log"

echo "Done. $(date '+%Y-%m-%d %H:%M:%S')"
