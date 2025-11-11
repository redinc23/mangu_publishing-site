#!/usr/bin/env node
/**
 * Fully Automated Notion Setup
 * Does everything possible automatically
 */

import { writeFileSync, readFileSync, existsSync, mkdirSync } from 'fs';
import { join, dirname } from 'path';
import { fileURLToPath } from 'url';
import { execSync } from 'child_process';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);
const PROJECT_ROOT = join(__dirname, '..');

function ensureEnvFile() {
  const envPath = join(PROJECT_ROOT, 'server', '.env');
  const envDir = join(PROJECT_ROOT, 'server');
  
  if (!existsSync(envDir)) {
    mkdirSync(envDir, { recursive: true });
  }
  
  if (!existsSync(envPath)) {
    writeFileSync(envPath, '# Notion AI Integration\n\n', 'utf8');
    console.log('✅ Created server/.env file');
  }
  
  return envPath;
}

function updateEnvFile(key, value) {
  const envPath = ensureEnvFile();
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

function installDependencies() {
  console.log('\n📦 Installing dependencies...');
  try {
    const serverPath = join(PROJECT_ROOT, 'server');
    execSync('npm install @notionhq/client', { 
      cwd: serverPath, 
      stdio: 'inherit' 
    });
    console.log('✅ Dependencies installed');
    return true;
  } catch (error) {
    console.log('⚠️  Could not install dependencies automatically');
    console.log('   Run manually: cd server && npm install @notionhq/client');
    return false;
  }
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
  console.log('\n🤖 Automated Notion Setup');
  console.log('='.repeat(50));
  console.log('\nThis script will:');
  console.log('  1. ✅ Create server/.env file');
  console.log('  2. ✅ Install @notionhq/client package');
  console.log('  3. ✅ Open Notion integrations page');
  console.log('  4. ✅ Prompt for your credentials');
  console.log('  5. ✅ Save everything automatically');
  console.log('  6. ✅ Verify the setup\n');
  
  // Step 1: Ensure .env exists
  console.log('📝 Step 1: Setting up environment file...');
  ensureEnvFile();
  console.log('✅ Environment file ready\n');
  
  // Step 2: Install dependencies
  console.log('📦 Step 2: Checking dependencies...');
  const serverPath = join(PROJECT_ROOT, 'server');
  const packageJsonPath = join(serverPath, 'package.json');
  
  if (existsSync(packageJsonPath)) {
    const pkg = JSON.parse(readFileSync(packageJsonPath, 'utf8'));
    const hasNotion = pkg.dependencies?.['@notionhq/client'] || 
                      pkg.devDependencies?.['@notionhq/client'];
    
    if (!hasNotion) {
      installDependencies();
    } else {
      console.log('✅ @notionhq/client already in package.json');
    }
  } else {
    installDependencies();
  }
  
  // Step 3: Open browser
  console.log('\n🌐 Step 3: Opening Notion integrations page...');
  const opened = openBrowser('https://www.notion.so/my-integrations');
  if (opened) {
    console.log('✅ Browser opened');
  } else {
    console.log('⚠️  Could not open browser automatically');
    console.log('   Please visit: https://www.notion.so/my-integrations');
  }
  
  console.log('\n📋 Instructions:');
  console.log('  1. Click "+ New integration"');
  console.log('  2. Name it "MANGU Publishing"');
  console.log('  3. Copy the "Internal Integration Token" (starts with secret_)');
  console.log('  4. Create a database in Notion');
  console.log('  5. Share it with your integration');
  console.log('  6. Copy the Database ID from the URL\n');
  
  // Step 4: Get credentials
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
  
  let apiKey = '';
  while (!apiKey.trim() || (!apiKey.trim().startsWith('secret_') && apiKey.trim() !== '')) {
    apiKey = await question('\n🔑 Enter your Notion API Key (starts with "secret_"): ');
    if (!apiKey.trim()) {
      const skip = await question('Skip API key? (y/n): ');
      if (skip.toLowerCase() === 'y') break;
    } else if (!apiKey.trim().startsWith('secret_')) {
      console.log('⚠️  API key should start with "secret_"');
    }
  }
  
  if (apiKey.trim() && apiKey.trim().startsWith('secret_')) {
    updateEnvFile('NOTION_API_KEY', apiKey.trim());
    console.log('✅ API key saved to server/.env');
  }
  
  let dbId = '';
  while (!dbId.trim()) {
    dbId = await question('\n📊 Enter your Notion Database ID: ');
    if (!dbId.trim()) {
      const skip = await question('Skip Database ID? (y/n): ');
      if (skip.toLowerCase() === 'y') break;
    }
  }
  
  if (dbId.trim()) {
    updateEnvFile('NOTION_DATABASE_ID', dbId.trim());
    console.log('✅ Database ID saved to server/.env');
  }
  
  rl.close();
  
  // Step 5: Verify
  console.log('\n🔍 Step 5: Verifying setup...');
  try {
    execSync('npm run verify-notion', { 
      cwd: PROJECT_ROOT, 
      stdio: 'inherit' 
    });
  } catch {
    console.log('\n⚠️  Verification had issues, but setup is complete');
    console.log('   You can verify manually with: npm run verify-notion\n');
  }
  
  console.log('\n' + '='.repeat(50));
  console.log('✅ Setup Complete!');
  console.log('='.repeat(50));
  console.log('\nNext steps:');
  console.log('  1. Start server: cd server && npm run dev');
  console.log('  2. Visit: http://localhost:5000/api/notion/status');
  console.log('  3. Use in: /admin/books/new\n');
}

main().catch((error) => {
  console.error('\n❌ Error:', error.message);
  process.exit(1);
});

