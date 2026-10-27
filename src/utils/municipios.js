// src/utils/municipios.js
// Descobre o municipio (Amazonia Legal) de um ponto. Dados: src/data/municipios-amazonia-legal.json
// (gerado por scripts/baixar-municipios.js a partir da malha do IBGE).
const fs = require('fs');
const path = require('path');

const ARQUIVO = path.join(__dirname, '..', 'data', 'municipios-amazonia-legal.json');
let lista = null;

function carregar() {
  if (lista) return lista;
  try {
    const dados = JSON.parse(fs.readFileSync(ARQUIVO, 'utf8'));
    lista = dados.map((m) => ({
      codigo: m.codigo, nome: m.nome, uf: m.uf, bbox: m.bbox,
      polys: m.tipo === 'Polygon' ? [m.coordenadas] : m.coordenadas,
    }));
  } catch (e) {
    lista = [];
  }
  return lista;
}

function dentroDoAnel(lon, lat, anel) {
  let dentro = false;
  for (let i = 0, j = anel.length - 1; i < anel.length; j = i++) {
    const [xi, yi] = anel[i];
    const [xj, yj] = anel[j];
    if (yi > lat !== yj > lat && lon < ((xj - xi) * (lat - yi)) / (yj - yi) + xi) dentro = !dentro;
  }
  return dentro;
}

function dentroDoPoligono(lon, lat, poligono) {
  if (!dentroDoAnel(lon, lat, poligono[0])) return false;
  for (let k = 1; k < poligono.length; k++) if (dentroDoAnel(lon, lat, poligono[k])) return false;
  return true;
}

function disponivel() {
  return carregar().length > 0;
}

// Retorna { codigo, nome, uf } ou null (fora dos municipios da Amazonia Legal)
function municipioDoPonto(lon, lat) {
  for (const m of carregar()) {
    const [minX, minY, maxX, maxY] = m.bbox;
    if (lon < minX || lon > maxX || lat < minY || lat > maxY) continue;
    if (m.polys.some((p) => dentroDoPoligono(lon, lat, p))) return { codigo: m.codigo, nome: m.nome, uf: m.uf };
  }
  return null;
}

module.exports = { disponivel, municipioDoPonto };