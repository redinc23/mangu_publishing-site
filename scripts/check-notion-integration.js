#!/usr/bin/env node
/**
 * Check which Notion integration we're using
 */

import { Client } from '@notionhq/client';
import dotenv from 'dotenv';
import { readFileSync, existsSync } from 'fs';
import { join, dirname } from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

const envPath = join(__dirname, '..', 'server', '.env');
if (existsSync(envPath)) {
  dotenv.config({ path: envPath });
}

const apiKey = process.env.NOTION_API_KEY;

if (!apiKey) {
  console.log('❌ NOTION_API_KEY not found');
  process.exit(1);
}

const client = new Client({ auth: apiKey });

try {
  const me = await client.users.me();
  console.log('\n✅ Your Notion Integration:');
  console.log('   Name:', me.name || 'Unnamed');
  console.log('   ID:', me.id);
  console.log('   Type:', me.type);
  console.log('\n📝 Make sure you shared your database with THIS integration:');
  console.log('   → Integration name:', me.name || me.id);
  console.log('   → Go to: https://www.notion.so/cc324cc3822b4144959b8c5eb7f32d77');
  console.log('   → Click "Share" → "Invite" → Look for:', me.name || me.id);
  console.log('');
} catch (error) {
  console.log('❌ Error:', error.message);
  process.exit(1);
}

