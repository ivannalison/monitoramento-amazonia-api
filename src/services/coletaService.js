// ARQUIVO 24 → src/services/coletaService.js
// Executa uma coleta e registra o resultado (usado pela rota POST e pelo agendador).
const Coleta = require('../models/Coleta');
const { coletarFirms } = require('../collectors/firms.collector');
const { coletarAr } = require('../collectors/ar.collector');
const { coletarChuva } = require('../collectors/chuva.collector');
const { coletarCheia } = require('../collectors/cheia.collector');
const { coletarDeter } = require('../collectors/deter.collector');
const { coletarClima } = require('../collectors/clima.collector');

const COLETORES = { firms: coletarFirms, ar: coletarAr, chuva: coletarChuva, cheia: coletarCheia, desmatamento: coletarDeter, clima: coletarClima };

// Soma os campos "novos" e "gravados" de qualquer resultado
function contar(obj) {
  if (!obj || typeof obj !== 'object') return 0;
  let total = 0;
  for (const [k, v] of Object.entries(obj)) {
    if ((k === 'novos' || k === 'gravados') && typeof v === 'number') total += v;
    else total += contar(v);
  }
  return total;
}

async function executarUma(fonte) {
  const inicio = new Date();
  try {
    const resultado = await COLETORES[fonte]();
    const temErro = JSON.stringify(resultado).includes('"erro"');
    await Coleta.create({
      fonte, inicio, fim: new Date(), status: temErro ? 'erro' : 'ok',
      registros: contar(resultado), erro: temErro ? JSON.stringify(resultado) : undefined,
    });
    return resultado;
  } catch (e) {
    await Coleta.create({ fonte, inicio, fim: new Date(), status: 'erro', erro: e.message });
    return { erro: e.message };
  }
}

module.exports = { COLETORES, executarUma };