#!/usr/bin/env node
/**
 * Verify Notion Integration Setup
 * Checks if everything is configured correctly
 */

import { readFileSync, existsSync } from 'fs';
import { join, dirname } from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);
const PROJECT_ROOT = join(__dirname, '..');

function checkEnvFile() {
  const envPath = join(PROJECT_ROOT, 'server', '.env');
  
  if (!existsSync(envPath)) {
    console.log('❌ server/.env file not found');
    return { exists: false, apiKey: null, dbId: null };
  }
  
  const envContent = readFileSync(envPath, 'utf8');
  const apiKeyMatch = envContent.match(/^NOTION_API_KEY=(.+)$/m);
  const dbIdMatch = envContent.match(/^NOTION_DATABASE_ID=(.+)$/m);
  
  const apiKey = apiKeyMatch ? apiKeyMatch[1].trim() : null;
  const dbId = dbIdMatch ? dbIdMatch[1].trim() : null;
  
  return { exists: true, apiKey, dbId };
}

async function testConnection(apiKey, dbId) {
  if (!apiKey || !dbId) {
    return { success: false, error: 'Missing credentials' };
  }
  
  try {
    const { Client } = await import('@notionhq/client');
    const client = new Client({ auth: apiKey });
    
    // Try to retrieve the database info
    try {
      await client.databases.retrieve({ database_id: dbId });
      return { success: true };
    } catch (retrieveError) {
      // Fallback: try search API
      try {
        await client.search({
          filter: {
            property: 'object',
            value: 'page'
          },
          page_size: 1
        });
        return { success: true };
      } catch (searchError) {
        throw retrieveError; // Throw original error
      }
    }
  } catch (error) {
    return { success: false, error };
  }
}

async function main() {
  console.log('\n🔍 Verifying Notion Integration Setup...\n');
  
  // Check .env file
  const env = checkEnvFile();
  
  if (!env.exists) {
    console.log('❌ server/.env file not found');
    console.log('   Run: npm run setup-notion\n');
    process.exit(1);
  }
  
  console.log('✅ server/.env file exists');
  
  // Check API key
  if (!env.apiKey) {
    console.log('❌ NOTION_API_KEY not found in server/.env');
    console.log('   Add: NOTION_API_KEY=secret_your_key_here\n');
    process.exit(1);
  }
  
  if (!env.apiKey.startsWith('secret_')) {
    console.log('⚠️  NOTION_API_KEY should start with "secret_"');
  } else {
    console.log('✅ NOTION_API_KEY is configured');
  }
  
  // Check Database ID
  if (!env.dbId) {
    console.log('❌ NOTION_DATABASE_ID not found in server/.env');
    console.log('   Add: NOTION_DATABASE_ID=your_database_id_here\n');
    process.exit(1);
  }
  
  console.log('✅ NOTION_DATABASE_ID is configured');
  
  // Test connection
  console.log('\n🔄 Testing connection...');
  const result = await testConnection(env.apiKey, env.dbId);
  
  if (result.success) {
    console.log('✅ Connection successful!');
    console.log('✅ Notion integration is ready to use!\n');
    process.exit(0);
  } else {
    const error = result.error;
    console.log('❌ Connection failed\n');
    
    if (error.code === 'object_not_found') {
      console.log('   Issue: Database not found');
      console.log('   Solution:');
      console.log('     • Verify the Database ID is correct');
      console.log('     • Make sure the database is shared with your integration\n');
    } else if (error.code === 'unauthorized') {
      console.log('   Issue: Unauthorized');
      console.log('   Solution:');
      console.log('     • Verify the API key is correct');
      console.log('     • Make sure the integration has access to the database\n');
    } else {
      console.log(`   Error: ${error.message || error}\n`);
    }
    
    process.exit(1);
  }
}

main().catch((error) => {
  console.error('\n❌ Error:', error.message);
  process.exit(1);
});
