// [08] src/models/Clima.js
const mongoose = require('mongoose');

const climaSchema = new mongoose.Schema(
  {
    regiao: { type: String, default: 'Amazônia' },
    estado: { type: String, required: true, trim: true },
    condicao: { type: String, required: true },
    temperatura: { type: Number, required: true }, // °C
    umidade: Number, // %
    fonte: { type: String, default: 'Dados demonstrativos' },
    ultima_atualizacao: { type: Date, default: Date.now },
  },
  { versionKey: false, collection: 'clima' }
);

module.exports = mongoose.model('Clima', climaSchema);