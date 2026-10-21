// ARQUIVO 16 → src/collectors/ar.collector.js  (fumaça / qualidade do ar)
const QualidadeAr = require('../models/QualidadeAr');
const { gerarGrade } = require('./grade');
const { buscarEmLote } = require('./openmeteo');

async function coletarAr() {
  const pontos = gerarGrade();
  const res = await buscarEmLote(
    'https://air-quality-api.open-meteo.com/v1/air-quality', pontos,
    'current=pm10,pm2_5,aerosol_optical_depth,us_aqi'
  );
  const ops = [];
  for (const { ponto, dados } of res) {
    const c = dados.current;
    if (!c || c.pm2_5 == null) continue;
    const data = new Date(`${c.time}:00Z`);
    ops.push({ updateOne: {
      filter: { latitude: ponto.latitude, longitude: ponto.longitude, data },
      update: { $setOnInsert: {
        latitude: ponto.latitude, longitude: ponto.longitude, estado: ponto.estado, data,
        pm2_5: c.pm2_5, pm10: c.pm10, indice: c.us_aqi, aerossol: c.aerosol_optical_depth,
      } },
      upsert: true,
    } });
  }
  if (!ops.length) return { pontos: pontos.length, novos: 0 };
  const r = await QualidadeAr.bulkWrite(ops, { ordered: false });
  return { pontos: pontos.length, novos: r.upsertedCount };
}
module.exports = { coletarAr };