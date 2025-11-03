const { MongoClient } = require('mongodb');
const AWS = require('aws-sdk');
const zlib = require('zlib');
const { PassThrough } = require('stream');
const fs = require('fs');
const path = require('path');
const bson = require('bson');
const { addBackupRecord } = require('./backupTracker');
require('dotenv').config();

// Environment variables
const MONGODB_URI = process.env.DB || process.env.MONGODB_URI || 'mongodb://localhost:27017/mmeko';
const STORJ_ACCESS_KEY_ID = process.env.STORJ_ACCESS_KEY_ID;
const STORJ_SECRET_ACCESS_KEY = process.env.STORJ_SECRET_ACCESS_KEY;
const STORJ_ENDPOINT = process.env.STORJ_ENDPOINT || 'https://gateway.storjshare.io';
const STORJ_BUCKET_BACKUP = process.env.STORJ_BUCKET_BACKUP || 'database-backup';

// Storj S3 Client
const s3Client = new AWS.S3({
  endpoint: STORJ_ENDPOINT,
  region: 'us-east-1',
  accessKeyId: STORJ_ACCESS_KEY_ID,
  secretAccessKey: STORJ_SECRET_ACCESS_KEY,
  s3ForcePathStyle: true,
  signatureVersion: 'v4',
});

/**
 * Pure Node.js MongoDB backup without mongodump binary
 */
async function performPureNodeBackup() {
  const startTime = new Date();
  
  let client;
  let backupName;
  let totalSize = 0;
  let collectionsBackedUp = 0;
  
  try {
    // Connect to MongoDB
    client = new MongoClient(MONGODB_URI);
    await client.connect();
    
    const db = client.db();
    const dbName = db.databaseName;
    const collections = await db.collections();
    
    // Create backup name with full timestamp to prevent overwriting
    // Format: backup_YYYY-MM-DD_HH-MM-SS.bson.gz
    const now = new Date();
    const isoString = now.toISOString(); // e.g., "2025-01-15T14:30:45.123Z"
    const dateTimeStr = isoString.replace('T', '_').replace(/:/g, '-').split('.')[0]; // e.g., "2025-01-15_14-30-45"
    backupName = `backup_${dateTimeStr}.bson.gz`;
    
    // Create a single compressed backup file containing all collections
    const backupData = {
      database: dbName,
      timestamp: new Date().toISOString(),
      collections: {}
    };
    
    // Export each collection
    for (const collection of collections) {
      const collectionName = collection.collectionName;
      
      try {
        // Get all documents from collection
        const documents = await collection.find({}).toArray();
        backupData.collections[collectionName] = documents;
        collectionsBackedUp++;
      } catch (collectionError) {
        console.error(`Error exporting collection ${collectionName}:`, collectionError.message);
        // Continue with other collections
      }
    }
    
    // Convert to BSON and compress
    const bsonData = bson.serialize(backupData);
    const compressedData = zlib.gzipSync(bsonData);
    totalSize = compressedData.length;
    
    // Upload to Storj
    const uploadParams = {
      Bucket: STORJ_BUCKET_BACKUP,
      Key: backupName,
      Body: compressedData,
      ContentType: 'application/gzip',
      Metadata: {
        'database': dbName,
        'timestamp': new Date().toISOString(),
        'collections': collectionsBackedUp.toString(),
        'size': totalSize.toString()
      }
    };
    
    const uploadResult = await s3Client.upload(uploadParams).promise();
    
    const recordTimestamp = new Date().toISOString();
    const recordDate = recordTimestamp.split('T')[0];
    
    // Record backup in tracker
    await addBackupRecord({
      fileName: backupName,
      size: totalSize,
      collections: collectionsBackedUp,
      timestamp: recordTimestamp,
      date: recordDate,
      location: uploadResult.Location,
      status: 'success',
      error: null
    });
    
    const endTime = new Date();
    const duration = Math.round((endTime - startTime) / 1000);
    
    // Automatically cleanup old backups (older than 31 days) after successful backup
    let deletedOldBackups = 0;
    try {
      deletedOldBackups = await cleanupOldBackups();
      console.log(`[Backup] Cleaned up ${deletedOldBackups} old backup(s) older than 31 days`);
    } catch (cleanupError) {
      console.error('[Backup] Error during automatic cleanup:', cleanupError.message);
      // Don't fail the backup if cleanup fails
    }
    
    return {
      success: true,
      backupName,
      size: totalSize,
      collections: collectionsBackedUp,
      duration,
      location: uploadResult.Location,
      timestamp: new Date().toISOString(),
      deletedOldBackups
    };
    
  } catch (error) {
    console.error('Backup failed:', error.message);
    
    const recordTimestamp = new Date().toISOString();
    const recordDate = recordTimestamp.split('T')[0];
    
    // Record failed backup
    await addBackupRecord({
      fileName: backupName || 'unknown',
      size: totalSize,
      collections: collectionsBackedUp,
      timestamp: recordTimestamp,
      date: recordDate,
      status: 'failed',
      error: error.message
    });
    
    return {
      success: false,
      error: error.message,
      backupName,
      size: totalSize,
      collections: collectionsBackedUp
    };
    
  } finally {
    if (client) {
      await client.close();
    }
  }
}

/**
 * List all backups from Storj (handles pagination)
 */
async function listBackups() {
  try {
    const allBackups = [];
    let continuationToken = null;
    
    do {
      const params = {
        Bucket: STORJ_BUCKET_BACKUP,
        Prefix: 'backup_'
      };
      
      if (continuationToken) {
        params.ContinuationToken = continuationToken;
      }
      
      const result = await s3Client.listObjectsV2(params).promise();
      
      if (result.Contents && result.Contents.length > 0) {
        allBackups.push(...result.Contents);
      }
      
      continuationToken = result.IsTruncated ? result.NextContinuationToken : null;
    } while (continuationToken);
    
    return allBackups;
  } catch (error) {
    console.error('[Backup] Error listing backups:', error.message);
    return [];
  }
}

/**
 * Delete old backups from Storj (older than 31 days)
 */
async function cleanupOldBackups() {
  try {
    const thirtyOneDaysAgo = new Date();
    thirtyOneDaysAgo.setDate(thirtyOneDaysAgo.getDate() - 31);
    
    // List all backups
    const backups = await listBackups();
    
    let deletedCount = 0;
    const deletePromises = [];
    
    for (const backup of backups) {
      const backupDate = new Date(backup.LastModified);
      
      // Delete if backup is older than 31 days
      if (backupDate < thirtyOneDaysAgo) {
        deletePromises.push(
          s3Client.deleteObject({
            Bucket: STORJ_BUCKET_BACKUP,
            Key: backup.Key
          }).promise().then(() => {
            deletedCount++;
            console.log(`[Backup Cleanup] Deleted old backup: ${backup.Key}`);
          }).catch((error) => {
            console.error(`[Backup Cleanup] Failed to delete ${backup.Key}:`, error.message);
          })
        );
      }
    }
    
    // Wait for all deletions to complete
    await Promise.all(deletePromises);
    
    // Also cleanup old backup records from tracker
    const { cleanupOldBackupRecords } = require('./backupTracker');
    const trackerDeletedCount = cleanupOldBackupRecords();
    
    console.log(`[Backup Cleanup] Deleted ${deletedCount} backup(s) from Storj and ${trackerDeletedCount} record(s) from tracker`);
    
    return deletedCount;
  } catch (error) {
    console.error('[Backup Cleanup] Error cleaning up old backups:', error.message);
    return 0;
  }
}

module.exports = {
  performPureNodeBackup,
  listBackups,
  cleanupOldBackups
};