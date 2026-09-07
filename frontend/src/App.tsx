import React from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate, useLocation } from 'react-router-dom';
import { AuthProvider, useAuth } from './context/AuthContext';
import { EngineProvider, useEngine } from './context/EngineContext';
import { Sidebar } from './components/common/Sidebar';
import { Header } from './components/common/Header';

// Pages
import { Login } from './pages/Login';
import { Entry } from './pages/Entry';
import { ExecutiveOverview } from './pages/ExecutiveOverview';
import { Dashboard } from './pages/Dashboard';
import { EngineDetails } from './pages/EngineDetails';
import { FaultDiagnostics } from './pages/FaultDiagnostics';
import { MissionSimulation } from './pages/MissionSimulation';
import { MissionTuning } from './pages/MissionTuning';
import { FleetMonitoring } from './pages/FleetMonitoring';
import { Maintenance } from './pages/Maintenance';

const AppLayout: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const location = useLocation();
  const { alerts, isStreamActive, toggleStream } = useEngine();
  const isAuthPage = location.pathname === '/login' || location.pathname === '/entry';

  if (isAuthPage) {
    return <>{children}</>;
  }

  return (
    <div className="relative min-h-screen bg-[#0e1320] text-[#dee2f5] flex">
      {/* 1. Left Tactical Sidebar Navigation */}
      <Sidebar
        isStreamActive={isStreamActive}
        onToggleStream={toggleStream}
      />

      {/* 2. Top Command Header Bar */}
      <Header
        unreadAlertsCount={alerts.length}
      />

      {/* 3. Main Operational Viewport Container */}
      <main className="relative pt-16 pl-20 w-full min-h-screen bg-[#0e1320] aerospace-grid">
        {children}
      </main>
    </div>
  );
};
const ProtectedRoute: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const { isAuthenticated } = useAuth();
  if (!isAuthenticated) {
    return <Navigate to="/entry" replace />;
  }
  return <>{children}</>;
};

export default function App() {
  return (
    <Router>
      <AuthProvider>
        <EngineProvider>
          <AppLayout>
            <Routes>
              <Route path="/login" element={<Login />} />
              <Route path="/entry" element={<Entry />} />
              <Route path="/" element={<Navigate to="/entry" replace />} />
              <Route path="/overview" element={<ProtectedRoute><ExecutiveOverview /></ProtectedRoute>} />
              <Route path="/dashboard" element={<ProtectedRoute><Dashboard /></ProtectedRoute>} />
              <Route path="/engine/:id" element={<ProtectedRoute><EngineDetails /></ProtectedRoute>} />
              <Route path="/engine" element={<Navigate to="/engine/eng-01" replace />} />
              <Route path="/faults" element={<ProtectedRoute><FaultDiagnostics /></ProtectedRoute>} />
              <Route path="/mission-simulation" element={<ProtectedRoute><MissionSimulation /></ProtectedRoute>} />
              <Route path="/mission-tuning" element={<ProtectedRoute><MissionTuning /></ProtectedRoute>} />
              <Route path="/fleet" element={<ProtectedRoute><FleetMonitoring /></ProtectedRoute>} />
              <Route path="/maintenance" element={<ProtectedRoute><Maintenance /></ProtectedRoute>} />
              <Route path="*" element={<Navigate to="/entry" replace />} />
            </Routes>
          </AppLayout>
        </EngineProvider>
      </AuthProvider>
    </Router>
  );
}
