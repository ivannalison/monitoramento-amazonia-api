// Cores das manchas de calor (heatmap) do MapLibre
export function hexParaRgb(hex: string): [number, number, number] {
  let h = hex.replace('#', '');
  if (h.length === 3) h = h.split('').map((c) => c + c).join('');
  const n = parseInt(h, 16);
  return [(n >> 16) & 255, (n >> 8) & 255, n & 255];
}

// Rampa que comeca transparente e vai ficando mais forte onde ha mais pontos
export function rampaCalor(hex: string): unknown[] {
  const [r, g, b] = hexParaRgb(hex);
  const c = (alfa: number, f = 1): string => 'rgba(' + Math.round(r * f) + ',' + Math.round(g * f) + ',' + Math.round(b * f) + ',' + alfa + ')';
  return ['interpolate', ['linear'], ['heatmap-density'], 0, c(0), 0.12, c(0.3), 0.4, c(0.55), 0.7, c(0.78, 0.9), 1, c(0.9, 0.75)];
}