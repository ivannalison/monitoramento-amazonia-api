import { provideHttpClient } from '@angular/common/http';
import { provideHttpClientTesting } from '@angular/common/http/testing';
import { TestBed } from '@angular/core/testing';
import { FiltrosService } from '../../../core/services/filtros.service';
import { CaixaOpcoesComponent } from './caixa-opcoes.component';
import { LegendaComponent } from './legenda.component';

describe('CaixaOpcoesComponent', () => {
  beforeEach(() => {
    TestBed.configureTestingModule({ providers: [provideHttpClient(), provideHttpClientTesting()] });
  });

  it('mostra a busca e as 7 opcoes, todas desmarcadas', () => {
    const fixture = TestBed.createComponent(CaixaOpcoesComponent);
    fixture.detectChanges();
    const el = fixture.nativeElement as HTMLElement;
    expect(el.querySelector('input[type="search"]')).not.toBeNull();
    const caixas = el.querySelectorAll<HTMLInputElement>('input[type="checkbox"]');
    expect(caixas.length).toBe(7);
    expect(Array.from(caixas).some((c) => c.checked)).toBeFalse();
    const texto = el.textContent ?? '';
    for (const rotulo of ['Chuvas', 'Qualidade do Ar - Estações Virtuais', 'Queimadas (MODIS 24h)', 'Queimadas (NOAA-20 24h)', 'Queimadas (Suomi 24h)', 'Risco de Cheia', 'Desmatamento (DETER 90 dias)']) {
      expect(texto).toContain(rotulo);
    }
  });

  it('marcar e desmarcar uma caixinha liga e desliga a camada', () => {
    const fixture = TestBed.createComponent(CaixaOpcoesComponent);
    fixture.detectChanges();
    const filtros = TestBed.inject(FiltrosService);
    const caixas = (fixture.nativeElement as HTMLElement).querySelectorAll<HTMLInputElement>('input[type="checkbox"]');
    caixas[3].click();
    expect(filtros.ativa('noaa20')).toBeTrue();
    caixas[3].click();
    expect(filtros.ativa('noaa20')).toBeFalse();
  });

  it('todas as opcoes podem ficar marcadas ao mesmo tempo, inclusive chuva com qualidade do ar', () => {
    const fixture = TestBed.createComponent(CaixaOpcoesComponent);
    fixture.detectChanges();
    const filtros = TestBed.inject(FiltrosService);
    const caixas = (fixture.nativeElement as HTMLElement).querySelectorAll<HTMLInputElement>('input[type="checkbox"]');
    caixas.forEach((c) => c.click());
    expect(filtros.camadasAtivas().length).toBe(7);
    expect(filtros.ativa('chuva') && filtros.ativa('ar') && filtros.ativa('cheias') && filtros.ativa('desmatamento')).toBeTrue();
  });
});

describe('LegendaComponent', () => {
  beforeEach(() => {
    TestBed.configureTestingModule({ providers: [provideHttpClient(), provideHttpClientTesting()] });
  });

  it('a legenda aparece conforme a opcao marcada e some quando desmarca', () => {
    const filtros = TestBed.inject(FiltrosService);
    const fixture = TestBed.createComponent(LegendaComponent);
    fixture.detectChanges();
    const el = fixture.nativeElement as HTMLElement;
    expect((el.textContent ?? '').trim()).toBe('');
    filtros.alternar('modis');
    fixture.detectChanges();
    expect(el.textContent).toContain('Queimadas');
    filtros.alternar('chuva');
    fixture.detectChanges();
    expect(el.textContent).toContain('Tempestade');
    filtros.alternar('ar');
    fixture.detectChanges();
    expect(el.textContent).toContain('Níveis de Poluição do Ar');
    expect(el.textContent).toContain('Tempestade');
    filtros.alternar('cheias');
    filtros.alternar('desmatamento');
    fixture.detectChanges();
    expect(el.textContent).toContain('Risco de Cheia');
    expect(el.textContent).toContain('Desmatamento');
    filtros.alternar('chuva');
    fixture.detectChanges();
    expect(el.textContent).not.toContain('Tempestade');
    expect(el.textContent).toContain('Níveis de Poluição do Ar');
  });
});