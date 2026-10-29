export type CamadaId = 'chuva' | 'ar' | 'modis' | 'noaa20' | 'suomi' | 'cheias' | 'desmatamento';

export interface OpcaoCamada { id: CamadaId; rotulo: string; fonteId: string; }

// As 7 opcoes da caixa branca. Todas podem ficar marcadas ao mesmo tempo; o mapa abre sem nenhuma.
export const OPCOES: OpcaoCamada[] = [
  { id: 'chuva', rotulo: 'Chuvas', fonteId: 'chuva' },
  { id: 'ar', rotulo: 'Qualidade do Ar - Estações Virtuais', fonteId: 'ar' },
  { id: 'modis', rotulo: 'Queimadas (MODIS 24h)', fonteId: 'firms' },
  { id: 'noaa20', rotulo: 'Queimadas (NOAA-20 24h)', fonteId: 'firms' },
  { id: 'suomi', rotulo: 'Queimadas (Suomi 24h)', fonteId: 'firms' },
  { id: 'cheias', rotulo: 'Risco de Cheia', fonteId: 'cheia' },
  { id: 'desmatamento', rotulo: 'Desmatamento (DETER 90 dias)', fonteId: 'desmatamento' },
];
export const SATELITES_IDS: CamadaId[] = ['modis', 'noaa20', 'suomi'];
export const NOME_SATELITE: Record<string, string> = { modis: 'MODIS', noaa20: 'NOAA-20', suomi: 'Suomi NPP' };
export const COR_SATELITE: Record<string, string> = { modis: '#e11d48', noaa20: '#f97316', suomi: '#eab308' };
// id de /api/fontes -> camadas que dependem dele
export const CAMADAS_DA_FONTE: Record<string, CamadaId[]> = {
  firms: ['modis', 'noaa20', 'suomi'], ar: ['ar'], chuva: ['chuva'], cheia: ['cheias'], desmatamento: ['desmatamento'],
};
export const NOMES_ESTADOS: Record<string, string> = {
  AC: 'Acre', AM: 'Amazonas', AP: 'Amapá', MA: 'Maranhão', MT: 'Mato Grosso', PA: 'Pará', RO: 'Rondônia', RR: 'Roraima', TO: 'Tocantins',
};
// a partir de quantas horas sem coleta ok o dado e considerado defasado
export const LIMITE_DEFASAGEM_H: Record<string, number> = { firms: 3, ar: 8, chuva: 8, cheia: 8, clima: 14, desmatamento: 14 };