// ARQUIVO 18 → src/collectors/cheia.collector.js  (vazão dos rios = risco de cheia)
// razao = vazão de hoje / média da série dos últimos 30 dias (mais de 1.5 = acima do normal)
const Cheia = require('../models/Cheia');
const { gerarGrade } = require('./grade');
const { buscarEmLote } = require('./openmeteo');

function nivelDe(r) {
  if (r >= 3) return 'extremo';
  if (r >= 2) return 'alto';
  if (r >= 1.5) return 'atencao';
  return 'normal';
}

async function coletarCheia() {
  const pontos = gerarGrade();
  const res = await buscarEmLote(
    'https://flood-api.open-meteo.com/v1/flood', pontos,
    'daily=river_discharge&past_days=30&forecast_days=3'
  );
  const hoje = new Date(); hoje.setUTCHours(0, 0, 0, 0);
  const ops = [];
  for (const { ponto, dados } of res) {
    const d = dados.daily;
    if (!d || !d.river_discharge) continue;
    const serie = d.river_discharge.filter((v) => v != null);
    const idx = d.time.findIndex((t) => new Date(`${t}T00:00:00Z`).getTime() === hoje.getTime());
    const atual = idx >= 0 ? d.river_discharge[idx] : null;
    if (atual == null || serie.length < 5) continue;
    const media = serie.reduce((a, b) => a + b, 0) / serie.length;
    if (!media) continue;
    const razao = Math.round((atual / media) * 100) / 100;
    ops.push({ updateOne: {
      filter: { latitude: ponto.latitude, longitude: ponto.longitude, data: hoje },
      update: { $set: {
        latitude: ponto.latitude, longitude: ponto.longitude, estado: ponto.estado, data: hoje,
        vazao: atual, vazao_media: Math.round(media * 100) / 100, razao, nivel: nivelDe(razao),
        fonte: 'Open-Meteo Flood (GloFAS)',
      } },
      upsert: true,
    } });
  }
  if (!ops.length) return { pontos: pontos.length, gravados: 0 };
  const r = await Cheia.bulkWrite(ops, { ordered: false });
  return { pontos: pontos.length, gravados: r.upsertedCount + r.modifiedCount };
}
module.exports = { coletarCheia };