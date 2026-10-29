import { ChangeDetectionStrategy, Component, DestroyRef, computed, effect, inject, signal, untracked } from '@angular/core';
import { FiltrosService } from '../../core/services/filtros.service';
import { ModalComponent } from '../../shared/components/modal.component';
import { DataManausPipe } from '../../shared/pipes/data-manaus.pipe';
import { SobreConteudoComponent } from '../sobre/sobre-conteudo.component';
import { CaixaOpcoesComponent } from './components/caixa-opcoes.component';
import { LegendaComponent } from './components/legenda.component';
import { LinhaDoTempoComponent } from './components/linha-do-tempo.component';
import { MapaCanvasComponent } from './components/mapa-canvas.component';
import { MarcaComponent } from './components/marca.component';

// Telas pequenas (celular, janela estreita ou baixa): a caixa de opcoes vira um botao que abre e fecha.
// Esta consulta precisa ser igual a do CSS abaixo.
const TELA_PEQUENA = '(max-width: 720px), (max-height: 560px)';

@Component({
  selector: 'guarda-mapa-page',
  imports: [MapaCanvasComponent, CaixaOpcoesComponent, MarcaComponent, LegendaComponent, LinhaDoTempoComponent, ModalComponent, SobreConteudoComponent],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <div class="pagina">
      <guarda-mapa-canvas [horaChuva]="horaChuva()" />
      @if (compacto()) {
        <button type="button" class="botao alternar nao-imprimir" (click)="opcoesAbertas.set(!opcoesAbertas())" [attr.aria-expanded]="opcoesAbertas()">
          {{ opcoesAbertas() ? 'Fechar' : 'Opções' }}
        </button>
      }
      <guarda-caixa-opcoes class="caixa nao-imprimir" [class.oculta]="compacto() && !opcoesAbertas()" />
      <guarda-marca class="marca nao-imprimir" (abrirSobre)="sobreAberto.set(true)" />
      <div class="inferior nao-imprimir">
        @if (filtros.ativa('chuva')) {
          <guarda-linha-do-tempo [min]="-24" [max]="24" [texto]="rotuloChuva()" [(valor)]="deslocamentoChuva" />
        }
        <guarda-legenda />
      </div>
      <guarda-modal titulo="Sobre o GUARDA" [aberto]="sobreAberto()" (fechar)="sobreAberto.set(false)">
        <guarda-sobre-conteudo />
      </guarda-modal>
    </div>
  `,
  styles: [`
    :host { display: block; height: 100%; }
    .pagina { position: relative; height: 100%; overflow: hidden; }
    .caixa { position: absolute; top: 12px; left: 12px; z-index: 6; }
    .marca { position: absolute; top: 12px; right: 12px; z-index: 6; }
    /* as legendas ficam embaixo, a esquerda; se forem muitas, rolam em vez de cobrir a caixa de opcoes */
    .inferior { position: absolute; left: 12px; bottom: 24px; z-index: 4; width: min(470px, calc(100% - 24px)); display: flex; flex-direction: column; gap: 8px; max-height: calc(100% - 320px); min-height: 0; overflow: auto; }
    .oculta { display: none; }
    .alternar { display: none; }
    /* telas pequenas: botao Opcoes, marca menor no canto, legendas embaixo sem cobrir o zoom */
    @media (max-width: 720px), (max-height: 560px) {
      .alternar { display: inline-block; position: absolute; top: 10px; left: 10px; z-index: 8; }
      .caixa { top: 54px; left: 10px; max-width: calc(100% - 20px); max-height: calc(100% - 64px); overflow: auto; z-index: 7; }
      .marca { top: 8px; right: 8px; }
      .inferior { left: 8px; right: 60px; bottom: 8px; width: auto; max-height: 42%; }
    }
  `],
})
export class MapaPage {
  protected readonly filtros = inject(FiltrosService);
  protected readonly sobreAberto = signal(false);
  protected readonly deslocamentoChuva = signal(0);
  private readonly pipeData = new DataManausPipe();
  private readonly consulta = typeof window !== 'undefined' && typeof window.matchMedia === 'function' ? window.matchMedia(TELA_PEQUENA) : null;
  protected readonly compacto = signal(this.consulta?.matches ?? false);
  protected readonly opcoesAbertas = signal(!(this.consulta?.matches ?? false));

  constructor() {
    const ouvir = (e: MediaQueryListEvent): void => {
      this.compacto.set(e.matches);
      this.opcoesAbertas.set(!e.matches);
    };
    this.consulta?.addEventListener('change', ouvir);
    inject(DestroyRef).onDestroy(() => this.consulta?.removeEventListener('change', ouvir));
    // em tela pequena, ao escolher uma cidade ou estado a caixa se fecha para mostrar o mapa
    effect(() => {
      const lugar = this.filtros.lugar();
      if (lugar && untracked(() => this.compacto())) this.opcoesAbertas.set(false);
    });
  }

  // hora cheia (UTC) da previsao mostrada; null = hora atual (a API assume sozinha)
  protected readonly horaChuva = computed(() => {
    const v = this.deslocamentoChuva();
    if (v === 0) return null;
    return new Date(this.baseHora().getTime() + v * 3600000).toISOString().slice(0, 16);
  });

  protected readonly rotuloChuva = computed(() => {
    const v = this.deslocamentoChuva();
    const quando = this.pipeData.transform(new Date(this.baseHora().getTime() + v * 3600000), 'longo');
    return (v < 0 ? 'Passado: ' : v > 0 ? 'Previsão: ' : 'Agora: ') + quando;
  });

  private baseHora(): Date {
    const base = new Date();
    base.setUTCMinutes(0, 0, 0);
    return base;
  }
}