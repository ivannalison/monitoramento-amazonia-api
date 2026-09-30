// src/controllers/queimadaController.js
const service = require('../services/queimadaService');
const asyncHandler = require('../utils/asyncHandler');
const { fonteDe, ultimaAtualizacaoDe } = require('../utils/resposta');

exports.listar = asyncHandler(async (req, res) => {
  const r = await service.listarPaginado(req.query);
  if (r.erro) return res.status(400).json({ erro: r.erro });
  res.json({
    fonte: fonteDe(r.focos),
    ultima_atualizacao: ultimaAtualizacaoDe(r.focos),
    total: r.total,
    pagina: r.pagina,
    limite: r.limite,
    total_paginas: r.total_paginas,
    focos: r.focos,
  });
});

exports.estatisticas = asyncHandler(async (req, res) => {
  const r = await service.estatisticas(req.query);
  if (r.erro) return res.status(400).json({ erro: r.erro });
  res.json(r);
});