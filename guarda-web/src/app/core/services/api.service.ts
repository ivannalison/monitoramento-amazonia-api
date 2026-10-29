import { HttpClient, HttpParams } from '@angular/common/http';
import { Injectable, inject } from '@angular/core';
import { Observable } from 'rxjs';
import { environment } from '../../../environments/environment';

export type ParamsApi = Record<string, string | number | boolean | null | undefined>;

@Injectable({ providedIn: 'root' })
export class ApiService {
  private readonly http = inject(HttpClient);

  get<T>(caminho: string, params: ParamsApi = {}): Observable<T> {
    let hp = new HttpParams();
    for (const [chave, valor] of Object.entries(params)) {
      if (valor !== null && valor !== undefined && valor !== '') hp = hp.set(chave, String(valor));
    }
    return this.http.get<T>(environment.apiUrl + caminho, { params: hp });
  }
}