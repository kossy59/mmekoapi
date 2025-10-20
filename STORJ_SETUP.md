# Storj Configuration Setup

This project has been migrated from Appwrite to Storj for file storage. Please add the following environment variables to your `.env` file:

## Required Environment Variables

```env
# Storj Configuration
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

## Migration Changes

### Files Modified:
1. **Created**: `utiils/storj.js` - New Storj utility functions
2. **Updated**: All controller files that used Appwrite upload functions
3. **Updated**: `routes/imageRoutes.js` - Updated to use Storj instead of Appwrite
4. **Updated**: `routes/api/uploadMessageFiles.js` - Updated to use Storj

### Functions Replaced:
- `uploadSingleFileToCloudinary()` - Now uses Storj S3-compatible API
- `uploadManyFilesToCloudinary()` - Now uses Storj S3-compatible API
- `saveFile()` - Now uses Storj S3-compatible API
- `deleteFile()` - Now uses Storj S3-compatible API
- `updateSingleFileToCloudinary()` - Now uses Storj S3-compatible API
- `previewFile()` - Now uses Storj S3-compatible API

### Bucket Mapping:
- `post` → `STORJ_BUCKET_POST`
- `profile` → `STORJ_BUCKET_PROFILE`
- `creator` → `STORJ_BUCKET_CREATOR`
- `creator-application` → `STORJ_BUCKET_CREATOR_APPLICATION`
- `message` → `STORJ_BUCKET_MESSAGE`

## Installation

Make sure you have the Storj SDK installed:
```bash
npm install @storj/sdk
```

## Testing

After setting up the environment variables, test the file upload functionality to ensure everything is working correctly with Storj.

## Notes

- The Storj implementation maintains the same API interface as the previous Appwrite implementation
- All file operations now use Storj's S3-compatible API
- File URLs are generated using the Storj endpoint and bucket configuration
- The system supports multiple buckets for different types of content
