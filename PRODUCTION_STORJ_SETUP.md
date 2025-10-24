# Production Storj Setup Guide

## 🚨 Critical Production Issues Identified

### 1. **Frontend API Configuration Fixed**
- ✅ **Fixed**: Frontend was hardcoded to use `localhost:3100` in production
- ✅ **Solution**: Updated `mmekowebsite/src/api/config.ts` to use production backend URL

### 2. **Storj Environment Variables Missing in Production**
- ❌ **Issue**: Production backend likely missing Storj environment variables
- 🔧 **Solution**: Add these environment variables to your production deployment

## 🔧 Required Environment Variables for Production

Add these to your production environment (Render.com, Vercel, etc.):

```env
# Storj Configuration (REQUIRED)
STORJ_ACCESS_KEY_ID=juqbkmfqqjtntrdt6km7xitpiboq
STORJ_SECRET_ACCESS_KEY=jzpjv2smjnmvrkfpdsvybjruwhsrpkcmjeblw2vmwuambsxpkcwna
STORJ_ENDPOINT=https://gateway.storjshare.io
STORJ_BUCKET_DEFAULT=post
STORJ_BUCKET_POST=post
STORJ_BUCKET_PROFILE=profile
STORJ_BUCKET_CREATOR=creator
STORJ_BUCKET_CREATOR_APPLICATION=creator-application
STORJ_BUCKET_MESSAGE=message
```

## 🚀 Deployment Steps

### For Render.com:
1. Go to your Render dashboard
2. Select your backend service
3. Go to "Environment" tab
4. Add all the Storj environment variables above
5. Redeploy your service

### For Vercel:
1. Go to your Vercel dashboard
2. Select your project
3. Go to "Settings" → "Environment Variables"
4. Add all the Storj environment variables above
5. Redeploy your service

## 🧪 Testing Production Setup

After adding environment variables, test with:

```bash
# Test Storj connection
curl https://your-backend-url.com/api/image/info?publicId=test

# Test image upload
curl -X POST https://your-backend-url.com/api/image/save \
  -F "image=@test-image.jpg"
```

## 🔍 Troubleshooting

### Images Not Loading:
1. Check if Storj environment variables are set in production
2. Verify backend is accessible: `https://mmekoapi.onrender.com/api/image/info`
3. Check browser console for CORS errors
4. Verify image URLs are using proxy: `/api/image/view?publicId=...`

### Creators Not Showing:
1. Check if backend API is accessible
2. Verify authentication is working
3. Check browser network tab for failed API calls
4. Ensure frontend is using production backend URL

## 📋 Verification Checklist

- [ ] Storj environment variables added to production
- [ ] Backend redeployed with new environment variables
- [ ] Frontend using production backend URL
- [ ] Images loading through proxy URLs
- [ ] Creators displaying correctly
- [ ] No CORS errors in browser console

## 🆘 If Still Having Issues

1. **Check Backend Logs**: Look for Storj connection errors
2. **Test API Endpoints**: Verify `/api/image/view` works
3. **Check CORS**: Ensure frontend domain is allowed
4. **Verify Environment**: Confirm all variables are set correctly

## 📞 Support

If issues persist after following this guide:
1. Check production backend logs
2. Test individual API endpoints
3. Verify environment variables are correctly set
4. Check browser console for specific error messages
