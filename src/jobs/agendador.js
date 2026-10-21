// ARQUIVO 23 → src/jobs/agendador.js
// Dispara as coletas sozinho (horarios em UTC). Ativado com AGENDAR=true no .env.
const cron = require('node-cron');
const { executarUma } = require('../services/coletaService');

const ocupado = {}; // evita duas coletas da mesma fonte ao mesmo tempo

function agendar(fonte, expressao) {
  cron.schedule(expressao, async () => {
    if (ocupado[fonte]) return console.log(`[agendador] ${fonte} ainda rodando, pulei esta rodada`);
    ocupado[fonte] = true;
    try {
      const r = await executarUma(fonte);
      console.log(`[agendador] ${fonte} concluida`, JSON.stringify(r));
    } finally { ocupado[fonte] = false; }
  }, { timezone: 'UTC' });
}

function iniciarAgendador() {
  agendar('firms', '*/30 * * * *');   // queimadas: a cada 30 min
  agendar('ar', '5 */3 * * *');       // ar:     a cada 3 h (minuto 05)
  agendar('chuva', '10 */3 * * *');   // chuva:  a cada 3 h (minuto 10)
  agendar('cheia', '15 */3 * * *');   // cheia:  a cada 3 h (minuto 15)
  agendar('desmatamento', '20 */6 * * *');   // desmatamento (INPE DETER): a cada 6 h (minuto 20)
  agendar('clima', '25 */6 * * *');          // clima (Open-Meteo): a cada 6 h (minuto 25)
  console.log('Agendador ativo: firms 30 min | ar, chuva e cheia a cada 3 h | desmatamento e clima a cada 6 h');
}

module.exports = { iniciarAgendador };