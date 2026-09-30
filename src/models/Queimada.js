// [06] src/models/Queimada.js
const mongoose = require('mongoose');

const queimadaSchema = new mongoose.Schema(
  {
    data: { type: Date, required: true },
    estado: { type: String, required: true, trim: true },
    municipio: { type: String, trim: true },
    latitude: Number,
    longitude: Number,
    intensidade: Number, // ex.: potência radiativa do foco (FRP)
    fonte: { type: String, default: 'Dados demonstrativos' },
    ultima_atualizacao: { type: Date, default: Date.now },
  },
  { versionKey: false, collection: 'queimadas' }
);

module.exports = mongoose.model('Queimada', queimadaSchema);