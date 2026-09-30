// [47] api/index.js
// Ponto de entrada da Vercel (serverless). Localmente você continua usando: npm run dev
const app = require('../src/app');
const { conectarBanco } = require('../src/config/database');

module.exports = async (req, res) => {
  await conectarBanco();
  return app(req, res);
};