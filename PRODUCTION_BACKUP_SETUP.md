# Production Backup Setup Guide

This guide explains how to set up automatic MongoDB backups for production environments.

## 🎯 **Current Setup vs Production Setup**

### **Current Setup (Development)**
- ✅ Cron job runs inside Node.js application
- ❌ Requires Node.js server to be running 24/7
- ❌ Backup stops if server restarts

### **Production Setup (Recommended)**
- ✅ System-level cron job runs independently
- ✅ Works even if Node.js server restarts
- ✅ More reliable for production environments

## 🚀 **Production Setup Instructions**

### **Step 1: Prepare Your Server**

1. **SSH into your production server**
2. **Navigate to your project directory**:
   ```bash
   cd /path/to/your/mmekoapi
   ```

### **Step 2: Install MongoDB Database Tools**

```bash
# For Ubuntu/Debian
wget -qO - https://www.mongodb.org/static/pgp/server-6.0.asc | sudo apt-key add -
echo "deb [ arch=amd64,arm64 ] https://repo.mongodb.org/apt/ubuntu focal/mongodb-org/6.0 multiverse" | sudo tee /etc/apt/sources.list.d/mongodb-org-6.0.list
sudo apt-get update
sudo apt-get install -y mongodb-database-tools

# For CentOS/RHEL
sudo yum install -y mongodb-database-tools

# For macOS
brew install mongodb/brew/mongodb-database-tools
```

### **Step 3: Test the Backup Script**

```bash
# Test the production backup script
node scripts/productionBackup.js
```

### **Step 4: Set Up System Cron Job**

1. **Open crontab editor**:
   ```bash
   crontab -e
   ```

2. **Add this line** (runs daily at 10:15 PM):
   ```bash
   15 22 * * * cd /path/to/your/mmekoapi && node scripts/productionBackup.js >> /var/log/mongodb-backup.log 2>&1
   ```

3. **Save and exit**

### **Step 5: Verify Cron Job**

```bash
# List current cron jobs
crontab -l

# Check if cron service is running
sudo systemctl status cron
```

## 📊 **Monitoring and Logs**

### **View Backup Logs**
```bash
# View recent backup logs
tail -f /var/log/mongodb-backup.log

# View all backup logs
cat /var/log/mongodb-backup.log
```

### **Test Cron Job Manually**
```bash
# Run the cron job manually to test
cd /path/to/your/mmekoapi && node scripts/productionBackup.js
```

## 🔧 **Alternative: Keep Current Setup**

If you prefer to keep the current Node.js cron setup:

### **For VPS/Cloud Servers:**
- Use **PM2** or **systemd** to keep your Node.js server running
- The cron job will execute automatically at 10:15 PM daily

### **PM2 Setup Example:**
```bash
# Install PM2
npm install -g pm2

# Start your application with PM2
pm2 start index.js --name "mmeko-api"

# Save PM2 configuration
pm2 save

# Set up PM2 to start on boot
pm2 startup
```

## 🌐 **Cloud-Based Solutions**

### **GitHub Actions (Free)**
Create `.github/workflows/backup.yml`:
```yaml
name: MongoDB Backup
on:
  schedule:
    - cron: '15 22 * * *'  # 10:15 PM daily
  workflow_dispatch:  # Allow manual trigger

jobs:
  backup:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v2
      - name: Setup Node.js
        uses: actions/setup-node@v2
        with:
          node-version: '18'
      - name: Install dependencies
        run: |
          cd mmekoapi
          npm install
      - name: Run backup
        run: |
          cd mmekoapi
          node scripts/productionBackup.js
        env:
          STORJ_ACCESS_KEY_ID: ${{ secrets.STORJ_ACCESS_KEY_ID }}
          STORJ_SECRET_ACCESS_KEY: ${{ secrets.STORJ_SECRET_ACCESS_KEY }}
          STORJ_ENDPOINT: ${{ secrets.STORJ_ENDPOINT }}
          MONGODB_URI: ${{ secrets.MONGODB_URI }}
```

## 📝 **Environment Variables**

Make sure these are set in your production environment:
```bash
STORJ_ACCESS_KEY_ID=your_access_key
STORJ_SECRET_ACCESS_KEY=your_secret_key
STORJ_ENDPOINT=https://gateway.storjshare.io
MONGODB_URI=mongodb://localhost:27017/your_database
MONGODB_DB_NAME=your_database_name
```

## ✅ **Verification Checklist**

- [ ] MongoDB Database Tools installed
- [ ] Backup script tested manually
- [ ] Cron job added to crontab
- [ ] Environment variables configured
- [ ] Log file permissions set
- [ ] Backup runs successfully
- [ ] Files uploaded to Storj
- [ ] Admin interface shows backup history

## 🆘 **Troubleshooting**

### **Cron Job Not Running**
```bash
# Check cron service status
sudo systemctl status cron

# Check cron logs
sudo tail -f /var/log/cron

# Test cron job manually
cd /path/to/your/mmekoapi && node scripts/productionBackup.js
```

### **Permission Issues**
```bash
# Make script executable
chmod +x scripts/productionBackup.js

# Check file permissions
ls -la scripts/productionBackup.js
```

### **MongoDB Connection Issues**
```bash
# Test MongoDB connection
mongosh "your_mongodb_uri"

# Test mongodump
mongodump --uri="your_mongodb_uri" --db="your_database" --out="/tmp/test_backup"
```
