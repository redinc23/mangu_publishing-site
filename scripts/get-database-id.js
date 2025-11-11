#!/usr/bin/env node
/**
 * Get Database ID - Helps you create database and get the ID
 */

import { readFileSync, existsSync, writeFileSync } from 'fs';
import { join, dirname } from 'path';
import { fileURLToPath } from 'url';
import { execSync } from 'child_process';
import dotenv from 'dotenv';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);
const PROJECT_ROOT = join(__dirname, '..');

// Load .env
dotenv.config({ path: join(PROJECT_ROOT, 'server', '.env') });

function updateEnvFile(key, value) {
  const envPath = join(PROJECT_ROOT, 'server', '.env');
  let envContent = '';
  
  if (existsSync(envPath)) {
    envContent = readFileSync(envPath, 'utf8');
  }
  
  const lines = envContent.split('\n');
  const filtered = lines.filter(line => {
    const trimmed = line.trim();
    return !trimmed.startsWith(`${key}=`) && !trimmed.startsWith(`# ${key}`);
  });
  
  if (value && value.trim()) {
    filtered.push(`${key}=${value.trim()}`);
  }
  
  writeFileSync(envPath, filtered.join('\n') + '\n', 'utf8');
}

function openBrowser(url) {
  const platform = process.platform;
  try {
    if (platform === 'darwin') {
      execSync(`open "${url}"`);
    } else if (platform === 'linux') {
      execSync(`xdg-open "${url}"`);
    } else if (platform === 'win32') {
      execSync(`start "${url}"`);
    }
    return true;
  } catch {
    return false;
  }
}

async function main() {
  console.log('\n📊 Getting Database ID');
  console.log('='.repeat(50));
  console.log('');
  
  const apiKey = process.env.NOTION_API_KEY;
  if (!apiKey) {
    console.log('❌ No API key found. Run setup first.');
    process.exit(1);
  }
  
  console.log('✅ API key is configured');
  console.log('');
  console.log('📋 Step 1: Create Database in Notion');
  console.log('-'.repeat(50));
  console.log('  1. Open Notion and create a new page');
  console.log('  2. Type "/database" and select "Table - Inline"');
  console.log('  3. Add these properties:');
  console.log('     • Title (Title type) - Required');
  console.log('     • Description (Text type)');
  console.log('     • Authors (Multi-select)');
  console.log('     • Price (Number)');
  console.log('     • Publication Date (Date)');
  console.log('     • Tags (Multi-select)');
  console.log('  4. Click "Share" → "Invite" → Select "LALA" integration');
  console.log('  5. Copy the Database ID from the URL');
  console.log('');
  console.log('  The Database ID is the long string before "?" in the URL');
  console.log('  Example: https://www.notion.so/workspace/abc123def456?v=...');
  console.log('  Database ID: abc123def456');
  console.log('');
  
  // Try to open Notion
  console.log('🌐 Opening Notion...');
  openBrowser('https://www.notion.so');
  console.log('');
  
  const readline = await import('readline');
  const rl = readline.createInterface({
    input: process.stdin,
    output: process.stdout
  });
  
  function question(prompt) {
    return new Promise((resolve) => {
      rl.question(prompt, resolve);
    });
  }
  
  let dbId = '';
  while (!dbId.trim()) {
    dbId = await question('📊 Paste your Database ID (or full URL): ');
    if (!dbId.trim()) {
      const skip = await question('Skip Database ID? (y/n): ');
      if (skip.toLowerCase() === 'y') {
        console.log('⚠️  Skipping. Add it later to server/.env');
        rl.close();
        return;
      }
    }
  }
  
  rl.close();
  
  // Clean up the database ID (extract from URL if needed)
  let cleanDbId = dbId.trim();
  
  // If it's a URL, extract the ID
  if (cleanDbId.includes('notion.so')) {
    // Extract ID from URL like: https://www.notion.so/workspace/ID?v=...
    const match = cleanDbId.match(/notion\.so\/[^\/]+\/([a-zA-Z0-9]+)/);
    if (match) {
      cleanDbId = match[1];
    } else {
      // Try to get the part before ?
      cleanDbId = cleanDbId.split('?')[0].split('/').pop();
    }
  }
  
  // Remove any dashes (Notion IDs don't have dashes)
  cleanDbId = cleanDbId.replace(/-/g, '');
  
  updateEnvFile('NOTION_DATABASE_ID', cleanDbId);
  console.log('');
  console.log('✅ Database ID saved:', cleanDbId);
  
  // Test the connection
  console.log('');
  console.log('🔍 Testing connection...');
  try {
    const { Client } = await import('@notionhq/client');
    const client = new Client({ auth: apiKey });
    
    await client.databases.query({ database_id: cleanDbId });
    
    console.log('✅ Connection successful!');
    console.log('✅ Notion integration is ready to use!');
    console.log('');
    console.log('🚀 Next steps:');
    console.log('  1. Start server: cd server && npm run dev');
    console.log('  2. Check status: curl http://localhost:5000/api/notion/status');
    console.log('  3. Use in: /admin/books/new');
    console.log('');
  } catch (error) {
    console.log('❌ Connection test failed');
    console.log('');
    
    if (error.code === 'object_not_found') {
      console.log('Issue: Database not found');
      console.log('Solution:');
      console.log('  • Verify the Database ID is correct');
      console.log('  • Make sure the database is shared with "LALA" integration');
      console.log('');
    } else {
      console.log('Error:', error.message);
      console.log('');
    }
    
    console.log('The Database ID is saved, but please verify it\'s correct.');
    console.log('You can test again with: npm run verify-notion');
    console.log('');
  }
}

main().catch((error) => {
  console.error('\n❌ Error:', error.message);
  process.exit(1);
});

