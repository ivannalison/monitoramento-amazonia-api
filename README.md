# Monitoramento da Amazônia - API

API REST que **organiza e padroniza indicadores ambientais da região amazônica**
(queimadas, desmatamento, clima e alertas), pensada para ser consumida por um site de
monitoramento e relatórios. Alinhada ao **ODS 11 (Cidades e Comunidades Sustentáveis)**.
Desenvolvida em **Node.js** com **Express** e **MongoDB Atlas**.

- 🌐 **API em produção:** https://SEU-PROJETO.vercel.app/api/status
- 📘 **Documentação interativa (Swagger):** https://SEU-PROJETO.vercel.app/api/docs
- 💻 **Repositório:** https://github.com/ivannalison/monitoramento-amazonia-api

> **Sobre os dados:** nesta versão os dados são **demonstrativos**. Todas as respostas trazem o
> campo `fonte` indicando a origem. Quando houver integração com fontes públicas (INPE,
> NASA FIRMS, INMET etc.), a fonte real será informada nesse campo.

## 🎯 Problema e solução

**Problema:** informações de monitoramento ambiental estão espalhadas em diferentes fontes e
formatos, o que dificulta consultá-las de forma simples e organizada.

**Solução:** uma API REST que centraliza esses indicadores em um banco de dados, padroniza o
formato (JSON) e oferece filtros, paginação, estatísticas e um relatório consolidado por estado,
prontos para alimentar mapas, gráficos e painéis em um futuro site.

**ODS 11:** a API não resolve sozinha problemas ambientais. Ela organiza e disponibiliza
informação que pode apoiar aplicações de monitoramento e a resiliência das comunidades.

## 🏗️ Arquitetura

| Camada | Pasta | Responsabilidade |
| --- | --- | --- |
| Rotas | `src/routes` | Mapa dos endpoints |
| Controllers | `src/controllers` | Recebem a requisição e devolvem a resposta HTTP |
| Services | `src/services` | Regras e consultas ao banco |
| Models | `src/models` | Schemas Mongoose e validações |
| Middlewares | `src/middlewares` | Chave de API e tratamento de erros |
| Utils | `src/utils` | Filtros, período/paginação e helpers |
| Config | `src/config` | Conexão com o banco e Swagger |

Fluxo: `Rota -> Controller -> Service -> Model -> MongoDB`

## 🛠️ Tecnologias

Node.js 22, Express, MongoDB Atlas, Mongoose, Swagger/OpenAPI, Postman/PowerShell, Git, GitHub e Vercel.

## 👥 Acesso e permissões

- **Leitura (GET):** pública, com CORS liberado para o futuro site.
- **Escrita (POST, PUT, DELETE em `/api/alertas`):** protegida por chave de API no header `x-api-key`.
  - Local, sem `API_KEY` no `.env`: liberado.
  - Produção sem `API_KEY`: escrita bloqueada (erro 503).
  - Com `API_KEY` definida: exige o header correto (senão, erro 401).

## 📋 Principais endpoints

Documentação interativa completa em `/api/docs`.

| Método | Rota | Descrição | Acesso |
| --- | --- | --- | --- |
| GET | `/api/status` | API online e estado do banco | Público |
| GET | `/api/amazonia` | Informações gerais | Público |
| GET | `/api/resumo` | Resumo dos indicadores | Público |
| GET | `/api/estados` | Lista de estados (menu de filtro) | Público |
| GET | `/api/relatorio` | Relatório consolidado por estado | Público |
| GET | `/api/queimadas` | Focos de calor (paginado) | Público |
| GET | `/api/queimadas/estatisticas` | Totais e intensidade por estado e por dia | Público |
| GET | `/api/desmatamento` | Alertas de desmatamento (paginado) | Público |
| GET | `/api/desmatamento/estatisticas` | Área total/média por estado e por dia | Público |
| GET | `/api/clima` | Condições climáticas | Público |
| GET | `/api/alertas` | Lista alertas | Público |
| GET | `/api/alertas/:id` | Busca um alerta | Público |
| POST | `/api/alertas` | Cria um alerta | Chave de API |
| PUT | `/api/alertas/:id` | Atualiza um alerta | Chave de API |
| DELETE | `/api/alertas/:id` | Remove um alerta | Chave de API |

Campos de um alerta: `tipo` (obrigatório), `nivel` (obrigatório: `baixo`, `moderado`, `alto` ou `critico`),
`descricao` (obrigatório), `estado` (opcional) e `ativo` (opcional, padrão `true`).

### Filtros e parâmetros

| Parâmetro | Vale em | Exemplo |
| --- | --- | --- |
| `estado`, `municipio` | queimadas, desmatamento (e estatísticas) | `?estado=Amazonas` |
| `inicio`, `fim` (AAAA-MM-DD) | queimadas, desmatamento, estatísticas, relatório | `?inicio=2026-09-01&fim=2026-09-30` |
| `pagina`, `limite` (máx. 200) | listas de queimadas e desmatamento | `?pagina=1&limite=10` |
| `tipo`, `nivel`, `estado` | alertas | `?tipo=chuva&nivel=alto` |

### Exemplo: relatório (`GET /api/relatorio?estado=Amazonas`)

```json
{
  "gerado_em": "2026-09-30T12:00:00.000Z",
  "filtros": { "estado": "Amazonas", "inicio": null, "fim": null },
  "fontes": ["Dados demonstrativos"],
  "totais": {
    "focos_de_calor": 2,
    "ocorrencias_desmatamento": 1,
    "area_desmatada_ha": 64.2,
    "alertas": 1,
    "alertas_ativos": 1
  },
  "por_estado": [
    { "estado": "Amazonas", "focos": 2, "intensidade_media": 36.85,
      "desmatamentos": 1, "area_desmatada_ha": 64.2, "alertas": 1, "alertas_ativos": 1 }
  ]
}
```

### Exemplo: criar alerta

```bash
curl -X POST https://SEU-PROJETO.vercel.app/api/alertas \
  -H "Content-Type: application/json" -H "x-api-key: SUA_CHAVE" \
  -d '{"tipo":"chuva","nivel":"alto","descricao":"Chuva forte prevista","estado":"Amazonas"}'
```

## ⚠️ Códigos de resposta

| Código | Significado |
| --- | --- |
| 200 | Sucesso |
| 201 | Criado |
| 400 | Requisição inválida (dado, data, ID ou JSON inválido) |
| 401 | Chave de API ausente ou inválida |
| 404 | Recurso não encontrado |
| 500 | Erro interno |
| 503 | Escrita desabilitada (produção sem `API_KEY`) |

Erros retornam JSON: `{ "erro": "mensagem" }`.

## ⚙️ Configuração

Copie `.env.example` para `.env` e preencha:

```env
PORT=3000
MONGODB_URI=mongodb+srv://USUARIO:SENHA@SEU-CLUSTER.mongodb.net/monitoramento_amazonia?retryWrites=true&w=majority
API_KEY=troque-por-uma-chave-longa-e-secreta
```

⚠️ Nunca suba o `.env` para o GitHub (ele já está no `.gitignore`).

## 🚀 Como executar

Pré-requisitos: Node.js 20+ e uma conta no MongoDB Atlas (usuário criado e IP liberado em Network Access).

```bash
git clone https://github.com/ivannalison/monitoramento-amazonia-api.git
cd monitoramento-amazonia-api
npm install
copy .env.example .env      # edite o .env com sua MONGODB_URI
npm run seed                # popula dados demonstrativos (apaga o conteúdo atual)
npm run dev                 # http://localhost:3000/api/status
```

## ☁️ Deploy na Vercel

1. Suba o projeto ao GitHub.
2. Na Vercel: **Add New > Project** e importe o repositório.
3. Em **Environment Variables**, cadastre `MONGODB_URI` e `API_KEY`.
4. No Atlas, em **Network Access**, permita o acesso da Vercel (IPs dinâmicos; normalmente `0.0.0.0/0`, protegido por usuário e senha fortes).
5. Teste `/api/status` e `/api/docs`.

## 🧪 Testes

Testes manuais (PowerShell/Postman) e pelo Swagger, incluindo erros propositais: nível inválido (400),
campos ausentes (400), ID inválido (400), ID inexistente (404) e data inválida (400).

## 📁 Estrutura do projeto

```text
api/index.js                 entrada da Vercel
src/
  config/                    database.js, swagger.js
  models/                    Queimada, Desmatamento, Clima, Alerta
  services/                  queimada, desmatamento, clima, alerta, estado, resumo, relatorio
  controllers/               status, resumo, estado, relatorio, queimada, desmatamento, clima, alerta
  middlewares/               chaveApi.js, erros.js
  routes/index.js            mapa de rotas
  utils/                     asyncHandler, filtros, periodo, resposta
  seeds/seed.js              dados demonstrativos
  app.js / server.js         configuração do Express / inicialização
vercel.json                  configuração de deploy
```

## 🗺️ Roadmap

- Integração com uma fonte pública real (NASA FIRMS / INPE)
- Atualização automática dos dados
- Rota GeoJSON para mapas
- Frontend com mapa, gráficos e dashboard
- Testes automatizados (Jest + Supertest)

## 👤 Autor

**Ivan Nalison Cassimiro Xavier**

- GitHub: [ivannalison](https://github.com/ivannalison)
- LinkedIn: [Ivan Nalison](https://www.linkedin.com/in/ivan-nalison/)
- E-mail: nalison.cn@gmail.com  