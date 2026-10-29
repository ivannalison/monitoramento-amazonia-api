import { ChangeDetectionStrategy, Component, inject } from '@angular/core';
import { AtualizacaoService } from '../../core/services/atualizacao.service';
import { estaDefasada } from '../../core/util/defasagem.util';
import { AtualizadoHaPipe } from '../../shared/pipes/atualizado-ha.pipe';

@Component({
  selector: 'guarda-sobre-conteudo',
  imports: [AtualizadoHaPipe],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <section class="sobre">
      <h3>Para que serve</h3>
      <p>O GUARDA reúne em um mapa as queimadas, a fumaça, a chuva, o risco de cheia e o desmatamento da Amazônia Legal, quase em tempo real, para apoiar o acompanhamento e a resiliência das comunidades (ODS 11 - Cidades e Comunidades Sustentáveis). O site é aberto, sem cadastro e somente de leitura.</p>

      <h3>Como usar</h3>
      <ul>
        <li>O mapa abre limpo. Marque as opções na caixa branca: cada uma mostra os seus dados e a sua legenda, e todas podem ficar marcadas ao mesmo tempo.</li>
        <li>Digite o nome de uma cidade ou de um estado na busca para o mapa ir até lá.</li>
        <li>Aproxime o mapa para ver os limites e o nome dos municípios (passe o mouse sobre eles).</li>
      </ul>

      <h3>Fontes de dados</h3>
      <ul>
        <li><strong>Queimadas:</strong> NASA FIRMS (MODIS, NOAA-20 e Suomi NPP), últimas 24 horas.</li>
        <li><strong>Desmatamento:</strong> INPE DETER (alertas dos últimos 90 dias).</li>
        <li><strong>Chuva, qualidade do ar e risco de cheia:</strong> Open-Meteo (modelos, não são estações físicas).</li>
        <li><strong>Contornos e municípios:</strong> IBGE. <strong>Mapa base:</strong> OpenStreetMap.</li>
      </ul>

      <h3>Situação das fontes</h3>
      @if (atualizacao.fontes().length === 0) {
        <p class="suave">Conferindo as fontes...</p>
      } @else {
        <table>
          <thead><tr><th>Fonte</th><th>Última coleta</th><th>Situação</th></tr></thead>
          <tbody>
            @for (f of atualizacao.fontes(); track f.id) {
              <tr><td>{{ f.nome }}</td><td>{{ f.ultima_coleta_ok | atualizadoHa }}</td><td>{{ defasada(f) ? 'defasado' : 'em dia' }}</td></tr>
            }
          </tbody>
        </table>
      }

      <h3>Limitações</h3>
      <ul>
        <li>A superfície de chuva é uma interpolação entre pontos de uma grade de cerca de 165 km: mostra a tendência, não cada nuvem.</li>
        <li>O risco de cheia é uma estimativa simples (vazão do rio de hoje contra a média de 30 dias), não é alerta oficial, e só mostra rios acima do normal.</li>
        <li>O contorno da Amazônia Legal segue os limites dos municípios incluídos; no Maranhão entram só os municípios a oeste do meridiano 44°W.</li>
        <li>Os dados mudam a cada 30 min (queimadas), 3 h (ar, chuva e cheia) ou 6 h (desmatamento). A tela confere novidades a cada 5 minutos.</li>
      </ul>
      <p class="suave">Open-Meteo é gratuito para uso não comercial. Mapa base © colaboradores do OpenStreetMap.</p>
    </section>
  `,
  styles: [`
    .sobre h3 { margin: 14px 0 6px; font-size: 15px; }
    .sobre h3:first-child { margin-top: 0; }
    .suave { color: var(--texto-suave); }
    ul { padding-left: 18px; margin: 0; }
    table { width: 100%; border-collapse: collapse; font-size: 14px; }
    th, td { text-align: left; padding: 6px 8px; border-bottom: 1px solid var(--borda); }
  `],
})
export class SobreConteudoComponent {
  protected readonly atualizacao = inject(AtualizacaoService);
  protected readonly defasada = estaDefasada;
}