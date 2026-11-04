import { useCallback, useEffect, useState, type FormEvent } from 'react';
import { Icon } from '../components/Icon';
import { ErrorBox, Field, LangSwitch, ThemeSwitch } from '../components/ui';
import { useAuth } from '../lib/auth';
import { emailToUsername } from '../lib/config';
import { useT } from '../lib/i18n';
import { errorText, supabase } from '../lib/supabase';
import type { Vehicle } from '../lib/types';

export default function ProfilePage() {
  const { t, tn } = useT();
  const { profile, userId, session, refreshProfile } = useAuth();
  const [name, setName] = useState(profile?.full_name ?? '');
  const [phone, setPhone] = useState(profile?.phone ?? '');
  const [saved, setSaved] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [vehicles, setVehicles] = useState<Vehicle[]>([]);

  const loadVehicles = useCallback(
    () =>
      supabase
        .from('vehicles')
        .select('*')
        .eq('owner_id', userId)
        .order('created_at')
        .then(({ data }) => setVehicles((data ?? []) as Vehicle[])),
    [userId],
  );

  useEffect(() => {
    loadVehicles();
  }, [loadVehicles]);

  async function saveProfile(e: FormEvent) {
    e.preventDefault();
    setError(null);
    const { error } = await supabase
      .from('profiles')
      .update({ full_name: name.trim(), phone: phone.trim() || null })
      .eq('id', userId);
    if (error) setError(errorText(error));
    else {
      setSaved(true);
      setTimeout(() => setSaved(false), 2000);
      await refreshProfile();
    }
  }

  async function removeVehicle(v: Vehicle) {
    if (!window.confirm(t('pp.removeConfirm', { model: v.model }))) return;
    const { error } = await supabase.from('vehicles').delete().eq('id', v.id);
    if (error) setError(errorText(error));
    loadVehicles();
  }

  return (
    <div className="stack">
      <h2>{t('pp.title')}</h2>

      <section className="card stack">
        <h3>{t('pp.preferences')}</h3>
        <div className="field">
          <span className="field-label">{t('lang.label')}</span>
          <LangSwitch />
        </div>
        <div className="field">
          <span className="field-label">{t('theme.label')}</span>
          <ThemeSwitch />
          <span className="field-hint">{t('theme.hint')}</span>
        </div>
      </section>

      <form className="card stack" onSubmit={saveProfile}>
        <Field label={t('pp.name')}>
          <input required minLength={2} value={name} onChange={(e) => setName(e.target.value)} />
        </Field>
        <Field label={t('pp.phone')} hint={t('pp.phoneHint')}>
          <input type="tel" inputMode="tel" value={phone} onChange={(e) => setPhone(e.target.value)} />
        </Field>
        <p className="muted small">{t('pp.user', { u: emailToUsername(session?.user.email) })}</p>
        <ErrorBox message={error} />
        <button className="btn primary block">{saved ? t('common.saved') : t('common.save')}</button>
      </form>

      <section className="card stack">
        <h3>{t('pp.vehicles')}</h3>
        {vehicles.length === 0 && <p className="muted small">{t('pp.noVehicles')}</p>}
        <ul className="people">
          {vehicles.map((v) => (
            <li key={v.id} className="person-item">
              <div className="person">
                <span className="avatar" aria-hidden="true">
                  <Icon name="car" />
                </span>
                <span className="person-name">
                  {v.model}
                  <span className="muted small">
                    {' '}
                    {v.color && `· ${v.color} `}· {tn('seats', v.seats)}
                  </span>
                </span>
                <button className="btn ghost small" onClick={() => removeVehicle(v)}>
                  {t('common.remove')}
                </button>
              </div>
              {v.notes && <p className="muted small">{v.notes}</p>}
            </li>
          ))}
        </ul>
        <VehicleForm onSaved={loadVehicles} />
      </section>

      <button className="btn block danger-outline" onClick={() => supabase.auth.signOut()}>
        {t('pp.signOut')}
      </button>
    </div>
  );
}

function VehicleForm({ onSaved }: { onSaved: () => void }) {
  const { t } = useT();
  const [open, setOpen] = useState(false);
  const [model, setModel] = useState('');
  const [color, setColor] = useState('');
  const [seats, setSeats] = useState(5);
  const [notes, setNotes] = useState('');
  const [error, setError] = useState<string | null>(null);

  if (!open) {
    return (
      <button type="button" className="btn block" onClick={() => setOpen(true)}>
        <Icon name="plus" />
        {t('pp.addVehicle')}
      </button>
    );
  }

  async function save(e: FormEvent) {
    e.preventDefault();
    setError(null);
    const { error } = await supabase
      .from('vehicles')
      .insert({ model: model.trim(), color: color.trim() || null, seats, notes: notes.trim() || null });
    if (error) {
      setError(errorText(error));
      return;
    }
    setModel('');
    setColor('');
    setNotes('');
    setOpen(false);
    onSaved();
  }

  return (
    <form className="stack panel-inner" onSubmit={save}>
      <Field label={t('pp.model')}>
        <input required value={model} onChange={(e) => setModel(e.target.value)} placeholder={t('pp.modelPh')} />
      </Field>
      <div className="grid-2">
        <Field label={t('pp.color')}>
          <input value={color} onChange={(e) => setColor(e.target.value)} placeholder={t('pp.colorPh')} />
        </Field>
        <Field label={t('pp.seatsTotal')}>
          <input
            type="number"
            inputMode="numeric"
            min={1}
            max={8}
            value={seats}
            onChange={(e) => setSeats(Number(e.target.value))}
          />
        </Field>
      </div>
      <Field label={t('pp.notes')} hint={t('pp.notesHint')}>
        <input value={notes} onChange={(e) => setNotes(e.target.value)} />
      </Field>
      <ErrorBox message={error} />
      <div className="actions">
        <button className="btn primary">{t('pp.saveVehicle')}</button>
        <button type="button" className="btn ghost" onClick={() => setOpen(false)}>
          {t('common.cancel')}
        </button>
      </div>
    </form>
  );
}
