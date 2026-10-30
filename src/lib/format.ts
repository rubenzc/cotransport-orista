import { getLocale, tr, type Key } from './i18n';
import type { Commitment, Trip } from './types';

/** '08:30:00' -> '08:30' */
export function fmtTime(t: string | null | undefined): string {
  return t ? t.slice(0, 5) : '';
}

function parseISODate(iso: string): Date {
  const [y, m, d] = iso.split('-').map(Number);
  return new Date(y, m - 1, d);
}

export function toISODate(d: Date): string {
  const p = (n: number) => String(n).padStart(2, '0');
  return `${d.getFullYear()}-${p(d.getMonth() + 1)}-${p(d.getDate())}`;
}

export function todayISO(): string {
  return toISODate(new Date());
}

export function fmtDate(d: Date | string): string {
  const date = typeof d === 'string' ? parseISODate(d) : d;
  const tomorrow = new Date();
  tomorrow.setDate(tomorrow.getDate() + 1);
  if (toISODate(date) === todayISO()) return tr('date.today');
  if (toISODate(date) === toISODate(tomorrow)) return tr('date.tomorrow');
  return new Intl.DateTimeFormat(getLocale(), { weekday: 'short', day: 'numeric', month: 'short' }).format(date);
}

/** Dia ISO (1 = dilluns … 7 = diumenge) */
export function isoWeekday(d: Date): number {
  return ((d.getDay() + 6) % 7) + 1;
}

export function dayName(n: number): string {
  return tr(`day.${n}` as Key);
}

export function dayShort(n: number): string {
  return tr(`day.s.${n}` as Key);
}

export function fmtDays(days: number[] | null | undefined): string {
  if (!days || days.length === 0) return '';
  const sorted = [...days].sort((a, b) => a - b);
  const key = sorted.join(',');
  if (key === '1,2,3,4,5') return tr('days.weekdays');
  if (key === '1,2,3,4,5,6,7') return tr('days.everyday');
  if (key === '6,7') return tr('days.weekend');
  if (sorted.length === 1) return tr('days.only', { day: dayName(sorted[0]).toLocaleLowerCase(getLocale()) });
  return sorted.map(dayShort).join(' · ');
}

/** Pròxima sortida del viatge (null si ja ha passat o ha caducat). */
export function nextOccurrence(trip: Trip): Date | null {
  const now = new Date();
  const [hh, mm] = trip.departure_time.split(':').map(Number);
  if (trip.schedule === 'puntual') {
    if (!trip.trip_date) return null;
    const d = parseISODate(trip.trip_date);
    d.setHours(hh, mm);
    const startOfToday = new Date();
    startOfToday.setHours(0, 0, 0, 0);
    return d >= startOfToday ? d : null;
  }
  const days = trip.days_of_week ?? [];
  const lastDay = trip.valid_until ? trip.valid_until : null;
  for (let i = 0; i < 8; i++) {
    const d = new Date();
    d.setDate(now.getDate() + i);
    d.setHours(hh, mm, 0, 0);
    if (lastDay && toISODate(d) > lastDay) return null;
    if (days.includes(isoWeekday(d)) && d >= now) return d;
  }
  return null;
}

export function whenLabel(trip: Trip): string {
  if (trip.schedule === 'puntual') return trip.trip_date ? fmtDate(trip.trip_date) : '';
  return fmtDays(trip.days_of_week);
}

/** Places ocupades per passatgers confirmats (el dia més ple, en els viatges setmanals). */
export function seatsUsed(trip: Trip, commitments: Commitment[] = trip.commitments ?? []): number {
  const confirmed = commitments.filter((c) => c.status === 'confirmado' && c.role === 'pasajero');
  const days = trip.schedule === 'recurrente' && trip.days_of_week?.length ? trip.days_of_week : [0];
  let max = 0;
  for (const d of days) {
    const used = confirmed
      .filter((c) => d === 0 || !c.days_of_week || c.days_of_week.includes(d))
      .reduce((sum, c) => sum + c.seats, 0);
    max = Math.max(max, used);
  }
  return max;
}

export function seatsLeft(trip: Trip): number {
  return Math.max(0, trip.seats - seatsUsed(trip));
}

export function hasDriver(trip: Trip): boolean {
  return (trip.commitments ?? []).some((c) => c.role === 'conductor' && c.status === 'confirmado');
}

export function fmtDuration(min: number | null): string {
  if (!min) return '';
  if (min < 60) return tr('dur.min', { n: min });
  const h = Math.floor(min / 60);
  const m = min % 60;
  return m ? tr('dur.hm', { h, m }) : tr('dur.h', { h });
}

/** Enllaç de WhatsApp (assumeix el prefix +34 si el número té 9 xifres). */
export function whatsappUrl(phone: string): string {
  let digits = phone.replace(/\D/g, '');
  if (digits.length === 9) digits = '34' + digits;
  return `https://wa.me/${digits}`;
}

export const commitmentLabel = (status: string): string => tr(`st.${status}` as Key);
export const proposalLabel = (status: string): string => tr(`pr.${status}` as Key);
