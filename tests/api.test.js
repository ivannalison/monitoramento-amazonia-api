process.env.AGENDAR = 'false';
try { require('dotenv').config(); } catch (e) {}
const request = require('supertest');
const mongoose = require('mongoose');
const modulo = require('../src/app');
const app = modulo.app || modulo.default || modulo;

jest.setTimeout(30000);

beforeAll(async () => {
  await mongoose.connect(process.env.MONGODB_URI, { serverSelectionTimeoutMS: 15000 });
});

afterAll(async () => {
  await mongoose.disconnect();
});

describe('API Monitoramento da Amazônia', () => {
  test('GET /api/status responde 200', async () => {
    const r = await request(app).get('/api/status');
    expect(r.status).toBe(200);
  });

  test('GET /api/estados traz as 9 siglas', async () => {
    const r = await request(app).get('/api/estados');
    expect(r.status).toBe(200);
    const texto = JSON.stringify(r.body);
    for (const sigla of ['AC', 'AM', 'AP', 'MA', 'MT', 'PA', 'RO', 'RR', 'TO']) {
      expect(texto).toContain(sigla);
    }
  });

  test('GET /api/fontes lista as 6 fontes', async () => {
    const r = await request(app).get('/api/fontes');
    expect(r.status).toBe(200);
    expect(Array.isArray(r.body.fontes)).toBe(true);
    expect(r.body.fontes.length).toBe(6);
  });

  test('GET /api/queimadas respeita o limite', async () => {
    const r = await request(app).get('/api/queimadas?limite=2');
    expect(r.status).toBe(200);
    expect(Array.isArray(r.body.focos)).toBe(true);
    expect(r.body.focos.length).toBeLessThanOrEqual(2);
    expect(r.body.limite).toBe(2);
  });

  test('GET /api/queimadas?limite=500 nunca passa de 200 itens', async () => {
    const r = await request(app).get('/api/queimadas?limite=500');
    if (r.status === 200) {
      expect(r.body.focos.length).toBeLessThanOrEqual(200);
    } else {
      expect(r.status).toBe(400);
    }
  });

  test('PA, Para e pará dão o mesmo resultado', async () => {
    const a = await request(app).get('/api/queimadas?estado=PA&limite=1');
    const b = await request(app).get('/api/queimadas?estado=Para&limite=1');
    const c = await request(app).get('/api/queimadas?estado=' + encodeURIComponent('pará') + '&limite=1');
    expect(a.status).toBe(200);
    expect(b.body.total).toBe(a.body.total);
    expect(c.body.total).toBe(a.body.total);
  });

  test('GET /api/cheias/geojson?nivel=alto só traz nível alto', async () => {
    const r = await request(app).get('/api/cheias/geojson?nivel=alto');
    expect(r.status).toBe(200);
    expect(r.body.type).toBe('FeatureCollection');
    for (const f of r.body.features) {
      expect(f.properties.nivel).toBe('alto');
    }
  });

  test('GET /api/alertas devolve a chave alertas', async () => {
    const r = await request(app).get('/api/alertas');
    expect(r.status).toBe(200);
    expect(Array.isArray(r.body.alertas)).toBe(true);
  });

  test('GET /api/camadas/resumo com estado inválido devolve 400', async () => {
    const r = await request(app).get('/api/camadas/resumo?estado=XX');
    expect(r.status).toBe(400);
    expect(r.body.erro).toBeDefined();
  });

  test('rota inexistente devolve 404', async () => {
    const r = await request(app).get('/api/nao-existe');
    expect(r.status).toBe(404);
  });
});