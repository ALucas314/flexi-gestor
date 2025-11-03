/**
 * 🔌 Componente Global de Monitoramento de Conexão
 * 
 * Este componente monitora a conexão com o Supabase globalmente
 * e dispara eventos para que todas as páginas recarreguem dados
 * automaticamente quando detectar reconexão.
 */

import { useEffect } from 'react';
import { useSupabaseConnectionMonitor, CONNECTION_EVENTS } from '@/hooks/useSupabaseConnectionMonitor';
import { useAuth } from '@/contexts/AuthContext';
import { useWorkspace } from '@/contexts/WorkspaceContext';

export const ConnectionMonitor = () => {
  const { user } = useAuth();
  const { workspaceAtivo } = useWorkspace();

  // Usar o hook de monitoramento global
  useSupabaseConnectionMonitor({
    enableLogs: true,
    onRefreshNeeded: () => {
      // Quando detectar que precisa recarregar dados, disparar evento global
      console.log('🔄 [ConnectionMonitor] Disparando reload silencioso de dados...');
      window.dispatchEvent(new CustomEvent('force-reload-data', {
        detail: { timestamp: Date.now(), reason: 'connection-recovered' }
      }));
    }
  });

  // Escutar eventos de reconexão e disparar reload silencioso
  useEffect(() => {
    if (!user || !workspaceAtivo) {
      return;
    }

    const handleReconnect = () => {
      console.log('✅ [ConnectionMonitor] Reconexão detectada, forçando reload silencioso...');
      
      // Disparar evento global para que todas as páginas recarreguem
      window.dispatchEvent(new CustomEvent('force-reload-data', {
        detail: { timestamp: Date.now(), reason: 'reconnected' }
      }));
    };

    const handleRefreshNeeded = () => {
      console.log('🔄 [ConnectionMonitor] Refresh necessário, forçando reload silencioso...');
      
      // Disparar evento global para que todas as páginas recarreguem
      window.dispatchEvent(new CustomEvent('force-reload-data', {
        detail: { timestamp: Date.now(), reason: 'refresh-needed' }
      }));
    };

    window.addEventListener(CONNECTION_EVENTS.RECONNECTED, handleReconnect);
    window.addEventListener(CONNECTION_EVENTS.REFRESH_NEEDED, handleRefreshNeeded);

    return () => {
      window.removeEventListener(CONNECTION_EVENTS.RECONNECTED, handleReconnect);
      window.removeEventListener(CONNECTION_EVENTS.REFRESH_NEEDED, handleRefreshNeeded);
    };
  }, [user, workspaceAtivo]);

  return null; // Componente invisível
};

