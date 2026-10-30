-- =====================================================================
-- Cotransport Oristà — esquema de base de datos (Supabase / Postgres)
-- Ejecutar completo en: Supabase > SQL Editor > New query
-- =====================================================================

create extension if not exists pgcrypto;

-- ---------------------------------------------------------------------
-- Perfiles de vecinos (1:1 con auth.users)
-- ---------------------------------------------------------------------
create table public.profiles (
  id          uuid primary key references auth.users(id) on delete cascade,
  full_name   text not null check (length(trim(full_name)) > 1),
  phone       text,
  created_at  timestamptz not null default now()
);

-- ---------------------------------------------------------------------
-- Vehículos de cada vecino
-- ---------------------------------------------------------------------
create table public.vehicles (
  id          uuid primary key default gen_random_uuid(),
  owner_id    uuid not null default auth.uid() references public.profiles(id) on delete cascade,
  model       text not null,
  color       text,
  seats       smallint not null default 4 check (seats between 1 and 8),
  notes       text,
  created_at  timestamptz not null default now()
);

-- ---------------------------------------------------------------------
-- Viajes: "oferta" (tengo coche y plazas) o "peticion" (necesito que me lleven)
-- schedule: "puntual" (una fecha) o "recurrente" (días de la semana, 1=lunes … 7=domingo)
-- ---------------------------------------------------------------------
create table public.trips (
  id              uuid primary key default gen_random_uuid(),
  owner_id        uuid not null default auth.uid() references public.profiles(id) on delete cascade,
  kind            text not null check (kind in ('oferta', 'peticion')),
  category        text not null default 'otro'
                  check (category in ('trabajo', 'medico', 'compras', 'estudios', 'tramites', 'ocio', 'otro')),
  origin          text not null,
  destination     text not null,
  pickup_points   text[] not null default '{}',
  schedule        text not null check (schedule in ('puntual', 'recurrente')),
  trip_date       date,
  days_of_week    smallint[],
  valid_until     date,
  departure_time  time not null,
  return_time     time,
  duration_min    smallint check (duration_min > 0),
  seats           smallint not null check (seats between 1 and 8),
  vehicle_id      uuid references public.vehicles(id) on delete set null,
  description     text,
  status          text not null default 'activo' check (status in ('activo', 'cancelado')),
  created_at      timestamptz not null default now(),
  updated_at      timestamptz not null default now(),
  constraint trips_schedule_chk check (
    (schedule = 'puntual' and trip_date is not null)
    or (schedule = 'recurrente' and coalesce(cardinality(days_of_week), 0) > 0)
  ),
  constraint trips_days_chk check (days_of_week is null or days_of_week <@ array[1,2,3,4,5,6,7]::smallint[])
);

create index trips_date_idx on public.trips (trip_date);
create index trips_owner_idx on public.trips (owner_id);

-- ---------------------------------------------------------------------
-- Compromisos: un vecino se apunta a un viaje
--   oferta   -> se apunta como "pasajero"
--   peticion -> se ofrece como "conductor"
-- Quien organiza el viaje confirma o rechaza.
-- ---------------------------------------------------------------------
create table public.commitments (
  id            uuid primary key default gen_random_uuid(),
  trip_id       uuid not null references public.trips(id) on delete cascade,
  user_id       uuid not null default auth.uid() references public.profiles(id) on delete cascade,
  role          text not null default 'pasajero' check (role in ('pasajero', 'conductor')),
  seats         smallint not null default 1 check (seats between 1 and 8),
  pickup_point  text,
  days_of_week  smallint[],          -- en viajes recurrentes: solo algunos días (null = todos)
  note          text,
  status        text not null default 'pendiente'
                check (status in ('pendiente', 'confirmado', 'rechazado', 'cancelado')),
  created_at    timestamptz not null default now(),
  updated_at    timestamptz not null default now(),
  unique (trip_id, user_id)
);

create index commitments_user_idx on public.commitments (user_id);

-- ---------------------------------------------------------------------
-- Propuestas de cambio sobre un viaje (hora, fecha, días, recogida…)
-- ---------------------------------------------------------------------
create table public.change_proposals (
  id                  uuid primary key default gen_random_uuid(),
  trip_id             uuid not null references public.trips(id) on delete cascade,
  proposer_id         uuid not null default auth.uid() references public.profiles(id) on delete cascade,
  new_trip_date       date,
  new_days_of_week    smallint[],
  new_departure_time  time,
  new_return_time     time,
  new_origin          text,
  new_destination     text,
  new_pickup_point    text,
  message             text not null check (length(trim(message)) > 0),
  status              text not null default 'pendiente'
                      check (status in ('pendiente', 'aceptada', 'rechazada', 'retirada')),
  response            text,
  created_at          timestamptz not null default now(),
  resolved_at         timestamptz
);

create index proposals_trip_idx on public.change_proposals (trip_id);

-- =====================================================================
-- Triggers
-- =====================================================================

create or replace function public.touch_updated_at() returns trigger
language plpgsql as $$
begin
  new.updated_at := now();
  return new;
end $$;

create trigger trips_touch before update on public.trips
  for each row execute function public.touch_updated_at();

-- Reglas de negocio de los compromisos: estados permitidos y control de plazas.
create or replace function public.commitments_guard() returns trigger
language plpgsql security definer set search_path = public as $$
declare
  t         public.trips;
  is_owner  boolean;
  max_used  int;
begin
  select * into t from public.trips where id = new.trip_id;
  is_owner := (auth.uid() = t.owner_id);

  if tg_op = 'INSERT' then
    if new.user_id = t.owner_id then
      raise exception 'err_own_trip';
    end if;
    if t.status <> 'activo' then
      raise exception 'err_trip_cancelled';
    end if;
    new.status := 'pendiente';
    new.role := case when t.kind = 'oferta' then 'pasajero' else 'conductor' end;
  else
    if new.trip_id <> old.trip_id or new.user_id <> old.user_id then
      raise exception 'err_move_commitment';
    end if;
    new.role := old.role;

    if is_owner then
      -- quien organiza solo cambia el estado
      if (new.seats, new.days_of_week, new.pickup_point, new.note)
         is distinct from (old.seats, old.days_of_week, old.pickup_point, old.note) then
        raise exception 'err_only_self_edit';
      end if;
    else
      if new.status is distinct from old.status and new.status not in ('pendiente', 'cancelado') then
        raise exception 'err_owner_only_confirm';
      end if;
      -- si el vecino modifica su solicitud, vuelve a quedar pendiente
      if new.status <> 'cancelado'
         and (new.seats, new.days_of_week, new.pickup_point)
             is distinct from (old.seats, old.days_of_week, old.pickup_point) then
        new.status := 'pendiente';
      end if;
    end if;
  end if;

  -- control de plazas libres (por día en los viajes recurrentes)
  if new.status = 'confirmado' and t.kind = 'oferta' then
    select coalesce(max(used), 0) into max_used
    from (
      select d, sum(c.seats) as used
      from unnest(coalesce(t.days_of_week, array[0]::smallint[])) as d
      join public.commitments c
        on c.trip_id = t.id
       and c.status = 'confirmado'
       and c.id <> new.id
       and (c.days_of_week is null or d = any(c.days_of_week))
      where new.days_of_week is null or d = any(new.days_of_week)
      group by d
    ) s;
    if max_used + new.seats > t.seats then
      raise exception 'err_no_seats';
    end if;
  end if;

  new.updated_at := now();
  return new;
end $$;

create trigger commitments_guard before insert or update on public.commitments
  for each row execute function public.commitments_guard();

-- =====================================================================
-- Funciones RPC para propuestas de cambio
-- =====================================================================

-- Quien organiza acepta (aplica el cambio al viaje) o rechaza una propuesta.
create or replace function public.respond_proposal(p_id uuid, p_accept boolean, p_response text default null)
returns void language plpgsql security definer set search_path = public as $$
declare
  p  public.change_proposals;
  t  public.trips;
  pickup text;
begin
  select * into p from public.change_proposals where id = p_id for update;
  if not found then raise exception 'err_proposal_not_found'; end if;

  select * into t from public.trips where id = p.trip_id;
  if t.owner_id is distinct from auth.uid() then
    raise exception 'err_only_owner_respond';
  end if;
  if p.status <> 'pendiente' then
    raise exception 'err_proposal_answered';
  end if;

  if p_accept then
    pickup := nullif(trim(p.new_pickup_point), '');
    update public.trips set
      trip_date      = case when t.schedule = 'puntual' then coalesce(p.new_trip_date, trip_date) else trip_date end,
      days_of_week   = case when t.schedule = 'recurrente' and coalesce(cardinality(p.new_days_of_week), 0) > 0
                            then p.new_days_of_week else days_of_week end,
      departure_time = coalesce(p.new_departure_time, departure_time),
      return_time    = coalesce(p.new_return_time, return_time),
      origin         = coalesce(nullif(trim(p.new_origin), ''), origin),
      destination    = coalesce(nullif(trim(p.new_destination), ''), destination),
      pickup_points  = case when pickup is not null and not (pickup = any(pickup_points))
                            then pickup_points || pickup else pickup_points end
    where id = t.id;
  end if;

  update public.change_proposals
     set status = case when p_accept then 'aceptada' else 'rechazada' end,
         response = nullif(trim(p_response), ''),
         resolved_at = now()
   where id = p_id;
end $$;

-- Quien propuso retira su propuesta pendiente.
create or replace function public.withdraw_proposal(p_id uuid)
returns void language plpgsql security definer set search_path = public as $$
begin
  update public.change_proposals
     set status = 'retirada', resolved_at = now()
   where id = p_id and proposer_id = auth.uid() and status = 'pendiente';
  if not found then raise exception 'err_cannot_withdraw'; end if;
end $$;

revoke all on function public.respond_proposal(uuid, boolean, text) from public, anon;
revoke all on function public.withdraw_proposal(uuid) from public, anon;
grant execute on function public.respond_proposal(uuid, boolean, text) to authenticated;
grant execute on function public.withdraw_proposal(uuid) to authenticated;

-- =====================================================================
-- Seguridad a nivel de fila (RLS)
-- Todos los vecinos registrados ven todo; cada uno solo modifica lo suyo.
-- =====================================================================

alter table public.profiles         enable row level security;
alter table public.vehicles         enable row level security;
alter table public.trips            enable row level security;
alter table public.commitments      enable row level security;
alter table public.change_proposals enable row level security;

-- profiles
create policy "profiles_select" on public.profiles for select to authenticated using (true);
create policy "profiles_insert" on public.profiles for insert to authenticated with check (id = auth.uid());
create policy "profiles_update" on public.profiles for update to authenticated using (id = auth.uid()) with check (id = auth.uid());

-- vehicles
create policy "vehicles_select" on public.vehicles for select to authenticated using (true);
create policy "vehicles_insert" on public.vehicles for insert to authenticated with check (owner_id = auth.uid());
create policy "vehicles_update" on public.vehicles for update to authenticated using (owner_id = auth.uid()) with check (owner_id = auth.uid());
create policy "vehicles_delete" on public.vehicles for delete to authenticated using (owner_id = auth.uid());

-- trips
create policy "trips_select" on public.trips for select to authenticated using (true);
create policy "trips_insert" on public.trips for insert to authenticated with check (owner_id = auth.uid());
create policy "trips_update" on public.trips for update to authenticated using (owner_id = auth.uid()) with check (owner_id = auth.uid());
create policy "trips_delete" on public.trips for delete to authenticated using (owner_id = auth.uid());

-- commitments
create policy "commitments_select" on public.commitments for select to authenticated using (true);
create policy "commitments_insert" on public.commitments for insert to authenticated with check (user_id = auth.uid());
create policy "commitments_update" on public.commitments for update to authenticated
  using (
    user_id = auth.uid()
    or exists (select 1 from public.trips t where t.id = trip_id and t.owner_id = auth.uid())
  );
create policy "commitments_delete" on public.commitments for delete to authenticated using (user_id = auth.uid());

-- change_proposals (responder / retirar solo vía RPC)
create policy "proposals_select" on public.change_proposals for select to authenticated using (true);
create policy "proposals_insert" on public.change_proposals for insert to authenticated
  with check (
    proposer_id = auth.uid()
    and status = 'pendiente' and response is null and resolved_at is null
    and exists (select 1 from public.trips t where t.id = trip_id and t.status = 'activo')
  );

-- =====================================================================
-- Tiempo real (la ficha del viaje se actualiza sola)
-- =====================================================================
alter publication supabase_realtime add table public.trips, public.commitments, public.change_proposals;
