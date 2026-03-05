import { Component, type ReactNode } from "react";

interface Props {
  children: ReactNode;
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

  componentDidCatch(error: Error, info: React.ErrorInfo) {
    console.error("[ErrorBoundary]", error, info.componentStack);
  }

  handleReload = () => {
    window.location.reload();
  };

  render() {
    if (this.state.hasError) {
      return (
        <div className="h-[100dvh] w-full bg-background flex flex-col items-center justify-center px-8 text-center gap-4">
          <div className="w-16 h-16 rounded-full bg-destructive/10 flex items-center justify-center">
            <span className="text-2xl">💥</span>
          </div>
          <h1 className="font-display text-xl font-bold text-foreground">
            Oops, quelque chose a planté
          </h1>
          <p className="text-sm text-muted-foreground max-w-xs">
            Une erreur inattendue s'est produite. Recharge la page pour continuer.
          </p>
          <button
            onClick={this.handleReload}
            className="px-6 py-3 rounded-xl text-sm font-bold text-primary-foreground"
            style={{ background: "linear-gradient(135deg, #BF953F, #FCF6BA, #B38728)" }}
          >
            Recharger l'app
          </button>
        </div>
      );
    }

    return this.props.children;
  }
}
