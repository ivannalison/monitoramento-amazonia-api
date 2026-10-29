import { ChangeDetectionStrategy, Component, inject } from '@angular/core';
import { OPCOES } from '../../../core/config/camadas.config';
import { FiltrosService } from '../../../core/services/filtros.service';
import { BuscaLugarComponent } from './busca-lugar.component';

// A caixa branca do canto superior esquerdo: busca e opcoes (como no SELVA)
@Component({
  selector: 'guarda-caixa-opcoes',
  imports: [BuscaLugarComponent],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <section class="caixa" aria-label="Camadas do mapa">
      <guarda-busca-lugar />
      <ul class="opcoes">
        @for (o of opcoes; track o.id) {
          <li>
            <label>
              <input type="checkbox" [checked]="filtros.ativa(o.id)" (change)="filtros.alternar(o.id)" />
              {{ o.rotulo }}
            </label>
          </li>
        }
      </ul>
    </section>
  `,
  styles: [`
    .caixa { background: #fff; border: 2px solid rgba(0, 0, 0, 0.28); border-radius: 6px; padding: 10px 12px; width: min(350px, calc(100vw - 24px)); box-shadow: 0 1px 5px rgba(0, 0, 0, 0.25); }
    .opcoes { list-style: none; margin: 8px 0 0; padding: 0; display: flex; flex-direction: column; gap: 5px; }
    label { display: flex; align-items: center; gap: 8px; cursor: pointer; color: #333; font-size: 16px; }
    input[type='checkbox'] { width: 18px; height: 18px; margin: 0; cursor: pointer; flex: none; }
  `],
})
export class CaixaOpcoesComponent {
  protected readonly filtros = inject(FiltrosService);
  protected readonly opcoes = OPCOES;
}