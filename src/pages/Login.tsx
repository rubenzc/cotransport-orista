import { useState, type FormEvent } from 'react';
import { ErrorBox, Field, LangSwitch } from '../components/ui';
import { TOWN, USERNAME_RE, usernameToEmail } from '../lib/config';
import { useT } from '../lib/i18n';
import { errorText, supabase } from '../lib/supabase';

type Mode = 'signin' | 'signup';

export default function Login() {
  const { t } = useT();
  const [mode, setMode] = useState<Mode>('signin');
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const signup = mode === 'signup';

  async function submit(e: FormEvent) {
    e.preventDefault();
    setError(null);
    const user = username.trim().toLowerCase();
    if (user.length < 3) {
      setError(t('lg.userTooShort'));
      return;
    }
    if (user.length > 30) {
      setError(t('lg.userTooLong'));
      return;
    }
    if (!USERNAME_RE.test(user)) {
      setError(t('lg.userChars'));
      return;
    }
    if (signup && password.length < 8) {
      setError(t('lg.passTooShort'));
      return;
    }
    setBusy(true);
    const email = usernameToEmail(user);
    if (signup) {
      const { data, error } = await supabase.auth.signUp({ email, password });
      if (error) setError(errorText(error));
      else if (!data.session) setError(t('lg.needsConfirm'));
    } else {
      const { error } = await supabase.auth.signInWithPassword({ email, password });
      if (error) setError(errorText(error));
    }
    setBusy(false);
  }

  return (
    <div className="screen-center login">
      <LangSwitch />

      <div className="login-hero">
        <img src="./icon.svg" alt="" width={72} height={72} />
        <h1>
          Cotransport <span>{TOWN}</span>
        </h1>
        <p className="muted">{t('lg.tagline')}</p>
      </div>

      <form className="card stack" onSubmit={submit}>
        <Field label={t('lg.username')} hint={signup ? t('lg.usernameHint') : undefined}>
          <input
            required
            autoComplete="username"
            autoCapitalize="none"
            autoCorrect="off"
            spellCheck={false}
            value={username}
            onChange={(e) => setUsername(e.target.value)}
          />
        </Field>
        <Field label={t('lg.password')} hint={signup ? t('lg.passwordHint') : undefined}>
          <div className="row">
            <input
              required
              type={showPassword ? 'text' : 'password'}
              autoComplete={signup ? 'new-password' : 'current-password'}
              value={password}
              onChange={(e) => setPassword(e.target.value)}
            />
            <button
              type="button"
              className="btn icon"
              aria-label={showPassword ? t('lg.hide') : t('lg.show')}
              aria-pressed={showPassword}
              onClick={() => setShowPassword((v) => !v)}
            >
              {showPassword ? '🙈' : '👁️'}
            </button>
          </div>
        </Field>
        <ErrorBox message={error} />
        <button className="btn primary block" disabled={busy}>
          {busy ? t('lg.working') : signup ? t('lg.signup') : t('lg.signin')}
        </button>
        <button
          type="button"
          className="btn ghost block"
          onClick={() => {
            setMode(signup ? 'signin' : 'signup');
            setError(null);
          }}
        >
          {signup ? t('lg.toSignin') : t('lg.toSignup')}
        </button>
      </form>
    </div>
  );
}
