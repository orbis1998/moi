const { Pool } = require('pg');

let pool = null;
let dbApi = null;

const JSON_FIELDS = ['technologies', 'screenshots', 'statistics', 'services'];

function toPgSql(sql) {
  return sql
    .replace(/datetime\('now'\)/gi, 'NOW()')
    .replace(/published\s*=\s*1/gi, 'published IS TRUE');
}

function toPgParams(sql, params) {
  let i = 0;
  const text = toPgSql(sql).replace(/\?/g, () => `$${++i}`);
  const values = params.map(p => {
    if (typeof p === 'boolean') return p;
    if (typeof p === 'string' && (p.startsWith('[') || p.startsWith('{'))) {
      try { return JSON.parse(p); } catch { return p; }
    }
    return p;
  });
  return { text, values };
}

function normalizeRow(row) {
  if (!row) return row;
  const copy = { ...row };
  JSON_FIELDS.forEach(f => {
    if (copy[f] != null && typeof copy[f] === 'object') {
      copy[f] = JSON.stringify(copy[f]);
    }
  });
  if ('published' in copy && typeof copy.published === 'boolean') {
    copy.published = copy.published ? 1 : 0;
  }
  if ('c' in copy) copy.c = Number(copy.c);
  return copy;
}

function prepare(sql) {
  return {
    async get(...params) {
      const { text, values } = toPgParams(sql, params);
      const result = await pool.query(text, values);
      return normalizeRow(result.rows[0]);
    },
    async all(...params) {
      const { text, values } = toPgParams(sql, params);
      const result = await pool.query(text, values);
      return result.rows.map(normalizeRow);
    },
    async run(...params) {
      let { text, values } = toPgParams(sql, params);
      const upper = text.trim().toUpperCase();
      if (upper.startsWith('INSERT') && !upper.includes('RETURNING')) {
        text += ' RETURNING id';
      }
      const normalized = values;
      const result = await pool.query(text, normalized);
      return {
        changes: result.rowCount,
        lastInsertRowid: result.rows[0]?.id
      };
    }
  };
}

async function initDb() {
  const connectionString = process.env.DATABASE_URL;
  if (!connectionString) throw new Error('DATABASE_URL manquant pour PostgreSQL');

  pool = new Pool({
    connectionString,
    ssl: { rejectUnauthorized: false },
    max: 5,
    connectionTimeoutMillis: 8000,
    idleTimeoutMillis: 10000,
    query_timeout: 10000
  });

  const timeout = new Promise((_, reject) => {
    setTimeout(() => reject(new Error('Timeout connexion PostgreSQL (8s)')), 8000);
  });
  await Promise.race([pool.query('SELECT 1'), timeout]);
  dbApi = { prepare, pool, driver: 'postgres' };
  console.log('  → Base de données : PostgreSQL (Supabase)');
  return dbApi;
}

function getDb() {
  if (!dbApi) throw new Error('Database not initialized. Call initDb() first.');
  return dbApi;
}

module.exports = { initDb, getDb };
