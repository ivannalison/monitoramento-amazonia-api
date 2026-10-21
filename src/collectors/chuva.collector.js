// ARQUIVO 17 → src/collectors/chuva.collector.js  (precipitação por hora, próximas 24 h)
const Chuva = require('../models/Chuva');
const { gerarGrade } = require('./grade');
const { buscarEmLote } = require('./openmeteo');

async function coletarChuva() {
  const pontos = gerarGrade();
  const res = await buscarEmLote(
    'https://api.open-meteo.com/v1/forecast', pontos,
    'hourly=precipitation&forecast_days=2&past_hours=6'
  );
  const agora = Date.now();
  const limite = agora + 24 * 3600 * 1000;
  const ops = [];
  for (const { ponto, dados } of res) {
    const h = dados.hourly;
    if (!h) continue;
    h.time.forEach((t, i) => {
      const hora = new Date(`${t}:00Z`);
      if (hora.getTime() > limite || h.precipitation[i] == null) return;
      ops.push({ updateOne: {
        filter: { latitude: ponto.latitude, longitude: ponto.longitude, hora },
        update: { $set: {
          latitude: ponto.latitude, longitude: ponto.longitude, estado: ponto.estado, hora,
          precipitacao_mm: h.precipitation[i], fonte: 'Open-Meteo Forecast', coletado_em: new Date(),
        } },
        upsert: true,
      } });
    });
  }
  let gravados = 0;
  for (let i = 0; i < ops.length; i += 2000) {
    const r = await Chuva.bulkWrite(ops.slice(i, i + 2000), { ordered: false });
    gravados += r.upsertedCount + r.modifiedCount;
  }
  return { pontos: pontos.length, gravados };
}
module.exports = { coletarChuva };