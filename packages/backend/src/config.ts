import fs from 'node:fs';
import path from 'node:path';
import dotenv from 'dotenv';

const environmentCandidates = [
  path.resolve(__dirname, '../../../.env'),
  path.resolve(__dirname, '../../../../.env'),
  path.resolve(__dirname, '../../.env'),
  path.resolve(process.cwd(), '.env'),
];
const envPath = environmentCandidates.find((candidate, index) => environmentCandidates.indexOf(candidate) === index && fs.existsSync(candidate));
const envTemplate = `PORT=3005
DATABASE_PATH=eldavo.db
ADMIN_USERNAME=admin
ADMIN_PASSWORD=admin
JWT_SECRET=change-this-secret
SMTP_HOST=
SMTP_PORT=587
SMTP_SECURE=false
SMTP_USER=
SMTP_PASSWORD=
SMTP_FROM=
`;

export function loadEnvironment(): boolean {
  if (!envPath) {
    const newEnvPath = path.resolve(process.cwd(), '.env');
    fs.writeFileSync(newEnvPath, envTemplate, 'utf8');
    console.error(`No se encontro el archivo .env. Se creo en ${newEnvPath}.`);
    console.error('Edita sus valores y vuelve a ejecutar npm run dev.');
    return false;
  }

  const loadedPaths = environmentCandidates.filter((candidate, index) => environmentCandidates.indexOf(candidate) === index && fs.existsSync(candidate));
  for (const loadedPath of loadedPaths) {
    const values = dotenv.parse(fs.readFileSync(loadedPath, 'utf8'));
    for (const [name, value] of Object.entries(values)) {
      const currentValue = process.env[name]?.trim();
      if (!currentValue || currentValue.startsWith('change-this-')) process.env[name] = value;
    }
  }
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