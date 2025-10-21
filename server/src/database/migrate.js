#!/usr/bin/env node
import fs from 'fs';
import path from 'path';
import pg from 'pg';

const { Pool } = pg;

function createPoolFromEnv() {
  return new Pool({
    connectionString: process.env.DATABASE_URL,
    ssl: process.env.NODE_ENV === 'production' ? { rejectUnauthorized: false } : false,
    max: parseInt(process.env.DATABASE_POOL_MAX || '20', 10),
    min: parseInt(process.env.DATABASE_POOL_MIN || '2', 10)
  });
}

async function runSql(client, sql, fileLabel = 'script') {
  try {
    await client.query(sql);
    console.log(`✅ Executed ${fileLabel}`);
  } catch (err) {
    console.error(`❌ Error executing ${fileLabel}:`, err?.message || err);
    throw err;
  }
}

async function runMigrations() {
  const pool = createPoolFromEnv();
  const client = await pool.connect();

  try {
    const migrationsDir = path.join(process.cwd(), 'server', 'src', 'database', 'migrations');

    if (fs.existsSync(migrationsDir)) {
      // Ensure migrations table
      await client.query(`CREATE TABLE IF NOT EXISTS schema_migrations (id SERIAL PRIMARY KEY, filename TEXT UNIQUE, applied_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP)`);

      const files = fs.readdirSync(migrationsDir).filter(f => f.endsWith('.sql')).sort();

      for (const file of files) {
        const res = await client.query('SELECT 1 FROM schema_migrations WHERE filename = $1 LIMIT 1', [file]);
        if (res.rowCount > 0) {
          console.log(`⏭ Skipping already-applied migration: ${file}`);
          continue;
        }

        const sql = fs.readFileSync(path.join(migrationsDir, file), 'utf8');
        console.log(`▶ Applying migration: ${file}`);
        await client.query('BEGIN');
        try {
          await runSql(client, sql, file);
          await client.query('INSERT INTO schema_migrations (filename) VALUES ($1)', [file]);
          await client.query('COMMIT');
          console.log(`✅ Migration applied: ${file}`);
        } catch (err) {
          await client.query('ROLLBACK');
          throw err;
        }
      }

      console.log('🎉 All migrations processed');
    } else {
      // Fallback to init.sql
      const fallback = path.join(process.cwd(), 'server', 'src', 'database', 'init.sql');
      if (!fs.existsSync(fallback)) {
        throw new Error('No migrations found and init.sql missing');
      }

      const sql = fs.readFileSync(fallback, 'utf8');
      console.log('▶ Running fallback schema from init.sql');
      await runSql(client, sql, 'init.sql');
      console.log('✅ Schema initialized from init.sql');
    }

    await client.release();
    await pool.end();
  } catch (err) {
    try { await client.release(); } catch (e) {}
    try { await pool.end(); } catch (e) {}
    console.error('Migration failed:', err?.message || err);
    process.exit(1);
  }
}

if (process.env.NODE_ENV !== 'test') {
  runMigrations();
}

export default runMigrations;
