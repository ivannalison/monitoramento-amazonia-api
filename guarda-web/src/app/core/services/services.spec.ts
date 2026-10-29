import { provideHttpClient } from '@angular/common/http';
import { HttpTestingController, provideHttpClientTesting } from '@angular/common/http/testing';
import { TestBed } from '@angular/core/testing';
import { environment } from '../../../environments/environment';
import { RespostaFontes } from '../models/api.models';
import { caixaDeCoordenadas } from '../util/bbox.util';
import { estaDefasada } from '../util/defasagem.util';
import { semAcento } from '../util/texto.util';
import { ApiService } from './api.service';
import { AtualizacaoService } from './atualizacao.service';
import { DadosMapaService } from './dados-mapa.service';
import { FiltrosService } from './filtros.service';
import { MunicipiosService } from './municipios.service';

function configurar(): HttpTestingController {
  TestBed.configureTestingModule({ providers: [provideHttpClient(), provideHttpClientTesting()] });
  return TestBed.inject(HttpTestingController);
}

describe('ApiService', () => {
  it('monta a URL e ignora parametros vazios', () => {
    const mock = configurar();
    TestBed.inject(ApiService).get('/api/x', { a: 1, b: '', c: null, d: 'z', e: undefined }).subscribe();
    const req = mock.expectOne((r) => r.url === environment.apiUrl + '/api/x');
    expect(req.request.params.keys().sort()).toEqual(['a', 'd']);
    req.flush({});
  });
});

describe('DadosMapaService', () => {
  it('pede as queimadas de um satelite na area visivel', () => {
    const mock = configurar();
    TestBed.inject(DadosMapaService).queimadas({ bbox: '-65,-9,-63,-7', satelite: 'noaa20', horas: 24, limite: 100 }).subscribe();
    const req = mock.expectOne((r) => r.url.endsWith('/api/queimadas/geojson'));
    expect(req.request.params.get('bbox')).toBe('-65,-9,-63,-7');
    expect(req.request.params.get('satelite')).toBe('noaa20');
    expect(req.request.params.get('horas')).toBe('24');
    expect(req.request.params.get('limite')).toBe('100');
    req.flush({ type: 'FeatureCollection', features: [] });
  });

  it('pede a chuva de uma hora e o ar sem filtros', () => {
    const mock = configurar();
    const servico = TestBed.inject(DadosMapaService);
    servico.chuva('2026-10-28T15:00').subscribe();
    const chuva = mock.expectOne((r) => r.url.endsWith('/api/chuvas/geojson'));
    expect(chuva.request.params.get('hora')).toBe('2026-10-28T15:00');
    chuva.flush({ type: 'FeatureCollection', features: [] });
    servico.ar().subscribe();
    const ar = mock.expectOne((r) => r.url.endsWith('/api/qualidade-ar/geojson'));
    expect(ar.request.params.keys().length).toBe(0);
    ar.flush({ type: 'FeatureCollection', features: [] });
  });

  it('pede o desmatamento da area visivel e as cheias', () => {
    const mock = configurar();
    const servico = TestBed.inject(DadosMapaService);
    servico.desmatamento({ bbox: '-70,-10,-60,0', limite: 500 }).subscribe();
    const d = mock.expectOne((r) => r.url.endsWith('/api/desmatamento/geojson'));
    expect(d.request.params.get('bbox')).toBe('-70,-10,-60,0');
    expect(d.request.params.get('limite')).toBe('500');
    d.flush({ type: 'FeatureCollection', features: [] });
    servico.cheias().subscribe();
    const c = mock.expectOne((r) => r.url.endsWith('/api/cheias/geojson'));
    expect(c.request.params.keys().length).toBe(0);
    c.flush({ type: 'FeatureCollection', features: [] });
  });
});

describe('MunicipiosService', () => {
  it('busca por nome e devolve a lista', () => {
    const mock = configurar();
    let lista: unknown[] = [];
    TestBed.inject(MunicipiosService).buscar(' labrea ', null, 5).subscribe((l) => (lista = l));
    const req = mock.expectOne((r) => r.url.endsWith('/api/municipios'));
    expect(req.request.params.get('busca')).toBe('labrea');
    expect(req.request.params.get('limite')).toBe('5');
    expect(req.request.params.has('estado')).toBeFalse();
    req.flush({ fonte: 'IBGE', total: 1, municipios: [{ codigo: '1302603', nome: 'Lábrea', uf: 'AM', centro: [-64.8, -7.2], bbox: [-66, -8, -63, -6] }] });
    expect(lista.length).toBe(1);
  });
});

describe('AtualizacaoService', () => {
  const resposta = (ok: string): RespostaFontes => ({
    total_focos: 1,
    fontes: [{ id: 'firms', nome: 'NASA FIRMS', ultima_coleta: ok, ultima_coleta_ok: ok, situacao: 'ok' }],
  });

  it('so avisa quando uma coleta nova aparece', () => {
    configurar();
    const servico = TestBed.inject(AtualizacaoService);
    const avisos: string[][] = [];
    servico.mudancas$.subscribe((ids) => avisos.push(ids));
    servico.aplicar(resposta('2026-10-28T10:00:00.000Z'));
    servico.aplicar(resposta('2026-10-28T10:00:00.000Z'));
    expect(avisos.length).toBe(0);
    servico.aplicar(resposta('2026-10-28T10:30:00.000Z'));
    expect(avisos).toEqual([['firms']]);
  });

  it('marca fonte em erro ou antiga como defasada', () => {
    const agora = new Date('2026-10-28T12:00:00.000Z').getTime();
    const base = { id: 'firms', nome: 'x', ultima_coleta: null, situacao: 'ok' };
    expect(estaDefasada({ ...base, ultima_coleta_ok: '2026-10-28T11:30:00.000Z' }, agora)).toBeFalse();
    expect(estaDefasada({ ...base, ultima_coleta_ok: '2026-10-28T06:00:00.000Z' }, agora)).toBeTrue();
    expect(estaDefasada({ ...base, ultima_coleta_ok: null }, agora)).toBeTrue();
  });
});

describe('FiltrosService', () => {
  it('abre sem nenhuma camada marcada', () => {
    expect(TestBed.inject(FiltrosService).camadasAtivas()).toEqual([]);
  });

  it('cada caixinha liga e desliga a sua camada e todas podem ficar juntas', () => {
    const f = TestBed.inject(FiltrosService);
    for (const id of ['chuva', 'ar', 'cheias', 'desmatamento', 'modis'] as const) f.alternar(id);
    expect(f.camadasAtivas().length).toBe(5);
    expect(f.ativa('chuva') && f.ativa('ar')).toBeTrue();
    f.alternar('chuva');
    expect(f.ativa('chuva')).toBeFalse();
    expect(f.ativa('ar')).toBeTrue();
    expect(f.ativa('desmatamento')).toBeTrue();
  });

  it('guarda o lugar buscado', () => {
    const f = TestBed.inject(FiltrosService);
    f.escolherLugar({ tipo: 'estado', nome: 'Pará', uf: 'PA', bbox: null });
    expect(f.lugar()?.uf).toBe('PA');
    f.escolherLugar(null);
    expect(f.lugar()).toBeNull();
  });
});

describe('utilitarios', () => {
  it('caixaDeCoordenadas acha a caixa de um poligono', () => {
    expect(caixaDeCoordenadas([[[-65, -9], [-63, -9], [-63, -7], [-65, -7], [-65, -9]]])).toEqual([-65, -9, -63, -7]);
    expect(caixaDeCoordenadas([])).toBeNull();
  });
  it('semAcento ignora acento e maiuscula', () => {
    expect(semAcento('  LÁBREA ')).toBe('labrea');
    expect(semAcento('Pará')).toBe('para');
  });
});