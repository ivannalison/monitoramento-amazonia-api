// src/utils/filtros.js
// Monta filtros do MongoDB a partir da query string.
// "estado" aceita sigla ou nome (?estado=AM ou ?estado=Amazonas) e e comparado pela sigla.
// Os demais campos: comparacao exata, sem diferenciar maiusculas/minusculas.
const { paraUF } = require('./estados');

function escapar(texto) {
  return String(texto).replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
}

function montarFiltro(query, camposPermitidos) {
  const filtro = {};
  for (const campo of camposPermitidos) {
    const valor = query[campo];
    if (typeof valor === 'string' && valor.trim()) {
      const uf = campo === 'estado' ? paraUF(valor) : null;
      filtro[campo] = uf || new RegExp('^' + escapar(valor.trim()) + '$', 'i');
    }
  }
  return filtro;
}

module.exports = { montarFiltro };