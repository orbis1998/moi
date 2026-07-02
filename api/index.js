const serverless = require('serverless-http');
const app = require('../server/app');
const { initDb } = require('../server/db');

const handler = serverless(app);

function shouldSkipDb(pathname) {
  return pathname === '/favicon.ico'
    || /\.(css|js|png|jpg|jpeg|gif|webp|svg|ico|woff2?)$/i.test(pathname);
}

module.exports = async (req, res) => {
  try {
    if (!shouldSkipDb(req.url?.split('?')[0] || '')) {
      await initDb();
    }
    return handler(req, res);
  } catch (err) {
    console.error('Vercel handler error:', err);
    res.status(500).send(`Erreur serveur: ${err.message || String(err)}`);
  }
};
