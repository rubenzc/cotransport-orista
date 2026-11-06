import { useState, type ReactNode } from 'react';
import { DAY_NUMBERS, FREQUENT_PLACES } from '../lib/config';
import { dayName, dayShort } from '../lib/format';
import { useT, type Key, type Lang } from '../lib/i18n';
import { getStoredTheme, setTheme, type ThemeMode } from '../lib/theme';
import { Icon, type IconName } from './Icon';

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
  label,
  stacked,
}: {
  value: T;
  onChange: (v: T) => void;
  options: { value: T; label: ReactNode }[];
  /** nombre accesible del grupo (lectores de pantalla) */
  label?: string;
  /** icono encima del texto: para opciones con icono que no caben en una fila */
  stacked?: boolean;
}) {
  return (
    <div className={stacked ? 'segmented stacked' : 'segmented'} role="radiogroup" aria-label={label}>
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
      label={t('lang.label')}
      value={lang}
      onChange={setLang}
      options={[
        { value: 'ca', label: <span lang="ca">{t('lang.ca')}</span> },
        { value: 'es', label: <span lang="es">{t('lang.es')}</span> },
      ]}
    />
  );
}

/** Idioma discreto para la pantalla de acceso: dos enlaces de texto, sin competir con el logo ni el formulario. */
export function LangLinks() {
  const { lang, setLang, t } = useT();
  const options: { value: Lang; label: Key }[] = [
    { value: 'ca', label: 'lang.ca' },
    { value: 'es', label: 'lang.es' },
  ];
  return (
    <div className="lang-links" role="group" aria-label={t('lang.label')}>
      <Icon name="languages" />
      {options.map((o, i) => (
        <span key={o.value} className="lang-item">
          {i > 0 && <span aria-hidden="true">·</span>}
          <button type="button" lang={o.value} aria-pressed={lang === o.value} onClick={() => setLang(o.value)}>
            {t(o.label)}
          </button>
        </span>
      ))}
    </div>
  );
}

const THEME_OPTIONS: { value: ThemeMode; label: Key; icon: IconName }[] = [
  { value: 'auto', label: 'theme.auto', icon: 'auto' },
  { value: 'light', label: 'theme.light', icon: 'sun' },
  { value: 'dark', label: 'theme.dark', icon: 'moon' },
];

/** Tema de la interfaz: automático (el del dispositivo), claro u oscuro. */
export function ThemeSwitch() {
  const { t } = useT();
  const [mode, setMode] = useState<ThemeMode>(getStoredTheme);
  return (
    <Segmented<ThemeMode>
      stacked
      label={t('theme.label')}
      value={mode}
      onChange={(m) => {
        setTheme(m);
        setMode(m);
      }}
      options={THEME_OPTIONS.map((o) => ({
        value: o.value,
        label: (
          <>
            <Icon name={o.icon} />
            {t(o.label)}
          </>
        ),
      }))}
    />
  );
}

/** Normes del cotxe: fumadors i mascotes, amb icona i text (mai només color). */
export function VehicleRules({ vehicle }: { vehicle: { smoking: boolean; pets: boolean } }) {
  const { t } = useT();
  return (
    <ul className="rule-tags">
      <li>
        <Icon name={vehicle.smoking ? 'smoke' : 'noSmoke'} />
        {vehicle.smoking ? t('vh.smokingYes') : t('vh.smokingNo')}
      </li>
      <li>
        <Icon name="paw" />
        {vehicle.pets ? t('vh.petsYes') : t('vh.petsNo')}
      </li>
    </ul>
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

export function Empty({ icon, title, children }: { icon: ReactNode; title: string; children?: ReactNode }) {
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
