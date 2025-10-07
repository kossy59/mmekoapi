# Fan Meet Request Expired Processing Setup

## Overview
This document explains how to set up automatic processing of expired fan meet requests.

## Manual Processing
You can manually trigger expired request processing by calling:
```
POST /process-expired
```

## Automated Processing (Recommended)
Set up a cron job to automatically process expired requests every 5 minutes:

### Using crontab (Linux/Mac)
```bash
# Edit crontab
crontab -e

# Add this line to run every 5 minutes
*/5 * * * * curl -X POST http://your-api-domain.com/process-expired
```

### Using PM2 (Node.js Process Manager)
```bash
# Install PM2 if not already installed
npm install -g pm2

# Create a cron job script
echo 'curl -X POST http://localhost:3100/process-expired' > process-expired.sh
chmod +x process-expired.sh

# Schedule with PM2
pm2 start process-expired.sh --cron "*/5 * * * *"
```

### Using GitHub Actions (if deployed on GitHub)
Create `.github/workflows/process-expired.yml`:
```yaml
name: Process Expired Requests
on:
  schedule:
    - cron: '*/5 * * * *'  # Every 5 minutes
jobs:
  process-expired:
    runs-on: ubuntu-latest
    steps:
      - name: Process Expired Requests
        run: |
          curl -X POST ${{ secrets.API_URL }}/process-expired
```

## Environment Variables
Make sure your API has the following environment variables set:
- `MONGODB_URI`: MongoDB connection string
- `NEXT_PUBLIC_URL`: Your frontend URL for CORS

## Monitoring
Check the logs to ensure the cron job is running properly:
```bash
# For PM2
pm2 logs

# For system cron
tail -f /var/log/cron
```

## Testing
Test the endpoint manually:
```bash
curl -X POST http://localhost:3100/process-expired
```

Expected response:
```json
{
  "ok": true,
  "message": "Expired requests processed successfully"
}
```
