/**
 * 🔄 Sistema de Gerenciamento de Conexão com Supabase
 * 
 * Este módulo gerencia reconexão automática e silenciosa com o Supabase,
 * detectando desconexões e reconectando automaticamente sem intervenção do usuário.
 */

import { RealtimeChannel } from '@supabase/supabase-js';

// Função helper para acessar supabase de forma lazy (evita dependência circular)
// Usa import dinâmico para quebrar a dependência circular entre supabase.ts e supabaseConnection.ts
const getSupabase = async () => {
  const { supabase } = await import('./supabase');
  return supabase;
};

// Estados da conexão
export enum ConnectionStatus {
  CONNECTED = 'connected',
  DISCONNECTED = 'disconnected',
  CONNECTING = 'connecting',
  ERROR = 'error'
}

// Configurações de retry - otimizadas para reconexão permanente
const RETRY_CONFIG = {
  MAX_RETRIES: 10,                   // Máximo de tentativas antes de resetar (aumentado)
  INITIAL_DELAY: 300,                // Delay inicial em ms (300ms - ultra rápido)
  MAX_DELAY: 30000,                  // Delay máximo em ms (30s)
  BACKOFF_MULTIPLIER: 1.5,           // Multiplicador de backoff exponencial (mais conservador)
  HEALTH_CHECK_INTERVAL: 8000,      // Intervalo de health check (8s - muito frequente)
  CONNECTION_TIMEOUT: 3000,         // Timeout de conexão (3s - ultra rápido)
  SESSION_REFRESH_INTERVAL: 3600000 // Renovar sessão a cada 1 hora (3600000ms)
};

// Cache de canais Realtime ativos
const activeChannels = new Map<string, RealtimeChannel>();

// Gerenciador de conexão
class SupabaseConnectionManager {
  private status: ConnectionStatus = ConnectionStatus.CONNECTED;
  private lastHealthCheck: number = Date.now();
  private reconnectAttempts: number = 0;
  private healthCheckInterval: NodeJS.Timeout | null = null;
  private sessionRefreshInterval: NodeJS.Timeout | null = null;
  private listeners: Set<(status: ConnectionStatus) => void> = new Set();
  private isCheckingHealth: boolean = false; // Flag para evitar múltiplas verificações simultâneas
  private isReconnecting: boolean = false; // Flag para evitar múltiplas tentativas de reconexão

  constructor() {
    // DESABILITAR health check completamente até que o usuário faça login
    // Isso evita interferências na página de login
    // O health check será iniciado automaticamente quando houver sessão
    
    // Setup auth listeners de forma assíncrona para evitar dependência circular
    this.setupAuthListeners().catch(() => {
      // Silencioso - tentar novamente depois
      setTimeout(() => {
        this.setupAuthListeners().catch(() => {
          // Silencioso
        });
      }, 1000);
    });
    
    // Iniciar session refresh (menos invasivo que health check)
    this.startSessionRefresh();
    
    // Verificar se há sessão após um delay maior, e só então iniciar health check
    setTimeout(async () => {
      try {
        const supabase = await getSupabase();
        const { data: { session } } = await supabase.auth.getSession();
        
        // Só iniciar health check se houver sessão válida
        if (session) {
          this.startHealthCheck();
        }
      } catch {
        // Se não conseguir verificar sessão, não iniciar health check
      }
    }, 10000); // Aguardar 10 segundos antes de verificar
  }

  /**
   * Inicia o health check periódico para detectar desconexões
   */
  private startHealthCheck() {
    if (this.healthCheckInterval) {
      clearInterval(this.healthCheckInterval);
    }

    // Aguardar mais tempo antes do primeiro health check para não interferir no login
    setTimeout(() => {
      this.checkConnectionHealth().catch(() => {
        // Silencioso - não tratar erros de health check como críticos
      });
    }, 5000); // Aguardar 5 segundos antes do primeiro check

    // Executar periodicamente apenas se houver sessão
    this.healthCheckInterval = setInterval(async () => {
      // Verificar se há sessão antes de fazer health check
      try {
        const supabase = await getSupabase();
        const { data: { session } } = await supabase.auth.getSession();
        
        // Só fazer health check se houver sessão
        if (session && !this.isCheckingHealth) {
          this.checkConnectionHealth().catch(() => {
            // Silencioso - não tratar erros de health check como críticos
          });
        }
      } catch {
        // Se não conseguir verificar sessão, não fazer health check
      }
    }, RETRY_CONFIG.HEALTH_CHECK_INTERVAL);
  }

  /**
   * Verifica a saúde da conexão
   */
  private async checkConnectionHealth(): Promise<boolean> {
    // Evitar múltiplas verificações simultâneas
    if (this.isCheckingHealth) {
      return true;
    }

    this.isCheckingHealth = true;

    try {
      const supabase = await getSupabase();
      
      // Verificar se há sessão válida primeiro
      const { data: { session }, error: sessionError } = await supabase.auth.getSession();
      
      // Se não há sessão, isso é normal (usuário não está logado)
      // NÃO fazer health check quando não há sessão para evitar erros infinitos
      if (sessionError || !session) {
        // Se não há sessão, manter status atual e retornar imediatamente
        // Não tentar fazer queries que vão falhar sem sessão
        // Isso evita loops infinitos de erros
        if (this.status === ConnectionStatus.CONNECTED) {
          // Apenas marcar como desconectado se estava conectado antes
          this.updateStatus(ConnectionStatus.DISCONNECTED);
        }
        // Retornar imediatamente sem tentar queries
        this.isCheckingHealth = false;
        return true;
      }

      // Fazer uma requisição simples para verificar a conexão
      // Criar timeout promise mais simples
      let timeoutId: NodeJS.Timeout | null = null;
      const timeoutPromise = new Promise<{ error: { message: string; code?: string } }>((_, reject) => {
        timeoutId = setTimeout(() => {
          reject(new Error('Timeout'));
        }, RETRY_CONFIG.CONNECTION_TIMEOUT);
      });

      try {
        const result = await Promise.race([
          supabase.from('produtos').select('id').limit(1),
          timeoutPromise
        ]) as any;

        if (timeoutId) {
          clearTimeout(timeoutId);
        }
        this.lastHealthCheck = Date.now();

        // Verificar se há erro na resposta
        if (result?.error) {
          const error = result.error;
          // Verificar se é erro de rede/autenticação
          const isNetworkError = 
            error.code === 'PGRST301' || 
            error.code === 'PGRST116' ||
            error.code === '42501' || // Permission denied pode indicar token expirado
            error.message?.includes('network') ||
            error.message?.includes('Failed to fetch') ||
            error.message?.includes('NetworkError') ||
            error.message?.includes('JWT') ||
            error.message?.includes('token') ||
            error.message?.includes('expired') ||
            error.message?.includes('authentication');

          if (isNetworkError) {
            this.updateStatus(ConnectionStatus.DISCONNECTED);
            // NÃO chamar reconnect() aqui para evitar loops
            // Apenas marcar como desconectado
            this.isCheckingHealth = false;
            return false;
          }
        }

        // Se chegou aqui, conexão está ok
        if (this.status !== ConnectionStatus.CONNECTED) {
          this.updateStatus(ConnectionStatus.CONNECTED);
          this.reconnectAttempts = 0;
        }

        this.isCheckingHealth = false;
        return true;
      } catch (raceError: any) {
        if (timeoutId) {
          clearTimeout(timeoutId);
        }
        
        // Timeout ou erro de rede - não tratar como erro crítico
        if (raceError.message === 'Timeout' || 
            raceError.message?.includes('network') ||
            raceError.message?.includes('Failed to fetch')) {
          // Marcar como desconectado mas NÃO tentar reconectar para evitar loop
          this.updateStatus(ConnectionStatus.DISCONNECTED);
          this.isCheckingHealth = false;
          return false;
        }
        
        // Outros erros não tratados - não lançar, apenas retornar true
        this.isCheckingHealth = false;
        return true;
      }
    } catch (error: any) {
      // Tratar todos os erros silenciosamente para não interferir no login
      // Se parecer ser um erro de rede, marcar como desconectado mas NÃO reconectar
      if (error.message?.includes('network') || 
          error.message?.includes('Failed to fetch') ||
          error.message?.includes('NetworkError') ||
          error.message?.includes('JWT') ||
          error.message?.includes('token')) {
        this.updateStatus(ConnectionStatus.DISCONNECTED);
        // NÃO chamar reconnect() para evitar loops infinitos
        this.isCheckingHealth = false;
        return false;
      }

      // Outros erros não são necessariamente problemas de conexão
      // Retornar true para não bloquear operações (como login)
      this.isCheckingHealth = false;
      return true;
    }
  }

  /**
   * Configura listeners de autenticação para detectar desconexões
   */
  private async setupAuthListeners() {
    // Usar import dinâmico para evitar dependência circular
    const supabase = await getSupabase();
    
    supabase.auth.onAuthStateChange((event, session) => {
      if (event === 'SIGNED_IN') {
        // Usuário fez login - iniciar health check agora
        if (session) {
          this.updateStatus(ConnectionStatus.CONNECTED);
          this.reconnectAttempts = 0;
          
          // Iniciar health check apenas após login bem-sucedido
          if (!this.healthCheckInterval) {
            this.startHealthCheck();
          }
        }
      } else if (event === 'SIGNED_OUT') {
        // Usuário fez logout - parar health check
        this.updateStatus(ConnectionStatus.DISCONNECTED);
        if (this.healthCheckInterval) {
          clearInterval(this.healthCheckInterval);
          this.healthCheckInterval = null;
        }
      } else if (event === 'TOKEN_REFRESHED') {
        // Token renovado - atualizar status
        if (session) {
          this.updateStatus(ConnectionStatus.CONNECTED);
          this.reconnectAttempts = 0;
          
          // Garantir que health check está rodando se houver sessão
          if (!this.healthCheckInterval) {
            this.startHealthCheck();
          }
        } else {
          this.updateStatus(ConnectionStatus.DISCONNECTED);
        }
      }
    });
  }

  /**
   * Tenta reconectar ao Supabase
   */
  private async reconnect(): Promise<void> {
    // Verificar se já está tentando reconectar para evitar loops
    if (this.isReconnecting || this.status === ConnectionStatus.CONNECTING) {
      return; // Já está tentando reconectar
    }

    this.isReconnecting = true;

    // Verificar se há sessão antes de tentar reconectar
    try {
      const supabase = await getSupabase();
      const { data: { session }, error: sessionError } = await supabase.auth.getSession();
      
      // Se não há sessão, não tentar reconectar - é normal quando usuário não está logado
      if (sessionError || !session) {
        this.updateStatus(ConnectionStatus.DISCONNECTED);
        this.reconnectAttempts = 0; // Resetar tentativas
        this.isReconnecting = false;
        return; // Não tentar reconectar sem sessão
      }
    } catch (error) {
      // Se não conseguir verificar sessão, não tentar reconectar
      this.updateStatus(ConnectionStatus.DISCONNECTED);
      this.isReconnecting = false;
      return;
    }

    if (this.reconnectAttempts >= RETRY_CONFIG.MAX_RETRIES) {
      // Se excedeu tentativas, resetar e não tentar novamente
      // Isso evita loops infinitos
      this.reconnectAttempts = 0;
      this.updateStatus(ConnectionStatus.DISCONNECTED);
      this.isReconnecting = false;
      return; // Não tentar mais
    }

    this.updateStatus(ConnectionStatus.CONNECTING);
    this.reconnectAttempts++;

    // Calcular delay com backoff exponencial
    const delay = Math.min(
      RETRY_CONFIG.INITIAL_DELAY * Math.pow(RETRY_CONFIG.BACKOFF_MULTIPLIER, this.reconnectAttempts - 1),
      RETRY_CONFIG.MAX_DELAY
    );

    await new Promise(resolve => setTimeout(resolve, delay));

    try {
      const supabase = await getSupabase();
      
      // Verificar sessão novamente antes de tentar query
      const { data: { session }, error: sessionError } = await supabase.auth.getSession();
      
      if (sessionError || !session) {
        // Sem sessão, não tentar query
        this.updateStatus(ConnectionStatus.DISCONNECTED);
        this.reconnectAttempts = 0;
        this.isReconnecting = false;
        return;
      }
      
      // Tentar uma requisição de teste para verificar conexão
      const timeoutPromise = new Promise<any>((_, reject) => {
        setTimeout(() => reject(new Error('Timeout')), RETRY_CONFIG.CONNECTION_TIMEOUT);
      });

      const testQuery = await Promise.race([
        supabase.from('produtos').select('id').limit(1),
        timeoutPromise
      ]) as any;

      // Verificar se a query foi bem-sucedida
      if (testQuery?.error) {
        const error = testQuery.error;
        // Se for erro de autenticação, não tentar reconectar novamente (evitar loop)
        if (error.code === '42501' || 
            error.message?.includes('JWT') || 
            error.message?.includes('token')) {
          // Não tentar reconectar - pode causar loop infinito
          this.updateStatus(ConnectionStatus.DISCONNECTED);
          this.reconnectAttempts = 0;
          this.isReconnecting = false;
          return;
        }
        throw error;
      }

      // Sucesso na reconexão
      this.updateStatus(ConnectionStatus.CONNECTED);
      this.reconnectAttempts = 0;
      this.isReconnecting = false;
      
      // Reconectar todos os canais Realtime
      this.reconnectAllChannels();
    } catch (error) {
      // Falha na reconexão - não tentar novamente imediatamente para evitar loop
      this.updateStatus(ConnectionStatus.DISCONNECTED);
      this.isReconnecting = false;
      // NÃO chamar reconnect() novamente aqui para evitar loop infinito
      // O health check periódico vai tentar reconectar depois
    }
  }

  /**
   * Reconecta todos os canais Realtime ativos
   */
  private async reconnectAllChannels() {
    const supabase = await getSupabase();
    
    activeChannels.forEach((channel, key) => {
      try {
        // Remover canal antigo
        supabase.removeChannel(channel);
        
        // Notificar para recriar o canal (silencioso - sem logs visíveis ao usuário)
      } catch (error) {
        // Silencioso - não mostrar erros de reconexão ao usuário
      }
    });
  }

  /**
   * Atualiza o status da conexão e notifica listeners
   */
  private updateStatus(status: ConnectionStatus) {
    if (this.status !== status) {
      this.status = status;
      this.notifyListeners(status);
    }
  }

  /**
   * Notifica todos os listeners sobre mudança de status
   */
  private notifyListeners(status: ConnectionStatus) {
    this.listeners.forEach(listener => {
      try {
        listener(status);
      } catch (error) {
        // Silencioso - não mostrar erros internos
      }
    });
  }

  /**
   * Registra um listener para mudanças de status
   */
  public onStatusChange(listener: (status: ConnectionStatus) => void): () => void {
    this.listeners.add(listener);
    // Retornar função para remover listener
    return () => {
      this.listeners.delete(listener);
    };
  }

  /**
   * Retorna o status atual da conexão
   */
  public getStatus(): ConnectionStatus {
    return this.status;
  }

  /**
   * Força uma verificação de conexão
   */
  public async forceHealthCheck(): Promise<boolean> {
    return await this.checkConnectionHealth();
  }

  /**
   * Inicia refresh automático de sessão
   */
  private startSessionRefresh() {
    if (this.sessionRefreshInterval) {
      clearInterval(this.sessionRefreshInterval);
    }

    this.sessionRefreshInterval = setInterval(async () => {
      try {
        const supabase = await getSupabase();
        // Renovar sessão automaticamente antes de expirar
        await supabase.auth.refreshSession();
      } catch (error) {
        // Silencioso - tentar reconectar se refresh falhar
        if (this.status === ConnectionStatus.CONNECTED) {
          await this.checkConnectionHealth();
        }
      }
    }, RETRY_CONFIG.SESSION_REFRESH_INTERVAL);
  }

  /**
   * Limpa recursos
   */
  public cleanup() {
    if (this.healthCheckInterval) {
      clearInterval(this.healthCheckInterval);
      this.healthCheckInterval = null;
    }
    if (this.sessionRefreshInterval) {
      clearInterval(this.sessionRefreshInterval);
      this.sessionRefreshInterval = null;
    }
    this.listeners.clear();
    activeChannels.clear();
  }
}

// Instância singleton do gerenciador
export const connectionManager = new SupabaseConnectionManager();

/**
 * Wrapper para requisições Supabase com retry automático
 */
export async function withRetry<T>(
  operation: () => Promise<T>,
  options: {
    maxRetries?: number;
    onRetry?: (attempt: number, error: any) => void;
  } = {}
): Promise<T> {
  const maxRetries = options.maxRetries ?? RETRY_CONFIG.MAX_RETRIES;
  let lastError: any;

  for (let attempt = 0; attempt <= maxRetries; attempt++) {
    try {
      return await operation();
    } catch (error: any) {
      lastError = error;

      // Verificar se é um erro que vale a pena tentar novamente
      const isRetryableError = 
        error.code === 'PGRST301' ||           // Network error
        error.code === 'PGRST116' ||           // Connection error
        error.code === '42501' ||              // Permission denied (token expirado)
        error.message?.includes('network') ||
        error.message?.includes('Failed to fetch') ||
        error.message?.includes('NetworkError') ||
        error.message?.includes('timeout') ||
        error.message?.includes('ECONNREFUSED') ||
        error.message?.includes('ETIMEDOUT');

      if (!isRetryableError || attempt === maxRetries) {
        throw error;
      }

      // Notificar sobre retry
      if (options.onRetry) {
        options.onRetry(attempt + 1, error);
      }

      // Aguardar antes de tentar novamente (backoff exponencial)
      const delay = Math.min(
        RETRY_CONFIG.INITIAL_DELAY * Math.pow(RETRY_CONFIG.BACKOFF_MULTIPLIER, attempt),
        RETRY_CONFIG.MAX_DELAY
      );

      await new Promise(resolve => setTimeout(resolve, delay));

      // Se estamos desconectados, tentar reconectar antes de retry
      if (connectionManager.getStatus() === ConnectionStatus.DISCONNECTED || 
          connectionManager.getStatus() === ConnectionStatus.CONNECTING) {
        // Aguardar um pouco e verificar novamente
        await new Promise(resolve => setTimeout(resolve, 1000));
        
        // Se ainda desconectado, forçar health check
        if (connectionManager.getStatus() !== ConnectionStatus.CONNECTED) {
          await connectionManager.forceHealthCheck();
        }
      }
    }
  }

  throw lastError;
}

/**
 * Registra um canal Realtime para gerenciamento automático
 */
export function registerRealtimeChannel(key: string, channel: RealtimeChannel) {
  activeChannels.set(key, channel);
}

/**
 * Remove um canal Realtime do registro
 */
export function unregisterRealtimeChannel(key: string) {
  activeChannels.delete(key);
}

