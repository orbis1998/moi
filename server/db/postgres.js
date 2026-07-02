const { Pool } = require('pg');
const dns = require('dns');

if (process.env.VERCEL) {
  dns.setDefaultResultOrder('ipv4first');
}

let pool = null;
let dbApi = null;

const JSON_FIELDS = ['technologies', 'screenshots', 'statistics', 'services'];

function encodePasswordInUrl(url) {
  try {
    const parsed = new URL(url);
    if (parsed.password) {
      parsed.password = encodeURIComponent(decodeURIComponent(parsed.password));
    }
    return parsed.toString();
  } catch {
    return url;
  }
}

function normalizeConnectionString(url) {
  if (!url) return url;
  let normalized = encodePasswordInUrl(url.trim());

  if (process.env.VERCEL && normalized.includes('pooler.supabase.com') && /:6543\//.test(normalized)) {
    normalized = normalized
      .replace(':6543/', ':5432/')
      .replace(/([?&])pgbouncer=true(&|$)/gi, '$1')
      .replace(/[?&]$/, '');
  }

  if (!/connect_timeout=/i.test(normalized)) {
    normalized += normalized.includes('?') ? '&' : '?';
    normalized += 'connect_timeout=30';
  }

  return normalized;
}

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
      const result = await pool.query(text, values);
      return {
        changes: result.rowCount,
        lastInsertRowid: result.rows[0]?.id
      };
    }
  };
}

async function initDb() {
  if (dbApi) return dbApi;

  const rawUrl = process.env.DATABASE_URL;
  if (!rawUrl) throw new Error('DATABASE_URL manquant pour PostgreSQL');

  const connectionString = normalizeConnectionString(rawUrl);
  const isVercel = !!process.env.VERCEL;

  pool = new Pool({
    connectionString,
    ssl: { rejectUnauthorized: false },
    max: isVercel ? 1 : 5,
    idleTimeoutMillis: isVercel ? 0 : 10000,
    connectionTimeoutMillis: 30000
  });

  await pool.query('SELECT 1');
  dbApi = { prepare, pool, driver: 'postgres' };
  console.log(`  → Base de données : PostgreSQL (${isVercel ? 'session pooler' : 'Supabase'})`);
  return dbApi;
}

function getDb() {
  if (!dbApi) throw new Error('Database not initialized. Call initDb() first.');
  return dbApi;
}

module.exports = { initDb, getDb, normalizeConnectionString };
