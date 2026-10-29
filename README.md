<!-- guarda-monorepo -->
# GUARDA - Monitoramento da Amazônia

Site aberto de monitoramento ambiental da **Amazônia Legal**, quase em tempo real, em um mapa interativo: **queimadas** (satélites MODIS, NOAA-20 e Suomi NPP), **chuva**, **qualidade do ar** (fumaça), **risco de cheia** e **alertas de desmatamento** (INPE DETER), com busca por cidade e por estado.

Inspirado no SELVA (Sistema Eletrônico de Vigilância Ambiental), com identidade e código próprios. Apoia o acompanhamento ambiental e a resiliência das comunidades (ODS 11 - Cidades e Comunidades Sustentáveis). O site é **somente de leitura**: sem cadastro e sem painel de administrador.

## O que há neste repositório

| Parte | Pasta | Tecnologia | Papel |
|---|---|---|---|
| API | raiz (`src/`, `tests/`, `scripts/`) | Node.js 22, Express 5, MongoDB Atlas | Coleta os dados das fontes, guarda no banco e serve JSON/GeoJSON |
| Site | `guarda-web/` | Angular 20, MapLibre GL 6 | Mapa que consome a API (somente GET) |

```text
Fontes externas                 API (Express) <----> MongoDB Atlas
 NASA FIRMS ------------+          |
 Open-Meteo ------------+--------> |   JSON / GeoJSON (gzip + cache)
 INPE DETER ------------+          v
 IBGE (municípios)             Site (Angular + MapLibre) --> mapa base OpenStreetMap
```

Em produção, a API e o site vão em **containers separados** (plano em [docs/arquitetura.md](docs/arquitetura.md)).

## Como rodar no seu computador (Windows PowerShell)

Pré-requisitos: Node.js 22, npm 10 e acesso a um banco MongoDB Atlas.

**1. API** (na raiz do repositório)

```powershell
npm install
# crie o arquivo .env a partir do .env.example (MONGODB_URI e API_KEY). Nunca faça commit do .env.
$env:AGENDAR = 'false'      # sem coleta automática local
npm start                   # http://localhost:3000/api/status  |  Swagger: http://localhost:3000/api/docs
```

Com a coleta automática desligada, os dados só ficam frescos se você pedir a coleta (precisa da chave da API):

```powershell
curl.exe -X POST -H "x-api-key: SUA_CHAVE" http://localhost:3000/api/coleta/firms   # também: ar, chuva, cheia, desmatamento, clima
```

**2. Site** (em outra janela)

```powershell
cd guarda-web
npm ci
npm start                   # http://localhost:4200  (a API deve estar em http://localhost:3000)
```

## Testes

```powershell
npm test                          # API (na raiz)
cd guarda-web
npm test                          # site: testes unitários (Karma + Chrome sem janela)
npm run testar:api                # site: teste de contrato contra a API (GUARDA_API=http://localhost:3000)
```

## Opções do mapa

O mapa abre limpo. Cada caixinha liga a sua camada e a sua legenda, e todas podem ficar marcadas juntas.

| Opção | Fonte | Atualização | Como aparece |
|---|---|---|---|
| Chuvas | Open-Meteo | 3 h | Superfície colorida (interpolada) com barra de tempo e play |
| Qualidade do Ar (estações virtuais) | Open-Meteo Air Quality | 3 h | Bolas coloridas pelas faixas CONAMA; números ao aproximar |
| Queimadas MODIS / NOAA-20 / Suomi (24 h) | NASA FIRMS | 30 min | Manchas de calor ao longe e bolas ao aproximar; uma cor por satélite |
| Risco de Cheia | Open-Meteo Flood (GloFAS) | 3 h | Pontos nos rios acima do normal |
| Desmatamento (DETER, 90 dias) | INPE DETER | 6 h | Mancha marrom ao longe e bolas por área ao aproximar |

## Documentação

- [Arquitetura e decisões](docs/arquitetura.md)
- [Site (guarda-web)](docs/frontend.md)
- [API](docs/api.md)

## Estado do projeto

- API e site concluídos e testados localmente.
- **Próximos passos:** containers (Docker, um para a API e outro para o site), Google Cloud (Cloud Run, Secret Manager, Cloud Scheduler), domínio e documentação final com imagens.

## Segurança

- A chave da API (`API_KEY`) e a conexão com o banco (`MONGODB_URI`) ficam só no `.env` local e, em produção, no Secret Manager. Nunca entram no Git nem no site.
- O site só faz GET. O CORS da API só aceita GET, HEAD e OPTIONS.

## Créditos e termos dos dados

NASA FIRMS (focos de calor), INPE DETER (desmatamento), Open-Meteo (chuva, ar e vazão dos rios; uso gratuito apenas não comercial), IBGE (municípios) e © colaboradores do OpenStreetMap (mapa base). Confira os termos de cada fonte antes de abrir o site ao público.