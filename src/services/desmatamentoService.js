// [33] src/services/desmatamentoService.js
const Desmatamento = require('../models/Desmatamento');
const { montarFiltro } = require('../utils/filtros');
const { filtroComPeriodo, paginacao } = require('../utils/periodo');

// Função original (mantida)
async function listar(query) {
  const filtro = montarFiltro(query, ['estado', 'municipio']);
  return Desmatamento.find(filtro).sort({ data: -1 }).lean();
}

const arredondar = (n) => (n == null ? null : Math.round(n * 100) / 100);

async function listarPaginado(query) {
  const { filtro, erro } = filtroComPeriodo(query, ['estado', 'municipio']);
  if (erro) return { erro };
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

module.exports = { listar, listarPaginado, estatisticas };