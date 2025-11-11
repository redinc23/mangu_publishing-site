#!/usr/bin/env node
/**
 * Complete Notion Setup - Gets your API key and completes configuration
 */

import { writeFileSync, readFileSync, existsSync } from 'fs';
import { join, dirname } from 'path';
import { fileURLToPath } from 'url';
import { execSync } from 'child_process';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);
const PROJECT_ROOT = join(__dirname, '..');

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
  console.log('\n🚀 Completing Notion Setup');
  console.log('='.repeat(50));
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
  
  console.log('Great! Your integration "LALA" is created.');
  console.log('');
  console.log('📋 Step 1: Get Your API Key');
  console.log('-'.repeat(50));
  console.log('The API key (Internal Integration Token) is different from the integration ID.');
  console.log('');
  console.log('To get it:');
  console.log('  1. Go to: https://www.notion.so/my-integrations');
  console.log('  2. Click on your "LALA" integration');
  console.log('  3. Under "Internal Integration Token", click "Show"');
  console.log('  4. Copy the token (it starts with "secret_")');
  console.log('');
  
  // Open the integrations page
  console.log('🌐 Opening Notion integrations page...');
  openBrowser('https://www.notion.so/my-integrations');
  console.log('');
  
  let apiKey = '';
  while (!apiKey.trim() || (!apiKey.trim().startsWith('secret_') && apiKey.trim() !== '')) {
    apiKey = await question('🔑 Paste your API Key (starts with "secret_"): ');
    if (!apiKey.trim()) {
      const skip = await question('Skip API key? (y/n): ');
      if (skip.toLowerCase() === 'y') break;
    } else if (!apiKey.trim().startsWith('secret_')) {
      console.log('⚠️  API key should start with "secret_"');
      console.log('   Make sure you copied the "Internal Integration Token", not the integration ID');
    }
  }
  
  if (apiKey.trim() && apiKey.trim().startsWith('secret_')) {
    updateEnvFile('NOTION_API_KEY', apiKey.trim());
    console.log('✅ API key saved!');
  }
  
  console.log('');
  console.log('📋 Step 2: Create Database');
  console.log('-'.repeat(50));
  console.log('Now create a database in Notion:');
  console.log('');
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
  console.log('   The Database ID is the long string before "?" in the URL');
  console.log('   Example: https://www.notion.so/workspace/abc123def456?v=...');
  console.log('   Database ID: abc123def456');
  console.log('');
  
  let dbId = '';
  while (!dbId.trim()) {
    dbId = await question('📊 Paste your Database ID: ');
    if (!dbId.trim()) {
      const skip = await question('Skip Database ID? (y/n): ');
      if (skip.toLowerCase() === 'y') break;
    }
  }
  
  if (dbId.trim()) {
    // Clean up the database ID (remove any URL parts if pasted)
    const cleanDbId = dbId.trim().split('?')[0].split('/').pop();
    updateEnvFile('NOTION_DATABASE_ID', cleanDbId);
    console.log('✅ Database ID saved!');
  }
  
  rl.close();
  
  // Verify setup
  console.log('');
  console.log('🔍 Verifying setup...');
  try {
    execSync('npm run verify-notion', { 
      cwd: PROJECT_ROOT, 
      stdio: 'inherit' 
    });
  } catch {
    console.log('');
    console.log('⚠️  Setup complete, but verification had issues.');
    console.log('   You can verify manually with: npm run verify-notion');
  }
  
  console.log('');
  console.log('='.repeat(50));
  console.log('✅ Setup Complete!');
  console.log('='.repeat(50));
  console.log('');
  console.log('Next steps:');
  console.log('  1. Start server: cd server && npm run dev');
  console.log('  2. Check status: curl http://localhost:5000/api/notion/status');
  console.log('  3. Use in: /admin/books/new');
  console.log('');
}

main().catch((error) => {
  console.error('\n❌ Error:', error.message);
  process.exit(1);
});

