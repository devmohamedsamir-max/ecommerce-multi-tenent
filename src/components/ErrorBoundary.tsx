import { Component, type ErrorInfo, type ReactNode } from 'react';

interface Props {
  children: ReactNode;
}

interface State {
  hasError: boolean;
  message: string;
}

export class ErrorBoundary extends Component<Props, State> {
  state: State = { hasError: false, message: '' };

  static getDerivedStateFromError(error: Error): State {
    let readable = error.message || 'An unexpected error occurred.';
    try {
      const parsed = JSON.parse(error.message) as {
        error?: string;
        operationType?: string;
        path?: string;
      };
      if (parsed.error) {
        readable = `${parsed.error}${parsed.path ? ` (${parsed.operationType ?? 'op'} on ${parsed.path})` : ''}`;
      }
    } catch {
      // Plain error message
    }
    return { hasError: true, message: readable };
  }

  componentDidCatch(error: Error, info: ErrorInfo) {
    console.error('Application ErrorBoundary caught:', error, info);
  }

  render() {
    if (this.state.hasError) {
      return (
        <div className="min-h-screen bg-[#F7F8F7] text-[#111614] flex items-center justify-center p-6">
          <div className="max-w-md w-full bg-white border border-neutral-200 rounded-xl p-8 space-y-5">
            <h1 className="font-display text-2xl font-semibold tracking-tight">
              Something went wrong
            </h1>
            <p className="text-sm text-neutral-600 leading-relaxed">
              {this.state.message}
            </p>
            <div className="flex items-center gap-3 pt-2">
              <button
                type="button"
                onClick={() => {
                  this.setState({ hasError: false, message: '' });
                  window.location.href = '/';
                }}
                className="px-4 py-2 text-sm font-medium rounded-lg bg-[#1F3A2E] text-white hover:bg-[#172C22] transition-colors cursor-pointer"
              >
                Return to Platform Hub
              </button>
              <button
                type="button"
                onClick={() => window.location.reload()}
                className="px-4 py-2 text-sm font-medium rounded-lg border border-neutral-300 text-neutral-800 hover:bg-neutral-50 transition-colors cursor-pointer"
              >
                Reload
              </button>
            </div>
          </div>
        </div>
      );
    }
    return this.props.children;
  }
}
