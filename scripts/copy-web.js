const fs = require('node:fs');
const path = require('node:path');

const repositoryRoot = path.resolve(__dirname, '..');
const sourceDirectory = path.join(repositoryRoot, 'packages', 'frontend', 'dist');
const targetDirectory = path.join(repositoryRoot, 'packages', 'backend', 'public');

if (!fs.existsSync(sourceDirectory)) {
  throw new Error(`No se encontro la salida web en ${sourceDirectory}`);
}

fs.rmSync(targetDirectory, { force: true, recursive: true });
fs.cpSync(sourceDirectory, targetDirectory, { recursive: true });
console.log(`Frontend web copiado a ${targetDirectory}`);