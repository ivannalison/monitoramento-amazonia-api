// [38] src/controllers/relatorioController.js
const service = require('../services/relatorioService');
const asyncHandler = require('../utils/asyncHandler');

exports.obter = asyncHandler(async (req, res) => {
  const r = await service.gerar(req.query);
  if (r.erro) return res.status(400).json({ erro: r.erro });
  res.json(r);
});