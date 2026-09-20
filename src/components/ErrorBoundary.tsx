import React, { Component, ErrorInfo, ReactNode } from "react";
import { AlertTriangle, RefreshCw } from "lucide-react";

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
    console.error("Uncaught React ErrorBoundary exception:", error, errorInfo);
  }

  private handleReset = () => {
    this.setState({ hasError: false, error: null });
    window.location.reload();
  };

  public render() {
    if (this.state.hasError) {
      return (
        <div className="flex flex-col items-center justify-center min-h-[400px] h-full p-8 bg-slate-950 text-slate-100 font-sans">
          <div className="max-w-md w-full p-6 bg-slate-900/90 border border-rose-500/30 rounded-2xl shadow-2xl backdrop-blur-md text-center flex flex-col items-center">
            <div className="w-12 h-12 rounded-full bg-rose-500/20 border border-rose-500/40 flex items-center justify-center mb-4 text-rose-400">
              <AlertTriangle className="w-6 h-6 animate-pulse" />
            </div>
            <h2 className="text-xl font-bold text-slate-100 tracking-tight mb-2">
              Dashboard View Recovered
            </h2>
            <p className="text-xs text-slate-400 leading-relaxed mb-4">
              An unexpected render exception was caught safely by the system boundary.
            </p>
            {this.state.error && (
              <div className="w-full text-left p-3 mb-5 bg-slate-950/80 border border-slate-800 rounded-lg font-mono text-[11px] text-rose-300 overflow-x-auto max-h-24">
                {this.state.error.message || "Unknown rendering exception"}
              </div>
            )}
            <button
              onClick={this.handleReset}
              className="inline-flex items-center gap-2 px-5 py-2.5 bg-gradient-to-r from-cyan-600 to-blue-600 hover:from-cyan-500 hover:to-blue-500 text-white font-medium text-xs rounded-xl shadow-lg transition duration-200"
            >
              <RefreshCw className="w-3.5 h-3.5" /> Reload Command Center
            </button>
          </div>
        </div>
      );
    }

    return this.props.children;
  }
}
