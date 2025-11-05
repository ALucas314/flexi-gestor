// 🚫 Suprimir mensagens do console em desenvolvimento
if (typeof window !== 'undefined' && process.env.NODE_ENV === 'development') {
  const shouldSuppress = (...args: any[]) => {
    return args.some(
      arg => {
        if (typeof arg === 'string') {
          // Suprimir mensagens comuns do React DevTools
          if (arg.includes('Download the React DevTools')) return true;
          if (arg.includes('React DevTools')) return true;
          // Suprimir mensagens de debug excessivas
          if (arg.includes('[DEBUG') || arg.includes('[SAIDAS') || arg.includes('[ENTRADAS')) return true;
          if (arg.includes('Realtime:') && !arg.includes('Erro')) return true;
          if (arg.includes('Subscription') || arg.includes('subscription')) return true;
          if (arg.includes('🔄') || arg.includes('📡') || arg.includes('✅') || arg.includes('👁️') || arg.includes('🌐')) return true;
        }
        return false;
      }
    );
  };

  const originalLog = console.log;
  const originalError = console.error;
  const originalWarn = console.warn;

  console.log = (...args: any[]) => {
    if (!shouldSuppress(...args)) originalLog.apply(console, args);
  };

  console.error = (...args: any[]) => {
    // Manter apenas erros críticos, suprimir erros de debug
    if (!shouldSuppress(...args)) originalError.apply(console, args);
  };

  console.warn = (...args: any[]) => {
    if (!shouldSuppress(...args)) originalWarn.apply(console, args);
  };
}

