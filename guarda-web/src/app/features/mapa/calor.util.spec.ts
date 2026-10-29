import { hexParaRgb, rampaCalor } from './calor.util';

describe('calor.util', () => {
  it('converte cor hexadecimal em RGB', () => {
    expect(hexParaRgb('#ff6d00')).toEqual([255, 109, 0]);
    expect(hexParaRgb('#fff')).toEqual([255, 255, 255]);
  });

  it('a rampa comeca transparente e termina forte', () => {
    const r = rampaCalor('#e11d48');
    expect(r.slice(0, 3)).toEqual(['interpolate', ['linear'], ['heatmap-density']]);
    expect(String(r[4])).toMatch(/,0\)$/);
    expect(String(r[r.length - 1])).toMatch(/^rgba\(\d+,\d+,\d+,0\.\d+\)$/);
  });
});