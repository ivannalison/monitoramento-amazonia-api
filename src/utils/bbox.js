// src/utils/bbox.js
// Le ?bbox=minLon,minLat,maxLon,maxLat (area visivel do mapa).
function lerBbox(query) {
  const bruto = query.bbox;
  if (bruto === undefined || bruto === '') return { bbox: null };
  const msg = 'Par\u00e2metro "bbox" inv\u00e1lido. Use minLon,minLat,maxLon,maxLat (ex.: -70,-10,-60,0).';
  if (typeof bruto !== 'string') return { erro: msg };
  const partes = bruto.split(',').map((s) => (s.trim() === '' ? NaN : Number(s)));
  if (partes.length !== 4 || partes.some((n) => !Number.isFinite(n))) return { erro: msg };
  const [minLon, minLat, maxLon, maxLat] = partes;
  if (minLon >= maxLon || minLat >= maxLat || minLon < -180 || maxLon > 180 || minLat < -90 || maxLat > 90) return { erro: msg };
  return { bbox: partes };
}

module.exports = { lerBbox };