#!/usr/bin/env node
/**
 * Test Notion Integration End-to-End
 */

import { readFileSync, existsSync } from 'fs';
import { join, dirname } from 'path';
import { fileURLToPath } from 'url';
import dotenv from 'dotenv';
import http from 'http';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);
const PROJECT_ROOT = join(__dirname, '..');

// Load .env
dotenv.config({ path: join(PROJECT_ROOT, 'server', '.env') });

const API_KEY = process.env.NOTION_API_KEY;
const DB_ID = process.env.NOTION_DATABASE_ID;

async function testNotionService() {
  console.log('\n🧪 Testing Notion Service...\n');
  
  if (!API_KEY) {
    console.log('❌ NOTION_API_KEY not found in server/.env');
    return false;
  }
  
  if (!DB_ID) {
    console.log('❌ NOTION_DATABASE_ID not found in server/.env');
    return false;
  }
  
  console.log('✅ API Key found');
  console.log('✅ Database ID found');
  
  try {
    const { Client } = await import('@notionhq/client');
    const client = new Client({ auth: API_KEY });
    
    // Test 1: Retrieve database
    console.log('\n📊 Test 1: Retrieving database...');
    try {
      const db = await client.databases.retrieve({ database_id: DB_ID });
      console.log('✅ Database retrieved:', db.title?.[0]?.plain_text || 'Untitled');
    } catch (e) {
      console.log('❌ Failed to retrieve database:', e.message);
      return false;
    }
    
    // Test 2: Query database
    console.log('\n📋 Test 2: Querying database...');
    try {
      const response = await client.databases.query({ database_id: DB_ID });
      console.log('✅ Query successful, found', response.results.length, 'items');
    } catch (e) {
      console.log('⚠️  Query failed (might need database sharing):', e.message);
    }
    
    return true;
  } catch (error) {
    console.log('❌ Error:', error.message);
    return false;
  }
}

async function testAPIEndpoints() {
  console.log('\n🌐 Testing API Endpoints...\n');
  
  return new Promise((resolve) => {
    // Start a quick server test
    const testPort = 5999;
    
    // Import and start app
    import(join(PROJECT_ROOT, 'server', 'src', 'index.js'))
      .then(() => {
        // Give server a moment to start
        setTimeout(async () => {
          try {
            // Test status endpoint
            const response = await fetch(`http://localhost:${testPort}/api/notion/status`);
            const data = await response.json();
            
            console.log('✅ Status endpoint works');
            console.log('   Available:', data.available);
            console.log('   Configured:', data.configured);
            
            resolve(true);
          } catch (e) {
            console.log('⚠️  Could not test API endpoints (server not running)');
            console.log('   Start server with: cd server && npm run dev');
            resolve(false);
          }
        }, 2000);
      })
      .catch(() => {
        console.log('⚠️  Could not test API endpoints');
        resolve(false);
      });
  });
}

async function main() {
  console.log('🔍 Testing Notion Integration');
  console.log('='.repeat(50));
  
  const serviceTest = await testNotionService();
  
  if (serviceTest) {
    console.log('\n✅ Notion service is working!');
  } else {
    console.log('\n❌ Notion service has issues');
    console.log('\nTroubleshooting:');
    console.log('  1. Check server/.env has both NOTION_API_KEY and NOTION_DATABASE_ID');
    console.log('  2. Make sure database is shared with your integration');
    console.log('  3. Verify API key is correct');
  }
  
  // Test API endpoints if server is running
  await testAPIEndpoints();
  
  console.log('\n' + '='.repeat(50));
  console.log('Test complete!');
  console.log('='.repeat(50));
}

main().catch(console.error);

