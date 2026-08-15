import React, { Component, ErrorInfo, ReactNode } from "react";

export class ErrorBoundary extends Component<{children: ReactNode, fallback?: ReactNode}, {hasError: boolean, error: Error | null}> {
  constructor(props: any) {
    super(props);
    this.state = { hasError: false, error: null };
  }

  static getDerivedStateFromError(error: Error) {
    return { hasError: true, error };
  }

  componentDidCatch(error: Error, errorInfo: ErrorInfo) {
    console.error("ErrorBoundary caught an error", error, errorInfo);
  }

  render() {
    if (this.state.hasError) {
      return (
        <div className="p-8 text-red-500 bg-red-100/10 m-4 rounded-xl border border-red-500/50">
          <h1 className="text-xl font-bold mb-4">React Render Error</h1>
          <pre className="text-sm overflow-auto">{this.state.error?.toString()}</pre>
          <pre className="text-xs mt-4 text-muted-foreground">{this.state.error?.stack}</pre>
        </div>
      );
    }
    return this.props.children;
  }
}
