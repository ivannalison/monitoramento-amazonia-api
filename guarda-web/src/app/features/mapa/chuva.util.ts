export interface PontoChuva { lon: number; lat: number; mm: number; }
export type Coordenadas4 = [[number, number], [number, number], [number, number], [number, number]];
export interface ImagemChuva { url: string; coordinates: Coordenadas4; }

const CAIXA = { oeste: -74.5, leste: -43.5, sul: -17, norte: 5.5 };
// canto superior esquerdo, superior direito, inferior direito, inferior esquerdo
export const COORDENADAS_CHUVA: Coordenadas4 = [[CAIXA.oeste, CAIXA.norte], [CAIXA.leste, CAIXA.norte], [CAIXA.leste, CAIXA.sul], [CAIXA.oeste, CAIXA.sul]];

const LARGURA = 220;
const ALTURA = 160;
const RAIO_GRAUS = 2.4;

// mm/h, R, G, B, opacidade (do azul claro ao vermelho escuro e rosa, como no SELVA)
export const PARADAS_CHUVA: Array<[number, number, number, number, number]> = [
  [0.1, 191, 234, 247, 0.5],
  [0.5, 94, 200, 238, 0.7],
  [1.5, 10, 143, 208, 0.78],
  [2.5, 10, 90, 154, 0.82],
  [4, 255, 230, 0, 0.85],
  [7.5, 255, 168, 0, 0.88],
  [15, 255, 70, 0, 0.9],
  [30, 176, 0, 0, 0.92],
  [60, 230, 140, 210, 0.92],
];

export interface ClasseChuva { nome: string; faixa: string; cor: string; }
export const CLASSES_CHUVA: ClasseChuva[] = [
  { nome: 'Garoa', faixa: '0,1 a 1 mm/h', cor: '#5ec8ee' },
  { nome: 'Chuva fraca', faixa: '1 a 2,5 mm/h', cor: '#0a5a9a' },
  { nome: 'Chuva moderada', faixa: '2,5 a 7,5 mm/h', cor: '#ffa800' },
  { nome: 'Chuva forte', faixa: '7,5 a 30 mm/h', cor: '#ff4600' },
  { nome: 'Tempestade', faixa: 'mais de 30 mm/h', cor: '#b00000' },
];

export const GRADIENTE_CHUVA_CSS =
  'linear-gradient(to right, ' +
  PARADAS_CHUVA.map((p, i) => 'rgb(' + p[1] + ',' + p[2] + ',' + p[3] + ') ' + Math.round((i / (PARADAS_CHUVA.length - 1)) * 100) + '%').join(', ') +
  ')';

// Cor [R, G, B, opacidade 0..1] para uma chuva em mm/h; null = sem chuva
export function corDaChuva(mm: number): [number, number, number, number] | null {
  if (!(mm >= 0.1)) return null;
  const p = PARADAS_CHUVA;
  const ultima = p[p.length - 1];
  if (mm >= ultima[0]) return [ultima[1], ultima[2], ultima[3], ultima[4]];
  for (let i = 1; i < p.length; i++) {
    if (mm < p[i][0]) {
      const a = p[i - 1];
      const b = p[i];
      const t = (mm - a[0]) / (b[0] - a[0]);
      return [a[1] + (b[1] - a[1]) * t, a[2] + (b[2] - a[2]) * t, a[3] + (b[3] - a[3]) * t, a[4] + (b[4] - a[4]) * t];
    }
  }
  return null;
}

function mercY(lat: number): number {
  const r = (lat * Math.PI) / 180;
  return Math.log(Math.tan(Math.PI / 4 + r / 2));
}
function latDeMercY(y: number): number {
  return ((2 * Math.atan(Math.exp(y)) - Math.PI / 2) * 180) / Math.PI;
}

let pixel = '';
export function pixelTransparente(): string {
  if (!pixel) {
    const c = document.createElement('canvas');
    c.width = 1;
    c.height = 1;
    pixel = c.toDataURL('image/png');
  }
  return pixel;
}

// Transforma os pontos da grade em uma superficie continua (interpolacao por distancia inversa)
export function gerarImagemChuva(pontos: PontoChuva[]): ImagemChuva | null {
  if (pontos.length === 0) return null;
  const canvas = document.createElement('canvas');
  canvas.width = LARGURA;
  canvas.height = ALTURA;
  const ctx = canvas.getContext('2d');
  if (!ctx) return null;
  const img = ctx.createImageData(LARGURA, ALTURA);
  const yTopo = mercY(CAIXA.norte);
  const yBase = mercY(CAIXA.sul);
  const r2 = RAIO_GRAUS * RAIO_GRAUS;
  for (let j = 0; j < ALTURA; j++) {
    const lat = latDeMercY(yTopo + (yBase - yTopo) * (j / (ALTURA - 1)));
    for (let i = 0; i < LARGURA; i++) {
      const lon = CAIXA.oeste + (CAIXA.leste - CAIXA.oeste) * (i / (LARGURA - 1));
      let soma = 0;
      let pesos = 0;
      let perto = Infinity;
      for (const p of pontos) {
        const dx = lon - p.lon;
        const dy = lat - p.lat;
        const d2 = dx * dx + dy * dy;
        if (d2 > r2) continue;
        const w = 1 / (d2 + 0.05);
        soma += p.mm * w;
        pesos += w;
        if (d2 < perto) perto = d2;
      }
      if (pesos === 0) continue;
      const cor = corDaChuva(soma / pesos);
      if (!cor) continue;
      const esmaece = Math.max(0, Math.min(1, (r2 - perto) / (r2 * 0.5)));
      const k = (j * LARGURA + i) * 4;
      img.data[k] = cor[0];
      img.data[k + 1] = cor[1];
      img.data[k + 2] = cor[2];
      img.data[k + 3] = Math.round(255 * cor[3] * esmaece);
    }
  }
  ctx.putImageData(img, 0, 0);
  return { url: canvas.toDataURL('image/png'), coordinates: COORDENADAS_CHUVA };
}