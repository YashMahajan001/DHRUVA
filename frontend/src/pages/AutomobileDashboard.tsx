import React from 'react';
import { useLocation, useParams } from 'react-router-dom';
import { AutoDashboardView } from '../components/auto/AutoDashboardView';
import { AutoAnalysisView } from '../components/auto/AutoAnalysisView';
import { AutoTuningLabView } from '../components/auto/AutoTuningLabView';
import { AutoTestHistoryView } from '../components/auto/AutoTestHistoryView';

export const AutomobileDashboard: React.FC = () => {
  const location = useLocation();
  const { view } = useParams<{ view?: string }>();
  const path = location.pathname.toLowerCase();

  // Route Dispatcher for the 4 Core Dhruva Auto Views
  if (path.includes('/analysis') || path.includes('/diagnostics') || path.includes('/faults') || view === 'analysis') {
    return <AutoAnalysisView />;
  }

  if (path.includes('/tuning') || view === 'tuning') {
    return <AutoTuningLabView />;
  }

  if (path.includes('/tests') || path.includes('/history') || view === 'tests') {
    return <AutoTestHistoryView />;
  }

  // Default: View 1 — Engine Dashboard
  return <AutoDashboardView />;
};
