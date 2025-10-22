/**
 * 🔄 Componente para Auto-Reload APENAS em casos extremos
 * 
 * DESABILITADO para evitar perda de dados
 * Apenas registra eventos do HMR sem fazer reload automático
 */

import { useEffect, useState } from 'react';

export const HMRReloader = () => {
  const [isReconnecting, setIsReconnecting] = useState(false);

  useEffect(() => {
    // Apenas em desenvolvimento
    if (import.meta.env.MODE !== 'development') return;

    let lastHeartbeat = Date.now();
    let isConnected = true;

    // Função de reload DESABILITADA para evitar perda de dados
    const silentReload = () => {
      // NÃO FAZ NADA - reload manual pelo usuário é melhor
      // Evita perder dados de formulários
      return;
    };

    // Monitorar eventos do Vite HMR
    if (import.meta.hot) {
      // Detectar conexão/desconexão do WebSocket
      import.meta.hot.on('vite:ws:connect', () => {
        isConnected = true;
        lastHeartbeat = Date.now();
        setIsReconnecting(false);
      });

      import.meta.hot.on('vite:ws:disconnect', () => {
        isConnected = false;
        setIsReconnecting(true);
        // NÃO faz reload automático - usuário deve pressionar F5 manualmente
      });

      // Atualização bem-sucedida
      import.meta.hot.on('vite:beforeUpdate', () => {
        lastHeartbeat = Date.now();
        isConnected = true;
      });

      // Erro no HMR - NÃO recarregar automaticamente
      import.meta.hot.on('vite:error', () => {
        // Apenas registra, não recarrega
      });

      // Aceitar todas as atualizações
      import.meta.hot.accept(() => {
        lastHeartbeat = Date.now();
      });
    }

    // Heartbeat desabilitado - não fazer verificações
    return () => {
      // Cleanup
    };
  }, []);

  // Completamente invisível - não renderiza nada
  return null;
};

