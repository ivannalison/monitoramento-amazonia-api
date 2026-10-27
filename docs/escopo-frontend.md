# Escopo do front-end GUARDA (versão 2)

Data: 27/10/2026 · Repositório separado: `guarda-web` · Consome a API `monitoramento-amazonia-api`
Regra: quando uma informação antiga conflita com a atual, vale a atual. Esta versão substitui o escopo de 21/10/2026.

## 1. O que mudou em relação à versão anterior

- **Não há painel de administrador.** O site só faz GET e nunca usa a chave de API. A tela de Alertas é uma lista de leitura.
- **Mapa: MapLibre GL** (não Leaflet), com zoom até o município e carga só da área visível.
- **Atualização a cada 5 minutos**, conferindo `/api/fontes`.
- **Publicação:** Docker (Nginx) local e depois Google Cloud (Cloud Run); Vercel fora.
- **Escopo geográfico:** municípios da Amazônia Legal.

## 2. Resumo

O GUARDA é um site de mapa em tela cheia, tema escuro, com logo própria, que mostra queimadas, fumaça, chuva e risco de cheia da Amazônia Legal quase em tempo real. Usa só a API (nunca as fontes externas) e não pede cadastro.

## 3. Telas

| Tela | Para quê | Rotas |
|---|---|---|
| Mapa (principal) | Camadas, popups, filtros, linha do tempo, relatório do estado | `/queimadas/geojson`, `/qualidade-ar/geojson`, `/chuvas/geojson`, `/cheias/geojson`, `/relatorio`, `/fontes` |
| Painel | Cards de resumo e gráficos (queimadas por dia e por estado, desmatamento) | `/resumo`, `/camadas/resumo`, `/queimadas/estatisticas`, `/desmatamento/estatisticas`, `/clima` |
| Alertas | Lista de leitura com filtro por tipo e nível; mensagem "nenhum alerta ativo" | `/alertas` |
| Sobre | Propósito, fontes, ODS 11, limitações e atribuições | `/fontes`, `/amazonia` |

Compartilhados: carregando, erro, aviso de dado defasado, modal e logo.

## 4. Requisitos funcionais

**Mapa**
- RF01. Tela cheia, contorno da Amazônia Legal e mapa base (OpenStreetMap, com atribuição).
- RF02. Painel de camadas: Queimadas (MODIS, NOAA-20, Suomi), Fumaça/ar, Chuvas e Cheias; cada camada com cor própria e legenda.
- RF03. Queimadas: filtro por satélite e janela de horas (1 a 168).
- RF04. Clique em um ponto abre o popup (data e hora, satélite, intensidade, município, valor medido, fonte).
- RF05. Clique em um estado abre o relatório do estado (`/api/relatorio?estado=XX`), que pode ser impresso.
- RF06. Linha do tempo com play/pause (queimadas nas últimas 24 h e chuva nas próximas horas); focos pulsando, com círculo maior e cor mais quente quanto maior a intensidade.
- RF07. Zoom até o município com carga só da área visível (ver seção 6).
- RF08. Busca por município que centraliza o mapa.
- RF09. Filtros de estado e de período; o estado fica na URL (`?estado=PA`) para compartilhar o link.
- RF10. Camada de desmatamento (DETER) como extra.

**Painel, Alertas e Sobre**
- RF11. Cards (focos, alertas ativos, pior qualidade do ar, maior chuva) e gráficos.
- RF12. Lista de alertas só de leitura, com filtros.
- RF13. Sobre com fontes, ODS 11 e limitações.

**Transversais**
- RF14. Sempre mostrar a fonte e a hora da última atualização de cada camada.
- RF15. Datas no fuso America/Manaus (a API envia em UTC).
- RF16. Zero é valor válido: mostrar "0", nunca esconder o bloco.
- RF17. Estados de tela: carregando, vazio, erro e dado defasado.

## 5. Requisitos não funcionais

- RNF01. O site só faz GET; a chave `x-api-key` nunca entra no código ou no tráfego do navegador.
- RNF02. Erros da API (`{ "erro": "..." }`) viram mensagem amigável (400, 404, 429, 500, 503). Nunca tela em branco.
- RNF03. Limite da API: 1000 requisições por 15 minutos por IP. Evitar atualização agressiva e ler os cabeçalhos `RateLimit`.
- RNF04. As chamadas do painel inicial saem em paralelo.
- RNF05. O GeoJSON só é buscado quando o mapa abre.
- RNF06. Cache no front por alguns minutos (interceptor HTTP), para não repetir chamadas ao navegar.
- RNF07. URL da API em `environment.ts` (local) e `environment.prod.ts` (produção); o domínio do site entra em `CORS_ORIGIN` da API.
- RNF08. Responsivo (mapa em tela cheia no celular) e acessível (contraste nas cores de nível, texto alternativo nos gráficos).

## 6. Como o mapa pede dados

- Ao mover ou dar zoom, o mapa pede `GET /api/queimadas/geojson?bbox=minLon,minLat,maxLon,maxLat` com a área visível, esperando cerca de 300 ms depois do último movimento (debounce) e cancelando o pedido anterior.
- Se a resposta vier com `truncado: true`, mostrar "exibindo os pontos mais intensos; aproxime para ver mais".
- Com um município escolhido, usar `?municipio=Nome` (nome exatamente como a API devolve, com acento).
- `limite` padrão 5000, máximo 10000. Usar `limite` menor no celular.
- Ar, chuva e cheias têm cerca de 180 pontos: carregar inteiras, sem `bbox`.
- Camada DETER: `GET /api/desmatamento/geojson?bbox=...` (pontos no centro de cada alerta), com os mesmos `limite` e `truncado`.
- Contornos: `GET /api/contornos/estados` (estados, Maranhão inteiro) e `GET /api/municipios/geojson?estado=XX` ou `?codigo=...` (municípios). Sem filtro, o GeoJSON de todos os municípios pesa cerca de 1 MB antes do gzip: carregar uma vez e guardar.
- Busca de município: `GET /api/municipios?busca=...`; ao escolher, usar o `bbox` para enquadrar o mapa e o `codigo` em `?municipio_codigo=` (queimadas).
- Agrupar pontos (cluster) em zoom aberto e mostrar pontos individuais ao aproximar.

## 7. Atualização a cada 5 minutos

O site consulta `/api/fontes` (rota leve) a cada 5 minutos e só baixa de novo a camada cuja última coleta mudou. Assim fica atual sem gastar o limite de requisições. Os dados em si mudam a cada 30 min (FIRMS), 3 h (ar, chuva e cheia) ou 6 h (clima e desmatamento). Se uma fonte estiver em erro ou antiga, mostrar aviso de dado defasado.

## 8. O que a API ganhou na Fase 1.5 (pronto para o front)

| Necessidade | Rota pronta |
|---|---|
| Busca de município que centraliza o mapa | `GET /api/municipios?busca=...` (código, nome, estado, centro e bbox) e `GET /api/municipios/:codigo` |
| Contornos de estados e municípios | `GET /api/contornos/estados` e `GET /api/municipios/geojson` (`estado`, `codigo`, `bbox`) |
| Camada de desmatamento por área visível | `GET /api/desmatamento/geojson?bbox=...` (e `bbox` em `/api/desmatamento`) |
| Filtro de município sem acento ou por código | `?municipio=labrea` ignora acento; `?municipio_codigo=` nas queimadas |

## 9. Limitações a mostrar no site

- O risco de cheia é uma estimativa simples (vazão de hoje contra a média de 30 dias do modelo GloFAS), não um alerta oficial.
- O clima de cada estado é a média dos pontos de uma grade, não uma estação meteorológica.
- A qualidade do ar vem de modelo de satélite (Open-Meteo), não de estações físicas.
- O município de cada foco é descoberto cruzando a posição com a malha do IBGE; em divisas pode cair no município vizinho.
- No Maranhão entram só os municípios da Amazônia Legal, o que inclui áreas de Cerrado.
- O desmatamento usa os alertas DETER dos últimos 90 dias.
- Atribuições: NASA FIRMS, INPE, Open-Meteo, IBGE e OpenStreetMap. O Open-Meteo é gratuito para uso não comercial.

## 10. Estrutura do projeto Angular

```text
guarda-web/
  src/app/
    core/        serviços por fonte de dados, interceptores (erro e cache), modelos TypeScript, config de camadas e cores
    shared/      loading, aviso de erro, modal, logo, pipes
    features/
      mapa/      página + painel de camadas, legenda, filtros, linha do tempo, popup, relatório do estado
      painel/    cards, gráficos
      alertas/   lista de leitura
      sobre/
    app.routes.ts, app.config.ts
  src/environments/   environment.ts e environment.prod.ts
  Dockerfile, nginx.conf, .dockerignore
```

## 11. Fases de entrega

1. Projeto Angular, rotas, ambientes, serviço base da API, seletor de estado e estados de tela.
2. Mapa MapLibre com contorno e painel de camadas.
3. Queimadas com `bbox` e aviso de `truncado`; depois ar, chuva e cheias.
4. Popups, legenda, filtros e relatório do estado.
5. Linha do tempo, animações e atualização a cada 5 minutos.
6. Painel de resumo e gráficos, lista de alertas e Sobre.
7. Município: busca, zoom e filtro (depende da Fase 1.5 da API).
8. Responsivo, acessibilidade, testes, Docker (Nginx) e deploy.

## 12. Critérios de aceite

- Todas as telas funcionam com dados reais da API, sem dado fixo no código.
- Trocar de estado atualiza as telas em até 1 segundo, em conexão normal.
- Com a API desligada, toda tela mostra mensagem de erro amigável.
- Camada sem dados mostra "0" ou "sem dados", sem quebrar.
- A chave de API não aparece em nenhum arquivo nem no tráfego do navegador.
- O zoom até um município carrega só os dados dele.

## 13. Decisões ainda abertas

- Zoom a partir do qual o mapa troca o agrupamento por pontos individuais.
- Painel "Amazônia Legal" (atual) ou "só bioma Amazônia" (exigiria a malha de biomas do IBGE).
- Domínio do site (entra em `CORS_ORIGIN`).