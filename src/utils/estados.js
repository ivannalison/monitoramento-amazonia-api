// src/utils/estados.js
// Padroniza o campo "estado" em todo o sistema: sempre a SIGLA (AM, PA...).
// Aceita sigla ou nome, com ou sem acento, em qualquer caixa.
const UFS = {
  AC: 'Acre', AM: 'Amazonas', AP: 'Amap\u00e1', MA: 'Maranh\u00e3o', MT: 'Mato Grosso',
  PA: 'Par\u00e1', RO: 'Rond\u00f4nia', RR: 'Roraima', TO: 'Tocantins',
};

const semAcento = (s) => s.normalize('NFD').replace(/[\u0300-\u036f]/g, '').trim().toLowerCase();
const POR_CHAVE = new Map();
for (const [uf, nome] of Object.entries(UFS)) {
  POR_CHAVE.set(semAcento(uf), uf);
  POR_CHAVE.set(semAcento(nome), uf);
}

// Sigla da Amazonia Legal, ou null se o texto nao for um estado conhecido.
function paraUF(valor) {
  return typeof valor === 'string' ? POR_CHAVE.get(semAcento(valor)) || null : null;
}

// Para gravar: converte o nome em sigla. Valor desconhecido ou nao textual segue como veio.
function normalizarUF(valor) {
  if (typeof valor !== 'string') return valor;
  return paraUF(valor) || valor.trim();
}

module.exports = { UFS, paraUF, normalizarUF };