import { useEffect, useState, type FormEvent } from 'react';
import { Link, useNavigate, useParams } from 'react-router-dom';
import { Icon } from '../components/Icon';
import { DayPicker, ErrorBox, Field, PlacesDatalist, Segmented, Spinner } from '../components/ui';
import { useAuth } from '../lib/auth';
import { CATEGORIES, KM_RATE, category } from '../lib/config';
import { fmtKm, fmtMoney, fmtTime, tripCost, todayISO } from '../lib/format';
import { useT } from '../lib/i18n';
import { RoutingError, routeKm } from '../lib/routing';
import { errorText, supabase } from '../lib/supabase';
import type { Schedule, Trip, TripKind, Vehicle } from '../lib/types';

interface FormState {
  kind: TripKind;
  category: string;
  origin: string;
  destination: string;
  pickup_points: string[];
  schedule: Schedule;
  trip_date: string;
  days_of_week: number[];
  valid_until: string;
  departure_time: string;
  return_time: string;
  round_trip: boolean;
  duration_min: string;
  distance_km: string;
  seats: string;
  vehicle_id: string;
  description: string;
}

const EMPTY: FormState = {
  kind: 'oferta',
  category: 'trabajo',
  origin: '',
  destination: '',
  pickup_points: [],
  schedule: 'puntual',
  trip_date: todayISO(),
  days_of_week: [1, 2, 3, 4, 5],
  valid_until: '',
  departure_time: '08:00',
  return_time: '',
  round_trip: false,
  duration_min: '',
  distance_km: '',
  seats: '3',
  vehicle_id: '',
  description: '',
};

/** Km de ida, o de ida y vuelta, con un decimal. */
function roundKm(oneWay: number, roundTrip: boolean): number {
  return Math.round(oneWay * (roundTrip ? 2 : 1) * 10) / 10;
}

function fromTrip(trip: Trip): FormState {
  return {
    kind: trip.kind,
    category: trip.category,
    origin: trip.origin,
    destination: trip.destination,
    pickup_points: trip.pickup_points,
    schedule: trip.schedule,
    trip_date: trip.trip_date ?? todayISO(),
    days_of_week: trip.days_of_week ?? [],
    valid_until: trip.valid_until ?? '',
    departure_time: fmtTime(trip.departure_time),
    return_time: fmtTime(trip.return_time),
    round_trip: !!trip.return_time,
    duration_min: trip.duration_min ? String(trip.duration_min) : '',
    distance_km: trip.distance_km ? String(trip.distance_km) : '',
    seats: String(trip.seats),
    vehicle_id: trip.vehicle_id ?? '',
    description: trip.description ?? '',
  };
}

export default function TripForm() {
  const { t, tn } = useT();
  const { id } = useParams();
  const editing = Boolean(id);
  const navigate = useNavigate();
  const { userId } = useAuth();
  const [form, setForm] = useState<FormState>(EMPTY);
  const [vehicles, setVehicles] = useState<Vehicle[]>([]);
  const [newPickup, setNewPickup] = useState('');
  const [loading, setLoading] = useState(editing);
  // viaje inexistente o ajeno: se muestra solo el error, sin formulario
  const [blocked, setBlocked] = useState(false);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [calc, setCalc] = useState<{ busy: boolean; msg: string | null; err: string | null }>({
    busy: false,
    msg: null,
    err: null,
  });
  // km de ida calculados automaticamente (null si la persona los ha escrito a mano)
  const [autoKm, setAutoKm] = useState<number | null>(null);

  const set = <K extends keyof FormState>(key: K, value: FormState[K]) => setForm((f) => ({ ...f, [key]: value }));

  useEffect(() => {
    supabase
      .from('vehicles')
      .select('*')
      .eq('owner_id', userId)
      .then(({ data }) => {
        const list = (data ?? []) as Vehicle[];
        setVehicles(list);
        if (!editing && list.length > 0) {
          setForm((f) => ({ ...f, vehicle_id: list[0].id, seats: String(Math.max(1, list[0].seats - 1)) }));
        }
      });
    if (editing) {
      supabase
        .from('trips')
        .select('*')
        .eq('id', id!)
        .single()
        .then(({ data, error }) => {
          if (error) {
            setError(errorText(error));
            setBlocked(true);
          } else if ((data as Trip).owner_id !== userId) {
            setError(t('tf.errOwner'));
            setBlocked(true);
          } else setForm(fromTrip(data as Trip));
          setLoading(false);
        });
    }
    // `t` canvia amb l'idioma però no ha de tornar a carregar el viatge
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [editing, id, userId]);

  function addPickup() {
    const p = newPickup.trim();
    if (p && !form.pickup_points.includes(p)) set('pickup_points', [...form.pickup_points, p]);
    setNewPickup('');
  }

  async function submit(e: FormEvent) {
    e.preventDefault();
    setError(null);
    if (form.schedule === 'recurrente' && form.days_of_week.length === 0) {
      setError(t('tf.errDays'));
      return;
    }
    setBusy(true);
    const payload = {
      kind: form.kind,
      category: form.category,
      origin: form.origin.trim(),
      destination: form.destination.trim(),
      pickup_points: form.pickup_points,
      schedule: form.schedule,
      trip_date: form.schedule === 'puntual' ? form.trip_date : null,
      days_of_week: form.schedule === 'recurrente' ? form.days_of_week : null,
      valid_until: form.schedule === 'recurrente' && form.valid_until ? form.valid_until : null,
      departure_time: form.departure_time,
      return_time: form.round_trip && form.return_time ? form.return_time : null,
      duration_min: form.duration_min ? Number(form.duration_min) : null,
      distance_km: form.distance_km ? Number(form.distance_km) : null,
      seats: Number(form.seats),
      vehicle_id: form.kind === 'oferta' && form.vehicle_id ? form.vehicle_id : null,
      description: form.description.trim() || null,
    };
    const res = editing
      ? await supabase.from('trips').update(payload).eq('id', id!).select('id').single()
      : await supabase.from('trips').insert(payload).select('id').single();
    setBusy(false);
    if (res.error) setError(errorText(res.error));
    else navigate(`/viaje/${res.data.id}`, { replace: true });
  }

  if (loading) return <Spinner />;

  if (blocked) {
    return (
      <div className="stack">
        <Link to="/" className="back">
          {t('common.back')}
        </Link>
        <ErrorBox message={error} />
      </div>
    );
  }

  function setRoundTrip(rt: boolean) {
    setForm((f) => ({ ...f, round_trip: rt, distance_km: autoKm !== null ? String(roundKm(autoKm, rt)) : f.distance_km }));
    if (autoKm !== null) setCalc((c) => (c.msg ? { ...c, msg: t('tf.calcDone', { km: fmtKm(roundKm(autoKm, rt)) }) } : c));
  }

  async function calcKm() {
    const from = form.origin.trim();
    const to = form.destination.trim();
    if (!from || !to) {
      setCalc({ busy: false, msg: null, err: t('tf.calcNeedPlaces') });
      return;
    }
    setCalc({ busy: true, msg: null, err: null });
    try {
      const one = await routeKm(from, to);
      const km = roundKm(one, form.round_trip);
      setAutoKm(one);
      set('distance_km', String(km));
      setCalc({ busy: false, msg: t('tf.calcDone', { km: fmtKm(km) }), err: null });
    } catch (e) {
      const err =
        e instanceof RoutingError && e.code === 'notFound' ? t('rt.notFound', { place: e.place ?? '' }) : t('rt.failed');
      setCalc({ busy: false, msg: null, err });
    }
  }

  const isOffer = form.kind === 'oferta';
  const kmNum = Number(form.distance_km);
  const total = kmNum > 0 ? tripCost({ distance_km: kmNum }) : null;
  const fullCar = Math.min(9, Math.max(1, Number(form.seats) || 1) + 1);
  const costPreview =
    total === null ? null : t('tf.costPreview', { total: fmtMoney(total), people: tn('ppl', fullCar), each: fmtMoney(total / fullCar) });

  return (
    <form className="stack" onSubmit={submit}>
      <h2>{editing ? t('tf.titleEdit') : t('tf.titleNew')}</h2>
      <PlacesDatalist extra={form.pickup_points} />

      <section className="card stack">
        <Segmented
          value={form.kind}
          onChange={(v) => set('kind', v)}
          options={[
            {
              value: 'oferta',
              label: (
                <>
                  <Icon name="car" />
                  {t('tf.kindOffer')}
                </>
              ),
            },
            {
              value: 'peticion',
              label: (
                <>
                  <Icon name="hand" />
                  {t('tf.kindRequest')}
                </>
              ),
            },
          ]}
        />
        <Field label={t('tf.category')}>
          <select value={form.category} onChange={(e) => set('category', e.target.value)}>
            {CATEGORIES.map((c) => (
              <option key={c.value} value={c.value}>
                {category(c.value).label}
              </option>
            ))}
          </select>
        </Field>
      </section>

      <section className="card stack">
        <h3>{t('tf.route')}</h3>
        <Field label={t('tf.origin')}>
          <input required list="places" value={form.origin} onChange={(e) => set('origin', e.target.value)} />
        </Field>
        <Field label={t('tf.destination')}>
          <input
            required
            list="places"
            value={form.destination}
            onChange={(e) => set('destination', e.target.value)}
          />
        </Field>
        <Field label={t('tf.pickups')} hint={t('tf.pickupsHint')}>
          <div className="row">
            <input
              list="places"
              value={newPickup}
              onChange={(e) => setNewPickup(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === 'Enter') {
                  e.preventDefault();
                  addPickup();
                }
              }}
              placeholder={t('tf.pickupPlaceholder')}
            />
            <button type="button" className="btn" onClick={addPickup}>
              {t('common.add')}
            </button>
          </div>
        </Field>
        {form.pickup_points.length > 0 && (
          <ul className="tags">
            {form.pickup_points.map((p) => (
              <li key={p} className="tag">
                <Icon name="pin" /> {p}
                <button
                  type="button"
                  aria-label={t('tf.removeAria', { name: p })}
                  onClick={() =>
                    set(
                      'pickup_points',
                      form.pickup_points.filter((x) => x !== p),
                    )
                  }
                >
                  ×
                </button>
              </li>
            ))}
          </ul>
        )}
      </section>

      <section className="card stack">
        <h3>{t('tf.when')}</h3>
        <Segmented
          value={form.schedule}
          onChange={(v) => set('schedule', v)}
          options={[
            { value: 'puntual', label: t('tf.once') },
            { value: 'recurrente', label: t('tf.weekly') },
          ]}
        />
        {form.schedule === 'puntual' ? (
          <Field label={t('tf.date')}>
            <input
              type="date"
              required
              min={editing ? undefined : todayISO()}
              value={form.trip_date}
              onChange={(e) => set('trip_date', e.target.value)}
            />
          </Field>
        ) : (
          <>
            <Field label={t('tf.days')}>
              <DayPicker value={form.days_of_week} onChange={(d) => set('days_of_week', d)} />
            </Field>
            <Field label={t('tf.until')} hint={t('tf.untilHint')}>
              <input type="date" value={form.valid_until} onChange={(e) => set('valid_until', e.target.value)} />
            </Field>
          </>
        )}
        <Field label={t('tf.legKind')}>
          <Segmented
            label={t('tf.legKind')}
            value={form.round_trip ? 'ida-vuelta' : 'ida'}
            onChange={(v) => setRoundTrip(v === 'ida-vuelta')}
            options={[
              { value: 'ida', label: t('tf.oneWay') },
              { value: 'ida-vuelta', label: t('tf.roundTripOpt') },
            ]}
          />
        </Field>
        <div className={form.round_trip ? 'grid-2' : undefined}>
          <Field label={t('tf.departure')}>
            <input
              type="time"
              required
              value={form.departure_time}
              onChange={(e) => set('departure_time', e.target.value)}
            />
          </Field>
          {form.round_trip && (
            <Field label={t('tf.return')}>
              <input
                type="time"
                required
                value={form.return_time}
                onChange={(e) => set('return_time', e.target.value)}
              />
            </Field>
          )}
        </div>
        <Field label={t('tf.duration')}>
          <input
            type="number"
            inputMode="numeric"
            min={1}
            max={600}
            value={form.duration_min}
            onChange={(e) => set('duration_min', e.target.value)}
            placeholder={t('tf.durationPh')}
          />
        </Field>
      </section>

      <section className="card stack">
        <h3>{t('tf.kmTitle')}</h3>
        <button type="button" className="btn primary block" disabled={calc.busy} onClick={calcKm}>
          <Icon name="route" />
          {calc.busy ? t('tf.calcing') : t('tf.calcKm')}
        </button>
        <p className="field-hint">{form.round_trip ? t('tf.calcHelpRound') : t('tf.calcHelpOne')}</p>
        {calc.msg && (
          <p className="notice-inline" role="status">
            {calc.msg}
          </p>
        )}
        {calc.err && <ErrorBox message={calc.err} />}
        <p className="or-divider" aria-hidden="true">
          <span>{t('tf.or')}</span>
        </p>
        <Field label={t('tf.distance')} hint={t('tf.distanceHint', { rate: fmtMoney(KM_RATE) })}>
          <input
            type="number"
            inputMode="decimal"
            min={0.1}
            max={1000}
            step="0.1"
            value={form.distance_km}
            onChange={(e) => {
              setAutoKm(null);
              set('distance_km', e.target.value);
            }}
            placeholder={t('tf.distancePh')}
          />
        </Field>
        {costPreview && <p className="muted small">{costPreview}</p>}
      </section>

      <section className="card stack">
        <h3>{isOffer ? t('tf.carAndSeats') : t('tf.people')}</h3>
        <Field label={isOffer ? t('tf.seatsOffer') : t('tf.seatsRequest')}>
          <input
            type="number"
            inputMode="numeric"
            required
            min={1}
            max={8}
            value={form.seats}
            onChange={(e) => set('seats', e.target.value)}
          />
        </Field>
        {isOffer && (
          <Field label={t('tf.vehicle')}>
            {vehicles.length > 0 ? (
              <select value={form.vehicle_id} onChange={(e) => set('vehicle_id', e.target.value)}>
                <option value="">{t('tf.vehicleNone')}</option>
                {vehicles.map((v) => (
                  <option key={v.id} value={v.id}>
                    {v.model}
                    {v.color ? ` (${v.color})` : ''} · {tn('seats', v.seats)}
                  </option>
                ))}
              </select>
            ) : (
              <p className="muted small">
                {t('tf.noVehicle')} <Link to="/perfil">{t('tf.addVehicleLink')}</Link>.
              </p>
            )}
          </Field>
        )}
        <Field label={t('tf.description')} hint={t('tf.descriptionHint')}>
          <textarea rows={3} value={form.description} onChange={(e) => set('description', e.target.value)} />
        </Field>
      </section>

      <ErrorBox message={error} />
      <button className="btn primary block big" disabled={busy}>
        {busy ? t('common.saving') : editing ? t('tf.saveChanges') : t('tf.publish')}
      </button>
    </form>
  );
}
