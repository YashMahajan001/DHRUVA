import React from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate, useLocation } from 'react-router-dom';
import { AuthProvider, useAuth } from './context/AuthContext';
import { EngineProvider, useEngine } from './context/EngineContext';
import { Sidebar } from './components/common/Sidebar';
import { Header } from './components/common/Header';
import { ErrorBoundary } from './components/common/ErrorBoundary';

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
  const isAuthPage = location.pathname === '/' || location.pathname === '/login' || location.pathname === '/entry';

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
            <ErrorBoundary fallbackTitle="MISSION CONSOLE ERROR">
              <Routes>
                {/* 1. Entry & Authentication */}
                <Route path="/" element={<Entry />} />
                <Route path="/entry" element={<Entry />} />
                <Route path="/login" element={<Login />} />

                {/* 2. Tactical Dashboards & Overviews */}
                <Route path="/overview" element={<ExecutiveOverview />} />
                <Route path="/dashboard" element={<Dashboard />} />

                {/* 3. Engine Subsystem & Telemetry Viewports */}
                <Route path="/engine/:id" element={<EngineDetails />} />
                <Route path="/engine" element={<Navigate to="/engine/eng-01" replace />} />
                <Route path="/engine-details" element={<Navigate to="/engine/eng-01" replace />} />

                {/* 4. Fault Diagnostics & Root Cause Analysis */}
                <Route path="/faults" element={<FaultDiagnostics />} />
                <Route path="/fault-diagnostics" element={<FaultDiagnostics />} />

                {/* 5. Mission Simulation Sandbox */}
                <Route path="/mission-simulation" element={<MissionSimulation />} />
                <Route path="/simulation" element={<MissionSimulation />} />
                <Route path="/simulation/sandbox" element={<MissionSimulation />} />

                {/* 6. Digital Twin Mission Tuning & Calibration */}
                <Route path="/mission-tuning" element={<MissionTuning />} />
                <Route path="/tuning" element={<MissionTuning />} />
                <Route path="/tuning/calibration" element={<MissionTuning />} />

                {/* 7. Fleet Airspace Monitoring & Radar */}
                <Route path="/fleet" element={<FleetMonitoring />} />
                <Route path="/fleet-monitoring" element={<FleetMonitoring />} />
                <Route path="/monitoring/fleet" element={<FleetMonitoring />} />

                {/* 8. Predictive Maintenance & MRO Scheduler */}
                <Route path="/maintenance" element={<Maintenance />} />
                <Route path="/maintenance/scheduler" element={<Maintenance />} />

                {/* Fallback Catch-all */}
                <Route path="*" element={<Navigate to="/dashboard" replace />} />
              </Routes>
            </ErrorBoundary>
          </AppLayout>
        </EngineProvider>
      </AuthProvider>
    </Router>
  );
}
