import { NavLink, Outlet } from 'react-router-dom';
import { TOWN } from '../lib/config';
import { useT, type Key } from '../lib/i18n';
import { Icon, type IconName } from './Icon';

const TABS: { to: string; label: Key; icon: IconName; end: boolean }[] = [
  { to: '/', label: 'nav.trips', icon: 'map', end: true },
  { to: '/nuevo', label: 'nav.publish', icon: 'plus', end: false },
  { to: '/mis-viajes', label: 'nav.mine', icon: 'list', end: false },
  { to: '/perfil', label: 'nav.profile', icon: 'user', end: false },
];

export default function Layout() {
  const { t } = useT();
  return (
    <div className="app">
      <header className="topbar">
        <span className="brand">
          <img src="./icon.svg" alt="" width={28} height={28} />
          Cotransport <strong>{TOWN}</strong>
        </span>
      </header>
      <main className="content">
        <Outlet />
      </main>
      <nav className="tabbar" aria-label={t('nav.aria')}>
        {TABS.map((tab) => (
          <NavLink
            key={tab.to}
            to={tab.to}
            end={tab.end}
            className={({ isActive }) => (isActive ? 'tab active' : 'tab')}
          >
            <span className="tab-icon">
              <Icon name={tab.icon} />
            </span>
            {t(tab.label)}
          </NavLink>
        ))}
      </nav>
    </div>
  );
}
