// src/collectors/clima.collector.js
// Clima real: temperatura, umidade e condicao atual por estado (Open-Meteo Forecast, sem chave).
// Usa a mesma grade de pontos das outras camadas e tira a media por estado.
// Se o Open-Meteo nao devolver dados, a coleta falha e o erro aparece em /api/fontes.
const Clima = require('../models/Clima');
const { gerarGrade } = require('./grade');
const { buscarEmLote } = require('./openmeteo');

// Codigos WMO usados pelo Open-Meteo
const CONDICOES = {
  0: 'C\u00e9u limpo', 1: 'Predominantemente limpo', 2: 'Parcialmente nublado', 3: 'Nublado',
  45: 'Nevoeiro', 48: 'Nevoeiro com geada', 51: 'Garoa leve', 53: 'Garoa', 55: 'Garoa intensa',
  56: 'Garoa congelante', 57: 'Garoa congelante intensa', 61: 'Chuva fraca', 63: 'Chuva moderada',
  65: 'Chuva forte', 66: 'Chuva congelante', 67: 'Chuva congelante forte', 71: 'Neve fraca',
  73: 'Neve', 75: 'Neve forte', 77: 'Gr\u00e3os de neve', 80: 'Pancadas de chuva fracas',
  81: 'Pancadas de chuva', 82: 'Pancadas de chuva fortes', 85: 'Pancadas de neve',
  86: 'Pancadas de neve fortes', 95: 'Trovoada', 96: 'Trovoada com granizo', 99: 'Trovoada com granizo forte',
};
const media = (v) => v.reduce((a, b) => a + b, 0) / v.length;
const arred = (n, c = 1) => Math.round(n * 10 ** c) / 10 ** c;

async function coletarClima() {
  const pontos = gerarGrade();
  const res = await buscarEmLote(
    'https://api.open-meteo.com/v1/forecast', pontos,
    'current=temperature_2m,relative_humidity_2m,weather_code'
  );
  const porEstado = new Map();
  for (const { ponto, dados } of res) {
    const c = dados && dados.current;
    if (!c || c.temperature_2m == null) continue;
    if (!porEstado.has(ponto.estado)) porEstado.set(ponto.estado, { temps: [], umids: [], codigos: {}, hora: c.time });
    const e = porEstado.get(ponto.estado);
    e.temps.push(c.temperature_2m);
    if (c.relative_humidity_2m != null) e.umids.push(c.relative_humidity_2m);
    if (c.weather_code != null) e.codigos[c.weather_code] = (e.codigos[c.weather_code] || 0) + 1;
  }

  const agora = new Date();
  const ops = [];
  for (const [estado, e] of porEstado) {
    const principal = Object.entries(e.codigos).sort((a, b) => b[1] - a[1])[0];
    if (!principal) continue;
    ops.push({ updateOne: {
      filter: { estado },
      update: { $set: {
        regiao: 'Amaz\u00f4nia', estado,
        condicao: CONDICOES[principal[0]] || `C\u00f3digo WMO ${principal[0]}`,
        temperatura: arred(media(e.temps)),
        umidade: e.umids.length ? Math.round(media(e.umids)) : undefined,
        pontos: e.temps.length,
        observado_em: new Date(`${e.hora}:00Z`),
        fonte: 'Open-Meteo Forecast', ultima_atualizacao: agora,
      } },
      upsert: true,
    } });
  }
  if (!ops.length) throw new Error('Open-Meteo nao devolveu dados de clima');
  const r = await Clima.bulkWrite(ops, { ordered: false });
  return { pontos: pontos.length, estados: ops.length, gravados: r.upsertedCount + r.modifiedCount };
}

module.exports = { coletarClima };