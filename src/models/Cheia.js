// ARQUIVO 15 → src/models/Cheia.js  (vazão do rio vs média → risco de cheia)
const mongoose = require('mongoose');
const schema = new mongoose.Schema(
  {
    latitude: Number, longitude: Number, estado: { type: String, index: true },
    data: { type: Date, required: true },
    vazao: Number, vazao_media: Number, razao: Number,
    nivel: { type: String, enum: ['normal', 'atencao', 'alto', 'extremo'] },
    fonte: { type: String, default: 'Open-Meteo Flood (GloFAS)' },
  },
  { versionKey: false, collection: 'cheias' }
);
schema.index({ latitude: 1, longitude: 1, data: 1 }, { unique: true });
schema.index({ data: 1 }, { expireAfterSeconds: 7 * 24 * 3600 });
module.exports = mongoose.models.Cheia || mongoose.model('Cheia', schema);