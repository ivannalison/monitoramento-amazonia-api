import { Injectable, signal } from '@angular/core';

export interface Aviso { id: number; tipo: 'erro' | 'ok' | 'info'; texto: string; }

@Injectable({ providedIn: 'root' })
export class NotificacaoService {
  readonly avisos = signal<Aviso[]>([]);
  private proximo = 1;
  private ultimo = { texto: '', em: 0 };

  erro(texto: string): void { this.adicionar('erro', texto); }
  ok(texto: string): void { this.adicionar('ok', texto); }
  info(texto: string): void { this.adicionar('info', texto); }

  fechar(id: number): void {
    this.avisos.update((lista) => lista.filter((a) => a.id !== id));
  }

  private adicionar(tipo: Aviso['tipo'], texto: string): void {
    const agora = Date.now();
    if (tipo === 'erro' && this.ultimo.texto === texto && agora - this.ultimo.em < 5000) return;
    this.ultimo = { texto, em: agora };
    const id = this.proximo++;
    this.avisos.update((lista) => [...lista.slice(-3), { id, tipo, texto }]);
    setTimeout(() => this.fechar(id), 6000);
  }
}