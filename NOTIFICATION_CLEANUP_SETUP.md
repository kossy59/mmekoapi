# Notification Cleanup System

This document describes the automatic notification cleanup system that deletes notifications older than 30 days to keep the database clean and performant.

## 🎯 Overview

The notification cleanup system automatically removes notifications that are older than 30 days from the `admindb` collection. This helps:
- Keep the database size manageable
- Improve query performance
- Maintain system efficiency
- Free up storage space

## 📁 Files Created

### Core Scripts
- `scripts/cleanupOldNotifications.js` - Main cleanup logic
- `scripts/setupNotificationCleanup.js` - Cron job setup
- `scripts/testNotificationCleanup.js` - Testing script

### API Endpoints
- `Controller/Admin/notificationCleanup.js` - API controllers
- `routes/api/Admin/notificationCleanupRoutes.js` - API routes

### Integration
- Updated `index.js` to start automatic cleanup
- Added route `/api/admin/notifications/*` for manual management

## 🚀 Features

### Automatic Cleanup
- **Schedule**: Runs daily at 2:00 AM UTC
- **Criteria**: Deletes notifications older than 30 days
- **Logging**: Comprehensive logging of cleanup operations
- **Error Handling**: Robust error handling and recovery

### Manual Management
- **API Endpoints**: Admin-only endpoints for manual cleanup
- **Statistics**: Get detailed notification statistics
- **Preview**: See what notifications would be deleted
- **Testing**: Safe testing without affecting production

## 🔧 API Endpoints

All endpoints require admin authentication.

### Get Statistics
```
GET /api/admin/notifications/stats
```
Returns notification statistics including total count, read/unread counts, and age distribution.

**Response:**
```json
{
  "ok": true,
  "message": "Notification statistics retrieved successfully",
  "stats": {
    "total": 1500,
    "unread": 45,
    "read": 1455,
    "byAge": {
      "last24Hours": 12,
      "lastWeek": 89,
      "lastMonth": 456,
      "olderThanMonth": 1044
    }
  }
}
```

### Preview Cleanup
```
GET /api/admin/notifications/cleanup-preview
```
Shows notifications that would be deleted in the next cleanup.

**Response:**
```json
{
  "ok": true,
  "message": "Found 1044 notifications older than 30 days",
  "totalOldCount": 1044,
  "preview": [
    {
      "id": "...",
      "userid": "...",
      "message": "User liked your post",
      "seen": false,
      "createdAt": "2024-01-15T10:30:00.000Z"
    }
  ],
  "cutoffDate": "2024-01-15T00:00:00.000Z"
}
```

### Manual Cleanup
```
DELETE /api/admin/notifications/cleanup
```
Manually triggers cleanup of old notifications.

**Response:**
```json
{
  "ok": true,
  "message": "Successfully deleted 1044 notifications older than 30 days",
  "deletedCount": 1044,
  "remainingCount": 456
}
```

## 🧪 Testing

### Run Test Script
```bash
cd mmekoapi
node scripts/testNotificationCleanup.js
```

This will:
- Connect to the database
- Show current statistics
- Preview what would be deleted
- **NOT** actually delete anything (safe for testing)

### Manual Testing
1. **Check Statistics**: Use the stats API to see current state
2. **Preview Cleanup**: Use the preview API to see what would be deleted
3. **Run Manual Cleanup**: Use the manual cleanup API to test deletion
4. **Verify Results**: Check statistics again to confirm cleanup worked

## ⚙️ Configuration

### Environment Variables
No additional environment variables are required. The system uses:
- `MONGODB_URI` - Database connection string
- Existing database connection from the main application

### Cleanup Schedule
- **Default**: Daily at 2:00 AM UTC
- **Modifiable**: Change in `scripts/setupNotificationCleanup.js`
- **Cron Expression**: `'0 2 * * *'` (2:00 AM daily)

### Age Threshold
- **Default**: 30 days
- **Modifiable**: Change in `scripts/cleanupOldNotifications.js`
- **Logic**: `thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30)`

## 📊 Monitoring

### Logs
The system provides comprehensive logging:
- Cleanup start/completion
- Number of notifications deleted
- Error handling and recovery
- Statistics updates

### Example Log Output
```
🧹 [NOTIFICATION CLEANUP] Starting cleanup of old notifications...
📅 [NOTIFICATION CLEANUP] Deleting notifications older than: 2024-01-15T00:00:00.000Z
🔍 [NOTIFICATION CLEANUP] Found 1044 notifications to delete
🗑️ [NOTIFICATION CLEANUP] Successfully deleted 1044 notifications
📊 [NOTIFICATION CLEANUP] Remaining notifications in database: 456
✅ [NOTIFICATION CLEANUP] Daily cleanup completed: Successfully deleted 1044 notifications older than 30 days
```

## 🛡️ Safety Features

### Admin-Only Access
- All API endpoints require admin authentication
- Uses existing `isAdmin` middleware
- Prevents unauthorized access

### Safe Testing
- Test script doesn't actually delete data
- Preview functionality shows what would be deleted
- Manual cleanup requires explicit API call

### Error Handling
- Comprehensive try-catch blocks
- Graceful error recovery
- Detailed error logging
- Non-blocking operation (cleanup failures don't crash the app)

## 🔄 Maintenance

### Regular Monitoring
1. Check cleanup logs daily
2. Monitor database size reduction
3. Verify API endpoints are working
4. Review statistics regularly

### Troubleshooting
- **Cleanup not running**: Check cron job setup in logs
- **API errors**: Verify admin authentication
- **Database issues**: Check MongoDB connection
- **Performance**: Monitor cleanup execution time

### Manual Intervention
If automatic cleanup fails:
1. Use manual cleanup API
2. Check database connectivity
3. Review error logs
4. Restart the application if needed

## 📈 Performance Impact

### Benefits
- Reduced database size
- Faster notification queries
- Improved system performance
- Better storage utilization

### Considerations
- Cleanup runs during low-traffic hours (2:00 AM)
- Minimal impact on user experience
- Efficient MongoDB queries
- Non-blocking operation

## 🚀 Deployment

The notification cleanup system is automatically enabled when the application starts. No additional deployment steps are required.

### Production Checklist
- [ ] Verify cron job is running (check logs)
- [ ] Test API endpoints with admin credentials
- [ ] Monitor first cleanup execution
- [ ] Verify database size reduction
- [ ] Set up monitoring alerts if needed

## 📝 Notes

- The system only affects the `admindb` collection
- Notifications are permanently deleted (no recovery)
- Cleanup is based on `createdAt` timestamp
- System respects MongoDB connection limits
- Compatible with existing notification system
