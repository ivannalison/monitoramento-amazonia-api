// scripts/preencher-municipios.js
// Preenche o municipio das queimadas ja gravadas e apaga os focos do Maranhao fora da Amazonia Legal.
// Uso: node scripts/preencher-municipios.js
require('dotenv').config();
const mongoose = require('mongoose');
const Queimada = require('../src/models/Queimada');
const { disponivel } = require('../src/utils/municipios');
const { preencherPendentes } = require('../src/services/municipioService');

(async () => {
  if (!process.env.MONGODB_URI) throw new Error('Defina MONGODB_URI no .env');
  if (!disponivel()) throw new Error('Arquivo de municipios ausente. Rode: node scripts/baixar-municipios.js');
  await mongoose.connect(process.env.MONGODB_URI, { serverSelectionTimeoutMS: 15000 });
  const antes = await Queimada.countDocuments();
  const total = { atualizados: 0, removidos: 0, processados: 0 };
  for (;;) {
    const r = await preencherPendentes(2000);
    if (!r.processados) break;
    total.atualizados += r.atualizados;
    total.removidos += r.removidos;
    total.processados += r.processados;
    console.log('  lote: ' + r.processados + ' focos (' + r.atualizados + ' com municipio, ' + r.removidos + ' removidos)');
  }
  const depois = await Queimada.countDocuments();
  console.log('Focos antes: ' + antes + ' | depois: ' + depois + ' | processados: ' + total.processados + ' | com municipio: ' + total.atualizados + ' | removidos (MA fora da Amazonia Legal): ' + total.removidos);
  await mongoose.disconnect();
})().catch((e) => { console.error('FALHOU:', e.message); process.exit(1); });