// [22] src/controllers/climaController.js
const service = require('../services/climaService');
const asyncHandler = require('../utils/asyncHandler');
const { fonteDe, ultimaAtualizacaoDe } = require('../utils/resposta');

exports.listar = asyncHandler(async (req, res) => {
  const registros = await service.listar(req.query);
  res.json({
    regiao: 'Amazônia',
    fonte: fonteDe(registros),
    ultima_atualizacao: ultimaAtualizacaoDe(registros),
    total: registros.length,
    registros,
  });
});