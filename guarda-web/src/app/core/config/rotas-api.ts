// Caminhos da API usados pelo front. O teste scripts/testar-api.mjs confere cada um contra a API de verdade.
export const ROTAS = {
  fontes: '/api/fontes',
  queimadasGeojson: '/api/queimadas/geojson',
  qualidadeArGeojson: '/api/qualidade-ar/geojson',
  chuvasGeojson: '/api/chuvas/geojson',
  cheiasGeojson: '/api/cheias/geojson',
  desmatamentoGeojson: '/api/desmatamento/geojson',
  municipios: '/api/municipios',
  municipiosGeojson: '/api/municipios/geojson',
  contornosEstados: '/api/contornos/estados',
} as const;