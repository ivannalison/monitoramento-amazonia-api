// src/services/queimadaService.js  (ARQUIVO 7 - acrescentado: listarGeojson)
const Queimada = require('../models/Queimada');
const { montarFiltro } = require('../utils/filtros');
const { filtroComPeriodo, paginacao } = require('../utils/periodo');
const { paraUF } = require('../utils/estados');

// Função original (mantida): lista tudo, com filtros por estado e município.
async function listar(query) {
  const filtro = montarFiltro(query, ['estado', 'municipio']);
  return Queimada.find(filtro).sort({ data: -1 }).lean();
}

const arredondar = (n) => (n == null ? null : Math.round(n * 100) / 100);

async function listarPaginado(query) {
  const { filtro, erro } = filtroComPeriodo(query, ['estado', 'municipio']);
  if (erro) return { erro };
  const { pagina, limite, pular } = paginacao(query);
  const [focos, total] = await Promise.all([
    Queimada.find(filtro).sort({ data: -1 }).skip(pular).limit(limite).lean(),
    Queimada.countDocuments(filtro),
  ]);
  return { focos, total, pagina, limite, total_paginas: Math.ceil(total / limite) };
}

async function estatisticas(query) {
  const { filtro, erro } = filtroComPeriodo(query, ['estado', 'municipio']);
  if (erro) return { erro };
  const [porEstado, porDia] = await Promise.all([
    Queimada.aggregate([
      { $match: filtro },
      { $group: {
          _id: '$estado',
          total: { $sum: 1 },
          intensidade_media: { $avg: '$intensidade' },
          intensidade_maxima: { $max: '$intensidade' },
      } },
      { $sort: { total: -1 } },
    ]),
    Queimada.aggregate([
      { $match: filtro },
      { $group: { _id: { $dateToString: { format: '%Y-%m-%d', date: '$data' } }, total: { $sum: 1 } } },
      { $sort: { _id: 1 } },
    ]),
  ]);
  const estados = porEstado.map((e) => ({
    estado: e._id,
    total: e.total,
    intensidade_media: arredondar(e.intensidade_media),
    intensidade_maxima: e.intensidade_maxima ?? null,
  }));
  return {
    total: estados.reduce((soma, e) => soma + e.total, 0),
    por_estado: estados,
    por_dia: porDia.map((d) => ({ data: d._id, total: d.total })),
  };
}

// NOVO: focos em GeoJSON para o mapa (máx. 5.000 pontos, os mais intensos primeiro)
// ?satelite=modis|noaa20|suomi  &horas=24 (1 a 168)  &estado=AM
async function listarGeojson(query) {
  const horas = Math.min(Math.max(parseInt(query.horas, 10) || 24, 1), 168);
  const filtro = { satelite: { $exists: true }, data: { $gte: new Date(Date.now() - horas * 3600 * 1000) } };
  if (['modis', 'noaa20', 'suomi'].includes(query.satelite)) filtro.satelite = query.satelite;
  const uf = paraUF(query.estado);
  if (uf) filtro.estado = uf;

  const focos = await Queimada.find(filtro).sort({ intensidade: -1 }).limit(5000).lean();
  return {
    focos,
    geojson: {
      type: 'FeatureCollection',
      features: focos.map((f) => ({
        type: 'Feature',
        geometry: { type: 'Point', coordinates: [f.longitude, f.latitude] },
        properties: {
          data: f.data, hora: f.hora, satelite: f.satelite, intensidade: f.intensidade,
          confianca: f.confianca, estado: f.estado, municipio: f.municipio || null, fonte: f.fonte,
        },
      })),
    },
  };
}

module.exports = { listar, listarPaginado, estatisticas, listarGeojson };