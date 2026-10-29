# GUARDA - site (guarda-web)

Parte do repositório **GUARDA - Monitoramento da Amazônia** (veja o [README da raiz](../README.md)). A API fica na raiz, na pasta acima.

Mapa da Amazônia Legal no estilo do SELVA: tela cheia, tema claro, caixa branca com busca e opções. O mapa abre limpo e o usuário marca o que quer ver: chuva, qualidade do ar, queimadas (MODIS, NOAA-20 e Suomi), risco de cheia e desmatamento (DETER). Angular 20 + MapLibre GL 6. Somente leitura.

## Como rodar

```powershell
npm ci
npm start                          # http://localhost:4200  (a API deve estar em http://localhost:3000)
npm run build                      # build de produção em dist/
npm test                           # testes unitários (Karma + Chrome sem janela)
npm run testar:api                 # teste de contrato contra a API (GUARDA_API=http://localhost:3000)
node scripts/gerar-contorno.mjs    # refaz o contorno da Amazônia Legal (lê ../src/data/municipios-amazonia-legal.json)
node scripts/copiar-worker.mjs     # copia o worker do MapLibre para public/ (rode de novo se atualizar o maplibre-gl)
```

A URL da API fica em `src/environments/environment.ts` (local) e `environment.prod.ts` (produção).

Estrutura, comportamento e decisões: [docs/frontend.md](../docs/frontend.md) e [docs/arquitetura.md](../docs/arquitetura.md).