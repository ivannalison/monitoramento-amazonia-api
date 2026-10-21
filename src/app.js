// [26] src/app.js  (ARQUIVO 22 - seguranca: helmet, CORS restrito, limite de requisicoes)
const express = require('express');
const cors = require('cors');
const helmet = require('helmet');
const { rateLimit } = require('express-rate-limit');
const swaggerUi = require('swagger-ui-express');
const swaggerSpec = require('./config/swagger');
const routes = require('./routes');
const { naoEncontrado, tratarErros } = require('./middlewares/erros');

const app = express();

// Atras do proxy do Google (Cloud Run) o IP real vem no cabecalho
if (process.env.NODE_ENV === 'production') app.set('trust proxy', 1);

// Cabecalhos de seguranca. CSP desligada porque a API so devolve JSON (e o Swagger precisa de scripts)
app.use(helmet({ contentSecurityPolicy: false, crossOriginResourcePolicy: { policy: 'cross-origin' } }));

// CORS: so os enderecos do .env (CORS_ORIGIN). Chamadas sem origem (curl, servidor) passam.
const origens = (process.env.CORS_ORIGIN || 'http://localhost:4200,http://localhost:8080')
  .split(',').map((s) => s.trim()).filter(Boolean);
app.use(cors({
  origin(origin, cb) { cb(null, !origin || origens.includes('*') || origens.includes(origin)); },
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'x-api-key'],
}));

app.use(express.json({ limit: '100kb' }));

// Limite de requisicoes por IP
const aviso = { erro: 'Muitas requisicoes. Tente novamente em alguns minutos.' };
app.use('/api/coleta', rateLimit({ windowMs: 60 * 60 * 1000, limit: 30, standardHeaders: 'draft-7', legacyHeaders: false, message: aviso }));
app.post('/api/coleta/:fonte', require('./middlewares/coletaSegundoPlano'));
app.use('/api', rateLimit({ windowMs: 15 * 60 * 1000, limit: 1000, standardHeaders: 'draft-7', legacyHeaders: false, message: aviso }));

app.use('/api/docs', swaggerUi.serve, swaggerUi.setup(swaggerSpec));
app.use('/api', routes);

app.use(naoEncontrado);
app.use(tratarErros);

// Coleta automatica local (no Google, quem chama a API e o Cloud Scheduler)
if (process.env.AGENDAR === 'true') require('./jobs/agendador').iniciarAgendador();

module.exports = app;