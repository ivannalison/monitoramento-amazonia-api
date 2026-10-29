import { Pipe, PipeTransform } from '@angular/core';
import { horasDesde } from '../../core/util/defasagem.util';

@Pipe({ name: 'atualizadoHa' })
export class AtualizadoHaPipe implements PipeTransform {
  transform(iso: string | null | undefined, agora: number = Date.now()): string {
    const h = horasDesde(iso, agora);
    if (h === null) return 'sem registro';
    const min = Math.round(h * 60);
    if (min < 1) return 'agora mesmo';
    if (min < 60) return 'há ' + min + ' min';
    const hr = Math.floor(h);
    if (hr < 48) return 'há ' + hr + ' h';
    return 'há ' + Math.floor(hr / 24) + ' dias';
  }
}