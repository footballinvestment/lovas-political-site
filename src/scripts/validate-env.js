#!/usr/bin/env node

// scripts/validate-env.js
// Script to validate environment variables before deployment

const fs = require('fs');
const path = require('path');

// ANSI color codes for console output
const colors = {
  reset: '\x1b[0m',
  red: '\x1b[31m',
  green: '\x1b[32m',
  yellow: '\x1b[33m',
  cyan: '\x1b[36m',
  bold: '\x1b[1m',
};

function log(message, color = colors.reset) {
  console.log(`${color}${message}${colors.reset}`);
}

function validateEnvironment() {
  log('\n🔍 Environment Variable Validation', colors.bold + colors.cyan);
  log('=======================================', colors.cyan);

  // Load environment variables
  const envFile = process.env.NODE_ENV === 'production' ? '.env.production' : '.env.local';
  const envPath = path.join(process.cwd(), envFile);

  if (!fs.existsSync(envPath)) {
    log(`❌ Environment file not found: ${envFile}`, colors.red);
    log(`💡 Please create ${envFile} based on .env.production.example`, colors.yellow);
    process.exit(1);
  }

  // Load environment variables from file
  const envContent = fs.readFileSync(envPath, 'utf8');
  const envVars = {};
  
  envContent.split('\n').forEach(line => {
    const trimmed = line.trim();
    if (trimmed && !trimmed.startsWith('#') && trimmed.includes('=')) {
      const [key, ...valueParts] = trimmed.split('=');
      envVars[key.trim()] = valueParts.join('=').trim();
    }
  });

  // Required variables for production
  const requiredVars = [
    'NODE_ENV',
    'NEXT_PUBLIC_BASE_URL',
    'DATABASE_URL',
    'NEXTAUTH_URL',
    'NEXTAUTH_SECRET',
    'ADMIN_EMAIL',
    'ADMIN_PASSWORD',
    'RESEND_API_KEY',
    'EMAIL_FROM_DOMAIN',
    'CSRF_SECRET',
    'ENCRYPTION_KEY',
  ];

  // Optional but recommended variables
  const recommendedVars = [
    'GOOGLE_VERIFICATION',
    'GOOGLE_ANALYTICS_ID',
    'RATE_LIMIT_REDIS_URL',
    'DIRECT_URL',
  ];

  let hasErrors = false;
  let hasWarnings = false;

  log('\n📋 Checking required variables:', colors.bold);
  
  requiredVars.forEach(varName => {
    if (!envVars[varName]) {
      log(`❌ Missing: ${varName}`, colors.red);
      hasErrors = true;
    } else {
      // Validate specific formats
      if (varName === 'NEXT_PUBLIC_BASE_URL' || varName === 'NEXTAUTH_URL') {
        try {
          new URL(envVars[varName]);
          log(`✅ Valid: ${varName}`, colors.green);
        } catch {
          log(`❌ Invalid URL: ${varName}`, colors.red);
          hasErrors = true;
        }
      } else if (varName === 'ADMIN_EMAIL' || varName === 'EMAIL_FROM_DOMAIN') {
        const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
        if (emailRegex.test(envVars[varName])) {
          log(`✅ Valid: ${varName}`, colors.green);
        } else {
          log(`❌ Invalid email: ${varName}`, colors.red);
          hasErrors = true;
        }
      } else if (varName === 'RESEND_API_KEY') {
        if (envVars[varName].startsWith('re_')) {
          log(`✅ Valid: ${varName}`, colors.green);
        } else {
          log(`❌ Invalid Resend API key format: ${varName}`, colors.red);
          hasErrors = true;
        }
      } else if (varName.includes('SECRET') || varName.includes('KEY')) {
        if (envVars[varName].length >= 32) {
          log(`✅ Valid: ${varName} (length: ${envVars[varName].length})`, colors.green);
        } else {
          log(`❌ Too short: ${varName} (minimum 32 characters)`, colors.red);
          hasErrors = true;
        }
      } else if (varName === 'ADMIN_PASSWORD') {
        if (envVars[varName].length >= 12) {
          log(`✅ Valid: ${varName} (length: ${envVars[varName].length})`, colors.green);
        } else {
          log(`❌ Too short: ${varName} (minimum 12 characters)`, colors.red);
          hasErrors = true;
        }
      } else {
        log(`✅ Present: ${varName}`, colors.green);
      }
    }
  });

  log('\n🔍 Checking recommended variables:', colors.bold);
  
  recommendedVars.forEach(varName => {
    if (!envVars[varName]) {
      log(`⚠️  Missing (recommended): ${varName}`, colors.yellow);
      hasWarnings = true;
    } else {
      log(`✅ Present: ${varName}`, colors.green);
    }
  });

  // Check for common security issues
  log('\n🔒 Security checks:', colors.bold);
  
  const securityChecks = [
    {
      name: 'NEXTAUTH_SECRET strength',
      check: () => envVars.NEXTAUTH_SECRET && envVars.NEXTAUTH_SECRET.length >= 32,
      message: 'NextAuth secret should be at least 32 characters'
    },
    {
      name: 'CSRF_SECRET strength',
      check: () => envVars.CSRF_SECRET && envVars.CSRF_SECRET.length >= 32,
      message: 'CSRF secret should be at least 32 characters'
    },
    {
      name: 'ENCRYPTION_KEY strength',
      check: () => envVars.ENCRYPTION_KEY && envVars.ENCRYPTION_KEY.length >= 32,
      message: 'Encryption key should be at least 32 characters'
    },
    {
      name: 'Admin password strength',
      check: () => {
        const pwd = envVars.ADMIN_PASSWORD;
        return pwd && pwd.length >= 12 && /[A-Z]/.test(pwd) && /[a-z]/.test(pwd) && /[0-9]/.test(pwd);
      },
      message: 'Admin password should be at least 12 characters with mixed case and numbers'
    },
    {
      name: 'Production environment',
      check: () => envVars.NODE_ENV === 'production',
      message: 'NODE_ENV should be set to production for production deployment'
    },
    {
      name: 'HTTPS URLs',
      check: () => {
        const urls = [envVars.NEXT_PUBLIC_BASE_URL, envVars.NEXTAUTH_URL];
        return urls.every(url => url && url.startsWith('https://'));
      },
      message: 'All URLs should use HTTPS in production'
    }
  ];

  securityChecks.forEach(check => {
    if (check.check()) {
      log(`✅ ${check.name}`, colors.green);
    } else {
      log(`⚠️  ${check.name}: ${check.message}`, colors.yellow);
      hasWarnings = true;
    }
  });

  // Feature flags check
  log('\n🎛️  Feature flags:', colors.bold);
  
  const featureFlags = [
    'ENABLE_NEWSLETTER',
    'ENABLE_COMMENTS',
    'ENABLE_MAINTENANCE_MODE',
    'ENABLE_ERROR_EMAILS'
  ];

  featureFlags.forEach(flag => {
    const value = envVars[flag] || 'not set';
    const isValid = ['true', 'false'].includes(value);
    
    if (isValid) {
      log(`✅ ${flag}: ${value}`, colors.green);
    } else {
      log(`⚠️  ${flag}: ${value} (should be 'true' or 'false')`, colors.yellow);
      hasWarnings = true;
    }
  });

  // Summary
  log('\n📊 Validation Summary:', colors.bold + colors.cyan);
  log('=======================================', colors.cyan);
  
  if (hasErrors) {
    log('❌ VALIDATION FAILED', colors.red + colors.bold);
    log('Please fix the errors above before deploying to production.', colors.red);
    process.exit(1);
  } else if (hasWarnings) {
    log('⚠️  VALIDATION PASSED WITH WARNINGS', colors.yellow + colors.bold);
    log('Consider addressing the warnings above for better security and functionality.', colors.yellow);
    process.exit(0);
  } else {
    log('✅ VALIDATION PASSED', colors.green + colors.bold);
    log('All environment variables are properly configured!', colors.green);
    process.exit(0);
  }
}

// Run validation
validateEnvironment();