import React, { Component, ErrorInfo, ReactNode } from 'react';
import { AlertTriangle, RefreshCw, Home, ChevronRight, Layers } from 'lucide-react';

interface Props {
  children: ReactNode;
  fallbackTitle?: string;
  onReset?: () => void;
}

interface State {
  hasError: boolean;
  error: Error | null;
  errorInfo: ErrorInfo | null;
  showDetails: boolean;
  retryCount: number;
}

export class ErrorBoundary extends Component<Props, State> {
  public state: State = {
    hasError: false,
    error: null,
    errorInfo: null,
    showDetails: false,
    retryCount: 0,
  };

  public static getDerivedStateFromError(error: Error): Partial<State> {
    return { hasError: true, error };
  }

  public componentDidCatch(error: Error, errorInfo: ErrorInfo) {
    console.error('DHRUVA Tactical ErrorBoundary caught an exception:', error, errorInfo);
    this.setState({ errorInfo });
  }

  private handleReset = () => {
    // Purge any potentially corrupted engine/system state in storage to break retry loops
    try {
      localStorage.removeItem('dhruva_selected_auto_engine');
      localStorage.removeItem('dhruva_selected_aero_engine');
      localStorage.removeItem('dhruva_selected_engine_id');
    } catch {
      // Storage access protected or disabled
    }

    if (this.props.onReset) {
      this.props.onReset();
    }

    if (this.state.retryCount === 0) {
      // First attempt: recover within React virtual DOM tree
      this.setState({ hasError: false, error: null, errorInfo: null, retryCount: 1 });
    } else {
      // Hard refresh if in-memory reset failed
      window.location.reload();
    }
  };

  private handleNavigateHome = () => {
    this.setState({ hasError: false, error: null, errorInfo: null, retryCount: 0 });
    window.location.href = '/dashboard';
  };

  private handleSwitchPlatform = () => {
    this.setState({ hasError: false, error: null, errorInfo: null, retryCount: 0 });
    window.location.href = '/';
  };

  public render() {
    if (this.state.hasError) {
      return (
        <div className="min-h-[440px] flex items-center justify-center p-6 bg-[#090e1b]/95 border border-red-500/30 rounded-xl m-4 backdrop-blur-md shadow-2xl">
          <div className="max-w-lg w-full text-center space-y-4">
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
              <div className="p-3 bg-black/50 border border-slate-800 rounded text-left font-mono text-xs text-red-300 max-h-36 overflow-y-auto space-y-1">
                <div className="flex items-center gap-1.5 text-slate-400 font-semibold select-none border-b border-slate-800/60 pb-1">
                  <span>[DIAGNOSTIC EXCEPTION LOG]</span>
                </div>
                <div className="text-red-300 font-bold pt-0.5">
                  {(this.state.error.message || 'Unknown runtime error')
                    .replace(/(token|password|secret|bearer|authorization)=([a-zA-Z0-9_\-\.]+)/gi, '$1=***')
                    .replace(/bearer\s+[a-zA-Z0-9_\-\.]+/gi, 'Bearer ***')}
                </div>
                {this.state.error.stack && (
                  <div className="text-[10px] text-slate-500 font-mono whitespace-pre-wrap truncate max-h-16 overflow-hidden">
                    {this.state.error.stack
                      .split('\n')
                      .slice(0, 3)
                      .join('\n')
                      .replace(/(token|password|secret|bearer|authorization)=([a-zA-Z0-9_\-\.]+)/gi, '$1=***')}
                  </div>
                )}
              </div>
            )}

            {this.state.errorInfo?.componentStack && (
              <div className="text-left">
                <button
                  type="button"
                  onClick={() => this.setState(prev => ({ showDetails: !prev.showDetails }))}
                  className="flex items-center gap-1 text-[11px] font-mono text-slate-400 hover:text-slate-200 transition-colors"
                >
                  <ChevronRight className={`w-3.5 h-3.5 transition-transform ${this.state.showDetails ? 'rotate-90' : ''}`} />
                  <span>{this.state.showDetails ? 'Hide stack diagnostics' : 'Show stack diagnostics'}</span>
                </button>
                {this.state.showDetails && (
                  <div className="mt-1.5 p-2 bg-black/60 border border-slate-800 rounded font-mono text-[10px] text-slate-400 max-h-32 overflow-y-auto whitespace-pre-wrap">
                    {this.state.errorInfo.componentStack}
                  </div>
                )}
              </div>
            )}

            <div className="flex flex-wrap items-center justify-center gap-2.5 pt-2">
              <button
                type="button"
                onClick={this.handleReset}
                className="flex items-center gap-1.5 px-3.5 py-2 bg-slate-800 hover:bg-slate-700 text-slate-200 border border-slate-700 rounded-lg text-xs font-mono transition-colors cursor-pointer"
              >
                <RefreshCw className="w-3.5 h-3.5" />
                RE-INITIALIZE
              </button>
              <button
                type="button"
                onClick={this.handleNavigateHome}
                className="flex items-center gap-1.5 px-3.5 py-2 bg-blue-600 hover:bg-blue-500 text-white font-mono text-xs rounded-lg shadow-lg shadow-blue-500/20 transition-all cursor-pointer"
              >
                <Home className="w-3.5 h-3.5" />
                TACTICAL DASHBOARD
              </button>
              <button
                type="button"
                onClick={this.handleSwitchPlatform}
                className="flex items-center gap-1.5 px-3 py-2 bg-slate-900 hover:bg-slate-800 text-cyan-400 border border-cyan-500/30 rounded-lg font-mono text-xs transition-colors cursor-pointer"
              >
                <Layers className="w-3.5 h-3.5" />
                SWITCH SYSTEM
              </button>
            </div>
          </div>
        </div>
      );
    }

    return this.props.children;
  }
}
