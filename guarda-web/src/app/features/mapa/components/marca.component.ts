import { ChangeDetectionStrategy, Component, output } from '@angular/core';

// Canto superior direito: o nome GUARDA como marca d'agua (so letras, sem caixa, sem simbolo) e o botao Sobre
@Component({
  selector: 'guarda-marca',
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <div class="marca">
      <strong class="nome">GUARDA</strong>
      <span class="sub">Monitoramento da Amazônia</span>
      <button type="button" class="botao" (click)="abrirSobre.emit()">Sobre</button>
    </div>
  `,
  styles: [`
    .marca { display: flex; flex-direction: column; align-items: center; gap: 2px; pointer-events: none; }
    .nome { font-size: 40px; font-weight: 800; letter-spacing: 0.12em; line-height: 1.05; color: rgba(0, 0, 0, 0.75); text-shadow: 0 0 3px rgba(255, 255, 255, 0.95), 0 0 9px rgba(255, 255, 255, 0.85); }
    .sub { font-size: 16px; font-weight: 700; color: rgba(0, 0, 0, 0.75); text-shadow: 0 0 3px rgba(255, 255, 255, 0.95), 0 0 9px rgba(255, 255, 255, 0.85); }
    .botao { pointer-events: auto; margin-top: 8px; font-size: 15px; padding: 7px 18px; }
    @media (max-width: 720px), (max-height: 560px) {
      .nome { font-size: 24px; }
      .sub { font-size: 12px; }
      .botao { margin-top: 4px; font-size: 13px; padding: 5px 12px; }
    }
    @media (max-width: 320px) {
      .nome { font-size: 20px; }
      .sub { display: none; }
    }
  `],
})
export class MarcaComponent {
  readonly abrirSobre = output<void>();
}