import { AfterViewInit, ChangeDetectionStrategy, Component, DestroyRef, ElementRef, NgZone, OnDestroy, computed, effect, inject, input, signal, untracked, viewChild } from '@angular/core';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import type { GeoJSONSource, ImageSource, Map as MapaMapLibre, MapMouseEvent, Marker, Popup } from 'maplibre-gl';
import { EMPTY, Observable, Subject, catchError, debounceTime, defer, finalize, merge, switchMap, tap } from 'rxjs';
import { CAMADAS_DA_FONTE, CamadaId, SATELITES_IDS } from '../../../core/config/camadas.config';
import { ColecaoGeo, PontoGeo, PropsAr } from '../../../core/models/api.models';
import { AtualizacaoService } from '../../../core/services/atualizacao.service';
import { ContornosService } from '../../../core/services/contornos.service';
import { DadosMapaService } from '../../../core/services/dados-mapa.service';
import { FiltrosService, Lugar } from '../../../core/services/filtros.service';
import { Caixa, caixaDeCoordenadas } from '../../../core/util/bbox.util';
import { faixaDoAr, formatarPm } from '../ar.util';
import { COORDENADAS_CHUVA, PontoChuva, gerarImagemChuva, pixelTransparente } from '../chuva.util';
import { ESTILO_BASE } from '../mapa.estilo';
import { FONTE_DA_CAMADA, IDS_CLIQUE, TIPO_DO_LAYER, TODAS, VAZIO, adicionarFontesECamadas, definirVisibilidade } from '../mapa.camadas';
import { TITULOS, TipoPopup, linhasDe } from '../popup.util';

@Component({
  selector: 'guarda-mapa-canvas',
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <div #recipiente class="mapa" role="application" aria-label="Mapa interativo da Amazônia Legal"></div>
    <div class="chips" aria-live="polite">
      @if (carregando() > 0) { <span class="chip">Carregando...</span> }
      @if (truncado()) { <span class="chip aviso">Há mais pontos nesta área do que cabem na tela: mostrando os mais relevantes. Aproxime o mapa para ver todos.</span> }
      @if (semChuva()) { <span class="chip aviso">Sem dados de chuva para esta hora.</span> }
      @if (semCheia()) { <span class="chip">Nenhum rio acima do normal no momento.</span> }
      @if (erroMapa(); as msg) { <span class="chip erro">{{ msg }}</span> }
    </div>
    @if (dica(); as d) { <div class="dica" [style.left.px]="d.x + 14" [style.top.px]="d.y + 14">{{ d.texto }}</div> }
  `,
  styles: [`
    :host { display: block; position: absolute; inset: 0; }
    .mapa { position: absolute; inset: 0; }
    .chips { position: absolute; top: 12px; left: 50%; transform: translateX(-50%); display: flex; flex-direction: column; align-items: center; gap: 6px; pointer-events: none; z-index: 3; max-width: 70%; }
    .chip { background: rgba(255, 255, 255, 0.95); color: var(--texto); border: 1px solid var(--borda); border-radius: 999px; padding: 5px 14px; font-size: 14px; text-align: center; }
    .chip.aviso { border-color: var(--alerta); }
    .chip.erro { border-color: var(--erro); } @media (max-width: 720px), (max-height: 560px) { .chips { top: 56px; max-width: 94%; } }
    .dica { position: absolute; z-index: 5; pointer-events: none; background: rgba(32, 38, 43, 0.92); color: #fff; padding: 4px 9px; border-radius: 4px; font-size: 14px; white-space: nowrap; }
  `],
})
export class MapaCanvasComponent implements AfterViewInit, OnDestroy {
  protected readonly filtros = inject(FiltrosService);
  private readonly dados = inject(DadosMapaService);
  private readonly contornos = inject(ContornosService);
  private readonly atualizacao = inject(AtualizacaoService);
  private readonly zona = inject(NgZone);
  private readonly destroyRef = inject(DestroyRef);
  private readonly recipiente = viewChild.required<ElementRef<HTMLDivElement>>('recipiente');

  /** hora da previsao de chuva (AAAA-MM-DDTHH:00); null = hora atual */
  readonly horaChuva = input<string | null>(null);

  protected readonly carregando = signal(0);
  protected readonly truncadoPor = signal<Record<string, boolean>>({});
  protected readonly truncado = computed(() => Object.values(this.truncadoPor()).some((v) => v));
  protected readonly semChuva = signal(false);
  protected readonly semCheia = signal(false);
  protected readonly erroMapa = signal<string | null>(null);
  protected readonly dica = signal<{ x: number; y: number; texto: string } | null>(null);
  private readonly pronto = signal(false);

  private lib?: typeof import('maplibre-gl');
  private mapa?: MapaMapLibre;
  private popup?: Popup;
  private marcasAr: Marker[] = [];
  private arPontos: PontoGeo<PropsAr>[] = [];
  private contornosEstados: ColecaoGeo | null = null;
  private codigoMunicipio = '';
  private readonly areaMudou$ = new Subject<void>();
  private observador?: ResizeObserver;

  constructor() {
    this.areaMudou$
      .pipe(
        debounceTime(350),
        tap(() => this.atualizarMarcasAr()),
        switchMap(() => merge(this.carregarQueimadas(), this.carregarDesmatamento())),
        takeUntilDestroyed(this.destroyRef),
      )
      .subscribe();

    effect(() => {
      if (!this.pronto()) return;
      const ativas = this.filtros.camadasAtivas();
      untracked(() => this.sincronizar(ativas));
    });
    effect(() => {
      if (!this.pronto()) return;
      const lugar = this.filtros.lugar();
      untracked(() => this.aplicarLugar(lugar));
    });
    effect(() => {
      const hora = this.horaChuva();
      if (!this.pronto()) return;
      untracked(() => {
        if (this.filtros.ativa('chuva')) this.carregarChuva(hora).subscribe();
      });
    });
    this.atualizacao.mudancas$.pipe(takeUntilDestroyed(this.destroyRef)).subscribe((ids) => this.aoMudarFontes(ids));
  }

  ngAfterViewInit(): void {
    void this.iniciarMapa();
  }

  ngOnDestroy(): void {
    this.observador?.disconnect();
    for (const m of this.marcasAr) m.remove();
    this.popup?.remove();
    this.mapa?.remove();
  }

  private async iniciarMapa(): Promise<void> {
    try {
      const modulo = await import('maplibre-gl');
      const candidato = (modulo as unknown as { default?: typeof modulo }).default;
      const lib = candidato && candidato.Map ? candidato : modulo;
      this.lib = lib; this.configurarWorker(lib);
      const mapa = this.zona.runOutsideAngular(
        () =>
          new lib.Map({
            container: this.recipiente().nativeElement,
            style: ESTILO_BASE,
            bounds: [[-74.5, -17], [-43.5, 5.5]],
            fitBoundsOptions: { padding: 10 },
            minZoom: 3,
            maxZoom: 15,
            attributionControl: { compact: true },
          }),
      );
      this.mapa = mapa;
      mapa.addControl(new lib.NavigationControl({ showCompass: false }), 'bottom-right');
      mapa.on('load', () => this.aoCarregar()); mapa.on('error', (e) => this.aoErroMapa(e));
      mapa.on('moveend', () => this.areaMudou$.next());
      mapa.on('click', (e) => this.aoClicar(e));
      this.observador = new ResizeObserver(() => mapa.resize());
      this.observador.observe(this.recipiente().nativeElement);
    } catch {
      this.erroMapa.set('Não foi possível iniciar o mapa neste navegador (WebGL indisponível?).');
    }
  }

  // O worker do MapLibre fica em public/ (o empacotador do Angular perde o arquivo e o mapa nao desenha os dados)
  private configurarWorker(lib: typeof import('maplibre-gl')): void {
    try {
      const url = new URL('maplibre-gl-worker.mjs', document.baseURI).href;
      const l = lib as unknown as { setWorkerUrl?: (u: string) => void };
      if (typeof l.setWorkerUrl === 'function') l.setWorkerUrl(url);
    } catch {
      /* segue com o worker padrao */
    }
  }

  // Erros do mapa vao para o console (F12) e, se nao forem so de imagem do mapa base, aparecem na tela
  private aoErroMapa(e: unknown): void {
    console.error('[GUARDA mapa]', e);
    const msg = String((e as { error?: { message?: string } } | null)?.error?.message ?? e);
    if (!/tile|404|Failed to fetch|NetworkError|AJAXError|Load failed/i.test(msg)) this.erroMapa.set('Erro no mapa: ' + msg.slice(0, 140));
  }

  private aoCarregar(): void {
    const mapa = this.mapa;
    if (!mapa) return;
    adicionarFontesECamadas(mapa);
    mapa.on('mousemove', 'municipios-fill', (e) => {
      const p = e.features?.[0]?.properties;
      const nome = p?.['nome'];
      this.dica.set(typeof nome === 'string' ? { x: e.point.x, y: e.point.y, texto: nome + ' - ' + String(p?.['uf'] ?? '') } : null);
    });
    mapa.on('mouseleave', 'municipios-fill', () => this.dica.set(null));
    for (const id of IDS_CLIQUE) {
      mapa.on('mouseenter', id, () => (mapa.getCanvas().style.cursor = 'pointer'));
      mapa.on('mouseleave', id, () => (mapa.getCanvas().style.cursor = ''));
    }
    this.contornos
      .amazoniaLegal()
      .pipe(
        catchError(() => {
          // sem o arquivo do contorno: usa a linha dos estados no lugar
          if (this.mapa) this.mapa.setLayoutProperty('estados-linha', 'visibility', 'visible');
          return EMPTY;
        }),
        takeUntilDestroyed(this.destroyRef),
      )
      .subscribe((geo) => this.definirDados('amazonia-legal', geo));
    this.contornos
      .estados()
      .pipe(catchError(() => EMPTY), takeUntilDestroyed(this.destroyRef))
      .subscribe((geo) => {
        this.contornosEstados = geo;
        this.definirDados('estados', geo);
        this.aplicarLugar(this.filtros.lugar());
      });
    this.contornos
      .municipios()
      .pipe(catchError(() => EMPTY), takeUntilDestroyed(this.destroyRef))
      .subscribe((geo) => this.definirDados('municipios', geo));
    this.pronto.set(true);
  }

  private aoClicar(e: MapMouseEvent): void {
    const mapa = this.mapa;
    if (!mapa) return;
    const f = mapa.queryRenderedFeatures(e.point, { layers: IDS_CLIQUE.filter((id) => mapa.getLayer(id)) })[0];
    if (!f) return;
    const tipo: TipoPopup = TIPO_DO_LAYER[f.layer.id] ?? 'queimada';
    const coords = (f.geometry as unknown as { coordinates: [number, number] }).coordinates;
    this.abrirPopup(tipo, (f.properties ?? {}) as Record<string, unknown>, coords);
  }

  private abrirPopup(tipo: TipoPopup, props: Record<string, unknown>, coords: [number, number]): void {
    const mapa = this.mapa;
    const lib = this.lib;
    if (!mapa || !lib) return;
    const raiz = document.createElement('div');
    raiz.className = 'popup-guarda';
    const titulo = document.createElement('strong');
    titulo.textContent = TITULOS[tipo];
    raiz.appendChild(titulo);
    for (const l of linhasDe(tipo, props)) {
      const linha = document.createElement('div');
      linha.className = 'linha';
      const rotulo = document.createElement('span');
      rotulo.textContent = l.rotulo;
      const valor = document.createElement('b');
      valor.textContent = l.valor;
      linha.appendChild(rotulo);
      linha.appendChild(valor);
      raiz.appendChild(linha);
    }
    this.popup?.remove();
    this.popup = new lib.Popup({ maxWidth: '320px' }).setLngLat(coords).setDOMContent(raiz).addTo(mapa);
  }

  // Liga/desliga as camadas e pede os dados de cada uma
  private sincronizar(ativas: CamadaId[]): void {
    const mapa = this.mapa;
    if (!mapa) return;
    for (const id of TODAS) definirVisibilidade(mapa, id, ativas.includes(id));
    for (const id of [...SATELITES_IDS, 'desmatamento'] as CamadaId[]) {
      if (!ativas.includes(id)) this.definirDados(FONTE_DA_CAMADA[id], VAZIO);
    }
    if (!ativas.includes('chuva')) this.semChuva.set(false); this.filtros.contagens.update((c) => Object.fromEntries(Object.entries(c).filter(([k]) => ativas.includes(k as CamadaId))));
    if (!ativas.includes('cheias')) this.semCheia.set(false);
    this.truncadoPor.update((t) => {
      const novo = { ...t };
      for (const id of [...SATELITES_IDS, 'desmatamento'] as CamadaId[]) if (!ativas.includes(id)) delete novo[id];
      return novo;
    });
    this.areaMudou$.next();
    if (ativas.includes('ar')) this.carregarAr().subscribe();
    if (ativas.includes('chuva')) this.carregarChuva(this.horaChuva()).subscribe();
    if (ativas.includes('cheias')) this.carregarCheias().subscribe();
    this.atualizarMarcasAr();
  }

  // Vai ate a cidade ou o estado buscado e desenha o contorno
  private aplicarLugar(lugar: Lugar | null): void {
    const mapa = this.mapa;
    if (!mapa) return;
    mapa.setFilter('estados-destaque', ['==', ['get', 'sigla'], lugar && lugar.tipo === 'estado' ? lugar.uf : ''] as never);
    const codigo = lugar && lugar.tipo === 'municipio' ? (lugar.codigo ?? '') : '';
    if (codigo !== this.codigoMunicipio) {
      this.codigoMunicipio = codigo;
      if (!codigo) {
        this.definirDados('municipio-sel', VAZIO);
      } else {
        this.contornos
          .municipio(codigo)
          .pipe(catchError(() => EMPTY), takeUntilDestroyed(this.destroyRef))
          .subscribe((geo) => this.definirDados('municipio-sel', geo));
      }
    }
    if (!lugar) return;
    let caixa: Caixa | null = lugar.bbox;
    if (!caixa && lugar.tipo === 'estado') {
      if (!this.contornosEstados) return;
      const f = this.contornosEstados.features.find((x) => x.properties['sigla'] === lugar.uf);
      caixa = f ? caixaDeCoordenadas(f.geometry.coordinates) : null;
    }
    if (!caixa) return;
    mapa.fitBounds([[caixa[0], caixa[1]], [caixa[2], caixa[3]]], { padding: 50, maxZoom: lugar.tipo === 'municipio' ? 10 : 8, duration: 900 });
  }

  private bboxAtual(): string | null {
    const mapa = this.mapa;
    if (!mapa) return null;
    const b = mapa.getBounds();
    const w = Math.max(-180, b.getWest());
    const s = Math.max(-90, b.getSouth());
    const e = Math.min(180, b.getEast());
    const n = Math.min(90, b.getNorth());
    return [w, s, e, n].map((v) => v.toFixed(4)).join(',');
  }

  private rastrear<T>(origem: Observable<T>): Observable<T> {
    return defer(() => {
      this.carregando.update((n) => n + 1);
      return origem.pipe(finalize(() => this.carregando.update((n) => Math.max(0, n - 1))));
    });
  }

  // Uma consulta por satelite marcado, so da area visivel (ultimas 24 h)
  private carregarQueimadas(): Observable<unknown> {
    const mapa = this.mapa;
    if (!mapa) return EMPTY;
    const ativos = SATELITES_IDS.filter((id) => this.filtros.ativa(id));
    if (ativos.length === 0) return EMPTY;
    const bbox = this.bboxAtual();
    const limite = window.innerWidth < 720 ? 2000 : 5000;
    return new Observable<unknown>((assinante) => {
      const subs = ativos.map((id) =>
        this.rastrear(this.dados.queimadas({ bbox, satelite: id, horas: 24, limite }))
          .pipe(catchError(() => EMPTY))
          .subscribe((r) => {
            this.definirDados(FONTE_DA_CAMADA[id], r);
            this.truncadoPor.update((t) => ({ ...t, [id]: r.truncado === true })); this.filtros.contagens.update((c) => ({ ...c, [id]: r.features.length }));
          }),
      );
      return () => subs.forEach((s) => s.unsubscribe());
    });
  }

  // Alertas de desmatamento (DETER) so da area visivel
  private carregarDesmatamento(): Observable<unknown> {
    if (!this.mapa || !this.filtros.ativa('desmatamento')) return EMPTY;
    const limite = window.innerWidth < 720 ? 2000 : 5000;
    return this.rastrear(this.dados.desmatamento({ bbox: this.bboxAtual(), limite })).pipe(
      tap((r) => {
        this.definirDados('desmatamento', r);
        this.truncadoPor.update((t) => ({ ...t, desmatamento: r.truncado === true })); this.filtros.contagens.update((c) => ({ ...c, desmatamento: r.features.length }));
      }),
      catchError(() => EMPTY),
    );
  }

  private carregarAr(): Observable<unknown> {
    return this.rastrear(this.dados.ar()).pipe(
      tap((r) => {
        this.arPontos = r.features;
        this.definirDados('ar', r);
        this.atualizarMarcasAr();
      }),
      catchError(() => EMPTY),
    );
  }

  private carregarChuva(hora: string | null): Observable<unknown> {
    if (!this.mapa || !this.filtros.ativa('chuva')) return EMPTY;
    return this.rastrear(this.dados.chuva(hora)).pipe(
      tap((r) => {
        const pontos: PontoChuva[] = r.features.map((f) => ({ lon: f.geometry.coordinates[0], lat: f.geometry.coordinates[1], mm: f.properties.precipitacao_mm }));
        this.semChuva.set(pontos.length === 0);
        const img = gerarImagemChuva(pontos) ?? { url: pixelTransparente(), coordinates: COORDENADAS_CHUVA };
        (this.mapa?.getSource('chuva') as ImageSource | undefined)?.updateImage(img as never);
      }),
      catchError(() => EMPTY),
    );
  }

  // A API so devolve rios acima do normal: se nao houver nenhum, avisa
  private carregarCheias(): Observable<unknown> {
    if (!this.mapa || !this.filtros.ativa('cheias')) return EMPTY;
    return this.rastrear(this.dados.cheias()).pipe(
      tap((r) => {
        this.semCheia.set(r.features.length === 0);
        this.definirDados('cheias', r);
      }),
      catchError(() => EMPTY),
    );
  }

  // Numeros dentro dos pontos de qualidade do ar (so ao aproximar, como no SELVA)
  private atualizarMarcasAr(): void {
    const mapa = this.mapa;
    const lib = this.lib;
    if (!mapa || !lib) return;
    for (const m of this.marcasAr) m.remove();
    this.marcasAr = [];
    if (!this.filtros.ativa('ar') || mapa.getZoom() < 5.5) return;
    const b = mapa.getBounds();
    for (const f of this.arPontos) {
      const [lon, lat] = f.geometry.coordinates;
      if (lon < b.getWest() || lon > b.getEast() || lat < b.getSouth() || lat > b.getNorth()) continue;
      const faixa = faixaDoAr(f.properties.pm2_5);
      const el = document.createElement('div');
      el.className = 'marca-ar';
      el.textContent = formatarPm(f.properties.pm2_5);
      el.style.background = faixa.cor;
      el.style.color = faixa.texto;
      el.title = faixa.nome + ' - clique para ver os detalhes';
      el.addEventListener('click', (ev) => {
        ev.stopPropagation();
        this.abrirPopup('ar', f.properties as unknown as Record<string, unknown>, [lon, lat]);
      });
      this.marcasAr.push(new lib.Marker({ element: el }).setLngLat([lon, lat]).addTo(mapa));
    }
  }

  private definirDados(id: string, dados: unknown): void {
    (this.mapa?.getSource(id) as GeoJSONSource | undefined)?.setData(dados as never);
  }

  // Coleta nova na API: recarrega so o que mudou
  private aoMudarFontes(ids: string[]): void {
    if (!this.pronto()) return;
    const camadas = ids.flatMap((id) => CAMADAS_DA_FONTE[id] ?? []);
    if (camadas.some((c) => SATELITES_IDS.includes(c) || c === 'desmatamento')) this.areaMudou$.next();
    if (camadas.includes('ar') && this.filtros.ativa('ar')) this.carregarAr().subscribe();
    if (camadas.includes('chuva') && this.filtros.ativa('chuva')) this.carregarChuva(this.horaChuva()).subscribe();
    if (camadas.includes('cheias') && this.filtros.ativa('cheias')) this.carregarCheias().subscribe();
  }
}