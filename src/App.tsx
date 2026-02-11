
import { Routes, Route, Navigate, useLocation, useNavigate } from 'react-router-dom';
import React, { useState, useEffect, Suspense, lazy } from 'react';
import { useAuth } from './context/AuthContext';
import Splash from './components/Splash';
import { App as CapacitorApp } from '@capacitor/app';
import { ToastProvider } from './context/ToastContext';
import { ConfirmationProvider } from './context/ConfirmationContext';
import { LoadingScreen } from './components/common/LoadingScreen';

// Lazy Components
const Login = lazy(() => import('./components/Login'));
const Register = lazy(() => import('./components/Register'));
const SuperAdminDashboard = lazy(() => import('./components/SuperAdminDashboard'));
const Onboarding = lazy(() => import('./components/Onboarding'));
const Home = lazy(() => import('./components/Home'));
const TrainingManager = lazy(() => import('./components/TrainingManager'));
const PlayerManager = lazy(() => import('./components/PlayerManager'));
const MatchManager = lazy(() => import('./components/MatchManager'));
const Settings = lazy(() => import('./components/Settings'));


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
  // Check session storage to see if splash has already been shown in this session
  const [showSplash, setShowSplash] = useState(() => !sessionStorage.getItem('splashShown'));
  const location = useLocation();
  const navigate = useNavigate();

  useEffect(() => {
    CapacitorApp.addListener('backButton', () => {
      // If we are on the home screen or login screen, exit the app
      if (location.pathname === '/' || location.pathname === '/login') {
        CapacitorApp.exitApp();
      } else {
        // Otherwise, go back in history
        navigate(-1);
      }
    });

    return () => {
      CapacitorApp.removeAllListeners();
    };
  }, [location, navigate]);

  if (showSplash) {
    return <Splash onFinish={() => {
      sessionStorage.setItem('splashShown', 'true');
      setShowSplash(false);
    }} />;
  }

  return (
    <ToastProvider>
      <ConfirmationProvider>
        <main style={{ minHeight: '100vh', display: 'flex', flexDirection: 'column', background: 'var(--background)' }}>
          <Suspense fallback={<LoadingScreen />}>
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
          </Suspense>
        </main>
      </ConfirmationProvider>
    </ToastProvider >
  );
}

export default App;
