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
    
    return {
      success: true,
      backupName,
      size: totalSize,
      collections: collectionsBackedUp,
      duration,
      location: uploadResult.Location,
      timestamp: new Date().toISOString()
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

module.exports = {
  performPureNodeBackup
};