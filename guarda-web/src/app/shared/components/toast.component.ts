import { ChangeDetectionStrategy, Component, inject } from '@angular/core';
import { NotificacaoService } from '../../core/services/notificacao.service';

@Component({
  selector: 'guarda-toast',
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <div class="pilha nao-imprimir" aria-live="polite">
      @for (a of avisos(); track a.id) {
        <div class="toast" [class]="a.tipo" role="status">
          <span>{{ a.texto }}</span>
          <button type="button" aria-label="Fechar aviso" (click)="fechar(a.id)">&times;</button>
        </div>
      }
    </div>
  `,
  styles: [`
    .pilha { position: fixed; right: 12px; bottom: 56px; display: flex; flex-direction: column; gap: 8px; z-index: 50; max-width: min(92vw, 380px); }
    .toast { display: flex; gap: 10px; justify-content: space-between; align-items: flex-start; padding: 10px 12px; border-radius: 10px; background: var(--painel-solido); border: 1px solid var(--borda); box-shadow: 0 6px 20px rgba(0, 0, 0, 0.4); }
    .toast.erro { border-color: var(--erro); }
    .toast.ok { border-color: var(--ok); }
    button { background: none; border: 0; cursor: pointer; font-size: 18px; line-height: 1; }
  `],
})
export class ToastComponent {
  private readonly notificacao = inject(NotificacaoService);
  protected readonly avisos = this.notificacao.avisos;
  protected fechar(id: number): void {
    this.notificacao.fechar(id);
  }
}