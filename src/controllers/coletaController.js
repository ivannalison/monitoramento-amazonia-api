// ARQUIVO 25 → src/controllers/coletaController.js
// POST /api/coleta/:fonte  (firms | ar | chuva | cheia | todas) - protegida por chave na rota
const asyncHandler = require('../utils/asyncHandler');
const { COLETORES, executarUma } = require('../services/coletaService');

exports.executar = asyncHandler(async (req, res) => {
  const { fonte } = req.params;
  if (fonte === 'todas') {
    const resultado = {};
    for (const f of Object.keys(COLETORES)) resultado[f] = await executarUma(f);
    return res.json({ ok: true, fonte, resultado });
  }
  if (!COLETORES[fonte]) {
    return res.status(404).json({ erro: `Fonte desconhecida. Disponiveis: ${Object.keys(COLETORES).join(', ')}, todas` });
  }
  res.json({ ok: true, fonte, resultado: await executarUma(fonte) });
});