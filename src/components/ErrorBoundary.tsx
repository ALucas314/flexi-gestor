import React, { Component, ErrorInfo, ReactNode } from 'react';

interface Props {
  children: ReactNode;
}

interface State {
  hasError: boolean;
  error: Error | null;
  autoReloadCountdown: number;
}

class ErrorBoundary extends Component<Props, State> {
  private autoReloadTimer: NodeJS.Timeout | null = null;

  public state: State = {
    hasError: false,
    error: null,
    autoReloadCountdown: 5, // Recarrega automaticamente após 5 segundos
  };

  public static getDerivedStateFromError(error: Error): State {
    return { hasError: true, error, autoReloadCountdown: 5 };
  }

  public componentDidCatch(error: Error, errorInfo: ErrorInfo) {
    console.error('❌ Erro capturado pelo ErrorBoundary:', error, errorInfo);
    
    // Iniciar contagem regressiva para recarregar automaticamente
    this.autoReloadTimer = setInterval(() => {
      this.setState((prevState) => {
        const newCountdown = prevState.autoReloadCountdown - 1;
        
        if (newCountdown <= 0) {
          // Recarregar automaticamente
          console.log('🔄 Recarregando página automaticamente após erro...');
          window.location.reload();
          return prevState;
        }
        
        return { ...prevState, autoReloadCountdown: newCountdown };
      });
    }, 1000);
  }

  public componentWillUnmount() {
    if (this.autoReloadTimer) {
      clearInterval(this.autoReloadTimer);
    }
  }

  public render() {
    if (this.state.hasError) {
      return (
        <div className="min-h-screen flex items-center justify-center bg-red-50 p-4">
          <div className="max-w-md w-full bg-white rounded-lg shadow-lg p-6">
            <h1 className="text-2xl font-bold text-red-600 mb-4">
              ⚠️ Erro na Aplicação
            </h1>
            <p className="text-gray-700 mb-4">
              Ocorreu um erro inesperado. A página será recarregada automaticamente em{' '}
              <span className="font-bold text-red-600">{this.state.autoReloadCountdown}</span> segundo(s).
            </p>
            {this.state.error && (
              <details className="mb-4">
                <summary className="cursor-pointer text-sm text-gray-600 hover:text-gray-800">
                  Detalhes do erro
                </summary>
                <pre className="mt-2 text-xs bg-gray-100 p-2 rounded overflow-auto max-h-40">
                  {this.state.error.toString()}
                  {this.state.error.stack}
                </pre>
              </details>
            )}
            <button
              onClick={() => window.location.reload()}
              className="w-full bg-red-600 hover:bg-red-700 text-white px-4 py-2 rounded transition-colors"
            >
              🔄 Recarregar Agora
            </button>
          </div>
        </div>
      );
    }

    return this.props.children;
  }
}

export default ErrorBoundary;

