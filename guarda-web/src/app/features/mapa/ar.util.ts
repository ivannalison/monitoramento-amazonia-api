export interface FaixaAr {
  nome: string;
  de: number;
  ate: number | null;
  cor: string;
  texto: string;
  largura: number;
}

// Faixas de MP2.5 (ug/m3), referencia CONAMA/Brasil, como no SELVA
export const FAIXAS_AR: FaixaAr[] = [
  { nome: 'Boa', de: 0, ate: 25, cor: '#50f050', texto: '#000000', largura: 25 },
  { nome: 'Moderada', de: 25, ate: 50, cor: '#ffff00', texto: '#000000', largura: 25 },
  { nome: 'Ruim', de: 50, ate: 75, cor: '#ffaa77', texto: '#000000', largura: 25 },
  { nome: 'Muito Ruim', de: 75, ate: 125, cor: '#ff0000', texto: '#ffffff', largura: 50 },
  { nome: 'Péssimo', de: 125, ate: null, cor: '#990066', texto: '#ffffff', largura: 35 },
];

export function faixaDoAr(pm25: number): FaixaAr {
  for (const f of FAIXAS_AR) {
    if (f.ate === null || pm25 < f.ate) return f;
  }
  return FAIXAS_AR[FAIXAS_AR.length - 1];
}

export function formatarPm(valor: number): string {
  return valor.toLocaleString('pt-BR', { minimumFractionDigits: 0, maximumFractionDigits: 1 });
}