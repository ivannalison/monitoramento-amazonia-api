// [43] src/routes/index.js
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

const router = Router();

router.get('/status', status.status);
router.get('/amazonia', status.amazonia);
router.get('/resumo', resumo.obter);
router.get('/estados', estados.listar);
router.get('/relatorio', relatorio.obter);                     // ?estado= &inicio= &fim=

// IMPORTANTE: /estatisticas vem ANTES da rota geral
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

module.exports = router;