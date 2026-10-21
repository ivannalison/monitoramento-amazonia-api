// src/models/Queimada.js  (focos reais do NASA FIRMS)
const mongoose = require('mongoose');
const { normalizarUF } = require('../utils/estados');

const queimadaSchema = new mongoose.Schema(
  {
    data: { type: Date, required: true },          // data+hora da passagem do satelite (UTC)
    hora: { type: String },                        // 'HH:MM'
    estado: { type: String, required: true, trim: true, set: normalizarUF },
    municipio: { type: String, trim: true },       // o FIRMS nao informa; fica vazio
    latitude: Number,
    longitude: Number,
    satelite: { type: String, enum: ['modis', 'noaa20', 'suomi'] },
    intensidade: Number,                           // FRP (MW)
    confianca: String,
    diaNoite: String,
    fonte: { type: String, default: 'NASA FIRMS' },
    ultima_atualizacao: { type: Date, default: Date.now },
    location: {                                    // para consultas geograficas
      type: { type: String, enum: ['Point'] },
      coordinates: { type: [Number] },             // [lon, lat]
    },
  },
  { versionKey: false, collection: 'queimadas' }
);

// Nao duplica o mesmo foco ao coletar de novo
queimadaSchema.index({ latitude: 1, longitude: 1, data: 1, satelite: 1 }, { unique: true });
queimadaSchema.index({ location: '2dsphere' });
queimadaSchema.index({ estado: 1, data: -1 });
// Apaga sozinho apos 7 dias (cabe no plano gratuito do Atlas)
queimadaSchema.index({ data: 1 }, { expireAfterSeconds: 7 * 24 * 3600 });

module.exports = mongoose.models.Queimada || mongoose.model('Queimada', queimadaSchema);