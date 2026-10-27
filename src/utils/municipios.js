// src/utils/municipios.js
// Municipios da Amazonia Legal. Dados: src/data/municipios-amazonia-legal.json
// (gerado por scripts/baixar-municipios.js a partir da malha do IBGE).
const fs = require('fs');
const path = require('path');

const ARQUIVO = path.join(__dirname, '..', 'data', 'municipios-amazonia-legal.json');
let lista = null;
let porCodigo = new Map();

function semAcento(texto) {
  return String(texto).normalize('NFD').replace(/[\u0300-\u036f]/g, '').toLowerCase().trim();
}

function carregar() {
  if (lista) return lista;
  try {
    const dados = JSON.parse(fs.readFileSync(ARQUIVO, 'utf8'));
    lista = dados.map((m) => ({
      codigo: m.codigo, nome: m.nome, uf: m.uf, bbox: m.bbox, chave: semAcento(m.nome),
      polys: m.tipo === 'Polygon' ? [m.coordenadas] : m.coordenadas,
    }));
    porCodigo = new Map(lista.map((m) => [m.codigo, m]));
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

const arred4 = (n) => Math.round(n * 1e4) / 1e4;

// Dados leves de um municipio (sem o contorno). centro = meio da caixa, [lon, lat]
function resumir(m) {
  return {
    codigo: m.codigo, nome: m.nome, uf: m.uf,
    centro: [arred4((m.bbox[0] + m.bbox[2]) / 2), arred4((m.bbox[1] + m.bbox[3]) / 2)],
    bbox: m.bbox,
  };
}

// Lista ordenada por nome. uf: sigla; busca: parte do nome, sem diferenca de acento ou maiuscula
function listar({ uf, busca } = {}) {
  const termo = busca ? semAcento(busca) : '';
  return carregar()
    .filter((m) => (!uf || m.uf === uf) && (!termo || m.chave.includes(termo)))
    .map(resumir)
    .sort((a, b) => a.nome.localeCompare(b.nome, 'pt-BR'));
}

function obter(codigo) {
  carregar();
  const m = porCodigo.get(String(codigo));
  return m ? resumir(m) : null;
}

function geometriaDe(m) {
  return m.polys.length === 1
    ? { type: 'Polygon', coordinates: m.polys[0] }
    : { type: 'MultiPolygon', coordinates: m.polys };
}

function intersecta(a, b) {
  return !(a[2] < b[0] || a[0] > b[2] || a[3] < b[1] || a[1] > b[3]);
}

// Contornos em GeoJSON. Filtros: uf, codigo, bbox ([minLon,minLat,maxLon,maxLat])
function geojson({ uf, codigo, bbox } = {}) {
  const features = carregar()
    .filter((m) => (!uf || m.uf === uf) && (!codigo || m.codigo === codigo) && (!bbox || intersecta(m.bbox, bbox)))
    .map((m) => ({
      type: 'Feature',
      properties: { codigo: m.codigo, nome: m.nome, uf: m.uf },
      geometry: geometriaDe(m),
    }));
  return { type: 'FeatureCollection', features };
}

module.exports = { disponivel, municipioDoPonto, listar, obter, geojson };