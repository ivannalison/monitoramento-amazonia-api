// src/services/relatorioService.js
// Relatorio consolidado por estado (sempre pela sigla): queimadas + desmatamento + alertas,
// mais a situacao atual das camadas (ar, chuva, cheias e focos das ultimas 24 h).
// Filtros: ?estado= (sigla ou nome) &inicio= &fim= &horas=
// O periodo (inicio/fim) vale para queimadas e desmatamento; alertas so filtram por estado;
// o bloco "camadas" mostra a situacao atual e usa "horas" para as queimadas.

const Queimada = require('../models/Queimada');
const Desmatamento = require('../models/Desmatamento');
const Alerta = require('../models/Alerta');
const { montarFiltro } = require('../utils/filtros');
const { filtroComPeriodo } = require('../utils/periodo');
const { paraUF, normalizarUF } = require('../utils/estados');
const camadasResumo = require('./camadasResumoService');

const arredondar = (n) => (n == null ? null : Math.round(n * 100) / 100);

async function gerar(query) {
  if (query.estado && !paraUF(query.estado)) {
    return { erro: 'Par\u00e2metro "estado" inv\u00e1lido. Use a sigla (ex.: AM) ou o nome do estado.' };
  }
  const uf = paraUF(query.estado);
  const { filtro, erro } = filtroComPeriodo(query, ['estado']);
  if (erro) return { erro };
  const filtroAlerta = montarFiltro(query, ['estado']);

  const [queim, desm, alert, f1, f2, f3, camadas] = await Promise.all([
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
    camadasResumo.resumo({ estado: uf || undefined, horas: query.horas }),
  ]);

  const mapa = new Map();
  const pegar = (nome) => {
    const chave = nome ? normalizarUF(nome) : 'N\u00e3o informado';
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
    const total = e.focos + q.focos;
    e.intensidade_media = total ? arredondar(((e.intensidade_media || 0) * e.focos + q.intensidade_media * q.focos) / total) : null;
    e.focos = total;
  });
  desm.forEach((d) => {
    const e = pegar(d._id);
    e.desmatamentos += d.ocorrencias;
    e.area_desmatada_ha = arredondar(e.area_desmatada_ha + d.area_ha);
  });
  alert.forEach((a) => {
    const e = pegar(a._id);
    e.alertas += a.alertas;
    e.alertas_ativos += a.ativos;
  });

  const porEstado = [...mapa.values()].sort((a, b) => a.estado.localeCompare(b.estado, 'pt-BR'));
  const soma = (campo) => porEstado.reduce((s, e) => s + e[campo], 0);
  const fontesCamadas = [camadas.queimadas, camadas.qualidade_ar, camadas.chuva, camadas.cheias].map((c) => c.fonte);

  return {
    gerado_em: new Date().toISOString(),
    filtros: {
      estado: uf || null,
      inicio: query.inicio || null,
      fim: query.fim || null,
    },
    fontes: [...new Set([...f1, ...f2, ...f3, ...fontesCamadas])],
    totais: {
      focos_de_calor: soma('focos'),
      ocorrencias_desmatamento: soma('desmatamentos'),
      area_desmatada_ha: arredondar(soma('area_desmatada_ha')),
      alertas: soma('alertas'),
      alertas_ativos: soma('alertas_ativos'),
    },
    por_estado: porEstado,
    camadas,
  };
}

module.exports = { gerar };