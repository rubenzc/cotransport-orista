import type { IconName } from '../components/Icon';
import { tr, type Key } from './i18n';

// Ajustos del poble: edita aquests valors per adaptar l'app a una altra zona.
export const TOWN = 'Oristà';

// Supabase Auth exigeix un correu; amb el login per usuari en fabriquem un de sintètic.
// No s'hi envia mai cap missatge (cal tenir desactivat «Confirm email» a Supabase).
export const AUTH_EMAIL_DOMAIN = 'cotransport-orista.app';
export const USERNAME_RE = /^[a-z0-9._-]{3,30}$/;

export function usernameToEmail(username: string): string {
  return `${username}@${AUTH_EMAIL_DOMAIN}`;
}

export function emailToUsername(email: string | undefined): string {
  return (email ?? '').split('@')[0];
}

// Suggeriments que apareixen en escriure origen, destinació o punt de recollida.
export const FREQUENT_PLACES = [
  'Oristà – Plaça',
  'Oristà – Parada del bus',
  'Vic',
  'Hospital Universitari de Vic',
  'Manresa',
  'Prats de Lluçanès',
  'Sant Feliu Sasserra',
  'Barcelona',
];

// `value` és el que es desa a la base de dades; el text es tradueix amb `cat.<value>`.
export const CATEGORIES = [
  { value: 'trabajo', icon: 'work' },
  { value: 'medico', icon: 'medical' },
  { value: 'compras', icon: 'shop' },
  { value: 'estudios', icon: 'school' },
  { value: 'tramites', icon: 'docs' },
  { value: 'ocio', icon: 'party' },
  { value: 'otro', icon: 'car' },
] as const satisfies readonly { value: string; icon: IconName }[];

// Tarifa per quilòmetre (€/km). Import oficial de 2026 a Espanya; es revisa cada any.
export const KM_RATE = 0.26;

// Dies ISO: 1 = dilluns … 7 = diumenge
export const DAY_NUMBERS = [1, 2, 3, 4, 5, 6, 7];

export function category(value: string) {
  const cat = CATEGORIES.find((c) => c.value === value) ?? CATEGORIES[CATEGORIES.length - 1];
  return { ...cat, label: tr(`cat.${cat.value}` as Key) };
}
