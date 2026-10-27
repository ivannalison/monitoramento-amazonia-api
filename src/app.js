// src/app.js (Fase 1: gzip, Cache-Control, trust proxy e CORS so de leitura)
const express = require('express');
const cors = require('cors');
const helmet = require('helmet');
const compression = require('compression');
const { rateLimit } = require('express-rate-limit');
const swaggerUi = require('swagger-ui-express');
const swaggerSpec = require('./config/swagger');
const routes = require('./routes');
const { naoEncontrado, tratarErros } = require('./middlewares/erros');

const app = express();

// Atras do proxy do Google (Cloud Run) o IP real vem no cabecalho.
// TRUST_PROXY=0 desliga; por padrao fica 1 em producao e 0 local.
const saltosProxy = process.env.TRUST_PROXY !== undefined
  ? Number(process.env.TRUST_PROXY)
  : (process.env.NODE_ENV === 'production' ? 1 : 0);
if (saltosProxy > 0) app.set('trust proxy', saltosProxy);

// Cabecalhos de seguranca. CSP desligada porque a API so devolve JSON (e o Swagger precisa de scripts)
app.use(helmet({ contentSecurityPolicy: false, crossOriginResourcePolicy: { policy: 'cross-origin' } }));

// Compressao gzip (o GeoJSON de queimadas passa de 1 MB sem ela)
app.use(compression());

// CORS: so os enderecos do .env (CORS_ORIGIN) e so leitura (o site e somente de leitura).
// Chamadas sem origem (curl, servidor, Swagger na mesma origem) passam.
const origens = (process.env.CORS_ORIGIN || 'http://localhost:4200,http://localhost:8080')
  .split(',').map((s) => s.trim()).filter(Boolean);
app.use(cors({
  origin(origin, cb) { cb(null, !origin || origens.includes('*') || origens.includes(origin)); },
  methods: ['GET', 'HEAD', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'x-api-key'],
}));

app.use(express.json({ limit: '100kb' }));

// Limite de requisicoes por IP
const aviso = { erro: 'Muitas requisicoes. Tente novamente em alguns minutos.' };
app.use('/api/coleta', rateLimit({ windowMs: 60 * 60 * 1000, limit: 30, standardHeaders: 'draft-7', legacyHeaders: false, message: aviso }));
app.post('/api/coleta/:fonte', require('./middlewares/coletaSegundoPlano'));
app.use('/api', rateLimit({ windowMs: 15 * 60 * 1000, limit: 1000, standardHeaders: 'draft-7', legacyHeaders: false, message: aviso }));

// Cache curto nas leituras (60 s). Status e docs ficam de fora.
app.use('/api', (req, res, next) => {
  if (req.method === 'GET' && !req.path.startsWith('/status') && !req.path.startsWith('/docs')) {
    res.set('Cache-Control', 'public, max-age=60');
  } else if (req.method !== 'GET') {
    res.set('Cache-Control', 'no-store');
  }
  next();
});

app.use('/api/docs', swaggerUi.serve, swaggerUi.setup(swaggerSpec));
app.use('/api', routes);

app.use(naoEncontrado);
app.use(tratarErros);

// Coleta automatica local (no Google, quem chama a API e o Cloud Scheduler)
if (process.env.AGENDAR === 'true') require('./jobs/agendador').iniciarAgendador();

module.exports = app;