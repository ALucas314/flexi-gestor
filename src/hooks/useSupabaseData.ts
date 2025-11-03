/**
 * 🔄 Hook Customizado para Gerenciar Dados do Supabase com Reconexão Automática
 * 
 * Este hook centraliza o gerenciamento de dados do Supabase com:
 * - Reconexão automática silenciosa
 * - Retry automático em todas as operações
 * - Cache em memória e localStorage
 * - Subscriptions Realtime
 * - Refresh periódico automático
 */

import { useState, useEffect, useCallback, useRef } from 'react';
import { supabase } from '@/lib/supabase';
import { connectionManager, withRetry, registerRealtimeChannel, unregisterRealtimeChannel, ConnectionStatus } from '@/lib/supabaseConnection';
import { useWorkspace } from '@/contexts/WorkspaceContext';
import { useAuth } from '@/contexts/AuthContext';

interface UseSupabaseDataOptions<T> {
  table: string;
  userIdField?: string; // Campo que identifica o usuário/workspace (padrão: 'usuario_id')
  cacheKey?: string; // Chave para localStorage (padrão: `flexi-${table}`)
  orderBy?: { column: string; ascending?: boolean };
  filter?: string; // Filtro adicional SQL (ex: "status=eq.ativo")
  select?: string; // Campos a selecionar (padrão: '*')
  mapper?: (item: any) => T; // Função para mapear dados do banco para o formato esperado
  refreshInterval?: number; // Intervalo de refresh automático em ms (padrão: 60000 = 60s)
  enableRealtime?: boolean; // Habilitar subscriptions Realtime (padrão: true)
}

/**
 * Hook para gerenciar dados do Supabase com reconexão automática
 */
export function useSupabaseData<T>(options: UseSupabaseDataOptions<T>) {
  const {
    table,
    userIdField = 'usuario_id',
    cacheKey,
    orderBy,
    filter,
    select = '*',
    mapper,
    refreshInterval = 60000,
    enableRealtime = true
  } = options;

  const { workspaceAtivo } = useWorkspace();
  const { user } = useAuth();

  const [data, setData] = useState<T[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const dataCacheRef = useRef<T[]>([]);
  const lastSuccessfulLoadRef = useRef<number>(0);
  const isReconnectingRef = useRef<boolean>(false);
  const subscriptionRef = useRef<any>(null);
  const refreshIntervalRef = useRef<NodeJS.Timeout | null>(null);

  // Chave para localStorage baseada na tabela e workspace
  const storageKey = cacheKey || `flexi-${table}-${workspaceAtivo?.id || 'default'}`;
  const channelKey = `${table}-${workspaceAtivo?.id || 'default'}`;

  // 💾 Salvar dados no localStorage
  const saveToLocalStorage = useCallback((items: T[]) => {
    try {
      if (workspaceAtivo?.id) {
        localStorage.setItem(storageKey, JSON.stringify(items));
      }
    } catch (error) {
      // Silencioso
    }
  }, [storageKey, workspaceAtivo?.id]);

  // 📦 Carregar dados do localStorage
  const loadFromLocalStorage = useCallback((): T[] => {
    try {
      if (workspaceAtivo?.id) {
        const saved = localStorage.getItem(storageKey);
        if (saved) {
          return JSON.parse(saved) || [];
        }
      }
    } catch (error) {
      // Silencioso
    }
    return [];
  }, [storageKey, workspaceAtivo?.id]);

  // 🔄 Carregar dados do Supabase com retry automático
  const loadData = useCallback(async (silent: boolean = false) => {
    if (!workspaceAtivo?.id) {
      // Se não tem workspace, carregar do localStorage
      const saved = loadFromLocalStorage();
      if (saved.length > 0) {
        setData(saved);
        dataCacheRef.current = saved;
      }
      setIsLoading(false);
      return;
    }

    try {
      if (!silent && !isReconnectingRef.current) {
        setIsLoading(true);
      }

      // Usar wrapper com retry automático
      const result = await withRetry(
        async () => {
          let query = supabase
            .from(table)
            .select(select)
            .eq(userIdField, workspaceAtivo.id);

          // Aplicar filtro adicional se fornecido
          if (filter) {
            // Parsear filtro SQL simples (ex: "status=eq.ativo" ou "campo=gt.0")
            const match = filter.match(/(\w+)\s*=\s*(eq|gt|gte|lt|lte|neq|like)\s*\.\s*(\w+)/);
            if (match) {
              const [, column, operator, value] = match;
              query = query.filter(column, operator, value);
            }
          }

          // Aplicar ordenação se fornecida
          if (orderBy) {
            query = query.order(orderBy.column, { ascending: orderBy.ascending !== false });
          }

          const { data: result, error } = await query;

          if (error) throw error;
          return result;
        },
        {
          maxRetries: 3,
          onRetry: () => {
            // Silencioso - retry automático em background
          }
        }
      );

      // Mapear dados se mapper fornecido
      const mapped: T[] = mapper 
        ? (result || []).map((item: any) => mapper(item))
        : (result || []) as T[];

      // Atualizar estado, cache e localStorage
      setData(mapped);
      dataCacheRef.current = mapped;
      saveToLocalStorage(mapped);
      lastSuccessfulLoadRef.current = Date.now();
      isReconnectingRef.current = false;
      setIsLoading(false);

    } catch (error: any) {
      // Preservar dados existentes em caso de erro
      if (dataCacheRef.current.length > 0) {
        setData(dataCacheRef.current);
      } else {
        const saved = loadFromLocalStorage();
        if (saved.length > 0) {
          setData(saved);
          dataCacheRef.current = saved;
        }
      }
      
      isReconnectingRef.current = true;
      setIsLoading(false);
    }
  }, [table, userIdField, workspaceAtivo?.id, filter, orderBy, select, mapper, saveToLocalStorage, loadFromLocalStorage]);

  // 🔄 Operação genérica com retry automático
  const executeOperation = useCallback(async <R>(
    operation: () => Promise<R>,
    options: { maxRetries?: number } = {}
  ): Promise<R> => {
    return await withRetry(operation, {
      maxRetries: options.maxRetries || 3,
      onRetry: () => {
        // Silencioso - retry automático
      }
    });
  }, []);

  // ➕ Inserir dados com retry automático
  const insert = useCallback(async (items: any | any[]): Promise<any> => {
    if (!workspaceAtivo?.id) {
      throw new Error('Workspace não selecionado');
    }

    const itemsArray = Array.isArray(items) ? items : [items];
    
    // Adicionar usuario_id a cada item se não existir
    const itemsWithUserId = itemsArray.map(item => ({
      ...item,
      [userIdField]: workspaceAtivo.id
    }));

    const result = await executeOperation(async () => {
      const { data, error } = await supabase
        .from(table)
        .insert(itemsWithUserId)
        .select(select);

      if (error) throw error;
      return data;
    });

    // Recarregar dados silenciosamente após inserção
    loadData(true).catch(() => {
      // Silencioso
    });

    return result;
  }, [table, userIdField, workspaceAtivo?.id, select, executeOperation, loadData]);

  // ✏️ Atualizar dados com retry automático
  const update = useCallback(async (id: string, updates: any): Promise<void> => {
    if (!workspaceAtivo?.id) {
      throw new Error('Workspace não selecionado');
    }

    await executeOperation(async () => {
      const { error } = await supabase
        .from(table)
        .update(updates)
        .eq('id', id)
        .eq(userIdField, workspaceAtivo.id);

      if (error) throw error;
    });

    // Recarregar dados silenciosamente após atualização
    loadData(true).catch(() => {
      // Silencioso
    });
  }, [table, userIdField, workspaceAtivo?.id, executeOperation, loadData]);

  // 🗑️ Deletar dados com retry automático
  const remove = useCallback(async (id: string): Promise<void> => {
    if (!workspaceAtivo?.id) {
      throw new Error('Workspace não selecionado');
    }

    await executeOperation(async () => {
      const { error } = await supabase
        .from(table)
        .delete()
        .eq('id', id)
        .eq(userIdField, workspaceAtivo.id);

      if (error) throw error;
    });

    // Recarregar dados silenciosamente após deleção
    loadData(true).catch(() => {
      // Silencioso
    });
  }, [table, userIdField, workspaceAtivo?.id, executeOperation, loadData]);

  // 🔄 Setup inicial e subscriptions
  useEffect(() => {
    if (!user || !workspaceAtivo?.id) {
      setIsLoading(false);
      return;
    }

    // Carregar dados inicialmente
    loadData();

    // Carregar do localStorage se disponível (fallback rápido)
    const saved = loadFromLocalStorage();
    if (saved.length > 0 && data.length === 0) {
      setData(saved);
      dataCacheRef.current = saved;
    }

    // Listener para mudanças de status de conexão
    const unsubscribeConnectionStatus = connectionManager.onStatusChange((status) => {
      if (status === ConnectionStatus.CONNECTED) {
        // Quando reconectar, recarregar dados silenciosamente
        loadData(true).catch(() => {
          // Silencioso
        });
      }
    });

    // Configurar subscription Realtime se habilitado
    if (enableRealtime) {
      const setupSubscription = () => {
        if (subscriptionRef.current) {
          supabase.removeChannel(subscriptionRef.current);
          unregisterRealtimeChannel(channelKey);
        }

        try {
          subscriptionRef.current = supabase
            .channel(`${table}-changes-${workspaceAtivo.id}-${Date.now()}`)
            .on('postgres_changes',
              {
                event: '*',
                schema: 'public',
                table: table,
                filter: `${userIdField}=eq.${workspaceAtivo.id}`
              },
              async () => {
                // Atualização silenciosa em background
                loadData(true).catch(() => {
                  // Silencioso
                });
              }
            )
            .subscribe((status) => {
              if (status === 'SUBSCRIBED') {
                registerRealtimeChannel(channelKey, subscriptionRef.current);
              }
            });
        } catch (error) {
          // Silencioso - erro na subscription
        }
      };

      setupSubscription();

      // Reconectar subscription quando status mudar
      connectionManager.onStatusChange((status) => {
        if (status === ConnectionStatus.CONNECTED) {
          setupSubscription();
        }
      });
    }

    // Refresh periódico silencioso
    refreshIntervalRef.current = setInterval(async () => {
      if (connectionManager.getStatus() === ConnectionStatus.CONNECTED) {
        loadData(true).catch(() => {
          // Silencioso
        });
      }
    }, refreshInterval);

    // 🧹 Cleanup
    return () => {
      unsubscribeConnectionStatus();
      if (refreshIntervalRef.current) {
        clearInterval(refreshIntervalRef.current);
      }
      if (subscriptionRef.current) {
        supabase.removeChannel(subscriptionRef.current);
        unregisterRealtimeChannel(channelKey);
      }
    };
  }, [user?.id, workspaceAtivo?.id, table, userIdField, loadData, loadFromLocalStorage, enableRealtime, channelKey, refreshInterval]);

  // Carregar do localStorage ao montar
  useEffect(() => {
    if (workspaceAtivo?.id && data.length === 0) {
      const saved = loadFromLocalStorage();
      if (saved.length > 0) {
        setData(saved);
        dataCacheRef.current = saved;
      }
    }
  }, [workspaceAtivo?.id, loadFromLocalStorage, data.length]);

  return {
    data,
    isLoading,
    loadData,
    insert,
    update,
    remove,
    executeOperation,
    refresh: () => loadData(true)
  };
}

