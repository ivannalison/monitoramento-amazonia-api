import { HttpClient } from '@angular/common/http';
import { Injectable, inject } from '@angular/core';
import { Observable } from 'rxjs';
import { ROTAS } from '../config/rotas-api';
import { ColecaoGeo } from '../models/api.models';
import { ApiService } from './api.service';

@Injectable({ providedIn: 'root' })
export class ContornosService {
  private readonly api = inject(ApiService);
  private readonly http = inject(HttpClient);

  estados(): Observable<ColecaoGeo> { return this.api.get<ColecaoGeo>(ROTAS.contornosEstados); }
  municipio(codigo: string): Observable<ColecaoGeo> { return this.api.get<ColecaoGeo>(ROTAS.municipiosGeojson, { codigo }); }
  // Todos os municipios da Amazonia Legal (limites finos no mapa; o nome aparece ao passar o mouse)
  municipios(): Observable<ColecaoGeo> { return this.api.get<ColecaoGeo>(ROTAS.municipiosGeojson); }
  // Contorno unico da Amazonia Legal (arquivo gerado por scripts/gerar-contorno.mjs)
  amazoniaLegal(): Observable<ColecaoGeo> { return this.http.get<ColecaoGeo>('geo/amazonia-legal.geojson'); }
}