// src/services/desmatamentoService.js
const Desmatamento = require('../models/Desmatamento');
const { montarFiltro } = require('../utils/filtros');
const { filtroComPeriodo, paginacao } = require('../utils/periodo');
const { lerBbox } = require('../utils/bbox');

// Funcao original (mantida)
async function listar(query) {
  const filtro = montarFiltro(query, ['estado', 'municipio']);
  return Desmatamento.find(filtro).sort({ data: -1 }).lean();
}

const arredondar = (n) => (n == null ? null : Math.round(n * 100) / 100);

// Restringe a consulta a area visivel do mapa (?bbox=minLon,minLat,maxLon,maxLat)
function aplicarBbox(filtro, bbox) {
  if (!bbox) return;
  filtro.longitude = { $gte: bbox[0], $lte: bbox[2] };
  filtro.latitude = { $gte: bbox[1], $lte: bbox[3] };
}

async function listarPaginado(query) {
  const { filtro, erro } = filtroComPeriodo(query, ['estado', 'municipio']);
  if (erro) return { erro };
  const { bbox, erro: erroBbox } = lerBbox(query);
  if (erroBbox) return { erro: erroBbox };
  aplicarBbox(filtro, bbox);
  const { pagina, limite, pular } = paginacao(query);
  const [alertas, total] = await Promise.all([
    Desmatamento.find(filtro).sort({ data: -1 }).skip(pular).limit(limite).lean(),
    Desmatamento.countDocuments(filtro),
  ]);
  return { alertas, total, pagina, limite, total_paginas: Math.ceil(total / limite) };
}

async function estatisticas(query) {
  const { filtro, erro } = filtroComPeriodo(query, ['estado', 'municipio']);
  if (erro) return { erro };
  const { bbox, erro: erroBbox } = lerBbox(query);
  if (erroBbox) return { erro: erroBbox };
  aplicarBbox(filtro, bbox);
  const [porEstado, porDia] = await Promise.all([
    Desmatamento.aggregate([
      { $match: filtro },
      { $group: {
          _id: '$estado',
          total: { $sum: 1 },
          area_total_ha: { $sum: '$area_ha' },
          area_media_ha: { $avg: '$area_ha' },
          area_maxima_ha: { $max: '$area_ha' },
      } },
      { $sort: { area_total_ha: -1 } },
    ]),
    Desmatamento.aggregate([
      { $match: filtro },
      { $group: {
          _id: { $dateToString: { format: '%Y-%m-%d', date: '$data' } },
          total: { $sum: 1 },
          area_ha: { $sum: '$area_ha' },
      } },
      { $sort: { _id: 1 } },
    ]),
  ]);
  const estados = porEstado.map((e) => ({
    estado: e._id,
    total: e.total,
    area_total_ha: arredondar(e.area_total_ha),
    area_media_ha: arredondar(e.area_media_ha),
    area_maxima_ha: e.area_maxima_ha ?? null,
  }));
  return {
    total: estados.reduce((soma, e) => soma + e.total, 0),
    area_total_ha: arredondar(estados.reduce((soma, e) => soma + e.area_total_ha, 0)),
    por_estado: estados,
    por_dia: porDia.map((d) => ({ data: d._id, total: d.total, area_ha: arredondar(d.area_ha) })),
  };
}

// Alertas em GeoJSON para o mapa (um ponto no centro de cada alerta, os maiores primeiro)
// ?bbox=  &estado=  &municipio=  &inicio=  &fim=  &limite=5000 (1 a 10000)
async function listarGeojson(query) {
  const { filtro, erro } = filtroComPeriodo(query, ['estado', 'municipio']);
  if (erro) return { erro };
  const { bbox, erro: erroBbox } = lerBbox(query);
  if (erroBbox) return { erro: erroBbox };
  const limite = Math.min(Math.max(parseInt(query.limite, 10) || 5000, 1), 10000);
  if (bbox) {
    aplicarBbox(filtro, bbox);
  } else {
    filtro.latitude = { $ne: null };
    filtro.longitude = { $ne: null };
  }
  const alertas = await Desmatamento.find(filtro).sort({ area_ha: -1 }).limit(limite).lean();
  return {
    alertas,
    limite,
    truncado: alertas.length >= limite,
    bbox,
    geojson: {
      type: 'FeatureCollection',
      features: alertas.map((a) => ({
        type: 'Feature',
        geometry: { type: 'Point', coordinates: [a.longitude, a.latitude] },
        properties: {
          data: a.data, estado: a.estado, municipio: a.municipio || null,
          area_ha: a.area_ha, classe: a.classe || null, fonte: a.fonte,
        },
      })),
    },
  };
}

module.exports = { listar, listarPaginado, estatisticas, listarGeojson };