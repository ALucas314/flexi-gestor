// 🚫 Suprimir mensagens do console PRIMEIRO
import './suppress-console'

import React from 'react'
import ReactDOM from 'react-dom/client'
import App from './App.tsx'
import './fonts.css'
import './index.css'
import ErrorBoundary from './components/ErrorBoundary'

// Habilitar console temporariamente para debug
if (process.env.NODE_ENV === 'development') {
  console.log('🚀 Aplicação iniciando...');
}

ReactDOM.createRoot(document.getElementById('root')!).render(
  <React.StrictMode>
    <ErrorBoundary>
      <App />
    </ErrorBoundary>
  </React.StrictMode>,
)
