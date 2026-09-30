// [15] src/services/climaService.js
const Clima = require('../models/Clima');
const { montarFiltro } = require('../utils/filtros');

async function listar(query) {
  const filtro = montarFiltro(query, ['estado']);
  return Clima.find(filtro).sort({ ultima_atualizacao: -1 }).lean();
}

module.exports = { listar };