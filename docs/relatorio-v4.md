# GUARDA / Monitoramento da Amazônia: relatório v4

Data: 27/10/2026 · Projeto: API "Monitoramento da Amazônia" (pronta e no GitHub) + site GUARDA em Angular (próxima etapa)
Regra deste relatório: quando uma informação antiga conflita com a atual, vale a atual. Esta versão substitui o v3.

## 1. Situação em uma frase

A API está pronta e publicada no GitHub, com a Fase 1 (gzip, cache, `bbox`, município nas queimadas, Maranhão só com a Amazônia Legal) e a Fase 1.5 (rotas de municípios e contornos, `bbox` no desmatamento e filtro de município sem acento ou por código IBGE). O próximo passo é o site GUARDA em Angular.

## 2. Linha do tempo no Git

| Commit | Data | O que entrou |
|---|---|---|
| `9752fd3` | 21/10/2026 | API com dados reais, camadas GeoJSON, Docker, reconexão ao Atlas e testes |
| `3142d22` | 27/10/2026 | Fase 1: gzip, cache, `bbox`, município nas queimadas, Maranhão, CORS só leitura, `TRUST_PROXY`, docs v3 e escopo do front |
| commit da Fase 1.5 | 27/10/2026 | Fase 1.5 e este relatório |

## 3. O que a API faz

- Coleta sozinha, de fontes públicas reais: queimadas (NASA FIRMS, a cada 30 min), desmatamento (INPE DETER, a cada 6 h), clima, qualidade do ar, chuva e risco de cheia (Open-Meteo, grade de ~180 pontos, a cada 3 h; clima a cada 6 h).
- Guarda no MongoDB Atlas (plano gratuito) com expiração automática: queimadas e chuva 7 dias, desmatamento 365 dias.
- Entrega JSON e GeoJSON padronizados, com estado em sigla e os campos `fonte` e `ultima_atualizacao`.
- Se uma fonte falha, continua servindo os últimos dados e mostra o erro em `/api/fontes`.
- Escrita (alertas e disparo de coleta) só com a chave `x-api-key`; o site nunca usa a chave.

## 4. Mapa de rotas

| Grupo | Rotas |
|---|---|
| Geral | `/api/status`, `/api/amazonia`, `/api/resumo`, `/api/estados`, `/api/relatorio`, `/api/fontes` |
| Queimadas | `/api/queimadas`, `/api/queimadas/estatisticas`, `/api/queimadas/geojson` |
| Desmatamento | `/api/desmatamento`, `/api/desmatamento/estatisticas`, `/api/desmatamento/geojson` |
| Camadas | `/api/qualidade-ar/geojson`, `/api/chuvas/geojson`, `/api/cheias/geojson`, `/api/camadas/resumo`, `/api/clima` |
| Municípios e contornos | `/api/municipios`, `/api/municipios/:codigo`, `/api/municipios/geojson`, `/api/contornos/estados` |
| Alertas | GET `/api/alertas`, `/api/alertas/:id` (público); POST, PUT e DELETE com chave |
| Coleta | POST `/api/coleta/:fonte` (com chave) |

Parâmetros novos: `bbox` (queimadas/geojson, desmatamento, desmatamento/geojson, municipios/geojson), `limite` e `truncado` (geojson), `municipio` sem acento, `municipio_codigo` (queimadas), `busca` (municipios). Detalhes no README e em `/api/docs`.

## 5. O que entrou na Fase 1.5

| Necessidade do front | O que a API oferece agora |
|---|---|
| Busca de município que centraliza o mapa | `GET /api/municipios?busca=...` (código, nome, estado, centro e bbox) e `GET /api/municipios/:codigo` |
| Contornos | `GET /api/contornos/estados` e `GET /api/municipios/geojson` (`estado`, `codigo`, `bbox`) |
| Desmatamento no mapa | `GET /api/desmatamento/geojson?bbox=...`, e `bbox` em `/api/desmatamento` e nas estatísticas |
| Filtro de município | `?municipio=labrea` ignora acento e maiúsculas; `?municipio_codigo=` filtra pelo código IBGE nas queimadas |

Os dados de municípios e contornos vêm do IBGE e ficam em `src/data`; essas rotas não consultam o banco e trazem `Cache-Control` de 1 hora.

## 6. Testes

- Test Suites: 3 passed, 3 total
- Tests:       42 passed, 42 total

Os testes usam o banco real (`MONGODB_URI` no `.env`). Arquivos: `tests/api.test.js`, `tests/melhorias-fase1.test.js` e `tests/fase1-5.test.js`.

## 7. Conferência do município nas queimadas guardadas (somente leitura, 27/10/2026)

- `total_focos=2587 | nao_processados=0 | fora_dos_municipios=10`
- `ultimas_24h=0 | ultimas_24h_nao_processados=0 | ultima_gravacao=2026-10-21T18:42:12.307Z`

Como ler: `ultimas_24h_nao_processados = 0` significa que os focos novos já chegam com município (coletor novo funcionando). Se for maior que 0, rodar `node scripts/preencher-municipios.js` e conferir de novo depois da próxima coleta do FIRMS. `fora_dos_municipios` são focos que não caíram em nenhum município da malha (divisas simplificadas).

## 8. Decisões fechadas

| Tema | Decisão |
|---|---|
| Painel de administrador | Não haverá. O site é só de leitura; alertas só pela API, com chave |
| Nome | GUARDA |
| Repositórios | API (este) e front `guarda-web`, separados |
| Mapa | MapLibre GL, com zoom até o município |
| Atualização no site | A cada 5 minutos (o site só confere `/api/fontes`) |
| Escopo geográfico | Municípios da Amazônia Legal |
| Publicação | Docker local primeiro, depois Google Cloud (Cloud Run); Vercel fora |
| Git | Sem CI por enquanto; testes na máquina; commits na `main` |

## 9. Pontos de atenção e decisões abertas

1. **Maranhão pela definição legal:** boa parte dos focos do MA é Cerrado dentro da Amazônia Legal. Se o painel for "só bioma Amazônia", será preciso a malha de biomas do IBGE.
2. **Contorno oficial da Amazônia Legal:** a API serve os 9 estados (Maranhão inteiro) e os 773 municípios; o contorno oficial único não é servido. O front pode desenhar os municípios sem preenchimento, ou podemos avaliar a malha temática do IBGE.
3. **Município por código no desmatamento:** o DETER informa só o nome do município; o filtro por código vale nas queimadas.
4. **Malha municipal simplificada:** focos perto de divisas podem cair no município vizinho.
5. **Cache em memória é por instância** (no Cloud Run, cada instância tem o seu) e o GeoJSON de queimadas não passa pelo cache do servidor (cerca de 0,5 s). Medir pela rede depois do deploy.
6. **Amazonas com poucos focos em 24 h:** conferir com o FIRMS/INPE se é a realidade.
7. **Atualização de 5 minutos é do site;** os dados mudam a cada 30 min, 3 h ou 6 h.

## 10. Próximos passos, em ordem

1. **Site GUARDA em Angular** (`guarda-web`, repositório novo): projeto, rotas, ambientes (URL da API), serviço base, estados de tela (carregando, vazio, erro, dado defasado). A API aceita `http://localhost:4200` no CORS.
2. Mapa MapLibre com contornos, camadas e popups; queimadas com `bbox` e aviso de `truncado`.
3. Filtros, relatório do estado, linha do tempo e atualização a cada 5 minutos.
4. Painel, Alertas (lista de leitura) e Sobre.
5. Município: busca (`/api/municipios`), enquadramento do mapa e filtro (`municipio_codigo`).
6. Docker (Nginx) e `docker compose up` com API e site.
7. Google Cloud: Cloud Run, Secret Manager (`MONGODB_URI`, `API_KEY`), Cloud Scheduler chamando `POST /api/coleta/:fonte` com `AGENDAR=false`, alerta de orçamento e domínio.
8. Documentação final: prints, arquitetura e passo a passo do deploy.

## 11. Pendências de limpeza

- Conferir se ainda existe um projeto na Vercel (`monitoramento-amazonia-api.vercel.app`) e apagá-lo.
- A `API_KEY` e a senha do Atlas nunca devem ser coladas em conversas. Se alguma já foi, gere outra.