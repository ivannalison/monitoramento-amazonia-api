// [07] src/models/Desmatamento.js
const mongoose = require('mongoose');

const desmatamentoSchema = new mongoose.Schema(
  {
    data: { type: Date, required: true },
    estado: { type: String, required: true, trim: true },
    municipio: { type: String, trim: true },
    area_ha: { type: Number, required: true }, // área em hectares
    fonte: { type: String, default: 'Dados demonstrativos' },
    ultima_atualizacao: { type: Date, default: Date.now },
  },
  { versionKey: false, collection: 'desmatamentos' }
);

module.exports = mongoose.model('Desmatamento', desmatamentoSchema);