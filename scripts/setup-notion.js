#!/usr/bin/env node
/**
 * Automated Notion AI Integration Setup Script
 * Run with: npm run setup-notion
 */

import { createInterface } from 'readline';
import { writeFileSync, readFileSync, existsSync } from 'fs';
import { join, dirname } from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);
const PROJECT_ROOT = join(__dirname, '..');

const rl = createInterface({
  input: process.stdin,
  output: process.stdout
});

function question(prompt) {
  return new Promise((resolve) => {
    rl.question(prompt, resolve);
  });
}

function updateEnvFile(key, value) {
  const envPath = join(PROJECT_ROOT, 'server', '.env');
  let envContent = '';
  
  if (existsSync(envPath)) {
    envContent = readFileSync(envPath, 'utf8');
  }
  
  // Remove existing key if present
  const lines = envContent.split('\n');
  const filtered = lines.filter(line => {
    const trimmed = line.trim();
    return !trimmed.startsWith(`${key}=`) && !trimmed.startsWith(`# ${key}`);
  });
  
  // Add new key-value pair if value provided
  if (value && value.trim()) {
    filtered.push(`${key}=${value.trim()}`);
  }
  
  // Write back
  const newContent = filtered.filter(l => l.trim() || filtered.indexOf(l) === filtered.length - 1).join('\n');
  writeFileSync(envPath, newContent + (newContent.endsWith('\n') ? '' : '\n'), 'utf8');
}

function printHeader(text) {
  console.log('\n' + '='.repeat(60));
  console.log(`  ${text}`);
  console.log('='.repeat(60) + '\n');
}

function printStep(step, title) {
  console.log(`\n📋 Step ${step}: ${title}`);
  console.log('-'.repeat(60));
}

async function testConnection(apiKey, dbId) {
  try {
    const { Client } = await import('@notionhq/client');
    const client = new Client({ auth: apiKey });
    
    console.log('🔄 Testing connection...');
    await client.databases.query({ database_id: dbId });
    return { success: true };
  } catch (error) {
    return { success: false, error };
  }
}

async function main() {
  console.clear();
  printHeader('Notion AI Integration Setup');
  
  console.log('This script will help you configure Notion AI integration.');
  console.log('You\'ll need:');
  console.log('  1. A Notion account');
  console.log('  2. Access to create integrations');
  console.log('  3. A Notion workspace\n');
  
  const proceed = await question('Ready to start? (y/n): ');
  if (proceed.toLowerCase() !== 'y') {
    console.log('\nSetup cancelled. Run this script again when ready.\n');
    rl.close();
    return;
  }
  
  // Step 1: API Key
  printStep(1, 'Get Your Notion API Key');
  console.log('📝 Instructions:');
  console.log('   1. Open: https://www.notion.so/my-integrations');
  console.log('   2. Click "+ New integration"');
  console.log('   3. Name it "MANGU Publishing" (or any name)');
  console.log('   4. Copy the "Internal Integration Token"');
  console.log('      (It starts with "secret_")\n');
  
  let apiKey = '';
  while (!apiKey.trim() || (!apiKey.trim().startsWith('secret_') && apiKey.trim() !== '')) {
    apiKey = await question('Enter your Notion API Key (or press Enter to skip): ');
    if (!apiKey.trim()) {
      const skip = await question('Skip API key setup? (y/n): ');
      if (skip.toLowerCase() === 'y') {
        console.log('⚠️  Skipping API key. Add it later to server/.env\n');
        break;
      }
    } else if (!apiKey.trim().startsWith('secret_')) {
      console.log('⚠️  API key should start with "secret_". Please try again.\n');
    }
  }
  
  if (apiKey.trim() && apiKey.trim().startsWith('secret_')) {
    updateEnvFile('NOTION_API_KEY', apiKey.trim());
    console.log('✅ API key saved to server/.env\n');
  }
  
  // Step 2: Database ID
  printStep(2, 'Create Notion Database');
  console.log('📝 Instructions:');
  console.log('   1. In Notion, create a new page');
  console.log('   2. Type "/database" and select "Table - Inline"');
  console.log('   3. Add these properties:');
  console.log('      • Title (Title type) - Required');
  console.log('      • Description (Text type)');
  console.log('      • Authors (Multi-select)');
  console.log('      • Price (Number)');
  console.log('      • Publication Date (Date)');
  console.log('      • Tags (Multi-select)');
  console.log('   4. Click "Share" → "Invite" → Select your integration');
  console.log('   5. Copy the Database ID from the URL');
  console.log('\n   The Database ID is the long string before "?" in the URL');
  console.log('   Example: https://www.notion.so/workspace/abc123def456?v=...');
  console.log('   Database ID: abc123def456\n');
  
  let dbId = '';
  while (!dbId.trim()) {
    dbId = await question('Enter your Notion Database ID (or press Enter to skip): ');
    if (!dbId.trim()) {
      const skip = await question('Skip database ID setup? (y/n): ');
      if (skip.toLowerCase() === 'y') {
        console.log('⚠️  Skipping database ID. Add it later to server/.env\n');
        break;
      }
    }
  }
  
  if (dbId.trim()) {
    updateEnvFile('NOTION_DATABASE_ID', dbId.trim());
    console.log('✅ Database ID saved to server/.env\n');
  }
  
  // Step 3: Test Connection
  if (apiKey.trim() && dbId.trim()) {
    printStep(3, 'Testing Connection');
    
    const result = await testConnection(apiKey.trim(), dbId.trim());
    
    if (result.success) {
      console.log('✅ Connection successful!');
      console.log('✅ Your Notion integration is ready to use!\n');
    } else {
      const error = result.error;
      console.log('❌ Connection test failed\n');
      
      if (error.code === 'object_not_found') {
        console.log('   Issue: Database not found');
        console.log('   Solution:');
        console.log('     • Verify the Database ID is correct');
        console.log('     • Make sure the database is shared with your integration\n');
      } else if (error.code === 'unauthorized') {
        console.log('   Issue: Unauthorized access');
        console.log('   Solution:');
        console.log('     • Verify the API key is correct');
        console.log('     • Make sure the integration has access to the database\n');
      } else {
        console.log(`   Error: ${error.message}`);
        console.log('   You can still proceed - this might be a temporary issue.\n');
      }
    }
  }
  
  // Summary
  printHeader('Setup Complete!');
  
  console.log('📝 Configuration saved to: server/.env\n');
  
  if (apiKey.trim() && dbId.trim()) {
    console.log('✅ Both API key and Database ID are configured');
  } else {
    console.log('⚠️  Configuration incomplete');
    console.log('   Add missing values to server/.env:\n');
    if (!apiKey.trim()) {
      console.log('   NOTION_API_KEY=secret_your_key_here');
    }
    if (!dbId.trim()) {
      console.log('   NOTION_DATABASE_ID=your_database_id_here');
    }
    console.log('');
  }
  
  console.log('🚀 Next Steps:');
  console.log('   1. Start your server: cd server && npm run dev');
  console.log('   2. Check status: http://localhost:5000/api/notion/status');
  console.log('   3. Use NotionAI in: /admin/books/new\n');
  
  console.log('📚 Documentation:');
  console.log('   • Quick Start: See NOTION_QUICKSTART.md (if exists)');
  console.log('   • Full Guide: See NOTION_AI_SETUP.md (if exists)\n');
  
  rl.close();
}

main().catch((error) => {
  console.error('\n❌ Error:', error.message);
  if (error.code === 'MODULE_NOT_FOUND') {
    console.log('\n💡 Tip: Make sure @notionhq/client is installed:');
    console.log('   cd server && npm install @notionhq/client\n');
  }
  rl.close();
  process.exit(1);
});


