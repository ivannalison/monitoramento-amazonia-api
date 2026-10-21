// src/services/resumoService.js
// Junta os indicadores das colecoes em um unico resumo.
// focos_de_calor = total guardado no banco (janela de 7 dias do TTL).
// camadas.queimadas.total = focos das ultimas 24 h (veja camadas.queimadas.periodo_horas).

const Queimada = require('../models/Queimada');
const Desmatamento = require('../models/Desmatamento');
const Alerta = require('../models/Alerta');
const Clima = require('../models/Clima');
const camadasResumo = require('./camadasResumoService');

const TIPOS_CLIMATICOS = ['chuva', 'seca', 'cheia', 'vazante', 'vento'];

async function ultima(Model) {
  const doc = await Model.findOne().sort({ ultima_atualizacao: -1 }).select('ultima_atualizacao').lean();
  return doc ? new Date(doc.ultima_atualizacao).getTime() : 0;
}

async function gerar() {
  const [focos, desmatamento, climaticos, ativos, u1, u2, u3, u4, camadas] = await Promise.all([
    Queimada.countDocuments(),
    Desmatamento.countDocuments(),
    Alerta.countDocuments({ tipo: { $in: TIPOS_CLIMATICOS } }),
    Alerta.countDocuments({ ativo: true }),
    ultima(Queimada),
    ultima(Desmatamento),
    ultima(Alerta),
    ultima(Clima),
    camadasResumo.resumo({}),
  ]);

  const maior = Math.max(u1, u2, u3, u4);

  return {
    regiao: 'Amaz\u00f4nia',
    focos_de_calor: focos,
    alertas_desmatamento: desmatamento,
    alertas_climaticos: climaticos,
    alertas_ativos: ativos,
    ultima_atualizacao: maior ? new Date(maior).toISOString() : null,
    camadas,
  };
}

module.exports = { gerar };