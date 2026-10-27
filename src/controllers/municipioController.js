// src/controllers/municipioController.js
// Municipios e contornos (dados do IBGE em src/data, sem consulta ao banco).
const fs = require('fs');
const path = require('path');
const asyncHandler = require('../utils/asyncHandler');
const municipios = require('../utils/municipios');
const { lerBbox } = require('../utils/bbox');
const { paraUF } = require('../utils/estados');

const FONTE = 'IBGE (malha municipal)';
const ERRO_ESTADO = { erro: 'Par\u00e2metro "estado" inv\u00e1lido. Use a sigla (ex.: AM) ou o nome do estado.' };
const ERRO_CODIGO = { erro: 'C\u00f3digo inv\u00e1lido. Use os 7 d\u00edgitos do c\u00f3digo IBGE do munic\u00edpio.' };
const INDISPONIVEL = { erro: 'Malha de munic\u00edpios indispon\u00edvel no servidor.' };

// Dados que quase nunca mudam: o navegador pode guardar por 1 hora
const longoPrazo = (res) => res.set('Cache-Control', 'public, max-age=3600');
const ehCodigo = (v) => typeof v === 'string' && /^\d{7}$/.test(v.trim());

let estadosGeo = null;
function contornosDosEstados() {
  if (!estadosGeo) estadosGeo = JSON.parse(fs.readFileSync(path.join(__dirname, '..', 'data', 'estados.geojson'), 'utf8'));
  return estadosGeo;
}

// GET /api/municipios?estado=AM&busca=labrea&limite=20
exports.listar = asyncHandler(async (req, res) => {
  if (!municipios.disponivel()) return res.status(503).json(INDISPONIVEL);
  let uf;
  if (req.query.estado) {
    uf = paraUF(req.query.estado);
    if (!uf) return res.status(400).json(ERRO_ESTADO);
  }
  const busca = typeof req.query.busca === 'string' ? req.query.busca : '';
  let lista = municipios.listar({ uf, busca });
  const total = lista.length;
  const limite = parseInt(req.query.limite, 10);
  if (Number.isInteger(limite) && limite > 0) lista = lista.slice(0, Math.min(limite, 1000));
  longoPrazo(res);
  res.json({ fonte: FONTE, total, municipios: lista });
});

// GET /api/municipios/:codigo
exports.obter = asyncHandler(async (req, res) => {
  if (!municipios.disponivel()) return res.status(503).json(INDISPONIVEL);
  if (!ehCodigo(req.params.codigo)) return res.status(400).json(ERRO_CODIGO);
  const m = municipios.obter(req.params.codigo.trim());
  if (!m) return res.status(404).json({ erro: 'Munic\u00edpio n\u00e3o encontrado na Amaz\u00f4nia Legal.' });
  longoPrazo(res);
  res.json({ fonte: FONTE, ...m });
});

// GET /api/municipios/geojson?estado=AM&codigo=1302603&bbox=minLon,minLat,maxLon,maxLat
exports.geojson = asyncHandler(async (req, res) => {
  if (!municipios.disponivel()) return res.status(503).json(INDISPONIVEL);
  let uf;
  if (req.query.estado) {
    uf = paraUF(req.query.estado);
    if (!uf) return res.status(400).json(ERRO_ESTADO);
  }
  let codigo;
  if (req.query.codigo) {
    if (!ehCodigo(req.query.codigo)) return res.status(400).json(ERRO_CODIGO);
    codigo = req.query.codigo.trim();
  }
  const { bbox, erro } = lerBbox(req.query);
  if (erro) return res.status(400).json({ erro });
  const g = municipios.geojson({ uf, codigo, bbox });
  longoPrazo(res);
  res.json({ ...g, fonte: FONTE, total: g.features.length });
});

// GET /api/contornos/estados
exports.contornosEstados = asyncHandler(async (req, res) => {
  longoPrazo(res);
  res.json({ ...contornosDosEstados(), fonte: 'IBGE (malha estadual)' });
});