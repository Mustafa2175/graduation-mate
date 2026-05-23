"use client";

import React, { Component, ErrorInfo, ReactNode } from "react";
import Button from "@/components/ui/Button";

interface Props {
  children?: ReactNode;
}

interface State {
  hasError: boolean;
  error: Error | null;
}

export default class ErrorBoundary extends Component<Props, State> {
  public state: State = {
    hasError: false,
    error: null,
  };

  public static getDerivedStateFromError(error: Error): State {
    // Update state so the next render will show the fallback UI.
    return { hasError: true, error };
  }

  public componentDidCatch(error: Error, errorInfo: ErrorInfo) {
    console.error("Uncaught error caught by ErrorBoundary:", error, errorInfo);
  }

  private handleReset = () => {
    this.setState({ hasError: false, error: null });
    window.location.assign("/discover");
  };

  public render() {
    if (this.state.hasError) {
      return (
        <div className="min-h-screen bg-[#ededed] p-6 flex items-center justify-center font-sans">
          <div className="bg-white rounded-3xl border border-red-100 p-8 text-center shadow-lg max-w-md space-y-6">
            <div className="w-16 h-16 bg-red-50 rounded-full flex items-center justify-center mx-auto border border-red-100">
              <span className="text-3xl text-red-500">⚠️</span>
            </div>
            <div className="space-y-2">
              <h2 className="font-bold text-2xl text-[#0b0f1a] tracking-tight">
                An unexpected error occurred
              </h2>
              <p className="text-xs text-neutral-500 leading-relaxed max-w-xs mx-auto">
                A rendering error occurred in the application. To ensure your session remains stable, please reset the view below.
              </p>
              {this.state.error?.message && (
                <div className="bg-red-50 text-red-700 text-left font-mono text-[10px] p-3 rounded-xl border border-red-100 overflow-auto max-h-32 mt-2">
                  {this.state.error.message}
                </div>
              )}
            </div>
            <button
              onClick={this.handleReset}
              className="w-full relative overflow-hidden rounded-full py-3.5 text-xs font-bold text-white bg-[#0871E7] hover:bg-[#0871E7]/95 transition-all shadow-md cursor-pointer uppercase tracking-wider"
            >
              Reset Application View
            </button>
          </div>
        </div>
      );
    }

    return this.props.children;
  }
}
