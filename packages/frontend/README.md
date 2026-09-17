# Eldavo frontend

Cliente simple de Expo y React Native para web y Android. Incluye login contra la API, listado de clientes y listado de pedidos.

Desde la raiz del monorepo:

```bash
npm run dev:frontend
npm run web:frontend
npm run android:frontend
```

La URL por defecto es `http://localhost:3005` en web y `http://10.0.2.2:3005` en el emulador Android durante el desarrollo. Para un dispositivo físico, configura `EXPO_PUBLIC_API_URL` en un archivo `.env` local. Las compilaciones Android de producción usan `http://200.89.178.188:3005`.