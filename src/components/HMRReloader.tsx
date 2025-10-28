/**
 * 🔄 Componente para Auto-Reload em casos extremos
 * Detecta desconexões e tenta reconectar automaticamente
 */

import { useEffect, useState } from 'react';

export const HMRReloader = () => {
  const [isReconnecting, setIsReconnecting] = useState(false);
  const [retryCount, setRetryCount] = useState(0);

  useEffect(() => {
    // Apenas em desenvolvimento
    if (import.meta.env.MODE !== 'development') return;

    let lastHeartbeat = Date.now();
    let isConnected = true;
    let checkInterval: NodeJS.Timeout | null = null;

    const checkConnection = () => {
      const timeSinceLastHeartbeat = Date.now() - lastHeartbeat;
      
      // Se não houve heartbeat há mais de 10 segundos, considerar desconectado
      if (timeSinceLastHeartbeat > 10000 && isConnected) {
        console.warn('⚠️ Conexão HMR perdida detectada');
        isConnected = false;
        setIsReconnecting(true);
        
        // Tentar reconectar se ainda não tentou muitas vezes
        if (retryCount < 3) {
          setRetryCount(prev => prev + 1);
          // Forçar reload da página após 2 segundos se não reconectar
          setTimeout(() => {
            if (!isConnected) {
              console.log('🔄 Tentando reconectar...');
              window.location.reload();
            }
          }, 2000);
        }
      }
    };

    // Monitorar eventos do Vite HMR
    if (import.meta.hot) {
      // Detectar conexão/desconexão do WebSocket
      import.meta.hot.on('vite:ws:connect', () => {
        console.log('✅ HMR conectado');
        isConnected = true;
        lastHeartbeat = Date.now();
        setIsReconnecting(false);
        setRetryCount(0);
      });

      import.meta.hot.on('vite:ws:disconnect', () => {
        console.warn('⚠️ HMR desconectado');
        isConnected = false;
        setIsReconnecting(true);
      });

      // Atualização bem-sucedida
      import.meta.hot.on('vite:beforeUpdate', () => {
        lastHeartbeat = Date.now();
        isConnected = true;
      });

      // Erro no HMR
      import.meta.hot.on('vite:error', (err) => {
        console.error('❌ Erro no HMR:', err);
      });

      // Aceitar todas as atualizações
      import.meta.hot.accept(() => {
        lastHeartbeat = Date.now();
      });
    }

    // Verificar conexão a cada 5 segundos
    checkInterval = setInterval(checkConnection, 5000);

    return () => {
      if (checkInterval) clearInterval(checkInterval);
    };
  }, [retryCount]);

  // Completamente invisível - não renderiza nada
  return null;
};

