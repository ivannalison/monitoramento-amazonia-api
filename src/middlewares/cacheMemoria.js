// src/middlewares/cacheMemoria.js
// Cache em memoria (por URL) para rotas pequenas e lentas. Desligado nos testes.
module.exports = function cacheMemoria(ttlMs = 30000) {
  const guarda = new Map();
  return (req, res, next) => {
    if (process.env.NODE_ENV === 'test' || req.method !== 'GET') return next();
    const chave = req.originalUrl;
    const hit = guarda.get(chave);
    if (hit && hit.expira > Date.now()) return res.status(200).json(hit.corpo);
    const original = res.json.bind(res);
    res.json = (corpo) => {
      if (res.statusCode === 200) {
        if (guarda.size > 200) guarda.clear();
        guarda.set(chave, { corpo, expira: Date.now() + ttlMs });
      }
      return original(corpo);
    };
    next();
  };
};