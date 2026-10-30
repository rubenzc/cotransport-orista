import { createClient } from '@supabase/supabase-js';
import { hasKey, tr, type Key } from './i18n';

const url = import.meta.env.VITE_SUPABASE_URL;
const key = import.meta.env.VITE_SUPABASE_ANON_KEY;

export const isConfigured = Boolean(url && key);

export const supabase = createClient(url || 'http://localhost', key || 'missing', {
  auth: { persistSession: true, autoRefreshToken: true, detectSessionInUrl: false },
});

export const PROFILE_FIELDS = 'id, full_name, phone';

export const TRIP_SELECT =
  `*, owner:profiles(${PROFILE_FIELDS}), vehicle:vehicles(*), ` +
  `commitments(*, user:profiles(${PROFILE_FIELDS}))`;

// Codis d'error de Supabase Auth -> clau de traducció
const AUTH_ERRORS: Record<string, Key> = {
  invalid_credentials: 'ae.invalid',
  user_already_exists: 'ae.exists',
  weak_password: 'ae.weak',
  over_request_rate_limit: 'ae.rate',
  over_email_send_rate_limit: 'ae.rate',
  signup_disabled: 'ae.signupDisabled',
  email_address_invalid: 'ae.emailInvalid',
};

/**
 * Text d'error traduït. Els triggers de la base de dades llancen codis `err_*`
 * (vegeu supabase/schema.sql) que aquí es converteixen a l'idioma actual.
 */
export function errorText(e: unknown): string {
  if (!e) return tr('common.unknownError');
  const obj = typeof e === 'object' ? (e as { message?: unknown; code?: unknown }) : null;
  const message = typeof e === 'string' ? e : obj?.message ? String(obj.message) : '';
  const code = obj?.code ? String(obj.code) : '';

  if (AUTH_ERRORS[code]) return tr(AUTH_ERRORS[code]);
  const dbKey = `db.${message}`;
  if (hasKey(dbKey)) return tr(dbKey);
  return message || tr('common.unknownError');
}
