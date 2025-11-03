/**
 * 🔌 Hook Global de Monitoramento de Conexão do Supabase
 * 
 * Este hook monitora a conexão com o Supabase globalmente e dispara
 * eventos quando detecta desconexão ou reconexão, permitindo que
 * todas as páginas façam reload silencioso dos dados automaticamente.
 */

import { useEffect, useRef, useCallback } from 'react';
import { supabase } from '@/lib/supabase';

interface ConnectionStatus {
  isConnected: boolean;
  lastConnection: number;
  disconnectCount: number;
  reconnectCount: number;
}

// Eventos customizados globais para notificar desconexão/reconexão
const CONNECTION_EVENTS = {
  DISCONNECTED: 'supabase-connection-disconnected',
  RECONNECTED: 'supabase-connection-reconnected',
  REFRESH_NEEDED: 'supabase-connection-refresh-needed'
};

let globalConnectionStatus: ConnectionStatus = {
  isConnected: true,
  lastConnection: Date.now(),
  disconnectCount: 0,
  reconnectCount: 0
};

let globalHealthCheckInterval: NodeJS.Timeout | null = null;
let globalReconnectTimeout: NodeJS.Timeout | null = null;
let globalIsReconnecting: boolean = false;

// Função para verificar conexão com o Supabase
async function checkSupabaseConnection(): Promise<boolean> {
  try {
    // Testar conexão fazendo uma query simples ao Supabase
    // Usar uma query leve que não depende de tabelas específicas
    const { error } = await supabase
      .from('produtos')
      .select('id')
      .limit(1)
      .maybeSingle();

    if (error) {
      // Erros específicos que NÃO indicam desconexão:
      // - Permissão negada (42501)
      // - Tabela não existe (42P01)
      // - Sem resultados (PGRST116)
      // - JWT expirado ou inválido (PGRST301, PGRST302, PGRST303) - erro de AUTENTICAÇÃO, não conexão
      if (error.code === '42501' || error.code === '42P01' || error.code === 'PGRST116' ||
          error.code === 'PGRST301' || error.code === 'PGRST302' || error.code === 'PGRST303') {
        return true; // É um erro de permissão, autenticação ou tabela, não de conexão
      }
      
      // Verificar se é erro de rede (conexão real)
      const errorMessage = error.message || '';
      if (errorMessage.includes('fetch') || 
          errorMessage.includes('network') || 
          errorMessage.includes('Failed to fetch') ||
          errorMessage.includes('timeout')) {
        return false; // É erro de conexão
      }
      
      // Se não for erro conhecido, assumir que pode ser conexão
      // Mas por padrão retornar true para não criar falso positivo
      return true;
    }

    return true;
  } catch (error: any) {
    // Erro de rede ou conexão
    const errorMessage = error?.message || '';
    if (errorMessage.includes('fetch') || 
        errorMessage.includes('network') || 
        errorMessage.includes('Failed to fetch') ||
        errorMessage.includes('timeout')) {
      return false; // É erro de conexão
    }
    // Outros erros podem não ser de conexão
    return true;
  }
}

// Função principal de monitoramento
export function startGlobalConnectionMonitor(enableLogs = true) {
  // Evitar múltiplas instâncias
  if (globalHealthCheckInterval) {
    if (enableLogs) {
      console.log('🔌 [Supabase Global] Monitor já está rodando, ignorando nova inicialização');
    }
    return;
  }

  let lastSuccessfulCheck = Date.now();
  let consecutiveFailures = 0;

  const performHealthCheck = async () => {
    try {
      const isDbConnected = await checkSupabaseConnection();
      // NÃO verificar subscriptions aqui - o DataContext cuida disso
      // Subscriptions podem estar temporariamente desconectadas sem ser um problema real
      const isConnected = isDbConnected;

      if (isConnected) {
        // Conexão OK
        if (!globalConnectionStatus.isConnected) {
          // Era desconectado, agora reconectou
          globalConnectionStatus.isConnected = true;
          globalConnectionStatus.lastConnection = Date.now();
          globalConnectionStatus.reconnectCount++;
          
          if (enableLogs) {
            console.log('✅ [Supabase Global] Conexão restaurada! Reconectando...');
          }

          // Disparar evento de reconexão
          window.dispatchEvent(new CustomEvent(CONNECTION_EVENTS.RECONNECTED, {
            detail: { timestamp: Date.now() }
          }));

          // Disparar evento para refresh de dados
          window.dispatchEvent(new CustomEvent(CONNECTION_EVENTS.REFRESH_NEEDED, {
            detail: { reason: 'reconnected', timestamp: Date.now() }
          }));

          // Também disparar o evento que o DataContext escuta diretamente
          window.dispatchEvent(new CustomEvent('force-reload-data', {
            detail: { timestamp: Date.now(), reason: 'reconnected' }
          }));

          globalIsReconnecting = false;
        }

        lastSuccessfulCheck = Date.now();
        consecutiveFailures = 0;
        globalConnectionStatus.lastConnection = Date.now();
      } else {
        // Desconectado
        consecutiveFailures++;
        const timeSinceLastConnection = Date.now() - lastSuccessfulCheck;

        if (globalConnectionStatus.isConnected || consecutiveFailures >= 2) {
          // Acabou de desconectar OU múltiplas falhas consecutivas
          globalConnectionStatus.isConnected = false;
          globalConnectionStatus.disconnectCount++;
          
          if (enableLogs) {
            console.warn('⚠️ [Supabase Global] Desconexão detectada:', {
              consecutiveFailures,
              timeSinceLastConnection: `${Math.round(timeSinceLastConnection / 1000)}s`
            });
          }

          // Disparar evento de desconexão
          window.dispatchEvent(new CustomEvent(CONNECTION_EVENTS.DISCONNECTED, {
            detail: { 
              timestamp: Date.now(),
              consecutiveFailures,
              timeSinceLastConnection
            }
          }));

          // Iniciar tentativas de reconexão
          if (!globalIsReconnecting) {
            globalIsReconnecting = true;
            attemptReconnection(enableLogs);
          }
        }
      }
    } catch (error: any) {
      if (enableLogs) {
        console.error('❌ [Supabase Global] Erro no health check:', error.message);
      }
    }
  };

  // Health check a cada 30 segundos (menos agressivo para evitar loops)
  globalHealthCheckInterval = setInterval(performHealthCheck, 30000);

  // Health check inicial
  performHealthCheck();

  if (enableLogs) {
    console.log('🔌 [Supabase Global] Monitor de conexão iniciado');
  }
}

// Função para tentar reconexão
async function attemptReconnection(enableLogs = true) {
  if (globalReconnectTimeout || globalIsReconnecting) {
    if (enableLogs) {
      console.log('🔌 [Supabase Global] Reconexão já em andamento, ignorando nova tentativa');
    }
    return; // Já está tentando reconectar
  }
  
  globalIsReconnecting = true;

  let attemptCount = 0;
  const maxAttempts = 10; // Máximo de 10 tentativas

  const tryReconnect = async () => {
    attemptCount++;

    if (enableLogs) {
      console.log(`🔄 [Supabase Global] Tentativa de reconexão ${attemptCount}/${maxAttempts}...`);
    }

    try {
      const isConnected = await checkSupabaseConnection();
      
      if (isConnected) {
        // Reconectou!
        globalConnectionStatus.isConnected = true;
        globalConnectionStatus.lastConnection = Date.now();
        globalConnectionStatus.reconnectCount++;
        globalReconnectTimeout = null;

        if (enableLogs) {
          console.log('✅ [Supabase Global] Reconexão bem-sucedida!');
        }

        // Disparar eventos
        window.dispatchEvent(new CustomEvent(CONNECTION_EVENTS.RECONNECTED, {
          detail: { timestamp: Date.now(), attemptCount }
        }));

        window.dispatchEvent(new CustomEvent(CONNECTION_EVENTS.REFRESH_NEEDED, {
          detail: { reason: 'reconnected', timestamp: Date.now() }
        }));

        // Também disparar o evento que o DataContext escuta diretamente
        window.dispatchEvent(new CustomEvent('force-reload-data', {
          detail: { timestamp: Date.now(), reason: 'reconnected' }
        }));
      } else {
        // Ainda desconectado
        if (attemptCount < maxAttempts) {
          // Tentar novamente após 5 segundos
          globalReconnectTimeout = setTimeout(tryReconnect, 5000);
        } else {
        // Máximo de tentativas atingido
        globalReconnectTimeout = null;
        globalIsReconnecting = false; // Limpar flag para permitir nova tentativa no próximo health check
          if (enableLogs) {
            console.error('❌ [Supabase Global] Não foi possível reconectar após múltiplas tentativas');
          }
        }
      }
    } catch (error: any) {
      if (enableLogs) {
        console.error('❌ [Supabase Global] Erro ao tentar reconectar:', error.message);
      }

      if (attemptCount < maxAttempts) {
        // Tentar novamente após 5 segundos
        globalReconnectTimeout = setTimeout(tryReconnect, 5000);
      } else {
        globalReconnectTimeout = null;
        globalIsReconnecting = false; // Limpar flag para permitir nova tentativa no próximo health check
      }
    }
  };

  // Primeira tentativa imediata
  tryReconnect();
}

// Função para parar o monitoramento
export function stopGlobalConnectionMonitor() {
  if (globalHealthCheckInterval) {
    clearInterval(globalHealthCheckInterval);
    globalHealthCheckInterval = null;
  }

  if (globalReconnectTimeout) {
    clearTimeout(globalReconnectTimeout);
    globalReconnectTimeout = null;
  }
}

// Hook para usar o monitoramento
export function useSupabaseConnectionMonitor(options: {
  onDisconnect?: () => void;
  onReconnect?: () => void;
  onRefreshNeeded?: () => void;
  enableLogs?: boolean;
} = {}) {
  const {
    onDisconnect,
    onReconnect,
    onRefreshNeeded,
    enableLogs = true
  } = options;

  useEffect(() => {
    // Iniciar monitoramento global
    startGlobalConnectionMonitor(enableLogs);

    // Escutar eventos customizados
    const handleDisconnect = (event: CustomEvent) => {
      if (enableLogs) {
        console.log('📡 [Supabase Monitor] Evento de desconexão recebido');
      }
      onDisconnect?.();
    };

    const handleReconnect = (event: CustomEvent) => {
      if (enableLogs) {
        console.log('📡 [Supabase Monitor] Evento de reconexão recebido');
      }
      onReconnect?.();
    };

    const handleRefreshNeeded = (event: CustomEvent) => {
      if (enableLogs) {
        console.log('📡 [Supabase Monitor] Evento de refresh necessário recebido');
      }
      onRefreshNeeded?.();
    };

    window.addEventListener(CONNECTION_EVENTS.DISCONNECTED, handleDisconnect as EventListener);
    window.addEventListener(CONNECTION_EVENTS.RECONNECTED, handleReconnect as EventListener);
    window.addEventListener(CONNECTION_EVENTS.REFRESH_NEEDED, handleRefreshNeeded as EventListener);

    return () => {
      window.removeEventListener(CONNECTION_EVENTS.DISCONNECTED, handleDisconnect as EventListener);
      window.removeEventListener(CONNECTION_EVENTS.RECONNECTED, handleReconnect as EventListener);
      window.removeEventListener(CONNECTION_EVENTS.REFRESH_NEEDED, handleRefreshNeeded as EventListener);
      // NÃO parar o monitor global aqui - ele deve persistir globalmente
      // O cleanup do intervalo é feito pelo próprio monitor global
    };
  }, [onDisconnect, onReconnect, onRefreshNeeded, enableLogs]);

  return globalConnectionStatus;
}

// Exportar eventos para uso em outras partes do código
export { CONNECTION_EVENTS };

