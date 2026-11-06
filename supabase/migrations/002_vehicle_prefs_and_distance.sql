-- =====================================================================
-- Migración 002 — preferencias del vehículo y kilómetros del viaje
-- Para proyectos de Supabase que YA tienen el schema.sql anterior.
-- Ejecutar una sola vez en: Supabase > SQL Editor > New query.
-- Es seguro repetirla: no duplica nada ni borra datos.
-- =====================================================================

-- 1) Vehículos: ¿se puede fumar? ¿admite mascotas? (por defecto: no)
alter table public.vehicles add column if not exists smoking boolean not null default false;
alter table public.vehicles add column if not exists pets    boolean not null default false;

-- 2) Viajes: kilómetros del recorrido (el coste se calcula en la app: km x tarifa por km)
alter table public.trips add column if not exists distance_km numeric(6,1);
alter table public.trips drop constraint if exists trips_distance_km_chk;
alter table public.trips
  add constraint trips_distance_km_chk check (distance_km is null or (distance_km > 0 and distance_km <= 1000));

notify pgrst, 'reload schema';
