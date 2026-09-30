// [41] src/middlewares/chaveApi.js
// Protege as rotas que ALTERAM dados (POST/PUT/DELETE) com uma chave no header "x-api-key".
// - Local, sem API_KEY no .env: liberado (facilita o desenvolvimento).
// - Em produção (Vercel), sem API_KEY configurada: escrita bloqueada por segurança.
// - Com API_KEY definida: exige o header correto.

module.exports = function exigirChave(req, res, next) {
  const chave = process.env.API_KEY;

  if (!chave) {
    if (process.env.NODE_ENV === 'production') {
      return res.status(503).json({ erro: 'Escrita desabilitada: API_KEY não configurada no servidor' });
    }
    return next();
  }

  if (req.get('x-api-key') !== chave) {
    return res.status(401).json({ erro: 'Chave de API ausente ou inválida' });
  }
  next();
};