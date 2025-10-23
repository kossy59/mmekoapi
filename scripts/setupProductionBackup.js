#!/usr/bin/env node

/**
 * Production Backup Setup Script
 * This script helps set up the production backup environment
 */

const fs = require('fs');
const path = require('path');
const { exec } = require('child_process');
const { promisify } = require('util');

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
  success: (msg) => console.log(`${colors.green}[SUCCESS]${colors.reset} ${msg}`),
  error: (msg) => console.log(`${colors.red}[ERROR]${colors.reset} ${msg}`),
  warn: (msg) => console.log(`${colors.yellow}[WARN]${colors.reset} ${msg}`),
  step: (msg) => console.log(`${colors.cyan}[STEP]${colors.reset} ${msg}`)
};

// Environment template
const envTemplate = `# MongoDB Configuration
DB=mongodb://localhost:27017/mmeko
MONGODB_URI=mongodb://localhost:27017/mmeko
MONGO_URI=mongodb://localhost:27017/mmeko

# Storj Configuration
STORJ_ACCESS_KEY_ID=your_storj_access_key_here
STORJ_SECRET_ACCESS_KEY=your_storj_secret_key_here
STORJ_ENDPOINT=https://gateway.storjshare.io
STORJ_BUCKET_BACKUP=database-backup

# Backup Configuration
NODE_ENV=production
`;

// Cron job template
const cronTemplate = `# MongoDB Backup - Runs daily at 12:00 AM midnight Nigeria time
0 0 * * * cd /path/to/your/mmekoapi && node scripts/productionBackup.js >> /var/log/mongodb-backup.log 2>&1
`;

// PM2 ecosystem template
const pm2Template = `module.exports = {
  apps: [{
    name: 'mmeko-api',
    script: 'index.js',
    instances: 1,
    autorestart: true,
    watch: false,
    max_memory_restart: '1G',
    env: {
      NODE_ENV: 'production',
      PORT: 3100
    },
    env_production: {
      NODE_ENV: 'production',
      PORT: 3100
    },
    error_file: './logs/err.log',
    out_file: './logs/out.log',
    log_file: './logs/combined.log',
    time: true
  }]
};
`;

async function checkNodeVersion() {
  try {
    const { stdout } = await execAsync('node --version');
    const version = stdout.trim();
    log.info(`Node.js version: ${version}`);
    
    const majorVersion = parseInt(version.split('.')[0].substring(1));
    if (majorVersion < 16) {
      log.warn('Node.js version 16 or higher is recommended');
    }
    
    return true;
  } catch (error) {
    log.error('Node.js is not installed or not in PATH');
    return false;
  }
}

async function checkMongoDBTools() {
  try {
    await execAsync('mongodump --version');
    log.success('MongoDB Database Tools are installed');
    return true;
  } catch (error) {
    log.warn('MongoDB Database Tools not found');
    log.info('Install with: npm install -g mongodb-database-tools');
    return false;
  }
}

function createEnvFile() {
  const envPath = path.join(__dirname, '..', '.env');
  
  if (fs.existsSync(envPath)) {
    log.warn('.env file already exists');
    const readline = require('readline');
    const rl = readline.createInterface({
      input: process.stdin,
      output: process.stdout
    });
    
    return new Promise((resolve) => {
      rl.question('Do you want to overwrite it? (y/N): ', (answer) => {
        rl.close();
        if (answer.toLowerCase() === 'y' || answer.toLowerCase() === 'yes') {
          fs.writeFileSync(envPath, envTemplate);
          log.success('.env file created/updated');
          resolve(true);
        } else {
          log.info('Skipping .env file creation');
          resolve(false);
        }
      });
    });
  } else {
    fs.writeFileSync(envPath, envTemplate);
    log.success('.env file created');
    return Promise.resolve(true);
  }
}

function createPM2Config() {
  const pm2Path = path.join(__dirname, '..', 'ecosystem.config.js');
  
  if (!fs.existsSync(pm2Path)) {
    fs.writeFileSync(pm2Path, pm2Template);
    log.success('PM2 ecosystem config created');
  } else {
    log.info('PM2 ecosystem config already exists');
  }
}

function createLogDirectory() {
  const logDir = path.join(__dirname, '..', 'logs');
  
  if (!fs.existsSync(logDir)) {
    fs.mkdirSync(logDir, { recursive: true });
    log.success('Logs directory created');
  } else {
    log.info('Logs directory already exists');
  }
}

function createBackupDirectory() {
  const backupDir = path.join(__dirname, '..', 'backups');
  
  if (!fs.existsSync(backupDir)) {
    fs.mkdirSync(backupDir, { recursive: true });
    log.success('Backups directory created');
  } else {
    log.info('Backups directory already exists');
  }
}

async function testBackupScript() {
  log.step('Testing backup script...');
  
  try {
    const { stdout, stderr } = await execAsync('node scripts/productionBackup.js', {
      cwd: path.join(__dirname, '..'),
      timeout: 60000 // 1 minute timeout
    });
    
    if (stdout) {
      log.info('Backup script output:');
      console.log(stdout);
    }
    
    if (stderr) {
      log.warn('Backup script warnings:');
      console.log(stderr);
    }
    
    log.success('Backup script test completed');
    return true;
  } catch (error) {
    log.error(`Backup script test failed: ${error.message}`);
    return false;
  }
}

function showCronInstructions() {
  log.step('Cron Job Setup Instructions:');
  console.log(`
${colors.cyan}1. Open crontab editor:${colors.reset}
   crontab -e

${colors.cyan}2. Add this line (replace /path/to/your/mmekoapi with your actual path):${colors.reset}
${colors.yellow}${cronTemplate}${colors.reset}

${colors.cyan}3. Save and exit${colors.reset}

${colors.cyan}4. Verify cron job:${colors.reset}
   crontab -l

${colors.cyan}5. Check cron service:${colors.reset}
   sudo systemctl status cron
  `);
}

function showPM2Instructions() {
  log.step('PM2 Setup Instructions:');
  console.log(`
${colors.cyan}1. Install PM2 globally:${colors.reset}
   npm install -g pm2

${colors.cyan}2. Start your application:${colors.reset}
   pm2 start ecosystem.config.js

${colors.cyan}3. Save PM2 configuration:${colors.reset}
   pm2 save

${colors.cyan}4. Set up PM2 to start on boot:${colors.reset}
   pm2 startup
   # Follow the instructions provided

${colors.cyan}5. Monitor your application:${colors.reset}
   pm2 status
   pm2 logs mmeko-api
  `);
}

function showEnvironmentInstructions() {
  log.step('Environment Variables Setup:');
  console.log(`
${colors.cyan}1. Edit the .env file:${colors.reset}
   nano .env

${colors.cyan}2. Update these variables:${colors.reset}
   - STORJ_ACCESS_KEY_ID: Your Storj access key
   - STORJ_SECRET_ACCESS_KEY: Your Storj secret key
   - MONGODB_URI: Your MongoDB connection string
   - STORJ_BUCKET_BACKUP: Your Storj bucket name (default: database-backup)

${colors.cyan}3. Test the configuration:${colors.reset}
   node scripts/productionBackup.js
  `);
}

async function main() {
  console.log(`${colors.bright}${colors.magenta}
╔══════════════════════════════════════════════════════════════╗
║                    MongoDB Backup Setup                     ║
║                   Production Environment                     ║
╚══════════════════════════════════════════════════════════════╝
${colors.reset}`);

  try {
    // Check prerequisites
    log.step('Checking prerequisites...');
    
    if (!(await checkNodeVersion())) {
      process.exit(1);
    }
    
    await checkMongoDBTools();
    
    // Create necessary files and directories
    log.step('Creating configuration files...');
    
    await createEnvFile();
    createPM2Config();
    createLogDirectory();
    createBackupDirectory();
    
    // Show setup instructions
    showEnvironmentInstructions();
    showCronInstructions();
    showPM2Instructions();
    
    log.success('Setup completed successfully!');
    log.info('Next steps:');
    log.info('1. Configure your .env file with proper credentials');
    log.info('2. Test the backup script: node scripts/productionBackup.js');
    log.info('3. Set up cron job or PM2 as shown above');
    
  } catch (error) {
    log.error(`Setup failed: ${error.message}`);
    process.exit(1);
  }
}

// Run if called directly
if (require.main === module) {
  main();
}

module.exports = {
  checkNodeVersion,
  checkMongoDBTools,
  createEnvFile,
  createPM2Config,
  testBackupScript
};
