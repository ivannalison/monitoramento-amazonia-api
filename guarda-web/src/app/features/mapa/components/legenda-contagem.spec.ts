import { provideHttpClient } from '@angular/common/http';
import { provideHttpClientTesting } from '@angular/common/http/testing';
import { TestBed } from '@angular/core/testing';
import { FiltrosService } from '../../../core/services/filtros.service';
import { LegendaComponent } from './legenda.component';

describe('contagem de pontos na legenda', () => {
  beforeEach(() => {
    TestBed.configureTestingModule({ providers: [provideHttpClient(), provideHttpClientTesting()] });
  });

  it('a contagem comeca vazia e guarda o total por camada', () => {
    const f = TestBed.inject(FiltrosService);
    expect(f.contagens()).toEqual({});
    f.contagens.set({ modis: 705 });
    expect(f.contagens()['modis']).toBe(705);
  });

  it('a legenda mostra quantos focos ha na area visivel de cada satelite', () => {
    const f = TestBed.inject(FiltrosService);
    f.alternar('modis');
    f.alternar('noaa20');
    f.contagens.set({ modis: 705, noaa20: 1 });
    const fixture = TestBed.createComponent(LegendaComponent);
    fixture.detectChanges();
    const texto = (fixture.nativeElement as HTMLElement).textContent ?? '';
    expect(texto).toContain('MODIS');
    expect(texto).toContain('705 focos');
    expect(texto).toContain('1 foco');
    expect(texto).not.toContain('1 focos');
  });
});