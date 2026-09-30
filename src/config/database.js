// [46] src/config/database.js
// Conexão com o MongoDB Atlas via Mongoose.
// As credenciais NÃO ficam aqui: ficam no .env (local) ou nas variáveis da Vercel (MONGODB_URI).
// Reaproveita a conexão já aberta (importante na Vercel, onde cada requisição pode chamar esta função).

const mongoose = require('mongoose');

let tentativa = null;

async function conectarBanco() {
  if (mongoose.connection.readyState === 1) return true;

  const uri = process.env.MONGODB_URI;
  if (!uri) {
    console.warn('MONGODB_URI não definida. API rodando sem banco.');
    return false;
  }

  try {
    if (!tentativa) {
      tentativa = mongoose.connect(uri, { serverSelectionTimeoutMS: 8000 });
    }
    await tentativa;
    console.log('MongoDB conectado');
    return true;
  } catch (erro) {
    tentativa = null; // permite tentar de novo na próxima chamada
    console.error('Falha ao conectar no MongoDB:', erro.message);
    return false;
  }
}

module.exports = { conectarBanco };