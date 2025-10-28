/**
 * 🔄 Componente para Auto-Reload completamente silencioso
 * Aguarda página ficar ociosa antes de recarregar
 */

import { useEffect, useRef } from 'react';

export const HMRReloader = () => {
  const isReloadingRef = useRef(false);
  const lastHeartbeatRef = useRef(Date.now());
  const lastActivityRef = useRef(Date.now());
  
  useEffect(() => {
    // Apenas em desenvolvimento
    if (import.meta.env.MODE !== 'development') return;

    // Detectar atividades do usuário
    const updateActivity = () => {
      lastActivityRef.current = Date.now();
    };

    // Listener de atividade (movimento do mouse, rolagem, cliques)
    document.addEventListener('mousemove', updateActivity, { passive: true });
    document.addEventListener('scroll', updateActivity, { passive: true });
    document.addEventListener('click', updateActivity, { passive: true });
    document.addEventListener('keydown', updateActivity, { passive: true });

    // Monitorar eventos do Vite HMR
    if (import.meta.hot) {
      // Detectar conexão
      import.meta.hot.on('vite:ws:connect', () => {
        lastHeartbeatRef.current = Date.now();
      });

      // Detectar desconexão
      import.meta.hot.on('vite:ws:disconnect', () => {
        // Verificar a cada 3 segundos se pode recarregar
        const checkInterval = setInterval(() => {
          if (isReloadingRef.current) {
            clearInterval(checkInterval);
            return;
          }
          
          const timeSinceLastHeartbeat = Date.now() - lastHeartbeatRef.current;
          const timeSinceLastActivity = Date.now() - lastActivityRef.current;
          
          // Só recarregar se:
          // 1. Desconectado há mais de 30 segundos
          // 2. Usuário não interagiu há mais de 5 segundos (página ociosa)
          if (timeSinceLastHeartbeat > 30000 && timeSinceLastActivity > 5000) {
            isReloadingRef.current = true;
            clearInterval(checkInterval);
            // Recarregar silenciosamente
            window.location.reload();
          }
        }, 3000);
      });

      // Atualização bem-sucedida
      import.meta.hot.on('vite:beforeUpdate', () => {
        lastHeartbeatRef.current = Date.now();
      });

      // Aceitar todas as atualizações
      import.meta.hot.accept(() => {
        lastHeartbeatRef.current = Date.now();
      });
    }

    return () => {
      document.removeEventListener('mousemove', updateActivity);
      document.removeEventListener('scroll', updateActivity);
      document.removeEventListener('click', updateActivity);
      document.removeEventListener('keydown', updateActivity);
    };
  }, []);

  // Completamente invisível
  return null;
};

