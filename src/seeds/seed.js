// [28] src/seeds/seed.js
// Popula o banco com DADOS DEMONSTRATIVOS. Rodar com: npm run seed
// ATENÇÃO: apaga o conteúdo atual das 4 coleções.

require('dotenv').config();
const mongoose = require('mongoose');
const Queimada = require('../models/Queimada');
const Desmatamento = require('../models/Desmatamento');
const Clima = require('../models/Clima');
const Alerta = require('../models/Alerta');

const FONTE = 'Dados demonstrativos';
const agora = new Date();
const diasAtras = (n) => new Date(agora.getTime() - n * 86400000);

const queimadas = [
  { data: diasAtras(1), estado: 'Amazonas', municipio: 'Lábrea', latitude: -7.26, longitude: -64.79, intensidade: 42.5 },
  { data: diasAtras(1), estado: 'Amazonas', municipio: 'Apuí', latitude: -7.19, longitude: -59.89, intensidade: 31.2 },
  { data: diasAtras(2), estado: 'Pará', municipio: 'Altamira', latitude: -3.2, longitude: -52.21, intensidade: 55.8 },
  { data: diasAtras(2), estado: 'Rondônia', municipio: 'Porto Velho', latitude: -8.76, longitude: -63.9, intensidade: 27.4 },
  { data: diasAtras(3), estado: 'Acre', municipio: 'Rio Branco', latitude: -9.97, longitude: -67.81, intensidade: 36.0 },
  { data: diasAtras(3), estado: 'Mato Grosso', municipio: 'Colniza', latitude: -9.46, longitude: -59.45, intensidade: 48.9 },
].map((d) => ({ ...d, fonte: FONTE, ultima_atualizacao: agora }));

const desmatamentos = [
  { data: diasAtras(5), estado: 'Pará', municipio: 'Novo Progresso', area_ha: 120.5 },
  { data: diasAtras(6), estado: 'Amazonas', municipio: 'Boca do Acre', area_ha: 64.2 },
  { data: diasAtras(7), estado: 'Rondônia', municipio: 'Machadinho d\'Oeste', area_ha: 88.0 },
  { data: diasAtras(8), estado: 'Mato Grosso', municipio: 'Colniza', area_ha: 150.3 },
  { data: diasAtras(9), estado: 'Acre', municipio: 'Feijó', area_ha: 39.7 },
].map((d) => ({ ...d, fonte: FONTE, ultima_atualizacao: agora }));

const clima = [
  { estado: 'Amazonas', condicao: 'Chuva moderada', temperatura: 28, umidade: 85 },
  { estado: 'Pará', condicao: 'Nublado', temperatura: 30, umidade: 78 },
  { estado: 'Acre', condicao: 'Parcialmente nublado', temperatura: 31, umidade: 70 },
  { estado: 'Rondônia', condicao: 'Sol com nuvens', temperatura: 33, umidade: 62 },
].map((d) => ({ ...d, regiao: 'Amazônia', fonte: FONTE, ultima_atualizacao: agora }));

const alertas = [
  { tipo: 'chuva', nivel: 'moderado', descricao: 'Alerta demonstrativo de chuva forte', estado: 'Amazonas' },
  { tipo: 'seca', nivel: 'alto', descricao: 'Alerta demonstrativo de estiagem', estado: 'Acre' },
  { tipo: 'cheia', nivel: 'baixo', descricao: 'Alerta demonstrativo de elevação de rio', estado: 'Pará' },
  { tipo: 'queimada', nivel: 'alto', descricao: 'Alerta demonstrativo de focos de calor', estado: 'Rondônia' },
].map((d) => ({ ...d, ativo: true, fonte: FONTE, ultima_atualizacao: agora }));

async function executar() {
  if (!process.env.MONGODB_URI) {
    console.error('❌ Defina MONGODB_URI no .env antes de rodar o seed.');
    process.exit(1);
  }
  try {
    await mongoose.connect(process.env.MONGODB_URI, { serverSelectionTimeoutMS: 8000 });
    console.log('✅ Conectado. Limpando coleções...');

    await Promise.all([
      Queimada.deleteMany({}),
      Desmatamento.deleteMany({}),
      Clima.deleteMany({}),
      Alerta.deleteMany({}),
    ]);

    await Queimada.insertMany(queimadas);
    await Desmatamento.insertMany(desmatamentos);
    await Clima.insertMany(clima);
    await Alerta.insertMany(alertas);

    console.log('🌱 Seed concluído:');
    console.log(`   queimadas: ${queimadas.length} | desmatamentos: ${desmatamentos.length} | clima: ${clima.length} | alertas: ${alertas.length}`);
  } catch (erro) {
    console.error('❌ Erro no seed:', erro.message);
    process.exitCode = 1;
  } finally {
    await mongoose.disconnect();
  }
}

executar();