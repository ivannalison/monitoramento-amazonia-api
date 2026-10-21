const mongoose = require('mongoose');
try { require('dotenv').config(); } catch (e) { /* dotenv opcional */ }

let aguardando = false;

function opcoes() {
  return { serverSelectionTimeoutMS: 10000 };
}

async function tentar() {
  await mongoose.connect(process.env.MONGODB_URI, opcoes());
  console.log('[banco] conectado ao MongoDB Atlas');
}

function agendarNovaTentativa(n) {
  if (aguardando) return;
  aguardando = true;
  const espera = Math.min(5000 * n, 60000);
  console.log('[banco] nova tentativa em ' + espera / 1000 + 's (tentativa ' + n + ')');
  setTimeout(async () => {
    aguardando = false;
    try {
      await tentar();
    } catch (e) {
      console.error('[banco] falha ao conectar: ' + e.message);
      agendarNovaTentativa(n + 1);
    }
  }, espera);
}

// Nunca derruba o processo: se a 1a conexao falhar, a API sobe e continua tentando.
async function conectar() {
  if (!process.env.MONGODB_URI) {
    console.error('[banco] MONGODB_URI nao definida');
    return false;
  }
  if (mongoose.connection.readyState === 1) return true;
  try {
    await tentar();
    return true;
  } catch (e) {
    console.error('[banco] falha ao conectar: ' + e.message);
    agendarNovaTentativa(1);
    return false;
  }
}

mongoose.connection.on('disconnected', () => console.warn('[banco] desconectado (o driver tenta reconectar sozinho)'));
mongoose.connection.on('reconnected', () => console.log('[banco] reconectado'));

module.exports = conectar;
module.exports.conectar = conectar;
module.exports.conectarBanco = conectar;
module.exports.connectDB = conectar;
module.exports.connectDb = conectar;
module.exports.default = conectar;