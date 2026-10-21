// src/services/estadoService.js
// Junta os estados das 4 colecoes (menu de filtro do site), sempre como sigla.
const Queimada = require('../models/Queimada');
const Desmatamento = require('../models/Desmatamento');
const Clima = require('../models/Clima');
const Alerta = require('../models/Alerta');
const { normalizarUF } = require('../utils/estados');

async function listar() {
  const listas = await Promise.all([
    Queimada.distinct('estado'),
    Desmatamento.distinct('estado'),
    Clima.distinct('estado'),
    Alerta.distinct('estado'),
  ]);
  const unicos = [...new Set(listas.flat().filter(Boolean).map(normalizarUF))];
  return unicos.sort((a, b) => a.localeCompare(b, 'pt-BR'));
}

module.exports = { listar };