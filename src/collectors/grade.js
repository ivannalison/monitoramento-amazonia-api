// ARQUIVO 10 → src/collectors/grade.js
// Gera uma grade de pontos sobre a Amazônia Legal (só pontos dentro dos 9 estados).
// passo=1.5 graus dá ~250 pontos. Aumente o passo para reduzir chamadas.
const { estadoDoPonto } = require('../utils/geo');

function gerarGrade(passo = 1.5) {
  const pontos = [];
  for (let lat = -16; lat <= 5; lat += passo) {
    for (let lon = -74; lon <= -44; lon += passo) {
      const la = Math.round(lat * 100) / 100;
      const lo = Math.round(lon * 100) / 100;
      const estado = estadoDoPonto(lo, la);
      if (estado) pontos.push({ latitude: la, longitude: lo, estado });
    }
  }
  return pontos;
}

module.exports = { gerarGrade };