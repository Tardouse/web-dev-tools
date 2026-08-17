"use client";

import { CircleAlert, RefreshCcw } from "lucide-react";
import { Component, type ErrorInfo, type ReactNode } from "react";
import type { Messages } from "@/i18n";

export function ToolLoadingState({ messages }: { messages: Messages }) {
  return (
    <div className="tool-runtime-state card" role="status" aria-busy="true">
      <span className="tool-runtime-spinner" aria-hidden="true" />
      <span>{messages.common.working}</span>
    </div>
  );
}

interface ToolErrorBoundaryProps {
  children: ReactNode;
  messages: Messages;
}

interface ToolErrorBoundaryState {
  error: Error | null;
  attempt: number;
}

export class ToolErrorBoundary extends Component<
  ToolErrorBoundaryProps,
  ToolErrorBoundaryState
> {
  state: ToolErrorBoundaryState = { error: null, attempt: 0 };

  static getDerivedStateFromError(error: Error): ToolErrorBoundaryState {
    return { error, attempt: 0 };
  }

  componentDidCatch(error: Error, errorInfo: ErrorInfo) {
    console.error("Tool runtime error", error, errorInfo);
  }

  render() {
    if (this.state.error) {
      return (
        <div className="tool-runtime-state card" role="alert">
          <CircleAlert size={24} aria-hidden="true" />
          <div>
            <h3>{this.props.messages.states.errorTitle}</h3>
            <p>{this.props.messages.states.errorDescription}</p>
            <button
              type="button"
              className="button button-primary button-sm"
              onClick={() =>
                this.setState((current) => ({
                  error: null,
                  attempt: current.attempt + 1,
                }))
              }
            >
              <RefreshCcw size={15} />
              {this.props.messages.states.retry}
            </button>
          </div>
        </div>
      );
    }

    return <div key={this.state.attempt}>{this.props.children}</div>;
  }
}
