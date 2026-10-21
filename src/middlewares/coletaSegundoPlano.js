// Responde 202 na hora e deixa a coleta longa (DETER, ~2 min) rodando por tras.
// Use ?aguardar=true para o comportamento antigo (espera terminar).
const LONGAS = ['desmatamento', 'todas', 'todos'];
const LIMITE_MS = 15 * 60 * 1000;
let emAndamento = false;
let desde = 0;

function carregarAuth() {
  try {
    const m = require('./chaveApi');
    if (typeof m === 'function') return m;
    return m.chaveApi || m.verificarChaveApi || m.exigirChaveApi ||
      Object.values(m).find((f) => typeof f === 'function') || null;
  } catch (e) {
    return null;
  }
}

module.exports = function coletaSegundoPlano(req, res, next) {
  const fonte = String((req.params && req.params.fonte) || '').toLowerCase();
  const query = req.query || {};
  if (!LONGAS.includes(fonte) || query.aguardar === 'true') return next();

  const auth = carregarAuth();
  if (!auth) return next(); // sem auth reconhecida: segue o fluxo normal

  auth(req, res, (err) => {
    if (err) return next(err);

    if (emAndamento && Date.now() - desde < LIMITE_MS) {
      return res.status(409).json({ erro: 'Coleta longa ja em andamento. Acompanhe em /api/fontes.' });
    }
    emAndamento = true;
    desde = Date.now();
    const inicio = Date.now();

    res.status(202).json({
      mensagem: 'Coleta iniciada em segundo plano',
      fonte: fonte,
      acompanhe: '/api/fontes'
    });
    console.log('[coleta] ' + fonte + ' em segundo plano: iniciada');

    let fim = false;
    const finalizar = (tag) => {
      if (!fim) {
        fim = true;
        emAndamento = false;
        console.log('[coleta] ' + fonte + ' em segundo plano: ' + tag + ' (' + Math.round((Date.now() - inicio) / 1000) + 's)');
      }
      return res;
    };
    // A resposta ja foi enviada; o controller continua, mas o que ele "responder" so e registrado.
    res.status = () => res;
    res.set = () => res;
    res.setHeader = () => res;
    res.json = (corpo) => finalizar(corpo && corpo.erro ? 'erro: ' + corpo.erro : 'concluida');
    res.send = res.json;
    res.end = () => finalizar('concluida');
    next();
  });
};