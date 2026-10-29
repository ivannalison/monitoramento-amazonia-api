import { LIMITE_DEFASAGEM_H } from '../config/camadas.config';
import { Fonte } from '../models/api.models';

export function horasDesde(iso: string | null | undefined, agora: number = Date.now()): number | null {
  if (!iso) return null;
  const t = new Date(iso).getTime();
  if (Number.isNaN(t)) return null;
  return (agora - t) / 3600000;
}

// Dado defasado: ultima coleta ok mais antiga que o limite da fonte, sem coleta ou em erro
export function estaDefasada(f: Fonte, agora: number = Date.now()): boolean {
  if (f.situacao === 'erro') return true;
  const h = horasDesde(f.ultima_coleta_ok, agora);
  if (h === null) return true;
  return h > (LIMITE_DEFASAGEM_H[f.id] ?? 12);
}