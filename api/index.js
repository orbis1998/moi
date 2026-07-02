const serverless = require('serverless-http');

let handlerPromise;

module.exports = async (req, res) => {
  try {
    if (!handlerPromise) {
      handlerPromise = require('../server/app').then((app) => serverless(app));
    }
    const handler = await handlerPromise;
    return handler(req, res);
  } catch (err) {
    console.error('Vercel handler error:', err);
    res.status(500).send(`Erreur serveur: ${err.message}`);
  }
};
