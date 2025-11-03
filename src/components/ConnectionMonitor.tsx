/**
 * 🔌 Componente Global de Monitoramento de Conexão
 * 
 * Este componente monitora a conexão com o Supabase globalmente
 * e dispara eventos para que todas as páginas recarreguem dados
 * automaticamente quando detectar reconexão.
 */

import { useSupabaseConnectionMonitor } from '@/hooks/useSupabaseConnectionMonitor';

export const ConnectionMonitor = () => {
  // Usar o hook de monitoramento global
  // O hook já dispara automaticamente os eventos 'force-reload-data' que o DataContext escuta
  useSupabaseConnectionMonitor({
    enableLogs: true
  });

  return null; // Componente invisível
};

