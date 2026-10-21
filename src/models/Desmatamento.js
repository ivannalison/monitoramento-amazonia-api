// src/models/Desmatamento.js
// Alertas de desmatamento do INPE DETER (TerraBrasilis). Um registro por alerta.
const mongoose = require('mongoose');
const { normalizarUF } = require('../utils/estados');

const desmatamentoSchema = new mongoose.Schema(
  {
    data: { type: Date, required: true },                              // data da imagem (view_date)
    estado: { type: String, required: true, trim: true, set: normalizarUF },
    municipio: { type: String, trim: true },
    area_ha: { type: Number, required: true },                         // area em hectares
    classe: { type: String },                                          // classe do alerta no DETER
    latitude: Number,                                                  // centro do poligono
    longitude: Number,
    id_externo: { type: String },                                      // id do alerta no INPE (evita duplicar)
    fonte: { type: String, default: 'INPE DETER' },
    ultima_atualizacao: { type: Date, default: Date.now },
  },
  { versionKey: false, collection: 'desmatamentos' }
);

desmatamentoSchema.index({ id_externo: 1 }, { unique: true, partialFilterExpression: { id_externo: { $type: 'string' } } });
desmatamentoSchema.index({ estado: 1, data: -1 });
desmatamentoSchema.index({ data: 1 }, { expireAfterSeconds: 365 * 24 * 3600 });

module.exports = mongoose.models.Desmatamento || mongoose.model('Desmatamento', desmatamentoSchema);