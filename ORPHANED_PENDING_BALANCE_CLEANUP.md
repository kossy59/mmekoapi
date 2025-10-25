# Orphaned Pending Balance Cleanup System

## Overview

This system automatically handles pending balances when creator portfolios are deleted. When a creator deletes their portfolio, any pending fan meet requests are automatically refunded to the users.

## Problem Solved

Previously, when a creator deleted their portfolio, users who had pending fan meet requests would lose their money because:
1. The portfolio no longer exists
2. The creator can't accept/decline the request
3. The request would remain in "pending" status indefinitely
4. The user's balance would stay in "pending" state

## Solution Components

### 1. Core Cleanup Script (`scripts/cleanupOrphanedPendingBalances.js`)

**Main Functions:**
- `cleanupOrphanedPendingBalances()` - Scans all pending requests and refunds users if portfolio is deleted
- `validatePortfolioExists(creatorPortfolioId)` - Checks if a portfolio exists
- `processPortfolioDeletionRefund(creatorPortfolioId)` - Processes refunds when a specific portfolio is deleted
- `getPendingBalanceStats()` - Returns statistics about pending balances

**Key Features:**
- Automatically refunds users when portfolios are deleted
- Updates request status to "cancelled"
- Creates transaction history entries
- Handles errors gracefully

### 2. Scheduled Cleanup (`scripts/scheduledCleanup.js`)

**Features:**
- Runs every 6 hours automatically
- Prevents duplicate runs
- Provides status monitoring
- Manual trigger capability

**Usage:**
```javascript
const scheduledCleanup = require('./scripts/scheduledCleanup');

// Start the scheduler
scheduledCleanup.start();

// Get status
const status = scheduledCleanup.getStatus();

// Manual trigger
await scheduledCleanup.manualCleanup();
```

### 3. CLI Tool (`scripts/runCleanup.js`)

**Usage:**
```bash
# Run cleanup with stats
node scripts/runCleanup.js --stats

# Dry run (no changes)
node scripts/runCleanup.js --dry-run

# Basic cleanup
node scripts/runCleanup.js
```

### 4. Admin API Endpoints (`Controller/Admin/cleanupStatus.js`)

**Endpoints:**
- `GET /api/cleanup/status` - Get cleanup statistics and service status
- `POST /api/cleanup/trigger` - Manually trigger cleanup
- `GET /api/cleanup/orphaned` - Get list of orphaned requests

**Example Response:**
```json
{
  "ok": true,
  "data": {
    "statistics": {
      "totalPendingRequests": 15,
      "orphanedRequests": 3,
      "orphanedAmount": 150.00,
      "orphanedPortfolios": ["portfolio1", "portfolio2"]
    },
    "cleanupService": {
      "isRunning": false,
      "lastRun": "2024-01-15T10:30:00Z",
      "nextRun": "2024-01-15T16:30:00Z"
    }
  }
}
```

## Integration Points

### 1. Portfolio Deletion Handler

The `deletecreator.js` controller now automatically processes refunds when a portfolio is deleted:

```javascript
// Process refunds for pending requests before portfolio deletion
try {
  const refundResult = await processPortfolioDeletionRefund(hostid);
  if (refundResult.success) {
    console.log(`Processed ${refundResult.processed} refunds totaling ${refundResult.totalAmount}`);
  }
} catch (refundError) {
  console.error("Error processing refunds for deleted portfolio:", refundError);
}
```

### 2. Automatic Startup

The cleanup service starts automatically when the server starts:

```javascript
// In index.js
mongoose.connection.once("open", () => {
  // ... other startup code
  
  // Start orphaned pending balances cleanup scheduler
  scheduledCleanup.start();
});
```

## Monitoring and Logging

### Logs Generated

The system generates comprehensive logs:

```
Starting cleanup of orphaned pending balances...
Found 15 pending requests to check
Portfolio portfolio123 not found for request req456
Refunded 50.00 to user user789 for deleted portfolio portfolio123
Cleanup completed:
- Requests processed: 15
- Users refunded: 3
- Total refund amount: 150.00
- Requests cancelled: 3
```

### Status Monitoring

The system provides real-time status through:
- Admin API endpoints
- Console logs
- Service status tracking

## Configuration

### Environment Variables

No additional environment variables are required. The system uses the existing MongoDB connection.

### Schedule Configuration

The cleanup runs every 6 hours by default. To change this, modify the cron expression in `scheduledCleanup.js`:

```javascript
// Change from every 6 hours to every 2 hours
this.cleanupTask = cron.schedule('0 */2 * * *', async () => {
  await this.runCleanup();
});
```

## Error Handling

The system includes comprehensive error handling:

1. **Database Connection Errors** - Logged and handled gracefully
2. **Individual Request Errors** - Processed individually, doesn't stop the entire cleanup
3. **Portfolio Deletion Errors** - Refund processing doesn't fail the deletion
4. **Scheduler Errors** - Logged and continues running

## Testing

### Manual Testing

1. **Create a test scenario:**
   - Create a user with balance
   - Create a creator portfolio
   - Create a fan meet request (money goes to pending)
   - Delete the creator portfolio
   - Run cleanup manually

2. **Check results:**
   - User's balance should be refunded
   - Request status should be "cancelled"
   - Transaction history should show refund

### Automated Testing

Use the CLI tool to test:

```bash
# Check current stats
node scripts/runCleanup.js --stats

# Run cleanup
node scripts/runCleanup.js
```

## Maintenance

### Regular Monitoring

1. **Check cleanup status:**
   ```bash
   curl -X GET "http://localhost:3100/api/cleanup/status" \
        -H "Authorization: Bearer YOUR_ADMIN_TOKEN"
   ```

2. **View orphaned requests:**
   ```bash
   curl -X GET "http://localhost:3100/api/cleanup/orphaned" \
        -H "Authorization: Bearer YOUR_ADMIN_TOKEN"
   ```

### Manual Cleanup

If needed, manually trigger cleanup:

```bash
# Via API
curl -X POST "http://localhost:3100/api/cleanup/trigger" \
     -H "Authorization: Bearer YOUR_ADMIN_TOKEN"

# Via CLI
node scripts/runCleanup.js
```

## Security Considerations

- All admin endpoints require authentication
- Cleanup operations are logged for audit trails
- No sensitive data is exposed in logs
- Database operations use proper error handling

## Performance Impact

- **Minimal Impact:** Cleanup runs every 6 hours
- **Efficient Queries:** Uses indexed fields for lookups
- **Batch Processing:** Processes requests in batches
- **Non-blocking:** Doesn't affect normal operations

## Troubleshooting

### Common Issues

1. **Cleanup not running:**
   - Check if the service is started
   - Verify database connection
   - Check console logs for errors

2. **Refunds not processed:**
   - Verify portfolio deletion
   - Check user balance updates
   - Review transaction history

3. **High orphaned request count:**
   - Check for portfolio deletion patterns
   - Verify cleanup is running
   - Consider adjusting schedule frequency

### Debug Commands

```bash
# Check service status
curl -X GET "http://localhost:3100/api/cleanup/status"

# Manual cleanup with detailed output
node scripts/runCleanup.js --stats

# Check database directly
# (Use MongoDB client to query requests and users collections)
```

## Future Enhancements

1. **Real-time Notifications:** Notify users when refunds are processed
2. **Analytics Dashboard:** Web interface for monitoring
3. **Custom Schedules:** Per-environment cleanup schedules
4. **Batch Size Configuration:** Configurable batch processing sizes
5. **Email Notifications:** Admin notifications for cleanup results

## Support

For issues or questions about the cleanup system:
1. Check the logs for error messages
2. Use the admin API endpoints for status
3. Review the database for data consistency
4. Contact the development team with specific error messages
