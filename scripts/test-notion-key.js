#!/usr/bin/env node
/**
 * Test Notion API Key
 */

import { Client } from '@notionhq/client';
import { readFileSync, existsSync } from 'fs';
import { join, dirname } from 'path';
import { fileURLToPath } from 'url';
import dotenv from 'dotenv';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);
const PROJECT_ROOT = join(__dirname, '..');

// Load .env
dotenv.config({ path: join(PROJECT_ROOT, 'server', '.env') });

const apiKey = process.env.NOTION_API_KEY;

if (!apiKey) {
  console.log('❌ No API key found in server/.env');
  process.exit(1);
}

console.log('🔑 Testing API key:', apiKey.substring(0, 20) + '...');
console.log('');

try {
  const client = new Client({ auth: apiKey });
  
  // Try to list integrations or search
  console.log('🔄 Testing connection...');
  
  // Try a simple API call
  const response = await client.search({
    filter: {
      property: 'object',
      value: 'page'
    },
    page_size: 1
  });
  
  console.log('✅ API key works!');
  console.log('✅ Connection successful!');
  console.log('');
  console.log('Next: Create a database and get the Database ID');
  console.log('Run: npm run complete-notion');
  
} catch (error) {
  console.log('❌ API key test failed');
  console.log('');
  
  if (error.code === 'unauthorized' || error.message.includes('401')) {
    console.log('Issue: Invalid API key');
    console.log('');
    console.log('The key you provided starts with "ntn_" but Notion API keys');
    console.log('usually start with "secret_".');
    console.log('');
    console.log('To get the correct API key:');
    console.log('  1. Go to: https://www.notion.so/my-integrations');
    console.log('  2. Click on your "LALA" integration');
    console.log('  3. Look for "Internal Integration Token"');
    console.log('  4. Click "Show" to reveal it');
    console.log('  5. Copy the token (it should start with "secret_")');
    console.log('');
    console.log('The "ntn_" token might be an integration ID, not the API key.');
  } else {
    console.log('Error:', error.message);
  }
  
  process.exit(1);
}

