import type { Map as MapaMapLibre } from 'maplibre-gl';
import { CamadaId, COR_SATELITE, SATELITES_IDS } from '../../core/config/camadas.config';
import { rampaCalor } from './calor.util';
import { COORDENADAS_CHUVA, pixelTransparente } from './chuva.util';
import type { TipoPopup } from './popup.util';

export const VAZIO = { type: 'FeatureCollection', features: [] };
export const COR_DESMATAMENTO = '#92400e';

export const TODAS: CamadaId[] = ['chuva', 'ar', 'cheias', 'desmatamento', 'modis', 'noaa20', 'suomi'];
export const FONTE_DA_CAMADA: Record<CamadaId, string> = {
  chuva: 'chuva', ar: 'ar', cheias: 'cheias', desmatamento: 'desmatamento', modis: 'q-modis', noaa20: 'q-noaa20', suomi: 'q-suomi',
};
const LAYERS_DA_CAMADA: Record<CamadaId, string[]> = {
  chuva: ['chuva-raster'],
  ar: ['ar-halo', 'ar-pontos'],
  cheias: ['cheias-halo', 'cheias-pontos'],
  desmatamento: ['desmatamento-calor', 'desmatamento-pontos'],
  modis: ['calor-modis', 'queimadas-modis'],
  noaa20: ['calor-noaa20', 'queimadas-noaa20'],
  suomi: ['calor-suomi', 'queimadas-suomi'],
};
export const IDS_CLIQUE = ['ar-pontos', 'cheias-pontos', 'desmatamento-pontos', 'queimadas-modis', 'queimadas-noaa20', 'queimadas-suomi'];
export const TIPO_DO_LAYER: Record<string, TipoPopup> = {
  'ar-pontos': 'ar', 'cheias-pontos': 'cheia', 'desmatamento-pontos': 'desmatamento',
  'queimadas-modis': 'queimada', 'queimadas-noaa20': 'queimada', 'queimadas-suomi': 'queimada',
};

export function definirVisibilidade(mapa: MapaMapLibre, id: CamadaId, visivel: boolean): void {
  for (const layer of LAYERS_DA_CAMADA[id]) {
    if (mapa.getLayer(layer)) mapa.setLayoutProperty(layer, 'visibility', visivel ? 'visible' : 'none');
  }
}

const POR_ZOOM = ['interpolate', ['linear'], ['zoom']];
const oculta = (): Record<string, string> => ({ visibility: 'none' });

// Cria as fontes de dados e as camadas (de baixo para cima). Todas as camadas de dados comecam escondidas.
// Queimadas e desmatamento: mancha de calor ao longe (mostra a regiao) + bolinhas de cada ponto (crescem ao aproximar).
export function adicionarFontesECamadas(mapa: MapaMapLibre): void {
  const fonte = (id: string, spec: Record<string, unknown>): void => {
    mapa.addSource(id, spec as never);
  };
  const camada = (spec: Record<string, unknown>): void => {
    mapa.addLayer(spec as never);
  };
  const geo = (): Record<string, unknown> => ({ type: 'geojson', data: { type: 'FeatureCollection', features: [] } });

  fonte('amazonia-legal', geo());
  fonte('estados', geo());
  fonte('municipios', geo());
  fonte('municipio-sel', geo());
  fonte(FONTE_DA_CAMADA['ar'], geo());
  fonte(FONTE_DA_CAMADA['cheias'], geo());
  fonte(FONTE_DA_CAMADA['desmatamento'], geo());
  for (const id of SATELITES_IDS) fonte(FONTE_DA_CAMADA[id], geo());
  fonte('chuva', { type: 'image', url: pixelTransparente(), coordinates: COORDENADAS_CHUVA });

  camada({ id: 'chuva-raster', type: 'raster', source: 'chuva', layout: oculta(), paint: { 'raster-opacity': 0.9, 'raster-fade-duration': 0, 'raster-resampling': 'linear' } });
  camada({
    id: 'municipios-linha', type: 'line', source: 'municipios', minzoom: 6,
    paint: { 'line-color': '#6b7785', 'line-width': 0.7, 'line-opacity': [...POR_ZOOM, 6, 0.35, 9, 0.75] },
  });
  camada({ id: 'municipios-fill', type: 'fill', source: 'municipios', minzoom: 6, paint: { 'fill-color': '#000000', 'fill-opacity': 0.01 } });
  camada({ id: 'estados-linha', type: 'line', source: 'estados', layout: { visibility: 'none' }, paint: { 'line-color': '#111111', 'line-width': 1.6 } });
  camada({ id: 'estados-destaque', type: 'line', source: 'estados', filter: ['==', ['get', 'sigla'], ''], paint: { 'line-color': '#e8590c', 'line-width': 3 } });
  camada({ id: 'municipio-sel-fill', type: 'fill', source: 'municipio-sel', paint: { 'fill-color': '#e8590c', 'fill-opacity': 0.12 } });
  camada({ id: 'municipio-sel-linha', type: 'line', source: 'municipio-sel', paint: { 'line-color': '#e8590c', 'line-width': 3 } });
  camada({
    id: 'amazonia-linha', type: 'line', source: 'amazonia-legal',
    layout: { 'line-join': 'round', 'line-cap': 'round' },
    paint: { 'line-color': '#000000', 'line-width': [...POR_ZOOM, 3, 2, 8, 3, 12, 4] },
  });

  // desmatamento: mancha marrom + bolinhas proporcionais a area
  camada({
    id: 'desmatamento-calor', type: 'heatmap', source: 'desmatamento', maxzoom: 10, layout: oculta(),
    paint: {
      'heatmap-weight': ['interpolate', ['linear'], ['coalesce', ['get', 'area_ha'], 1], 0, 0.4, 50, 0.8, 500, 1],
      'heatmap-intensity': [...POR_ZOOM, 3, 1.4, 9, 3],
      'heatmap-radius': [...POR_ZOOM, 3, 12, 6, 24, 9, 38],
      'heatmap-color': rampaCalor(COR_DESMATAMENTO),
      'heatmap-opacity': [...POR_ZOOM, 7, 0.95, 10, 0],
    },
  });
  camada({
    id: 'desmatamento-pontos', type: 'circle', source: 'desmatamento', layout: oculta(),
    paint: {
      'circle-color': COR_DESMATAMENTO,
      'circle-radius': [...POR_ZOOM, 3, 2.5, 8, ['interpolate', ['linear'], ['coalesce', ['get', 'area_ha'], 1], 0, 4, 100, 7, 500, 12], 13, ['interpolate', ['linear'], ['coalesce', ['get', 'area_ha'], 1], 0, 8, 100, 14, 500, 24]],
      'circle-opacity': [...POR_ZOOM, 3, 0.4, 8, 0.7],
      'circle-stroke-color': '#ffffff',
      'circle-stroke-width': 0.8,
      'circle-stroke-opacity': [...POR_ZOOM, 3, 0.2, 8, 0.9],
    },
  });

  // risco de cheia: poucos pontos, com halo grande
  camada({
    id: 'cheias-halo', type: 'circle', source: 'cheias', layout: oculta(),
    paint: {
      'circle-color': ['match', ['get', 'nivel'], 'atencao', '#22d3ee', 'alto', '#0891b2', 'extremo', '#164e63', '#22d3ee'],
      'circle-radius': [...POR_ZOOM, 3, 20, 8, 40],
      'circle-opacity': 0.28,
      'circle-blur': 0.8,
    },
  });
  camada({
    id: 'cheias-pontos', type: 'circle', source: 'cheias', layout: oculta(),
    paint: {
      'circle-color': ['match', ['get', 'nivel'], 'atencao', '#22d3ee', 'alto', '#0891b2', 'extremo', '#164e63', '#22d3ee'],
      'circle-radius': ['match', ['get', 'nivel'], 'atencao', 9, 'alto', 12, 'extremo', 15, 9],
      'circle-opacity': 0.9,
      'circle-stroke-color': '#073b4c',
      'circle-stroke-width': 2,
    },
  });

  // qualidade do ar: halo suave + bola com a cor da faixa
  camada({
    id: 'ar-halo', type: 'circle', source: 'ar', layout: oculta(),
    paint: {
      'circle-color': ['step', ['get', 'pm2_5'], '#50f050', 25, '#ffff00', 50, '#ffaa77', 75, '#ff0000', 125, '#990066'],
      'circle-radius': [...POR_ZOOM, 3, 16, 6, 30, 10, 50],
      'circle-opacity': 0.3,
      'circle-blur': 0.8,
    },
  });
  camada({
    id: 'ar-pontos', type: 'circle', source: 'ar', layout: oculta(),
    paint: {
      'circle-color': ['step', ['get', 'pm2_5'], '#50f050', 25, '#ffff00', 50, '#ffaa77', 75, '#ff0000', 125, '#990066'],
      'circle-radius': [...POR_ZOOM, 3, 7, 6, 12, 10, 18],
      'circle-stroke-color': '#222222',
      'circle-stroke-width': 1,
      'circle-opacity': 0.92,
    },
  });

  // queimadas: uma mancha + bolinhas por satelite, cada um na sua cor
  for (const id of SATELITES_IDS) {
    camada({
      id: 'calor-' + id, type: 'heatmap', source: FONTE_DA_CAMADA[id], maxzoom: 10, layout: oculta(),
      paint: {
        'heatmap-weight': ['interpolate', ['linear'], ['coalesce', ['get', 'intensidade'], 1], 0, 0.4, 50, 0.8, 200, 1],
        'heatmap-intensity': [...POR_ZOOM, 3, 1.4, 9, 3],
        'heatmap-radius': [...POR_ZOOM, 3, 12, 6, 24, 9, 38],
        'heatmap-color': rampaCalor(COR_SATELITE[id]),
        'heatmap-opacity': [...POR_ZOOM, 7, 0.95, 10, 0],
      },
    });
    camada({
      id: 'queimadas-' + id, type: 'circle', source: FONTE_DA_CAMADA[id], layout: oculta(),
      paint: {
        'circle-color': COR_SATELITE[id],
        'circle-opacity': [...POR_ZOOM, 3, 0.4, 8, 0.55],
        'circle-stroke-color': COR_SATELITE[id],
        'circle-stroke-opacity': [...POR_ZOOM, 3, 0.3, 8, 0.85],
        'circle-stroke-width': 1,
        'circle-radius': [...POR_ZOOM, 3, 2.5, 6, 4, 9, 9, 12, 14, 15, 22],
      },
    });
  }
}