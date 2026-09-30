// [27] src/server.js
// Ponto de entrada: sobe o servidor e depois conecta no banco.

require('dotenv').config();
const app = require('./app');
const { conectarBanco } = require('./config/database');

const PORT = process.env.PORT || 3000;

app.listen(PORT, () => {
  console.log(`🌳 API rodando em http://localhost:${PORT}/api/status`);
  console.log(`📘 Swagger em http://localhost:${PORT}/api/docs`);
});

conectarBanco();