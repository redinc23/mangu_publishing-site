const requiredEnvVars = [
  'DATABASE_URL',
  'COGNITO_REGION',
  'COGNITO_USER_POOL_ID',
  'COGNITO_APP_CLIENT_ID',
  'STRIPE_SECRET_KEY',
  'STRIPE_WEBHOOK_SECRET'
];

export function validateEnv() {
  const missing = requiredEnvVars.filter(varName => !process.env[varName]);
  
  if (missing.length > 0) {
    console.error('Missing required environment variables:', missing);
    process.exit(1);
  }
  
  console.log('✅ All required environment variables present');
}
