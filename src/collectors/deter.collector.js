// src/collectors/deter.collector.js
// Desmatamento real: alertas do INPE DETER (TerraBrasilis, servico WFS publico, sem chave).
// Baixa os alertas dos ultimos 90 dias e grava um registro por alerta (atualiza se o INPE revisar).
// Se o INPE nao responder, a coleta falha e o erro aparece em /api/fontes. Nada e inventado.
const Desmatamento = require('../models/Desmatamento');
const { paraUF } = require('../utils/estados');

const URL_BASE = 'https://terrabrasilis.dpi.inpe.br/geoserver/ows';
const CAMADA = 'deter-amz:deter_amz';
const CAMPOS = {"data":"view_date","area":"areamunkm","uf":"uf","municipio":"municipality","classe":"classname","ordem":"gid"};
const JANELA_DIAS = 90;
const POR_PAGINA = 1000;
const MAX_PAGINAS = 30;

function percorrer(c, fn) {
  if (typeof c[0] === 'number') fn(c);
  else c.forEach((x) => percorrer(x, fn));
}

// Centro da caixa do poligono, como [lon, lat]
function centro(geom) {
  if (!geom || !geom.coordinates) return null;
  let minX = 180, minY = 90, maxX = -180, maxY = -90;
  percorrer(geom.coordinates, ([x, y]) => {
    if (x < minX) minX = x; if (x > maxX) maxX = x;
    if (y < minY) minY = y; if (y > maxY) maxY = y;
  });
  return maxX < minX ? null : [(minX + maxX) / 2, (minY + maxY) / 2];
}

async function baixarPagina(desde, inicio) {
  const params = new URLSearchParams({
    service: 'WFS', version: '1.0.0', request: 'GetFeature', typeName: CAMADA,
    outputFormat: 'application/json', maxFeatures: String(POR_PAGINA), startIndex: String(inicio),
    sortBy: CAMPOS.ordem, CQL_FILTER: `${CAMPOS.data} >= '${desde}'`,
  });
  const res = await fetch(`${URL_BASE}?${params}`);
  if (!res.ok) throw new Error(`INPE DETER respondeu ${res.status}`);
  let json;
  try { json = await res.json(); } catch { throw new Error('INPE DETER devolveu uma resposta que nao e JSON'); }
  if (!Array.isArray(json.features)) throw new Error('INPE DETER devolveu uma resposta inesperada');
  return json.features;
}

async function coletarDeter() {
  const desde = new Date(Date.now() - JANELA_DIAS * 86400000).toISOString().slice(0, 10);
  const agora = new Date();
  let lidos = 0, ignorados = 0, novos = 0, atualizados = 0;

  for (let pagina = 0; pagina < MAX_PAGINAS; pagina++) {
    const feicoes = await baixarPagina(desde, pagina * POR_PAGINA);
    lidos += feicoes.length;
    const ops = [];
    for (const f of feicoes) {
      const p = f.properties || {};
      const data = new Date(p[CAMPOS.data]);
      const estado = paraUF(p[CAMPOS.uf]);
      const areaKm = Number(p[CAMPOS.area]);
      const c = centro(f.geometry);
      const id = f.id ? String(f.id) : '';
      if (isNaN(data) || !estado || !(areaKm > 0) || !c || !id) { ignorados++; continue; }
      ops.push({ updateOne: {
        filter: { id_externo: id },
        update: { $set: {
          id_externo: id, data, estado,
          municipio: CAMPOS.municipio && p[CAMPOS.municipio] ? String(p[CAMPOS.municipio]) : undefined,
          area_ha: Math.round(areaKm * 100 * 100) / 100,
          classe: CAMPOS.classe && p[CAMPOS.classe] ? String(p[CAMPOS.classe]) : undefined,
          latitude: c[1], longitude: c[0],
          fonte: 'INPE DETER', ultima_atualizacao: agora,
        } },
        upsert: true,
      } });
    }
    if (ops.length) {
      const r = await Desmatamento.bulkWrite(ops, { ordered: false });
      novos += r.upsertedCount;
      atualizados += r.modifiedCount;
    }
    if (feicoes.length < POR_PAGINA) break;
  }
  return { desde, lidos, ignorados, novos, atualizados };
}

module.exports = { coletarDeter };