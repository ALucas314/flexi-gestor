// 🚫 Suprimir mensagens do console em desenvolvimento
if (typeof window !== 'undefined' && process.env.NODE_ENV === 'development') {
  const shouldSuppress = (...args: any[]) => {
    return args.some(
      arg => typeof arg === 'string' && arg.includes('Download the React DevTools')
    );
  };

  const originalLog = console.log;
  const originalError = console.error;
  const originalWarn = console.warn;

  console.log = (...args: any[]) => {
    if (!shouldSuppress(...args)) originalLog.apply(console, args);
  };

  console.error = (...args: any[]) => {
    if (!shouldSuppress(...args)) originalError.apply(console, args);
  };

  console.warn = (...args: any[]) => {
    if (!shouldSuppress(...args)) originalWarn.apply(console, args);
  };
}

