// ARQUIVO 3 → src/utils/geo.js
// Descobre em qual estado da Amazônia Legal um ponto está (precisa do estados.geojson).
const fs = require('fs');
const path = require('path');

const estados = JSON.parse(fs.readFileSync(path.join(__dirname, '..', 'data', 'estados.geojson'), 'utf8'));

// "Ray casting": ponto dentro de um anel de coordenadas
function dentroDoAnel(lon, lat, anel) {
  let dentro = false;
  for (let i = 0, j = anel.length - 1; i < anel.length; j = i++) {
    const [xi, yi] = anel[i];
    const [xj, yj] = anel[j];
    if (yi > lat !== yj > lat && lon < ((xj - xi) * (lat - yi)) / (yj - yi) + xi) dentro = !dentro;
  }
  return dentro;
}

// Polígono = [anel externo, ...buracos]
function dentroDoPoligono(lon, lat, poligono) {
  if (!dentroDoAnel(lon, lat, poligono[0])) return false;
  for (let k = 1; k < poligono.length; k++) if (dentroDoAnel(lon, lat, poligono[k])) return false;
  return true;
}

// Caixa (bbox) de cada estado, calculada uma vez, para acelerar
const lista = estados.features.map((f) => {
  const polys = f.geometry.type === 'Polygon' ? [f.geometry.coordinates] : f.geometry.coordinates;
  let minX = 180, minY = 90, maxX = -180, maxY = -90;
  for (const p of polys) {
    for (const [x, y] of p[0]) {
      if (x < minX) minX = x;
      if (x > maxX) maxX = x;
      if (y < minY) minY = y;
      if (y > maxY) maxY = y;
    }
  }
  return { sigla: f.properties.sigla, polys, bbox: [minX, minY, maxX, maxY] };
});

// Retorna a sigla (ex.: 'AM') ou null se estiver fora da Amazônia Legal
function estadoDoPonto(lon, lat) {
  for (const e of lista) {
    const [minX, minY, maxX, maxY] = e.bbox;
    if (lon < minX || lon > maxX || lat < minY || lat > maxY) continue;
    if (e.polys.some((p) => dentroDoPoligono(lon, lat, p))) return e.sigla;
  }
  return null;
}

module.exports = { estadoDoPonto };