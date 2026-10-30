# PayTrack

Herramienta para encargados de edificios: departamentos, cuotas mensuales, cobros y morosidad.

```
paytrack/
├── mobile/              App Expo (React Native + TypeScript + Expo Router)
├── api/                 API NestJS (validaciones, reglas de negocio, idempotencia)
└── supabase/migrations/ Esquema SQL para Supabase (Postgres + RLS)
```

## 1. Supabase

1. Crea un proyecto en https://supabase.com.
2. En **SQL Editor**, pega y ejecuta `supabase/migrations/0001_paytrack.sql`.
3. En **Authentication > URL Configuration**, agrega en **Redirect URLs**: `paytrack://` y `paytrack://reset-password`. Por ahí regresan los enlaces de confirmación y de recuperación de contraseña.
4. En **Authentication > Sign In / Providers > Email**, deja activada la confirmación de correo.
5. Los encargados se registran desde la app con **Crear cuenta de encargado**. Los enlaces de correo solo abren la app en un development build o en una build publicada, no en Expo Go.
6. Copia los valores que se piden abajo.

## 2. Dónde va cada valor

**`api/.env`** (copia de `api/.env.example`):

| Variable | Dónde está en Supabase |
| --- | --- |
| `DATABASE_URL` | Project Settings > Database > Connection string, modo **Transaction** (puerto 6543) |
| `SUPABASE_URL` | Project Settings > API > Project URL |
| `SUPABASE_ANON_KEY` | Project Settings > API > anon public key |

**`mobile/.env`** (copia de `mobile/.env.example`):

| Variable | Valor |
| --- | --- |
| `EXPO_PUBLIC_SUPABASE_URL` | La misma `SUPABASE_URL` |
| `EXPO_PUBLIC_SUPABASE_ANON_KEY` | La misma `SUPABASE_ANON_KEY` |
| `EXPO_PUBLIC_API_URL` | `http://IP_DE_TU_PC:3000` (la IP local, no `localhost`, para que el teléfono llegue a la API) |

Nunca subas los archivos `.env` ni la clave `service_role` al repositorio. La app móvil solo usa la clave `anon`.

## 3. Ejecutar

```bash
# API
cd api
npm install --legacy-peer-deps
npm run start:dev

# App
cd mobile
npm install --legacy-peer-deps
npx expo start
```

Escanea el QR de Expo con la app Expo Go, o usa un development build.

## 4. Desplegar la API en Vercel

La API se ejecuta como función serverless: `api/index.ts` expone la app Nest y `vercel.json` manda todas las rutas a esa función.

```bash
cd api
npx vercel login
npx vercel link          # crea o enlaza el proyecto en Vercel
```

Agrega las variables de `api/.env` en el panel de Vercel (Project Settings > Environment Variables) o con la CLI: `DATABASE_URL`, `SUPABASE_URL` y `SUPABASE_ANON_KEY`. Luego despliega a producción:

```bash
npx vercel --prod
```

Cuando Vercel te dé la URL (p. ej. `https://paytrack-api.vercel.app`), ponla en `mobile/.env` como `EXPO_PUBLIC_API_URL`.

Para probar que responde, `GET /buildings` sin token debe devolver 401.

## Decisiones de diseño

- **La app nunca escribe en las tablas.** Todo pasa por la API, que valida permisos, montos y estados.
- **RLS activado sin políticas.** La clave `anon` no puede leer ni escribir datos directamente.
- **Importes en centavos** (enteros) para evitar errores de punto flotante.
- **Pagos idempotentes.** Cada toque de "Cobrar" genera una clave; un reintento de red no duplica el cobro.
- **Morosidad calculada en el servidor** a partir del saldo y la fecha de vencimiento.

## Pendiente

- Unir vecinos a su departamento con el código o QR del edificio (el código ya se genera).
- Recordatorios por notificación push (Expo Notifications).
- Varios edificios por encargado (hoy se usa el primero).
- Fuentes de marca (Sora, DM Sans, Space Grotesk) y modo oscuro completo en las pantallas.
- Pruebas automatizadas del servicio de pagos.
