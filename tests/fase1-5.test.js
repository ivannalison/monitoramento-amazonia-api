// tests/fase1-5.test.js
process.env.AGENDAR = 'false';
require('dotenv').config();
const request = require('supertest');
const mongoose = require('mongoose');
const app = require('../src/app');

jest.setTimeout(30000);

const semAcento = (s) => String(s).normalize('NFD').replace(/[\u0300-\u036f]/g, '').toLowerCase();
const testeBanco = process.env.MONGODB_URI ? test : test.skip;
const LABREA = 'L\u00e1brea';
const GRANDE = '-75,-18,-40,6';
const PEQUENO = '-65,-9,-63,-7';

beforeAll(async () => {
  if (process.env.MONGODB_URI && mongoose.connection.readyState === 0) {
    await mongoose.connect(process.env.MONGODB_URI, { serverSelectionTimeoutMS: 15000 });
  }
});
afterAll(async () => { await mongoose.disconnect(); });

async function labrea() {
  const r = await request(app).get('/api/municipios?busca=labrea');
  return r.body.municipios.find((m) => semAcento(m.nome) === 'labrea');
}

describe('Fase 1.5: municipios', () => {
  test('lista traz os municipios da Amazonia Legal com os campos do front', async () => {
    const r = await request(app).get('/api/municipios');
    expect(r.status).toBe(200);
    expect(r.body.total).toBeGreaterThanOrEqual(700);
    expect(r.body.municipios.length).toBe(r.body.total);
    const m = r.body.municipios[0];
    expect(m.codigo).toMatch(/^\d{7}$/);
    expect(typeof m.nome).toBe('string');
    expect(m.centro.length).toBe(2);
    expect(m.bbox.length).toBe(4);
  });

  test('filtro por estado e limite', async () => {
    const am = await request(app).get('/api/municipios?estado=AM');
    expect(am.status).toBe(200);
    expect(am.body.total).toBe(62);
    expect(am.body.municipios.every((m) => m.uf === 'AM')).toBe(true);
    const tres = await request(app).get('/api/municipios?limite=3');
    expect(tres.body.municipios.length).toBe(3);
    expect(tres.body.total).toBeGreaterThanOrEqual(700);
  });

  test('estado invalido devolve 400', async () => {
    const r = await request(app).get('/api/municipios?estado=XX');
    expect(r.status).toBe(400);
  });

  test('busca ignora acento e maiuscula', async () => {
    const a = await request(app).get('/api/municipios?busca=labrea');
    const b = await request(app).get('/api/municipios?busca=' + encodeURIComponent('L\u00c1BREA'));
    expect(a.body.municipios.some((m) => semAcento(m.nome) === 'labrea')).toBe(true);
    expect(b.body.total).toBe(a.body.total);
  });

  test('um municipio pelo codigo, com erros 400 e 404', async () => {
    const l = await labrea();
    expect(l).toBeDefined();
    const r = await request(app).get('/api/municipios/' + l.codigo);
    expect(r.status).toBe(200);
    expect(r.body.nome).toBe(l.nome);
    expect(r.body.centro[0]).toBeGreaterThanOrEqual(r.body.bbox[0]);
    expect(r.body.centro[0]).toBeLessThanOrEqual(r.body.bbox[2]);
    expect((await request(app).get('/api/municipios/abc')).status).toBe(400);
    expect((await request(app).get('/api/municipios/9999999')).status).toBe(404);
  });

  test('dados fixos ficam em cache de 1 hora no navegador', async () => {
    const r = await request(app).get('/api/municipios?limite=1');
    expect(r.headers['cache-control']).toContain('max-age=3600');
  });
});

describe('Fase 1.5: contornos', () => {
  test('contorno de um municipio', async () => {
    const l = await labrea();
    const r = await request(app).get('/api/municipios/geojson?codigo=' + l.codigo);
    expect(r.status).toBe(200);
    expect(r.body.type).toBe('FeatureCollection');
    expect(r.body.features.length).toBe(1);
    expect(['Polygon', 'MultiPolygon']).toContain(r.body.features[0].geometry.type);
    expect(r.body.features[0].properties.codigo).toBe(l.codigo);
  });

  test('contornos de um estado e de uma area', async () => {
    const ac = await request(app).get('/api/municipios/geojson?estado=AC');
    expect(ac.body.features.length).toBe(22);
    const area = await request(app).get('/api/municipios/geojson?bbox=' + PEQUENO);
    expect(area.body.features.length).toBeGreaterThan(0);
  });

  test('parametros invalidos devolvem 400', async () => {
    expect((await request(app).get('/api/municipios/geojson?codigo=abc')).status).toBe(400);
    expect((await request(app).get('/api/municipios/geojson?bbox=abc')).status).toBe(400);
    expect((await request(app).get('/api/municipios/geojson?estado=XX')).status).toBe(400);
  });

  test('contornos dos estados', async () => {
    const r = await request(app).get('/api/contornos/estados');
    expect(r.status).toBe(200);
    expect(r.body.type).toBe('FeatureCollection');
    expect(r.body.features.length).toBeGreaterThan(0);
    expect(r.body.features.every((f) => f.properties && f.properties.sigla)).toBe(true);
  });
});

describe('Fase 1.5: filtro de municipio nas queimadas', () => {
  testeBanco('sem acento acha o mesmo que com acento', async () => {
    const a = await request(app).get('/api/queimadas?limite=1&municipio=labrea');
    const b = await request(app).get('/api/queimadas?limite=1&municipio=' + encodeURIComponent(LABREA));
    expect(a.status).toBe(200);
    expect(a.body.total).toBe(b.body.total);
  });

  testeBanco('filtro pelo codigo IBGE', async () => {
    const l = await labrea();
    const porCodigo = await request(app).get('/api/queimadas?limite=50&municipio_codigo=' + l.codigo);
    const porNome = await request(app).get('/api/queimadas?limite=1&municipio=labrea');
    expect(porCodigo.status).toBe(200);
    expect(porCodigo.body.total).toBe(porNome.body.total);
    for (const f of porCodigo.body.focos) expect(f.municipio_codigo).toBe(l.codigo);
  });

  testeBanco('codigo que nao existe devolve lista vazia', async () => {
    const r = await request(app).get('/api/queimadas?limite=5&municipio_codigo=123');
    expect(r.status).toBe(200);
    expect(r.body.total).toBe(0);
  });

  testeBanco('geojson aceita municipio sem acento', async () => {
    const r = await request(app).get('/api/queimadas/geojson?horas=168&municipio=labrea');
    expect(r.status).toBe(200);
    for (const f of r.body.features) expect(semAcento(f.properties.municipio)).toBe('labrea');
  });
});

describe('Fase 1.5: desmatamento por area visivel', () => {
  test('bbox invalido devolve 400 nas tres rotas', async () => {
    expect((await request(app).get('/api/desmatamento/geojson?bbox=abc')).status).toBe(400);
    expect((await request(app).get('/api/desmatamento?bbox=abc')).status).toBe(400);
    expect((await request(app).get('/api/desmatamento/estatisticas?bbox=abc')).status).toBe(400);
  });

  testeBanco('geojson traz pontos com area, classe e fonte', async () => {
    const r = await request(app).get('/api/desmatamento/geojson?limite=50');
    expect(r.status).toBe(200);
    expect(r.body.type).toBe('FeatureCollection');
    expect(typeof r.body.truncado).toBe('boolean');
    expect(r.body.features.length).toBeLessThanOrEqual(50);
    for (const f of r.body.features) {
      expect(f.geometry.coordinates.length).toBe(2);
      expect(typeof f.properties.area_ha).toBe('number');
    }
  });

  testeBanco('bbox pequeno traz so pontos dentro e nao mais que o bbox grande', async () => {
    const grande = await request(app).get('/api/desmatamento/geojson?bbox=' + GRANDE);
    const peq = await request(app).get('/api/desmatamento/geojson?bbox=' + PEQUENO);
    expect(peq.status).toBe(200);
    expect(peq.body.features.length).toBeLessThanOrEqual(grande.body.features.length);
    for (const f of peq.body.features) {
      const [lon, lat] = f.geometry.coordinates;
      expect(lon).toBeGreaterThanOrEqual(-65);
      expect(lon).toBeLessThanOrEqual(-63);
      expect(lat).toBeGreaterThanOrEqual(-9);
      expect(lat).toBeLessThanOrEqual(-7);
    }
  });

  testeBanco('lista paginada aceita bbox e uma area no oceano nao tem alertas', async () => {
    const r = await request(app).get('/api/desmatamento?limite=5&bbox=' + GRANDE);
    expect(r.status).toBe(200);
    expect(r.body.alertas.length).toBeLessThanOrEqual(5);
    const mar = await request(app).get('/api/desmatamento?limite=1&bbox=-30,-5,-29,-4');
    expect(mar.body.total).toBe(0);
  });
});