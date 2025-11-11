/**
 * Environment Variable Validation for Production
 * Validates that all required environment variables are set
 */

const REQUIRED_ENV_VARS = {
  // Database
  DATABASE_URL: 'PostgreSQL connection string',
  
  // Redis (optional in dev)
  REDIS_URL: 'Redis connection string (optional)',
  
  // AWS Services
  AWS_REGION: 'AWS region for services',
  AWS_ACCESS_KEY_ID: 'AWS access key (if not using IAM roles)',
  AWS_SECRET_ACCESS_KEY: 'AWS secret key (if not using IAM roles)',
  
  // S3
  AWS_S3_BUCKET: 'S3 bucket name for file storage',
  
  // Cognito
  AWS_COGNITO_USER_POOL_ID: 'Cognito user pool ID',
  AWS_COGNITO_CLIENT_ID: 'Cognito client ID',
  AWS_COGNITO_REGION: 'Cognito region',
  
  // Stripe
  STRIPE_SECRET_KEY: 'Stripe secret key for payments',
  STRIPE_WEBHOOK_SECRET: 'Stripe webhook secret',
  
  // SES
  AWS_SES_FROM_EMAIL: 'Email address for sending emails',
  
  // Application
  NODE_ENV: 'Environment (development, production, test)',
  PORT: 'Server port (defaults to 3001)',
  
  // JWT
  JWT_SECRET: 'Secret for JWT token signing',
  
  // CORS
  CLIENT_URL: 'Frontend application URL for CORS'
};

const OPTIONAL_ENV_VARS = {
  REDIS_URL: 'Redis connection string',
  DISABLE_REDIS: 'Set to "1" to disable Redis in development',
  DATABASE_POOL_MAX: 'Maximum database pool size',
  DATABASE_POOL_MIN: 'Minimum database pool size',
  DATABASE_IDLE_TIMEOUT: 'Database idle timeout in ms',
  DATABASE_TIMEOUT: 'Database connection timeout in ms',
  LOG_LEVEL: 'Logging level (debug, info, warn, error)',
  AWS_ACCESS_KEY_ID: 'AWS access key (not needed with IAM roles)',
  AWS_SECRET_ACCESS_KEY: 'AWS secret key (not needed with IAM roles)'
};

/**
 * Validates environment variables based on NODE_ENV
 * @param {string} env - Environment name (development, production, test)
 * @returns {Object} Validation result with errors array
 */
export function validateEnv(env = process.env.NODE_ENV) {
  const errors = [];
  const warnings = [];
  
  // Basic validation
  if (!env) {
    errors.push('NODE_ENV is not set');
    return { valid: false, errors, warnings };
  }
  
  // Production requires all critical variables
  if (env === 'production') {
    const productionRequired = [
      'DATABASE_URL',
      'AWS_REGION',
      'AWS_S3_BUCKET',
      'AWS_COGNITO_USER_POOL_ID',
      'AWS_COGNITO_CLIENT_ID',
      'STRIPE_SECRET_KEY',
      'STRIPE_WEBHOOK_SECRET',
      'AWS_SES_FROM_EMAIL',
      'JWT_SECRET',
      'CLIENT_URL'
    ];
    
    for (const varName of productionRequired) {
      if (!process.env[varName]) {
        errors.push(`${varName} is required in production (${REQUIRED_ENV_VARS[varName]})`);
      }
    }
    
    // Warn about missing Redis in production
    if (!process.env.REDIS_URL && process.env.DISABLE_REDIS !== '1') {
      warnings.push('REDIS_URL is not set in production - caching will be disabled');
    }
    
    // Check for IAM role or credentials
    if (!process.env.AWS_ACCESS_KEY_ID && !process.env.AWS_SECRET_ACCESS_KEY) {
      warnings.push('AWS credentials not set - assuming IAM role is configured');
    }
  }
  
  // Development has fewer requirements
  if (env === 'development') {
    const devRequired = ['DATABASE_URL', 'JWT_SECRET'];
    
    for (const varName of devRequired) {
      if (!process.env[varName]) {
        errors.push(`${varName} is required even in development`);
      }
    }
    
    if (!process.env.REDIS_URL && process.env.DISABLE_REDIS !== '1') {
      warnings.push('REDIS_URL not set - Redis will be disabled. Set DISABLE_REDIS=1 to suppress this warning');
    }
  }
  
  // Validate JWT_SECRET length
  if (process.env.JWT_SECRET && process.env.JWT_SECRET.length < 32) {
    errors.push('JWT_SECRET must be at least 32 characters long');
  }
  
  // Validate URLs
  if (process.env.DATABASE_URL && !process.env.DATABASE_URL.startsWith('postgresql://') && !process.env.DATABASE_URL.startsWith('postgres://')) {
    errors.push('DATABASE_URL must be a valid PostgreSQL connection string');
  }
  
  if (process.env.CLIENT_URL && !process.env.CLIENT_URL.match(/^https?:\/\//)) {
    errors.push('CLIENT_URL must be a valid HTTP/HTTPS URL');
  }
  
  return {
    valid: errors.length === 0,
    errors,
    warnings
  };
}

/**
 * Get configuration object with defaults
 */
export function getConfig() {
  return {
    env: process.env.NODE_ENV || 'development',
    port: parseInt(process.env.PORT || '3001', 10),
    
    database: {
      url: process.env.DATABASE_URL,
      poolMax: parseInt(process.env.DATABASE_POOL_MAX || '20', 10),
      poolMin: parseInt(process.env.DATABASE_POOL_MIN || '2', 10),
      idleTimeout: parseInt(process.env.DATABASE_IDLE_TIMEOUT || '600000', 10),
      connectionTimeout: parseInt(process.env.DATABASE_TIMEOUT || '30000', 10)
    },
    
    redis: {
      url: process.env.REDIS_URL,
      disabled: process.env.DISABLE_REDIS === '1'
    },
    
    aws: {
      region: process.env.AWS_REGION || 'us-east-1',
      accessKeyId: process.env.AWS_ACCESS_KEY_ID,
      secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY,
      s3Bucket: process.env.AWS_S3_BUCKET,
      cognito: {
        userPoolId: process.env.AWS_COGNITO_USER_POOL_ID,
        clientId: process.env.AWS_COGNITO_CLIENT_ID,
        region: process.env.AWS_COGNITO_REGION || process.env.AWS_REGION
      },
      ses: {
        fromEmail: process.env.AWS_SES_FROM_EMAIL
      }
    },
    
    stripe: {
      secretKey: process.env.STRIPE_SECRET_KEY,
      webhookSecret: process.env.STRIPE_WEBHOOK_SECRET
    },
    
    jwt: {
      secret: process.env.JWT_SECRET,
      expiresIn: process.env.JWT_EXPIRES_IN || '7d'
    },
    
    cors: {
      origin: process.env.CLIENT_URL || 'http://localhost:5173'
    },
    
    logging: {
      level: process.env.LOG_LEVEL || 'info'
    }
  };
}

/**
 * Validates environment on module load in production
 */
export function requireValidEnv() {
  const validation = validateEnv();
  
  if (validation.warnings.length > 0 && process.env.NODE_ENV !== 'test') {
    console.warn('⚠️  Environment warnings:');
    validation.warnings.forEach(warning => console.warn(`  - ${warning}`));
  }
  
  if (!validation.valid) {
    if (process.env.NODE_ENV === 'production') {
      console.error('❌ Environment validation failed:');
      validation.errors.forEach(error => console.error(`  - ${error}`));
      console.error('\n💡 See docs/PRODUCTION_ENV.md for configuration guide');
      process.exit(1);
    } else if (process.env.NODE_ENV !== 'test') {
      console.warn('⚠️  Environment validation warnings (development mode):');
      validation.errors.forEach(error => console.warn(`  - ${error}`));
    }
  }
  
  return validation.valid;
}

export default {
  validateEnv,
  getConfig,
  requireValidEnv
};
