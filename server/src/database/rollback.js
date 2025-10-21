#!/usr/bin/env node
import fs from 'fs';
import path from 'path';
import pg from 'pg';

const { Pool } = pg;

function createPool() {
  return new Pool({ connectionString: process.env.DATABASE_URL });
}

async function rollback() {
  const pool = createPool();
  const client = await pool.connect();

  try {
    const hasTable = await client.query(`SELECT to_regclass('public.schema_migrations') as exists`);
    if (!hasTable.rows[0].exists) {
      console.log('ℹ️  No schema_migrations table found; nothing to rollback');
      await client.release();
      await pool.end();
      return;
    }

    const res = await client.query('SELECT filename FROM schema_migrations ORDER BY applied_at DESC LIMIT 1');
    if (res.rowCount === 0) {
      console.log('ℹ️  No applied migrations to rollback');
      await client.release();
      await pool.end();
      return;
    }

    const lastFile = res.rows[0].filename;
    console.log(`▶ Last applied migration: ${lastFile}`);

    // Look for a rollback counterpart: filename.down.sql or filename.rollback.sql
    const migrationsDir = path.join(process.cwd(), 'server', 'src', 'database', 'migrations');
    const candidates = [
      path.join(migrationsDir, `${lastFile}.down.sql`),
      path.join(migrationsDir, `${lastFile}.rollback.sql`),
      path.join(migrationsDir, lastFile.replace('.sql', '.down.sql'))
    ];

    const found = candidates.find(p => fs.existsSync(p));

    if (found) {
      const sql = fs.readFileSync(found, 'utf8');
      console.log(`▶ Running rollback SQL: ${path.basename(found)}`);
      await client.query('BEGIN');
      try {
        await client.query(sql);
        await client.query('DELETE FROM schema_migrations WHERE filename = $1', [lastFile]);
        await client.query('COMMIT');
        console.log(`✅ Rolled back migration: ${lastFile}`);
      } catch (err) {
        await client.query('ROLLBACK');
        throw err;
      }
    } else {
      console.log('⚠️  No rollback script found for', lastFile);
      console.log('⚠️  To undo this migration manually, inspect the migration SQL and create a rollback script in migrations/');
      console.log('⚠️  If you still want to remove the migration record (dangerous), rerun with REMOVE_RECORD=1');

      if (process.env.REMOVE_RECORD === '1') {
        await client.query('DELETE FROM schema_migrations WHERE filename = $1', [lastFile]);
        console.log(`✅ Migration record removed: ${lastFile}`);
      }
    }

    await client.release();
    await pool.end();
  } catch (err) {
    try { await client.release(); } catch (e) {}
    try { await pool.end(); } catch (e) {}
    console.error('Rollback failed:', err?.message || err);
    process.exit(1);
  }
}

if (process.env.NODE_ENV !== 'test') {
  rollback();
}

export default rollback;
