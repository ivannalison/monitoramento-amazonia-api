// [30] src/utils/periodo.js
// Filtro por período (?inicio=AAAA-MM-DD&fim=AAAA-MM-DD) e paginação (?pagina=1&limite=10).

const { montarFiltro } = require('./filtros');

function lerData(valor, fimDoDia) {
  if (typeof valor !== 'string' || !valor.trim()) return null;   // não informado
  const v = valor.trim();
  if (!/^\d{4}-\d{2}-\d{2}$/.test(v)) return undefined;          // formato inválido
  const d = new Date(v + (fimDoDia ? 'T23:59:59.999Z' : 'T00:00:00.000Z'));
  return Number.isNaN(d.getTime()) ? undefined : d;
}

function montarFiltroData(query) {
  const inicio = lerData(query.inicio, false);
  const fim = lerData(query.fim, true);
  if (inicio === undefined) return { erro: 'Parâmetro "inicio" inválido. Use o formato AAAA-MM-DD.' };
  if (fim === undefined) return { erro: 'Parâmetro "fim" inválido. Use o formato AAAA-MM-DD.' };
  if (inicio && fim && inicio > fim) return { erro: '"inicio" não pode ser depois de "fim".' };
  const filtro = {};
  if (inicio) filtro.$gte = inicio;
  if (fim) filtro.$lte = fim;
  return { filtro: Object.keys(filtro).length ? filtro : null };
}

// Junta filtros de texto (estado, município...) com o período.
function filtroComPeriodo(query, campos, campoData = 'data') {
  const filtro = montarFiltro(query, campos);
  const periodo = montarFiltroData(query);
  if (periodo.erro) return { erro: periodo.erro };
  if (periodo.filtro) filtro[campoData] = periodo.filtro;
  return { filtro };
}

function paginacao(query) {
  let pagina = parseInt(query.pagina, 10);
  let limite = parseInt(query.limite, 10);
  if (!Number.isInteger(pagina) || pagina < 1) pagina = 1;
  if (!Number.isInteger(limite) || limite < 1) limite = 50;
  if (limite > 200) limite = 200;
  return { pagina, limite, pular: (pagina - 1) * limite };
}

module.exports = { montarFiltroData, filtroComPeriodo, paginacao };