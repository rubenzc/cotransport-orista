import { HashRouter, Navigate, Route, Routes } from 'react-router-dom';
import Layout from './components/Layout';
import { Spinner } from './components/ui';
import { useAuth } from './lib/auth';
import { useT } from './lib/i18n';
import { isConfigured } from './lib/supabase';
import Home from './pages/Home';
import Login from './pages/Login';
import MyTrips from './pages/MyTrips';
import Onboarding from './pages/Onboarding';
import ProfilePage from './pages/Profile';
import TripDetail from './pages/TripDetail';
import TripForm from './pages/TripForm';

export default function App() {
  const { session, profile, loading } = useAuth();
  const { t } = useT();

  if (!isConfigured) {
    return (
      <div className="screen-center">
        <div className="card">
          <h2>{t('cfg.title')}</h2>
          <p>{t('cfg.body')}</p>
        </div>
      </div>
    );
  }

  if (loading) {
    return (
      <div className="screen-center">
        <Spinner />
      </div>
    );
  }

  if (!session) return <Login />;
  if (!profile) return <Onboarding />;

  return (
    <HashRouter>
      <Routes>
        <Route element={<Layout />}>
          <Route index element={<Home />} />
          <Route path="nuevo" element={<TripForm />} />
          <Route path="viaje/:id" element={<TripDetail />} />
          <Route path="viaje/:id/editar" element={<TripForm />} />
          <Route path="mis-viajes" element={<MyTrips />} />
          <Route path="perfil" element={<ProfilePage />} />
          <Route path="*" element={<Navigate to="/" replace />} />
        </Route>
      </Routes>
    </HashRouter>
  );
}
