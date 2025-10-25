# Pending Balance Refund System

## Problem Description

When fans make requests to creators, their balance is deducted and moved to "pending" status. This pending balance is tied to the creator's portfolio ID. However, if a creator deletes their portfolio after fans have made requests, the fans' money gets stuck in "pending" status because:

1. The creator portfolio no longer exists
2. The creator can't accept/decline the request
3. The request remains in "pending" status indefinitely
4. The fan's balance stays in "pending" state forever

## Solution Overview

This system automatically handles pending balances when creator portfolios are deleted by:

1. **Real-time Refunds**: When a creator deletes their portfolio, all pending requests are automatically refunded
2. **Cleanup Script**: For portfolios that were already deleted, a cleanup script finds and refunds orphaned pending balances
3. **Admin Monitoring**: Admin endpoints to monitor and manually trigger cleanup

## System Components

### 1. Core Refund Script (`scripts/refundPendingBalances.js`)

**Main Functions:**
- `refundPendingBalances()` - Scans all pending requests and refunds users if portfolio is deleted
- `processPortfolioDeletionRefund(creatorPortfolioId)` - Processes refunds when a specific portfolio is deleted
- `getPendingBalanceStats()` - Returns statistics about pending balances

**Key Features:**
- Automatically refunds users when portfolios are deleted
- Updates request status to "cancelled"
- Creates transaction history entries
- Handles errors gracefully

### 2. Portfolio Deletion Handler (`Controller/Creator/deletecreator.js`)

**Updated Features:**
- Automatically processes refunds BEFORE deleting the portfolio
- Refunds all pending requests for the portfolio being deleted
- Logs refund processing results
- Doesn't fail portfolio deletion if refund processing fails

### 3. Cleanup Script (`scripts/cleanupDeletedPortfolios.js`)

**Usage:**
```bash
# Run cleanup for already deleted portfolios
node scripts/cleanupDeletedPortfolios.js
```

**Features:**
- Finds all pending requests where creator portfolio no longer exists
- Refunds users their pending balances
- Provides detailed statistics
- Handles errors gracefully

### 4. Admin API Endpoints (`Controller/Admin/pendingBalanceController.js`)

**Endpoints:**
- `GET /api/pending-balance/stats` - Get pending balance statistics
- `POST /api/pending-balance/cleanup` - Manually trigger cleanup
- `GET /api/pending-balance/orphaned` - Get list of orphaned requests

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
    }
  }
}
```

## How It Works

### Real-time Refund Process

1. **Creator deletes portfolio** → `deletecreator.js` is called
2. **Before deletion** → `processPortfolioDeletionRefund()` is called
3. **Find pending requests** → All requests for that portfolio ID
4. **Refund users** → Move money from pending back to balance
5. **Update request status** → Mark requests as "cancelled"
6. **Create transaction history** → Log refund transactions
7. **Delete portfolio** → Proceed with normal deletion

### Cleanup Process for Already Deleted Portfolios

1. **Scan all pending requests** → Find requests with status "request" or "pending"
2. **Check portfolio existence** → Verify if creator portfolio still exists
3. **Identify orphaned requests** → Requests where portfolio doesn't exist
4. **Refund users** → Move money from pending back to balance
5. **Update request status** → Mark requests as "cancelled"
6. **Create transaction history** → Log refund transactions

## Usage Examples

### Manual Cleanup

```bash
# Run cleanup script
node scripts/cleanupDeletedPortfolios.js

# Check statistics via API
curl -X GET "http://localhost:3100/api/pending-balance/stats" \
     -H "Authorization: Bearer YOUR_ADMIN_TOKEN"

# Trigger manual cleanup via API
curl -X POST "http://localhost:3100/api/pending-balance/cleanup" \
     -H "Authorization: Bearer YOUR_ADMIN_TOKEN"
```

### Admin Monitoring

```bash
# Get current statistics
curl -X GET "http://localhost:3100/api/pending-balance/stats" \
     -H "Authorization: Bearer YOUR_ADMIN_TOKEN"

# Get orphaned requests details
curl -X GET "http://localhost:3100/api/pending-balance/orphaned" \
     -H "Authorization: Bearer YOUR_ADMIN_TOKEN"

# Trigger cleanup
curl -X POST "http://localhost:3100/api/pending-balance/cleanup" \
     -H "Authorization: Bearer YOUR_ADMIN_TOKEN"
```

## Database Changes

### User Balance Updates

When a refund is processed:
```javascript
// Before refund
user.balance = "50.00"    // Available balance
user.pending = "100.00"   // Stuck in pending

// After refund
user.balance = "150.00"    // Refunded amount added back
user.pending = "0.00"      // Pending amount cleared
```

### Request Status Updates

```javascript
// Before cleanup
request.status = "request"  // Stuck in pending

// After cleanup
request.status = "cancelled" // Marked as cancelled
```

### Transaction History

Each refund creates a transaction history entry:
```javascript
{
  userid: "user123",
  details: "Refund for deleted portfolio - Fan meet request",
  spent: "0",
  income: "100.00",
  date: "1703123456789"
}
```

## Error Handling

The system includes comprehensive error handling:

1. **Database Connection Errors** - Logged and handled gracefully
2. **Individual Request Errors** - Processed individually, doesn't stop the entire cleanup
3. **Portfolio Deletion Errors** - Refund processing doesn't fail the deletion
4. **API Errors** - Proper error responses with status codes

## Monitoring and Logging

### Console Logs

```
Starting refund process for deleted portfolios...
Found 15 pending requests to check
Portfolio portfolio123 not found for request req456
Refunded 50.00 to user user789 for deleted portfolio portfolio123
Refund process completed:
- Requests processed: 15
- Users refunded: 3
- Total refund amount: 150.00
- Requests cancelled: 3
```

### API Response Logs

```json
{
  "ok": true,
  "message": "Cleanup completed successfully",
  "data": {
    "processed": 15,
    "refunded": 3,
    "totalAmount": 150.00,
    "cancelledRequests": 3
  }
}
```

## Security Considerations

- All admin endpoints require authentication
- Cleanup operations are logged for audit trails
- No sensitive data is exposed in logs
- Database operations use proper error handling
- Refund processing doesn't fail portfolio deletion

## Performance Impact

- **Minimal Impact**: Refunds only run when portfolios are deleted
- **Efficient Queries**: Uses indexed fields for lookups
- **Batch Processing**: Processes requests in batches
- **Non-blocking**: Doesn't affect normal operations

## Testing

### Test Scenario

1. **Create test data:**
   - Create a user with balance
   - Create a creator portfolio
   - Create a fan meet request (money goes to pending)
   - Delete the creator portfolio

2. **Verify results:**
   - User's balance should be refunded
   - Request status should be "cancelled"
   - Transaction history should show refund

### Manual Testing

```bash
# Test the cleanup script
node scripts/cleanupDeletedPortfolios.js

# Test API endpoints
curl -X GET "http://localhost:3100/api/pending-balance/stats"
```

## Troubleshooting

### Common Issues

1. **Cleanup not running:**
   - Check if the script has proper permissions
   - Verify database connection
   - Check console logs for errors

2. **Refunds not processed:**
   - Verify portfolio deletion
   - Check user balance updates
   - Review transaction history

3. **High orphaned request count:**
   - Check for portfolio deletion patterns
   - Verify cleanup is running
   - Consider running cleanup more frequently

### Debug Commands

```bash
# Check current stats
curl -X GET "http://localhost:3100/api/pending-balance/stats"

# Run cleanup with detailed output
node scripts/cleanupDeletedPortfolios.js

# Check database directly
# (Use MongoDB client to query requests and users collections)
```

## Future Enhancements

1. **Automated Cleanup**: Schedule cleanup to run periodically
2. **Email Notifications**: Notify users when refunds are processed
3. **Analytics Dashboard**: Web interface for monitoring
4. **Batch Processing**: Process refunds in larger batches
5. **Real-time Monitoring**: WebSocket updates for admin dashboard

## Support

For issues or questions about the pending balance refund system:
1. Check the logs for error messages
2. Use the admin API endpoints for status
3. Review the database for data consistency
4. Contact the development team with specific error messages
