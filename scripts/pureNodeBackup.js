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
    
    
    // Create backup name with timestamp
    const timestamp = new Date().toISOString().split('T')[0]; // YYYY-MM-DD format
    backupName = `backup_${timestamp}.bson.gz`;
    
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
        console.error(`[Pure Node Backup] Error exporting collection ${collectionName}:`, collectionError.message);
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
      ContentType: 'application/bson+gzip',
      Metadata: {
        'database': dbName,
        'timestamp': new Date().toISOString(),
        'collections': collectionsBackedUp.toString(),
        'size': totalSize.toString()
      }
    };
    
    const uploadResult = await s3Client.upload(uploadParams).promise();
    
    // Record backup in local tracker
    const date = new Date().toISOString().split('T')[0];
    addBackupRecord({
      fileName: backupName,
      size: totalSize,
      date: date,
      location: uploadResult.Location || 'Storj database-backup bucket',
      collections: collectionsBackedUp
    });
    
    const duration = Date.now() - startTime.getTime();
    
    return {
      success: true,
      backupName: backupName,
      size: totalSize,
      duration: duration,
      collections: collectionsBackedUp,
      location: uploadResult.Location
    };
    
  } catch (error) {
    console.error(`[Pure Node Backup] Error: ${error.message}`);
    return {
      success: false,
      error: error.message
    };
  } finally {
    if (client) {
      await client.close();
    }
  }
}

/**
 * Restore from backup file
 */
async function restoreFromBackup(backupKey) {
  
  let client;
  
  try {
    // Download backup from Storj
    const downloadParams = {
      Bucket: STORJ_BUCKET_BACKUP,
      Key: backupKey
    };
    
    const downloadResult = await s3Client.getObject(downloadParams).promise();
    
    // Decompress and parse BSON
    const decompressedData = zlib.gunzipSync(downloadResult.Body);
    const backupData = bson.deserialize(decompressedData);
    
    // Connect to MongoDB
    client = new MongoClient(MONGODB_URI);
    await client.connect();
    
    const db = client.db();
    
    // Restore each collection
    for (const [collectionName, documents] of Object.entries(backupData.collections)) {
      const collection = db.collection(collectionName);
      
      // Clear existing data (optional - you might want to merge instead)
      await collection.deleteMany({});
      
      // Insert documents in batches
      const batchSize = 1000;
      for (let i = 0; i < documents.length; i += batchSize) {
        const batch = documents.slice(i, i + batchSize);
        await collection.insertMany(batch);
      }
    }
    return { success: true };
    
  } catch (error) {
    console.error(`[Pure Node Restore] Error: ${error.message}`);
    return { success: false, error: error.message };
  } finally {
    if (client) {
      await client.close();
    }
  }
}

/**
 * List available backups
 */
async function listBackups() {
  try {
    
    const listParams = {
      Bucket: STORJ_BUCKET_BACKUP,
      Prefix: 'backup_'
    };
    
    const objects = await s3Client.listObjectsV2(listParams).promise();
    
    const backups = (objects.Contents || []).map(obj => ({
      name: obj.Key,
      size: obj.Size,
      lastModified: obj.LastModified,
      date: obj.Key.replace('backup_', '').replace('.bson.gz', '').replace('.json.gz', '')
    })).sort((a, b) => new Date(b.lastModified) - new Date(a.lastModified));
    
    return backups;
    
  } catch (error) {
    console.error(`[Pure Node Backup] Error listing backups: ${error.message}`);
    return [];
  }
}

/**
 * Clean up old backups
 */
async function cleanupOldBackups() {
  try {
    
    const MAX_BACKUP_AGE_DAYS = 31;
    const listParams = {
      Bucket: STORJ_BUCKET_BACKUP,
      Prefix: 'backup_'
    };
    
    const objects = await s3Client.listObjectsV2(listParams).promise();
    const cutoffDate = new Date();
    cutoffDate.setDate(cutoffDate.getDate() - MAX_BACKUP_AGE_DAYS);
    
    const objectsToDelete = [];
    
    for (const obj of objects.Contents || []) {
      const backupDate = new Date(obj.LastModified);
      if (backupDate < cutoffDate) {
        objectsToDelete.push({ Key: obj.Key });
      }
    }
    
    if (objectsToDelete.length > 0) {
      const deleteParams = {
        Bucket: STORJ_BUCKET_BACKUP,
        Delete: {
          Objects: objectsToDelete
        }
      };
      
      await s3Client.deleteObjects(deleteParams).promise();
    }
    
    return objectsToDelete.length;
    
  } catch (error) {
    console.error(`[Pure Node Backup] Error during cleanup: ${error.message}`);
    return 0;
  }
}

module.exports = {
  performPureNodeBackup,
  restoreFromBackup,
  listBackups,
  cleanupOldBackups
};
