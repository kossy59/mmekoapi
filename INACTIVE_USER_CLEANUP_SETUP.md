# Inactive User Cleanup Setup

## Overview
This system automatically deletes user accounts that have been inactive for more than 6 months.
It uses a combination of `lastActive` timestamp (which is updated on every login/action) and `updatedAt` (as a fallback).

## Components
1. **User Schema Update**: Added `lastActive` field to `UserDB`.
2. **Activity Tracking**: Updates `lastActive` whenever a user connects or performs an action.
3. **Cleanup Script**: `scripts/deleteInactiveUsers.js` finds and deletes eligible accounts.

## Setup Automated Cleanup

### Option 1: Using System Cron (Linux/Mac)
Run the script once a day (e.g., at 3 AM).

1. Edit crontab:
```bash
crontab -e
```

2. Add the following line:
```bash
0 3 * * * cd /path/to/mmekoapi && /usr/bin/node scripts/deleteInactiveUsers.js >> /var/log/mmeko_cleanup.log 2>&1
```
*Replace `/path/to/mmekoapi` with the actual path to your backend directory.*

### Option 2: Using PM2
If you are using PM2 to manage your application, you can schedule the script.

```bash
pm2 start scripts/deleteInactiveUsers.js --name "cleanup-users" --cron "0 3 * * *" --no-autorestart
```

### Option 3: Manual Execution
You can run the script manually at any time to clean up users:

```bash
cd mmekoapi
npm install dotenv # ensure dotenv is available if relying on .env file
node scripts/deleteInactiveUsers.js
```

## Safeguards
- The script uses a logic that checks `lastActive` < 6 months.
- If `lastActive` is missing (for old users before this update), it falls back to `updatedAt` < 6 months.
- It deletes all related data (posts, comments, etc.) using the central deletion utility to prevent orphaned records.
