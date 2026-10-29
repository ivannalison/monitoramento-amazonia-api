import { Injectable, signal } from '@angular/core';
import { CamadaId } from '../config/camadas.config';
import { Caixa } from '../util/bbox.util';

export interface Lugar {
  tipo: 'municipio' | 'estado';
  nome: string;
  uf: string;
  codigo?: string;
  bbox: Caixa | null;
}

// Estado global da tela: camadas marcadas e lugar buscado
@Injectable({ providedIn: 'root' })
export class FiltrosService {
  // O mapa abre limpo: o usuario marca o que quer ver
  readonly camadasAtivas = signal<CamadaId[]>([]);
  readonly lugar = signal<Lugar | null>(null);
  // Quantos pontos cada camada tem na area visivel (o mapa preenche, a legenda mostra)
  readonly contagens = signal<Record<string, number>>({});

  ativa(id: CamadaId): boolean {
    return this.camadasAtivas().includes(id);
  }

  // Cada caixinha liga e desliga a sua camada; todas podem ficar juntas
  alternar(id: CamadaId): void {
    this.camadasAtivas.update((lista) => (lista.includes(id) ? lista.filter((x) => x !== id) : [...lista, id]));
  }

  escolherLugar(lugar: Lugar | null): void {
    this.lugar.set(lugar);
  }
}