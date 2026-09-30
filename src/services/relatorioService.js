// [37] src/services/relatorioService.js
// Relatório consolidado: queimadas + desmatamento + alertas, agrupados por estado.
// Filtros aceitos: ?estado= &inicio= &fim=  (o período vale para queimadas e desmatamento;
// alertas não têm data de ocorrência, então só o filtro de estado se aplica a eles).

const Queimada = require('../models/Queimada');
const Desmatamento = require('../models/Desmatamento');
const Alerta = require('../models/Alerta');
const { montarFiltro } = require('../utils/filtros');
const { filtroComPeriodo } = require('../utils/periodo');

const arredondar = (n) => (n == null ? null : Math.round(n * 100) / 100);

async function gerar(query) {
  const { filtro, erro } = filtroComPeriodo(query, ['estado']);
  if (erro) return { erro };
  const filtroAlerta = montarFiltro(query, ['estado']);

  const [queim, desm, alert, f1, f2, f3] = await Promise.all([
    Queimada.aggregate([
      { $match: filtro },
      { $group: { _id: '$estado', focos: { $sum: 1 }, intensidade_media: { $avg: '$intensidade' } } },
    ]),
    Desmatamento.aggregate([
      { $match: filtro },
      { $group: { _id: '$estado', ocorrencias: { $sum: 1 }, area_ha: { $sum: '$area_ha' } } },
    ]),
    Alerta.aggregate([
      { $match: filtroAlerta },
      { $group: { _id: '$estado', alertas: { $sum: 1 }, ativos: { $sum: { $cond: ['$ativo', 1, 0] } } } },
    ]),
    Queimada.distinct('fonte'),
    Desmatamento.distinct('fonte'),
    Alerta.distinct('fonte'),
  ]);

  const mapa = new Map();
  const pegar = (nome) => {
    const chave = nome || 'Não informado';
    if (!mapa.has(chave)) {
      mapa.set(chave, {
        estado: chave,
        focos: 0,
        intensidade_media: null,
        desmatamentos: 0,
        area_desmatada_ha: 0,
        alertas: 0,
        alertas_ativos: 0,
      });
    }
    return mapa.get(chave);
  };

  queim.forEach((q) => {
    const e = pegar(q._id);
    e.focos = q.focos;
    e.intensidade_media = arredondar(q.intensidade_media);
  });
  desm.forEach((d) => {
    const e = pegar(d._id);
    e.desmatamentos = d.ocorrencias;
    e.area_desmatada_ha = arredondar(d.area_ha);
  });
  alert.forEach((a) => {
    const e = pegar(a._id);
    e.alertas = a.alertas;
    e.alertas_ativos = a.ativos;
  });

  const porEstado = [...mapa.values()].sort((a, b) => a.estado.localeCompare(b.estado, 'pt-BR'));
  const soma = (campo) => porEstado.reduce((s, e) => s + e[campo], 0);

  return {
    gerado_em: new Date().toISOString(),
    filtros: {
      estado: query.estado || null,
      inicio: query.inicio || null,
      fim: query.fim || null,
    },
    fontes: [...new Set([...f1, ...f2, ...f3])],
    totais: {
      focos_de_calor: soma('focos'),
      ocorrencias_desmatamento: soma('desmatamentos'),
      area_desmatada_ha: arredondar(soma('area_desmatada_ha')),
      alertas: soma('alertas'),
      alertas_ativos: soma('alertas_ativos'),
    },
    por_estado: porEstado,
  };
}

module.exports = { gerar };