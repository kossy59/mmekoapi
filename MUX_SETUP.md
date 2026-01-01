# Mux Video Optimization - Configuration Guide

## Required Environment Variables

Add these to your `.env` file in the backend (`mmekoapi`) directory:

```env
# Mux API Credentials
# Get these from: https://dashboard.mux.com/settings/access-tokens
MUX_TOKEN_ID=your_mux_token_id_here
MUX_TOKEN_SECRET=your_mux_token_secret_here

# API URL for Mux callbacks (optional, defaults to http://localhost:3100)
API_URL=http://localhost:3100
```

## How to Get Mux Credentials

1. Sign up for a Mux account at [mux.com](https://mux.com)
2. Navigate to Settings → Access Tokens
3. Create a new access token with **Video** permissions
4. Copy the Token ID and Token Secret
5. Add them to your `.env` file

## How It Works

1. **Video Upload**: User uploads a video → saved to Storj (your storage)
2. **Post Created**: Post created with original video URL
3. **Mux Processing**: Backend triggers Mux asset creation (async)
4. **Immediate Playback**: Video plays immediately using original source
5. **Mux Ready**: When Mux finishes processing (30s-5min), webhook updates post
6. **Optimized Playback**: New views automatically use Mux for optimized streaming

## Webhook Setup (Optional but Recommended)

For automatic post updates when Mux processing completes:

1. Go to Mux Dashboard → Settings → Webhooks
2. Add webhook URL: `https://yourdomain.com/post/mux-webhook`
3. Subscribe to event: `video.asset.ready`
4. **Important**: Replace `yourdomain.com` with your actual domain

Without webhook setup, videos will still work but won't automatically switch to Mux after processing.

## Testing

### Test Video Upload
1. Upload a short video (< 30 seconds)
2. Video should play immediately using original source
3. Check server logs for "🎬 Triggering Mux processing"
4. Wait 1-2 minutes
5. Refresh page - video should now use Mux

### Check Logs
Server logs will show:
- ✅ Mux configured successfully
- 🎬 Triggering Mux processing for post [ID]
- ✅ Mux processing initiated for post [ID]
- ✅ Asset [ID] is ready (from webhook)

### Troubleshooting
- **No Mux logs**: Check `.env` credentials
- **412 errors**: Old posts with invalid playbackIds - they'll fall back to original
- **Videos not optimizing**: Verify webhook URL is accessible from internet
