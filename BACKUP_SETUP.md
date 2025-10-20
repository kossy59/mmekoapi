# MongoDB Backup System

This system automatically backs up your MongoDB database to Storj cloud storage every 24 hours at 22:15 UTC (10:15 PM).

## Features

- ✅ **Automatic Daily Backups**: Runs every day at 22:15 UTC (10:15 PM)
- ✅ **Storj Cloud Storage**: Backups stored in the `database-backup` bucket
- ✅ **BSON Format**: Uses MongoDB's native BSON format for efficient storage
- ✅ **Compression**: Backups are compressed as `.tar.gz` files
- ✅ **Auto Cleanup**: Backups older than 31 days are automatically deleted
- ✅ **Admin Interface**: Web interface for monitoring and manual operations
- ✅ **Manual Triggers**: On-demand backup and cleanup operations

## Setup

### 1. Install Dependencies

```bash
npm install node-cron
```

### 2. Environment Variables

Ensure these environment variables are set in your `.env` file:

```env
# Storj Configuration
STORJ_ACCESS_KEY_ID=your_access_key
STORJ_SECRET_ACCESS_KEY=your_secret_key
STORJ_ENDPOINT=https://gateway.storjshare.io

# MongoDB Configuration
MONGODB_URI=mongodb://localhost:27017/your_database
MONGODB_DB_NAME=your_database_name
```

### 3. MongoDB Tools

Install MongoDB Database Tools (includes `mongodump`):

**Ubuntu/Debian:**
```bash
wget -qO - https://www.mongodb.org/static/pgp/server-6.0.asc | sudo apt-key add -
echo "deb [ arch=amd64,arm64 ] https://repo.mongodb.org/apt/ubuntu focal/mongodb-org/6.0 multiverse" | sudo tee /etc/apt/sources.list.d/mongodb-org-6.0.list
sudo apt-get update
sudo apt-get install -y mongodb-database-tools
```

**macOS:**
```bash
brew install mongodb/brew/mongodb-database-tools
```

**Windows:**
Download from: https://docs.mongodb.com/database-tools/installation/installation-windows/

### 4. Run Setup Script

```bash
node scripts/setupBackup.js
```

This script will:
- Check environment variables
- Verify MongoDB connection
- Test Storj connection
- Create backup bucket if needed
- Create local backup directory

### 5. Start the Server

The backup cron job will start automatically when you start your server:

```bash
npm start
```

## Usage

### Automatic Backups

Backups run automatically every day at 22:15 UTC (10:15 PM). No manual intervention required.

### Manual Operations

Access the admin panel at `/mmeko/admin` and navigate to "Backup Management":

- **Trigger Manual Backup**: Create a backup immediately
- **Cleanup Old Backups**: Remove backups older than 31 days
- **View Backup History**: See all available backups
- **Monitor Status**: Check backup statistics and health

### API Endpoints

All endpoints require admin authentication:

- `GET /api/backup/status` - Get backup status and history
- `POST /api/backup/trigger` - Trigger manual backup
- `POST /api/backup/cleanup` - Clean up old backups
- `GET /api/backup/stats` - Get backup statistics

## Backup Details

### File Naming
- Format: `backup_YYYY-MM-DD.tar.gz`
- Example: `backup_2025-01-20.tar.gz`

### Storage Location
- **Bucket**: `database-backup`
- **Provider**: Storj cloud storage
- **Format**: Compressed BSON dump

### Backup Contents
- Complete MongoDB database dump in BSON format
- All collections and documents
- Database metadata and indexes

## Monitoring

### Logs
Backup operations are logged with timestamps:
```
[MongoDB Backup] Starting backup: backup_2025-01-20
[Storj Upload] Upload successful: https://gateway.storjshare.io/database-backup/backup_2025-01-20.tar.gz
[Cleanup] Deleted 3 old backups
```

### Admin Dashboard
The admin interface shows:
- Total number of backups
- Total storage used
- Days since last backup
- Backup history with sizes and dates
- Monthly statistics
- Size distribution

## Troubleshooting

### Common Issues

**1. mongodump not found**
```bash
# Install MongoDB Database Tools
# See installation instructions above
```

**2. Storj connection failed**
- Check your Storj credentials
- Verify the endpoint URL
- Ensure the bucket exists

**3. MongoDB connection failed**
- Check your MongoDB URI
- Ensure MongoDB is running
- Verify database permissions

**4. Backup fails**
- Check disk space for temporary files
- Verify MongoDB is accessible
- Check network connectivity to Storj

### Manual Backup Test

Test the backup system manually:

```bash
node scripts/mongodbBackup.js
```

### Check Cron Job

The cron job runs automatically. Check server logs for:
```
[Cron Setup] MongoDB backup cron job scheduled for 00:00 UTC daily
[Cron] Starting scheduled MongoDB backup...
```

## Security

- All backup operations require admin authentication
- Backups are encrypted in transit to Storj
- Local temporary files are automatically cleaned up
- Access to backup management is restricted to admin users

## Maintenance

### Regular Tasks
- Monitor backup success/failure in admin panel
- Check storage usage and costs
- Verify backup integrity periodically

### Storage Management
- Backups older than 31 days are automatically deleted
- Manual cleanup available in admin panel
- Monitor Storj storage limits

## Support

For issues or questions:
1. Check the logs for error messages
2. Verify environment configuration
3. Test connections manually
4. Check MongoDB and Storj service status
