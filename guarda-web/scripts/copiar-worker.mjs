// scripts/copiar-worker.mjs
// O MapLibre 6 desenha os dados (GeoJSON) em um "worker" que ele procura ao lado do proprio codigo.
// O empacotador do Angular move o codigo e o worker some. Esta copia deixa o worker em public/, de onde o site o carrega.
// Rode de novo se atualizar o maplibre-gl:  node scripts/copiar-worker.mjs
import { copyFileSync, existsSync, mkdirSync, readdirSync } from 'node:fs';
import { fileURLToPath } from 'node:url';

const pasta = fileURLToPath(new URL('../node_modules/maplibre-gl/dist/', import.meta.url));
const origem = pasta + 'maplibre-gl-worker.mjs';
const destinoDir = fileURLToPath(new URL('../public/', import.meta.url));
if (!existsSync(origem)) {
  console.error('Nao achei ' + origem);
  if (existsSync(pasta)) console.error('Arquivos com "worker" nessa pasta: ' + readdirSync(pasta).filter((n) => /worker/i.test(n)).join(', '));
  process.exit(2);
}
mkdirSync(destinoDir, { recursive: true });
copyFileSync(origem, destinoDir + 'maplibre-gl-worker.mjs');
console.log('Worker do mapa copiado para public/maplibre-gl-worker.mjs');