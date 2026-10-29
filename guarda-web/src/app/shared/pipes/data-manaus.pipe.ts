import { Pipe, PipeTransform } from '@angular/core';

// Datas da API vem em UTC: mostramos no fuso de Manaus
@Pipe({ name: 'dataManaus' })
export class DataManausPipe implements PipeTransform {
  transform(valor: string | Date | null | undefined, formato: 'curto' | 'longo' = 'curto'): string {
    if (!valor) return '-';
    const d = valor instanceof Date ? valor : new Date(valor);
    if (Number.isNaN(d.getTime())) return '-';
    const opcoes: Intl.DateTimeFormatOptions =
      formato === 'longo'
        ? { day: '2-digit', month: '2-digit', year: 'numeric', hour: '2-digit', minute: '2-digit', timeZone: 'America/Manaus' }
        : { day: '2-digit', month: '2-digit', hour: '2-digit', minute: '2-digit', timeZone: 'America/Manaus' };
    return new Intl.DateTimeFormat('pt-BR', opcoes).format(d);
  }
}