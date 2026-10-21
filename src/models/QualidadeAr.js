// ARQUIVO 13 → src/models/QualidadeAr.js
const mongoose = require('mongoose');
const schema = new mongoose.Schema(
  {
    latitude: Number, longitude: Number, estado: { type: String, index: true },
    data: { type: Date, required: true },
    pm2_5: Number, pm10: Number, indice: Number, aerossol: Number,
    fonte: { type: String, default: 'Open-Meteo Air Quality' },
  },
  { versionKey: false, collection: 'qualidade_ar' }
);
schema.index({ latitude: 1, longitude: 1, data: 1 }, { unique: true });
schema.index({ data: 1 }, { expireAfterSeconds: 7 * 24 * 3600 });
module.exports = mongoose.models.QualidadeAr || mongoose.model('QualidadeAr', schema);