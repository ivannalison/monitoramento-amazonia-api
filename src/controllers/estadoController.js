// [36] src/controllers/estadoController.js
const service = require('../services/estadoService');
const asyncHandler = require('../utils/asyncHandler');

exports.listar = asyncHandler(async (req, res) => {
  const estados = await service.listar();
  res.json({ total: estados.length, estados });
});