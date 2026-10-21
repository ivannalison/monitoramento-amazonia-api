// ARQUIVO 26 → src/services/camadasResumoService.js
// Resumo de todas as camadas (cards do painel e relatorio do estado).
const Queimada = require('../models/Queimada');
const QualidadeAr = require('../models/QualidadeAr');
const Chuva = require('../models/Chuva');
const Cheia = require('../models/Cheia');
const { paraUF } = require('../utils/estados');

const arred = (n, c = 2) => (n == null ? null : Math.round(n * 10 ** c) / 10 ** c);
const filtroEstado = (e) => { const uf = paraUF(e); return uf ? { estado: uf } : {}; };
const local = (d) => ({ estado: d.estado, latitude: d.latitude, longitude: d.longitude });
// leitura mais recente de cada ponto da grade
const ultimoPorPonto = [
  { $sort: { data: -1 } },
  { $group: { _id: { la: '$latitude', lo: '$longitude' }, d: { $first: '$$ROOT' } } },
];

async function queimadas(fe, horas) {
  const desde = new Date(Date.now() - horas * 3600 * 1000);
  const linhas = await Queimada.aggregate([
    { $match: { satelite: { $exists: true }, data: { $gte: desde }, ...fe } },
    { $group: { _id: '$satelite', total: { $sum: 1 }, soma: { $sum: '$intensidade' }, maxima: { $max: '$intensidade' }, atualizado: { $max: '$ultima_atualizacao' } } },
  ]);
  const total = linhas.reduce((s, l) => s + l.total, 0);
  const soma = linhas.reduce((s, l) => s + l.soma, 0);
  return {
    periodo_horas: horas,
    total,
    intensidade_media: total ? arred(soma / total) : null,
    intensidade_maxima: linhas.length ? Math.max(...linhas.map((l) => l.maxima)) : null,
    por_satelite: Object.fromEntries(['modis', 'noaa20', 'suomi'].map((s) => [s, linhas.find((l) => l._id === s)?.total || 0])),
    fonte: 'NASA FIRMS',
    ultima_atualizacao: linhas.length ? new Date(Math.max(...linhas.map((l) => +l.atualizado))) : null,
  };
}

async function ar(fe) {
  const [r] = await QualidadeAr.aggregate([
    { $match: fe }, ...ultimoPorPonto,
    { $sort: { 'd.pm2_5': -1 } },
    { $group: { _id: null, pontos: { $sum: 1 }, media: { $avg: '$d.pm2_5' }, pior: { $first: '$d' }, atualizado: { $max: '$d.data' } } },
  ]);
  return {
    pontos: r?.pontos || 0,
    media_pm2_5: arred(r?.media),
    pior: r ? { ...local(r.pior), pm2_5: r.pior.pm2_5, indice: r.pior.indice, data: r.pior.data } : null,
    fonte: 'Open-Meteo Air Quality',
    ultima_atualizacao: r?.atualizado || null,
  };
}

async function chuva(fe) {
  const hora = new Date(); hora.setUTCMinutes(0, 0, 0);
  const ate = new Date(hora.getTime() + 24 * 3600 * 1000);
  const [agg, maior] = await Promise.all([
    Chuva.aggregate([
      { $match: { hora, ...fe } },
      { $group: { _id: null, pontos: { $sum: 1 }, com_chuva: { $sum: { $cond: [{ $gte: ['$precipitacao_mm', 0.1] }, 1, 0] } }, media: { $avg: '$precipitacao_mm' }, maximo: { $max: '$precipitacao_mm' } } },
    ]),
    Chuva.findOne({ hora: { $gte: hora, $lte: ate }, ...fe }).sort({ precipitacao_mm: -1 }).lean(),
  ]);
  const a = agg[0];
  return {
    hora,
    pontos: a?.pontos || 0,
    pontos_com_chuva: a?.com_chuva || 0,
    media_mm: arred(a?.media),
    maximo_mm: arred(a?.maximo),
    maior_proximas_24h: maior ? { ...local(maior), hora: maior.hora, precipitacao_mm: maior.precipitacao_mm } : null,
    fonte: 'Open-Meteo Forecast',
    ultima_atualizacao: maior?.coletado_em || null,
  };
}

async function cheias(fe) {
  const [r] = await Cheia.aggregate([
    { $match: fe }, ...ultimoPorPonto,
    { $facet: {
      niveis: [{ $group: { _id: '$d.nivel', total: { $sum: 1 } } }],
      maior: [{ $sort: { 'd.razao': -1 } }, { $limit: 1 }],
      atualizado: [{ $group: { _id: null, max: { $max: '$d.data' } } }],
    } },
  ]);
  const por = Object.fromEntries(['normal', 'atencao', 'alto', 'extremo'].map((n) => [n, r.niveis.find((x) => x._id === n)?.total || 0]));
  const m = r.maior[0]?.d;
  return {
    pontos_monitorados: Object.values(por).reduce((s, n) => s + n, 0),
    por_nivel: por,
    em_alerta: por.atencao + por.alto + por.extremo,
    maior_razao: m ? { ...local(m), razao: m.razao, vazao: m.vazao, vazao_media: m.vazao_media, nivel: m.nivel, data: m.data } : null,
    fonte: 'Open-Meteo Flood (GloFAS)',
    ultima_atualizacao: r.atualizado[0]?.max || null,
  };
}

// ?estado=AM (opcional)  &horas=24 (1 a 168, vale para as queimadas)
async function resumo(query) {
  const fe = filtroEstado(query.estado);
  const horas = Math.min(Math.max(parseInt(query.horas, 10) || 24, 1), 168);
  const [q, a, c, ch] = await Promise.all([queimadas(fe, horas), ar(fe), chuva(fe), cheias(fe)]);
  return { estado: fe.estado || 'todos', gerado_em: new Date(), queimadas: q, qualidade_ar: a, chuva: c, cheias: ch };
}

module.exports = { resumo };