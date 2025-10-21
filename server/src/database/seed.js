#!/usr/bin/env node
import fs from 'fs';
import path from 'path';
import pg from 'pg';

const { Pool } = pg;

function createPool() {
  return new Pool({
    connectionString: process.env.DATABASE_URL,
    ssl: process.env.NODE_ENV === 'production' ? { rejectUnauthorized: false } : false
  });
}

async function runSeed() {
  const pool = createPool();
  const client = await pool.connect();

  try {
    const seedFile = path.join(process.cwd(), 'server', 'src', 'database', 'seed.sql');
    const seedsDir = path.join(process.cwd(), 'server', 'src', 'database', 'seeds');

    if (fs.existsSync(seedFile)) {
      const sql = fs.readFileSync(seedFile, 'utf8');
      console.log('▶ Running seed.sql');
      await client.query('BEGIN');
      try {
        await client.query(sql);
        await client.query('COMMIT');
        console.log('✅ seed.sql applied');
      } catch (err) {
        await client.query('ROLLBACK');
        throw err;
      }
    } else if (fs.existsSync(seedsDir)) {
      const files = fs.readdirSync(seedsDir).filter(f => f.endsWith('.sql')).sort();
      for (const file of files) {
        const sql = fs.readFileSync(path.join(seedsDir, file), 'utf8');
        console.log(`▶ Applying seed: ${file}`);
        await client.query('BEGIN');
        try {
          await client.query(sql);
          await client.query('COMMIT');
          console.log(`✅ Applied: ${file}`);
        } catch (err) {
          await client.query('ROLLBACK');
          throw err;
        }
      }
    } else {
      console.log('ℹ️  No seed.sql or seeds/ directory found; nothing to do.');
    }

    await client.release();
    await pool.end();
  } catch (err) {
    try { await client.release(); } catch (e) {}
    try { await pool.end(); } catch (e) {}
    console.error('Seeding failed:', err?.message || err);
    process.exit(1);
  }
}

if (process.env.NODE_ENV !== 'test') {
  runSeed();
}

export default runSeed;
