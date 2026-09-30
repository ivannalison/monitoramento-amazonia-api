// [10] src/utils/asyncHandler.js
// Encaminha erros de funções async para o middleware de erros.
module.exports = (fn) => (req, res, next) =>
  Promise.resolve(fn(req, res, next)).catch(next);