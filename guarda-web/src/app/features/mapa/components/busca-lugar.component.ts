import { ChangeDetectionStrategy, Component, inject, signal } from '@angular/core';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { Subject, catchError, debounceTime, distinctUntilChanged, finalize, map, of, switchMap } from 'rxjs';
import { NOMES_ESTADOS } from '../../../core/config/camadas.config';
import { MunicipioResumo } from '../../../core/models/api.models';
import { FiltrosService, Lugar } from '../../../core/services/filtros.service';
import { MunicipiosService } from '../../../core/services/municipios.service';
import { semAcento } from '../../../core/util/texto.util';

function deMunicipio(m: MunicipioResumo): Lugar {
  return { tipo: 'municipio', nome: m.nome, uf: m.uf, codigo: m.codigo, bbox: m.bbox };
}

@Component({
  selector: 'guarda-busca-lugar',
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    @if (filtros.lugar(); as lugar) {
      <div class="escolhido">
        <span>{{ lugar.nome }} <small>({{ lugar.tipo === 'estado' ? 'estado' : lugar.uf }})</small></span>
        <button type="button" class="limpar" (click)="filtros.escolherLugar(null)" aria-label="Remover o lugar buscado">&times;</button>
      </div>
    } @else {
      <input type="search" placeholder="Buscar cidade ou estado" [value]="termo()" (input)="digitar($event)" (keydown.enter)="escolherPrimeiro()" (keydown.escape)="limpar()" aria-label="Buscar cidade ou estado" autocomplete="off" />
      @if (buscando()) { <small class="suave">Buscando...</small> }
      @if (resultados().length > 0) {
        <ul class="resultados" role="listbox" aria-label="Lugares encontrados">
          @for (r of resultados(); track r.tipo + (r.codigo ?? r.uf)) {
            <li><button type="button" role="option" (click)="escolher(r)">{{ r.nome }} <small>{{ r.tipo === 'estado' ? 'estado' : r.uf }}</small></button></li>
          }
        </ul>
      } @else if (termo().trim().length >= 2 && !buscando()) {
        <small class="suave">Nenhum lugar encontrado.</small>
      }
    }
  `,
  styles: [`
    input { width: 100%; border: 1px solid #aab2bb; border-radius: 4px; padding: 7px 9px; background: #fff; }
    .escolhido { display: flex; justify-content: space-between; align-items: center; gap: 8px; border: 1px solid #aab2bb; border-radius: 4px; padding: 5px 9px; background: #f5f7f8; }
    .limpar { background: none; border: 0; font-size: 20px; line-height: 1; cursor: pointer; color: #52606d; }
    .resultados { list-style: none; margin: 4px 0 0; padding: 0; max-height: 190px; overflow: auto; border: 1px solid #d0d5da; border-radius: 4px; }
    .resultados button { width: 100%; text-align: left; background: none; border: 0; padding: 7px 10px; cursor: pointer; }
    .resultados button:hover { background: #eef2f4; }
    .suave { color: var(--texto-suave); display: block; margin-top: 4px; }
  `],
})
export class BuscaLugarComponent {
  private readonly servico = inject(MunicipiosService);
  protected readonly filtros = inject(FiltrosService);
  protected readonly termo = signal('');
  protected readonly resultados = signal<Lugar[]>([]);
  protected readonly buscando = signal(false);
  private readonly digitado$ = new Subject<string>();

  constructor() {
    this.digitado$
      .pipe(
        debounceTime(250),
        distinctUntilChanged(),
        switchMap((t) => {
          const termo = t.trim();
          if (termo.length < 2) return of<Lugar[]>([]);
          const estados = this.buscarEstados(termo);
          this.buscando.set(true);
          return this.servico.buscar(termo, null, 8).pipe(
            map((ms) => [...estados, ...ms.map(deMunicipio)]),
            catchError(() => of(estados)),
            finalize(() => this.buscando.set(false)),
          );
        }),
        takeUntilDestroyed(),
      )
      .subscribe((lista) => this.resultados.set(lista));
  }

  private buscarEstados(termo: string): Lugar[] {
    const t = semAcento(termo);
    return Object.entries(NOMES_ESTADOS)
      .filter(([uf, nome]) => uf.toLowerCase() === t || semAcento(nome).includes(t))
      .slice(0, 3)
      .map(([uf, nome]): Lugar => ({ tipo: 'estado', nome, uf, bbox: null }));
  }

  protected digitar(evento: Event): void {
    const valor = (evento.target as HTMLInputElement).value;
    this.termo.set(valor);
    this.digitado$.next(valor);
  }

  protected escolher(lugar: Lugar): void {
    this.filtros.escolherLugar(lugar);
    this.limpar();
  }

  protected escolherPrimeiro(): void {
    const primeiro = this.resultados()[0];
    if (primeiro) this.escolher(primeiro);
  }

  protected limpar(): void {
    this.termo.set('');
    this.resultados.set([]);
  }
}