// [44] src/config/swagger.js
// Documentação OpenAPI 3.0, exibida em /api/docs

const q = (name, description, extra = {}) => ({
  name, in: 'query', required: false, schema: { type: 'string', ...extra }, description,
});

const P = {
  estado: q('estado', 'Ex.: Amazonas'),
  municipio: q('municipio', 'Ex.: Lábrea'),
  inicio: q('inicio', 'Data inicial (AAAA-MM-DD)', { format: 'date' }),
  fim: q('fim', 'Data final (AAAA-MM-DD)', { format: 'date' }),
  pagina: { name: 'pagina', in: 'query', required: false, schema: { type: 'integer', minimum: 1, default: 1 }, description: 'Página' },
  limite: { name: 'limite', in: 'query', required: false, schema: { type: 'integer', minimum: 1, maximum: 200, default: 50 }, description: 'Itens por página (máx. 200)' },
  id: { name: 'id', in: 'path', required: true, schema: { type: 'string' }, description: 'ID do alerta (ObjectId do MongoDB)' },
};

const R = {
  200: { description: 'Sucesso' },
  400: { description: 'Requisição inválida' },
  500: { description: 'Erro interno' },
};

const get = (tag, summary, parameters = []) => ({
  get: { tags: [tag], summary, parameters, responses: R },
});

const alertaSchema = (obrigatorios) => ({
  type: 'object',
  required: obrigatorios,
  properties: {
    tipo: { type: 'string', example: 'chuva' },
    nivel: { type: 'string', enum: ['baixo', 'moderado', 'alto', 'critico'], example: 'moderado' },
    descricao: { type: 'string', example: 'Chuva forte prevista' },
    estado: { type: 'string', example: 'Amazonas' },
    ativo: { type: 'boolean', example: true },
  },
});

const corpo = (obrigatorios) => ({
  required: true,
  content: { 'application/json': { schema: alertaSchema(obrigatorios) } },
});

const seguro = [{ ChaveApi: [] }];
const errosEscrita = {
  400: { description: 'Dados inválidos' },
  401: { description: 'Chave de API ausente ou inválida' },
  500: { description: 'Erro interno' },
};

module.exports = {
  openapi: '3.0.0',
  info: {
    title: 'Monitoramento da Amazônia API',
    version: '2.0.0',
    description:
      'API REST que organiza indicadores ambientais da Amazônia. Os dados atuais são demonstrativos (veja o campo "fonte"). ' +
      'Rotas que alteram dados (POST/PUT/DELETE) usam o header x-api-key quando API_KEY está configurada.',
  },
  servers: [{ url: '/' }],
  components: {
    securitySchemes: { ChaveApi: { type: 'apiKey', in: 'header', name: 'x-api-key' } },
  },
  paths: {
    '/api/status': get('Geral', 'Verifica se a API está online'),
    '/api/amazonia': get('Geral', 'Informações gerais'),
    '/api/resumo': get('Resumo', 'Resumo dos indicadores'),
    '/api/estados': get('Geral', 'Lista de estados (para menus de filtro)'),
    '/api/relatorio': get('Relatório', 'Relatório consolidado por estado', [P.estado, P.inicio, P.fim]),

    '/api/queimadas': get('Queimadas', 'Lista focos de calor (paginado)', [P.estado, P.municipio, P.inicio, P.fim, P.pagina, P.limite]),
    '/api/queimadas/estatisticas': get('Queimadas', 'Estatísticas por estado e por dia', [P.estado, P.municipio, P.inicio, P.fim]),

    '/api/desmatamento': get('Desmatamento', 'Lista alertas de desmatamento (paginado)', [P.estado, P.municipio, P.inicio, P.fim, P.pagina, P.limite]),
    '/api/desmatamento/estatisticas': get('Desmatamento', 'Estatísticas por estado e por dia', [P.estado, P.municipio, P.inicio, P.fim]),

    '/api/clima': get('Clima', 'Condições climáticas', [P.estado]),

    '/api/alertas': {
      ...get('Alertas', 'Lista alertas ambientais', [
        q('tipo', 'Ex.: chuva, seca, cheia, queimada'),
        q('nivel', 'baixo, moderado, alto ou critico'),
        P.estado,
      ]),
      post: {
        tags: ['Alertas'],
        summary: 'Cria um alerta',
        security: seguro,
        requestBody: corpo(['tipo', 'nivel', 'descricao']),
        responses: { 201: { description: 'Alerta criado' }, ...errosEscrita },
      },
    },
    '/api/alertas/{id}': {
      get: {
        tags: ['Alertas'],
        summary: 'Busca um alerta pelo ID',
        parameters: [P.id],
        responses: { ...R, 404: { description: 'Alerta não encontrado' } },
      },
      put: {
        tags: ['Alertas'],
        summary: 'Atualiza um alerta (envie só os campos que mudam)',
        security: seguro,
        parameters: [P.id],
        requestBody: corpo([]),
        responses: { 200: { description: 'Alerta atualizado' }, ...errosEscrita, 404: { description: 'Alerta não encontrado' } },
      },
      delete: {
        tags: ['Alertas'],
        summary: 'Remove um alerta',
        security: seguro,
        parameters: [P.id],
        responses: { 200: { description: 'Alerta removido' }, ...errosEscrita, 404: { description: 'Alerta não encontrado' } },
      },
    },
  },
};