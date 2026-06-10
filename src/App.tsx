import { Routes, Route, Navigate } from 'react-router-dom';
import { ProtectedRoute } from './components/ProtectedRoute';
import { Login } from './pages/Login';
import { ForgotPassword } from './pages/ForgotPassword';
import { ResetPassword } from './pages/ResetPassword';
import { Dashboard } from './pages/Dashboard';
import { Domains } from './pages/Domains';
import { DomainDetail } from './pages/DomainDetail';
import { DomainExpiry } from './pages/DomainExpiry';
import { Apis } from './pages/Apis';
import { Registrars } from './pages/Registrars';
import { Alerts } from './pages/Alerts';
import { Logs } from './pages/Logs';
import { Ssl } from './pages/Ssl';
import { Network } from './pages/Network';
import { Reports } from './pages/Reports';
import { Settings } from './pages/Settings';
import { Users } from './pages/Users';
import { Audit } from './pages/Audit';

const protect = (el: JSX.Element) => <ProtectedRoute>{el}</ProtectedRoute>;

export function App() {
  return (
    <Routes>
      <Route path="/login" element={<Login />} />
      <Route path="/forgot-password" element={<ForgotPassword />} />
      <Route path="/reset-password" element={<ResetPassword />} />

      <Route path="/" element={protect(<Dashboard />)} />
      <Route path="/domains" element={protect(<Domains />)} />
      <Route path="/domains/:id" element={protect(<DomainDetail />)} />
      <Route path="/domain-expiry" element={protect(<DomainExpiry />)} />
      <Route path="/apis" element={protect(<Apis />)} />
      <Route path="/registrars" element={protect(<Registrars />)} />
      <Route path="/alerts" element={protect(<Alerts />)} />
      <Route path="/logs" element={protect(<Logs />)} />
      <Route path="/ssl" element={protect(<Ssl />)} />
      <Route path="/network" element={protect(<Network />)} />
      <Route path="/reports" element={protect(<Reports />)} />
      <Route path="/settings" element={protect(<Settings />)} />
      <Route path="/users" element={protect(<Users />)} />
      <Route path="/audit" element={protect(<Audit />)} />

      <Route path="*" element={<Navigate to="/" replace />} />
    </Routes>
  );
}
