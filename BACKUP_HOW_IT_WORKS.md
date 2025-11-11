# 🔄 Backup System - How It Works

## ✅ **Current Setup - Works Automatically!**

Your backup system is **already configured and working**. No additional environment variables are required!

## 🎯 **How It Works**

### **Automatic Backup (Default)**
- ✅ Runs automatically when your Node.js server starts
- ✅ Scheduled daily at **12:30 PM (Africa/Lagos time)**
- ✅ Uses your existing environment variables
- ✅ Backs up all MongoDB collections to Storj cloud storage

### **What Happens:**
1. When `index.js` starts, it calls `setupBackupCron()`
2. A cron job is scheduled to run daily at 12:30 PM
3. At the scheduled time, it:
   - Connects to MongoDB
   - Exports all collections
   - Compresses the data
   - Uploads to Storj
   - Records the backup in `backups/backup_tracker.json`

## 📋 **Required Environment Variables (Already Set)**

These are **already in your `.env` file**:

```env
# MongoDB (required)
DB=mongodb://your-connection-string

# Storj (required)
STORJ_ACCESS_KEY_ID=your_access_key
STORJ_SECRET_ACCESS_KEY=your_secret_key
STORJ_ENDPOINT=https://gateway.storjshare.io

# Optional (has defaults)
STORJ_BUCKET_BACKUP=database-backup  # Optional, defaults to "database-backup"
```

## ⚙️ **Optional Customization**

If you want to change the backup schedule, add these to your `.env`:

```env
# Custom backup schedule (optional)
BACKUP_CRON_SCHEDULE=30 12 * * *    # Default: 12:30 PM daily
BACKUP_CRON_TZ=Africa/Lagos         # Default: Africa/Lagos timezone
```

### **Schedule Format Examples:**
```env
# Every day at midnight
BACKUP_CRON_SCHEDULE=0 0 * * *

# Every day at 2:00 AM
BACKUP_CRON_SCHEDULE=0 2 * * *

# Every 6 hours
BACKUP_CRON_SCHEDULE=0 */6 * * *

# Every day at 10:15 PM
BACKUP_CRON_SCHEDULE=15 22 * * *
```

## 🧪 **Testing the Backup**

### **Test Manual Backup:**
```bash
node scripts/testBackup.js
```

### **Check Backup Status:**
```bash
node scripts/backupMonitor.js
```

### **View Backup History:**
Check `backups/backup_tracker.json` or use the admin API endpoint.

## ⚠️ **Important Notes**

### **1. Server Must Be Running**
- The cron job only runs when your Node.js server is running
- If the server stops, backups won't run until it restarts
- **Solution:** Use PM2 or systemd to keep the server running 24/7

### **2. PM2 Setup (Recommended for Production)**
```bash
# Install PM2
npm install -g pm2

# Start your server with PM2
pm2 start index.js --name "mmeko-api"

# Save PM2 configuration
pm2 save

# Set PM2 to start on boot
pm2 startup
```

### **3. Alternative: System Cron (More Reliable)**
For production, you can use a system-level cron job that runs independently:

**Linux/Mac:**
```bash
# Edit crontab
crontab -e

# Add this line (runs daily at 12:30 PM)
30 12 * * * cd /path/to/mmekoapi && node scripts/productionBackup.js >> /var/log/mongodb-backup.log 2>&1
```

**Windows (Task Scheduler):**
- Create a scheduled task that runs `node scripts/productionBackup.js` daily

## 📊 **Monitoring**

### **Check if Backup is Working:**
1. Look for this log when server starts:
   ```
   🕐 [BACKUP] Scheduling cron job -> "30 12 * * *" (Africa/Lagos)
   ✅ [BACKUP] Cron job started
   ```

2. Check logs at backup time:
   ```
   🗄️ [BACKUP] Cron triggered at 2025-11-10T12:30:00.000Z
   ✅ [BACKUP] Completed backup_2025-11-10_12-30-45.bson.gz in 53s
   ```

3. Run health check:
   ```bash
   node scripts/backupMonitor.js
   ```

## ✅ **Summary**

- ✅ **No new environment variables needed** - uses existing ones
- ✅ **Works automatically** when server is running
- ✅ **Backs up daily** at 12:30 PM (configurable)
- ✅ **Stores backups** in Storj cloud storage
- ✅ **Tracks history** in `backups/backup_tracker.json`

**Just make sure your server stays running 24/7 (use PM2 or systemd)!**

