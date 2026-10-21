// ARQUIVO 20 → src/controllers/camadasController.js
const asyncHandler = require('../utils/asyncHandler');
const QualidadeAr = require('../models/QualidadeAr');
const Chuva = require('../models/Chuva');
const Cheia = require('../models/Cheia');
const Queimada = require('../models/Queimada');
const Coleta = require('../models/Coleta');
const { paraUF } = require('../utils/estados');

const ponto = (d, props) => ({
  type: 'Feature',
  geometry: { type: 'Point', coordinates: [d.longitude, d.latitude] },
  properties: props,
});
const colecao = (features, extra) => ({ type: 'FeatureCollection', ...extra, total: features.length, features });
const filtroEstado = (q) => { const uf = paraUF(q.estado); return uf ? { estado: uf } : {}; };

// GET /api/qualidade-ar/geojson?estado=AM  (leitura mais recente de cada ponto)
exports.ar = asyncHandler(async (req, res) => {
  const docs = await QualidadeAr.aggregate([
    { $match: filtroEstado(req.query) },
    { $sort: { data: -1 } },
    { $group: { _id: { la: '$latitude', lo: '$longitude' }, d: { $first: '$$ROOT' } } },
    { $limit: 5000 },
  ]);
  const feats = docs.map(({ d }) => ponto(d, {
    data: d.data, pm2_5: d.pm2_5, pm10: d.pm10, indice: d.indice, aerossol: d.aerossol,
    estado: d.estado, fonte: d.fonte,
  }));
  res.json(colecao(feats, { fonte: 'Open-Meteo Air Quality', ultima_atualizacao: docs[0]?.d.data || null }));
});

// GET /api/chuvas/geojson?hora=2026-10-19T15:00  (sem "hora": a hora cheia mais próxima de agora)
exports.chuva = asyncHandler(async (req, res) => {
  let hora = req.query.hora ? new Date(req.query.hora.length === 16 ? `${req.query.hora}:00Z` : req.query.hora) : new Date();
  if (isNaN(hora)) return res.status(400).json({ erro: 'Parametro hora invalido (use 2026-10-19T15:00)' });
  hora.setUTCMinutes(0, 0, 0);
  const docs = await Chuva.find({ hora, ...filtroEstado(req.query) }).limit(5000).lean();
  const feats = docs.map((d) => ponto(d, {
    hora: d.hora, precipitacao_mm: d.precipitacao_mm, estado: d.estado, fonte: d.fonte,
  }));
  res.json(colecao(feats, { fonte: 'Open-Meteo Forecast', hora, ultima_atualizacao: docs[0]?.coletado_em || null }));
});

// GET /api/cheias/geojson?estado=PA&nivel=atencao  (por padrão só rios acima do normal)
exports.cheia = asyncHandler(async (req, res) => {
  const filtro = { ...filtroEstado(req.query) };
  filtro.nivel = ['normal', 'atencao', 'alto', 'extremo'].includes(req.query.nivel)
    ? req.query.nivel : { $in: ['atencao', 'alto', 'extremo'] };
  const docs = await Cheia.aggregate([
    { $match: filtro },
    { $sort: { data: -1 } },
    { $group: { _id: { la: '$latitude', lo: '$longitude' }, d: { $first: '$$ROOT' } } },
    { $limit: 5000 },
  ]);
  const feats = docs.map(({ d }) => ponto(d, {
    data: d.data, vazao: d.vazao, vazao_media: d.vazao_media, razao: d.razao, nivel: d.nivel,
    estado: d.estado, fonte: d.fonte,
  }));
  res.json(colecao(feats, { fonte: 'Open-Meteo Flood (GloFAS)', ultima_atualizacao: docs[0]?.d.data || null }));
});

// GET /api/fontes  (fonte, última coleta e situação)
exports.fontes = asyncHandler(async (req, res) => {
  const nomes = {
    firms: 'NASA FIRMS (queimadas)', ar: 'Open-Meteo Air Quality', chuva: 'Open-Meteo Forecast',
    cheia: 'Open-Meteo Flood', desmatamento: 'INPE DETER (desmatamento)', clima: 'Open-Meteo Forecast (clima)',
  };
  const lista = [];
  for (const [id, nome] of Object.entries(nomes)) {
    const ultima = await Coleta.findOne({ fonte: id }).sort({ inicio: -1 }).lean();
    const ultimaOk = await Coleta.findOne({ fonte: id, status: 'ok' }).sort({ inicio: -1 }).lean();
    lista.push({
      id, nome,
      ultima_coleta: ultima?.fim || null,
      ultima_coleta_ok: ultimaOk?.fim || null,
      situacao: ultima ? ultima.status : 'sem coleta',
      erro: ultima?.status === 'erro' ? ultima.erro : undefined,
    });
  }
  res.json({ fontes: lista, total_focos: await Queimada.countDocuments({ satelite: { $exists: true } }) });
});