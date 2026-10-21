// src/models/Clima.js
// Condicao atual por estado (Open-Meteo): um registro por estado, atualizado a cada coleta.
const mongoose = require('mongoose');
const { normalizarUF } = require('../utils/estados');

const climaSchema = new mongoose.Schema(
  {
    regiao: { type: String, default: 'Amaz\u00f4nia' },
    estado: { type: String, required: true, trim: true, set: normalizarUF },
    condicao: { type: String, required: true },
    temperatura: { type: Number, required: true }, // media dos pontos do estado, em graus C
    umidade: Number,                               // media, em %
    pontos: Number,                                // quantos pontos da grade entraram na media
    observado_em: Date,                            // hora da leitura na fonte
    fonte: { type: String, default: 'Open-Meteo Forecast' },
    ultima_atualizacao: { type: Date, default: Date.now },
  },
  { versionKey: false, collection: 'clima' }
);

climaSchema.index({ estado: 1 }, { unique: true });

module.exports = mongoose.models.Clima || mongoose.model('Clima', climaSchema);