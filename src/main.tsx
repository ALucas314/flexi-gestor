// 🚫 Suprimir mensagens do console PRIMEIRO
import './suppress-console'

import React from 'react'
import ReactDOM from 'react-dom/client'
import App from './App.tsx'
import './fonts.css'
import './index.css'
import { DataProvider } from './contexts/DataContext'
import { AuthProvider } from './contexts/AuthContext'

ReactDOM.createRoot(document.getElementById('root')!).render(
  <React.StrictMode>
    <AuthProvider>
      <DataProvider>
        <App />
      </DataProvider>
    </AuthProvider>
  </React.StrictMode>,
)
