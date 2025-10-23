#!/usr/bin/env node

/**
 * Backup Monitor Script
 * Monitors backup system health and provides diagnostics
 */

const fs = require('fs');
const path = require('path');
const { exec } = require('child_process');
const { promisify } = require('util');
require('dotenv').config();

const execAsync = promisify(exec);

// Colors for console output
const colors = {
  reset: '\x1b[0m',
  bright: '\x1b[1m',
  red: '\x1b[31m',
  green: '\x1b[32m',
  yellow: '\x1b[33m',
  blue: '\x1b[34m',
  magenta: '\x1b[35m',
  cyan: '\x1b[36m'
};

const log = {
  info: (msg) => console.log(`${colors.blue}[INFO]${colors.reset} ${msg}`),
  success: (msg) => console.log(`${colors.green}[✓]${colors.reset} ${msg}`),
  error: (msg) => console.log(`${colors.red}[✗]${colors.reset} ${msg}`),
  warn: (msg) => console.log(`${colors.yellow}[!]${colors.reset} ${msg}`),
  section: (msg) => console.log(`\n${colors.cyan}=== ${msg} ===${colors.reset}`)
};

// Check environment variables
function checkEnvironmentVariables() {
  log.section('Environment Variables Check');
  
  const required = [
    'STORJ_ACCESS_KEY_ID',
    'STORJ_SECRET_ACCESS_KEY',
    'MONGODB_URI'
  ];
  
  const optional = [
    'STORJ_ENDPOINT',
    'STORJ_BUCKET_BACKUP',
    'NODE_ENV'
  ];
  
  let allGood = true;
  
  // Check required variables
  required.forEach(varName => {
    if (process.env[varName]) {
      log.success(`${varName} is set`);
    } else {
      log.error(`${varName} is missing`);
      allGood = false;
    }
  });
  
  // Check optional variables
  optional.forEach(varName => {
    if (process.env[varName]) {
      log.success(`${varName} is set: ${process.env[varName]}`);
    } else {
      log.warn(`${varName} is not set (using default)`);
    }
  });
  
  return allGood;
}

// Check backup tracker
function checkBackupTracker() {
  log.section('Backup Tracker Check');
  
  const trackerPath = path.join(__dirname, '..', 'backups', 'backup_tracker.json');
  
  if (!fs.existsSync(trackerPath)) {
    log.error('Backup tracker file not found');
    return false;
  }
  
  try {
    const trackerData = JSON.parse(fs.readFileSync(trackerPath, 'utf8'));
    const backups = trackerData.backups || [];
    
    log.success(`Backup tracker found with ${backups.length} records`);
    
    if (backups.length > 0) {
      const latestBackup = backups[0];
      const lastBackupDate = new Date(latestBackup.lastModified);
      const daysSinceLastBackup = Math.floor((Date.now() - lastBackupDate.getTime()) / (1000 * 60 * 60 * 24));
      
      log.info(`Latest backup: ${latestBackup.fileName}`);
      log.info(`Last backup date: ${lastBackupDate.toISOString()}`);
      log.info(`Days since last backup: ${daysSinceLastBackup}`);
      
      if (daysSinceLastBackup > 1) {
        log.warn('No recent backups found');
      } else {
        log.success('Recent backup found');
      }
    } else {
      log.warn('No backup records found');
    }
    
    return true;
  } catch (error) {
    log.error(`Error reading backup tracker: ${error.message}`);
    return false;
  }
}

// Check MongoDB connection
async function checkMongoDBConnection() {
  log.section('MongoDB Connection Check');
  
  const { MongoClient } = require('mongodb');
  const MONGODB_URI = process.env.DB || process.env.MONGODB_URI || process.env.MONGO_URI;
  
  if (!MONGODB_URI) {
    log.error('MongoDB URI not configured');
    return false;
  }
  
  let client;
  try {
    log.info('Testing MongoDB connection...');
    client = new MongoClient(MONGODB_URI, {
      serverSelectionTimeoutMS: 10000,
      connectTimeoutMS: 10000
    });
    
    await client.connect();
    await client.db().admin().ping();
    
    const db = client.db();
    const collections = await db.collections();
    
    log.success('MongoDB connection successful');
    log.info(`Database: ${db.databaseName}`);
    log.info(`Collections: ${collections.length}`);
    
    return true;
  } catch (error) {
    log.error(`MongoDB connection failed: ${error.message}`);
    return false;
  } finally {
    if (client) {
      await client.close();
    }
  }
}

// Check Storj connection
async function checkStorjConnection() {
  log.section('Storj Connection Check');
  
  const AWS = require('aws-sdk');
  
  const STORJ_ACCESS_KEY_ID = process.env.STORJ_ACCESS_KEY_ID;
  const STORJ_SECRET_ACCESS_KEY = process.env.STORJ_SECRET_ACCESS_KEY;
  const STORJ_ENDPOINT = process.env.STORJ_ENDPOINT || 'https://gateway.storjshare.io';
  const STORJ_BUCKET_BACKUP = process.env.STORJ_BUCKET_BACKUP || 'database-backup';
  
  if (!STORJ_ACCESS_KEY_ID || !STORJ_SECRET_ACCESS_KEY) {
    log.error('Storj credentials not configured');
    return false;
  }
  
  try {
    const s3Client = new AWS.S3({
      endpoint: STORJ_ENDPOINT,
      region: 'us-east-1',
      accessKeyId: STORJ_ACCESS_KEY_ID,
      secretAccessKey: STORJ_SECRET_ACCESS_KEY,
      s3ForcePathStyle: true,
      signatureVersion: 'v4'
    });
    
    log.info('Testing Storj connection...');
    await s3Client.headBucket({ Bucket: STORJ_BUCKET_BACKUP }).promise();
    
    log.success('Storj connection successful');
    log.info(`Endpoint: ${STORJ_ENDPOINT}`);
    log.info(`Bucket: ${STORJ_BUCKET_BACKUP}`);
    
    // List recent backups
    const listParams = {
      Bucket: STORJ_BUCKET_BACKUP,
      Prefix: 'backup_',
      MaxKeys: 5
    };
    
    const objects = await s3Client.listObjectsV2(listParams).promise();
    const backups = objects.Contents || [];
    
    log.info(`Found ${backups.length} recent backups in Storj`);
    
    if (backups.length > 0) {
      backups.forEach((backup, index) => {
        const size = (backup.Size / 1024 / 1024).toFixed(2);
        const date = backup.LastModified.toISOString().split('T')[0];
        log.info(`${index + 1}. ${backup.Key} (${size} MB) - ${date}`);
      });
    }
    
    return true;
  } catch (error) {
    log.error(`Storj connection failed: ${error.message}`);
    return false;
  }
}

// Check cron job
async function checkCronJob() {
  log.section('Cron Job Check');
  
  try {
    const { stdout } = await execAsync('crontab -l');
    const cronJobs = stdout.split('\n').filter(line => line.includes('backup') || line.includes('mmeko'));
    
    if (cronJobs.length > 0) {
      log.success('Backup cron job found:');
      cronJobs.forEach(job => {
        if (job.trim()) {
          log.info(`  ${job.trim()}`);
        }
      });
    } else {
      log.warn('No backup cron job found');
      log.info('Add this to your crontab:');
      log.info('15 22 * * * cd /path/to/your/mmekoapi && node scripts/productionBackup.js >> /var/log/mongodb-backup.log 2>&1');
    }
    
    return cronJobs.length > 0;
  } catch (error) {
    log.warn('Could not check cron jobs (crontab not available)');
    return false;
  }
}

// Check PM2 process
async function checkPM2Process() {
  log.section('PM2 Process Check');
  
  try {
    const { stdout } = await execAsync('pm2 list');
    const lines = stdout.split('\n');
    const mmekoProcess = lines.find(line => line.includes('mmeko'));
    
    if (mmekoProcess) {
      log.success('MmeKo API process found in PM2');
      log.info(`Process: ${mmekoProcess.trim()}`);
    } else {
      log.warn('MmeKo API process not found in PM2');
      log.info('Start with: pm2 start ecosystem.config.js');
    }
    
    return !!mmekoProcess;
  } catch (error) {
    log.warn('PM2 not available or no processes running');
    return false;
  }
}

// Generate health report
function generateHealthReport(results) {
  log.section('Health Report Summary');
  
  const totalChecks = Object.keys(results).length;
  const passedChecks = Object.values(results).filter(result => result === true).length;
  const healthPercentage = Math.round((passedChecks / totalChecks) * 100);
  
  console.log(`\n${colors.bright}Overall Health: ${healthPercentage}%${colors.reset}`);
  console.log(`Passed: ${colors.green}${passedChecks}${colors.reset} / ${totalChecks} checks\n`);
  
  // Recommendations
  if (healthPercentage < 100) {
    log.section('Recommendations');
    
    if (!results.environment) {
      log.info('• Configure environment variables in .env file');
    }
    
    if (!results.mongodb) {
      log.info('• Check MongoDB connection and credentials');
    }
    
    if (!results.storj) {
      log.info('• Verify Storj credentials and bucket access');
    }
    
    if (!results.cron && !results.pm2) {
      log.info('• Set up cron job or PM2 for automatic backups');
    }
    
    if (!results.tracker) {
      log.info('• Check backup tracker file permissions');
    }
  } else {
    log.success('All systems are healthy! 🎉');
  }
}

// Main function
async function main() {
  console.log(`${colors.bright}${colors.magenta}
╔══════════════════════════════════════════════════════════════╗
║                    Backup System Monitor                    ║
║                      Health Check                           ║
╚══════════════════════════════════════════════════════════════╝
${colors.reset}`);

  const results = {};
  
  try {
    results.environment = checkEnvironmentVariables();
    results.tracker = checkBackupTracker();
    results.mongodb = await checkMongoDBConnection();
    results.storj = await checkStorjConnection();
    results.cron = await checkCronJob();
    results.pm2 = await checkPM2Process();
    
    generateHealthReport(results);
    
  } catch (error) {
    log.error(`Monitor failed: ${error.message}`);
    process.exit(1);
  }
}

// Run if called directly
if (require.main === module) {
  main();
}

module.exports = {
  checkEnvironmentVariables,
  checkBackupTracker,
  checkMongoDBConnection,
  checkStorjConnection,
  checkCronJob,
  checkPM2Process
};
