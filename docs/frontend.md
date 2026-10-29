# Site (guarda-web)

Angular 20 (componentes standalone, signals, rotas sob demanda) e MapLibre GL 6. Tela única.

## Estrutura

```text
guarda-web/
  public/                        guarda.svg, geo/amazonia-legal.geojson, maplibre-gl-worker.mjs
  scripts/                       testar-api.mjs, gerar-contorno.mjs, copiar-worker.mjs
  src/environments/              environment.ts (local) e environment.prod.ts (produção)
  src/app/
    core/                        config (rotas da API, opções do mapa), models, services, interceptors, util
    shared/                      toast, modal e pipes
    features/mapa/              página, components (mapa-canvas, caixa-opcoes, busca-lugar, legenda,
                                 linha-do-tempo, marca) e utilitários (camadas do MapLibre, chuva, ar, calor, popup)
    features/sobre/             conteúdo do botão "Sobre"
```

## Comportamento

- **Caixa branca** (canto superior esquerdo): busca de cidade ou estado e 7 opções (Chuvas, Qualidade do Ar, Queimadas MODIS, NOAA-20 e Suomi, Risco de Cheia e Desmatamento). O mapa abre sem nenhuma marcada; só o contorno da Amazônia Legal aparece.
- **Legendas:** cada opção marcada mostra a sua legenda; desmarcou, a legenda some. As de queimadas e desmatamento mostram a contagem de pontos da área visível.
- **Queimadas e desmatamento:** em visão ampla aparece uma mancha de calor; ao aproximar viram bolas, uma por ponto. Cores: MODIS `#e11d48`, NOAA-20 `#f97316`, Suomi `#eab308`, desmatamento `#92400e`.
- **Chuva:** imagem gerada no navegador por interpolação dos pontos da grade, com barra de tempo (24 h antes a 24 h depois) e play.
- **Qualidade do ar:** bolas coloridas pelas faixas do CONAMA (0-25-50-75-125-160 µg/m³ de MP2.5), com o valor dentro ao aproximar.
- **Risco de cheia:** só os rios acima do normal que a API devolve; sem nenhum, aparece um aviso.
- **Busca:** cidade (sem diferença de acento) ou estado; o mapa vai até o lugar e desenha o contorno. Sem digitar, dá para achar o município só navegando: os limites aparecem a partir do zoom 6 e o nome ao passar o mouse.
- **Detalhes:** clicar em um ponto abre uma janela com data, valores, município e fonte.
- **Atualização:** a cada 5 minutos o site confere `/api/fontes` e recarrega só o que mudou. Um cache HTTP de 60 s evita repetir chamadas.
- **Responsivo:** abaixo de 720 px de largura ou 560 px de altura, a caixa vira o botão "Opções", a marca fica menor e as legendas ficam embaixo, com rolagem. Em telas grandes nada disso muda.

## Rodar e testar

```powershell
cd guarda-web
npm ci
npm start                    # http://localhost:4200 (API em http://localhost:3000)
npm run build                # build de produção em dist/
npm test                     # testes unitários (Karma + Chrome sem janela)
npm run testar:api           # contrato front x API: GUARDA_API=http://localhost:3000
node scripts/gerar-contorno.mjs   # refaz o contorno da Amazônia Legal a partir dos municípios da API
node scripts/copiar-worker.mjs    # copia o worker do MapLibre para public/
```

## Worker do MapLibre

O MapLibre 6 desenha os dados GeoJSON em um worker que ele procura ao lado do próprio código. O empacotador do Angular não leva esse arquivo, e sem ele o mapa não desenha contornos, focos nem manchas (aparece "Worker failed to load" no console). Por isso `public/maplibre-gl-worker.mjs` fica no repositório e o mapa é configurado para usá-lo. Se atualizar o `maplibre-gl`, rode `node scripts/copiar-worker.mjs`.

## Onde mudar cores e faixas

- Cores dos satélites e nomes das opções: `src/app/core/config/camadas.config.ts`
- Camadas, manchas e tamanhos dos pontos: `src/app/features/mapa/mapa.camadas.ts`
- Cores da chuva e classes: `src/app/features/mapa/chuva.util.ts`
- Faixas da qualidade do ar: `src/app/features/mapa/ar.util.ts`
- Marca do GUARDA (só texto): `src/app/features/mapa/components/marca.component.ts`