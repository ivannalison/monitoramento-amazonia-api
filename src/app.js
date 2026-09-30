// [26] src/app.js
// Configuração do Express (sem iniciar o servidor).

const express = require('express');
const cors = require('cors');
const swaggerUi = require('swagger-ui-express');
const swaggerSpec = require('./config/swagger');
const routes = require('./routes');
const { naoEncontrado, tratarErros } = require('./middlewares/erros');

const app = express();

app.use(cors());          // permite o futuro site consumir a API
app.use(express.json());

app.use('/api/docs', swaggerUi.serve, swaggerUi.setup(swaggerSpec));
app.use('/api', routes);

app.use(naoEncontrado);
app.use(tratarErros);

module.exports = app;