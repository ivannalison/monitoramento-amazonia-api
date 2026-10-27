// ARQUIVO 12 → src/models/Coleta.js  (registro de cada execução de coleta)
const mongoose = require('mongoose');
const schema = new mongoose.Schema(
  {
    fonte: { type: String, required: true, index: true },
    inicio: { type: Date, required: true },
    fim: { type: Date },
    registros: { type: Number, default: 0 },
    status: { type: String, enum: ['ok', 'erro'], default: 'ok' },
    erro: String,
  },
  { versionKey: false, collection: 'coletas' }
);
schema.index({ inicio: 1 }, { expireAfterSeconds: 30 * 24 * 3600 });
schema.index({ fonte: 1, inicio: -1 });
module.exports = mongoose.models.Coleta || mongoose.model('Coleta', schema);