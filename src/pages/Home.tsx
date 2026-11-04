import { useEffect, useMemo, useState } from 'react';
import { Link } from 'react-router-dom';
import { Icon } from '../components/Icon';
import TripCard from '../components/TripCard';
import { Empty, ErrorBox, Segmented, Spinner } from '../components/ui';
import { useAuth } from '../lib/auth';
import { CATEGORIES, category } from '../lib/config';
import { nextOccurrence, seatsLeft, todayISO } from '../lib/format';
import { useT } from '../lib/i18n';
import { errorText, supabase, TRIP_SELECT } from '../lib/supabase';
import type { Trip } from '../lib/types';

type KindFilter = 'todos' | 'oferta' | 'peticion';

export default function Home() {
  const { t } = useT();
  const { userId, profile } = useAuth();
  const [trips, setTrips] = useState<Trip[] | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [kind, setKind] = useState<KindFilter>('todos');
  const [cat, setCat] = useState('');
  const [query, setQuery] = useState('');
  const [onlyFree, setOnlyFree] = useState(false);

  useEffect(() => {
    supabase
      .from('trips')
      .select(TRIP_SELECT)
      .eq('status', 'activo')
      .or(`trip_date.gte.${todayISO()},schedule.eq.recurrente`)
      .then(({ data, error }) => {
        if (error) setError(errorText(error));
        else setTrips(data as unknown as Trip[]);
      });
  }, []);

  const visible = useMemo(() => {
    if (!trips) return [];
    const q = query.trim().toLowerCase();
    return trips
      .map((trip) => ({ trip, next: nextOccurrence(trip) }))
      .filter(({ trip, next }) => next !== null || trip.schedule === 'puntual')
      .filter(({ trip }) => kind === 'todos' || trip.kind === kind)
      .filter(({ trip }) => !cat || trip.category === cat)
      .filter(({ trip }) => !onlyFree || trip.kind === 'peticion' || seatsLeft(trip) > 0)
      .filter(
        ({ trip }) =>
          !q ||
          [trip.origin, trip.destination, ...trip.pickup_points, trip.description ?? '', trip.owner?.full_name ?? '']
            .join(' ')
            .toLowerCase()
            .includes(q),
      )
      .sort((a, b) => (a.next?.getTime() ?? Infinity) - (b.next?.getTime() ?? Infinity))
      .map(({ trip }) => trip);
  }, [trips, kind, cat, query, onlyFree]);

  return (
    <div className="stack">
      <section className="hello">
        <h2>{t('home.hello', { name: profile?.full_name.split(' ')[0] ?? '' })}</h2>
        <p className="muted">{t('home.where')}</p>
      </section>

      <div className="filters stack-sm">
        <input
          type="search"
          placeholder={t('home.search')}
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          aria-label={t('home.search')}
        />
        <Segmented
          value={kind}
          onChange={setKind}
          options={[
            { value: 'todos', label: t('home.all') },
            { value: 'oferta', label: t('home.offers') },
            { value: 'peticion', label: t('home.requests') },
          ]}
        />
        <div className="chips" role="group" aria-label={t('home.categoryAria')}>
          <button type="button" className={!cat ? 'chip on' : 'chip'} onClick={() => setCat('')}>
            {t('home.all')}
          </button>
          {CATEGORIES.map((c) => (
            <button
              type="button"
              key={c.value}
              className={cat === c.value ? 'chip on' : 'chip'}
              onClick={() => setCat(cat === c.value ? '' : c.value)}
            >
              <Icon name={c.icon} /> {category(c.value).label}
            </button>
          ))}
        </div>
        <label className="check">
          <input type="checkbox" checked={onlyFree} onChange={(e) => setOnlyFree(e.target.checked)} />
          {t('home.onlyFree')}
        </label>
      </div>

      <ErrorBox message={error} />
      {!trips && !error && <Spinner />}

      {trips && visible.length === 0 && (
        <Empty icon={<Icon name="car" />} title={t('home.empty')}>
          <p className="muted">{t('home.emptyHint')}</p>
          <Link to="/nuevo" className="btn primary">
            {t('home.publish')}
          </Link>
        </Empty>
      )}

      <div className="list">
        {visible.map((trip) => (
          <TripCard key={trip.id} trip={trip} userId={userId} />
        ))}
      </div>
    </div>
  );
}
