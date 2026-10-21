// ARQUIVO 11 → src/collectors/openmeteo.js
// Chama o Open-Meteo em lotes de pontos. Sem chave. Uso não comercial.
const LOTE = 50;
const espera = (ms) => new Promise((r) => setTimeout(r, ms));

async function buscarEmLote(urlBase, pontos, params) {
  const resultados = [];
  for (let i = 0; i < pontos.length; i += LOTE) {
    const parte = pontos.slice(i, i + LOTE);
    const url = `${urlBase}?latitude=${parte.map((p) => p.latitude).join(',')}` +
      `&longitude=${parte.map((p) => p.longitude).join(',')}&${params}&timezone=UTC`;
    let json;
    for (let tentativa = 1; tentativa <= 3; tentativa++) {
      const res = await fetch(url);
      if (res.ok) { json = await res.json(); break; }
      if (tentativa === 3) throw new Error(`Open-Meteo respondeu ${res.status}`);
      await espera(2000 * tentativa);
    }
    const lista = Array.isArray(json) ? json : [json];
    lista.forEach((r, k) => resultados.push({ ponto: parte[k], dados: r }));
    await espera(500);
  }
  return resultados;
}

module.exports = { buscarEmLote };