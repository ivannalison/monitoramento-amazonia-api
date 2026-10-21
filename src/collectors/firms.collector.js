// ARQUIVO 5 → src/collectors/firms.collector.js
// Baixa os 3 CSVs públicos da NASA FIRMS, mantém só focos dentro da Amazônia Legal,
// descobre o estado e grava sem duplicar. Não precisa de chave nem cadastro.
const { parse } = require('csv-parse/sync');
const Queimada = require('../models/Queimada');
const { estadoDoPonto } = require('../utils/geo');

const BASE = 'https://firms.modaps.eosdis.nasa.gov/data/active_fire';
const FONTES = {
  modis:  `${BASE}/modis-c6.1/csv/MODIS_C6_1_South_America_24h.csv`,
  noaa20: `${BASE}/noaa-20-viirs-c2/csv/J1_VIIRS_C2_South_America_24h.csv`,
  suomi:  `${BASE}/suomi-npp-viirs-c2/csv/SUOMI_VIIRS_C2_South_America_24h.csv`,
};

async function coletarSatelite(satelite) {
  const res = await fetch(FONTES[satelite]);
  if (!res.ok) throw new Error(`FIRMS ${satelite} respondeu ${res.status}`);
  const linhas = parse(await res.text(), { columns: true, skip_empty_lines: true });

  const agora = new Date();
  const ops = [];
  for (const l of linhas) {
    const lat = parseFloat(l.latitude);
    const lon = parseFloat(l.longitude);
    const estado = estadoDoPonto(lon, lat);
    if (!estado) continue; // fora da Amazônia Legal

    const hhmm = String(l.acq_time).padStart(4, '0');
    const hora = `${hhmm.slice(0, 2)}:${hhmm.slice(2)}`;
    const data = new Date(`${l.acq_date}T${hora}:00Z`);
    const doc = {
      latitude: lat, longitude: lon, data, hora, satelite, estado,
      intensidade: parseFloat(l.frp) || 0,
      confianca: String(l.confidence),
      diaNoite: l.daynight,
      fonte: 'NASA FIRMS',
      ultima_atualizacao: agora,
      location: { type: 'Point', coordinates: [lon, lat] },
    };
    ops.push({
      updateOne: {
        filter: { latitude: lat, longitude: lon, data, satelite },
        update: { $setOnInsert: doc },
        upsert: true,
      },
    });
  }

  let novos = 0;
  for (let i = 0; i < ops.length; i += 1000) {
    const r = await Queimada.bulkWrite(ops.slice(i, i + 1000), { ordered: false });
    novos += r.upsertedCount;
  }
  return { lidos: linhas.length, naAmazonia: ops.length, novos };
}

async function coletarFirms() {
  const resumo = {};
  for (const sat of Object.keys(FONTES)) {
    try { resumo[sat] = await coletarSatelite(sat); }
    catch (e) { resumo[sat] = { erro: e.message }; }
  }
  return resumo;
}

module.exports = { coletarFirms };