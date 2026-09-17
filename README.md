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
