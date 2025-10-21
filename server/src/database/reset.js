#!/usr/bin/env node
import fs from 'fs';
import path from 'path';
import pg from 'pg';

const { Pool } = pg;

function createPool() {
  return new Pool({ connectionString: process.env.DATABASE_URL });
}

async function resetDatabase() {
  if (process.env.FORCE_RESET !== '1') {
    console.error('Refusing to reset database. Set FORCE_RESET=1 to confirm.');
    process.exit(1);
  }

  const pool = createPool();
  const client = await pool.connect();

  try {
    console.log('▶ Dropping and recreating public schema (this will REMOVE ALL DATA)');
    await client.query('DROP SCHEMA public CASCADE');
    await client.query('CREATE SCHEMA public');

    const initFile = path.join(process.cwd(), 'server', 'src', 'database', 'init.sql');
    if (!fs.existsSync(initFile)) {
      throw new Error('init.sql not found; cannot initialize schema');
    }

    const sql = fs.readFileSync(initFile, 'utf8');
    console.log('▶ Applying init.sql');
    await client.query('BEGIN');
    try {
      await client.query(sql);
      await client.query('COMMIT');
      console.log('✅ Database schema re-initialized from init.sql');
    } catch (err) {
      await client.query('ROLLBACK');
      throw err;
    }

    await client.release();
    await pool.end();
  } catch (err) {
    try { await client.release(); } catch (e) {}
    try { await pool.end(); } catch (e) {}
    console.error('Reset failed:', err?.message || err);
    process.exit(1);
  }
}

if (process.env.NODE_ENV !== 'test') {
  resetDatabase();
}

export default resetDatabase;
