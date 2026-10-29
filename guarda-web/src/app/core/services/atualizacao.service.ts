import { Injectable, inject, signal } from '@angular/core';
import { EMPTY, Subject, Subscription, catchError, switchMap, timer } from 'rxjs';
import { environment } from '../../../environments/environment';
import { Fonte, RespostaFontes } from '../models/api.models';
import { limparCache } from '../interceptors/cache.interceptor';
import { FontesService } from './fontes.service';

// Confere /api/fontes a cada 5 minutos. Quando uma coleta nova aparece, limpa o cache e avisa as camadas.
@Injectable({ providedIn: 'root' })
export class AtualizacaoService {
  private readonly fontesApi = inject(FontesService);
  readonly fontes = signal<Fonte[]>([]);
  readonly falhou = signal(false);
  readonly ultimaConferencia = signal<Date | null>(null);
  readonly mudancas$ = new Subject<string[]>();
  private readonly conhecidas = new Map<string, string | null>();
  private assinatura?: Subscription;

  iniciar(intervaloMs: number = environment.atualizacaoMs): void {
    if (this.assinatura) return;
    this.assinatura = timer(0, intervaloMs)
      .pipe(
        switchMap(() =>
          this.fontesApi.carregar().pipe(
            catchError(() => {
              this.falhou.set(true);
              return EMPTY;
            }),
          ),
        ),
      )
      .subscribe((resposta) => this.aplicar(resposta));
  }

  parar(): void {
    this.assinatura?.unsubscribe();
    this.assinatura = undefined;
  }

  fonteDe(id: string): Fonte | undefined {
    return this.fontes().find((f) => f.id === id);
  }

  aplicar(resposta: RespostaFontes): void {
    const mudou: string[] = [];
    for (const f of resposta.fontes) {
      if (this.conhecidas.has(f.id) && this.conhecidas.get(f.id) !== f.ultima_coleta_ok) mudou.push(f.id);
      this.conhecidas.set(f.id, f.ultima_coleta_ok);
    }
    this.fontes.set(resposta.fontes);
    this.falhou.set(false);
    this.ultimaConferencia.set(new Date());
    if (mudou.length > 0) {
      limparCache();
      this.mudancas$.next(mudou);
    }
  }
}