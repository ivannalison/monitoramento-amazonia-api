// [43] src/routes/index.js  (ARQUIVO 9)
const { Router } = require('express');
const exigirChave = require('../middlewares/chaveApi');
const status = require('../controllers/statusController');
const resumo = require('../controllers/resumoController');
const estados = require('../controllers/estadoController');
const relatorio = require('../controllers/relatorioController');
const queimadas = require('../controllers/queimadaController');
const desmatamento = require('../controllers/desmatamentoController');
const clima = require('../controllers/climaController');
const alertas = require('../controllers/alertaController');
const coleta = require('../controllers/coletaController');
const camadas = require('../controllers/camadasController');
const resumoCamadas = require('../controllers/resumoCamadasController');

const router = Router();

router.get('/status', status.status);
router.get('/amazonia', status.amazonia);
router.get('/resumo', resumo.obter);
router.get('/estados', estados.listar);
router.get('/relatorio', relatorio.obter);                     // ?estado= &inicio= &fim=

// IMPORTANTE: /geojson e /estatisticas vêm ANTES da rota geral
router.get('/queimadas/geojson', queimadas.geojson);           // ?satelite= &horas= &estado=
router.get('/queimadas/estatisticas', queimadas.estatisticas);
router.get('/queimadas', queimadas.listar);                    // ?estado= &municipio= &inicio= &fim= &pagina= &limite=
router.get('/desmatamento/estatisticas', desmatamento.estatisticas);
router.get('/desmatamento', desmatamento.listar);              // idem

router.get('/clima', clima.listar);                            // ?estado=

router.get('/alertas', alertas.listar);                        // ?tipo= &nivel= &estado=
router.get('/alertas/:id', alertas.obter);
router.post('/alertas', exigirChave, alertas.criar);
router.put('/alertas/:id', exigirChave, alertas.atualizar);
router.delete('/alertas/:id', exigirChave, alertas.remover);

// NOVO: camadas do mapa e situacao das fontes
router.get('/qualidade-ar/geojson', camadas.ar);
router.get('/chuvas/geojson', camadas.chuva);          // ?hora=
router.get('/cheias/geojson', camadas.cheia);
router.get('/fontes', camadas.fontes);
router.get('/camadas/resumo', resumoCamadas.obter);       // ?estado= &horas=

// NOVO: dispara a coleta de uma fonte (protegida pela chave)
router.post('/coleta/:fonte', exigirChave, coleta.executar);

module.exports = router;