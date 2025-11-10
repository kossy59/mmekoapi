#!/usr/bin/env node

/**
 * Production MongoDB Backup Script
 * This script runs independently of the main Node.js application
 * and can be used with system-level cron jobs
 */

const { MongoClient } = require('mongodb');
const AWS = require('aws-sdk');
const zlib = require('zlib');
const fs = require('fs');
const path = require('path');
const bson = require('bson');
require('dotenv').config();

// Enhanced logging
const log = {
  info: (msg) => console.log(`[${new Date().toISOString()}] [INFO] ${msg}`),
  error: (msg) => console.error(`[${new Date().toISOString()}] [ERROR] ${msg}`),
  warn: (msg) => console.warn(`[${new Date().toISOString()}] [WARN] ${msg}`),
  success: (msg) => console.log(`[${new Date().toISOString()}] [SUCCESS] ${msg}`)
};

// Environment variables with fallbacks
const MONGODB_URI = process.env.DB || process.env.MONGODB_URI || process.env.MONGO_URI || 'mongodb://localhost:27017/mmeko';
const STORJ_ACCESS_KEY_ID = process.env.STORJ_ACCESS_KEY_ID;
const STORJ_SECRET_ACCESS_KEY = process.env.STORJ_SECRET_ACCESS_KEY;
const STORJ_ENDPOINT = process.env.STORJ_ENDPOINT || 'https://gateway.storjshare.io';
const STORJ_BUCKET_BACKUP = process.env.STORJ_BUCKET_BACKUP || 'database-backup';

// Validate environment variables
function validateEnvironment() {
  const missing = [];
  
  if (!STORJ_ACCESS_KEY_ID) missing.push('STORJ_ACCESS_KEY_ID');
  if (!STORJ_SECRET_ACCESS_KEY) missing.push('STORJ_SECRET_ACCESS_KEY');
  if (!MONGODB_URI) missing.push('MONGODB_URI');
  
  if (missing.length > 0) {
    log.error(`Missing required environment variables: ${missing.join(', ')}`);
    log.error('Please set these variables in your .env file or environment');
    return false;
  }
  
  log.info('Environment variables validated successfully');
  return true;
}

// Initialize Storj S3 Client
let s3Client;
function initializeStorjClient() {
  try {
    s3Client = new AWS.S3({
      endpoint: STORJ_ENDPOINT,
      region: 'us-east-1',
      accessKeyId: STORJ_ACCESS_KEY_ID,
      secretAccessKey: STORJ_SECRET_ACCESS_KEY,
      s3ForcePathStyle: true,
      signatureVersion: 'v4',
      maxRetries: 3,
      retryDelayOptions: {
        customBackoff: function(retryCount) {
          return Math.pow(2, retryCount) * 1000; // Exponential backoff
        }
      }
    });
    log.info('Storj S3 client initialized successfully');
    return true;
  } catch (error) {
    log.error(`Failed to initialize Storj client: ${error.message}`);
    return false;
  }
}

// Test connections
async function testConnections() {
  let client;
  
  try {
    // Test MongoDB connection
    log.info('Testing MongoDB connection...');
    client = new MongoClient(MONGODB_URI, {
      serverSelectionTimeoutMS: 10000,
      connectTimeoutMS: 10000
    });
    await client.connect();
    await client.db().admin().ping();
    log.success('MongoDB connection successful');
    
    // Test Storj connection
    log.info('Testing Storj connection...');
    await s3Client.headBucket({ Bucket: STORJ_BUCKET_BACKUP }).promise();
    log.success('Storj connection successful');
    
    return true;
  } catch (error) {
    log.error(`Connection test failed: ${error.message}`);
    return false;
  } finally {
    if (client) {
      await client.close();
    }
  }
}

// Perform backup
async function performBackup() {
  const startTime = new Date();
  let client;
  let backupName;
  let totalSize = 0;
  let collectionsBackedUp = 0;
  
  try {
    log.info('Starting MongoDB backup...');
    
    // Connect to MongoDB
    client = new MongoClient(MONGODB_URI, {
      serverSelectionTimeoutMS: 30000,
      connectTimeoutMS: 30000
    });
    await client.connect();
    
    const db = client.db();
    const dbName = db.databaseName;
    const collections = await db.collections();
    
    log.info(`Connected to database: ${dbName}`);
    log.info(`Found ${collections.length} collections to backup`);
    
    // Create backup name with timestamp
    const timestamp = new Date().toISOString().split('T')[0];
    backupName = `backup_${timestamp}.bson.gz`;
    
    // Create backup data structure
    const backupData = {
      database: dbName,
      timestamp: new Date().toISOString(),
      collections: {},
      metadata: {
        totalCollections: collections.length,
        backupVersion: '2.0',
        createdBy: 'productionBackup.js'
      }
    };
    
    // Export each collection
    for (const collection of collections) {
      const collectionName = collection.collectionName;
      try {
        log.info(`Backing up collection: ${collectionName}`);
        
        // Get document count first
        const docCount = await collection.countDocuments();
        log.info(`Collection ${collectionName} has ${docCount} documents`);
        
        if (docCount === 0) {
          backupData.collections[collectionName] = [];
          collectionsBackedUp++;
          continue;
        }
        
        // Get all documents from collection
        const documents = await collection.find({}).toArray();
        backupData.collections[collectionName] = documents;
        collectionsBackedUp++;
        
        log.info(`Successfully backed up ${documents.length} documents from ${collectionName}`);
      } catch (collectionError) {
        log.error(`Error exporting collection ${collectionName}: ${collectionError.message}`);
        // Continue with other collections
      }
    }
    
    log.info(`Successfully exported ${collectionsBackedUp} collections`);
    
    // Convert to BSON and compress
    log.info('Compressing backup data...');
    const bsonData = bson.serialize(backupData);
    const compressedData = zlib.gzipSync(bsonData);
    totalSize = compressedData.length;
    
    log.info(`Backup compressed to ${(totalSize / 1024 / 1024).toFixed(2)} MB`);
    
    // Upload to Storj
    log.info('Uploading backup to Storj...');
    const uploadParams = {
      Bucket: STORJ_BUCKET_BACKUP,
      Key: backupName,
      Body: compressedData,
      ContentType: 'application/bson+gzip',
      Metadata: {
        'database': dbName,
        'timestamp': new Date().toISOString(),
        'collections': collectionsBackedUp.toString(),
        'size': totalSize.toString(),
        'backup-version': '2.0'
      }
    };
    
    const uploadResult = await s3Client.upload(uploadParams).promise();
    
    const duration = Date.now() - startTime.getTime();
    
    log.success(`Backup completed successfully!`);
    log.success(`File: ${backupName}`);
    log.success(`Size: ${(totalSize / 1024 / 1024).toFixed(2)} MB`);
    log.success(`Collections: ${collectionsBackedUp}`);
    log.success(`Duration: ${(duration / 1000).toFixed(2)} seconds`);
    log.success(`Location: ${uploadResult.Location}`);
    
    return {
      success: true,
      backupName: backupName,
      size: totalSize,
      duration: duration,
      collections: collectionsBackedUp,
      location: uploadResult.Location,
      timestamp: startTime.toISOString()
    };
    
  } catch (error) {
    const duration = Date.now() - startTime.getTime();
    log.error(`Backup failed after ${(duration / 1000).toFixed(2)} seconds: ${error.message}`);
    
    return {
      success: false,
      error: error.message,
      duration: duration,
      timestamp: startTime.toISOString()
    };
  } finally {
    if (client) {
      await client.close();
    }
  }
}

// Clean up old backups
async function cleanupOldBackups() {
  try {
    log.info('Cleaning up old backups...');
    
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
      log.success(`Deleted ${objectsToDelete.length} old backups`);
    } else {
      log.info('No old backups to delete');
    }
    
    return objectsToDelete.length;
    
  } catch (error) {
    if (error?.code === 'AccessDenied') {
      log.warn('Cleanup skipped: Storj credentials do not have permission to list/delete objects.');
      return 0;
    }
    log.error(`Error during cleanup: ${error.message}`);
    return 0;
  }
}

// Main function
async function main() {
  log.info('=== MongoDB Production Backup Started ===');
  
  try {
    // Validate environment
    if (!validateEnvironment()) {
      process.exit(1);
    }
    
    // Initialize Storj client
    if (!initializeStorjClient()) {
      process.exit(1);
    }
    
    // Test connections
    if (!(await testConnections())) {
      process.exit(1);
    }
    
    // Perform backup
    const result = await performBackup();
    
    if (result.success) {
      // Clean up old backups
      await cleanupOldBackups();
      log.success('=== Backup Process Completed Successfully ===');
      process.exit(0);
    } else {
      log.error('=== Backup Process Failed ===');
      process.exit(1);
    }
    
  } catch (error) {
    log.error(`Unexpected error: ${error.message}`);
    process.exit(1);
  }
}

// Run if called directly
if (require.main === module) {
  main();
}

module.exports = {
  performBackup,
  cleanupOldBackups,
  testConnections,
  validateEnvironment
};
