// [35] src/services/estadoService.js
// Junta os estados que aparecem nas 4 coleções (para o menu de filtro do site).
const Queimada = require('../models/Queimada');
const Desmatamento = require('../models/Desmatamento');
const Clima = require('../models/Clima');
const Alerta = require('../models/Alerta');

async function listar() {
  const listas = await Promise.all([
    Queimada.distinct('estado'),
    Desmatamento.distinct('estado'),
    Clima.distinct('estado'),
    Alerta.distinct('estado'),
  ]);
  const unicos = [...new Set(listas.flat().filter(Boolean))];
  return unicos.sort((a, b) => a.localeCompare(b, 'pt-BR'));
}

module.exports = { listar };