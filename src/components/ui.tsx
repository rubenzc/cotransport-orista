import type { ReactNode } from 'react';
import { DAY_NUMBERS, FREQUENT_PLACES } from '../lib/config';
import { dayName, dayShort } from '../lib/format';
import { useT, type Lang } from '../lib/i18n';

export function Field({ label, hint, children }: { label: string; hint?: string; children: ReactNode }) {
  return (
    <label className="field">
      <span className="field-label">{label}</span>
      {children}
      {hint && <span className="field-hint">{hint}</span>}
    </label>
  );
}

/** Selector de dies de la setmana (1 = dilluns … 7 = diumenge). */
export function DayPicker({
  value,
  onChange,
  allowed,
}: {
  value: number[];
  onChange: (days: number[]) => void;
  allowed?: number[];
}) {
  useT(); // es torna a pintar en canviar d'idioma
  const days = allowed ? DAY_NUMBERS.filter((n) => allowed.includes(n)) : DAY_NUMBERS;
  const toggle = (n: number) =>
    onChange(value.includes(n) ? value.filter((d) => d !== n) : [...value, n].sort((a, b) => a - b));
  return (
    <div className="daypicker" role="group">
      {days.map((n) => (
        <button
          key={n}
          type="button"
          className={value.includes(n) ? 'day on' : 'day'}
          aria-pressed={value.includes(n)}
          aria-label={dayName(n)}
          onClick={() => toggle(n)}
        >
          {dayShort(n)}
        </button>
      ))}
    </div>
  );
}

/** Llista de llocs freqüents per als <input list="places">. */
export function PlacesDatalist({ extra = [] }: { extra?: string[] }) {
  const all = Array.from(new Set([...FREQUENT_PLACES, ...extra]));
  return (
    <datalist id="places">
      {all.map((p) => (
        <option key={p} value={p} />
      ))}
    </datalist>
  );
}

export function Segmented<T extends string>({
  value,
  onChange,
  options,
}: {
  value: T;
  onChange: (v: T) => void;
  options: { value: T; label: string }[];
}) {
  return (
    <div className="segmented" role="radiogroup">
      {options.map((o) => (
        <button
          key={o.value}
          type="button"
          role="radio"
          aria-checked={value === o.value}
          className={value === o.value ? 'seg on' : 'seg'}
          onClick={() => onChange(o.value)}
        >
          {o.label}
        </button>
      ))}
    </div>
  );
}

/** Selector d'idioma: català (per defecte) o espanyol d'Espanya. */
export function LangSwitch() {
  const { lang, setLang, t } = useT();
  return (
    <Segmented<Lang>
      value={lang}
      onChange={setLang}
      options={[
        { value: 'ca', label: t('lang.ca') },
        { value: 'es', label: t('lang.es') },
      ]}
    />
  );
}

export function Spinner({ label }: { label?: string }) {
  const { t } = useT();
  return (
    <div className="spinner" role="status">
      <span className="spinner-dot" />
      {label ?? t('common.loading')}
    </div>
  );
}

export function ErrorBox({ message }: { message: string | null }) {
  if (!message) return null;
  return (
    <p className="error" role="alert">
      {message}
    </p>
  );
}

export function Empty({ icon, title, children }: { icon: string; title: string; children?: ReactNode }) {
  return (
    <div className="empty">
      <div className="empty-icon" aria-hidden="true">
        {icon}
      </div>
      <h3>{title}</h3>
      {children}
    </div>
  );
}
