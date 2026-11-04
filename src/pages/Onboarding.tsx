import { useState, type FormEvent } from 'react';
import { ErrorBox, Field, LangLinks } from '../components/ui';
import { useAuth } from '../lib/auth';
import { TOWN } from '../lib/config';
import { useT } from '../lib/i18n';
import { errorText, supabase } from '../lib/supabase';

export default function Onboarding() {
  const { t } = useT();
  const { userId, refreshProfile } = useAuth();
  const [name, setName] = useState('');
  const [phone, setPhone] = useState('');
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function save(e: FormEvent) {
    e.preventDefault();
    setBusy(true);
    setError(null);
    const { error } = await supabase
      .from('profiles')
      .upsert({ id: userId, full_name: name.trim(), phone: phone.trim() || null });
    setBusy(false);
    if (error) setError(errorText(error));
    else await refreshProfile();
  }

  return (
    <div className="screen-center">
      <form className="card stack" onSubmit={save}>
        <h2>{t('ob.title', { town: TOWN })}</h2>
        <p className="muted">{t('ob.sub')}</p>
        <Field label={t('ob.name')}>
          <input required minLength={2} value={name} onChange={(e) => setName(e.target.value)} autoComplete="name" />
        </Field>
        <Field label={t('ob.phone')} hint={t('ob.phoneHint')}>
          <input type="tel" inputMode="tel" autoComplete="tel" value={phone} onChange={(e) => setPhone(e.target.value)} />
        </Field>
        <ErrorBox message={error} />
        <button className="btn primary block" disabled={busy}>
          {busy ? t('common.saving') : t('ob.start')}
        </button>
        <button type="button" className="btn ghost block" onClick={() => supabase.auth.signOut()}>
          {t('pp.signOut')}
        </button>
      </form>

      <LangLinks />
    </div>
  );
}
