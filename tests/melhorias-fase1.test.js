// tests/melhorias-fase1.test.js
process.env.AGENDAR = 'false';
require('dotenv').config();
const request = require('supertest');
const mongoose = require('mongoose');
const app = require('../src/app');
const { municipioDoPonto, disponivel } = require('../src/utils/municipios');
const { estadoDoPonto } = require('../src/utils/geo');
const { lerBbox } = require('../src/utils/bbox');

jest.setTimeout(30000);

const semAcento = (s) => String(s).normalize('NFD').replace(/[\u0300-\u036f]/g, '');
const testeBanco = process.env.MONGODB_URI ? test : test.skip;

beforeAll(async () => {
  if (process.env.MONGODB_URI && mongoose.connection.readyState === 0) {
    await mongoose.connect(process.env.MONGODB_URI, { serverSelectionTimeoutMS: 15000 });
  }
});
afterAll(async () => { await mongoose.disconnect(); });

describe('Fase 1: gzip, cache e CORS', () => {
  test('resposta grande sai comprimida em gzip', async () => {
    const res = await request(app).get('/api/docs/swagger-ui-init.js').set('Accept-Encoding', 'gzip');
    expect(res.status).toBe(200);
    expect(res.headers['content-encoding']).toBe('gzip');
  });

  test('rotas GET trazem Cache-Control de 60 s', async () => {
    const res = await request(app).get('/api/amazonia');
    expect(res.status).toBe(200);
    expect(res.headers['cache-control']).toContain('max-age=60');
  });

  test('/api/status nao fica em cache', async () => {
    const res = await request(app).get('/api/status');
    expect(res.headers['cache-control'] || '').not.toContain('max-age=60');
  });

  test('CORS libera so leitura (sem DELETE/POST/PUT)', async () => {
    const res = await request(app).options('/api/alertas/123')
      .set('Origin', 'http://localhost:4200').set('Access-Control-Request-Method', 'DELETE');
    const metodos = res.headers['access-control-allow-methods'] || '';
    expect(metodos).toContain('GET');
    expect(metodos).not.toMatch(/DELETE|POST|PUT/);
  });
});

describe('Fase 1: municipios e Amazonia Legal', () => {
  test('malha municipal carregada', () => {
    expect(disponivel()).toBe(true);
  });

  test('ponto em Labrea e Apui acha o municipio certo', () => {
    const a = municipioDoPonto(-64.79, -7.26);
    const b = municipioDoPonto(-59.89, -7.19);
    expect(a && semAcento(a.nome)).toBe('Labrea');
    expect(a.uf).toBe('AM');
    expect(b && semAcento(b.nome)).toBe('Apui');
  });

  test('Maranhao: oeste entra, leste fica de fora', () => {
    expect(estadoDoPonto(-47.49, -5.52)).toBe('MA'); // Imperatriz
    expect(estadoDoPonto(-42.83, -5.09)).toBeNull();  // Timon
    expect(estadoDoPonto(-64.79, -7.26)).toBe('AM');
  });
});

describe('Fase 1: bbox, municipio e limite nas queimadas', () => {
  test('lerBbox valida o formato', () => {
    expect(lerBbox({}).bbox).toBeNull();
    expect(lerBbox({ bbox: '-70,-10,-60,0' }).bbox).toEqual([-70, -10, -60, 0]);
    expect(lerBbox({ bbox: 'a,b,c,d' }).erro).toBeDefined();
    expect(lerBbox({ bbox: '-60,-10,-70,0' }).erro).toBeDefined();
    expect(lerBbox({ bbox: '1,,3,4' }).erro).toBeDefined();
  });

  test('bbox invalido devolve 400', async () => {
    const res = await request(app).get('/api/queimadas/geojson?bbox=abc');
    expect(res.status).toBe(400);
    expect(res.body.erro).toBeDefined();
  });

  testeBanco('bbox valido so traz pontos dentro da area', async () => {
    const res = await request(app).get('/api/queimadas/geojson?bbox=-70,-10,-60,0&horas=168');
    expect(res.status).toBe(200);
    expect(typeof res.body.truncado).toBe('boolean');
    for (const f of res.body.features) {
      const [lon, lat] = f.geometry.coordinates;
      expect(lon).toBeGreaterThanOrEqual(-70);
      expect(lon).toBeLessThanOrEqual(-60);
      expect(lat).toBeGreaterThanOrEqual(-10);
      expect(lat).toBeLessThanOrEqual(0);
    }
  });

  testeBanco('limite pequeno corta a resposta', async () => {
    const res = await request(app).get('/api/queimadas/geojson?limite=3&horas=168');
    expect(res.status).toBe(200);
    expect(res.body.features.length).toBeLessThanOrEqual(3);
    expect(res.body.limite).toBe(3);
  });

  testeBanco('filtro por municipio traz so o municipio pedido', async () => {
    const base = await request(app).get('/api/queimadas?limite=200');
    expect(base.status).toBe(200);
    const com = base.body.focos.find((f) => f.municipio);
    if (!com) return; // sem focos com municipio no banco agora
    const r = await request(app).get('/api/queimadas?limite=50&municipio=' + encodeURIComponent(com.municipio));
    expect(r.status).toBe(200);
    expect(r.body.focos.length).toBeGreaterThan(0);
    for (const f of r.body.focos) expect(f.municipio).toBe(com.municipio);
  });

  testeBanco('Maranhao: todo foco guardado tem municipio da Amazonia Legal', async () => {
    const r = await request(app).get('/api/queimadas?estado=MA&limite=200');
    expect(r.status).toBe(200);
    for (const f of r.body.focos) expect(f.municipio).toBeTruthy();
  });

  testeBanco('/api/fontes continua com as 6 fontes', async () => {
    const r = await request(app).get('/api/fontes');
    expect(r.status).toBe(200);
    expect(r.body.fontes.length).toBe(6);
  });
});