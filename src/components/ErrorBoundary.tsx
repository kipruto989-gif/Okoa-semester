import React, { Component, ErrorInfo, ReactNode } from "react";
import { AlertTriangle, RefreshCw } from "lucide-react";

interface Props {
  children?: ReactNode;
}

interface State {
  hasError: boolean;
  error: Error | null;
}

class ErrorBoundary extends Component<Props, State> {
  public state: State = {
    hasError: false,
    error: null,
  };

  public static getDerivedStateFromError(error: Error): State {
    return { hasError: true, error };
  }

  public componentDidCatch(error: Error, errorInfo: ErrorInfo) {
    console.error("Uncaught error:", error, errorInfo);
  }

  public render() {
    if (this.state.hasError) {
      return (
        <div className="min-h-[400px] flex flex-col items-center justify-center p-8 text-center bg-white rounded-3xl border border-slate-200 shadow-sm">
          <div className="bg-red-50 p-4 rounded-2xl mb-6">
            <AlertTriangle className="w-12 h-12 text-red-600" />
          </div>
          <h2 className="text-2xl font-bold text-slate-900 mb-2">Something went wrong</h2>
          <p className="text-slate-500 max-w-md mb-8">
            An unexpected error occurred while loading this section. This might be due to a temporary connection issue with the database.
          </p>
          <button
            onClick={() => window.location.reload()}
            className="flex items-center gap-2 bg-indigo-600 text-white px-6 py-3 rounded-xl font-bold hover:bg-indigo-700 transition-all shadow-lg shadow-indigo-100"
          >
            <RefreshCw className="w-5 h-5" />
            Reload Page
          </button>
          {process.env.NODE_ENV === "development" && (
            <pre className="mt-8 p-4 bg-slate-50 rounded-lg text-left text-xs text-red-500 overflow-auto max-w-full">
              {this.state.error?.toString()}
            </pre>
          )}
        </div>
      );
    }

    return this.props.children;
  }
}

export default ErrorBoundary;
