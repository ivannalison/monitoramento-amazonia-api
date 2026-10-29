import { HttpInterceptorFn, HttpResponse } from '@angular/common/http';
import { of, tap } from 'rxjs';

const VALIDADE_MS = 60_000;
const SEM_CACHE = ['/api/fontes', '/api/status'];
const guarda = new Map<string, { expira: number; resposta: HttpResponse<unknown> }>();

export function limparCache(): void {
  guarda.clear();
}

// Guarda respostas GET por 60 s para nao repetir chamadas ao navegar entre telas.
// /api/fontes e /api/status nunca entram no cache (servem para detectar dado novo).
export const cacheInterceptor: HttpInterceptorFn = (req, next) => {
  if (req.method !== 'GET' || SEM_CACHE.some((p) => req.url.includes(p))) return next(req);
  const achado = guarda.get(req.urlWithParams);
  if (achado && achado.expira > Date.now()) return of(achado.resposta.clone());
  return next(req).pipe(
    tap((evento) => {
      if (evento instanceof HttpResponse) {
        if (guarda.size > 150) guarda.clear();
        guarda.set(req.urlWithParams, { expira: Date.now() + VALIDADE_MS, resposta: evento });
      }
    }),
  );
};