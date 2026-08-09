import { useEffect } from 'react';
import { Navigate, Route, Routes, useLocation, useNavigate } from 'react-router-dom';
import { useStore } from './state/store';
import { Home } from './screens/Home';
import { CheckIn } from './screens/CheckIn';
import { Lever } from './screens/Lever';
import { WeekDetail } from './screens/WeekDetail';
import { Weights } from './screens/Weights';
import { Onboarding } from './screens/Onboarding';
import { LowCapacity } from './screens/LowCapacity';
import { SettingsScreen } from './screens/Settings';
import { PrintSummary } from './screens/PrintSummary';
import { Styleguide } from './screens/Styleguide';
import { SETTINGS_SCREEN } from './copy';
import { Button } from './components/controls';

export function App() {
  const { ready, settings } = useStore();
  const location = useLocation();
  const nav = useNavigate();

  // First run goes to calibration; everything else is reachable directly.
  useEffect(() => {
    if (!ready) return;
    const open = ['/onboarding', '/styleguide'];
    if (!settings.onboarded && !open.includes(location.pathname)) {
      nav('/onboarding', { replace: true });
    }
  }, [ready, settings.onboarded, location.pathname, nav]);

  if (!ready) return null;

  return (
    <>
      <Routes>
        <Route path="/" element={<Home />} />
        <Route path="/checkin/:weekId" element={<CheckIn />} />
        <Route path="/lever" element={<Lever />} />
        <Route path="/low" element={<LowCapacity />} />
        <Route path="/week/:weekId" element={<WeekDetail />} />
        <Route path="/weights" element={<Weights />} />
        <Route path="/onboarding" element={<Onboarding />} />
        <Route path="/settings" element={<SettingsScreen />} />
        <Route path="/summary" element={<PrintSummary />} />
        <Route path="/styleguide" element={<Styleguide />} />
        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
      {location.pathname === '/' && settings.onboarded && (
        <footer className="app-footer">
          <Button rank="quiet" onClick={() => nav('/settings')}>{SETTINGS_SCREEN.title}</Button>
        </footer>
      )}
    </>
  );
}
