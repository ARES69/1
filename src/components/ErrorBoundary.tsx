import { Component, ErrorInfo, ReactNode } from 'react';

interface Props {
  children: ReactNode;
  fallback?: ReactNode;
}

interface State {
  hasError: boolean;
  error: Error | null;
}

export default class ErrorBoundary extends Component<Props, State> {
  constructor(props: Props) {
    super(props);
    this.state = { hasError: false, error: null };
  }

  static getDerivedStateFromError(error: Error): State {
    return { hasError: true, error };
  }

  componentDidCatch(error: Error, errorInfo: ErrorInfo) {
    console.error('ErrorBoundary caught an error:', error, errorInfo);
  }

  render() {
    if (this.state.hasError) {
      if (this.props.fallback) {
        return this.props.fallback;
      }

      return (
        <div className="min-h-screen flex items-center justify-center p-8" style={{ backgroundColor: 'var(--bg)' }}>
          <div className="max-w-md w-full p-6 rounded-2xl border" style={{ borderColor: 'var(--border)', backgroundColor: 'var(--card)' }}>
            <div className="text-center mb-6">
              <div className="w-16 h-16 mx-auto mb-4 rounded-full bg-red-500/10 flex items-center justify-center">
                <span className="text-3xl">⚠️</span>
              </div>
              <h2 className="text-xl font-bold mb-2" style={{ color: 'var(--text)' }}>
                Something went wrong
              </h2>
              <p className="text-sm" style={{ color: 'var(--text-secondary)' }}>
                An error occurred while rendering this page
              </p>
            </div>

            {this.state.error && (
              <div className="mb-4 p-3 rounded-lg bg-red-500/10 border border-red-500/20">
                <p className="text-xs font-mono text-red-500 break-all">
                  {this.state.error.message}
                </p>
              </div>
            )}

            <div className="space-y-2">
              <button
                onClick={() => {
                  this.setState({ hasError: false, error: null });
                  window.location.reload();
                }}
                className="w-full py-2.5 rounded-xl bg-brand-600 text-white font-medium hover:bg-brand-700 transition-colors"
              >
                Reload Page
              </button>
              <button
                onClick={() => {
                  this.setState({ hasError: false, error: null });
                  window.location.href = '/';
                }}
                className="w-full py-2.5 rounded-xl border font-medium hover:border-brand-500 transition-colors"
                style={{ borderColor: 'var(--border)', color: 'var(--text-secondary)' }}
              >
                Go Home
              </button>
            </div>
          </div>
        </div>
      );
    }

    return this.props.children;
  }
}
