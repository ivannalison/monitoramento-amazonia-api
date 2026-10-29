import { faixaDoAr, formatarPm } from './ar.util';
import { CLASSES_CHUVA, corDaChuva, gerarImagemChuva, pixelTransparente } from './chuva.util';
import { linhasDe } from './popup.util';

describe('ar.util', () => {
  it('escolhe a faixa do CONAMA pelo valor de MP2.5', () => {
    expect(faixaDoAr(0).nome).toBe('Boa');
    expect(faixaDoAr(24.9).nome).toBe('Boa');
    expect(faixaDoAr(25).nome).toBe('Moderada');
    expect(faixaDoAr(60).nome).toBe('Ruim');
    expect(faixaDoAr(100).nome).toBe('Muito Ruim');
    expect(faixaDoAr(125).nome).toBe('Péssimo');
    expect(faixaDoAr(400).nome).toBe('Péssimo');
  });
  it('formata o valor em pt-BR', () => {
    expect(formatarPm(11.34)).toBe('11,3');
    expect(formatarPm(5)).toBe('5');
  });
});

describe('chuva.util', () => {
  it('nao pinta o que e quase sem chuva e muda de cor conforme a intensidade', () => {
    expect(corDaChuva(0)).toBeNull();
    expect(corDaChuva(0.05)).toBeNull();
    const fraca = corDaChuva(2.5);
    const forte = corDaChuva(15);
    expect(fraca).not.toBeNull();
    expect(forte).not.toBeNull();
    expect(fraca).not.toEqual(forte);
    expect(corDaChuva(500)).toEqual(corDaChuva(60));
  });
  it('tem as 5 classes da legenda', () => {
    expect(CLASSES_CHUVA.map((c) => c.nome)).toEqual(['Garoa', 'Chuva fraca', 'Chuva moderada', 'Chuva forte', 'Tempestade']);
  });
  it('gera a imagem da superficie a partir dos pontos', () => {
    expect(gerarImagemChuva([])).toBeNull();
    const img = gerarImagemChuva([{ lon: -60, lat: -5, mm: 10 }, { lon: -58.5, lat: -5, mm: 3 }]);
    expect(img).not.toBeNull();
    expect(img?.url.startsWith('data:image/png')).toBeTrue();
    expect(img?.coordinates.length).toBe(4);
    expect(pixelTransparente().startsWith('data:image/png')).toBeTrue();
  });
});

describe('popup.util', () => {
  it('descreve um foco de calor', () => {
    const linhas = linhasDe('queimada', { satelite: 'noaa20', intensidade: 12.5, estado: 'PA', municipio: 'Uruará', data: '2026-10-20T15:00:00.000Z', fonte: 'NASA FIRMS' });
    const mapa = new Map(linhas.map((l) => [l.rotulo, l.valor]));
    expect(mapa.get('Satélite')).toBe('NOAA-20 (VIIRS)');
    expect(mapa.get('Município')).toBe('Uruará');
    expect(mapa.get('Intensidade (FRP)')).toBe('12,5 MW');
    expect(mapa.get('Data e hora')).toContain('11:00');
  });
  it('descreve a qualidade do ar e mostra traco quando falta informacao', () => {
    const linhas = linhasDe('ar', { pm2_5: 18.2 });
    expect(linhas[1].valor).toContain('18,2');
    expect(linhas[0].valor).toBe('-');
  });
  it('descreve o risco de cheia e o desmatamento', () => {
    const cheia = new Map(linhasDe('cheia', { nivel: 'alto', razao: 2.35, vazao: 1200, vazao_media: 510, estado: 'AM', fonte: 'Open-Meteo Flood (GloFAS)' }).map((l) => [l.rotulo, l.valor]));
    expect(cheia.get('Nível')).toBe('Alto');
    expect(cheia.get('Razão (vazão / média 30 dias)')).toBe('2,35');
    const desm = new Map(linhasDe('desmatamento', { area_ha: 42.5, classe: 'DESMATAMENTO_CR', municipio: 'Lábrea', estado: 'AM' }).map((l) => [l.rotulo, l.valor]));
    expect(desm.get('Área')).toBe('42,5 ha');
    expect(desm.get('Município')).toBe('Lábrea');
  });
});