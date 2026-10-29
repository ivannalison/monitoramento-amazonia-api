import { DataManausPipe } from '../../shared/pipes/data-manaus.pipe';

export type TipoPopup = 'queimada' | 'ar' | 'cheia' | 'desmatamento';
export interface Linha { rotulo: string; valor: string; }

export const TITULOS: Record<TipoPopup, string> = {
  queimada: 'Foco de calor',
  ar: 'Qualidade do ar (estação virtual)',
  cheia: 'Risco de cheia',
  desmatamento: 'Alerta de desmatamento (DETER)',
};

const SATELITES: Record<string, string> = { modis: 'MODIS', noaa20: 'NOAA-20 (VIIRS)', suomi: 'Suomi NPP (VIIRS)' };
const NIVEIS: Record<string, string> = { atencao: 'Atenção', alto: 'Alto', extremo: 'Extremo', normal: 'Normal' };
const pipeData = new DataManausPipe();

function num(v: unknown, casas = 1): string {
  return typeof v === 'number' && Number.isFinite(v) ? v.toLocaleString('pt-BR', { maximumFractionDigits: casas }) : '-';
}
function txt(v: unknown): string {
  return typeof v === 'string' && v ? v : '-';
}
function data(v: unknown): string {
  return typeof v === 'string' ? pipeData.transform(v, 'longo') : '-';
}

// Linhas "rotulo / valor" mostradas ao clicar em um ponto
export function linhasDe(tipo: TipoPopup, p: Record<string, unknown>): Linha[] {
  switch (tipo) {
    case 'ar':
      return [
        { rotulo: 'Data e hora', valor: data(p['data']) },
        { rotulo: 'PM2.5', valor: num(p['pm2_5']) + ' \u00b5g/m\u00b3' },
        { rotulo: 'PM10', valor: num(p['pm10']) + ' \u00b5g/m\u00b3' },
        { rotulo: 'Índice de qualidade (AQI)', valor: num(p['indice'], 0) },
        { rotulo: 'Estado', valor: txt(p['estado']) },
        { rotulo: 'Fonte', valor: txt(p['fonte']) },
      ];
    case 'cheia':
      return [
        { rotulo: 'Data', valor: data(p['data']) },
        { rotulo: 'Nível', valor: NIVEIS[txt(p['nivel'])] ?? txt(p['nivel']) },
        { rotulo: 'Razão (vazão / média 30 dias)', valor: num(p['razao'], 2) },
        { rotulo: 'Vazão', valor: num(p['vazao']) + ' m\u00b3/s' },
        { rotulo: 'Vazão média', valor: num(p['vazao_media']) + ' m\u00b3/s' },
        { rotulo: 'Estado', valor: txt(p['estado']) },
        { rotulo: 'Fonte', valor: txt(p['fonte']) },
      ];
    case 'desmatamento':
      return [
        { rotulo: 'Data', valor: data(p['data']) },
        { rotulo: 'Área', valor: num(p['area_ha']) + ' ha' },
        { rotulo: 'Classe', valor: txt(p['classe']) },
        { rotulo: 'Município', valor: txt(p['municipio']) },
        { rotulo: 'Estado', valor: txt(p['estado']) },
        { rotulo: 'Fonte', valor: txt(p['fonte']) },
      ];
    case 'queimada':
      return [
        { rotulo: 'Data e hora', valor: data(p['data']) },
        { rotulo: 'Satélite', valor: SATELITES[txt(p['satelite'])] ?? txt(p['satelite']) },
        { rotulo: 'Intensidade (FRP)', valor: num(p['intensidade']) + ' MW' },
        { rotulo: 'Confiança', valor: txt(p['confianca']) },
        { rotulo: 'Município', valor: txt(p['municipio']) },
        { rotulo: 'Estado', valor: txt(p['estado']) },
        { rotulo: 'Fonte', valor: txt(p['fonte']) },
      ];
  }
}