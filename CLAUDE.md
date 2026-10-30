# Cotransport Oristà

Web app de coche compartido entre vecinos de un pueblo sin transporte público. El uso principal es desde el navegador del móvil.

## Stack

- Frontend: React 18, Vite y TypeScript (strict). Enrutado con `HashRouter` de react-router v6.
- Backend: Supabase (Postgres, Auth con usuario y contraseña, Realtime). No hay servidor propio.
- Estilos: un único `src/styles.css` con variables CSS. No se usa ninguna librería de UI.

## Comandos

- `npm run dev`: servidor de desarrollo en el puerto 5173, accesible desde la red local.
- `npm run build`: comprobación de tipos (`tsc --noEmit`) y build a `dist/`.
- `npm run typecheck`: solo la comprobación de tipos.

## Convenciones

- Idioma principal de la interfaz: **catalán**; alternativa: español de España. Ningún texto visible va escrito a mano en los componentes:
  - Se usa `t('clave')` / `tn('base', n)` (hook `useT()` de `src/lib/i18n.tsx`) y los textos viven en `src/lib/locales/ca.ts` (fuente de las claves) y `es.ts` (tipado con `Dict`, así que TypeScript avisa si falta una clave).
  - Fuera de componentes (formato de fechas, errores) se usa `tr()`, que lee el idioma actual. Todo componente que muestre texto debe llamar a `useT()` para repintarse al cambiar de idioma.
  - Los valores guardados en la base de datos (`oferta`, `peticion`, `trabajo`, `pendiente`…) siguen siendo identificadores internos en español; solo se traducen al mostrarlos.
  - Los errores de los triggers y RPC llegan como códigos `err_*` y se traducen con `errorText()` (claves `db.err_*`). Al añadir una excepción nueva en SQL, añade su clave en ambos idiomas.
- Login por **usuario y contraseña**: se convierte a un email ficticio (`usernameToEmail` en `src/lib/config.ts`) porque Supabase exige uno. Requiere «Confirm email» desactivado y no hay recuperación por correo.
- El nombre del pueblo y los lugares frecuentes están en `src/lib/config.ts`.
- Diseño **mobile-first**:
  - Áreas táctiles de al menos 44–48 px.
  - Inputs a 17 px para evitar el zoom automático de iOS.
  - Barra de navegación inferior fija que respeta las `safe-area-inset`.
- Las reglas de negocio viven en la base de datos (`supabase/schema.sql`):
  - Estados de los compromisos y control de plazas por día: trigger `commitments_guard`.
  - Aceptar o rechazar propuestas: RPC `respond_proposal` / `withdraw_proposal`.
  - Permisos: políticas RLS.
  - El frontend no debe duplicar ni sustituir estas reglas; solo las refleja en la interfaz.
- Cualquier cambio de esquema se añade a `supabase/schema.sql`. Si el proyecto ya está desplegado, va además en un script de migración aparte en `supabase/`.
- Días de la semana en formato ISO: 1 = lunes … 7 = domingo. Las fechas se guardan como `date` (YYYY-MM-DD) y las horas como `time`.
- Las consultas con joins usan `TRIP_SELECT` de `src/lib/supabase.ts`. El resultado se convierte con `as unknown as Trip`, porque el parser de tipos de supabase-js no entiende el select concatenado.

## Modelo de datos

- `profiles`: perfil de cada vecino, en relación 1:1 con `auth.users`.
- `vehicles`: vehículos de cada vecino.
- `trips`:
  - `kind`: `oferta` o `peticion`.
  - `schedule`: `puntual` (usa `trip_date`) o `recurrente` (usa `days_of_week` y `valid_until`).
  - `status`: `activo` o `cancelado`.
- `commitments`: un vecino se apunta a un viaje, como `pasajero` o como `conductor`. Estados: `pendiente`, `confirmado`, `rechazado` o `cancelado`. Solo quien organiza puede confirmar o rechazar.
- `change_proposals`: propuestas de cambio de fecha, días, horas o punto de recogida. Al aceptarlas se aplican al viaje.
