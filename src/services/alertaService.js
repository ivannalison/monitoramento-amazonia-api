// [39] src/services/alertaService.js
const Alerta = require('../models/Alerta');
const { montarFiltro } = require('../utils/filtros');

// Só estes campos podem ser gravados pelo cliente (evita gravar campos indevidos).
const CAMPOS = ['tipo', 'nivel', 'descricao', 'estado', 'ativo', 'fonte'];

function extrair(body) {
  const dados = {};
  for (const campo of CAMPOS) {
    if (body && body[campo] !== undefined) dados[campo] = body[campo];
  }
  return dados;
}

async function listar(query) {
  const filtro = montarFiltro(query, ['tipo', 'nivel', 'estado']);
  return Alerta.find(filtro).sort({ ultima_atualizacao: -1 }).lean();
}

async function buscarPorId(id) {
  return Alerta.findById(id).lean();
}

async function criar(body) {
  const dados = extrair(body);
  if (!dados.fonte) dados.fonte = 'Cadastro via API';
  const criado = await Alerta.create(dados); // validações do model → erro 400
  return criado.toObject();
}

async function atualizar(id, body) {
  const dados = extrair(body);
  if (Object.keys(dados).length === 0) {
    return { erro: 'Envie ao menos um campo para atualizar (tipo, nivel, descricao, estado, ativo, fonte).' };
  }
  dados.ultima_atualizacao = new Date();
  const alerta = await Alerta.findByIdAndUpdate(id, dados, { new: true, runValidators: true }).lean();
  return { alerta };
}

async function remover(id) {
  return Alerta.findByIdAndDelete(id).lean();
}

module.exports = { listar, buscarPorId, criar, atualizar, remover };