import React, { Component, ErrorInfo, ReactNode } from 'react';

interface Props {
  children: ReactNode;
}

interface State {
  hasError: boolean;
  error: Error | null;
}

export class ErrorBoundary extends Component<Props, State> {
  public state: State = {
    hasError: false,
    error: null,
  };

  public static getDerivedStateFromError(error: Error): State {
    return { hasError: true, error };
  }

  public componentDidCatch(error: Error, errorInfo: ErrorInfo) {
    console.error('[SIGNOVANTA] Uncaught UI error:', error, errorInfo);
  }

  private handleReset = () => {
    try {
      localStorage.removeItem('signovanta_applications_cache');
      localStorage.removeItem('signovanta_staff_cache');
      localStorage.removeItem('signovanta_student_requests_cache');
    } catch {}
    window.location.reload();
  };

  public render() {
    if (this.state.hasError) {
      return (
        <div className="min-h-screen bg-slate-900 flex items-center justify-center p-4 text-white">
          <div className="max-w-md w-full bg-slate-800 border border-slate-700 rounded-3xl p-6 sm:p-8 text-center space-y-4 shadow-2xl">
            <div className="w-16 h-16 rounded-2xl bg-rose-500/10 border border-rose-500/20 text-rose-400 flex items-center justify-center mx-auto text-2xl font-bold">
              ⚠️
            </div>
            <h2 className="text-xl font-black text-white">Application Notice</h2>
            <p className="text-xs text-slate-300">
              The application encountered a transient issue. You can reload or reset the local cache.
            </p>
            {this.state.error && (
              <pre className="text-[11px] font-mono text-rose-300 bg-slate-950/70 p-3 rounded-xl overflow-x-auto text-left max-h-36">
                {this.state.error.message}
              </pre>
            )}
            <div className="flex flex-col gap-2 pt-2">
              <button
                onClick={() => window.location.reload()}
                className="w-full py-2.5 px-4 rounded-xl bg-blue-600 hover:bg-blue-500 font-bold text-xs text-white transition-all cursor-pointer shadow-md"
              >
                Reload Application
              </button>
              <button
                onClick={this.handleReset}
                className="w-full py-2.5 px-4 rounded-xl bg-slate-700 hover:bg-slate-600 font-bold text-xs text-slate-200 transition-all cursor-pointer"
              >
                Clear Cache & Reload
              </button>
            </div>
          </div>
        </div>
      );
    }

    return this.props.children;
  }
}
