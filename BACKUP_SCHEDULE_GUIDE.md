# ⏰ Backup Schedule Configuration Guide

## 📅 **Current Schedule**

**Default:** Runs daily at **12:30 PM (Africa/Lagos time)**

## 🔧 **How to Change the Schedule**

Add these environment variables to your `.env` file:

```env
# Custom backup schedule
BACKUP_CRON_SCHEDULE=30 12 * * *
BACKUP_CRON_TZ=Africa/Lagos
```

## 📝 **Cron Schedule Format**

The format is: `minute hour day month day-of-week`

```
* * * * *
│ │ │ │ │
│ │ │ │ └─── Day of week (0-7, where 0 and 7 = Sunday)
│ │ │ └───── Month (1-12)
│ │ └─────── Day of month (1-31)
│ └───────── Hour (0-23)
└─────────── Minute (0-59)
```

## 🕐 **Common Schedule Examples**

### **Daily Backups**

```env
# Every day at midnight (12:00 AM)
BACKUP_CRON_SCHEDULE=0 0 * * *
BACKUP_CRON_TZ=Africa/Lagos

# Every day at 2:00 AM (low traffic time)
BACKUP_CRON_SCHEDULE=0 2 * * *
BACKUP_CRON_TZ=Africa/Lagos

# Every day at 3:30 AM
BACKUP_CRON_SCHEDULE=30 3 * * *
BACKUP_CRON_TZ=Africa/Lagos

# Every day at 6:00 AM
BACKUP_CRON_SCHEDULE=0 6 * * *
BACKUP_CRON_TZ=Africa/Lagos

# Every day at 10:15 PM (current default is 12:30 PM)
BACKUP_CRON_SCHEDULE=15 22 * * *
BACKUP_CRON_TZ=Africa/Lagos
```

### **Multiple Times Per Day**

```env
# Every 6 hours (12 AM, 6 AM, 12 PM, 6 PM)
BACKUP_CRON_SCHEDULE=0 */6 * * *
BACKUP_CRON_TZ=Africa/Lagos

# Every 12 hours (12 AM and 12 PM)
BACKUP_CRON_SCHEDULE=0 */12 * * *
BACKUP_CRON_TZ=Africa/Lagos

# Twice daily at specific times (2 AM and 2 PM)
BACKUP_CRON_SCHEDULE=0 2,14 * * *
BACKUP_CRON_TZ=Africa/Lagos
```

### **Weekly Backups**

```env
# Every Monday at 2:00 AM
BACKUP_CRON_SCHEDULE=0 2 * * 1
BACKUP_CRON_TZ=Africa/Lagos

# Every Sunday at midnight
BACKUP_CRON_SCHEDULE=0 0 * * 0
BACKUP_CRON_TZ=Africa/Lagos
```

## 🌍 **Timezone Options**

You can use any timezone. Common options:

```env
# Nigeria/Lagos (WAT - UTC+1)
BACKUP_CRON_TZ=Africa/Lagos

# UTC (Coordinated Universal Time)
BACKUP_CRON_TZ=UTC

# US Eastern Time
BACKUP_CRON_TZ=America/New_York

# US Pacific Time
BACKUP_CRON_TZ=America/Los_Angeles

# UK Time
BACKUP_CRON_TZ=Europe/London

# South Africa
BACKUP_CRON_TZ=Africa/Johannesburg
```

## 💡 **Recommended Times**

### **For Low Traffic (Best Performance):**
```env
# 2:00 AM - 4:00 AM (lowest user activity)
BACKUP_CRON_SCHEDULE=0 3 * * *
BACKUP_CRON_TZ=Africa/Lagos
```

### **For Business Hours:**
```env
# 12:30 PM (current default - lunch time)
BACKUP_CRON_SCHEDULE=30 12 * * *
BACKUP_CRON_TZ=Africa/Lagos
```

### **For Off-Peak:**
```env
# 10:15 PM (after business hours)
BACKUP_CRON_SCHEDULE=15 22 * * *
BACKUP_CRON_TZ=Africa/Lagos
```

## ✅ **How to Apply Changes**

1. **Edit your `.env` file:**
   ```env
   BACKUP_CRON_SCHEDULE=0 3 * * *
   BACKUP_CRON_TZ=Africa/Lagos
   ```

2. **Restart your Node.js server:**
   ```bash
   # If using PM2
   pm2 restart mmeko-api
   
   # If running directly
   # Stop and restart your server
   ```

3. **Verify the schedule:**
   Look for this log when server starts:
   ```
   🕐 [BACKUP] Scheduling cron job -> "0 3 * * *" (Africa/Lagos)
   ✅ [BACKUP] Cron job started
   ```

## 🧪 **Test Your Schedule**

You can test if your cron expression is valid using online tools:
- https://crontab.guru/
- https://cronjob.xyz/

## 📊 **Current Status**

To check your current backup schedule, look at the server startup logs or run:
```bash
node scripts/backupMonitor.js
```

The schedule will be shown in the startup message when your server starts.

