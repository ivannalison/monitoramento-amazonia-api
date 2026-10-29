import { ChangeDetectionStrategy, Component, OnDestroy, input, model, signal } from '@angular/core';

// Barra de tempo da chuva, com play (como no SELVA)
@Component({
  selector: 'guarda-linha-do-tempo',
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <div class="lt">
      <input type="range" [min]="min()" [max]="max()" step="1" [value]="valor()" (input)="mudar($event)" aria-label="Hora da chuva no mapa" />
      <div class="linha">
        <button type="button" class="play" (click)="alternar()" [attr.aria-label]="tocando() ? 'Pausar' : 'Reproduzir'">
          @if (tocando()) {
            <svg viewBox="0 0 24 24" width="22" height="22" aria-hidden="true"><rect x="5" y="4" width="5" height="16" /><rect x="14" y="4" width="5" height="16" /></svg>
          } @else {
            <svg viewBox="0 0 24 24" width="22" height="22" aria-hidden="true"><path d="M7 4l13 8-13 8z" /></svg>
          }
        </button>
        <span class="etiqueta">{{ texto() }}</span>
      </div>
    </div>
  `,
  styles: [`
    .lt { background: rgba(255, 255, 255, 0.88); border: 1px solid rgba(0, 0, 0, 0.25); border-radius: 6px; padding: 12px 16px 10px; }
    input[type='range'] { width: 100%; accent-color: #0b72f0; }
    .linha { display: flex; align-items: center; gap: 10px; margin-top: 4px; }
    .play { background: none; border: 0; padding: 0; cursor: pointer; display: inline-flex; color: #000; }
    .etiqueta { background: #d9363e; color: #fff; padding: 2px 8px; border-radius: 3px; font-size: 14px; border: 1px solid #a82a31; }
  `],
})
export class LinhaDoTempoComponent implements OnDestroy {
  readonly min = input(-24);
  readonly max = input(24);
  readonly texto = input.required<string>();
  readonly valor = model(0);
  protected readonly tocando = signal(false);
  private intervalo = 0;

  protected mudar(evento: Event): void {
    this.valor.set(Number((evento.target as HTMLInputElement).value));
  }

  protected alternar(): void {
    if (this.tocando()) {
      this.parar();
      return;
    }
    this.tocando.set(true);
    this.intervalo = window.setInterval(() => {
      const proximo = this.valor() + 1;
      this.valor.set(proximo > this.max() ? this.min() : proximo);
    }, 1000);
  }

  private parar(): void {
    clearInterval(this.intervalo);
    this.tocando.set(false);
  }

  ngOnDestroy(): void {
    clearInterval(this.intervalo);
  }
}