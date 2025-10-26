# Admin API Documentation

This document describes the new admin API endpoints for user management, notifications, and analytics.

## Authentication
All admin endpoints require a Bearer token in the Authorization header:
```
Authorization: Bearer <your-token>
```

## Endpoints

### 1. Edit User Information
**POST** `/edituser`

Edit user information including basic details, financial data, and creator status.

**Request Body:**
```json
{
  "userId": "user_id_here",
  "updates": {
    "firstname": "John",
    "lastname": "Doe",
    "email": "john.doe@example.com",
    "gender": "male",
    "country": "USA",
    "age": "25",
    "balance": "100.50",
    "coinBalance": 1500,
    "earnings": 2500,
    "active": true,
    "creator_verified": true,
    "isVip": false
  }
}
```

**Response:**
```json
{
  "ok": true,
  "message": "User updated successfully",
  "updatedFields": ["firstname", "lastname", "email", "balance"]
}
```

### 2. Delete User (Enhanced)
**POST** `/deleteuser`

Delete a user and all associated data. If the user is a creator, their portfolio will also be deleted.

**Request Body:**
```json
{
  "userid": "user_id_here"
}
```

**Response:**
```json
{
  "ok": true,
  "message": "User deleted successfully (including creator portfolio)",
  "id": "user_id_here",
  "wasCreator": true
}
```

**What gets deleted:**
- User account from userdb
- All user posts and images
- All user comments and likes
- All user messages and notifications
- If creator: portfolio, exclusive content, and all creator-related data
- All financial records and transactions

### 3. Send Notification with Gender Filter
**POST** `/sendNotificationWithFilter`

Send notifications to users based on gender filter or specific user IDs.

**Request Body:**
```json
{
  "message": "Your notification message here",
  "targetGender": "male", // "male", "female", or "all"
  "targetUserIds": ["user1", "user2"] // Optional: specific user IDs
}
```

**Response:**
```json
{
  "ok": true,
  "message": "Notification sent successfully to 150 users",
  "targetCount": 150,
  "targetGender": "male",
  "notificationType": "admin_broadcast"
}
```

### 4. Advanced Notification System
**POST** `/adminNotificationSystem`

Advanced notification system with more options and detailed reporting.

**Request Body:**
```json
{
  "message": "Your notification message here",
  "targetGender": "female",
  "targetUserIds": ["user1", "user2"],
  "notificationType": "admin_broadcast",
  "title": "Important Update"
}
```

**Response:**
```json
{
  "ok": true,
  "message": "Notification sent successfully",
  "details": {
    "totalTargets": 75,
    "filterDescription": "All female users",
    "genderBreakdown": {
      "female": 75
    },
    "notificationType": "admin_broadcast",
    "pushNotifications": {
      "successful": 70,
      "failed": 5
    }
  }
}
```

### 5. Get User Statistics
**GET** `/getUserStatistics/:userId`

Get comprehensive statistics for a specific user.

**Response:**
```json
{
  "ok": true,
  "message": "User statistics retrieved successfully",
  "data": {
    "user": {
      "_id": "user_id",
      "firstname": "John",
      "lastname": "Doe",
      "email": "john@example.com",
      "gender": "male",
      "country": "USA",
      "active": true,
      "creator_verified": true,
      "creator_portfolio": true,
      "isVip": false,
      "createdAt": "2024-01-01T00:00:00.000Z",
      "updatedAt": "2024-01-15T00:00:00.000Z"
    },
    "financial": {
      "balance": "100.50",
      "withdrawbalance": "50.00",
      "coinBalance": 1500,
      "pending": 25.00,
      "earnings": 2500,
      "totalEarnings": 2500,
      "totalSpent": 100,
      "netEarnings": 2400
    },
    "content": {
      "postsCount": 15,
      "exclusiveContentCount": 5,
      "creatorInfo": {
        "name": "John Doe",
        "verify": "verified"
      }
    },
    "social": {
      "followers": 150,
      "following": 75
    },
    "recentTransactions": [
      {
        "type": "Fan Request Payment",
        "amount": "50.00",
        "date": "2024-01-15T00:00:00.000Z",
        "isIncome": true
      }
    ]
  }
}
```

### 6. Get Admin Dashboard
**GET** `/getAdminDashboard`

Get comprehensive dashboard statistics for all users.

**Response:**
```json
{
  "ok": true,
  "message": "Admin dashboard data retrieved successfully",
  "data": {
    "overview": {
      "totalUsers": 1000,
      "activeUsers": 850,
      "inactiveUsers": 150,
      "creatorCount": 100,
      "verifiedCreators": 75,
      "unverifiedCreators": 25,
      "vipUsers": 50,
      "regularUsers": 950
    },
    "content": {
      "totalPosts": 5000,
      "totalExclusiveContent": 200,
      "pendingNotifications": 25
    },
    "demographics": {
      "genderBreakdown": {
        "male": 600,
        "female": 400
      },
      "topCountries": [
        { "_id": "USA", "count": 300 },
        { "_id": "Canada", "count": 200 }
      ]
    },
    "activity": {
      "recentRegistrations": 50,
      "recentActivity": {
        "newUsers": 20,
        "newPosts": 100,
        "newExclusiveContent": 5
      }
    },
    "financial": {
      "totalBalance": 50000,
      "totalEarnings": 100000,
      "totalCoinBalance": 500000,
      "totalPending": 5000
    }
  },
  "timestamp": "2024-01-15T12:00:00.000Z"
}
```

## Error Responses

All endpoints return consistent error responses:

```json
{
  "ok": false,
  "message": "Error description here"
}
```

Common HTTP status codes:
- `400` - Bad Request (missing required fields)
- `401` - Unauthorized (invalid or missing token)
- `404` - Not Found (user not found)
- `500` - Internal Server Error (server-side error)

## Usage Examples

### Frontend Integration

```javascript
// Edit user
const editUser = async (userId, updates) => {
  const response = await fetch('/edituser', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${token}`
    },
    body: JSON.stringify({ userId, updates })
  });
  return response.json();
};

// Send notification to all female users
const sendNotification = async (message) => {
  const response = await fetch('/sendNotificationWithFilter', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${token}`
    },
    body: JSON.stringify({
      message,
      targetGender: 'female'
    })
  });
  return response.json();
};

// Get user statistics
const getUserStats = async (userId) => {
  const response = await fetch(`/getUserStatistics/${userId}`, {
    headers: {
      'Authorization': `Bearer ${token}`
    }
  });
  return response.json();
};
```

## Security Notes

1. All endpoints require proper authentication
2. User deletion is permanent and cannot be undone
3. Notifications are sent to all matching users immediately
4. Admin actions are logged for audit purposes
5. Rate limiting should be implemented for notification endpoints

## Database Impact

- **Edit User**: Updates userdb and related collections
- **Delete User**: Removes all user data across multiple collections
- **Notifications**: Creates entries in admindb collection
- **Statistics**: Read-only operations, no data modification
