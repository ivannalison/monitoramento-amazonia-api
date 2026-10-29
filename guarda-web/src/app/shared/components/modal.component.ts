import { ChangeDetectionStrategy, Component, input, output } from '@angular/core';

@Component({
  selector: 'guarda-modal',
  changeDetection: ChangeDetectionStrategy.OnPush,
  host: { '(document:keydown.escape)': 'aoEsc()' },
  template: `
    @if (aberto()) {
      <div class="fundo" (click)="fechar.emit()"></div>
      <div class="modal vidro" role="dialog" aria-modal="true" [attr.aria-label]="titulo()">
        <header>
          <h2>{{ titulo() }}</h2>
          <button type="button" class="x" aria-label="Fechar" (click)="fechar.emit()">&times;</button>
        </header>
        <div class="corpo"><ng-content /></div>
      </div>
    }
  `,
  styles: [`
    .fundo { position: fixed; inset: 0; background: rgba(0, 0, 0, 0.55); z-index: 80; }
    .modal { position: fixed; z-index: 81; left: 50%; top: 50%; transform: translate(-50%, -50%); width: min(92vw, 720px); max-height: 86vh; display: flex; flex-direction: column; background: var(--painel-solido); }
    header { display: flex; justify-content: space-between; align-items: center; padding: 14px 18px; border-bottom: 1px solid var(--borda); }
    .corpo { padding: 16px 18px; overflow: auto; }
    .x { background: none; border: 0; font-size: 24px; cursor: pointer; line-height: 1; }
  `],
})
export class ModalComponent {
  readonly aberto = input(false);
  readonly titulo = input('');
  readonly fechar = output<void>();
  protected aoEsc(): void {
    if (this.aberto()) this.fechar.emit();
  }
}