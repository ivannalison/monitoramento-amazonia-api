import { Injectable, inject } from '@angular/core';
import { Observable, map } from 'rxjs';
import { ROTAS } from '../config/rotas-api';
import { MunicipioResumo, RespostaMunicipios } from '../models/api.models';
import { ApiService } from './api.service';

@Injectable({ providedIn: 'root' })
export class MunicipiosService {
  private readonly api = inject(ApiService);

  buscar(termo: string, estado?: string | null, limite = 8): Observable<MunicipioResumo[]> {
    return this.api
      .get<RespostaMunicipios>(ROTAS.municipios, { busca: termo.trim(), estado, limite })
      .pipe(map((r) => r.municipios));
  }
}