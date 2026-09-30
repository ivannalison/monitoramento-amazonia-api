// [12] src/utils/resposta.js
// Ajuda a preencher "fonte" e "ultima_atualizacao" nas respostas.

function fonteDe(docs) {
  const fontes = [...new Set(docs.map((d) => d.fonte).filter(Boolean))];
  return fontes.length ? fontes.join(', ') : 'Dados demonstrativos';
}

function ultimaAtualizacaoDe(docs) {
  if (!docs.length) return null;
  const maior = Math.max(...docs.map((d) => new Date(d.ultima_atualizacao).getTime()));
  return new Date(maior).toISOString();
}

module.exports = { fonteDe, ultimaAtualizacaoDe };