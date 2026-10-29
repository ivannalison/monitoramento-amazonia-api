// scripts/gerar-contorno.mjs
// Gera o contorno unico da Amazonia Legal (public/geo/amazonia-legal.geojson) juntando os municipios:
// as bordas compartilhadas entre dois municipios somem e sobra so a linha externa.
// Le o arquivo de municipios da API (nao altera nada nela). Uso: node scripts/gerar-contorno.mjs
import { existsSync, mkdirSync, readFileSync, writeFileSync } from 'node:fs';
import { dirname } from 'node:path';
import { fileURLToPath } from 'node:url';

const candidatos = [
  process.env.API_DADOS,
  fileURLToPath(new URL('../../src/data/municipios-amazonia-legal.json', import.meta.url)),
  fileURLToPath(new URL('../../monitoramento-amazonia-api/src/data/municipios-amazonia-legal.json', import.meta.url)),
].filter(Boolean);
const origem = candidatos.find((c) => existsSync(c)) || candidatos[0];
const destino = fileURLToPath(new URL('../public/geo/amazonia-legal.geojson', import.meta.url));

const municipios = JSON.parse(readFileSync(origem, 'utf8'));
const chave = (p) => p[0] + ',' + p[1];
const segmentos = new Map();

for (const m of municipios) {
  const poligonos = m.tipo === 'Polygon' ? [m.coordenadas] : m.coordenadas;
  for (const poligono of poligonos) {
    for (const anel of poligono) {
      for (let i = 1; i < anel.length; i++) {
        const a = chave(anel[i - 1]);
        const b = chave(anel[i]);
        if (a === b) continue;
        const k = a < b ? a + '|' + b : b + '|' + a;
        const s = segmentos.get(k);
        if (s) s.n++;
        else segmentos.set(k, { a: anel[i - 1], b: anel[i], n: 1 });
      }
    }
  }
}

const externos = [...segmentos.values()].filter((s) => s.n % 2 === 1);
const proporcao = externos.length / segmentos.size;
console.log('municipios lidos: ' + municipios.length);
console.log('segmentos distintos: ' + segmentos.size + ' | na borda externa: ' + externos.length + ' (' + (proporcao * 100).toFixed(1) + '%)');
if (externos.length < 100 || proporcao > 0.3) {
  console.error('FALHOU: as bordas dos municipios nao casaram direito (a malha nao e topologica). O front vai usar a linha dos estados no lugar.');
  process.exit(2);
}

const pontas = new Map();
externos.forEach((s, i) => {
  for (const p of [s.a, s.b]) {
    const k = chave(p);
    if (!pontas.has(k)) pontas.set(k, []);
    pontas.get(k).push(i);
  }
});
const usado = new Uint8Array(externos.length);
const linhas = [];
for (let i = 0; i < externos.length; i++) {
  if (usado[i]) continue;
  usado[i] = 1;
  const linha = [externos[i].a, externos[i].b];
  for (;;) {
    const fim = linha[linha.length - 1];
    const cand = (pontas.get(chave(fim)) || []).find((j) => !usado[j]);
    if (cand === undefined) break;
    usado[cand] = 1;
    const s = externos[cand];
    linha.push(chave(s.a) === chave(fim) ? s.b : s.a);
  }
  for (;;) {
    const ini = linha[0];
    const cand = (pontas.get(chave(ini)) || []).find((j) => !usado[j]);
    if (cand === undefined) break;
    usado[cand] = 1;
    const s = externos[cand];
    linha.unshift(chave(s.a) === chave(ini) ? s.b : s.a);
  }
  linhas.push(linha);
}

let minX = 180, minY = 90, maxX = -180, maxY = -90;
for (const l of linhas) for (const [x, y] of l) { if (x < minX) minX = x; if (x > maxX) maxX = x; if (y < minY) minY = y; if (y > maxY) maxY = y; }
console.log('linhas no contorno: ' + linhas.length + ' | caixa: ' + [minX, minY, maxX, maxY].join(', '));
if (minX < -76 || maxX > -38 || minY < -19 || maxY > 7) {
  console.error('FALHOU: o contorno saiu fora da regiao esperada.');
  process.exit(2);
}

mkdirSync(dirname(destino), { recursive: true });
const saida = { type: 'FeatureCollection', features: [{ type: 'Feature', properties: { nome: 'Amaz\u00f4nia Legal' }, geometry: { type: 'MultiLineString', coordinates: linhas } }] };
writeFileSync(destino, JSON.stringify(saida));
console.log('OK: ' + destino);