import React from "react";

type Props = {
  children: React.ReactNode;
};

type State = {
  hasError: boolean;
  message?: string;
};

/**
 * Minimal crash-catcher for Lovable/production: only shows UI when React crashes.
 * Does not change design/flow during normal operation.
 */
export class RuntimeErrorBoundary extends React.Component<Props, State> {
  state: State = { hasError: false };

  static getDerivedStateFromError(error: unknown): State {
    const message = error instanceof Error ? error.message : String(error);
    return { hasError: true, message };
  }

  componentDidCatch(error: unknown, info: unknown) {
    // Surface for debugging in Lovable preview.
    console.error("[Runtime] React crashed", error, info);
    (window as any).__DJASSA_LAST_RUNTIME_ERROR__ = {
      at: new Date().toISOString(),
      error: error instanceof Error ? { name: error.name, message: error.message, stack: error.stack } : error,
      info,
    };
  }

  render() {
    if (!this.state.hasError) return this.props.children;

    // Keep styling minimal and token-based.
    return (
      <div className="min-h-screen bg-background text-foreground flex items-center justify-center p-6">
        <div className="max-w-lg w-full rounded-lg border bg-card text-card-foreground p-5">
          <h1 className="text-lg font-semibold">Erreur de chargement</h1>
          <p className="mt-2 text-sm text-muted-foreground">
            Une erreur runtime empêche l’application de démarrer. Ouvrez la console et cherchez
            <code className="mx-1">[Runtime]</code>.
          </p>
          {this.state.message ? (
            <pre className="mt-3 text-xs whitespace-pre-wrap rounded-md bg-muted p-3 overflow-auto">
              {this.state.message}
            </pre>
          ) : null}
        </div>
      </div>
    );
  }
}
