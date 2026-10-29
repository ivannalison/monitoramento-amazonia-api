import { Injectable, inject } from '@angular/core';
import { Observable } from 'rxjs';
import { ROTAS } from '../config/rotas-api';
import { ColecaoPontos, PropsAr, PropsCheia, PropsChuva, PropsDesmatamento, PropsQueimada } from '../models/api.models';
import { ApiService } from './api.service';

export interface ParamsArea {
  bbox?: string | null;
  limite?: number;
}
export interface ParamsQueimadas extends ParamsArea {
  satelite?: string | null;
  horas?: number;
}

@Injectable({ providedIn: 'root' })
export class DadosMapaService {
  private readonly api = inject(ApiService);

  queimadas(p: ParamsQueimadas): Observable<ColecaoPontos<PropsQueimada>> {
    return this.api.get<ColecaoPontos<PropsQueimada>>(ROTAS.queimadasGeojson, { bbox: p.bbox, satelite: p.satelite, horas: p.horas, limite: p.limite });
  }

  ar(): Observable<ColecaoPontos<PropsAr>> {
    return this.api.get<ColecaoPontos<PropsAr>>(ROTAS.qualidadeArGeojson);
  }

  chuva(hora?: string | null): Observable<ColecaoPontos<PropsChuva>> {
    return this.api.get<ColecaoPontos<PropsChuva>>(ROTAS.chuvasGeojson, { hora });
  }

  // Por padrao a API so devolve os rios acima do normal
  cheias(): Observable<ColecaoPontos<PropsCheia>> {
    return this.api.get<ColecaoPontos<PropsCheia>>(ROTAS.cheiasGeojson);
  }

  desmatamento(p: ParamsArea): Observable<ColecaoPontos<PropsDesmatamento>> {
    return this.api.get<ColecaoPontos<PropsDesmatamento>>(ROTAS.desmatamentoGeojson, { bbox: p.bbox, limite: p.limite });
  }
}