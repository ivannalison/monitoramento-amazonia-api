// scripts/testar-api.mjs
// Teste de contrato: confere se CADA rota usada pelo front (src/app/core/config/rotas-api.ts)
// existe na API e devolve o formato que os servicos esperam.
// Uso: GUARDA_API=http://localhost:3000 node scripts/testar-api.mjs
import { existsSync, readFileSync } from 'node:fs';

const BASE = (process.env.GUARDA_API || 'http://localhost:3000').replace(/\/$/, '');
const ORIGEM = 'http://localhost:4200';
let total = 0;
let falhas = 0;

function checar(nome, ok, detalhe = '') {
  total++;
  if (ok) console.log('  OK      ' + nome);
  else {
    falhas++;
    console.log('  FALHOU  ' + nome + (detalhe ? ' -> ' + detalhe : ''));
  }
}
function aviso(texto) { console.log('  AVISO   ' + texto + '  (nao reprova)'); }

async function pegar(caminho) {
  try {
    const r = await fetch(BASE + caminho, { headers: { Origin: ORIGEM } });
    let json = null;
    try { json = await r.json(); } catch { /* sem corpo JSON */ }
    return { status: r.status, json, headers: r.headers };
  } catch (e) {
    return { status: 0, json: null, headers: new Headers(), erro: String(e && e.message ? e.message : e) };
  }
}

const ehFC = (j) => !!j && j.type === 'FeatureCollection' && Array.isArray(j.features);
const todos = (lista, fn) => Array.isArray(lista) && lista.every(fn);
const hora = new Date();
hora.setUTCMinutes(0, 0, 0);
const horaIso = hora.toISOString().slice(0, 16);

const contrato = {
  fontes: { q: '', ok: (j) => Array.isArray(j.fontes) && j.fontes.length === 6 && todos(j.fontes, (f) => f.id && f.nome && f.situacao) },
  queimadasGeojson: { q: '?horas=24&limite=5&satelite=modis&bbox=-75,-18,-40,6', ok: (j) => ehFC(j) && j.features.length <= 5 && typeof j.truncado === 'boolean' && todos(j.features, (f) => f.properties.satelite === 'modis' && typeof f.properties.data === 'string' && typeof f.properties.intensidade === 'number') },
  qualidadeArGeojson: { q: '', ok: (j) => ehFC(j) && todos(j.features, (f) => typeof f.properties.pm2_5 === 'number') },
  chuvasGeojson: { q: '?hora=' + horaIso, ok: (j) => ehFC(j) && todos(j.features, (f) => typeof f.properties.precipitacao_mm === 'number') },
  cheiasGeojson: { q: '', ok: (j) => ehFC(j) && todos(j.features, (f) => typeof f.properties.nivel === 'string' && typeof f.properties.razao === 'number') },
  desmatamentoGeojson: { q: '?limite=5&bbox=-75,-18,-40,6', ok: (j) => ehFC(j) && j.features.length <= 5 && typeof j.truncado === 'boolean' && typeof j.limite === 'number' && todos(j.features, (f) => typeof f.properties.area_ha === 'number') },
  municipios: { q: '?busca=labrea', ok: (j) => Array.isArray(j.municipios) && j.municipios.length > 0 && todos(j.municipios, (m) => /^\d{7}$/.test(m.codigo) && Array.isArray(m.centro) && m.centro.length === 2 && Array.isArray(m.bbox) && m.bbox.length === 4) },
  municipiosGeojson: { q: '', ok: (j) => ehFC(j) && j.features.length >= 700 && todos(j.features.slice(0, 50), (f) => !!f.properties.nome && !!f.properties.uf) },
  contornosEstados: { q: '', ok: (j) => ehFC(j) && j.features.length > 0 && todos(j.features, (f) => typeof f.properties.sigla === 'string') },
};

const texto = readFileSync(new URL('../src/app/core/config/rotas-api.ts', import.meta.url), 'utf8');
const rotas = {};
for (const m of texto.matchAll(/^\s*(\w+):\s*'(\/api\/[^']+)'/gm)) rotas[m[1]] = m[2];

console.log('API testada: ' + BASE);
console.log('\nAlinhamento entre rotas-api.ts e o contrato');
checar('rotas-api.ts lido (' + Object.keys(rotas).length + ' rotas)', Object.keys(rotas).length > 0);
for (const chave of Object.keys(rotas)) checar('a rota "' + chave + '" tem teste de contrato', chave in contrato);
for (const chave of Object.keys(contrato)) checar('o contrato "' + chave + '" existe em rotas-api.ts', chave in rotas);

console.log('\nRespostas da API (formato que os servicos do front esperam)');
let primeira = null;
for (const [chave, c] of Object.entries(contrato)) {
  if (!(chave in rotas)) continue;
  const r = await pegar(rotas[chave] + c.q);
  if (!primeira && r.status === 200) primeira = r;
  checar(rotas[chave] + c.q + '  (http ' + r.status + ')', r.status === 200 && r.json !== null && !!c.ok(r.json), r.status === 404 ? 'rota nao existe na API' : (r.erro || ''));
}

console.log('\nComportamentos que o front usa');
checar('CORS libera http://localhost:4200', !!primeira && primeira.headers.get('access-control-allow-origin') === ORIGEM);
const ruim = await pegar('/api/queimadas/geojson?bbox=abc');
checar('bbox invalido devolve 400 com mensagem', ruim.status === 400 && !!ruim.json && typeof ruim.json.erro === 'string');
const ruimD = await pegar('/api/desmatamento/geojson?bbox=abc');
checar('bbox invalido no desmatamento devolve 400', ruimD.status === 400);
for (const sat of ['modis', 'noaa20', 'suomi']) {
  const r = await pegar('/api/queimadas/geojson?horas=24&limite=10000&satelite=' + sat);
  checar('queimadas do satelite ' + sat + ' so traz esse satelite', r.status === 200 && ehFC(r.json) && todos(r.json.features, (f) => f.properties.satelite === sat));
  const n = r.json && Array.isArray(r.json.features) ? r.json.features.length : 0;
  console.log('          ' + sat + ': ' + n + ' focos nas ultimas 24 h' + (r.json && r.json.truncado ? ' (cortado no limite)' : ''));
  if (n === 0) aviso('sem focos de ' + sat + ' nas ultimas 24 h: dado defasado? (rode a coleta firms)');
}
const arr = await pegar('/api/qualidade-ar/geojson');
const nAr = arr.json && Array.isArray(arr.json.features) ? arr.json.features.length : 0;
console.log('          qualidade do ar: ' + nAr + ' pontos');
if (nAr === 0) aviso('sem pontos de qualidade do ar (rode a coleta ar)');
const chu = await pegar('/api/chuvas/geojson?hora=' + horaIso);
const nChu = chu.json && Array.isArray(chu.json.features) ? chu.json.features.length : 0;
console.log('          chuva na hora ' + horaIso + 'Z: ' + nChu + ' pontos');
if (nChu === 0) aviso('sem dados de chuva para a hora atual (rode a coleta chuva)');
const che = await pegar('/api/cheias/geojson');
const nChe = che.json && Array.isArray(che.json.features) ? che.json.features.length : 0;
console.log('          rios acima do normal: ' + nChe + ' pontos');
if (nChe === 0) aviso('nenhum rio acima do normal (pode ser normal, ou a coleta cheia esta defasada)');
const des = await pegar('/api/desmatamento/geojson?limite=10000');
const nDes = des.json && Array.isArray(des.json.features) ? des.json.features.length : 0;
console.log('          alertas de desmatamento: ' + nDes + ' pontos' + (des.json && des.json.truncado ? ' (cortado no limite)' : ''));
if (nDes === 0) aviso('sem alertas de desmatamento no banco (rode a coleta desmatamento)');
const semAcento = await pegar('/api/municipios?busca=labrea&limite=1');
checar('busca de municipio sem acento acha Lábrea', semAcento.status === 200 && semAcento.json.municipios.length === 1 && /^L.brea$/.test(semAcento.json.municipios[0].nome));
const cod = semAcento.json && semAcento.json.municipios && semAcento.json.municipios[0] && semAcento.json.municipios[0].codigo;
if (cod) {
  const cont = await pegar('/api/municipios/geojson?codigo=' + cod);
  checar('contorno de um municipio (?codigo=) traz 1 feicao', cont.status === 200 && ehFC(cont.json) && cont.json.features.length === 1);
}
const estado = await pegar('/api/contornos/estados');
checar('os 9 estados tem contorno para a busca por estado', estado.status === 200 && ehFC(estado.json) && estado.json.features.length >= 9);

console.log('\nContorno da Amazonia Legal (arquivo do front)');
const arq = new URL('../public/geo/amazonia-legal.geojson', import.meta.url);
if (existsSync(arq)) {
  const g = JSON.parse(readFileSync(arq, 'utf8'));
  const geom = g.features && g.features[0] && g.features[0].geometry;
  checar('public/geo/amazonia-legal.geojson e um MultiLineString com linhas', !!geom && geom.type === 'MultiLineString' && geom.coordinates.length > 0);
} else {
  aviso('public/geo/amazonia-legal.geojson nao existe: o mapa usara a linha dos estados');
}

console.log('\nResultado: ' + (total - falhas) + ' de ' + total + ' verificacoes OK' + (falhas ? ' | ' + falhas + ' FALHARAM' : ''));
process.exit(falhas ? 1 : 0);