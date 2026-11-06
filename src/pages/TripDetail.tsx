import { useCallback, useEffect, useState, type FormEvent } from 'react';
import { Link, useParams } from 'react-router-dom';
import { Icon } from '../components/Icon';
import { DayPicker, ErrorBox, Field, PlacesDatalist, Spinner, VehicleRules } from '../components/ui';
import { useAuth } from '../lib/auth';
import { category, KM_RATE } from '../lib/config';
import {
  commitmentLabel,
  fmtDate,
  fmtDays,
  fmtDuration,
  fmtTime,
  hasDriver,
  costPerPerson,
  costSharers,
  fmtKm,
  fmtMoney,
  nextOccurrence,
  proposalLabel,
  tripCost,
  seatsLeft,
  seatsUsed,
  todayISO,
  whatsappUrl,
  whenLabel,
} from '../lib/format';
import { useT } from '../lib/i18n';
import { errorText, PROFILE_FIELDS, supabase, TRIP_SELECT } from '../lib/supabase';
import type { Commitment, Profile, Proposal, Trip } from '../lib/types';

export default function TripDetail() {
  const { t } = useT();
  const { id } = useParams();
  const { userId } = useAuth();
  const [trip, setTrip] = useState<Trip | null>(null);
  const [proposals, setProposals] = useState<Proposal[]>([]);
  const [error, setError] = useState<string | null>(null);
  const [panel, setPanel] = useState<'none' | 'join' | 'propose'>('none');

  const load = useCallback(async () => {
    const [tripRes, propRes] = await Promise.all([
      supabase.from('trips').select(TRIP_SELECT).eq('id', id!).single(),
      supabase
        .from('change_proposals')
        .select(`*, proposer:profiles(${PROFILE_FIELDS})`)
        .eq('trip_id', id!)
        .order('created_at', { ascending: false }),
    ]);
    if (tripRes.error) setError(tripRes.error.code === 'PGRST116' ? t('td.notFound') : errorText(tripRes.error));
    else setTrip(tripRes.data as unknown as Trip);
    setProposals((propRes.data ?? []) as Proposal[]);
  }, [id, t]);

  useEffect(() => {
    load();
    // es recarrega sola quan un altre veí s'apunta, confirma o proposa alguna cosa
    const channel = supabase
      .channel(`trip-${id}`)
      .on('postgres_changes', { event: '*', schema: 'public', table: 'trips', filter: `id=eq.${id}` }, load)
      .on('postgres_changes', { event: '*', schema: 'public', table: 'commitments', filter: `trip_id=eq.${id}` }, load)
      .on(
        'postgres_changes',
        { event: '*', schema: 'public', table: 'change_proposals', filter: `trip_id=eq.${id}` },
        load,
      )
      .subscribe();
    return () => {
      supabase.removeChannel(channel);
    };
  }, [id, load]);

  async function run(action: PromiseLike<{ error: unknown }>) {
    setError(null);
    const { error } = await action;
    if (error) setError(errorText(error));
    await load();
  }

  if (error && !trip) {
    return (
      <div className="stack">
        <Link to="/" className="back">
          {t('common.back')}
        </Link>
        <ErrorBox message={error} />
      </div>
    );
  }
  if (!trip) return <Spinner />;

  const cat = category(trip.category);
  const isOwner = trip.owner_id === userId;
  const isOffer = trip.kind === 'oferta';
  const commitments = (trip.commitments ?? []).filter((c) => c.status !== 'cancelado');
  const mine = (trip.commitments ?? []).find((c) => c.user_id === userId);
  const next = nextOccurrence(trip);
  const active = trip.status === 'activo';
  const left = seatsLeft(trip);

  return (
    <div className="stack">
      <Link to="/" className="back">
        {t('common.back')}
      </Link>

      <section className={`card trip-hero ${trip.kind}`}>
        <div className="trip-card-top">
          <span className={`badge kind-${trip.kind}`}>{isOffer ? t('tc.offer') : t('tc.request')}</span>
          <span className="muted small">
            <Icon name={cat.icon} className="cat-ico" /> {cat.label}
          </span>
        </div>
        <h2 className="route big">
          <span>{trip.origin}</span>
          <span className="route-arrow">→</span>
          <span>{trip.destination}</span>
        </h2>
        {!active && <p className="badge danger">{t('td.cancelledBanner')}</p>}
      </section>

      <section className="card">
        <dl className="facts">
          <div>
            <dt>{trip.schedule === 'recurrente' ? t('td.days') : t('td.day')}</dt>
            <dd>
              {whenLabel(trip)}
              {trip.schedule === 'recurrente' && trip.valid_until && (
                <span className="muted small"> {t('td.until', { date: fmtDate(trip.valid_until) })}</span>
              )}
              {trip.schedule === 'recurrente' && next && (
                <div className="muted small">{t('td.nextDeparture', { date: fmtDate(next) })}</div>
              )}
            </dd>
          </div>
          <div>
            <dt>{t('td.departure')}</dt>
            <dd className="time">{fmtTime(trip.departure_time)}</dd>
          </div>
          {trip.return_time && (
            <div>
              <dt>{t('td.return')}</dt>
              <dd className="time">{fmtTime(trip.return_time)}</dd>
            </div>
          )}
          {trip.duration_min && (
            <div>
              <dt>{t('td.duration')}</dt>
              <dd>{fmtDuration(trip.duration_min)}</dd>
            </div>
          )}
          <div>
            <dt>{isOffer ? t('td.seats') : t('td.people')}</dt>
            <dd>
              {isOffer ? (
                <>
                  <strong>{left}</strong> {t('td.freeOf', { n: trip.seats })}
                  {trip.schedule === 'recurrente' && seatsUsed(trip) > 0 && (
                    <div className="muted small">{t('td.busiestDay')}</div>
                  )}
                </>
              ) : (
                <>
                  {trip.seats} ·{' '}
                  {hasDriver(trip) ? (
                    <>
                      <Icon name="check" className="ok-ico" /> {t('td.hasDriver')}
                    </>
                  ) : (
                    t('td.seekingDriver')
                  )}
                </>
              )}
            </dd>
          </div>
          {trip.vehicle && (
            <div>
              <dt>{t('td.vehicle')}</dt>
              <dd>
                {trip.vehicle.model}
                {trip.vehicle.color && ` · ${trip.vehicle.color}`}
                <VehicleRules vehicle={trip.vehicle} />
                {trip.vehicle.notes && <div className="muted small">{trip.vehicle.notes}</div>}
              </dd>
            </div>
          )}
          {trip.distance_km && <CostRow trip={trip} />}
        </dl>

        {trip.pickup_points.length > 0 && (
          <>
            <h4>{t('td.pickups')}</h4>
            <ul className="tags">
              {trip.pickup_points.map((p) => (
                <li key={p} className="tag">
                  <Icon name="pin" /> {p}
                </li>
              ))}
            </ul>
          </>
        )}
        {trip.description && <p className="description">{trip.description}</p>}
      </section>

      <section className="card">
        <h4>{t('td.organizer')}</h4>
        <PersonRow person={trip.owner} showContact={!isOwner} />
      </section>

      <ErrorBox message={error} />

      {/* Accions */}
      {isOwner ? (
        <section className="actions">
          <Link to={`/viaje/${trip.id}/editar`} className="btn">
            <Icon name="edit" />
            {t('td.edit')}
          </Link>
          {active ? (
            <button
              className="btn danger-outline"
              onClick={() =>
                window.confirm(t('td.confirmCancel')) &&
                run(supabase.from('trips').update({ status: 'cancelado' }).eq('id', trip.id))
              }
            >
              {t('td.cancelTrip')}
            </button>
          ) : (
            <button
              className="btn"
              onClick={() => run(supabase.from('trips').update({ status: 'activo' }).eq('id', trip.id))}
            >
              {t('td.reactivate')}
            </button>
          )}
        </section>
      ) : (
        active && (
          <section className="stack-sm">
            {mine && mine.status !== 'cancelado' ? (
              <div className={`card my-commitment st-${mine.status}`}>
                <p>
                  {mine.role === 'conductor' ? t('td.joinedAsDriver') : t('td.joinedAsPassenger')} ·{' '}
                  <strong>{commitmentLabel(mine.status)}</strong>
                </p>
                <CommitmentDetails c={mine} />
                <div className="actions">
                  <button className="btn" onClick={() => setPanel(panel === 'join' ? 'none' : 'join')}>
                    {t('td.modify')}
                  </button>
                  <button
                    className="btn danger-outline"
                    onClick={() =>
                      window.confirm(t('td.confirmLeave')) &&
                      run(supabase.from('commitments').update({ status: 'cancelado' }).eq('id', mine.id))
                    }
                  >
                    {t('td.leave')}
                  </button>
                </div>
              </div>
            ) : (
              <button
                className="btn primary block big"
                disabled={isOffer && left === 0}
                onClick={() => setPanel(panel === 'join' ? 'none' : 'join')}
              >
                {isOffer && left === 0 ? (
                  t('td.tripFull')
                ) : (
                  <>
                    <Icon name={isOffer ? 'hand' : 'car'} />
                    {isOffer ? t('td.join') : t('td.drive')}
                  </>
                )}
              </button>
            )}
            <button className="btn block" onClick={() => setPanel(panel === 'propose' ? 'none' : 'propose')}>
              <Icon name="chat" />
              {t('td.propose')}
            </button>
          </section>
        )
      )}

      {panel === 'join' && (
        <JoinForm
          trip={trip}
          existing={mine}
          onDone={async () => {
            setPanel('none');
            await load();
          }}
        />
      )}
      {panel === 'propose' && (
        <ProposalForm
          trip={trip}
          onDone={async () => {
            setPanel('none');
            await load();
          }}
        />
      )}

      {/* Participants */}
      <section className="card">
        <h4>{t(isOffer ? 'td.joinedList' : 'td.driversList', { n: commitments.length })}</h4>
        {commitments.length === 0 ? (
          <p className="muted small">{t('td.nobody')}</p>
        ) : (
          <ul className="people">
            {commitments.map((c) => (
              <li key={c.id} className={`person-item st-${c.status}`}>
                <PersonRow person={c.user} showContact={isOwner || c.user_id === userId} />
                <div className="person-extra">
                  <span className={`badge st-${c.status}`}>{commitmentLabel(c.status)}</span>
                  <CommitmentDetails c={c} />
                </div>
                {isOwner && active && c.status === 'pendiente' && (
                  <div className="actions">
                    <button
                      className="btn primary"
                      onClick={() => run(supabase.from('commitments').update({ status: 'confirmado' }).eq('id', c.id))}
                    >
                      {t('td.confirm')}
                    </button>
                    <button
                      className="btn danger-outline"
                      onClick={() => run(supabase.from('commitments').update({ status: 'rechazado' }).eq('id', c.id))}
                    >
                      {t('td.reject')}
                    </button>
                  </div>
                )}
                {isOwner && active && c.status === 'confirmado' && (
                  <button
                    className="btn ghost small"
                    onClick={() => run(supabase.from('commitments').update({ status: 'pendiente' }).eq('id', c.id))}
                  >
                    {t('td.undoConfirm')}
                  </button>
                )}
              </li>
            ))}
          </ul>
        )}
      </section>

      {/* Propostes de canvi */}
      <section className="card">
        <h4>{t('td.proposals', { n: proposals.length })}</h4>
        {proposals.length === 0 ? (
          <p className="muted small">{isOwner ? t('td.proposalsOwnerEmpty') : t('td.noProposals')}</p>
        ) : (
          <ul className="people">
            {proposals.map((p) => (
              <ProposalItem key={p.id} p={p} trip={trip} isOwner={isOwner} userId={userId} onChange={load} />
            ))}
          </ul>
        )}
      </section>
    </div>
  );
}

function PersonRow({ person, showContact }: { person?: Profile; showContact: boolean }) {
  const { t } = useT();
  if (!person) return null;
  return (
    <div className="person">
      <span className="avatar" aria-hidden="true">
        {person.full_name.charAt(0).toUpperCase()}
      </span>
      <span className="person-name">{person.full_name}</span>
      {showContact && person.phone && (
        <span className="contact">
          <a
            className="btn icon"
            href={`tel:${person.phone}`}
            aria-label={t('td.callAria', { name: person.full_name })}
          >
            <Icon name="phone" />
          </a>
          <a
            className="btn icon"
            href={whatsappUrl(person.phone)}
            target="_blank"
            rel="noreferrer"
            aria-label={t('td.whatsappAria', { name: person.full_name })}
          >
            <Icon name="chat" />
          </a>
        </span>
      )}
    </div>
  );
}

function CommitmentDetails({ c }: { c: Commitment }) {
  const { tn } = useT();
  return (
    <div className="muted small">
      {c.role === 'pasajero' && tn('seats', c.seats)}
      {c.pickup_point && (
        <>
          {' '}
          · <Icon name="pin" /> {c.pickup_point}
        </>
      )}
      {c.days_of_week && ` · ${fmtDays(c.days_of_week)}`}
      {c.note && <div>“{c.note}”</div>}
    </div>
  );
}

function JoinForm({ trip, existing, onDone }: { trip: Trip; existing?: Commitment; onDone: () => void }) {
  const { t } = useT();
  const isOffer = trip.kind === 'oferta';
  const tripDays = trip.days_of_week ?? [];
  const [seats, setSeats] = useState(existing?.seats ?? 1);
  const [pickup, setPickup] = useState(existing?.pickup_point ?? trip.pickup_points[0] ?? '');
  const [days, setDays] = useState<number[]>(existing?.days_of_week ?? tripDays);
  const [note, setNote] = useState(existing?.note ?? '');
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function submit(e: FormEvent) {
    e.preventDefault();
    if (trip.schedule === 'recurrente' && days.length === 0) {
      setError(t('jf.errDays'));
      return;
    }
    setBusy(true);
    setError(null);
    const fields = {
      seats: isOffer ? seats : 1,
      pickup_point: pickup.trim() || null,
      // tots els dies del viatge -> null (= "tots")
      days_of_week: trip.schedule === 'recurrente' && days.length < tripDays.length ? days : null,
      note: note.trim() || null,
    };
    const { error } = existing
      ? await supabase
          .from('commitments')
          .update({ ...fields, status: 'pendiente' })
          .eq('id', existing.id)
      : await supabase.from('commitments').insert({ trip_id: trip.id, ...fields });
    setBusy(false);
    if (error) setError(errorText(error));
    else onDone();
  }

  return (
    <form className="card stack panel" onSubmit={submit}>
      <h3>{isOffer ? t('jf.titleJoin') : t('jf.titleDrive')}</h3>
      <PlacesDatalist extra={trip.pickup_points} />
      {isOffer && (
        <Field label={t('jf.seatsNeeded')}>
          <input
            type="number"
            inputMode="numeric"
            min={1}
            max={trip.seats}
            value={seats}
            onChange={(e) => setSeats(Number(e.target.value))}
          />
        </Field>
      )}
      <Field label={isOffer ? t('jf.pickupJoin') : t('jf.pickupDrive')}>
        <input list="places" value={pickup} onChange={(e) => setPickup(e.target.value)} />
      </Field>
      {trip.schedule === 'recurrente' && (
        <Field label={t('jf.whichDays')}>
          <DayPicker value={days} onChange={setDays} allowed={tripDays} />
        </Field>
      )}
      <Field label={t('jf.message')}>
        <textarea
          rows={2}
          value={note}
          onChange={(e) => setNote(e.target.value)}
          placeholder={isOffer ? t('jf.msgJoin') : t('jf.msgDrive')}
        />
      </Field>
      <ErrorBox message={error} />
      <button className="btn primary block" disabled={busy}>
        {busy ? t('common.sending') : existing && existing.status !== 'cancelado' ? t('common.save') : t('jf.send')}
      </button>
      <p className="muted small">{t('jf.note')}</p>
    </form>
  );
}

function ProposalForm({ trip, onDone }: { trip: Trip; onDone: () => void }) {
  const { t } = useT();
  const [date, setDate] = useState('');
  const [days, setDays] = useState<number[]>(trip.days_of_week ?? []);
  const [dep, setDep] = useState('');
  const [ret, setRet] = useState('');
  const [pickup, setPickup] = useState('');
  const [message, setMessage] = useState('');
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function submit(e: FormEvent) {
    e.preventDefault();
    setBusy(true);
    setError(null);
    const sameDays = [...days].sort().join() === [...(trip.days_of_week ?? [])].sort().join();
    const { error } = await supabase.from('change_proposals').insert({
      trip_id: trip.id,
      new_trip_date: trip.schedule === 'puntual' && date ? date : null,
      new_days_of_week: trip.schedule === 'recurrente' && !sameDays && days.length ? days : null,
      new_departure_time: dep || null,
      new_return_time: ret || null,
      new_pickup_point: pickup.trim() || null,
      message: message.trim(),
    });
    setBusy(false);
    if (error) setError(errorText(error));
    else onDone();
  }

  return (
    <form className="card stack panel" onSubmit={submit}>
      <h3>{t('pf.title')}</h3>
      <p className="muted small">{t('pf.sub')}</p>
      <PlacesDatalist extra={trip.pickup_points} />
      {trip.schedule === 'puntual' ? (
        <Field label={t('pf.otherDate', { date: whenLabel(trip) })}>
          <input type="date" min={todayISO()} value={date} onChange={(e) => setDate(e.target.value)} />
        </Field>
      ) : (
        <Field label={t('pf.otherDays')}>
          <DayPicker value={days} onChange={setDays} />
        </Field>
      )}
      <div className="grid-2">
        <Field label={t('pf.departureNow', { time: fmtTime(trip.departure_time) })}>
          <input type="time" value={dep} onChange={(e) => setDep(e.target.value)} />
        </Field>
        <Field label={trip.return_time ? t('pf.returnNow', { time: fmtTime(trip.return_time) }) : t('pf.return')}>
          <input type="time" value={ret} onChange={(e) => setRet(e.target.value)} />
        </Field>
      </div>
      <Field label={t('pf.addPickup')}>
        <input list="places" value={pickup} onChange={(e) => setPickup(e.target.value)} />
      </Field>
      <Field label={t('pf.explain')}>
        <textarea
          rows={3}
          required
          value={message}
          onChange={(e) => setMessage(e.target.value)}
          placeholder={t('pf.explainPh')}
        />
      </Field>
      <ErrorBox message={error} />
      <button className="btn primary block" disabled={busy}>
        {busy ? t('common.sending') : t('pf.send')}
      </button>
    </form>
  );
}

function ProposalItem({
  p,
  trip,
  isOwner,
  userId,
  onChange,
}: {
  p: Proposal;
  trip: Trip;
  isOwner: boolean;
  userId: string;
  onChange: () => void;
}) {
  const { t } = useT();
  const [response, setResponse] = useState('');
  const [error, setError] = useState<string | null>(null);
  const pending = p.status === 'pendiente';

  async function call(fn: string, args: Record<string, unknown>) {
    setError(null);
    const { error } = await supabase.rpc(fn, args);
    if (error) setError(errorText(error));
    else onChange();
  }

  const changes: string[] = [];
  if (p.new_trip_date) changes.push(t('pi.date', { v: fmtDate(p.new_trip_date) }));
  if (p.new_days_of_week) changes.push(t('pi.days', { v: fmtDays(p.new_days_of_week) }));
  if (p.new_departure_time) changes.push(t('pi.departure', { v: fmtTime(p.new_departure_time) }));
  if (p.new_return_time) changes.push(t('pi.return', { v: fmtTime(p.new_return_time) }));
  if (p.new_origin) changes.push(t('pi.origin', { v: p.new_origin }));
  if (p.new_destination && p.new_destination !== trip.destination) {
    changes.push(t('pi.destination', { v: p.new_destination }));
  }
  if (p.new_pickup_point) changes.push(t('pi.newPickup', { v: p.new_pickup_point }));

  return (
    <li className={`person-item pr-${p.status}`}>
      <div className="person">
        <span className="avatar" aria-hidden="true">
          {p.proposer?.full_name.charAt(0).toUpperCase()}
        </span>
        <span className="person-name">{p.proposer?.full_name}</span>
        <span className={`badge pr-${p.status}`}>{proposalLabel(p.status)}</span>
      </div>
      {changes.length > 0 && (
        <ul className="changes">
          {changes.map((c) => (
            <li key={c}>{c}</li>
          ))}
        </ul>
      )}
      <p>“{p.message}”</p>
      {p.response && <p className="muted small">{t('pi.response', { v: p.response })}</p>}
      <ErrorBox message={error} />

      {pending && isOwner && (
        <div className="stack-sm">
          <input
            value={response}
            onChange={(e) => setResponse(e.target.value)}
            placeholder={t('pi.responsePh')}
            aria-label={t('pi.responseAria')}
          />
          <div className="actions">
            <button
              className="btn primary"
              onClick={() => call('respond_proposal', { p_id: p.id, p_accept: true, p_response: response })}
            >
              {t('pi.accept')}
            </button>
            <button
              className="btn danger-outline"
              onClick={() => call('respond_proposal', { p_id: p.id, p_accept: false, p_response: response })}
            >
              {t('pi.reject')}
            </button>
          </div>
        </div>
      )}
      {pending && p.proposer_id === userId && (
        <button className="btn ghost small" onClick={() => call('withdraw_proposal', { p_id: p.id })}>
          {t('pi.withdraw')}
        </button>
      )}
    </li>
  );
}

function CostRow({ trip }: { trip: Trip }) {
  const { t, tn } = useT();
  const total = tripCost(trip)!;
  const now = costSharers(trip);
  const max = trip.seats + 1;
  return (
    <div className="fact-wide">
      <dt>{t('td.cost')}</dt>
      <dd>
        <strong>{t('td.costEach', { each: fmtMoney(costPerPerson(trip)!), people: tn('ppl', now) })}</strong>
        <div className="muted small">
          {t('td.costTotal', { total: fmtMoney(total), km: fmtKm(trip.distance_km!), rate: fmtMoney(KM_RATE) })}
        </div>
        {now < max && (
          <div className="muted small">{t('td.costFull', { people: tn('ppl', max), each: fmtMoney(costPerPerson(trip, max)!) })}</div>
        )}
        <div className="muted small">{t('td.costNote')}</div>
      </dd>
    </div>
  );
}
