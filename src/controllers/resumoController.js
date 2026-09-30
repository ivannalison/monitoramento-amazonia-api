// [19] src/controllers/resumoController.js
const resumoService = require('../services/resumoService');
const asyncHandler = require('../utils/asyncHandler');

exports.obter = asyncHandler(async (req, res) => {
  res.json(await resumoService.gerar());
});