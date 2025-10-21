/**
 * 🔄 Componente para Auto-Reload SILENCIOSO quando HMR falha
 * 
 * Detecta quando a conexão WebSocket do Vite HMR é perdida
 * e recarrega automaticamente a página SEM flash visual
 */

import { useEffect } from 'react';

export const HMRReloader = () => {
  useEffect(() => {
    // Apenas em desenvolvimento
    if (import.meta.env.MODE !== 'development') return;

    let lastUpdate = Date.now();
    let reloadTimeout: NodeJS.Timeout;

    // Monitorar eventos do Vite HMR
    if (import.meta.hot) {
      // Evento quando o HMR atualiza com sucesso
      import.meta.hot.on('vite:beforeUpdate', () => {
        lastUpdate = Date.now();
        clearTimeout(reloadTimeout);
      });

      // Evento quando há erro no HMR - fazer reload SILENCIOSO
      import.meta.hot.on('vite:error', () => {
        console.log('[HMR] Erro detectado, fazendo reload silencioso...');
        reloadTimeout = setTimeout(() => {
          // Adicionar classe para transição suave
          document.body.classList.add('reloading');
          
          // Aguardar transição e recarregar
          setTimeout(() => {
            // Reload silencioso usando cache do navegador
            window.location.href = window.location.href;
          }, 200); // Tempo da transição
        }, 500);
      });

      // Aceitar atualizações automaticamente
      import.meta.hot.accept(() => {
        lastUpdate = Date.now();
      });
    }

    // Verificar se está recebendo atualizações
    const checkUpdates = setInterval(() => {
      const timeSinceLastUpdate = Date.now() - lastUpdate;
      
      // Se passou muito tempo sem atualização (mais de 10 minutos), fazer soft reload
      if (timeSinceLastUpdate > 600000) { // 10 minutos
        console.log('[HMR] Sessão inativa, fazendo soft reload...');
        lastUpdate = Date.now(); // Reset para não ficar em loop
      }
    }, 60000); // Verifica a cada 1 minuto

    return () => {
      clearInterval(checkUpdates);
      clearTimeout(reloadTimeout);
    };
  }, []);

  return null; // Componente invisível
};

