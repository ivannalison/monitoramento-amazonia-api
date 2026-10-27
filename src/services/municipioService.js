// src/services/municipioService.js
// Preenche o municipio das queimadas JA gravadas (as novas ja entram com municipio pelo coletor do FIRMS).
// Marca cada foco processado com municipio_codigo (null = fora dos municipios).
// Focos do Maranhao fora da Amazonia Legal sao apagados.
const Queimada = require('../models/Queimada');
const { municipioDoPonto, disponivel } = require('../utils/municipios');

async function preencherPendentes(lote = 2000) {
  const vazio = { atualizados: 0, removidos: 0, processados: 0 };
  if (!disponivel()) return vazio;
  const docs = await Queimada.find({ municipio_codigo: { $exists: false } })
    .select('_id latitude longitude estado').limit(lote).lean();
  if (!docs.length) return vazio;
  const ops = [];
  let atualizados = 0;
  let removidos = 0;
  for (const d of docs) {
    const m = d.longitude != null && d.latitude != null ? municipioDoPonto(d.longitude, d.latitude) : null;
    if (m) {
      ops.push({ updateOne: { filter: { _id: d._id }, update: { $set: { municipio: m.nome, municipio_codigo: m.codigo } } } });
      atualizados++;
    } else if (d.estado === 'MA') {
      ops.push({ deleteOne: { filter: { _id: d._id } } });
      removidos++;
    } else {
      ops.push({ updateOne: { filter: { _id: d._id }, update: { $set: { municipio_codigo: null } } } });
    }
  }
  await Queimada.bulkWrite(ops, { ordered: false });
  return { atualizados, removidos, processados: docs.length };
}

module.exports = { preencherPendentes };