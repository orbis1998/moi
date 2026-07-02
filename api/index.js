const appReady = require('../server/app');

module.exports = async (req, res) => {
  const app = await appReady;
  app(req, res);
};
