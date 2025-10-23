# 🚨 Production Backup System - Fix Guide

## 🔍 **Issues Identified**

Based on the backup monitor analysis, here are the main problems:

1. **❌ Storj Access Denied** - Credentials or bucket permissions issue
2. **❌ No Recent Backups** - Last backup was 2 days ago
3. **❌ Missing MONGODB_URI** - Environment variable not set
4. **❌ No Cron Job Setup** - Backups not running automatically
5. **⚠️ AWS SDK v2 Deprecation** - Using outdated SDK

## 🛠️ **Immediate Fixes**

### **Step 1: Fix Environment Variables**

Create or update your `.env` file:

```bash
# Copy the example file
cp .env.example .env

# Edit the file
nano .env
```

Add these variables:
```env
# MongoDB Configuration
DB=mongodb://localhost:27017/mmeko
MONGODB_URI=mongodb://localhost:27017/mmeko
MONGO_URI=mongodb://localhost:27017/mmeko

# Storj Configuration (UPDATE THESE WITH YOUR ACTUAL CREDENTIALS)
STORJ_ACCESS_KEY_ID=your_actual_storj_access_key
STORJ_SECRET_ACCESS_KEY=your_actual_storj_secret_key
STORJ_ENDPOINT=https://gateway.storjshare.io
STORJ_BUCKET_BACKUP=database-backup

# Production Settings
NODE_ENV=production
PORT=3100
```

### **Step 2: Test Storj Connection**

```bash
# Test the backup script
node scripts/productionBackup.js
```

If you get "Access Denied" error:
1. **Check Storj credentials** - Make sure they're correct
2. **Verify bucket exists** - Create bucket if needed
3. **Check bucket permissions** - Ensure your credentials have write access

### **Step 3: Set Up Automatic Backups**

#### **Option A: System Cron Job (Recommended for Production)**

```bash
# Open crontab editor
crontab -e

# Add this line (replace /path/to/your/mmekoapi with actual path)
15 22 * * * cd /path/to/your/mmekoapi && node scripts/productionBackup.js >> /var/log/mongodb-backup.log 2>&1

# Save and exit
```

#### **Option B: PM2 with Cron (Alternative)**

```bash
# Install PM2
npm install -g pm2

# Start your app with PM2
pm2 start ecosystem.config.js

# Save PM2 configuration
pm2 save

# Set up PM2 to start on boot
pm2 startup
```

### **Step 4: Monitor Backup Health**

```bash
# Run health check
node scripts/backupMonitor.js

# Check backup status via API
curl -H "Authorization: Bearer YOUR_ADMIN_TOKEN" http://localhost:3100/api/backup/status
```

## 🔧 **Advanced Configuration**

### **Create Storj Bucket (if needed)**

If the `database-backup` bucket doesn't exist:

1. **Via Storj Console:**
   - Go to https://console.storj.io/
   - Create a new bucket named `database-backup`
   - Set appropriate permissions

2. **Via AWS CLI:**
   ```bash
   aws s3 mb s3://database-backup --endpoint-url https://gateway.storjshare.io
   ```

### **Update AWS SDK (Optional)**

To fix the deprecation warning:

```bash
# Install AWS SDK v3
npm install @aws-sdk/client-s3

# Update scripts to use v3 (see migration guide)
```

### **Enhanced Logging**

Add to your `.env`:
```env
# Logging
LOG_LEVEL=info
BACKUP_LOG_FILE=/var/log/mongodb-backup.log
```

## 📊 **Monitoring & Alerts**

### **Daily Health Check Script**

Create `scripts/dailyHealthCheck.js`:
```javascript
const { exec } = require('child_process');

exec('node scripts/backupMonitor.js', (error, stdout, stderr) => {
  if (error) {
    console.error('Health check failed:', error);
    // Send alert email/SMS here
  }
  console.log(stdout);
});
```

### **Backup Status API**

Access backup status via:
- `GET /api/backup/status` - Current status
- `GET /api/backup/stats` - Statistics
- `POST /api/backup/trigger` - Manual backup
- `POST /api/backup/cleanup` - Clean old backups

## 🚨 **Troubleshooting**

### **Common Issues**

1. **"Access Denied" Error:**
   ```bash
   # Check credentials
   node scripts/backupMonitor.js
   
   # Test Storj connection manually
   node -e "
   const AWS = require('aws-sdk');
   const s3 = new AWS.S3({
     endpoint: process.env.STORJ_ENDPOINT,
     accessKeyId: process.env.STORJ_ACCESS_KEY_ID,
     secretAccessKey: process.env.STORJ_SECRET_ACCESS_KEY,
     s3ForcePathStyle: true
   });
   s3.listBuckets().promise().then(console.log).catch(console.error);
   "
   ```

2. **MongoDB Connection Issues:**
   ```bash
   # Test MongoDB connection
   mongosh "mongodb://localhost:27017/mmeko"
   
   # Check if MongoDB is running
   sudo systemctl status mongod
   ```

3. **Cron Job Not Running:**
   ```bash
   # Check cron service
   sudo systemctl status cron
   
   # Check cron logs
   sudo tail -f /var/log/cron
   
   # Test cron job manually
   cd /path/to/your/mmekoapi && node scripts/productionBackup.js
   ```

### **Emergency Manual Backup**

If automatic backups fail:

```bash
# Run manual backup
node scripts/productionBackup.js

# Check backup status
node scripts/backupMonitor.js

# View backup history
cat backups/backup_tracker.json
```

## ✅ **Verification Checklist**

- [ ] Environment variables configured correctly
- [ ] Storj connection successful
- [ ] MongoDB connection working
- [ ] Backup script runs without errors
- [ ] Cron job or PM2 configured
- [ ] Backup files appear in Storj bucket
- [ ] Health monitor shows 100% health
- [ ] Recent backups in tracker file

## 📞 **Support**

If you continue to have issues:

1. **Run diagnostics:**
   ```bash
   node scripts/backupMonitor.js
   ```

2. **Check logs:**
   ```bash
   tail -f /var/log/mongodb-backup.log
   ```

3. **Test individual components:**
   ```bash
   # Test MongoDB
   mongosh "your_mongodb_uri"
   
   # Test Storj
   node scripts/productionBackup.js
   
   # Test cron
   crontab -l
   ```

## 🎯 **Expected Results**

After implementing these fixes:

- ✅ **Daily automatic backups** at 10:15 PM UTC
- ✅ **Backups stored in Storj** cloud storage
- ✅ **Health monitoring** with 100% status
- ✅ **30-day retention** with automatic cleanup
- ✅ **Admin dashboard** showing backup history
- ✅ **Manual backup triggers** available

Your backup system should now be fully operational in production! 🚀
