// [40] src/controllers/alertaController.js
const service = require('../services/alertaService');
const asyncHandler = require('../utils/asyncHandler');
const { fonteDe, ultimaAtualizacaoDe } = require('../utils/resposta');

const NAO_ENCONTRADO = { erro: 'Alerta não encontrado' };

exports.listar = asyncHandler(async (req, res) => {
  const alertas = await service.listar(req.query);
  res.json({
    fonte: fonteDe(alertas),
    ultima_atualizacao: ultimaAtualizacaoDe(alertas),
    total: alertas.length,
    alertas,
  });
});

exports.obter = asyncHandler(async (req, res) => {
  const alerta = await service.buscarPorId(req.params.id);
  if (!alerta) return res.status(404).json(NAO_ENCONTRADO);
  res.json(alerta);
});

exports.criar = asyncHandler(async (req, res) => {
  const alerta = await service.criar(req.body);
  res.status(201).json({ mensagem: 'Alerta criado', alerta });
});

exports.atualizar = asyncHandler(async (req, res) => {
  const r = await service.atualizar(req.params.id, req.body);
  if (r.erro) return res.status(400).json({ erro: r.erro });
  if (!r.alerta) return res.status(404).json(NAO_ENCONTRADO);
  res.json({ mensagem: 'Alerta atualizado', alerta: r.alerta });
});

exports.remover = asyncHandler(async (req, res) => {
  const alerta = await service.remover(req.params.id);
  if (!alerta) return res.status(404).json(NAO_ENCONTRADO);
  res.json({ mensagem: 'Alerta removido', alerta });
});