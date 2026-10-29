# GUARDA / Monitoramento da Amazônia: relatório v3

Data: 27/10/2026 · Projeto: API "Monitoramento da Amazônia" (pronta) + site GUARDA em Angular (próxima etapa)
Regra deste relatório: quando uma informação antiga conflita com a atual, vale a atual. Esta versão substitui a v2 (21/10/2026).

## 1. Situação em uma frase

A API está pronta, com dados reais, testada e com as melhorias para o mapa (gzip, cache, filtro por área visível, município nas queimadas e Maranhão só com a Amazônia Legal). Falta enviar essas melhorias ao GitHub e construir o site em Angular (somente leitura), empacotar API e site em Docker e publicar no Google Cloud (Cloud Run).

## 2. O que a API faz

- **Coleta sozinha**, de fontes públicas reais: queimadas (NASA FIRMS: MODIS, NOAA-20 e Suomi NPP, a cada 30 min), desmatamento (INPE DETER, a cada 6 h), clima, qualidade do ar, chuva e risco de cheia (Open-Meteo, grade de ~180 pontos, a cada 3 h; clima a cada 6 h).
- **Guarda tudo** no MongoDB Atlas (plano gratuito, 512 MB), com expiração automática: queimadas e chuva 7 dias, desmatamento 365 dias.
- **Entrega JSON e GeoJSON padronizados:** estado sempre em sigla; cada resposta traz `fonte` e `ultima_atualizacao`.
- **Se uma fonte falha**, a API continua servindo os últimos dados e mostra o erro em `/api/fontes`. Nada é inventado.
- **Escrita** (criar, editar e apagar alertas, disparar coleta) só com a chave `x-api-key`. O site nunca usa a chave.

Fluxo de leitura: Rota -> Controller -> Service -> Model -> MongoDB.
Fluxo de coleta: Agendador (ou `POST /api/coleta/:fonte`) -> Service -> Collector -> Fonte externa -> MongoDB.

## 3. O que há de novo (Fase 1, concluída)

| Item | O que foi feito |
|---|---|
| Compressão | gzip em todas as respostas (`compression`) |
| Cache | `Cache-Control: public, max-age=60` nas leituras; cache em memória de 30 s em `/api/resumo`, `/api/fontes` e `/api/camadas/resumo` |
| Área visível | `?bbox=minLon,minLat,maxLon,maxLat` no GeoJSON de queimadas |
| Município | cada foco recebe o município (malha do IBGE, 773 municípios da Amazônia Legal); filtro `?municipio=` |
| Limite | `?limite=` (padrão 5000, máximo 10000) e campo `truncado` na resposta |
| Maranhão | só entram os municípios da Amazônia Legal (os que têm parte a oeste do meridiano 44°W) |
| Proxy | `TRUST_PROXY` (padrão 1 em produção), para o limite por IP funcionar no Cloud Run |
| CORS | só leitura (GET, HEAD, OPTIONS) e só para as origens de `CORS_ORIGIN` |
| Desempenho | `/api/fontes` faz as consultas em paralelo; índices novos em Queimada, Coleta e Desmatamento |
| Documentação | Swagger 2.1.0 com os parâmetros novos, README atualizado, este relatório e o escopo do front |
| Testes | 24 testes (10 antigos + 14 novos) passando contra o banco real |

Banco depois da Fase 1: de 14.479 focos, 13.760 receberam município e 701 do Maranhão fora da Amazônia Legal foram removidos.

## 4. Medições reais (21/10/2026)

| Rota | Tempo | Tamanho |
|---|---|---|
| `/queimadas/geojson` 24 h, sem gzip | 0,47 s | 645 KB (2.487 pontos) |
| `/queimadas/geojson` 24 h, com gzip | 0,63 s | 44 KB |
| `/queimadas/geojson?horas=168`, sem gzip | 0,54 s | 1.297 KB |
| `/queimadas/geojson?horas=168`, com gzip | 0,61 s | 110 KB |
| com `bbox` (área de Lábrea, 20 pontos) | 0,05 s | 0,8 KB |
| com `municipio=Lábrea` (126 pontos em 7 dias) | 0,15 s | 2,3 KB |
| `/api/resumo` (1ª chamada / com cache) | 0,38 s / 0,00 s | 1,3 KB |
| `/api/fontes` (1ª chamada / com cache) | 0,31 s / 0,00 s | 0,9 KB |
| `/api/camadas/resumo`, `/api/relatorio` | 0,05 s, 0,13 s | 1,2 KB, 2,7 KB |

Outras conferências: CORS libera só leitura, POST sem chave devolve 401, `bbox` inválido devolve 400, `npm audit --omit=dev` com 0 vulnerabilidades e 0 linhas de erro no log. Queimadas em 24 h por estado (foto de 21/10): PA 1.506, MA 527, MT 175, AP 107, RO 102, RR 30, AM 28, TO 7, AC 5.

## 5. Git e documentação

- Em 27/10/2026 o computador e o GitHub estavam no mesmo commit (`9752fd3`, de 21/10). A Fase 1 estava só no disco (13 arquivos modificados e 8 novos), sem segredos e sem arquivos ignorados por engano.
- Este relatório acompanha o commit que envia a Fase 1. Depois do `git push`, computador e GitHub voltam a ficar iguais.
- Não há CI no GitHub por enquanto. Os testes rodam na máquina antes de cada commit.

## 6. Decisões fechadas

| Tema | Decisão |
|---|---|
| Painel de administrador | Não haverá. O site é só de leitura; alertas só pela API, com chave |
| Nome | GUARDA |
| Repositórios | API (este) e front `guarda-web`, separados |
| Mapa | MapLibre GL, com zoom até o município |
| Atualização no site | A cada 5 minutos (o site só confere `/api/fontes`) |
| Escopo geográfico | Municípios da Amazônia Legal |
| Publicação | Docker local primeiro, depois Google Cloud (Cloud Run); Vercel fora |
| Fontes | FIRMS, DETER e Open-Meteo |

## 7. Pontos de atenção e decisões abertas

1. **Município nas coletas novas** ainda não foi comprovado: só os focos já gravados foram preenchidos. Conferir depois da próxima coleta do FIRMS.
2. **Filtro de município com acento:** `Lábrea` funciona, `Labrea` não. O front deve usar o nome exatamente como a API devolve. Melhoria prevista: filtro por código IBGE ou sem acento.
3. **Maranhão pela definição legal:** 527 focos em 24 h (cerca de 21%), boa parte em Cerrado dentro da Amazônia Legal. Se o painel for "só bioma Amazônia", será preciso usar a malha de biomas do IBGE. Decisão a registrar.
4. **Cache em memória é por instância:** no Cloud Run cada instância tem o seu; o ganho varia com o número de instâncias.
5. **GeoJSON não passa pelo cache do servidor** (cerca de 0,5 s); só conta com os 60 s do navegador. Medir pela rede depois do deploy.
6. **Amazonas com 28 focos em 24 h** é pouco para outubro. Comparar com o FIRMS/INPE para confirmar que é a realidade.
7. **Atualização a cada 5 min** é do site. Os dados mudam a cada 30 min (FIRMS), 3 h (ar, chuva e cheia) ou 6 h (clima e desmatamento); coletar mais vezes gastaria a cota do Open-Meteo sem trazer dado novo.
8. **O que o front vai precisar e a API ainda não tem (Fase 1.5):** `GET /api/municipios` (código, nome, estado e centro, para a busca centralizar o mapa); contornos de estados e municípios acessíveis ao front; `bbox` no desmatamento (camada DETER); filtro de município por código IBGE.

## 8. Próximos passos, em ordem

1. **Git:** `git push origin main` (o commit local já está feito).
2. **Conferir** que os focos coletados daqui para frente chegam com `municipio`.
3. **Fase 1.5 da API** (rodada pequena): itens do ponto 7.8.
4. **Site GUARDA em Angular** (`guarda-web`): ver `docs/escopo-frontend.md`.
5. **Docker local:** container da API e do site (Nginx); `docker compose up`.
6. **Google Cloud:** Cloud Run, Secret Manager (`MONGODB_URI`, `API_KEY`), Cloud Scheduler chamando `POST /api/coleta/:fonte` com `AGENDAR=false`, alerta de orçamento e domínio.
7. **Documentação final:** prints, arquitetura e passo a passo do deploy.

## 9. Pendências de limpeza

- Conferir se ainda existe um projeto na Vercel (`monitoramento-amazonia-api.vercel.app`) e apagá-lo, porque pode estar no ar com a versão antiga.
- A `API_KEY` e a senha do Atlas nunca devem ser coladas em conversas. Se alguma já foi, gere outra.