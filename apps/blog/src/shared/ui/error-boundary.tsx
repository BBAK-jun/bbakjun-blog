'use client';

import React from 'react';
import { Button } from '@/shared/ui/button';

interface ErrorBoundaryState {
  hasError: boolean;
  error?: Error;
}

interface ErrorBoundaryProps {
  children: React.ReactNode;
  fallback?: React.ComponentType<{ error?: Error; retry: () => void }>;
}

class ErrorBoundary extends React.Component<ErrorBoundaryProps, ErrorBoundaryState> {
  constructor(props: ErrorBoundaryProps) {
    super(props);
    this.state = { hasError: false };
  }

  static getDerivedStateFromError(error: Error): ErrorBoundaryState {
    return { hasError: true, error };
  }

  componentDidCatch(error: Error, errorInfo: React.ErrorInfo) {
    console.error('Error caught by boundary:', error, errorInfo);
  }

  retry = () => {
    this.setState({ hasError: false, error: undefined });
  };

  render() {
    if (this.state.hasError) {
      const FallbackComponent = this.props.fallback || DefaultErrorFallback;
      return <FallbackComponent error={this.state.error} retry={this.retry} />;
    }

    return this.props.children;
  }
}

function DefaultErrorFallback({ error, retry }: { error?: Error; retry: () => void }) {
  return (
    <div className="text-center py-12">
      <div className="text-red-500 dark:text-red-400 p-6 bg-red-50 dark:bg-red-900/20 rounded-lg max-w-md mx-auto">
        <h3 className="text-lg font-medium mb-2">오류가 발생했습니다</h3>
        <p className="text-sm mb-4">
          {error?.message || '페이지를 불러오는 중 문제가 발생했습니다.'}
        </p>
        <Button onClick={retry} variant="outline" size="sm">
          다시 시도
        </Button>
      </div>
    </div>
  );
}

export default ErrorBoundary;
