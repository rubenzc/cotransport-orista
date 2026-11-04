-- =====================================================================
-- Migración 001 — endurecimiento de reglas (noviembre 2026)
-- Para proyectos de Supabase que YA tienen el schema.sql anterior.
-- Ejecutar una sola vez en: Supabase > SQL Editor > New query.
-- Es seguro repetirla: no duplica nada ni borra datos.
-- =====================================================================

-- 1) Los días de un compromiso deben estar entre 1 y 7
alter table public.commitments drop constraint if exists commitments_days_of_week_chk;
alter table public.commitments
  add constraint commitments_days_of_week_chk
  check (days_of_week is null or days_of_week <@ array[1,2,3,4,5,6,7]::smallint[]);

-- 2) Compromisos: días dentro de los del viaje, y viajes cancelados en solo lectura
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

  -- los días de un compromiso solo existen en viajes semanales y deben ser días del viaje
  if t.schedule = 'puntual' then
    new.days_of_week := null;
  elsif new.days_of_week is not null
        and (cardinality(new.days_of_week) = 0 or not (new.days_of_week <@ t.days_of_week)) then
    raise exception 'err_days_not_in_trip';
  end if;

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

    -- en un viaje cancelado solo se permite que cada persona cancele su solicitud
    if t.status <> 'activo' and new.status <> 'cancelado' then
      raise exception 'err_trip_cancelled';
    end if;

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

-- 3) Viajes: plazas nunca por debajo de las confirmadas; tipo de viaje bloqueado con gente apuntada
drop trigger if exists trips_guard on public.trips;

-- Reglas de negocio de los viajes: no se pueden bajar las plazas por debajo de las ya
-- confirmadas ni cambiar el tipo de viaje (oferta/petición) cuando ya hay gente apuntada.
create or replace function public.trips_guard() returns trigger
language plpgsql security definer set search_path = public as $$
declare
  max_used int;
begin
  if new.kind is distinct from old.kind
     and exists (select 1 from public.commitments c
                 where c.trip_id = new.id and c.status in ('pendiente', 'confirmado')) then
    raise exception 'err_kind_locked';
  end if;

  if new.kind = 'oferta'
     and (new.seats is distinct from old.seats or new.days_of_week is distinct from old.days_of_week) then
    select coalesce(max(used), 0) into max_used
    from (
      select d, sum(c.seats) as used
      from unnest(coalesce(new.days_of_week, array[0]::smallint[])) as d
      join public.commitments c
        on c.trip_id = new.id
       and c.status = 'confirmado'
       and c.role = 'pasajero'
       and (c.days_of_week is null or d = any(c.days_of_week))
      group by d
    ) s;
    if max_used > new.seats then
      raise exception 'err_seats_below_confirmed';
    end if;
  end if;

  return new;
end $$;

create trigger trips_guard before update on public.trips
  for each row execute function public.trips_guard();

notify pgrst, 'reload schema';
