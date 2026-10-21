// GET /api/camadas/resumo?estado=AM&horas=24   (estado: sigla ou nome)
const asyncHandler = require('../utils/asyncHandler');
const service = require('../services/camadasResumoService');
const { paraUF } = require('../utils/estados');

exports.obter = asyncHandler(async (req, res) => {
  if (req.query.estado && !paraUF(req.query.estado)) {
    return res.status(400).json({ erro: 'Par\u00e2metro "estado" inv\u00e1lido. Use a sigla (ex.: AM) ou o nome do estado.' });
  }
  res.json(await service.resumo(req.query));
});