// [18] src/controllers/statusController.js
// /api/status e /api/amazonia (não dependem do banco para responder).

const mongoose = require('mongoose');

function status(req, res) {
  res.json({
    status: 'online',
    projeto: 'Monitoramento da Amazônia',
    banco: mongoose.connection.readyState === 1 ? 'conectado' : 'desconectado',
  });
}

function amazonia(req, res) {
  res.json({
    regiao: 'Amazônia',
    descricao: 'Monitoramento de indicadores ambientais',
    ultima_atualizacao: new Date().toISOString(),
  });
}

module.exports = { status, amazonia };