import React, { Component, ErrorInfo, ReactNode } from 'react';
import { ErrorBoundaryFallback } from './ErrorBoundaryFallback';

type Props = {
  children: ReactNode;
  fallback?: ReactNode;
};

type State = {
  hasError: boolean;
  error: Error | null;
};

export class ErrorBoundary extends Component<Props, State> {
  state: State = { hasError: false, error: null };

  static getDerivedStateFromError(error: Error): State {
    return { hasError: true, error };
  }

  componentDidCatch(error: Error, errorInfo: ErrorInfo) {
    // Log error for debugging (only in dev mode)
    if (__DEV__) {
      console.error('ErrorBoundary caught:', error, errorInfo);
    }
    
    // In production, you might want to send this to an error tracking service
    // Example: Sentry.captureException(error, { extra: errorInfo });
  }

  retry = () => {
    this.setState({ hasError: false, error: null });
  };

  render() {
    if (this.state.hasError && this.state.error) {
      if (this.props.fallback) return this.props.fallback;
      return <ErrorBoundaryFallback onRetry={this.retry} />;
    }
    return this.props.children;
  }
}
