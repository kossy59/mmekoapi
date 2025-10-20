const { exec } = require('child_process');
const fs = require('fs');
const path = require('path');
const AWS = require('aws-sdk');
const mongoose = require('mongoose');
require('dotenv').config();

// Storj Configuration
const STORJ_ACCESS_KEY_ID = process.env.STORJ_ACCESS_KEY_ID;
const STORJ_SECRET_ACCESS_KEY = process.env.STORJ_SECRET_ACCESS_KEY;
const STORJ_ENDPOINT = process.env.STORJ_ENDPOINT;
const STORJ_BUCKET_BACKUP = 'database-backup';

// MongoDB Configuration
const MONGODB_URI = process.env.MONGODB_URI || process.env.MONGO_URI;
const MONGODB_DB_NAME = process.env.MONGODB_DB_NAME || 'mmeko';

// Backup Configuration
const BACKUP_DIR = path.join(__dirname, '../backups');
const MAX_BACKUP_AGE_DAYS = 31;

// Storj S3 Client
const s3Client = new AWS.S3({
  endpoint: STORJ_ENDPOINT,
  region: 'us-east-1',
  accessKeyId: STORJ_ACCESS_KEY_ID,
  secretAccessKey: STORJ_SECRET_ACCESS_KEY,
  s3ForcePathStyle: true,
  signatureVersion: 'v4',
});

// Ensure backup directory exists
if (!fs.existsSync(BACKUP_DIR)) {
  fs.mkdirSync(BACKUP_DIR, { recursive: true });
}

/**
 * Create MongoDB backup using mongodump
 */
async function createMongoBackup() {
  return new Promise((resolve, reject) => {
    const timestamp = new Date().toISOString().split('T')[0]; // YYYY-MM-DD format
    const backupName = `backup_${timestamp}`;
    const backupPath = path.join(BACKUP_DIR, backupName);
    
    
    // Create backup directory
    if (!fs.existsSync(backupPath)) {
      fs.mkdirSync(backupPath, { recursive: true });
    }
    
    // Build mongodump command
    let command = `mongodump --db ${MONGODB_DB_NAME} --out "${backupPath}"`;
    
    // Add authentication if provided
    if (MONGODB_URI && MONGODB_URI.includes('@')) {
      command = `mongodump --uri "${MONGODB_URI}" --out "${backupPath}"`;
    }
    
    
    exec(command, (error, stdout, stderr) => {
      if (error) {
        console.error(`[MongoDB Backup] Error: ${error.message}`);
        reject(error);
        return;
      }
      
      resolve(backupPath);
    });
  });
}

/**
 * Upload backup to Storj
 */
async function uploadBackupToStorj(backupPath) {
  return new Promise(async (resolve, reject) => {
    try {
      const timestamp = new Date().toISOString().split('T')[0];
      const backupName = `backup_${timestamp}`;
      
      
      // Create a tar.gz archive of the backup
      const archivePath = path.join(BACKUP_DIR, `${backupName}.tar.gz`);
      const tarCommand = `tar -czf "${archivePath}" -C "${path.dirname(backupPath)}" "${path.basename(backupPath)}"`;
      
      exec(tarCommand, async (error) => {
        if (error) {
          console.error(`[Storj Upload] Error creating archive: ${error.message}`);
          reject(error);
          return;
        }
        
        try {
          // Read the archive file
          const fileContent = fs.readFileSync(archivePath);
          
          // Upload to Storj
          const uploadParams = {
            Bucket: STORJ_BUCKET_BACKUP,
            Key: `${backupName}.tar.gz`,
            Body: fileContent,
            ContentType: 'application/gzip',
            Metadata: {
              'backup-date': timestamp,
              'database': MONGODB_DB_NAME,
              'created-at': new Date().toISOString()
            }
          };
          
          const result = await s3Client.upload(uploadParams).promise();
          
          // Clean up local files
          fs.unlinkSync(archivePath);
          fs.rmSync(backupPath, { recursive: true, force: true });
          
          resolve({
            success: true,
            backupName,
            location: result.Location,
            size: fileContent.length,
            timestamp
          });
          
        } catch (uploadError) {
          console.error(`[Storj Upload] Upload failed: ${uploadError.message}`);
          reject(uploadError);
        }
      });
      
    } catch (error) {
      console.error(`[Storj Upload] Error: ${error.message}`);
      reject(error);
    }
  });
}

/**
 * Clean up old backups from Storj (older than 31 days)
 */
async function cleanupOldBackups() {
  try {
    
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
    console.error(`[Cleanup] Error: ${error.message}`);
    throw error;
  }
}

/**
 * Get backup history from Storj
 */
async function getBackupHistory() {
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
      date: obj.Key.replace('backup_', '').replace('.tar.gz', '')
    })).sort((a, b) => new Date(b.lastModified) - new Date(a.lastModified));
    
    return backups;
    
  } catch (error) {
    console.error(`[Backup History] Error: ${error.message}`);
    throw error;
  }
}

/**
 * Main backup function
 */
async function performBackup() {
  const startTime = new Date();
  let result = {
    success: false,
    error: null,
    backupName: null,
    size: 0,
    duration: 0,
    timestamp: startTime.toISOString()
  };
  
  try {
    
    // Create MongoDB backup
    const backupPath = await createMongoBackup();
    
    // Upload to Storj
    const uploadResult = await uploadBackupToStorj(backupPath);
    
    // Clean up old backups
    const deletedCount = await cleanupOldBackups();
    
    const endTime = new Date();
    const duration = endTime - startTime;
    
    result = {
      success: true,
      backupName: uploadResult.backupName,
      size: uploadResult.size,
      duration: duration,
      timestamp: startTime.toISOString(),
      deletedOldBackups: deletedCount
    };
    
    
  } catch (error) {
    const endTime = new Date();
    const duration = endTime - startTime;
    
    result = {
      success: false,
      error: error.message,
      duration: duration,
      timestamp: startTime.toISOString()
    };
    
    console.error(`[Backup] Backup failed after ${duration}ms:`, error.message);
  }
  
  return result;
}

// Export functions for use in other modules
module.exports = {
  performBackup,
  getBackupHistory,
  cleanupOldBackups,
  createMongoBackup,
  uploadBackupToStorj
};

// If this script is run directly, perform backup
if (require.main === module) {
  performBackup()
    .then(result => {
      process.exit(result.success ? 0 : 1);
    })
    .catch(error => {
      console.error('Backup failed:', error);
      process.exit(1);
    });
}
