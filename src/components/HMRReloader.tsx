/**
 * 🔄 Componente para Auto-Reload SILENCIOSO e INVISÍVEL
 * 
 * Detecta:
 * - Desconexão do WebSocket do Vite HMR
 * - Servidor Vite reiniciado
 * - Erros de compilação resolvidos
 * 
 * Recarrega automaticamente SEM flash visual ou notificação
 */

import { useEffect, useState } from 'react';

export const HMRReloader = () => {
  const [isReconnecting, setIsReconnecting] = useState(false);

  useEffect(() => {
    // Apenas em desenvolvimento
    if (import.meta.env.MODE !== 'development') return;

    let lastHeartbeat = Date.now();
    let reconnectAttempts = 0;
    let isConnected = true;
    let reloadTimeout: NodeJS.Timeout;
    let checkInterval: NodeJS.Timeout;

    const silentReload = () => {
      console.log('🔄 [Auto-Reload] Recarregando silenciosamente...');
      
      // Usar replace para não adicionar histórico
      window.location.replace(window.location.href);
    };

    // Monitorar eventos do Vite HMR
    if (import.meta.hot) {
      // Detectar conexão/desconexão do WebSocket
      import.meta.hot.on('vite:ws:connect', () => {
        console.log('✅ [HMR] Conectado ao servidor Vite');
        isConnected = true;
        reconnectAttempts = 0;
        lastHeartbeat = Date.now();
        setIsReconnecting(false);
        
        clearTimeout(reloadTimeout);
      });

      import.meta.hot.on('vite:ws:disconnect', () => {
        console.log('⚠️ [HMR] Desconectado do servidor Vite');
        isConnected = false;
        setIsReconnecting(true);
        
        // Aguardar 3 segundos e tentar reconectar
        reloadTimeout = setTimeout(() => {
          reconnectAttempts++;
          
          // Após 2 tentativas, fazer reload silencioso
          if (reconnectAttempts >= 2) {
            silentReload();
          }
        }, 3000);
      });

      // Atualização bem-sucedida
      import.meta.hot.on('vite:beforeUpdate', () => {
        lastHeartbeat = Date.now();
        isConnected = true;
        clearTimeout(reloadTimeout);
      });

      // Erro no HMR - aguardar e recarregar
      import.meta.hot.on('vite:error', (err) => {
        console.log('❌ [HMR] Erro detectado:', err);
        
        // Aguardar 2 segundos (tempo para resolver) e recarregar
        reloadTimeout = setTimeout(() => {
          silentReload();
        }, 2000);
      });

      // Aceitar todas as atualizações
      import.meta.hot.accept(() => {
        lastHeartbeat = Date.now();
      });
    }

    // Monitorar heartbeat (verifica se servidor está respondendo)
    checkInterval = setInterval(() => {
      const timeSinceHeartbeat = Date.now() - lastHeartbeat;
      
      // Se passou mais de 30 segundos sem sinal do servidor
      if (isConnected && timeSinceHeartbeat > 30000) {
        console.log('💀 [HMR] Servidor não responde há 30s, verificando...');
        
        // Fazer um ping no servidor
        fetch(window.location.origin)
          .then(() => {
            // Servidor está online mas HMR morreu - recarregar
            console.log('🔄 [HMR] Servidor online, mas HMR morto - recarregando...');
            silentReload();
          })
          .catch(() => {
            // Servidor realmente está offline
            console.log('⏳ [HMR] Servidor offline, aguardando...');
          });
      }
    }, 10000); // Verifica a cada 10 segundos

    return () => {
      clearTimeout(reloadTimeout);
      clearInterval(checkInterval);
    };
  }, []);

  // Completamente invisível - não renderiza nada
  return null;
};

