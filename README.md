# Cotransport Oristà

Web app para que los vecinos de un pueblo sin transporte público compartan coche. Está pensada para usarse desde el navegador del móvil y se puede instalar como app (PWA).

## Qué se puede hacer

- **Publicar viajes** de dos tipos:
  - *Tengo coche*: ofreces plazas libres.
  - *Necesito que me lleven*: pides que alguien te lleve.
- **Datos de cada viaje**: tipo de trayecto (trabajo, médico, compras, estudios…), origen, destino, puntos de recogida, fecha concreta o días de la semana (con fecha de fin opcional), hora de salida, hora de vuelta, duración, plazas o personas, vehículo y descripción.
- **Apuntarse** a un viaje: plazas necesarias, punto de recogida, días concretos (en viajes semanales) y un mensaje. Quien organiza **confirma o rechaza** cada solicitud. El sistema no deja confirmar más plazas de las que hay, día a día.
- **Proponer cambios** (otra hora, otra fecha, otros días o un nuevo punto de recogida). Si quien organiza acepta la propuesta, el cambio se aplica al viaje automáticamente.
- **Contacto directo** por teléfono o WhatsApp desde la ficha del viaje.
- **Mis viajes**: los que organizas (con aviso de solicitudes pendientes) y a los que te has apuntado.
- La ficha del viaje **se actualiza en tiempo real** cuando otro vecino hace algo.
- **Acceso con usuario y contraseña**, sin enviar ningún correo (ver más abajo cómo funciona).
- **Idiomas**: catalán por defecto y español de España, seleccionable en la pantalla de acceso y en el perfil. La elección se recuerda en el navegador.

## Tecnología

React 18, Vite y TypeScript para el frontend, sin librerías de interfaz y con CSS propio pensado primero para móvil. Supabase pone la base de datos Postgres, el login y el tiempo real. Los textos están en `src/lib/locales/` (`ca.ts` y `es.ts`). La seguridad depende de las reglas RLS de la base de datos, no del frontend.

## Puesta en marcha

### 1. Crear el proyecto en Supabase

1. Crea un proyecto en [supabase.com](https://supabase.com). El plan gratuito es suficiente.
2. Ve a **SQL Editor → New query**, pega el contenido de [`supabase/schema.sql`](supabase/schema.sql) y ejecútalo.
3. Ve a **Authentication → Sign In / Providers → Email**:
   - Deja activado *Email*.
   - **Desactiva *Confirm email***. Es imprescindible: la app no envía correos, así que con la confirmación activada nadie podría entrar.
4. Ve a **Authentication → URL Configuration** y añade en *Site URL* la URL donde publiques la app (y `http://localhost:5173` para desarrollo).

> **Cómo funciona el login por usuario.** Supabase Auth solo trabaja con email o teléfono, así que a cada usuario se le asigna un correo ficticio `usuario@cotransport-orista.app` (ver `AUTH_EMAIL_DOMAIN` en [`src/lib/config.ts`](src/lib/config.ts)). Nunca se envía nada a esa dirección, por lo que no hay límite de correos. Consecuencia: **no hay recuperación de contraseña por email**; si un vecino la olvida, se la restablece el administrador desde *Authentication → Users* en el panel de Supabase. Si Supabase rechazara ese dominio como inválido, cámbialo en `config.ts`.

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

## Adaptar a otro pueblo

Edita [`src/lib/config.ts`](src/lib/config.ts): nombre del pueblo, lugares frecuentes que salen como sugerencia y tipos de trayecto. Los textos de la interfaz se traducen en [`src/lib/locales/`](src/lib/locales/); para añadir un idioma, crea otro archivo con las mismas claves de `ca.ts` y regístralo en `src/lib/i18n.tsx`.

## Estructura

```
supabase/schema.sql      Tablas, reglas de negocio (triggers), funciones RPC y RLS
src/lib/                 Cliente Supabase, tipos, formato de fechas, sesión, configuración, i18n
src/lib/locales/        Textos en catalán (ca.ts) y español (es.ts)
src/components/          Layout con barra inferior, tarjeta de viaje, controles de formulario
src/pages/               Acceso, alta de perfil, listado, ficha, formulario, mis viajes, perfil
```

## Privacidad

Cualquier vecino registrado puede ver el nombre y el teléfono de los demás. Para un pueblo pequeño suele ser lo práctico. Si se necesita más privacidad, hay que limitar la política `profiles_select` para que solo se vea a los participantes del mismo viaje.
