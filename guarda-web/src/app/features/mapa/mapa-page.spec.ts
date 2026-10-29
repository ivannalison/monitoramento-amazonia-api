import { provideHttpClient } from '@angular/common/http';
import { provideHttpClientTesting } from '@angular/common/http/testing';
import { NO_ERRORS_SCHEMA } from '@angular/core';
import { TestBed } from '@angular/core/testing';
import { FiltrosService } from '../../core/services/filtros.service';
import { MapaCanvasComponent } from './components/mapa-canvas.component';
import { MapaPage } from './mapa.page';

function simularTela(pequena: boolean): void {
  spyOn(window, 'matchMedia').and.returnValue({
    matches: pequena,
    addEventListener: () => undefined,
    removeEventListener: () => undefined,
  } as unknown as MediaQueryList);
}

async function criar() {
  await TestBed.configureTestingModule({ imports: [MapaPage], providers: [provideHttpClient(), provideHttpClientTesting()] })
    .overrideComponent(MapaPage, { remove: { imports: [MapaCanvasComponent] }, add: { schemas: [NO_ERRORS_SCHEMA] } })
    .compileComponents();
  const fixture = TestBed.createComponent(MapaPage);
  fixture.detectChanges();
  return fixture;
}

describe('MapaPage - responsividade', () => {
  it('em tela grande a caixa de opcoes fica sempre aberta e nao ha botao Opcoes', async () => {
    simularTela(false);
    const fixture = await criar();
    const el = fixture.nativeElement as HTMLElement;
    expect(el.querySelector('button.alternar')).toBeNull();
    expect(el.querySelector('guarda-caixa-opcoes')?.classList.contains('oculta')).toBeFalse();
  });

  it('em tela pequena a caixa comeca fechada e o botao Opcoes abre e fecha', async () => {
    simularTela(true);
    const fixture = await criar();
    const el = fixture.nativeElement as HTMLElement;
    const caixa = el.querySelector('guarda-caixa-opcoes') as HTMLElement;
    const botao = el.querySelector('button.alternar') as HTMLButtonElement;
    expect(botao).not.toBeNull();
    expect(caixa.classList.contains('oculta')).toBeTrue();
    expect(botao.textContent).toContain('Opções');
    botao.click();
    fixture.detectChanges();
    expect(caixa.classList.contains('oculta')).toBeFalse();
    expect(botao.textContent).toContain('Fechar');
    botao.click();
    fixture.detectChanges();
    expect(caixa.classList.contains('oculta')).toBeTrue();
  });

  it('em tela pequena, escolher uma cidade fecha a caixa para mostrar o mapa', async () => {
    simularTela(true);
    const fixture = await criar();
    const el = fixture.nativeElement as HTMLElement;
    const caixa = el.querySelector('guarda-caixa-opcoes') as HTMLElement;
    (el.querySelector('button.alternar') as HTMLButtonElement).click();
    fixture.detectChanges();
    expect(caixa.classList.contains('oculta')).toBeFalse();
    TestBed.inject(FiltrosService).escolherLugar({ tipo: 'estado', nome: 'Pará', uf: 'PA', bbox: null });
    fixture.detectChanges();
    fixture.detectChanges();
    expect(caixa.classList.contains('oculta')).toBeTrue();
  });
});