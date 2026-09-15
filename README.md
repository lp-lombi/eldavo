# Eldavo monorepo

Monorepo para una futura aplicacion web/Android y su backend.

## Estructura

- `packages/backend`: Express, TypeORM, SQLite y tests de la API.
- `packages/frontend`: reservado para Expo y React Native; aun no implementado.

## Requisitos

- Node.js 20 o superior

## Ejecutar

```bash
npm install
npm run dev
```

La API queda disponible en `http://localhost:3000`.

## Tests

```bash
npm test
npm run build
```

Los tests usan SQLite en memoria. La ejecucion normal usa `eldavo.db`, que se crea automaticamente.

Los comandos ejecutados desde la raiz se delegan al paquete backend. Tambien pueden ejecutarse desde `packages/backend`.

## Endpoints

- `GET /health`
- `GET /clients`
- `GET /clients/:id`
- `POST /clients` con `name` obligatorio y `email`, `phone`, `address` opcionales
- `GET /orders`
- `POST /orders` con `clientId` y `value` obligatorios, y `completionDate` opcional

La coleccion [packages/backend/postman/eldavo-backend.postman_collection.json](packages/backend/postman/eldavo-backend.postman_collection.json) se puede importar directamente en Postman.
