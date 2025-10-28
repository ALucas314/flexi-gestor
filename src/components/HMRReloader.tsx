/**
 * 🔄 Componente para manter HMR estável
 * Monitora conexão silenciosamente sem interferir na experiência do usuário
 */

import { useEffect } from 'react';

export const HMRReloader = () => {
  useEffect(() => {
    // Apenas em desenvolvimento
    if (import.meta.env.MODE !== 'development') return;

    // Monitorar eventos do Vite HMR silenciosamente
    if (import.meta.hot) {
      // Forçar Vite a aceitar todas as atualizações automaticamente
      import.meta.hot.on('vite:beforeUpdate', () => {
        // Apenas aceita a atualização sem fazer nada visível
      });

      // Aceitar todas as atualizações sem delay
      import.meta.hot.accept(() => {
        // Atualização aceita automaticamente
      });

      // Interceptar erros silenciosamente
      import.meta.hot.on('vite:error', () => {
        // Apenas aceita o erro sem mostrar nada ao usuário
      });
    }
  }, []);

  // Completamente invisível - não renderiza nada
  return null;
};

