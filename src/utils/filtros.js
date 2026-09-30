// [11] src/utils/filtros.js
// Monta filtros do MongoDB a partir da query string (?estado=Amazonas).
// Comparação exata, sem diferenciar maiúsculas/minúsculas.

function escapar(texto) {
  return String(texto).replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
}

function montarFiltro(query, camposPermitidos) {
  const filtro = {};
  for (const campo of camposPermitidos) {
    const valor = query[campo];
    if (typeof valor === 'string' && valor.trim()) {
      filtro[campo] = new RegExp('^' + escapar(valor.trim()) + '$', 'i');
    }
  }
  return filtro;
}

module.exports = { montarFiltro };