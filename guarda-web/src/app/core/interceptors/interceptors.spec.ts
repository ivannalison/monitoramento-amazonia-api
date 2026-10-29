import { HttpClient, provideHttpClient, withInterceptors } from '@angular/common/http';
import { HttpTestingController, provideHttpClientTesting } from '@angular/common/http/testing';
import { TestBed } from '@angular/core/testing';
import { NotificacaoService } from '../services/notificacao.service';
import { cacheInterceptor, limparCache } from './cache.interceptor';
import { erroInterceptor } from './erro.interceptor';

describe('erroInterceptor', () => {
  let http: HttpClient;
  let mock: HttpTestingController;
  let avisos: NotificacaoService;

  beforeEach(() => {
    TestBed.configureTestingModule({ providers: [provideHttpClient(withInterceptors([erroInterceptor])), provideHttpClientTesting()] });
    http = TestBed.inject(HttpClient);
    mock = TestBed.inject(HttpTestingController);
    avisos = TestBed.inject(NotificacaoService);
  });

  it('usa a mensagem da API em um erro 400', () => {
    let falhou = false;
    http.get('/api/x').subscribe({ error: () => (falhou = true) });
    mock.expectOne('/api/x').flush({ erro: 'Parâmetro inválido' }, { status: 400, statusText: 'Bad Request' });
    expect(falhou).toBeTrue();
    expect(avisos.avisos()[0].texto).toBe('Parâmetro inválido');
  });

  it('explica quando a API esta fora do ar (status 0)', () => {
    http.get('/api/y').subscribe({ error: () => undefined });
    mock.expectOne('/api/y').error(new ProgressEvent('error'));
    expect(avisos.avisos()[0].texto).toContain('Não foi possível falar com a API');
  });
});

describe('cacheInterceptor', () => {
  let http: HttpClient;
  let mock: HttpTestingController;

  beforeEach(() => {
    limparCache();
    TestBed.configureTestingModule({ providers: [provideHttpClient(withInterceptors([cacheInterceptor])), provideHttpClientTesting()] });
    http = TestBed.inject(HttpClient);
    mock = TestBed.inject(HttpTestingController);
  });

  it('repete a mesma consulta sem chamar a rede de novo', () => {
    http.get('/api/estados').subscribe();
    mock.expectOne('/api/estados').flush({ estados: [] });
    http.get('/api/estados').subscribe();
    mock.expectNone('/api/estados');
  });

  it('nunca guarda /api/fontes', () => {
    http.get('/api/fontes').subscribe();
    mock.expectOne('/api/fontes').flush({});
    http.get('/api/fontes').subscribe();
    mock.expectOne('/api/fontes').flush({});
  });
});