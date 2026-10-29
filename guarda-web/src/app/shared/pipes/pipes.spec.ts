import { AtualizadoHaPipe } from './atualizado-ha.pipe';
import { DataManausPipe } from './data-manaus.pipe';
import { NumeroPipe } from './numero.pipe';

describe('DataManausPipe', () => {
  const pipe = new DataManausPipe();
  it('converte UTC para o horario de Manaus (UTC-4)', () => {
    const texto = pipe.transform('2026-10-20T15:00:00.000Z', 'longo');
    expect(texto).toContain('20/10/2026');
    expect(texto).toContain('11:00');
  });
  it('trata valores vazios ou invalidos', () => {
    expect(pipe.transform(null)).toBe('-');
    expect(pipe.transform('nao-e-data')).toBe('-');
  });
});

describe('AtualizadoHaPipe', () => {
  const pipe = new AtualizadoHaPipe();
  const agora = new Date('2026-10-28T12:00:00.000Z').getTime();
  it('descreve minutos, horas e dias', () => {
    expect(pipe.transform('2026-10-28T11:55:00.000Z', agora)).toBe('há 5 min');
    expect(pipe.transform('2026-10-28T09:00:00.000Z', agora)).toBe('há 3 h');
    expect(pipe.transform('2026-10-20T12:00:00.000Z', agora)).toBe('há 8 dias');
    expect(pipe.transform(null, agora)).toBe('sem registro');
  });
});

describe('NumeroPipe', () => {
  const pipe = new NumeroPipe();
  it('formata em pt-BR e mostra zero', () => {
    expect(pipe.transform(0)).toBe('0');
    expect(pipe.transform(1234.5, 1)).toBe('1.234,5');
    expect(pipe.transform(null)).toBe('-');
  });
});