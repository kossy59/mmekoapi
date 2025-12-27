# AI Story Generation System - Documentation

## Overview
This system automatically generates AI-powered story "rituals" that rotate through 5 different story types on a daily basis. Each story features 15 sequential panels with AI-generated images and has a 30/60-day lifecycle.

## Story Rotation Cycle (5-Day Pattern)

The system uses a 5-day rotating cycle based on days since launch:

| Day Index | Story Type | Emotional Core | Perspective |
|-----------|-----------|----------------|-------------|
| 1 | Underdog vs System | Anger | First person |
| 2 | Hidden Truth / Insider Revelation | Hope | Second person |
| 3 | Transformation (Before → After) | Betrayal | Third person |
| 4 | Moral Conflict / Choice | Relief | Observer |
| 5 | Builder's Journey / Sacrifice | Quiet Confidence | Confessional |

**Day Index Calculation:**
```javascript
const dayIndex = (daysSinceLaunch % 5) + 1;
```

## Story Structure

Each story contains:
- **Title**: Exactly 4 words
- **Panels**: Exactly 15 panels
- **Panel Format**: 1 short sentence (max 12 words)
- **Images**: AI-generated cinematic illustrations for each panel
- **Emotional Core**: Based on the day's story type
- **Perspective**: Based on the day's story type

## Story Lifecycle

### Phase 1: Active (Day 0 - Day 30)
- ✅ Story is fully accessible
- ✅ Users can view, like, and comment
- ✅ View count increments
- ✅ Shows `daysRemaining` in API response

### Phase 2: Expired (Day 30 - Day 60)
- ❌ Story is locked
- ❌ Users cannot view content
- ❌ Users cannot like or comment
- 📢 Shows message: "This Ritual has passed, You missed it"
- 🗄️ Story remains in database

### Phase 3: Deleted (After Day 60)
- 🗑️ Story is permanently deleted from database
- 🗑️ Associated images should be deleted from Storj (TODO: implement)

## Automatic Scheduling

### Cron Jobs

1. **Daily Story Generation**
   - **Schedule**: 12:00 AM UTC (daily)
   - **Action**: Generates one new story for the day
   - **Cron Expression**: `0 0 * * *`

2. **Mark Expired Stories**
   - **Schedule**: Every hour
   - **Action**: Marks stories as expired after 30 days
   - **Cron Expression**: `0 * * * *`

3. **Delete Old Stories**
   - **Schedule**: 1:00 AM UTC (daily)
   - **Action**: Permanently deletes stories older than 60 days
   - **Cron Expression**: `0 1 * * *`

### Timezone Configuration

Change the timezone in `jobs/storyScheduler.js`:

```javascript
cron.schedule('0 0 * * *', async () => {
    // ...
}, {
    timezone: "America/New_York" // Change to your timezone
});
```

## API Endpoints

### Generate Story (Manual Trigger)
```
POST /api/ai-story/generate
```

**Response:**
```json
{
  "success": true,
  "message": "Story generated and saved. Images are being generated in background.",
  "story": {
    "_id": "...",
    "story_number": 1,
    "title": "Rising From The Ashes",
    "emotional_core": "Anger",
    "panels": [...],
    "expiresAt": "2026-01-26T00:00:00.000Z",
    "deletesAt": "2026-02-25T00:00:00.000Z",
    "isExpired": false
  }
}
```

### Get All Stories
```
GET /api/ai-story/stories
```

**Response:**
```json
{
  "stories": [
    {
      "_id": "...",
      "story_number": 1,
      "title": "Rising From The Ashes",
      "emotional_core": "Anger",
      "coverImage": "https://...",
      "views": 42,
      "likes": 15,
      "status": "active",
      "daysRemaining": 25,
      "createdAt": "2025-12-27T00:00:00.000Z"
    }
  ]
}
```

### Get Story by ID
```
GET /api/ai-story/stories/:id
```

**Active Story Response:**
```json
{
  "story": {
    "_id": "...",
    "story_number": 1,
    "title": "Rising From The Ashes",
    "panels": [...],
    "status": "active",
    "daysRemaining": 25
  }
}
```

**Expired Story Response (403 Forbidden):**
```json
{
  "error": "This Ritual has passed, You missed it",
  "isExpired": true
}
```

### Like Story
```
POST /api/ai-story/stories/:id/like
Body: { "userId": "..." }
```

### Add Comment
```
POST /api/ai-story/stories/:id/comment
Body: { "userId": "...", "username": "...", "text": "..." }
```

### Delete All Stories (Testing Only)
```
DELETE /api/ai-story/stories
```

## Database Schema

### Story Model

```javascript
{
  story_number: Number,        // 1-5 (day index)
  title: String,               // Exactly 4 words
  emotional_core: String,      // e.g., "Anger", "Hope"
  panels: [{
    panel_number: Number,
    text: String,
    imageUrl: String
  }],
  coverImage: String,          // First panel's image
  isPublished: Boolean,
  views: Number,
  likes: Number,
  likedBy: [String],
  comments: [{
    userId: String,
    username: String,
    text: String,
    createdAt: Date
  }],
  createdAt: Date,
  launchDate: Date,            // Story creation date
  expiresAt: Date,             // +30 days from launch
  deletesAt: Date,             // +60 days from launch
  isExpired: Boolean
}
```

## Configuration

### Launch Date

Set your app's launch date in `Controller/AiStoryController.js`:

```javascript
const LAUNCH_DATE = new Date('2025-01-01T00:00:00Z');
```

This is used to calculate which story type should be generated each day.

### Image Generation

- **Model**: Kandinsky-2.2 (via Replicate)
- **Dimensions**: 768x1024 (9:16 portrait)
- **Storage**: Storj
- **Cooldown**: 10 seconds between panel generations
- **Total Time**: ~2.5 minutes per story (15 panels × 10 seconds)

## Testing the System

### 1. Manual Story Generation
```bash
curl -X POST http://localhost:3100/api/ai-story/generate
```

### 2. Check Generated Stories
```bash
curl http://localhost:3100/api/ai-story/stories
```

### 3. View Specific Story
```bash
curl http://localhost:3100/api/ai-story/stories/STORY_ID
```

### 4. Test Lifecycle States

**To test expiration without waiting 30 days:**

Temporarily modify the story in MongoDB:
```javascript
// In MongoDB shell or Compass
db.stories.updateOne(
  { _id: ObjectId("YOUR_STORY_ID") },
  { 
    $set: { 
      expiresAt: new Date(),  // Expire now
      isExpired: true 
    } 
  }
)
```

Then try to fetch the story - it should return the "missed it" message.

## Monitoring

Check logs for:

```
🌅 Starting automatic daily story generation...
📅 Day Index: 3 | Type: Transformation (Before → After) | Emotion: Betrayal
✅ Generated story: Lost And Found Again (15 panels)
💾 Saved story 3: Lost And Found Again
🎨 Starting image generation for 1 stories...
⏰ Marked 2 stories as expired
🗑️  Deleting 1 old stories...
```

## Troubleshooting

### Story Not Generating Automatically

1. Check if cron jobs are initialized:
   ```bash
   # Look for this in server logs:
   ✅ All scheduled tasks initialized:
      - Daily story generation: 12:00 AM (daily)
      - Mark expired stories: Every hour
      - Delete old stories: 1:00 AM (daily)
   ```

2. Verify GEMINI_API and REPLICATE_API_TOKEN are set in `.env`

3. Check for errors in logs around 12:00 AM UTC

### Images Not Generating

1. Verify Replicate API token is valid
2. Check Storj credentials
3. Look for rate limit errors in logs
4. Images generate in background - check after 2-3 minutes

### Expired Stories Not Being Marked

1. Verify the "Mark expired stories" cron is running every hour
2. Check `expiresAt` dates in database
3. Manually run: `markExpiredStories()` in controller

### Old Stories Not Being Deleted

1. Verify the "Delete old stories" cron runs at 1:00 AM UTC
2. Check `deletesAt` dates in database
3. Manually run: `deleteOldStories()` in controller

## Future Enhancements

- [ ] Implement Storj image deletion when stories are deleted
- [ ] Add admin dashboard to view generation history
- [ ] Add user notification when new story is available
- [ ] Implement story preview/teaser for expired stories
- [ ] Add analytics for story performance
- [ ] Allow manual override of story type
- [ ] Support multiple languages
- [ ] Add story sharing functionality

## Security Notes

- The `/api/ai-story/stories` DELETE endpoint should be protected in production
- Consider adding rate limiting to prevent abuse
- Implement proper authentication for like/comment endpoints
- Validate all user inputs to prevent injection attacks

## Performance Considerations

- Image generation runs in background to avoid blocking API responses
- Consider implementing a queue system for image generation if scaling
- Add caching for frequently accessed stories
- Index `expiresAt` and `deletesAt` fields for faster queries
- Consider archiving old stories instead of deleting permanently
