// Compara textos sem diferenca de acento ou maiuscula ("labrea" acha "Lábrea")
export function semAcento(texto: string): string {
  return texto.normalize('NFD').replace(/[\u0300-\u036f]/g, '').toLowerCase().trim();
}