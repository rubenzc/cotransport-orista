import { Link } from 'react-router-dom';
import { category } from '../lib/config';
import { commitmentLabel, fmtDate, fmtTime, hasDriver, nextOccurrence, seatsLeft, whenLabel } from '../lib/format';
import { useT } from '../lib/i18n';
import type { Trip } from '../lib/types';
import { Icon } from './Icon';

export default function TripCard({ trip, userId }: { trip: Trip; userId: string }) {
  const { t, tn } = useT();
  const cat = category(trip.category);
  const next = nextOccurrence(trip);
  const mine = trip.owner_id === userId;
  const joined = (trip.commitments ?? []).find((c) => c.user_id === userId && c.status !== 'cancelado');
  const left = seatsLeft(trip);

  return (
    <Link to={`/viaje/${trip.id}`} className={`card trip-card ${trip.kind}`}>
      <div className="trip-card-top">
        <span className={`badge kind-${trip.kind}`}>{trip.kind === 'oferta' ? t('tc.offer') : t('tc.request')}</span>
        <span className="muted small">
          <Icon name={cat.icon} className="cat-ico" /> {cat.label}
        </span>
      </div>

      <div className="route">
        <span className="route-place">{trip.origin}</span>
        <span className="route-arrow" aria-hidden="true">
          →
        </span>
        <span className="route-place">{trip.destination}</span>
      </div>

      <div className="trip-card-meta">
        <span className="time">{fmtTime(trip.departure_time)}</span>
        <span>
          <Icon name={trip.schedule === 'recurrente' ? 'repeat' : 'calendar'} className="meta-ico" />
          {whenLabel(trip)}
          {trip.schedule === 'recurrente' && next && (
            <span className="muted"> · {t('tc.next', { date: fmtDate(next) })}</span>
          )}
        </span>
      </div>

      <div className="trip-card-bottom">
        <span className="muted small">
          {trip.owner?.full_name ?? t('common.neighbour')}
          {trip.vehicle && ` · ${trip.vehicle.model}`}
        </span>
        {trip.status === 'cancelado' ? (
          <span className="badge danger">{t('tc.cancelled')}</span>
        ) : trip.kind === 'oferta' ? (
          <span className={left > 0 ? 'badge ok' : 'badge full'}>{left > 0 ? tn('seats', left) : t('tc.full')}</span>
        ) : (
          <span className={hasDriver(trip) ? 'badge ok' : 'badge warn'}>
            {hasDriver(trip) ? t('tc.withDriver') : t('tc.people', { n: trip.seats })}
          </span>
        )}
      </div>

      {(mine || joined) && (
        <div className="trip-card-flag">
          <Icon name={mine ? 'star' : 'hand'} />
          {mine ? t('tc.mine') : t('tc.joined', { status: commitmentLabel(joined!.status) })}
        </div>
      )}
    </Link>
  );
}
