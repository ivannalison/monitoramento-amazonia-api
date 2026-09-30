// [09] src/models/Alerta.js
const mongoose = require('mongoose');

const alertaSchema = new mongoose.Schema(
  {
    tipo: { type: String, required: true, lowercase: true, trim: true }, // chuva, seca, cheia, queimada...
    nivel: {
      type: String,
      required: true,
      enum: ['baixo', 'moderado', 'alto', 'critico'],
    },
    descricao: { type: String, required: true },
    estado: { type: String, trim: true },
    ativo: { type: Boolean, default: true },
    fonte: { type: String, default: 'Dados demonstrativos' },
    ultima_atualizacao: { type: Date, default: Date.now },
  },
  { versionKey: false, collection: 'alertas' }
);

module.exports = mongoose.model('Alerta', alertaSchema);