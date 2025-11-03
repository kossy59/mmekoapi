# Expired Requests Automatic Refund System - Implementation & Verification

## Overview
This document explains the automatic expiration and refund system for fan meet/fan date requests, ensuring fans receive their pending_gold back when requests expire.

## Requirements Verified

### ✅ 1. Pending Requests (24-hour expiration)
- **Requirement**: If a creator doesn't accept within 24 hours, the request should be marked as expired and fan should receive pending_gold back
- **Implementation**:
  - When a fan creates a request (`requesthost.js`), `expiresAt` is set to 23h 14m from creation
  - `processExpiredRequests` finds all requests with `status: "request"` and `expiresAt < now`
  - Automatically refunds pending_gold back to balance
  - Marks request as expired

### ✅ 2. Accepted Requests (7-day expiration)
- **Requirement**: If a fan doesn't mark as complete after 7 days, the request should be marked as expired and fan should receive pending_gold back
- **Implementation**:
  - `processExpiredRequests` finds all accepted requests older than 7 days (non-Fan Call)
  - Automatically refunds pending_gold back to balance
  - Marks request as expired
  - Note: Fan Call requests expire after 48 hours and don't require refund (no deduction on creation)

## Key Features

### Automatic Processing
- **Cron Job**: Runs every 5 minutes automatically (`scheduledExpiredRequests.js`)
- **Manual Trigger**: Available via POST `/process-expired` endpoint
- **Startup**: Processes expired requests 10 seconds after server startup

### Refund Logic
- **Fan Meet & Fan Date**: Full refund of pending_gold when expired
- **Fan Call**: No refund (no deduction on creation)
- **Partial Refund Handling**: If pending is less than expected, refunds what's available and logs warning
- **Safety Check**: Only refunds if pending > 0 and refundAmount > 0

### Notification System
- Sends email and push notifications to fan when request expires
- Sends email and push notifications to creator when request expires
- Creates transaction history entry for refund

## Files Modified/Created

### New Files
1. **`scripts/scheduledExpiredRequests.js`**
   - Cron scheduler that runs every 5 minutes
   - Processes expired requests automatically
   - Can be manually triggered

### Modified Files
1. **`scripts/processExpiredRequests.js`**
   - Fixed: Added Fan Call check to skip refunds
   - Fixed: Properly gets creator's userid instead of portfolio_id
   - Improved: More lenient refund logic (handles partial refunds)
   - Improved: Better logging and error handling

2. **`Controller/Request/processExpiredRequests.js`**
   - Improved: More lenient refund logic (handles partial refunds)
   - Improved: Better logging with warnings for edge cases

3. **`index.js`**
   - Added: Automatic startup of expired requests processing cron job

## How It Works

### Flow Diagram

```
1. Fan creates request
   ├─> Balance deducted, added to pending
   ├─> expiresAt set to 23h 14m from now
   └─> Status: "request"

2. Two scenarios:

   A) Creator doesn't accept in 24h
      ├─> Cron job detects expiresAt < now
      ├─> Status changed to "expired"
      ├─> pending_gold refunded to balance
      └─> Notifications sent

   B) Creator accepts request
      ├─> Status changed to "accepted"
      └─> expiresAt no longer relevant

3. If accepted but not completed in 7 days
   ├─> Cron job detects createdAt < (now - 7 days)
   ├─> Status changed to "expired"
   ├─> pending_gold refunded to balance
   └─> Notifications sent
```

## Verification Checklist

- [x] Pending requests expire after 24 hours (expiresAt field set correctly)
- [x] Accepted requests expire after 7 days (for Fan meet/Fan date)
- [x] Accepted Fan Call requests expire after 48 hours (no refund)
- [x] Expired pending requests trigger refund automatically
- [x] Expired accepted requests trigger refund automatically
- [x] Fan Call requests don't get refunded (no deduction on creation)
- [x] Refunds move pending_gold back to balance
- [x] Transaction history created for refunds
- [x] Notifications sent to both fan and creator
- [x] Automatic cron job runs every 5 minutes
- [x] Manual endpoint available for testing

## Testing

### Manual Testing
```bash
# Trigger manual processing
curl -X POST http://localhost:3100/process-expired
```

### Expected Response
```json
{
  "ok": true,
  "message": "Processed X expired requests"
}
```

### Check Logs
The system logs detailed information:
- `✅ Refunded X to user Y for Z request` - Successful refund
- `⚠️ Partial refund...` - Partial refund (edge case)
- `⚠️ Cannot refund...` - No pending to refund
- `ℹ️ Fan Call request expired (no refund needed)` - Fan Call expiration

## Edge Cases Handled

1. **Partial Pending**: If user's pending is less than request price, refunds what's available
2. **Zero Pending**: If pending is 0, logs warning but doesn't crash
3. **Missing Creator**: If creator record not found, skips creator notification but continues
4. **Concurrent Processing**: Uses `isRunning` flag to prevent duplicate processing

## Monitoring

The cron job logs:
- Number of expired requests found (by type)
- Each request processed
- Refund amounts and status
- Errors (if any)

Check server logs for:
```
Starting expired requests processing at [timestamp]
Found X expired requests (Y Fan Call 48h, Z other 7d, W pending)
✅ Refunded...
```

## Notes

- The cron job runs every 5 minutes to ensure timely processing
- First run happens 10 seconds after server startup
- The system is idempotent - safe to run multiple times
- Status updates in `getAllFanRequests.js` are for display only - actual refunds happen in cron job

