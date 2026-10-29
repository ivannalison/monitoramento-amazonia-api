import { HttpErrorResponse, HttpInterceptorFn } from '@angular/common/http';
import { inject } from '@angular/core';
import { catchError, throwError } from 'rxjs';
import { NotificacaoService } from '../services/notificacao.service';

export function mensagemDoErro(e: HttpErrorResponse): string {
  const corpo = e.error as { erro?: unknown } | null;
  const daApi = corpo && typeof corpo === 'object' && typeof corpo.erro === 'string' ? corpo.erro : null;
  switch (e.status) {
    case 0: return 'Não foi possível falar com a API. Verifique a conexão e tente de novo.';
    case 400: return daApi ?? 'Pedido inválido.';
    case 404: return daApi ?? 'Recurso não encontrado.';
    case 429: return 'Muitas consultas em pouco tempo. Aguarde alguns minutos.';
    case 503: return daApi ?? 'Serviço temporariamente indisponível.';
    default: return e.status >= 500 ? 'A API teve um problema. Tente novamente em instantes.' : (daApi ?? 'Não foi possível concluir o pedido.');
  }
}

export const erroInterceptor: HttpInterceptorFn = (req, next) => {
  const notificacao = inject(NotificacaoService);
  return next(req).pipe(
    catchError((erro: unknown) => {
      if (erro instanceof HttpErrorResponse) notificacao.erro(mensagemDoErro(erro));
      return throwError(() => erro);
    }),
  );
};