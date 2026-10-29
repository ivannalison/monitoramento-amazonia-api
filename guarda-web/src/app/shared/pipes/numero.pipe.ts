import { Pipe, PipeTransform } from '@angular/core';

@Pipe({ name: 'numero' })
export class NumeroPipe implements PipeTransform {
  transform(valor: number | null | undefined, casas = 0): string {
    if (valor === null || valor === undefined || Number.isNaN(valor)) return '-';
    return valor.toLocaleString('pt-BR', { minimumFractionDigits: 0, maximumFractionDigits: casas });
  }
}