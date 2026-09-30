// [42] src/middlewares/erros.js
// 404 para rotas inexistentes e tratamento central de erros.

function naoEncontrado(req, res) {
  res.status(404).json({ erro: 'Recurso não encontrado' });
}

// eslint-disable-next-line no-unused-vars
function tratarErros(err, req, res, next) {
  if (err.type === 'entity.parse.failed') {
    return res.status(400).json({ erro: 'JSON inválido no corpo da requisição' });
  }
  if (err.name === 'ValidationError') {
    const detalhes = Object.values(err.errors || {}).map((e) => e.message);
    return res.status(400).json({ erro: 'Requisição inválida', detalhes });
  }
  if (err.name === 'CastError') {
    return res.status(400).json({ erro: 'Requisição inválida', detalhe: `Valor inválido para "${err.path}"` });
  }
  console.error('Erro interno:', err.message);
  res.status(500).json({ erro: 'Erro interno do servidor' });
}

module.exports = { naoEncontrado, tratarErros };