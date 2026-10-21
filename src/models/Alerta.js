// src/models/Alerta.js
// Alertas cadastrados pelo administrador via API (POST/PUT/DELETE com x-api-key).
const mongoose = require('mongoose');
const { normalizarUF } = require('../utils/estados');

const alertaSchema = new mongoose.Schema(
  {
    tipo: { type: String, required: true, lowercase: true, trim: true }, // chuva, seca, cheia, queimada...
    nivel: {
      type: String,
      required: true,
      enum: ['baixo', 'moderado', 'alto', 'critico'],
    },
    descricao: { type: String, required: true },
    estado: { type: String, trim: true, set: normalizarUF },
    ativo: { type: Boolean, default: true },
    fonte: { type: String, default: 'Cadastro via API' },
    ultima_atualizacao: { type: Date, default: Date.now },
  },
  { versionKey: false, collection: 'alertas' }
);

module.exports = mongoose.models.Alerta || mongoose.model('Alerta', alertaSchema);