# Eldavo monorepo

Monorepo para una futura aplicacion web/Android y su backend.

## Estructura

- `packages/backend`: Express, TypeORM, SQLite y tests de la API.
- `packages/frontend`: aplicación Expo y React Native para web y Android.

## Requisitos

- Node.js 20 o superior

## Ejecutar

```bash
npm install
npm run dev
```

La API queda disponible en `http://localhost:3005`.

Para compilar la aplicación web y servirla desde el mismo servidor del backend:

```bash
npm run build:web
npm run start:backend
```

El comando genera la web de Expo, la copia a `packages/backend/public` y compila el backend. La aplicación queda disponible en `http://localhost:3005`.

En el VPS, ejecuta el build completo después de cada actualización del código. `packages/backend/public` es un artefacto generado y no se sube al repositorio:

```bash
git pull origin main
npm ci --no-audit --no-fund --maxsockets=1
npm run build:web
npm run start:backend
```

Usa `npm ci`, no `npm run ci`. Si `npm ci` termina simplemente con `Killed`, el sistema se quedó sin memoria. En una VPS con poca RAM, agrega swap antes de instalar:

```bash
sudo fallocate -l 2G /swapfile
sudo chmod 600 /swapfile
sudo mkswap /swapfile
sudo swapon /swapfile
npm ci --no-audit --no-fund --maxsockets=1
```

Si utilizas PM2 o systemd, reinicia el proceso después de `npm run build:web`. La web de producción usa la misma URL del backend para sus llamadas a la API.

En otra terminal, ejecuta el frontend:

```bash
npm run dev:frontend
```

Para abrirlo directamente en web usa `npm run web:frontend`; para Android, `npm run android:frontend`.
La app usa `http://localhost:3005` en web y `http://10.0.2.2:3005` en el emulador Android durante el desarrollo. Para un teléfono físico, crea `packages/frontend/.env` a partir de `.env.example` y cambia `EXPO_PUBLIC_API_URL` por la IP local de tu computadora. En una compilación Android de producción usa `http://200.89.178.188:3005` automáticamente.

La primera vez que ejecutes el backend, si no existe `.env`, se creara una plantilla y el proceso se detendra. Edita sus valores y vuelve a ejecutar `npm run dev`:

```powershell
$env:ADMIN_USERNAME = "admin"
$env:ADMIN_PASSWORD = "cambia-esta-clave"
$env:JWT_SECRET = "cambia-este-secreto-largo"
npm run dev
```

Si `.env` existe pero le faltan valores obligatorios, el backend tambien avisara y no iniciara.

`ADMIN_PASSWORD` se convierte en hash antes de guardarse. El login es `POST /auth/login` y devuelve un token JWT; envialo en las rutas protegidas como `Authorization: Bearer <token>`.

## Tests

```bash
npm test
npm run build
```

Los tests usan SQLite en memoria. La ejecucion normal usa `eldavo.db`, que se crea automaticamente.

Para cargar datos de prueba (80 clientes, 40 pedidos, etiquetas y notas) ejecuta:

```bash
npm run seed:backend
```

El seeder reemplaza solamente los registros de prueba identificados por sus prefijos y puede ejecutarse varias veces.

Los comandos ejecutados desde la raiz se delegan al paquete backend. Tambien pueden ejecutarse desde `packages/backend`.

## Endpoints

- `GET /health`
- `POST /auth/login` con `username` y `password`
- `GET /clients` (requiere login)
- `GET /clients/:id` (requiere login)
- `POST /clients` (requiere login), con `name` obligatorio y `email`, `phone`, `address` opcionales
- `GET /orders` (requiere login)
- `POST /orders` (requiere login), con `clientId` y `value` obligatorios, y `completionDate` opcional

La coleccion [packages/backend/postman/eldavo-backend.postman_collection.json](packages/backend/postman/eldavo-backend.postman_collection.json) se puede importar directamente en Postman.
