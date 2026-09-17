# Compilar para Android

## Requisitos

- Node.js 20 o superior.
- Cuenta de Expo/EAS.
- Android Studio y un emulador o dispositivo para desarrollo local.
- Backend accesible en el puerto `3005`.

## Desarrollo local

Desde la raiz del repositorio:

```powershell
npm install
npm run dev:backend
```

En otra terminal, iniciar Expo para Android:

```powershell
npm run android:frontend
```

Durante el desarrollo, la URL se configura con `EXPO_PUBLIC_API_URL` en `packages/frontend/.env`.

- Emulador Android: `http://10.0.2.2:3005`
- Dispositivo fisico: `http://IP_LOCAL_DE_LA_PC:3005`

## Preparar EAS

Instalar EAS CLI una sola vez:

```powershell
npm install -g eas-cli
```

Iniciar sesion:

```powershell
eas login
```

La configuracion ya esta creada en `packages/frontend/eas.json`. Si fuera necesario regenerarla:

```powershell
cd packages/frontend
eas build:configure
```

## Generar APK instalable

Desde `packages/frontend`:

```powershell
cd packages/frontend
eas build --platform android --profile preview
```

El perfil `preview` genera una build interna, normalmente un APK instalable para pruebas.

## Generar build de produccion

Desde `packages/frontend`:

```powershell
cd packages/frontend
eas build --platform android --profile production
```

El perfil `production` genera un AAB para publicar en Google Play.

En una build Android de produccion la aplicacion usa automaticamente:

```text
http://200.89.178.188:3005
```

## Antes de probar produccion

1. Compilar y levantar el backend usando el puerto `3005`.
2. Confirmar que el servidor sea accesible desde Internet.
3. Abrir el puerto `3005` en firewall y router si corresponde.
4. Verificar que la IP publica no haya cambiado.
5. Ejecutar el build EAS desde `packages/frontend`.

## Ver builds

```powershell
eas build:list --platform android
```

EAS muestra el enlace de descarga del APK o el resultado de la build en su panel web.
