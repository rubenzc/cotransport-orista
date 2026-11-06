# Cotransport Oristà

Web app de coche compartido entre vecinos de un pueblo sin transporte público. El uso principal es desde el navegador del móvil.

## Stack

- Frontend: React 18, Vite y TypeScript (strict). Enrutado con `HashRouter` de react-router v7 (se importa de `react-router-dom`). Iconos: `lucide-react`.
- Backend: Supabase (Postgres, Auth con usuario y contraseña, Realtime). No hay servidor propio.
- Estilos: un único `src/styles.css` con variables CSS. No se usa ninguna librería de componentes de UI.

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
- Login por **usuario y contraseña**: se convierte a un email ficticio (`usernameToEmail` en `src/lib/config.ts`) porque Supabase exige uno. Requiere «Confirm email» desactivado y no hay recuperación por correo: el administrador restablece o borra la cuenta desde Supabase (ver README, sección Administración). Al cerrar sesión se vuelve a `#/` para que la persona siguiente no herede la pantalla anterior.
- El nombre del pueblo y los lugares frecuentes están en `src/lib/config.ts`.
- **Iconos planos, nunca emojis.** En la interfaz se usa `<Icon name="…" />` (`src/components/Icon.tsx`, iconos de Lucide que heredan `currentColor`). Para añadir uno, impórtalo en ese archivo y regístralo en `ICONS`. Ni los textos de `locales/` ni el JSX llevan emojis.
- **Tema claro/oscuro**: `src/lib/theme.ts`. «Automático» no fija nada y manda `prefers-color-scheme`; «Claro»/«Oscuro» ponen `<html data-theme>` y ganan sobre el dispositivo. Un script en `index.html` lo aplica antes de pintar (sin parpadeo). En `styles.css` los colores oscuros están en **dos bloques que deben tener los mismos valores** (`@media … :root:not([data-theme='light'])` y `:root[data-theme='dark']`).
- En la pantalla de acceso el idioma va como `LangLinks` (enlaces discretos bajo el formulario: contraste ≥ 4,5:1, zona de 44 px, `lang` en cada opción, `aria-pressed`); el selector segmentado `LangSwitch` solo se usa en el Perfil.
- **Contraste**: en modo claro y oscuro, todo texto debe llegar a 4,5:1 (WCAG AA). Al tocar colores de `styles.css`, recalcula los pares (texto/fondo de `.badge`, `.notice`, `.btn`, `.count`…).
- Un texto escrito por el usuario (descripción, mensajes, nombres) puede traer una palabra o URL larguísima: `body` lleva `overflow-wrap: anywhere` para que no ensanche la página. No lo quites.
- El botón de enviar de los formularios va **al final del formulario, sin posición fija** (en `TripForm` va debajo de la descripción).
- Logo e iconos de la app: `public/icon.svg` (con esquinas) e `public/icon-maskable.svg` (a sangre completa, dibujo en la zona segura). Los PNG (`icon-192`, `icon-512`, `icon-maskable-512`, `apple-touch-icon`, `favicon-32`) se generan dibujando esos SVG en un canvas del navegador; si cambias el logo hay que regenerarlos. iOS necesita el `apple-touch-icon` sin transparencia.
- Los mensajes de error de PostgREST/Postgres que llegan al usuario se traducen en `errorText()` (`PGRST116` = «no encontrado», `23503` = dato inexistente). Los formularios de edición de recursos ajenos o inexistentes muestran solo el error y un enlace para volver, sin el formulario.
- Diseño **mobile-first**:
  - Áreas táctiles de al menos 44–48 px.
  - Inputs a 17 px para evitar el zoom automático de iOS.
  - Barra de navegación inferior fija que respeta las `safe-area-inset`.
- Las reglas de negocio viven en la base de datos (`supabase/schema.sql`):
  - Estados de los compromisos y control de plazas por día: trigger `commitments_guard` (además: los días de un compromiso deben ser del viaje, y un viaje cancelado es solo lectura salvo borrarse).
  - Plazas nunca por debajo de las confirmadas y tipo de viaje bloqueado con gente apuntada: trigger `trips_guard`.
  - Aceptar o rechazar propuestas: RPC `respond_proposal` / `withdraw_proposal`.
  - Permisos: políticas RLS.
  - El frontend no debe duplicar ni sustituir estas reglas; solo las refleja en la interfaz.
- Cualquier cambio de esquema se añade a `supabase/schema.sql` (estado final, para instalaciones nuevas) **y** en un archivo numerado nuevo de `supabase/migrations/` (idempotente, para el proyecto ya desplegado). El administrador ejecuta la migración a mano en el SQL Editor de Supabase; hay que avisarle.
- **Gastos**: `trips.distance_km` (km del recorrido, opcional) y la tarifa `KM_RATE` (`src/lib/config.ts`, 0,26 €/km en 2026; revisar cada año). El coste no se guarda: se calcula con `tripCost` / `costSharers` / `costPerPerson` de `src/lib/format.ts`. Reparto: conductor + pasajeros confirmados (en peticiones, personas + un conductor), nunca más que las plazas del vehículo (`seats` + 1).
- Vehículos: `smoking` y `pets` (booleanos, por defecto falso); se muestran con `VehicleRules` (icono + texto, nunca solo color).
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
