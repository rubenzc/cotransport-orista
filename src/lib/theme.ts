// Tema claro/oscuro. "auto" no pone nada y deja que decida el dispositivo (prefers-color-scheme);
// "light" y "dark" fijan <html data-theme="…"> y ganan sobre el dispositivo (ver styles.css).
export type ThemeMode = 'auto' | 'light' | 'dark';

const STORAGE_KEY = 'cotransport.theme';

export function getStoredTheme(): ThemeMode {
  try {
    const v = localStorage.getItem(STORAGE_KEY);
    if (v === 'light' || v === 'dark') return v;
  } catch {
    // almacenamiento no disponible (modo privado, etc.)
  }
  return 'auto';
}

export function applyTheme(mode: ThemeMode): void {
  const root = document.documentElement;
  if (mode === 'auto') root.removeAttribute('data-theme');
  else root.setAttribute('data-theme', mode);
}

export function setTheme(mode: ThemeMode): void {
  try {
    if (mode === 'auto') localStorage.removeItem(STORAGE_KEY);
    else localStorage.setItem(STORAGE_KEY, mode);
  } catch {
    // ignorado: el tema se aplica igualmente en esta sesión
  }
  applyTheme(mode);
}
