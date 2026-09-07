import React, { useState } from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate, useNavigate, useLocation } from 'react-router-dom';
import { EngineProvider, useEngine } from './context/EngineContext';
import { Sidebar } from './components/Sidebar';
import { Header } from './components/Header';
import { DashboardPage } from './pages/DashboardPage';
import { ModuleRouteModal } from './components/ModuleRouteModal';

const AppContent: React.FC = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const { alerts, isStreamActive, toggleStream } = useEngine();

  const [activeNavTab, setActiveNavTab] = useState<string>('dashboard');
  const [modalRoute, setModalRoute] = useState<string | null>(null);

  const handleNavigate = (tabId: string) => {
    setActiveNavTab(tabId);
    if (tabId === 'dashboard') {
      navigate('/dashboard');
      setModalRoute(null);
    } else {
      // Future screen requested - open informative module spec modal while preserving dashboard
      setModalRoute(tabId);
    }
  };

  const handleOpenAlerts = () => {
    // Scroll smoothly to active alerts matrix if visible
    const elem = document.getElementById('active-alerts-matrix');
    if (elem) {
      elem.scrollIntoView({ behavior: 'smooth' });
    }
  };

  return (
    <div className="relative min-h-screen bg-[#0e1320] text-[#dee2f5] flex">
      {/* 1. Left Tactical Sidebar Navigation */}
      <Sidebar
        activeTab={activeNavTab}
        onNavigate={handleNavigate}
        isStreamActive={isStreamActive}
        onToggleStream={toggleStream}
      />

      {/* 2. Top Command Header Bar */}
      <Header
        activeTab={activeNavTab}
        onNavigate={handleNavigate}
        unreadAlertsCount={alerts.length}
        onOpenAlerts={handleOpenAlerts}
      />

      {/* 3. Main Operational Viewport Container */}
      <main className="relative pt-16 pl-20 w-full min-h-screen bg-[#0e1320] aerospace-grid">
        <Routes>
          <Route path="/" element={<DashboardPage />} />
          <Route path="/dashboard" element={<DashboardPage />} />
          <Route path="*" element={<Navigate to="/dashboard" replace />} />
        </Routes>
      </main>

      {/* Future Screen Integration Spec Modal */}
      {modalRoute && (
        <ModuleRouteModal
          moduleName={modalRoute}
          onClose={() => {
            setModalRoute(null);
            setActiveNavTab('dashboard');
          }}
        />
      )}
    </div>
  );
};

export default function App() {
  return (
    <Router>
      <EngineProvider>
        <AppContent />
      </EngineProvider>
    </Router>
  );
}
