// [44] src/config/swagger.js
// Documentação OpenAPI 3.0, exibida em /api/docs

const q = (name, description, extra = {}) => ({
  name, in: 'query', required: false, schema: { type: 'string', ...extra }, description,
});

const P = {
  estado: q('estado', 'Sigla ou nome. Ex.: AM ou Amazonas'),
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
    version: '2.1.0',
    description:
      'API REST que organiza indicadores ambientais da Amazônia. Todos os dados v\u00eam de fontes p\u00fablicas reais: NASA FIRMS (queimadas), INPE DETER (desmatamento) e Open-Meteo (ar, chuva, cheias e clima). Veja o campo "fonte" de cada resposta. ' +
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

    '/api/queimadas/geojson': get('Queimadas', 'Focos em GeoJSON para o mapa (padr\u00e3o 5.000 pontos, m\u00e1ximo 10.000 com o par\u00e2metro limite)', [q('satelite', 'modis, noaa20 ou suomi'), q('horas', 'Janela em horas (1 a 168, padr\u00e3o 24)'), P.estado, P.municipio, q('bbox', '\u00c1rea vis\u00edvel do mapa: minLon,minLat,maxLon,maxLat (ex.: -70,-10,-60,0)'), q('limite', 'M\u00e1ximo de pontos (1 a 10000, padr\u00e3o 5000)')]),
    '/api/qualidade-ar/geojson': get('Camadas', 'Qualidade do ar e fuma\u00e7a (GeoJSON, leitura mais recente de cada ponto)', [P.estado]),
    '/api/chuvas/geojson': get('Camadas', 'Chuva por hora (GeoJSON)', [q('hora', 'Hora da previs\u00e3o, ex.: 2026-10-20T15:00'), P.estado]),
    '/api/cheias/geojson': get('Camadas', 'Risco de cheia pela vaz\u00e3o dos rios (GeoJSON)', [q('nivel', 'normal, atencao, alto ou extremo (padr\u00e3o: acima do normal)'), P.estado]),
    '/api/fontes': get('Camadas', 'Fontes de dados, \u00faltima coleta e situa\u00e7\u00e3o'),
    '/api/camadas/resumo': get('Camadas', 'Resumo de queimadas, ar, chuva e cheias', [P.estado, q('horas', 'Janela das queimadas em horas (1 a 168, padr\u00e3o 24)')]),
    '/api/coleta/{fonte}': {
      post: {
        tags: ['Coleta'],
        summary: 'Dispara a coleta de uma fonte (usada pelo agendador e pelo Cloud Scheduler)',
        security: seguro,
        parameters: [{ name: 'fonte', in: 'path', required: true, schema: { type: 'string', enum: ['firms', 'ar', 'chuva', 'cheia', 'desmatamento', 'clima', 'todas'] }, description: 'Fonte a coletar' }],
        responses: { 200: { description: 'Coleta executada' }, ...errosEscrita, 404: { description: 'Fonte desconhecida' } },
      },
    },
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