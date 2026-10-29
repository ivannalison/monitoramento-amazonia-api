import { Injectable, inject } from '@angular/core';
import { Observable } from 'rxjs';
import { ROTAS } from '../config/rotas-api';
import { RespostaFontes } from '../models/api.models';
import { ApiService } from './api.service';

@Injectable({ providedIn: 'root' })
export class FontesService {
  private readonly api = inject(ApiService);
  carregar(): Observable<RespostaFontes> {
    return this.api.get<RespostaFontes>(ROTAS.fontes);
  }
}