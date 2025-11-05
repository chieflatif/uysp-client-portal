'use client';

import React, { Component, ErrorInfo, ReactNode } from 'react';
import { theme } from '@/theme';

interface Props {
  children: ReactNode;
  fallback?: ReactNode;
  onError?: (error: Error, errorInfo: ErrorInfo) => void;
}

interface State {
  hasError: boolean;
  error: Error | null;
  errorInfo: ErrorInfo | null;
}

/**
 * Error Boundary Component
 *
 * Catches JavaScript errors anywhere in the child component tree,
 * logs those errors, and displays a fallback UI instead of crashing.
 *
 * Usage:
 * <ErrorBoundary>
 *   <YourComponent />
 * </ErrorBoundary>
 *
 * With custom fallback:
 * <ErrorBoundary fallback={<CustomErrorUI />}>
 *   <YourComponent />
 * </ErrorBoundary>
 */
export class ErrorBoundary extends Component<Props, State> {
  constructor(props: Props) {
    super(props);
    this.state = {
      hasError: false,
      error: null,
      errorInfo: null,
    };
  }

  static getDerivedStateFromError(error: Error): Partial<State> {
    // Update state so the next render will show the fallback UI
    return {
      hasError: true,
      error,
    };
  }

  componentDidCatch(error: Error, errorInfo: ErrorInfo) {
    // Log error to console for debugging
    console.error('❌ Error Boundary caught an error:', error);
    console.error('Error Info:', errorInfo);

    // Call custom error handler if provided
    if (this.props.onError) {
      this.props.onError(error, errorInfo);
    }

    // Store error info in state
    this.setState({
      errorInfo,
    });

    // TODO: Log to error reporting service (Sentry, Datadog, etc.)
    // Example: Sentry.captureException(error);
  }

  handleReset = () => {
    this.setState({
      hasError: false,
      error: null,
      errorInfo: null,
    });
    // Reload the page to reset state
    window.location.reload();
  };

  render() {
    if (this.state.hasError) {
      // Custom fallback provided
      if (this.props.fallback) {
        return this.props.fallback;
      }

      // Default fallback UI
      return (
        <div className={`min-h-screen ${theme.core.darkBg} flex items-center justify-center p-8`}>
          <div className="max-w-2xl w-full bg-red-900/20 border border-red-500 rounded-lg p-8">
            <div className="flex items-center gap-4 mb-6">
              <div className="flex-shrink-0">
                <svg
                  className="w-12 h-12 text-red-400"
                  fill="none"
                  viewBox="0 0 24 24"
                  stroke="currentColor"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z"
                  />
                </svg>
              </div>
              <div>
                <h1 className={`text-2xl font-bold text-red-400`}>
                  Something went wrong
                </h1>
                <p className={`${theme.core.bodyText} mt-1`}>
                  The application encountered an unexpected error
                </p>
              </div>
            </div>

            {this.state.error && (
              <div className="mb-6">
                <p className={`text-sm ${theme.core.bodyText} font-semibold mb-2`}>
                  Error Details:
                </p>
                <div className="bg-gray-900 rounded-lg p-4 font-mono text-sm text-red-300 overflow-auto max-h-48">
                  <p className="font-bold">{this.state.error.name}</p>
                  <p className="mt-1">{this.state.error.message}</p>
                </div>
              </div>
            )}

            {process.env.NODE_ENV === 'development' && this.state.errorInfo && (
              <details className="mb-6">
                <summary className={`text-sm ${theme.core.bodyText} font-semibold cursor-pointer hover:text-white transition`}>
                  Component Stack (Development Only)
                </summary>
                <div className="bg-gray-900 rounded-lg p-4 font-mono text-xs text-gray-400 overflow-auto max-h-96 mt-2">
                  <pre>{this.state.errorInfo.componentStack}</pre>
                </div>
              </details>
            )}

            <div className="flex gap-4">
              <button
                onClick={this.handleReset}
                className={`px-6 py-3 ${theme.accents.primary.bgClass} text-white rounded-lg font-semibold hover:opacity-90 transition`}
              >
                Reload Application
              </button>
              <button
                onClick={() => window.history.back()}
                className={`px-6 py-3 bg-gray-700 ${theme.core.white} rounded-lg font-semibold hover:bg-gray-600 transition`}
              >
                Go Back
              </button>
            </div>

            <div className={`mt-6 p-4 bg-gray-800 rounded-lg border border-gray-700`}>
              <p className={`text-sm ${theme.core.bodyText}`}>
                <strong>Need help?</strong> If this error persists, please:
              </p>
              <ul className={`mt-2 text-sm ${theme.core.bodyText} list-disc list-inside space-y-1`}>
                <li>Try refreshing the page</li>
                <li>Clear your browser cache</li>
                <li>Contact support with the error details above</li>
              </ul>
            </div>
          </div>
        </div>
      );
    }

    return this.props.children;
  }
}
