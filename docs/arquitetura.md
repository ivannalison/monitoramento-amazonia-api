# Arquitetura

## Visão geral

```text
Fontes externas -> coleta -> API (Express) <-> MongoDB Atlas -> JSON/GeoJSON -> Site (Angular + MapLibre)
```

- A **API** coleta de cada fonte, guarda no MongoDB Atlas e serve os dados. Há um agendador interno, ligado ou desligado pela variável `AGENDAR`. Em produção a coleta será disparada pelo Cloud Scheduler, que chama `POST /api/coleta/:fonte` com a chave da API.
- O **site** é uma tela única, somente leitura. Ele consulta a API apenas com GET, nunca usa a chave e pede só a área visível do mapa.

## Fontes de dados e frequência

| Fonte | Id em `/api/fontes` | Atualização | Usada em |
|---|---|---|---|
| NASA FIRMS (MODIS, NOAA-20, Suomi NPP) | `firms` | 30 min | Queimadas |
| Open-Meteo Air Quality | `ar` | 3 h | Qualidade do ar |
| Open-Meteo Forecast (grade de cerca de 180 pontos, espaçamento de 1,5°) | `chuva` | 3 h | Chuvas |
| Open-Meteo Flood (GloFAS) | `cheia` | 3 h | Risco de cheia |
| Open-Meteo (clima por estado) | `clima` | 6 h | Ainda não usada na tela |
| INPE DETER | `desmatamento` | 6 h | Desmatamento |
| IBGE | (arquivo local) | - | Contornos e busca de municípios |

O site confere `/api/fontes` a cada 5 minutos (essa rota nunca é guardada em cache) e recarrega só a camada cuja coleta mudou. Uma fonte é marcada como "defasada" quando a última coleta ok é mais antiga que o limite dela (queimadas 3 h; ar, chuva e cheia 8 h; clima e desmatamento 14 h).

## API

Rotas usadas pelo site (todas GET): `/api/fontes`, `/api/queimadas/geojson`, `/api/qualidade-ar/geojson`, `/api/chuvas/geojson`, `/api/cheias/geojson`, `/api/desmatamento/geojson`, `/api/municipios`, `/api/municipios/geojson` e `/api/contornos/estados`. As demais rotas estão no Swagger (`/api/docs`) e em [api.md](api.md).

- **Desempenho:** gzip, `Cache-Control` de 60 s e cache em memória de 30 s em `/api/resumo`, `/api/fontes` e `/api/camadas/resumo`. As rotas de GeoJSON aceitam `bbox` e `limite` e devolvem `truncado`.
- **Segurança:** CORS só para GET, HEAD e OPTIONS; escrita (coletas e alertas) só com `x-api-key`; `TRUST_PROXY` configurável para rodar atrás de proxy.
- **Municípios:** 773 municípios da Amazônia Legal (malha do IBGE); no Maranhão, só os com parte a oeste de 44°W. Os focos de queimada recebem o município pela posição.

## Decisões de projeto

1. Site somente leitura, sem painel de administrador. Alertas só pela API, com chave.
2. Escopo: municípios da Amazônia Legal.
3. Uma tela só, tema claro, inspirada no SELVA, sem copiar nome, logo ou textos dele. A marca do GUARDA é só texto.
4. O mapa abre limpo. Todas as opções podem ficar marcadas ao mesmo tempo.
5. Mapa com MapLibre GL, com zoom até o município. Mapa base do OpenStreetMap.
6. Chuva, qualidade do ar e risco de cheia são estimativas de modelo, não medições de estações físicas nem alertas oficiais.
7. Git: um só repositório (API na raiz, site em `guarda-web/`), sem CI no GitHub, trabalho direto na `main`, commit só depois de testar.
8. Produção: dois containers (API e site) no Google Cloud Run. Sem Vercel.

## Produção (plano, ainda não implementado)

- **Containers:** um para a API (Node) e outro para o site (arquivos do build servidos por Nginx), cada um construído a partir da sua pasta. O `.dockerignore` da raiz deixa `guarda-web/` fora da imagem da API.
- **Cloud Run:** um serviço para a API e outro para o site. O cache em memória da API é por instância.
- **Segredos:** `MONGODB_URI` e `API_KEY` no Secret Manager, só no serviço da API.
- **Coleta:** `AGENDAR=false` no Cloud Run e Cloud Scheduler chamando `POST /api/coleta/:fonte` (com `x-api-key`) nas frequências da tabela acima.
- **Banco:** liberar o acesso de rede do Atlas para o Cloud Run.
- **Endereços:** `CORS_ORIGIN` da API com o domínio do site e `apiUrl` em `guarda-web/src/environments/environment.prod.ts` com o endereço público da API (hoje é um valor de exemplo).
- **Custos:** projeto com faturamento e alerta de orçamento.

## Pontos de atenção antes de abrir ao público

- **Mapa base:** o servidor de tiles do OpenStreetMap não prevê tráfego pesado. Para produção, trocar por um provedor próprio ou contratado.
- **Open-Meteo:** o uso gratuito é só para fins não comerciais.
- **Município nos focos novos:** ainda não foi comprovado que as coletas novas do FIRMS preenchem o município (`scripts/verificar-municipios.js`).
- **Maranhão:** os municípios incluídos têm áreas de Cerrado. Alternativa: malha de biomas do IBGE.
- **Filtro `municipio_codigo`:** existe só nas queimadas (o DETER guarda apenas o nome do município).
- **Risco de cheia:** a API devolve só os rios acima do normal, então o mapa pode ficar sem pontos.
- **Chuva:** a grade tem cerca de 165 km; a superfície mostra a tendência, não cada nuvem.