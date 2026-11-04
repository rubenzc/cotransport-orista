import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';
import App from './App';
import { AuthProvider } from './lib/auth';
import { I18nProvider } from './lib/i18n';
import { applyTheme, getStoredTheme } from './lib/theme';
import './styles.css';

// también lo hace un script en index.html antes de pintar; aquí se asegura el mismo estado
applyTheme(getStoredTheme());

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <I18nProvider>
      <AuthProvider>
        <App />
      </AuthProvider>
    </I18nProvider>
  </StrictMode>,
);
