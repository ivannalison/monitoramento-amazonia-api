export interface Fonte {
  id: string;
  nome: string;
  ultima_coleta: string | null;
  ultima_coleta_ok: string | null;
  situacao: string;
  erro?: string;
}
export interface RespostaFontes { fontes: Fonte[]; total_focos: number; }

export interface PontoGeo<P> {
  type: 'Feature';
  geometry: { type: 'Point'; coordinates: [number, number] };
  properties: P;
}
export interface ColecaoPontos<P> {
  type: 'FeatureCollection';
  features: PontoGeo<P>[];
  fonte?: string;
  ultima_atualizacao?: string | null;
  total?: number;
  limite?: number;
  truncado?: boolean;
  bbox?: number[] | null;
}
export interface PropsQueimada {
  data: string; hora: string | null; satelite: string; intensidade: number;
  confianca: string | null; estado: string; municipio: string | null; fonte: string;
}
export interface PropsAr { data: string; pm2_5: number; pm10: number | null; indice: number | null; aerossol: number | null; estado: string; fonte: string; }
export interface PropsChuva { hora: string; precipitacao_mm: number; estado: string; fonte: string; }
export interface PropsCheia { data: string; vazao: number; vazao_media: number; razao: number; nivel: string; estado: string; fonte: string; }
export interface PropsDesmatamento { data: string; estado: string; municipio: string | null; area_ha: number; classe: string | null; fonte: string; }

// Contornos (estados e municipios): so precisamos de propriedades e coordenadas
export interface FeatureGeo {
  type: 'Feature';
  properties: Record<string, unknown>;
  geometry: { type: string; coordinates: unknown };
}
export interface ColecaoGeo { type: 'FeatureCollection'; features: FeatureGeo[]; fonte?: string; total?: number; }

export interface MunicipioResumo {
  codigo: string; nome: string; uf: string;
  centro: [number, number];
  bbox: [number, number, number, number];
}
export interface RespostaMunicipios { fonte: string; total: number; municipios: MunicipioResumo[]; }