/**
 * 🔌 Hook de Monitoramento e Reconexão Automática do Supabase
 * 
 * Este hook monitora a conexão com o Supabase em tempo real,
 * detecta desconexões automaticamente e reconecta silenciosamente
 * sem interromper o usuário.
 */

import { useEffect, useRef, useCallback } from 'react';
import { supabase } from '@/lib/supabase';

interface ConnectionStatus {
  isConnected: boolean;
  lastConnection: number;
  reconnectAttempts: number;
}

interface UseSupabaseConnectionOptions {
  onReconnect?: () => Promise<void>;
  checkInterval?: number; // Intervalo em ms para verificar conexão (padrão: 10s)
  disconnectThreshold?: number; // Tempo em ms para considerar desconectado (padrão: 30s)
  enableLogs?: boolean; // Exibir logs detalhados no console
}

export function useSupabaseConnection(
  subscription: any,
  loadData: () => Promise<void>,
  options: UseSupabaseConnectionOptions = {}
) {
  const {
    onReconnect,
    checkInterval = 10000, // 10 segundos
    disconnectThreshold = 30000, // 30 segundos
    enableLogs = true
  } = options;

  const statusRef = useRef<ConnectionStatus>({
    isConnected: true,
    lastConnection: Date.now(),
    reconnectAttempts: 0
  });

  const reconnectTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  const healthCheckIntervalRef = useRef<NodeJS.Timeout | null>(null);
  const lastDataLoadRef = useRef<number>(Date.now());

  // Função para verificar status da conexão
  const checkConnection = useCallback(async () => {
    try {
      // Verificar se há sessão ativa
      const { data: { session }, error: sessionError } = await supabase.auth.getSession();
      
      if (sessionError) {
        if (enableLogs) {
          console.warn('⚠️ [Supabase Connection] Erro ao verificar sessão:', sessionError.message);
        }
        statusRef.current.isConnected = false;
        return false;
      }

      // Testar conexão fazendo uma query simples
      const { error: testError } = await supabase
        .from('produtos')
        .select('id')
        .limit(1);

      if (testError) {
        if (enableLogs) {
          console.warn('⚠️ [Supabase Connection] Erro ao testar conexão:', testError.message);
        }
        statusRef.current.isConnected = false;
        return false;
      }

      // Verificar status da subscription
      if (subscription) {
        const channelStatus = subscription.state;
        if (channelStatus !== 'joined' && channelStatus !== 'subscribed') {
          if (enableLogs) {
            console.warn(`⚠️ [Supabase Connection] Subscription não está conectada. Status: ${channelStatus}`);
          }
          statusRef.current.isConnected = false;
          return false;
        }
      }

      // Tudo OK
      if (!statusRef.current.isConnected && enableLogs) {
        console.log('✅ [Supabase Connection] Conexão restaurada!');
      }

      statusRef.current.isConnected = true;
      statusRef.current.lastConnection = Date.now();
      statusRef.current.reconnectAttempts = 0;
      
      return true;
    } catch (error: any) {
      if (enableLogs) {
        console.error('❌ [Supabase Connection] Erro ao verificar conexão:', error.message);
      }
      statusRef.current.isConnected = false;
      return false;
    }
  }, [subscription, enableLogs]);

  // Função para reconectar
  const reconnect = useCallback(async () => {
    if (enableLogs) {
      console.log('🔄 [Supabase Connection] Iniciando reconexão automática...');
    }

    statusRef.current.reconnectAttempts += 1;

    try {
      // Verificar conexão primeiro
      const isConnected = await checkConnection();

      if (!isConnected) {
        // Tentar reconectar a subscription se existir
        if (subscription) {
          try {
            // Remover subscription antiga
            await supabase.removeChannel(subscription);
          } catch (e) {
            // Ignorar erros ao remover
          }
        }

        // Recarregar dados silenciosamente
        try {
          await loadData();
          lastDataLoadRef.current = Date.now();
          
          if (enableLogs) {
            console.log('✅ [Supabase Connection] Dados recarregados com sucesso');
          }
        } catch (error: any) {
          if (enableLogs) {
            console.error('❌ [Supabase Connection] Erro ao recarregar dados:', error.message);
          }
        }

        // Executar callback personalizado se fornecido
        if (onReconnect) {
          try {
            await onReconnect();
          } catch (error: any) {
            if (enableLogs) {
              console.error('❌ [Supabase Connection] Erro no callback de reconexão:', error.message);
            }
          }
        }
      }

      // Verificar conexão novamente após reconexão
      await checkConnection();

      if (enableLogs) {
        console.log(`✅ [Supabase Connection] Reconexão concluída. Tentativa #${statusRef.current.reconnectAttempts}`);
      }
    } catch (error: any) {
      if (enableLogs) {
        console.error('❌ [Supabase Connection] Erro durante reconexão:', error.message);
      }
    }
  }, [checkConnection, subscription, loadData, onReconnect, enableLogs]);

  // Monitoramento contínuo
  useEffect(() => {
    if (!subscription) return;

    // Função de health check
    const performHealthCheck = async () => {
      const timeSinceLastConnection = Date.now() - statusRef.current.lastConnection;
      const timeSinceLastDataLoad = Date.now() - lastDataLoadRef.current;

      // Verificar conexão
      const isConnected = await checkConnection();

      // Se não está conectado OU passou muito tempo desde a última conexão
      if (!isConnected || timeSinceLastConnection > disconnectThreshold) {
        if (enableLogs) {
          console.warn('⚠️ [Supabase Connection] Desconexão detectada:', {
            isConnected,
            timeSinceLastConnection: `${Math.round(timeSinceLastConnection / 1000)}s`,
            timeSinceLastDataLoad: `${Math.round(timeSinceLastDataLoad / 1000)}s`,
            reconnectAttempts: statusRef.current.reconnectAttempts
          });
        }

        // Reconectar imediatamente
        await reconnect();
      } else {
        // Se está conectado mas passou muito tempo desde o último carregamento de dados
        // fazer um refresh silencioso preventivo
        if (timeSinceLastDataLoad > disconnectThreshold * 2) {
          if (enableLogs) {
            console.log('🔄 [Supabase Connection] Refresh preventivo de dados...');
          }
          
          try {
            await loadData();
            lastDataLoadRef.current = Date.now();
            
            if (enableLogs) {
              console.log('✅ [Supabase Connection] Refresh preventivo concluído');
            }
          } catch (error: any) {
            if (enableLogs) {
              console.warn('⚠️ [Supabase Connection] Erro no refresh preventivo:', error.message);
            }
          }
        }
      }
    };

    // Health check inicial
    checkConnection();

    // Configurar intervalo de health check
    healthCheckIntervalRef.current = setInterval(performHealthCheck, checkInterval);

    // Listener para mudanças de status da subscription
    const channel = subscription;
    if (channel) {
      // Monitorar status da subscription em tempo real
      const statusListener = setInterval(() => {
        const channelState = channel.state;
        
        if (channelState === 'closed' || channelState === 'errored') {
          if (enableLogs) {
            console.warn(`⚠️ [Supabase Connection] Subscription ${channelState}. Reconectando...`);
          }
          
          // Reconectar imediatamente
          reconnect();
        } else if (channelState === 'joined' || channelState === 'subscribed') {
          statusRef.current.isConnected = true;
          statusRef.current.lastConnection = Date.now();
        }
      }, 5000); // Verificar a cada 5 segundos

      return () => {
        if (healthCheckIntervalRef.current) {
          clearInterval(healthCheckIntervalRef.current);
        }
        clearInterval(statusListener);
      };
    }

    return () => {
      if (healthCheckIntervalRef.current) {
        clearInterval(healthCheckIntervalRef.current);
      }
      if (reconnectTimeoutRef.current) {
        clearTimeout(reconnectTimeoutRef.current);
      }
    };
  }, [subscription, checkConnection, reconnect, loadData, checkInterval, disconnectThreshold, enableLogs]);

  // Expor status atual (para debug)
  return {
    isConnected: statusRef.current.isConnected,
    lastConnection: statusRef.current.lastConnection,
    reconnectAttempts: statusRef.current.reconnectAttempts
  };
}

