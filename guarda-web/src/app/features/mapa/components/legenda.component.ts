import { ChangeDetectionStrategy, Component, computed, inject } from '@angular/core';
import { NOME_SATELITE, COR_SATELITE, SATELITES_IDS } from '../../../core/config/camadas.config';
import { AtualizacaoService } from '../../../core/services/atualizacao.service';
import { FiltrosService } from '../../../core/services/filtros.service';
import { estaDefasada } from '../../../core/util/defasagem.util';
import { AtualizadoHaPipe } from '../../../shared/pipes/atualizado-ha.pipe';
import { FAIXAS_AR } from '../ar.util';
import { CLASSES_CHUVA, GRADIENTE_CHUVA_CSS } from '../chuva.util';

// So aparece a legenda das opcoes marcadas; desmarcou, a legenda some
@Component({
  selector: 'guarda-legenda',
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    @if (filtros.ativa('chuva')) {
      <section class="leg" aria-label="Legenda da chuva">
        <h3>Legenda - Chuva</h3>
        <div class="gradiente" [style.background]="gradiente"></div>
        <ul class="classes">
          @for (c of classesChuva; track c.nome) {
            <li><span class="bola" [style.background]="c.cor"></span><span>{{ c.nome }}<small>{{ c.faixa }}</small></span></li>
          }
        </ul>
        <small class="atual">{{ atual('chuva') }}</small>
      </section>
    }
    @if (filtros.ativa('ar')) {
      <section class="leg" aria-label="Legenda da qualidade do ar">
        <h3>Níveis de Poluição do Ar</h3>
        <div class="faixas">
          @for (f of faixasAr; track f.nome) {
            <span class="seg" [style.flex]="f.largura" [style.background]="f.cor" [style.color]="f.texto">{{ f.nome }}</span>
          }
        </div>
        <div class="eixo">
          @for (t of ticksAr; track t) { <span [style.left.%]="(t / 160) * 100">{{ t }}</span> }
        </div>
        <p class="unidade">Concentração de MP2.5 (\u00b5g/m\u00b3)</p>
        <small class="ref">Referência: CONAMA/BRASIL</small>
        <small class="atual">{{ atual('ar') }}</small>
      </section>
    }
    @if (satelites().length > 0) {
      <section class="leg" aria-label="Legenda das queimadas">
        <h3>Queimadas - últimas 24 h</h3>
        <ul class="sats">
          @for (s of satelites(); track s) {
            <li>
              <span class="bola" [style.background]="cor[s]"></span>{{ nome[s] }}
              @if (contar(s, 'foco'); as t) { <b class="num">{{ t }}</b> }
            </li>
          }
        </ul>
        <small class="ref">As manchas mostram onde há mais focos; aproxime o mapa para ver cada foco. Contagem da área visível.</small>
        <small class="atual">{{ atual('firms') }}</small>
      </section>
    }
    @if (filtros.ativa('cheias')) {
      <section class="leg" aria-label="Legenda do risco de cheia">
        <h3>Risco de Cheia (rios acima do normal)</h3>
        <ul class="sats">
          <li><span class="bola" [style.background]="'#22d3ee'"></span>Atenção (1,5 a 2x a média)</li>
          <li><span class="bola" [style.background]="'#0891b2'"></span>Alto (2 a 3x)</li>
          <li><span class="bola" [style.background]="'#164e63'"></span>Extremo (3x ou mais)</li>
        </ul>
        <small class="ref">Estimativa pela vazão do rio contra a média de 30 dias. Não é alerta oficial.</small>
        <small class="atual">{{ atual('cheia') }}</small>
      </section>
    }
    @if (filtros.ativa('desmatamento')) {
      <section class="leg" aria-label="Legenda do desmatamento">
        <h3>Desmatamento - alertas DETER (90 dias)</h3>
        <ul class="sats">
          <li><span class="bola marrom" style="width: 10px; height: 10px"></span>Pequeno (até 20 ha)</li>
          <li><span class="bola marrom" style="width: 14px; height: 14px"></span>Médio (20 a 100 ha)</li>
          <li><span class="bola marrom" style="width: 19px; height: 19px"></span>Grande (mais de 100 ha)</li>
        </ul>
        @if (contar('desmatamento', 'alerta'); as t) { <small class="ref">{{ t }} na área visível. A mancha mostra onde se concentram; aproxime para ver cada alerta.</small> }
        <small class="atual">{{ atual('desmatamento') }}</small>
      </section>
    }
  `,
  styles: [`
    :host { display: flex; flex-direction: column; gap: 8px; }
    .leg { background: rgba(255, 255, 255, 0.92); border: 1px solid rgba(0, 0, 0, 0.3); border-radius: 6px; padding: 8px 12px 9px; }
    h3 { font-size: 15px; text-align: center; margin-bottom: 6px; }
    .gradiente { height: 14px; border: 1px solid #777; border-radius: 3px; }
    .classes { list-style: none; margin: 8px 0 0; padding: 0; display: grid; grid-template-columns: repeat(auto-fit, minmax(150px, 1fr)); gap: 6px 10px; }
    .classes li, .sats li { display: flex; align-items: center; gap: 7px; font-size: 14px; }
    .classes small { display: block; color: var(--texto-suave); font-size: 12px; }
    .bola { width: 16px; height: 16px; border-radius: 50%; border: 1px solid rgba(0, 0, 0, 0.35); flex: none; }
    .bola.marrom { background: #92400e; }
    .sats { list-style: none; margin: 0; padding: 0; display: flex; flex-wrap: wrap; align-items: center; gap: 6px 14px; }
    .num { color: #1f2933; font-weight: 700; }
    .faixas { display: flex; border: 1px solid #555; }
    .seg { text-align: center; font-size: 13px; padding: 3px 0; white-space: nowrap; overflow: hidden; }
    .eixo { position: relative; height: 16px; margin: 2px 0 0; font-size: 12px; }
    .eixo span { position: absolute; transform: translateX(-50%); }
    .unidade { margin: 2px 0 0; text-align: center; font-size: 14px; font-weight: 700; }
    .ref { display: block; text-align: center; color: var(--texto-suave); font-size: 12px; margin-top: 4px; }
    .atual { display: block; margin-top: 4px; color: var(--texto-suave); font-size: 12px; text-align: right; }
  `],
})
export class LegendaComponent {
  protected readonly filtros = inject(FiltrosService);
  private readonly atualizacao = inject(AtualizacaoService);
  private readonly ha = new AtualizadoHaPipe();
  protected readonly gradiente = GRADIENTE_CHUVA_CSS;
  protected readonly classesChuva = CLASSES_CHUVA;
  protected readonly faixasAr = FAIXAS_AR;
  protected readonly ticksAr = [0, 25, 50, 75, 125, 160];
  protected readonly nome = NOME_SATELITE;
  protected readonly cor = COR_SATELITE;
  protected readonly satelites = computed(() => SATELITES_IDS.filter((id) => this.filtros.camadasAtivas().includes(id)));

  protected atual(fonteId: string): string {
    const f = this.atualizacao.fonteDe(fonteId);
    if (!f) return '';
    return 'Atualizado ' + this.ha.transform(f.ultima_coleta_ok) + (estaDefasada(f) ? ' (defasado)' : '');
  }

  // "705 focos" (vazio enquanto a camada ainda nao carregou)
  protected contar(id: string, unidade: string): string {
    const v = this.filtros.contagens()[id];
    if (v === undefined) return '';
    return v.toLocaleString('pt-BR') + ' ' + unidade + (v === 1 ? '' : 's');
  }
}