import fs from 'node:fs';
import path from 'node:path';
import dotenv from 'dotenv';

const envPath = path.resolve(process.cwd(), '.env');
const envTemplate = `PORT=3005
DATABASE_PATH=eldavo.db
ADMIN_USERNAME=admin
ADMIN_PASSWORD=admin
JWT_SECRET=change-this-secret
`;

export function loadEnvironment(): boolean {
  if (!fs.existsSync(envPath)) {
    fs.writeFileSync(envPath, envTemplate, 'utf8');
    console.error(`No se encontro el archivo .env. Se creo en ${envPath}.`);
    console.error('Edita sus valores y vuelve a ejecutar npm run dev.');
    return false;
  }

  dotenv.config({ path: envPath });
  const requiredVariables = ['ADMIN_USERNAME', 'ADMIN_PASSWORD', 'JWT_SECRET'];
  const missingVariables = requiredVariables.filter((variable) => {
    const value = process.env[variable]?.trim();
    return !value || value.startsWith('change-this-');
  });
  if (missingVariables.length > 0) {
    console.error(`El archivo .env no tiene estas variables: ${missingVariables.join(', ')}.`);
    console.error('Completalas y vuelve a ejecutar npm run dev.');
    return false;
  }

  return true;
}