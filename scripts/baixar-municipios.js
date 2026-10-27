// scripts/baixar-municipios.js
// Baixa a malha municipal do IBGE dos 9 estados e guarda so os municipios da Amazonia Legal
// em src/data/municipios-amazonia-legal.json. No Maranhao entram os municipios com alguma parte
// a oeste do meridiano 44 W (mesmo criterio da Amazonia Legal). Uso: node scripts/baixar-municipios.js
const fs = require('fs');
const path = require('path');

const UFS = [['AC', 12], ['AM', 13], ['AP', 16], ['MA', 21], ['MT', 51], ['PA', 15], ['RO', 11], ['RR', 14], ['TO', 17]];
const SAIDA = path.join(__dirname, '..', 'src', 'data', 'municipios-amazonia-legal.json');
const FORMATO = 'formato=application%2Fvnd.geo%2Bjson';

async function pegar(url) {
  const r = await fetch(url, { headers: { Accept: 'application/json' } });
  if (!r.ok) throw new Error('HTTP ' + r.status);
  return r.json();
}

function urlsMalha(cod) {
  const b = 'https://servicodados.ibge.gov.br/api';
  return [
    `${b}/v4/malhas/estados/${cod}?intrarregiao=municipio&qualidade=minima&${FORMATO}`,
    `${b}/v3/malhas/estados/${cod}?intrarregiao=municipio&qualidade=minima&${FORMATO}`,
    `${b}/v3/malhas/estados/${cod}?resolucao=5&qualidade=1&${FORMATO}`,
    `${b}/v4/malhas/estados/${cod}?intrarregiao=municipio&qualidade=1&${FORMATO}`,
  ];
}

function codigoDe(f) {
  const p = f.properties || {};
  const c = p.codarea ?? p.codigo ?? p.CD_MUN ?? p.cd_mun ?? p.id;
  return c == null ? null : String(c);
}

function malhaValida(m) {
  if (!m || m.type !== 'FeatureCollection' || !Array.isArray(m.features) || !m.features.length) return false;
  return m.features.every((f) => /^\d{7}$/.test(codigoDe(f) || '') && f.geometry && /Polygon/.test(f.geometry.type));
}

async function baixarMalha(cod) {
  const erros = [];
  for (const url of urlsMalha(cod)) {
    try {
      const m = await pegar(url);
      if (malhaValida(m)) return { malha: m, url };
      erros.push('formato inesperado em ' + url);
    } catch (e) { erros.push(e.message + ' em ' + url); }
  }
  throw new Error('Nenhuma variacao da API de malhas funcionou para o estado ' + cod + ':\n  ' + erros.join('\n  '));
}

const arred = (c) => (typeof c[0] === 'number' ? [Math.round(c[0] * 1e4) / 1e4, Math.round(c[1] * 1e4) / 1e4] : c.map(arred));

function bboxDe(tipo, coords) {
  const polys = tipo === 'Polygon' ? [coords] : coords;
  let minX = 180, minY = 90, maxX = -180, maxY = -90;
  for (const p of polys) for (const [x, y] of p[0]) {
    if (x < minX) minX = x;
    if (x > maxX) maxX = x;
    if (y < minY) minY = y;
    if (y > maxY) maxY = y;
  }
  return [minX, minY, maxX, maxY];
}

(async () => {
  const saida = [];
  for (const [uf, cod] of UFS) {
    const { malha, url } = await baixarMalha(cod);
    const nomes = await pegar(`https://servicodados.ibge.gov.br/api/v1/localidades/estados/${cod}/municipios`);
    const mapaNomes = new Map(nomes.map((n) => [String(n.id), n.nome]));
    let n = 0;
    for (const f of malha.features) {
      const codigo = codigoDe(f);
      const coordenadas = arred(f.geometry.coordinates);
      const bbox = bboxDe(f.geometry.type, coordenadas);
      if (uf === 'MA' && !(bbox[0] < -44)) continue;
      saida.push({ codigo, nome: mapaNomes.get(codigo) || codigo, uf, bbox, tipo: f.geometry.type, coordenadas });
      n++;
    }
    console.log(uf + ': ' + n + ' municipios  (' + url.split('?')[0] + ')');
  }
  if (saida.length < 700 || saida.length > 820) {
    throw new Error('Total de municipios fora do esperado (' + saida.length + '). Nada foi gravado.');
  }
  fs.writeFileSync(SAIDA, JSON.stringify(saida));
  console.log('Total: ' + saida.length + ' municipios -> ' + SAIDA + ' (' + Math.round(fs.statSync(SAIDA).size / 1024) + ' KB)');
})().catch((e) => { console.error('FALHOU:', e.message); process.exit(1); });