import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { Icon } from '../components/Icon';
import TripCard from '../components/TripCard';
import { Empty, ErrorBox, Segmented, Spinner } from '../components/ui';
import { useAuth } from '../lib/auth';
import { nextOccurrence } from '../lib/format';
import { useT } from '../lib/i18n';
import { errorText, supabase, TRIP_SELECT } from '../lib/supabase';
import type { Commitment, Trip } from '../lib/types';

type Tab = 'organizo' | 'apuntado';

function byNext(a: Trip, b: Trip) {
  return (nextOccurrence(a)?.getTime() ?? Infinity) - (nextOccurrence(b)?.getTime() ?? Infinity);
}

export default function MyTrips() {
  const { t, tn } = useT();
  const { userId } = useAuth();
  const [tab, setTab] = useState<Tab>('organizo');
  const [owned, setOwned] = useState<Trip[] | null>(null);
  const [joined, setJoined] = useState<Trip[] | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    supabase
      .from('trips')
      .select(TRIP_SELECT)
      .eq('owner_id', userId)
      .order('created_at', { ascending: false })
      .then(({ data, error }) => {
        if (error) setError(errorText(error));
        else setOwned((data as unknown as Trip[]).sort(byNext));
      });
    supabase
      .from('commitments')
      .select(`*, trip:trips(${TRIP_SELECT})`)
      .eq('user_id', userId)
      .neq('status', 'cancelado')
      .then(({ data, error }) => {
        if (error) setError(errorText(error));
        else
          setJoined(
            (data as unknown as Commitment[])
              .map((c) => c.trip)
              .filter((trip): trip is Trip => Boolean(trip))
              .sort(byNext),
          );
      });
  }, [userId]);

  const list = tab === 'organizo' ? owned : joined;
  const pendingCount = (owned ?? []).reduce(
    (n, trip) => n + (trip.commitments ?? []).filter((c) => c.status === 'pendiente').length,
    0,
  );

  return (
    <div className="stack">
      <h2>{t('mt.title')}</h2>
      <Segmented
        value={tab}
        onChange={setTab}
        options={[
          {
            value: 'organizo',
            label: (
              <>
                {t('mt.organize')}
                {pendingCount > 0 && <span className="count">{pendingCount}</span>}
              </>
            ),
          },
          { value: 'apuntado', label: t('mt.joined') },
        ]}
      />
      {tab === 'organizo' && pendingCount > 0 && (
        <p className="notice">
          <Icon name="bell" />
          {tn('mt.notice', pendingCount)}
        </p>
      )}
      <ErrorBox message={error} />
      {!list && !error && <Spinner />}
      {list && list.length === 0 && (
        <Empty icon={<Icon name={tab === 'organizo' ? 'car' : 'hand'} />} title={t('mt.empty')}>
          {tab === 'organizo' ? (
            <Link to="/nuevo" className="btn primary">
              {t('mt.publish')}
            </Link>
          ) : (
            <Link to="/" className="btn primary">
              {t('mt.seeAvailable')}
            </Link>
          )}
        </Empty>
      )}
      <div className="list">
        {list?.map((trip) => (
          <TripCard key={trip.id} trip={trip} userId={userId} />
        ))}
      </div>
    </div>
  );
}
