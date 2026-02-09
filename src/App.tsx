
import { Routes, Route, Navigate, useLocation } from 'react-router-dom';
import Login from './components/Login';
import Register from './components/Register';
import SuperAdminDashboard from './components/SuperAdminDashboard';
import Onboarding from './components/Onboarding';
import Home from './components/Home';
import TrainingManager from './components/TrainingManager';
import PlayerManager from './components/PlayerManager';
import MatchManager from './components/MatchManager';
import Settings from './components/Settings';
import { useAuth } from './context/AuthContext';
// React is actually used for JSX under the hood depending on config, but if unused explicitly, I can remove.
// However, JSX namespace issue might require it. I'll use React.ReactNode for children.

const PrivateRoute = ({ children, requireAdmin = false, allowNoTeam = false }: { children: React.ReactNode; requireAdmin?: boolean; allowNoTeam?: boolean }) => {
  const { user, userProfile, loading } = useAuth();
  const location = useLocation();

  if (loading) return <div style={{ color: 'white', padding: 20 }}>Loading...</div>;

  if (!user) {
    return <Navigate to="/login" state={{ from: location }} replace />;
  }

  if (requireAdmin && userProfile?.role !== 'super_admin') {
    return <Navigate to="/" replace />;
  }

  // If user is a manager but hasn't set up a team, force onboarding
  if (userProfile?.role === 'manager' && !userProfile.teamId && !allowNoTeam) {
    // Prevent loop if we are already going to onboarding
    if (location.pathname !== '/onboarding') {
      return <Navigate to="/onboarding" replace />;
    }
  }

  return <>{children}</>;
};

function App() {
  return (
    <main style={{ minHeight: '100vh', display: 'flex', flexDirection: 'column', background: 'var(--background)' }}>
      <Routes>
        <Route path="/login" element={<Login />} />
        <Route path="/register" element={<Register />} />

        {/* Protected Routes */}
        <Route path="/" element={
          <PrivateRoute>
            <Home />
          </PrivateRoute>
        } />

        <Route path="/onboarding" element={
          <PrivateRoute allowNoTeam={true}>
            <Onboarding />
          </PrivateRoute>
        } />

        <Route path="/settings" element={
          <PrivateRoute>
            <Settings />
          </PrivateRoute>
        } />

        <Route path="/admin" element={
          <PrivateRoute requireAdmin={true} allowNoTeam={true}>
            <SuperAdminDashboard />
          </PrivateRoute>
        } />

        <Route path="/training" element={
          <PrivateRoute>
            <TrainingManager />
          </PrivateRoute>
        } />

        <Route path="/team" element={
          <PrivateRoute>
            <PlayerManager />
          </PrivateRoute>
        } />

        <Route path="/match" element={
          <PrivateRoute>
            <MatchManager />
          </PrivateRoute>
        } />

        <Route path="*" element={<Navigate to="/" />} />
      </Routes>
    </main>
  );
}

export default App;
