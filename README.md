# Monitoramento da Amazônia - API

API REST que coleta, organiza e padroniza indicadores ambientais da Amazônia Legal a partir de fontes públicas reais: queimadas, desmatamento, clima, qualidade do ar (fumaça), chuva e risco de cheia. Foi pensada para ser consumida por um site de monitoramento (front-end em Angular, em repositório separado) e está alinhada ao ODS 11 (Cidades e Comunidades Sustentáveis).

Desenvolvida em Node.js com Express e MongoDB Atlas, empacotada em Docker.

💻 Repositório: https://github.com/ivannalison/monitoramento-amazonia-api
📘 Documentação interativa (Swagger): http://localhost:3000/api/docs (ao rodar localmente)

**Sobre os dados:** todos os dados vêm de fontes públicas reais. Não há dados fictícios nem seed. Cada resposta traz o campo `fonte`. Se uma fonte falhar, a coleta registra o erro e ele aparece em `/api/fontes`; nada é preenchido no lugar.

## 🎯 Problema e solução

**Problema:** as informações de monitoramento ambiental estão espalhadas em fontes e formatos diferentes (CSV, WFS, APIs de previsão), o que dificulta consultá-las de forma simples.

**Solução:** uma API que coleta essas fontes automaticamente, guarda tudo em um único banco, padroniza o formato (JSON e GeoJSON, estados sempre em sigla) e oferece filtros, paginação, estatísticas, camadas para mapa e um relatório consolidado por estado.

**ODS 11:** a API não resolve sozinha problemas ambientais. Ela organiza e disponibiliza informação que pode apoiar aplicações de monitoramento e a resiliência das comunidades.

## 🛰️ Fontes de dados

| Dado | Fonte | Coleta | Observação |
|---|---|---|---|
| Queimadas (focos de calor) | NASA FIRMS (MODIS, NOAA-20 VIIRS, Suomi NPP VIIRS) | a cada 30 min | CSV público das últimas 24 h; guardados por 7 dias |
| Desmatamento | INPE DETER (TerraBrasilis, WFS, camada `deter-amz:deter_amz`) | a cada 6 h | Alertas dos últimos 90 dias, um registro por alerta; guardados por 365 dias |
| Clima atual | Open-Meteo Forecast | a cada 6 h | Média por estado (temperatura, umidade, condição) |
| Qualidade do ar / fumaça | Open-Meteo Air Quality | a cada 3 h | PM2.5, PM10, índice AQI, profundidade óptica de aerossol |
| Chuva por hora | Open-Meteo Forecast | a cada 3 h | Próximas 24 h; guardada por 7 dias |
| Risco de cheia | Open-Meteo Flood (GloFAS) | a cada 3 h | Vazão do dia / média dos últimos 30 dias |

Open-Meteo é gratuito para uso não comercial. As camadas de ar, chuva, cheia e clima usam uma grade de ~180 pontos (passo de 1,5°) sobre a Amazônia Legal; o estado de cada ponto é descoberto pelos contornos do IBGE (`src/data/estados.geojson`).

### Níveis de cheia

`razao = vazão de hoje / média dos últimos 30 dias`

| Razão | Nível |
|---|---|
| menor que 1,5 | normal |
| 1,5 a 2 | atencao |
| 2 a 3 | alto |
| 3 ou mais | extremo |

## 🏗️ Arquitetura

| Camada | Pasta | Responsabilidade |
|---|---|---|
| Rotas | `src/routes` | Mapa dos endpoints |
| Controllers | `src/controllers` | Recebem a requisição e devolvem a resposta HTTP |
| Services | `src/services` | Regras, consultas e execução das coletas |
| Collectors | `src/collectors` | Leitura das fontes externas (FIRMS, DETER, Open-Meteo) |
| Jobs | `src/jobs` | Agendador de coletas (node-cron) |
| Models | `src/models` | Schemas Mongoose e validações |
| Middlewares | `src/middlewares` | Chave de API, coleta em segundo plano e tratamento de erros |
| Utils | `src/utils` | Estados (sigla), filtros, período/paginação, geografia |
| Config | `src/config` | Conexão com o banco (com reconexão automática) e Swagger |

**Fluxo de leitura:** Rota -> Controller -> Service -> Model -> MongoDB
**Fluxo de coleta:** Agendador ou `POST /api/coleta` -> Service -> Collector -> Fonte externa -> MongoDB

## 🛠️ Tecnologias

Node.js 22, Express 5, MongoDB Atlas, Mongoose, Swagger/OpenAPI, helmet, express-rate-limit, node-cron, Jest e Supertest, Docker e Docker Compose, Git e GitHub.

## 🗺️ Padrão de estados

O campo `estado` é sempre a sigla (AC, AM, AP, MA, MT, PA, RO, RR, TO). Nos filtros, a API aceita sigla ou nome, com ou sem acento e em qualquer caixa: `?estado=PA`, `?estado=Para` e `?estado=pará` dão o mesmo resultado. Estado desconhecido nas rotas de relatório e de resumo das camadas devolve 400.

## 👥 Acesso e permissões

- **Leitura (GET):** pública, com CORS restrito às origens listadas em `CORS_ORIGIN`.
- **Escrita** (POST, PUT, DELETE em `/api/alertas` e POST em `/api/coleta/:fonte`): protegida por chave de API no header `x-api-key`.
  - Local, sem `API_KEY` no `.env`: liberado.
  - Produção sem `API_KEY`: escrita bloqueada (erro 503).
  - Com `API_KEY` definida: exige o header correto (senão, erro 401).
- **Limites por IP:** 1000 requisições a cada 15 minutos em `/api` e 30 por hora em `/api/coleta`.
- **Cabeçalhos de segurança:** helmet.

## 📋 Endpoints

Documentação interativa completa em `/api/docs`.

### Geral

| Método | Rota | Descrição |
|---|---|---|
| GET | `/api/status` | API online e estado do banco |
| GET | `/api/amazonia` | Informações gerais |
| GET | `/api/resumo` | Totais dos indicadores + bloco `camadas` (queimadas 24 h, ar, chuva, cheias) |
| GET | `/api/estados` | Lista de estados em sigla (menu de filtro) |
| GET | `/api/relatorio` | Relatório consolidado por estado + bloco `camadas` |
| GET | `/api/fontes` | Fontes, última coleta, última coleta ok e situação |

### Dados

| Método | Rota | Descrição |
|---|---|---|
| GET | `/api/queimadas` | Focos de calor (paginado) |
| GET | `/api/queimadas/estatisticas` | Totais e intensidade por estado e por dia |
| GET | `/api/queimadas/geojson` | Focos em GeoJSON para o mapa (máx. 5.000 pontos) |
| GET | `/api/desmatamento` | Alertas de desmatamento do INPE DETER (paginado) |
| GET | `/api/desmatamento/estatisticas` | Área total/média por estado e por dia |
| GET | `/api/clima` | Condição atual por estado |
| GET | `/api/qualidade-ar/geojson` | Qualidade do ar (leitura mais recente de cada ponto) |
| GET | `/api/chuvas/geojson` | Chuva por hora (padrão: hora atual) |
| GET | `/api/cheias/geojson` | Rios com vazão acima do normal |
| GET | `/api/camadas/resumo` | Resumo de queimadas, ar, chuva e cheias |

### Alertas (cadastrados pelo administrador)

| Método | Rota | Descrição | Acesso |
|---|---|---|---|
| GET | `/api/alertas` | Lista alertas | Público |
| GET | `/api/alertas/:id` | Busca um alerta | Público |
| POST | `/api/alertas` | Cria um alerta | Chave de API |
| PUT | `/api/alertas/:id` | Atualiza um alerta | Chave de API |
| DELETE | `/api/alertas/:id` | Remove um alerta | Chave de API |

Campos de um alerta: `tipo` (obrigatório), `nivel` (obrigatório: baixo, moderado, alto ou critico), `descricao` (obrigatório), `estado` (opcional) e `ativo` (opcional, padrão true). A fonte é sempre `Cadastro via API`. A lista começa vazia: só existem alertas que o administrador criar.

### Coleta

| Método | Rota | Descrição | Acesso |
|---|---|---|---|
| POST | `/api/coleta/:fonte` | Dispara a coleta de `firms`, `ar`, `chuva`, `cheia`, `desmatamento`, `clima` ou `todas` | Chave de API |

A coleta de desmatamento leva cerca de 2 minutos, por isso roda **em segundo plano**: a rota responde `202` imediatamente e a coleta continua. Se outra chamada chegar enquanto ela ainda roda, a resposta é `409`. Para esperar o fim da coleta (comportamento síncrono), use `?aguardar=true`.

### Filtros e parâmetros

| Parâmetro | Vale em | Exemplo |
|---|---|---|
| `estado` (sigla ou nome) | queimadas, desmatamento, estatísticas, relatório, alertas, clima, camadas | `?estado=AM` ou `?estado=Amazonas` |
| `municipio` | queimadas e desmatamento (e estatísticas) | `?municipio=Lábrea` |
| `inicio`, `fim` (AAAA-MM-DD) | queimadas, desmatamento, estatísticas, relatório | `?inicio=2026-09-01&fim=2026-09-30` |
| `pagina`, `limite` (máx. 200) | listas de queimadas e desmatamento | `?pagina=1&limite=10` |
| `satelite` (modis, noaa20, suomi) | `/queimadas/geojson` | `?satelite=noaa20` |
| `horas` (1 a 168, padrão 24) | `/queimadas/geojson`, `/camadas/resumo`, `/relatorio` | `?horas=48` |
| `hora` (AAAA-MM-DDTHH:00, UTC) | `/chuvas/geojson` | `?hora=2026-10-20T15:00` |
| `nivel` (normal, atencao, alto, extremo) | `/cheias/geojson` | `?nivel=alto` |
| `tipo`, `nivel` | alertas | `?tipo=chuva&nivel=alto` |
| `aguardar=true` | `POST /coleta/desmatamento` | `?aguardar=true` |

**Exemplo: resumo das camadas** (`GET /api/camadas/resumo?estado=PA`)

```json
{
  "estado": "PA",
  "gerado_em": "2026-10-20T18:00:00.000Z",
  "queimadas": { "periodo_horas": 24, "total": 866, "por_satelite": { "modis": 149, "noaa20": 713, "suomi": 4 }, "fonte": "NASA FIRMS" },
  "qualidade_ar": { "pontos": 40, "media_pm2_5": 14.2, "fonte": "Open-Meteo Air Quality" },
  "chuva": { "pontos": 40, "pontos_com_chuva": 12, "maximo_mm": 12.6, "fonte": "Open-Meteo Forecast" },
  "cheias": { "pontos_monitorados": 35, "em_alerta": 3, "fonte": "Open-Meteo Flood (GloFAS)" }
}
```

(valores ilustrativos e abreviados; a resposta real traz mais campos)

**Exemplo: criar alerta**

```bash
curl -X POST http://localhost:3000/api/alertas \
  -H "Content-Type: application/json" -H "x-api-key: SUA_CHAVE" \
  -d '{"tipo":"chuva","nivel":"alto","descricao":"Chuva forte prevista","estado":"Amazonas"}'
```

## ⚠️ Códigos de resposta

| Código | Significado |
|---|---|
| 200 | Sucesso |
| 201 | Criado |
| 202 | Coleta aceita e rodando em segundo plano |
| 400 | Requisição inválida (dado, data, estado, ID ou JSON inválido) |
| 401 | Chave de API ausente ou inválida |
| 404 | Recurso ou fonte de coleta não encontrado |
| 409 | Já existe uma coleta dessa fonte em andamento |
| 429 | Limite de requisições excedido |
| 500 | Erro interno |
| 503 | Escrita desabilitada (produção sem `API_KEY`) |

Erros retornam JSON: `{ "erro": "mensagem" }`.

## ⚙️ Configuração

Copie `.env.example` para `.env` e preencha:

```env
PORT=3000
MONGODB_URI=mongodb+srv://USUARIO:SENHA@SEU-CLUSTER.mongodb.net/monitoramento_amazonia?retryWrites=true&w=majority
API_KEY=uma-chave-longa-e-secreta
CORS_ORIGIN=http://localhost:4200,http://localhost:8080
AGENDAR=true
```

| Variável | Para quê |
|---|---|
| `PORT` | Porta do servidor |
| `MONGODB_URI` | Conexão com o MongoDB Atlas |
| `API_KEY` | Chave para POST/PUT/DELETE (header `x-api-key`) |
| `CORS_ORIGIN` | Origens permitidas, separadas por vírgula (endereço do front-end) |
| `AGENDAR` | `true` = a API coleta sozinha (node-cron). `false` = coleta só pela rota `POST /api/coleta/:fonte` |

⚠️ **Nunca suba o `.env` para o GitHub** (ele já está no `.gitignore`).

Se a primeira conexão com o Atlas falhar, a API sobe mesmo assim e tenta reconectar sozinha (5 s, 10 s, até 60 s entre as tentativas).

## 🚀 Como executar

**Pré-requisitos:** Node.js 20+ (testado no 22) e uma conta no MongoDB Atlas (usuário criado e seu IP liberado em Network Access).

```bash
git clone https://github.com/ivannalison/monitoramento-amazonia-api.git
cd monitoramento-amazonia-api
npm install
copy .env.example .env      # edite o .env com sua MONGODB_URI e API_KEY
npm run dev                 # http://localhost:3000/api/status
```

Com `AGENDAR=true`, a coleta automática começa sozinha. Para popular o banco na primeira vez sem esperar o agendador, dispare as coletas (veja a seção Coleta):

```powershell
$h = @{ 'x-api-key' = 'SUA_CHAVE' }
foreach ($f in 'firms','desmatamento','clima','ar','chuva','cheia') {
  Invoke-RestMethod -Method Post "http://localhost:3000/api/coleta/$f" -Headers $h -TimeoutSec 600
}
```

> O Open-Meteo tem cota diária: evite rodar as coletas completas mais de uma vez por dia.

### Agendamento (UTC)

| Fonte | Frequência |
|---|---|
| firms | a cada 30 min |
| ar, chuva, cheia | a cada 3 h (minutos 05, 10 e 15) |
| desmatamento | a cada 6 h (minuto 20) |
| clima | a cada 6 h (minuto 25) |

## 🐳 Docker

O MongoDB continua no Atlas (não há container de banco). O container lê o `.env`.

```bash
docker compose up --build        # sobe a API em http://localhost:3000
docker compose down              # para
```

Para usar outra porta no seu computador: `HOST_PORT=3001` (PowerShell: `$env:HOST_PORT='3001'`). No `docker-compose.yml` o agendador interno vem desligado (`AGENDAR: "false"`); para agendar dentro do container, troque para `"true"` e não rode a API local ao mesmo tempo.

## 🧪 Testes

**Testes automatizados (Jest + Supertest):**

```bash
npm test
```

Os testes ficam em `tests/api.test.js`.

**Teste de ponta a ponta:** o projeto também foi validado com testes em PowerShell contra dados reais. Eles conferem:

- coletas reais de todas as 6 fontes (erro da fonte conta como falha);
- fonte, formato e faixa de valores de cada resposta (siglas, coordenadas dentro da Amazônia, datas e valores plausíveis, nenhuma menção a "demonstrativo");
- conferência ao vivo com as fontes originais (focos no CSV da NASA, área dos alertas no INPE, chuva no Open-Meteo);
- filtros de estado (PA = Para = para), erros 400/404, CORS, chave de API (401) e o CRUD de alertas;
- rotas do Swagger.

Os testes de jornada gravam alertas com o prefixo `[TESTE]` e os apagam no final.

## 📁 Estrutura do projeto

```text
src/
  app.js / server.js         configuração do Express / inicialização
  config/                    database.js, swagger.js
  collectors/                firms, deter, clima, ar, chuva, cheia, grade, openmeteo
  jobs/agendador.js          agendamento das coletas
  models/                    Queimada, Desmatamento, Clima, Alerta, QualidadeAr, Chuva, Cheia, Coleta
  services/                  queimada, desmatamento, clima, alerta, estado, resumo, relatorio,
                             camadasResumo, coleta
  controllers/               status, resumo, estado, relatorio, queimada, desmatamento, clima,
                             alerta, camadas, resumoCamadas, coleta
  middlewares/               chaveApi.js, coletaSegundoPlano.js, erros.js
  routes/index.js            mapa de rotas
  utils/                     asyncHandler, estados, filtros, periodo, resposta, geo
  data/estados.geojson       contornos dos estados (IBGE)
tests/api.test.js            testes automatizados (Jest + Supertest)
Dockerfile, docker-compose.yml, .dockerignore
```

## ⚠️ Limitações conhecidas

- O FIRMS não informa município; o campo `municipio` das queimadas fica vazio.
- `focos_de_calor` em `/api/resumo` é o total guardado no banco (janela de 7 dias); os focos das últimas 24 h estão em `camadas.queimadas`.
- O Maranhão entra inteiro nos contornos (não só a parte da Amazônia Legal).
- O risco de cheia é uma estimativa simples (vazão de hoje contra a média de 30 dias do próprio modelo GloFAS), não um alerta oficial.
- O clima de cada estado é a média dos pontos da grade, não uma estação meteorológica.
- Para uso em produção com muito tráfego, confira os termos de uso do Open-Meteo (uso não comercial).
- O banco usa o plano gratuito do Atlas (512 MB). O crescimento é limitado pela retenção dos dados (queimadas e chuva por 7 dias, desmatamento por 365 dias).

## 🗺️ Roadmap

- [ ] Front-end em Angular consumindo esta API (repositório separado)
- [ ] Publicação em container no Google Cloud (Cloud Run) com Cloud Scheduler para as coletas. Para o DETER em segundo plano, usar "CPU sempre alocada" ou um Cloud Run Job
- [ ] Ampliar a cobertura dos testes automatizados (Jest + Supertest)
- [ ] Refinar o contorno do Maranhão (apenas Amazônia Legal)
- [x] Reconexão automática ao Atlas
- [x] Coleta do DETER em segundo plano

## 👤 Autor

**Ivan Nalison Cassimiro Xavier**

- GitHub: [ivannalison](https://github.com/ivannalison)
- LinkedIn: Ivan Nalison
- E-mail: nalison.cn@gmail.com  
