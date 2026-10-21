// ARQUIVO 14 → src/models/Chuva.js  (uma linha por ponto e por hora da previsão)
const mongoose = require('mongoose');
const schema = new mongoose.Schema(
  {
    latitude: Number, longitude: Number, estado: { type: String, index: true },
    hora: { type: Date, required: true },          // hora a que a previsão se refere
    precipitacao_mm: Number,
    fonte: { type: String, default: 'Open-Meteo Forecast' },
    coletado_em: { type: Date, default: Date.now },
  },
  { versionKey: false, collection: 'chuvas' }
);
schema.index({ latitude: 1, longitude: 1, hora: 1 }, { unique: true });
schema.index({ hora: 1 }, { expireAfterSeconds: 7 * 24 * 3600 });
module.exports = mongoose.models.Chuva || mongoose.model('Chuva', schema);