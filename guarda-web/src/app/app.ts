import { Component, OnInit, inject } from '@angular/core';
import { RouterOutlet } from '@angular/router';
import { AtualizacaoService } from './core/services/atualizacao.service';
import { ToastComponent } from './shared/components/toast.component';

@Component({
  selector: 'guarda-root',
  imports: [RouterOutlet, ToastComponent],
  template: `<router-outlet /><guarda-toast />`,
  styles: [':host { display: block; height: 100dvh; }'],
})
export class App implements OnInit {
  private readonly atualizacao = inject(AtualizacaoService);

  ngOnInit(): void {
    this.atualizacao.iniciar();
  }
}