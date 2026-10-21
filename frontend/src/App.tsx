import React from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate, useLocation } from 'react-router-dom';
import { AuthProvider, useAuth } from './context/AuthContext';
import { EngineProvider, useEngine } from './context/EngineContext';
import { ErrorBoundary } from './components/common/ErrorBoundary';

import { AutoProvider } from './context/AutoContext';

// System 1: Drone System Components
import { DroneHeader } from './components/drone/DroneHeader';
import { DroneSidebar } from './components/drone/DroneSidebar';

// System 2: Automotive System Components
import { AutoHeader } from './components/auto/AutoHeader';
import { AutoSidebar } from './components/auto/AutoSidebar';

// System 3: Aeroplane System Components (Dhruva Aero)
import { AeroProvider } from './context/AeroContext';
import { AeroHeader } from './components/aeroplane/AeroHeader';
import { AeroSidebar } from './components/aeroplane/AeroSidebar';

// Pages
import { EngineSelection } from './pages/EngineSelection';
import { ExecutiveOverview } from './pages/ExecutiveOverview';
import { Dashboard } from './pages/Dashboard';
import { EngineDetails } from './pages/EngineDetails';
import { FaultDiagnostics } from './pages/FaultDiagnostics';
import { MissionSimulation } from './pages/MissionSimulation';
import { MissionTuning } from './pages/MissionTuning';
import { FleetMonitoring } from './pages/FleetMonitoring';
import { Maintenance } from './pages/Maintenance';
import { AutomobileDashboard } from './pages/AutomobileDashboard';
import { AeroDashboardView } from './pages/AeroDashboardView';
import { AeroAnalysisView } from './pages/AeroAnalysisView';
import { AeroSimulationLabView } from './pages/AeroSimulationLabView';
import { AeroTestHistoryView } from './pages/AeroTestHistoryView';

import { SidebarProvider, useSidebar } from './context/SidebarContext';

const AppLayout: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const location = useLocation();
  const { alerts, isStreamActive, toggleStream } = useEngine();
  const { isExpanded } = useSidebar();

  const mainPadding = isExpanded ? 'md:pl-[280px]' : 'md:pl-[88px]';

  // Landing page has no sidebar/header for immersive selection
  const isLandingPage =
    location.pathname === '/' ||
    location.pathname === '/select-engine' ||
    location.pathname === '/engines' ||
    location.pathname === '/entry' ||
    location.pathname === '/login';

  if (isLandingPage) {
    return <>{children}</>;
  }

  // System 2: Automotive Powertrain Twin
  const isAuto =
    location.pathname.startsWith('/automobile') ||
    location.pathname.startsWith('/auto');

  if (isAuto) {
    return (
      <AutoProvider>
        <div className="relative min-h-screen bg-[#090e1b] text-[#dee2f5] flex">
          <AutoSidebar />
          <AutoHeader />
          <main className={`relative pt-[76px] pl-0 ${mainPadding} pr-3 pb-8 w-full min-h-screen transition-all duration-300 ease-in-out motion-reduce:transition-none bg-[#090e1b]`}>
            {children}
          </main>
        </div>
      </AutoProvider>
    );
  }

  // System 3: Aeroplane Commercial & Defense Aviation Twin (Dhruva Aero)
  const isAero =
    location.pathname.startsWith('/aeroplane') ||
    location.pathname.startsWith('/aero') ||
    location.pathname.startsWith('/airplane') ||
    location.pathname.startsWith('/aviation');

  if (isAero) {
    return (
      <AeroProvider>
        <div className="relative min-h-screen bg-[#080d1a] text-[#dee2f5] flex">
          <AeroSidebar />
          <AeroHeader />
          <main className={`relative pt-[76px] pl-0 ${mainPadding} pr-3 pb-8 w-full min-h-screen transition-all duration-300 ease-in-out motion-reduce:transition-none bg-[#080d1a]`}>
            {children}
          </main>
        </div>
      </AeroProvider>
    );
  }

  // System 1 (Default): Drone UAV Tactical Propulsion Twin
  return (
    <div className="relative min-h-screen bg-[#0e1320] text-[#dee2f5] flex">
      <DroneSidebar isStreamActive={isStreamActive} onToggleStream={toggleStream} />
      <DroneHeader unreadAlertsCount={alerts.length} />
      <main className={`relative pt-[76px] pl-0 ${mainPadding} pr-3 pb-8 w-full min-h-screen transition-all duration-300 ease-in-out motion-reduce:transition-none bg-[#0e1320] aerospace-grid`}>
        {children}
      </main>
    </div>
  );
};

const ProtectedRoute: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const { isAuthenticated } = useAuth();
  if (!isAuthenticated) {
    return <Navigate to="/" replace />;
  }
  return <>{children}</>;
};

export default function App() {
  return (
    <Router>
      <AuthProvider>
        <EngineProvider>
          <SidebarProvider>
            <AppLayout>
              <ErrorBoundary fallbackTitle="MISSION CONSOLE ERROR">
                <Routes>
                {/* 1. Propulsion Engine Platform Selection */}
                <Route path="/" element={<EngineSelection />} />
                <Route path="/select-engine" element={<EngineSelection />} />
                <Route path="/engines" element={<EngineSelection />} />
                <Route path="/entry" element={<Navigate to="/" replace />} />
                <Route path="/login" element={<Navigate to="/" replace />} />

                {/* 2. System 1: Drone UAV System Routes */}
                <Route path="/drone" element={<Navigate to="/drone/dashboard" replace />} />
                <Route path="/drone/dashboard" element={<Dashboard />} />
                <Route path="/drone/overview" element={<ExecutiveOverview />} />
                <Route path="/drone/engine/:id" element={<EngineDetails />} />
                <Route path="/drone/faults" element={<FaultDiagnostics />} />
                <Route path="/drone/simulation" element={<MissionSimulation />} />
                <Route path="/drone/tuning" element={<MissionTuning />} />
                <Route path="/drone/fleet" element={<FleetMonitoring />} />
                <Route path="/drone/maintenance" element={<Maintenance />} />

                {/* Backwards compatibility for legacy root drone routes */}
                <Route path="/overview" element={<ExecutiveOverview />} />
                <Route path="/dashboard" element={<Dashboard />} />
                <Route path="/engine/:id" element={<EngineDetails />} />
                <Route path="/engine" element={<Navigate to="/engine/eng-01" replace />} />
                <Route path="/engine-details" element={<Navigate to="/engine/eng-01" replace />} />
                <Route path="/faults" element={<FaultDiagnostics />} />
                <Route path="/fault-diagnostics" element={<FaultDiagnostics />} />
                <Route path="/mission-simulation" element={<MissionSimulation />} />
                <Route path="/simulation" element={<MissionSimulation />} />
                <Route path="/simulation/sandbox" element={<MissionSimulation />} />
                <Route path="/mission-tuning" element={<MissionTuning />} />
                <Route path="/tuning" element={<MissionTuning />} />
                <Route path="/tuning/calibration" element={<MissionTuning />} />
                <Route path="/fleet" element={<FleetMonitoring />} />
                <Route path="/fleet-monitoring" element={<FleetMonitoring />} />
                <Route path="/monitoring/fleet" element={<FleetMonitoring />} />
                <Route path="/maintenance" element={<Maintenance />} />
                <Route path="/maintenance/scheduler" element={<Maintenance />} />

                {/* 3. System 2: Automobile Powertrain Digital Twin & Intelligence */}
                <Route path="/automobile" element={<AutomobileDashboard />} />
                <Route path="/automobile/:view" element={<AutomobileDashboard />} />
                <Route path="/auto" element={<Navigate to="/auto/dashboard" replace />} />
                <Route path="/auto/dashboard" element={<AutomobileDashboard />} />
                <Route path="/auto/analysis" element={<AutomobileDashboard />} />
                <Route path="/auto/tuning" element={<AutomobileDashboard />} />
                <Route path="/auto/tests" element={<AutomobileDashboard />} />
                <Route path="/auto/tests/:testId" element={<AutomobileDashboard />} />
                <Route path="/auto-dashboard" element={<Navigate to="/auto/dashboard" replace />} />
                <Route path="/auto/*" element={<AutomobileDashboard />} />

                {/* 4. System 3: Dhruva Aero Aircraft Engine Digital Twin */}
                <Route path="/aero" element={<Navigate to="/aero/dashboard" replace />} />
                <Route path="/aero/dashboard" element={<AeroDashboardView />} />
                <Route path="/aero/analysis" element={<AeroAnalysisView />} />
                <Route path="/aero/simulation" element={<AeroSimulationLabView />} />
                <Route path="/aero/tests" element={<AeroTestHistoryView />} />
                <Route path="/aero/tests/:testId" element={<AeroTestHistoryView />} />

                {/* Backwards-compatible aliases for aero */}
                <Route path="/aeroplane" element={<Navigate to="/aero/dashboard" replace />} />
                <Route path="/aeroplane/dashboard" element={<AeroDashboardView />} />
                <Route path="/aeroplane/analysis" element={<AeroAnalysisView />} />
                <Route path="/aeroplane/diagnostics" element={<AeroAnalysisView />} />
                <Route path="/aeroplane/simulation" element={<AeroSimulationLabView />} />
                <Route path="/aeroplane/tests" element={<AeroTestHistoryView />} />
                <Route path="/aeroplane/tests/:testId" element={<AeroTestHistoryView />} />
                <Route path="/aeroplane/*" element={<Navigate to="/aero/dashboard" replace />} />
                <Route path="/airplane" element={<Navigate to="/aero/dashboard" replace />} />
                <Route path="/airplane/*" element={<Navigate to="/aero/dashboard" replace />} />
                <Route path="/aviation" element={<Navigate to="/aero/dashboard" replace />} />
                <Route path="/aviation/*" element={<Navigate to="/aero/dashboard" replace />} />

                {/* Fallback Catch-all */}
                <Route path="*" element={<Navigate to="/select-engine" replace />} />
              </Routes>
            </ErrorBoundary>
          </AppLayout>
        </SidebarProvider>
      </EngineProvider>
    </AuthProvider>
    </Router>
  );
}
