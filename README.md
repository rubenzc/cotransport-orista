# Cotransport Oristà

Web app para que los vecinos de un pueblo sin transporte público compartan coche. Está pensada para usarse desde el navegador del móvil y se puede instalar como app (PWA).

## Qué se puede hacer

- **Publicar viajes** de dos tipos:
  - *Tengo coche*: ofreces plazas libres.
  - *Necesito que me lleven*: pides que alguien te lleve.
- **Datos de cada viaje**: tipo de trayecto (trabajo, médico, compras, estudios…), origen, destino, puntos de recogida, fecha concreta o días de la semana (con fecha de fin opcional), hora de salida, hora de vuelta, duración, plazas o personas, vehículo y descripción.
- **Apuntarse** a un viaje: plazas necesarias, punto de recogida, días concretos (en viajes semanales) y un mensaje. Quien organiza **confirma o rechaza** cada solicitud. El sistema no deja confirmar más plazas de las que hay, día a día.
- **Proponer cambios** (otra hora, otra fecha, otros días o un nuevo punto de recogida). Si quien organiza acepta la propuesta, el cambio se aplica al viaje automáticamente.
- **Normas del vehículo**: al añadir un coche se indica si se puede fumar y si admite mascotas (por defecto, no). Se ven en la ficha del viaje.
- **Gastos compartidos**: quien organiza indica los kilómetros del recorrido y la app calcula el coste (km × 0,26 €/km, tarifa de 2026 definida en `KM_RATE` de `src/lib/config.ts`; hay que revisarla cada año). La tarjeta del viaje muestra el coste por persona, que baja a medida que se confirman pasajeros: el total se reparte entre quien conduce y los pasajeros confirmados, hasta las plazas del vehículo. Los km se pueden **calcular automáticamente** con el botón «Calcula els km» (origen y destino; opción de ida y vuelta) o escribirse a mano. Es una solución provisional sin cuentas ni claves: usa Nominatim y OSRM (servicios públicos de OpenStreetMap), y solo se envían los nombres de los dos lugares al pulsar el botón. Está en `src/lib/routing.ts`; cuando openrouteservice vuelva a estar disponible se puede cambiar ahí. Es orientativo; el dinero se arregla entre vecinos.
- **Contacto directo** por teléfono o WhatsApp desde la ficha del viaje.
- **Mis viajes**: los que organizas (con aviso de solicitudes pendientes) y a los que te has apuntado.
- La ficha del viaje **se actualiza en tiempo real** cuando otro vecino hace algo.
- **Acceso con usuario y contraseña**, sin enviar ningún correo (ver más abajo cómo funciona).
- **Idiomas**: catalán por defecto y español, seleccionable con dos enlaces discretos bajo el formulario de acceso y en *Perfil → Preferencias*. La elección se recuerda en el navegador.
- **Modo claro, oscuro o automático** en *Perfil → Preferencias*. Por defecto («Automático») sigue el tema del dispositivo; la elección se recuerda en el navegador.

## Tecnología

React 18, React Router 7, Vite y TypeScript para el frontend, con CSS propio pensado primero para móvil e iconos planos de [Lucide](https://lucide.dev). Supabase pone la base de datos Postgres, el login y el tiempo real. Los textos están en `src/lib/locales/` (`ca.ts` y `es.ts`). La seguridad depende de las reglas RLS de la base de datos, no del frontend.

## Puesta en marcha

### 1. Crear el proyecto en Supabase

1. Crea un proyecto en [supabase.com](https://supabase.com). El plan gratuito es suficiente.
2. Ve a **SQL Editor → New query**, pega el contenido de [`supabase/schema.sql`](supabase/schema.sql) y ejecútalo.
   - Si tu proyecto **ya tenía** una versión anterior del esquema, no lo vuelvas a ejecutar: aplica solo las migraciones de [`supabase/migrations/`](supabase/migrations/) en orden. Son repetibles y no borran datos.
3. Ve a **Authentication → Sign In / Providers → Email**:
   - Deja activado *Email*.
   - **Desactiva *Confirm email***. Es imprescindible: la app no envía correos, así que con la confirmación activada nadie podría entrar.
4. Ve a **Authentication → URL Configuration** y añade en *Site URL* la URL donde publiques la app (y `http://localhost:5173` para desarrollo).

> **Cómo funciona el login por usuario.** Supabase Auth solo trabaja con email o teléfono, así que a cada usuario se le asigna un correo ficticio `usuario@cotransport-orista.app` (ver `AUTH_EMAIL_DOMAIN` en [`src/lib/config.ts`](src/lib/config.ts)). Nunca se envía nada a esa dirección, por lo que no hay límite de correos. Consecuencia: **no hay recuperación de contraseña por email** ni la app permite cambiarla; si un vecino la olvida, la gestiona el administrador (ver [Administración](#administración)). Si Supabase rechazara ese dominio como inválido, cámbialo en `config.ts`.

### 2. Configurar y arrancar en local

```bash
cp .env.example .env.local
```

Rellena `VITE_SUPABASE_URL` y `VITE_SUPABASE_ANON_KEY` con los datos de **Project Settings → API**. Después:

```bash
npm install
```

```bash
npm run dev
```

El comando `dev` usa `--host`, así que también puedes abrir la app desde el móvil en la misma wifi con `http://IP-de-tu-ordenador:5173`.

### 3. Publicar

`npm run build` genera la carpeta `dist/`, que es estática. Puedes subirla a Netlify, Vercel, Cloudflare Pages o GitHub Pages. El enrutado usa `#/`, así que no hace falta configurar reglas de redirección. Recuerda definir las dos variables `VITE_…` en el panel del hosting.

## Administración

Todo se hace desde el panel de Supabase, porque la app no tiene perfil de administrador.

**Un vecino ha olvidado su contraseña.** Hay dos caminos:

1. **Restablecer la contraseña (conserva todos sus datos).** En *SQL Editor* ejecuta lo siguiente, cambiando el usuario y la contraseña. Quien lo ejecuta es la única persona que ve la contraseña nueva, así que pásasela al vecino por un canal privado y que la cambie por una suya si lo desea en el futuro.

   ```sql
   update auth.users
   set encrypted_password = crypt('NUEVA-CONTRASEÑA', gen_salt('bf')),
       updated_at = now()
   where email = 'nombredeusuario@cotransport-orista.app';
   ```

   El usuario es el nombre que escribe el vecino al entrar, seguido de `@cotransport-orista.app` (o del dominio que tengas en `AUTH_EMAIL_DOMAIN`).

2. **Borrar el usuario** (*Authentication → Users → … → Delete user*) para que la persona se registre de nuevo. **Se borra también todo lo suyo**: perfil, vehículos, viajes que organizaba y sus solicitudes en viajes de otros. Úsalo solo si no importa perder esos datos.

   Si la persona tenía la app abierta en el móvil, verá un aviso de que su cuenta ya no existe y podrá cerrar sesión y volver a registrarse con el mismo nombre de usuario.

**Actualizar la base de datos tras un cambio.** Cuando salga un archivo nuevo en `supabase/migrations/` (ahora hay que ejecutar `002_vehicle_prefs_and_distance.sql`), pégalo en *SQL Editor* y ejecútalo una vez. El archivo `schema.sql` siempre refleja el estado final, para instalaciones nuevas.

## Adaptar a otro pueblo

Edita [`src/lib/config.ts`](src/lib/config.ts): nombre del pueblo, lugares frecuentes que salen como sugerencia y tipos de trayecto. Los textos de la interfaz se traducen en [`src/lib/locales/`](src/lib/locales/); para añadir un idioma, crea otro archivo con las mismas claves de `ca.ts` y regístralo en `src/lib/i18n.tsx`.

## Estructura

```
supabase/schema.sql      Tablas, reglas de negocio (triggers), funciones RPC y RLS
supabase/migrations/     Cambios para bases ya creadas (se aplican en orden, una vez)
public/                  Logo (icon.svg), iconos PNG de la app, manifiesto
src/lib/                 Cliente Supabase, tipos, formato de fechas, sesión, configuración, i18n
src/lib/locales/         Textos en catalán (ca.ts) y español (es.ts)
src/components/          Layout con barra inferior, tarjeta de viaje, iconos, controles de formulario
src/pages/               Acceso, alta de perfil, listado, ficha, formulario, mis viajes, perfil
```

## Privacidad

Cualquier vecino registrado puede ver el nombre y el teléfono de los demás. Para un pueblo pequeño suele ser lo práctico. Si se necesita más privacidad, hay que limitar la política `profiles_select` para que solo se vea a los participantes del mismo viaje.
