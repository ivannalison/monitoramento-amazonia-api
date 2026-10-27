// src/utils/filtros.js
// Monta filtros do MongoDB a partir da query string.
// "estado" aceita sigla ou nome (?estado=AM ou ?estado=Amazonas) e e comparado pela sigla.
// "municipio" ignora acento e maiuscula (?municipio=labrea acha o nome acentuado).
// "municipio_codigo" e o codigo IBGE exato (so existe nas queimadas).
// Os demais campos: comparacao exata, sem diferenciar maiusculas/minusculas.
const { paraUF } = require('./estados');

function escapar(texto) {
  return String(texto).replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
}

// Letras que aceitam variantes acentuadas
const VARIANTES = {
  a: 'a\u00e0\u00e1\u00e2\u00e3\u00e4\u00e5',
  e: 'e\u00e8\u00e9\u00ea\u00eb',
  i: 'i\u00ec\u00ed\u00ee\u00ef',
  o: 'o\u00f2\u00f3\u00f4\u00f5\u00f6',
  u: 'u\u00f9\u00fa\u00fb\u00fc',
  c: 'c\u00e7',
  n: 'n\u00f1',
};

function semAcento(texto) {
  return String(texto).normalize('NFD').replace(/[\u0300-\u036f]/g, '');
}

// "labrea" vira um padrao que casa com a forma acentuada
function padraoSemAcento(texto) {
  return semAcento(texto).trim().toLowerCase().split('')
    .map((ch) => (VARIANTES[ch] ? '[' + VARIANTES[ch] + ']' : escapar(ch)))
    .join('');
}

function montarFiltro(query, camposPermitidos) {
  const filtro = {};
  for (const campo of camposPermitidos) {
    const valor = query[campo];
    if (typeof valor === 'string' && valor.trim()) {
      if (campo === 'estado') {
        const uf = paraUF(valor);
        filtro[campo] = uf || new RegExp('^' + escapar(valor.trim()) + '$', 'i');
      } else if (campo === 'municipio') {
        filtro[campo] = new RegExp('^' + padraoSemAcento(valor) + '$', 'i');
      } else if (campo === 'municipio_codigo') {
        filtro[campo] = valor.trim();
      } else {
        filtro[campo] = new RegExp('^' + escapar(valor.trim()) + '$', 'i');
      }
    }
  }
  return filtro;
}

module.exports = { montarFiltro, padraoSemAcento, semAcento };