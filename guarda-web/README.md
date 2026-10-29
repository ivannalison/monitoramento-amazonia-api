# GUARDA (guarda-web)

Mapa da Amazônia Legal no estilo do SELVA: tela cheia, tema claro, uma caixa branca com a busca e as opções. O mapa abre limpo e o usuário marca o que quer ver: chuva, qualidade do ar, queimadas (MODIS, NOAA-20 e Suomi), risco de cheia e desmatamento (DETER). Todas as opções combinam entre si.
Angular 20 (componentes standalone, signals) + MapLibre GL. Somente leitura: consome a API `monitoramento-amazonia-api`.

## Como rodar

```powershell
npm install
node scripts/gerar-contorno.mjs   # gera o contorno da Amazônia Legal (le os municípios da API, em ../monitoramento-amazonia-api)
node scripts/copiar-worker.mjs    # copia o worker do MapLibre para public/ (rode de novo se atualizar o maplibre-gl)
npm start                         # http://localhost:4200  (a API precisa estar em http://localhost:3000)
npm run build                     # build de produção em dist/
npm test                          # testes unitários (Karma + Chrome headless)
npm run testar:api                # teste de contrato contra a API (GUARDA_API=http://localhost:3000)
```

A URL da API fica em `src/environments/environment.ts` (local) e `environment.prod.ts` (produção).

## Estrutura

```text
src/app/
  core/        config (rotas da API, opções do mapa), models, services, interceptors (erro e cache), util
  shared/      toast, modal e pipes
  features/
    mapa/      página única + components (mapa-canvas, caixa-opcoes, busca-lugar, legenda,
               linha-do-tempo, marca) + utilitários (chuva, ar, popup, camadas do MapLibre)
    sobre/     conteúdo do modal "Sobre"
public/geo/amazonia-legal.geojson   contorno gerado por scripts/gerar-contorno.mjs
scripts/       testar-api.mjs (contrato front x API) e gerar-contorno.mjs
docs/          escopo e relatórios
```

## Decisões

- O site nunca usa a chave de API (só GET).
- O mapa abre sem nenhuma opção marcada; cada caixinha liga e desliga a sua camada e a sua legenda.
- Confere `/api/fontes` a cada 5 minutos e recarrega só a camada cuja coleta mudou.
- Queimadas e desmatamento pedem só a área visível (`bbox`); o aviso de "mais pontos do que cabem" aparece quando a API devolve `truncado: true`.
- Risco de cheia: a API só devolve rios acima do normal; se não houver nenhum, o mapa avisa.
- A marca do GUARDA (só texto, sem símbolo) fica em `marca.component.ts`; o ícone da aba é `public/guarda.svg`.