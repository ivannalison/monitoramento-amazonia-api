export type Caixa = [number, number, number, number];

// Caixa [minLon, minLat, maxLon, maxLat] de qualquer geometria (Polygon, MultiPolygon...)
export function caixaDeCoordenadas(coords: unknown): Caixa | null {
  let minX = 180;
  let minY = 90;
  let maxX = -180;
  let maxY = -90;
  let achou = false;
  const percorrer = (c: unknown): void => {
    if (!Array.isArray(c)) return;
    if (c.length >= 2 && typeof c[0] === 'number' && typeof c[1] === 'number') {
      const x = c[0] as number;
      const y = c[1] as number;
      achou = true;
      if (x < minX) minX = x;
      if (x > maxX) maxX = x;
      if (y < minY) minY = y;
      if (y > maxY) maxY = y;
      return;
    }
    for (const filho of c) percorrer(filho);
  };
  percorrer(coords);
  return achou ? [minX, minY, maxX, maxY] : null;
}