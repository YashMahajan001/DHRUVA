import React, { Component, ErrorInfo, ReactNode } from 'react';
import { AlertTriangle, RefreshCw, Home } from 'lucide-react';

interface Props {
  children: ReactNode;
  fallbackTitle?: string;
}

interface State {
  hasError: boolean;
  error: Error | null;
  errorInfo: ErrorInfo | null;
}

export class ErrorBoundary extends Component<Props, State> {
  public state: State = {
    hasError: false,
    error: null,
    errorInfo: null,
  };

  public static getDerivedStateFromError(error: Error): State {
    return { hasError: true, error, errorInfo: null };
  }

  public componentDidCatch(error: Error, errorInfo: ErrorInfo) {
    console.error('DHRUVA Tactical ErrorBoundary caught an exception:', error, errorInfo);
    this.setState({ errorInfo });
  }

  private handleReset = () => {
    this.setState({ hasError: false, error: null, errorInfo: null });
    window.location.reload();
  };

  private handleNavigateHome = () => {
    this.setState({ hasError: false, error: null, errorInfo: null });
    window.location.href = '/dashboard';
  };

  public render() {
    if (this.state.hasError) {
      return (
        <div className="min-h-[400px] flex items-center justify-center p-6 bg-navy-950/80 border border-red-500/30 rounded-xl m-4 backdrop-blur-md">
          <div className="max-w-md w-full text-center space-y-4">
            <div className="w-16 h-16 mx-auto rounded-full bg-red-500/10 border border-red-500/30 flex items-center justify-center text-red-400 animate-pulse">
              <AlertTriangle className="w-8 h-8" />
            </div>
            
            <div className="space-y-2">
              <h2 className="text-xl font-mono font-bold text-slate-100 tracking-wider">
                {this.props.fallbackTitle || 'SUBSYSTEM TELEMETRY EXCEPTION'}
              </h2>
              <p className="text-xs font-mono text-slate-400">
                A localized telemetry or rendering error occurred. Isolation protocols engaged.
              </p>
            </div>

            {this.state.error && (
              <div className="p-3 bg-black/40 border border-slate-800 rounded text-left font-mono text-xs text-red-300 max-h-32 overflow-y-auto">
                <span className="text-slate-500 select-none">[ERR_LOG]: </span>
                {this.state.error.message}
              </div>
            )}

            <div className="flex items-center justify-center gap-3 pt-2">
              <button
                onClick={this.handleReset}
                className="flex items-center gap-2 px-4 py-2 bg-slate-800 hover:bg-slate-700 text-slate-200 border border-slate-700 rounded-lg text-xs font-mono transition-colors"
              >
                <RefreshCw className="w-4 h-4" />
                RE-INITIALIZE
              </button>
              <button
                onClick={this.handleNavigateHome}
                className="flex items-center gap-2 px-4 py-2 bg-blue-600 hover:bg-blue-500 text-white font-mono text-xs rounded-lg shadow-lg shadow-blue-500/20 transition-all"
              >
                <Home className="w-4 h-4" />
                TACTICAL DASHBOARD
              </button>
            </div>
          </div>
        </div>
      );
    }

    return this.props.children;
  }
}
