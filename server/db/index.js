let dbApi = null;
let initPromise = null;

async function bootstrap() {
  if (dbApi) return dbApi;
  if (initPromise) return initPromise;

  initPromise = (async () => {
    const fs = require('fs');
    const path = require('path');
    const bcrypt = require('bcryptjs');

    if (process.env.VERCEL && !process.env.DATABASE_URL) {
      throw new Error('DATABASE_URL manquant sur Vercel');
    }

    const driver = process.env.DATABASE_DRIVER || (process.env.DATABASE_URL ? 'postgres' : 'sqlite');

    if (driver === 'postgres' || process.env.DATABASE_URL) {
      const pg = require('./postgres');
      const db = await pg.initDb();
      await ensureAdmin(db);
      dbApi = db;
      return dbApi;
    }

    const sqlite = require('./sqlite');
    dbApi = await sqlite.initDb();
    console.log('  → Base de données : SQLite (local)');
    return dbApi;
  })().catch((err) => {
    initPromise = null;
    throw err;
  });

  return initPromise;
}

function getDb() {
  if (!dbApi) throw new Error('Database not initialized. Call initDb() first.');
  return dbApi;
}

async function ensureAdmin(db) {
  const username = process.env.ADMIN_USERNAME || 'admin';
  const password = process.env.ADMIN_PASSWORD;
  if (!password) return;

  const existing = await db.prepare('SELECT id FROM admins WHERE username = ?').get(username);
  if (!existing) {
    const hash = bcrypt.hashSync(password, 12);
    await db.prepare('INSERT INTO admins (username, password_hash) VALUES (?, ?)').run(username, hash);
    console.log(`  → Admin créé : ${username}`);
  }
}

async function runSchema(pool) {
  const schemaPath = path.join(__dirname, '..', '..', 'supabase', 'schema.sql');
  const sql = fs.readFileSync(schemaPath, 'utf8');
  const statements = sql
    .split(';')
    .map(s => s.replace(/--[^\n]*/g, '').trim())
    .filter(s => s.length > 0 && !s.match(/^ALTER TABLE.*ENABLE ROW LEVEL/i));

  for (const stmt of statements) {
    if (stmt.includes('CREATE POLICY')) continue;
    try {
      await pool.query(stmt);
    } catch (err) {
      if (!err.message.includes('already exists')) {
        console.warn('Schema warning:', err.message.substring(0, 80));
      }
    }
  }
}

module.exports = { initDb: bootstrap, getDb, runSchema, ensureAdmin };
