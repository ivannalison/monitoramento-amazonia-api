// [17] src/services/resumoService.js
// Junta os indicadores das 4 coleções em um único resumo.

const Queimada = require('../models/Queimada');
const Desmatamento = require('../models/Desmatamento');
const Alerta = require('../models/Alerta');
const Clima = require('../models/Clima');

const TIPOS_CLIMATICOS = ['chuva', 'seca', 'cheia', 'vazante', 'vento'];

async function ultima(Model) {
  const doc = await Model.findOne().sort({ ultima_atualizacao: -1 }).select('ultima_atualizacao').lean();
  return doc ? new Date(doc.ultima_atualizacao).getTime() : 0;
}

async function gerar() {
  const [focos, desmatamento, climaticos, ativos, u1, u2, u3, u4] = await Promise.all([
    Queimada.countDocuments(),
    Desmatamento.countDocuments(),
    Alerta.countDocuments({ tipo: { $in: TIPOS_CLIMATICOS } }),
    Alerta.countDocuments({ ativo: true }),
    ultima(Queimada),
    ultima(Desmatamento),
    ultima(Alerta),
    ultima(Clima),
  ]);

  const maior = Math.max(u1, u2, u3, u4);

  return {
    regiao: 'Amazônia',
    focos_de_calor: focos,
    alertas_desmatamento: desmatamento,
    alertas_climaticos: climaticos,
    alertas_ativos: ativos,
    ultima_atualizacao: maior ? new Date(maior).toISOString() : null,
  };
}

module.exports = { gerar };