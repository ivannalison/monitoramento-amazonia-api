// scripts/verificar-municipios.js
// SOMENTE LEITURA: confere se as queimadas guardadas tem municipio processado.
// Uso: node scripts/verificar-municipios.js
require('dotenv').config();
const mongoose = require('mongoose');

(async () => {
  if (!process.env.MONGODB_URI) throw new Error('Defina MONGODB_URI no .env');
  await mongoose.connect(process.env.MONGODB_URI, { serverSelectionTimeoutMS: 15000 });
  const col = mongoose.connection.db.collection('queimadas');
  const desde = new Date(Date.now() - 24 * 3600 * 1000);
  const [total, pendentes, recentes, recentesPendentes, foraDosMunicipios, ultimo] = await Promise.all([
    col.countDocuments({}),
    col.countDocuments({ municipio_codigo: { $exists: false } }),
    col.countDocuments({ data: { $gte: desde } }),
    col.countDocuments({ data: { $gte: desde }, municipio_codigo: { $exists: false } }),
    col.countDocuments({ municipio_codigo: { $type: 'null' } }),
    col.find({}).sort({ ultima_atualizacao: -1 }).limit(1).project({ ultima_atualizacao: 1 }).toArray(),
  ]);
  const quando = ultimo[0] && ultimo[0].ultima_atualizacao ? new Date(ultimo[0].ultima_atualizacao).toISOString() : 'sem registros';
  console.log('VERIFICACAO_MUNICIPIOS total_focos=' + total + ' | nao_processados=' + pendentes + ' | fora_dos_municipios=' + foraDosMunicipios);
  console.log('VERIFICACAO_MUNICIPIOS ultimas_24h=' + recentes + ' | ultimas_24h_nao_processados=' + recentesPendentes + ' | ultima_gravacao=' + quando);
  await mongoose.disconnect();
})().catch((e) => { console.error('FALHOU:', e.message); process.exit(1); });