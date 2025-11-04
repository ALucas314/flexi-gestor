/**
 * 🗄️ Contexto de Dados com Supabase
 * 
 * Este contexto gerencia todos os dados usando Supabase como backend.
 * Todos os dados são isolados por usuário usando Row Level Security (RLS).
 */

import React, { createContext, useContext, useState, useEffect, useCallback, useMemo, ReactNode } from 'react';
import { supabase } from '@/lib/supabase';
import { useAuth } from './AuthContext';
import { useWorkspace } from './WorkspaceContext';
import { checkSupabaseStorageCapacityOnce } from '@/lib/storageCapacity';
import { syncProductStockFromBatches } from '@/lib/batches';

// Interfaces dos dados
interface Product {
  id: string;
  name: string;
  description: string;
  category: string;
  price: number;
  stock: number;
  minStock: number;
  sku: string;
  status: "ativo" | "inativo";
  createdAt?: Date;
  updatedAt?: Date;
}

interface Movement {
  id: string;
  type: 'entrada' | 'saida' | 'ajuste';
  productId: string;
  productName?: string;
  product?: { id: string; name: string; sku: string };
  quantity: number;
  unitPrice: number;
  description: string;
  date: Date;
  total: number;
  receiptNumber?: string;
  status?: 'pendente' | 'confirmado' | 'cancelado'; // Campo para controlar status da movimentação
  paymentMethod?: string;
}

interface Notification {
  id: string;
  title: string;
  message: string;
  type: 'success' | 'error' | 'warning' | 'info';
  timestamp: Date;
  read: boolean;
}

interface DataContextType {
  products: Product[];
  movements: Movement[];
  notifications: Notification[];
  categories: string[];
  customUnits: string[];
  isLoading: boolean;
  addProduct: (product: Omit<Product, 'id'>) => Promise<void>;
  updateProduct: (id: string, product: Partial<Product>) => Promise<void>;
  deleteProduct: (id: string) => Promise<void>;
  addMovement: (movement: Omit<Movement, 'id' | 'total'> & { receiptNumber?: string }) => Promise<void>;
  deleteMovement: (id: string) => Promise<void>;
  addNotification: (title: string, message: string, type: 'success' | 'error' | 'warning' | 'info') => Promise<void>;
  markNotificationAsRead: (id: string) => Promise<void>;
  removeNotification: (id: string) => Promise<void>;
  clearAllNotifications: () => Promise<void>;
  // Categorias
  addCategory: (categoryName: string) => Promise<void>;
  deleteCategory: (categoryName: string) => Promise<void>;
  refreshCategories: () => Promise<void>;
  // Unidades de medida
  addCustomUnit: (unitSigla: string) => Promise<void>;
  deleteCustomUnit: (unitSigla: string) => Promise<void>;
  refreshCustomUnits: () => Promise<void>;
  searchGlobal: (term: string) => {
    products: Product[];
    movements: Movement[];
  };
  getDashboardStats: () => {
    totalProducts: number;
    stockValue: number;
    lowStockCount: number;
    todaySales: number;
  };
  refreshData: () => Promise<void>;
  refreshProducts: () => Promise<void>;
  refreshMovements: () => Promise<void>;
}

const DataContext = createContext<DataContextType | undefined>(undefined);

export const DataProvider = ({ children }: { children: ReactNode }) => {
  const [products, setProducts] = useState<Product[]>([]);
  const [movements, setMovements] = useState<Movement[]>([]);
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [categories, setCategories] = useState<string[]>([]);
  const [customUnits, setCustomUnits] = useState<string[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [storageChecked, setStorageChecked] = useState(false);

  const { isAuthenticated, user } = useAuth();
  const { workspaceAtivo } = useWorkspace();

  // 🔄 Função para recarregar apenas os produtos (useCallback para evitar re-criar referência)
  const refreshProducts = useCallback(async () => {
    if (!user?.id || !workspaceAtivo?.id) return;
    
    try {
      // Filtrar produtos APENAS do workspace ativo
      const { data, error } = await supabase
        .from('produtos')
        .select('*')
        .eq('usuario_id', workspaceAtivo.id) // Filtro explícito por workspace
        .order('criado_em', { ascending: false });

      if (error) {
        throw error;
      }

      // Mapear dados do Supabase para o formato esperado
      const mappedProducts: Product[] = (data || []).map((p: any) => ({
        id: p.id,
        name: p.nome,
        description: p.descricao || '',
        category: p.categoria,
        price: parseFloat(p.preco) || 0,
        stock: p.estoque || 0,
        minStock: p.estoque_minimo || 0,
        sku: p.sku,
        status: 'ativo' as const,
        createdAt: new Date(p.criado_em),
        updatedAt: new Date(p.atualizado_em),
        // Campos adicionais mapeados do banco
        unitOfMeasure: p.unidade_medida || 'UN',
        managedByBatch: p.gerenciado_por_lote === true || p.gerenciado_por_lote === 'true' || false
      }));

      setProducts(mappedProducts);
      // Salvar no localStorage como cache de fallback
      try {
        localStorage.setItem(`flexi-products-${workspaceAtivo.id}`, JSON.stringify(mappedProducts));
      } catch (e) {
        // Ignorar erros de localStorage
      }
    } catch (error) {
      console.error('Erro ao carregar produtos');
      // Em caso de erro, tentar carregar do localStorage como fallback
      try {
        const cached = localStorage.getItem(`flexi-products-${workspaceAtivo?.id}`);
        if (cached) {
          const parsed = JSON.parse(cached);
          setProducts(parsed);
        }
      } catch (e) {
        // Ignorar erros de parse
      }
    }
  }, [user?.id, workspaceAtivo?.id]);

  // 🔄 Função para recarregar apenas as movimentações (useCallback para evitar re-criar referência)
  const refreshMovements = useCallback(async () => {
    if (!user?.id || !workspaceAtivo?.id) return;

    try {
      // Filtrar movimentações APENAS do workspace ativo
      const { data, error } = await supabase
        .from('movimentacoes')
        .select(`
          *,
          product:produtos(id, nome, sku)
        `)
        .eq('usuario_id', workspaceAtivo.id) // Filtro explícito por workspace
        .order('criado_em', { ascending: false });

      if (error) {
        throw error;
      }

      // Mapear dados do Supabase para o formato esperado
      const mappedMovements: Movement[] = (data || []).map((m: any) => ({
        id: m.id,
        type: m.tipo,
        productId: m.produto_id,
        productName: m.product?.nome || 'Produto desconhecido',
        product: m.product ? {
          id: m.product.id,
          name: m.product.nome,
          sku: m.product.sku
        } : undefined,
        quantity: m.quantidade,
        unitPrice: parseFloat(m.preco_unitario) || 0,
        description: m.observacoes || '',
        date: new Date(m.criado_em),
        total: parseFloat(m.preco_total) || 0,
        receiptNumber: m.numero_recibo,
        status: (m.status || 'confirmado') as 'pendente' | 'confirmado' | 'cancelado',
        paymentMethod: m.metodo_pagamento || undefined
      }));

      setMovements(mappedMovements);
      // Salvar no localStorage como cache de fallback
      try {
        localStorage.setItem(`flexi-movements-${workspaceAtivo.id}`, JSON.stringify(mappedMovements));
      } catch (e) {
        // Ignorar erros de localStorage
      }
    } catch (error) {
      console.error('Erro ao carregar movimentações');
      // Em caso de erro, tentar carregar do localStorage como fallback
      try {
        const cached = localStorage.getItem(`flexi-movements-${workspaceAtivo?.id}`);
        if (cached) {
          const parsed = JSON.parse(cached);
          setMovements(parsed);
        }
      } catch (e) {
        // Ignorar erros de parse
      }
    }
  }, [user?.id, workspaceAtivo?.id]);

  // 🔄 Função para recarregar todos os dados do Supabase
  const refreshData = useCallback(async () => {
    if (!user?.id) return;

    try {
      setIsLoading(true);

      // Buscar produtos e movimentações em paralelo
      await Promise.all([
        refreshProducts(),
        refreshMovements()
      ]);
    } catch (error) {
      console.error('Erro ao carregar dados');
    } finally {
      setIsLoading(false);
    }
  }, [user?.id, refreshProducts, refreshMovements]);

  // 📦 Carregar notificações do localStorage
  const loadNotificationsFromLocalStorage = useCallback(() => {
    try {
      const saved = localStorage.getItem(`flexi-notifications-${user?.id}`);
      if (saved) {
        const parsed = JSON.parse(saved);
        const processedNotifications = parsed.map((n: any) => ({
          ...n,
          timestamp: new Date(n.timestamp)
        }));
        setNotifications(processedNotifications);
      }
    } catch (error) {
      // Silencioso
    }
  }, [user?.id]);

  // 🔄 Escutar mudanças de workspace para recarregar dados
  useEffect(() => {
    const handleWorkspaceChanged = async () => {
      console.log('🔄 Workspace mudou, recarregando dados...');
      await refreshData();
      loadNotificationsFromLocalStorage();
    };

    // 🆕 Escutar eventos de reconexão global para recarregar dados automaticamente
    const handleForceReload = async () => {
      console.log('🔄 Evento de reload forçado detectado, recarregando dados...');
      await refreshData();
    };

    window.addEventListener('workspace-changed', handleWorkspaceChanged);
    window.addEventListener('force-reload-data', handleForceReload);

    return () => {
      window.removeEventListener('workspace-changed', handleWorkspaceChanged);
      window.removeEventListener('force-reload-data', handleForceReload);
    };
  }, [refreshData, loadNotificationsFromLocalStorage]);

  // 🔄 Carregar dados do Supabase quando o usuário estiver autenticado OU mudar workspace
  useEffect(() => {
    if (isAuthenticated && user && workspaceAtivo) {
      // 🆕 Carregar dados do localStorage PRIMEIRO (instantâneo)
      try {
        const cachedProducts = localStorage.getItem(`flexi-products-${workspaceAtivo.id}`);
        const cachedMovements = localStorage.getItem(`flexi-movements-${workspaceAtivo.id}`);
        if (cachedProducts) {
          setProducts(JSON.parse(cachedProducts));
        }
        if (cachedMovements) {
          setMovements(JSON.parse(cachedMovements));
        }
      } catch (e) {
        // Ignorar erros de parse
      }

      // Carregar dados e notificações
      const loadData = async () => {
        await refreshData();
        loadNotificationsFromLocalStorage();
        if (!storageChecked) {
          // Verifica capacidade do Storage uma vez após carregar dados
          checkSupabaseStorageCapacityOnce().finally(() => setStorageChecked(true));
        }
      };
      loadData();

      // 📡 Gerenciador de Subscriptions Realtime com Reconexão Automática
      let subscriptions: Map<string, any> = new Map();
      let reconnectAttempts: Map<string, number> = new Map(); // Tentativas por tabela
      let lastSuccessfulConnection = Date.now();
      const MAX_RECONNECT_ATTEMPTS = 10;
      const RECONNECT_DELAY = 2000; // 2 segundos
      
      // Debounce map para evitar muitas atualizações simultâneas
      const debounceTimers: Map<string, NodeJS.Timeout> = new Map();
      const DEBOUNCE_DELAY = 300; // 300ms de debounce

      // Função para criar subscription para uma tabela específica
      const createSubscription = (tableName: string, onUpdate: () => Promise<void>) => {
        const channelName = `${tableName}-realtime-${workspaceAtivo.id}-${Date.now()}`;
        const attempts = reconnectAttempts.get(tableName) || 0;
        
        // Se excedeu o máximo de tentativas, não tentar mais
        if (attempts >= MAX_RECONNECT_ATTEMPTS) {
          console.error(`❌ Realtime: ${tableName} - Máximo de tentativas de reconexão atingido`);
          return null;
        }
        
        try {
          console.log(`🔌 Criando subscription para ${tableName}...`);
          const channel = supabase
            .channel(channelName)
            .on(
              'postgres_changes',
              {
                event: '*',
                schema: 'public',
                table: tableName,
                filter: `usuario_id=eq.${workspaceAtivo.id}`
              },
              async (payload) => {
                console.log(`🔄 Realtime: ${tableName} atualizado`, payload.eventType, payload);
                
                // Para eventos DELETE, atualizar imediatamente sem debounce
                // para garantir que os dados sejam atualizados rapidamente
                if (payload.eventType === 'DELETE') {
                  try {
                    console.log(`⚡ DELETE detectado em ${tableName}, atualizando imediatamente...`);
                    await onUpdate();
                    lastSuccessfulConnection = Date.now();
                    reconnectAttempts.delete(tableName);
                    return;
                  } catch (error) {
                    console.error(`Erro ao atualizar ${tableName} via realtime (DELETE):`, error);
                  }
                }
                
                // Para outros eventos (INSERT, UPDATE), usar debounce
                // Limpar timer anterior se existir
                if (debounceTimers.has(tableName)) {
                  clearTimeout(debounceTimers.get(tableName)!);
                }
                
                // Criar novo timer com debounce para evitar muitas atualizações simultâneas
                const timer = setTimeout(async () => {
                  try {
                    await onUpdate();
                    lastSuccessfulConnection = Date.now();
                    reconnectAttempts.delete(tableName); // Resetar contador de tentativas em caso de sucesso
                  } catch (error) {
                    console.error(`Erro ao atualizar ${tableName} via realtime:`, error);
                  } finally {
                    debounceTimers.delete(tableName);
                  }
                }, DEBOUNCE_DELAY);
                
                debounceTimers.set(tableName, timer);
              }
            )
            .subscribe((status) => {
              console.log(`📡 Realtime: ${tableName} - Status: ${status}`);
              
              if (status === 'SUBSCRIBED') {
                console.log(`✅ Realtime: ${tableName} conectado com sucesso`);
                lastSuccessfulConnection = Date.now();
                reconnectAttempts.delete(tableName); // Resetar contador
              } else if (status === 'CHANNEL_ERROR' || status === 'TIMED_OUT' || status === 'CLOSED') {
                console.warn(`⚠️ Realtime: ${tableName} desconectado (${status}), tentando reconectar...`);
                // Remover subscription antiga
                if (subscriptions.has(tableName)) {
                  try {
                    supabase.removeChannel(subscriptions.get(tableName));
                  } catch (e) {
                    console.error(`Erro ao remover channel ${tableName}:`, e);
                  }
                  subscriptions.delete(tableName);
                }
                // Incrementar contador de tentativas
                const currentAttempts = reconnectAttempts.get(tableName) || 0;
                reconnectAttempts.set(tableName, currentAttempts + 1);
                
                // Tentar reconectar após delay
                setTimeout(() => {
                  const newAttempts = reconnectAttempts.get(tableName) || 0;
                  if (newAttempts < MAX_RECONNECT_ATTEMPTS) {
                    console.log(`🔄 Tentando reconectar ${tableName} (tentativa ${newAttempts + 1}/${MAX_RECONNECT_ATTEMPTS})...`);
                    createSubscription(tableName, onUpdate);
                  } else {
                    console.error(`❌ Máximo de tentativas atingido para ${tableName}`);
                  }
                }, RECONNECT_DELAY);
              } else {
                // Logar outros status para debug
                console.log(`📊 Realtime: ${tableName} - Status desconhecido: ${status}`);
              }
            });

          subscriptions.set(tableName, channel);
          return channel;
        } catch (error) {
          console.error(`Erro ao criar subscription para ${tableName}:`, error);
          // Incrementar tentativas mesmo em caso de erro
          const currentAttempts = reconnectAttempts.get(tableName) || 0;
          reconnectAttempts.set(tableName, currentAttempts + 1);
          return null;
        }
      };

      // Função para remover todas as subscriptions
      const removeAllSubscriptions = () => {
        // Limpar todos os timers de debounce primeiro
        debounceTimers.forEach((timer, tableName) => {
          clearTimeout(timer);
        });
        debounceTimers.clear();
        
        subscriptions.forEach((channel, tableName) => {
          try {
            supabase.removeChannel(channel);
            console.log(`🔌 Removendo subscription: ${tableName}`);
          } catch (error) {
            // Ignorar erros ao remover
          }
        });
        subscriptions.clear();
      };

      // Função para reconfigurar todas as subscriptions
      const reconfigureAllSubscriptions = () => {
        // Remover subscriptions antigas primeiro
        removeAllSubscriptions();
        // Resetar contadores de tentativas para permitir nova tentativa
        reconnectAttempts.clear();

        // Criar subscriptions para todas as tabelas configuradas no Realtime
        // 1. produtos
        createSubscription('produtos', async () => {
          await refreshProducts();
        });

        // 2. movimentacoes
        createSubscription('movimentacoes', async () => {
          await refreshMovements();
          await refreshProducts(); // Atualizar produtos também (pode afetar estoque)
        });

        // 3. lotes
        createSubscription('lotes', async () => {
          await refreshProducts(); // Lotes afetam produtos
        });

        // 4. categorias
        createSubscription('categorias', async () => {
          await refreshCategories();
        });

        // 5. unidades_medida
        createSubscription('unidades_medida', async () => {
          await refreshCustomUnits();
        });

        // 6. fornecedores
        createSubscription('fornecedores', async () => {
          // Fornecedores não afetam diretamente o DataContext
          // As páginas de Fornecedores têm suas próprias subscriptions
          // Não fazer refresh aqui para evitar interferência
        });

        // 7. clientes
        createSubscription('clientes', async () => {
          // Clientes não afetam diretamente o DataContext
          // As páginas de Clientes têm suas próprias subscriptions
          // Não fazer refresh aqui para evitar interferência
        });

        // 8. compartilhamentos
        createSubscription('compartilhamentos', async () => {
          // Atualizar dados quando compartilhamentos mudarem
          await refreshData();
        });

        // 9. perfis (opcional - geralmente não precisa atualizar dados)
        createSubscription('perfis', async () => {
          // Perfis geralmente não afetam dados de produtos/movimentações
          // Mas pode ser útil para atualizar UI se necessário
        });

        console.log(`✅ Realtime: ${subscriptions.size} subscriptions criadas`);
      };

      // Configurar todas as subscriptions inicialmente
      console.log('🚀 Iniciando subscriptions real-time...');
      reconfigureAllSubscriptions();

      // 🔄 Health check que detecta desconexão e reconecta automaticamente
      // Verifica a cada 30 segundos se houve conexão recente
      const healthCheckInterval = setInterval(async () => {
        const timeSinceLastConnection = Date.now() - lastSuccessfulConnection;
        
        // Se não houve conexão bem-sucedida nos últimos 60 segundos, reconectar
        if (timeSinceLastConnection > 60000) {
          console.warn('⚠️ Realtime: Sem conexão há mais de 60s, reconectando...');
          try {
            // Se não houve conexão recente, reconectar todas as subscriptions
            // O status das subscriptions é gerenciado pelos callbacks de subscribe()
            reconfigureAllSubscriptions();
            // Recarregar dados silenciosamente para manter sincronizado
            await refreshData();
            lastSuccessfulConnection = Date.now();
          } catch (e) {
            console.error('Erro no health check do Realtime:', e);
            // Tentar reconectar mesmo em caso de erro
            // Resetar contadores para permitir nova tentativa
            reconnectAttempts.clear();
            reconfigureAllSubscriptions();
          }
        }
      }, 30000); // Verifica a cada 30 segundos

      // 🔄 Refresh periódico silencioso dos dados (a cada 30 segundos como fallback)
      // Isso garante que mesmo se o real-time falhar, os dados serão atualizados
      const refreshInterval = setInterval(async () => {
        try {
          console.log('🔄 Refresh periódico (fallback se real-time falhar)...');
          await refreshData();
          lastSuccessfulConnection = Date.now();
        } catch (e) {
          // Silencioso: mantém a UI estável
          console.error('Erro no refresh periódico:', e);
        }
      }, 30000); // 30 segundos (fallback mais frequente)

      // 👁️ Listener para visibilidade da página - reconectar quando página voltar a ficar visível
      const handleVisibilityChange = () => {
        if (!document.hidden) {
          // Página voltou a ficar visível - reconectar imediatamente
          console.log('👁️ Página visível novamente, reconectando Realtime...');
          setTimeout(() => {
            reconfigureAllSubscriptions();
            refreshData().catch(() => {
              // Silencioso
            });
          }, 500);
        }
      };
      document.addEventListener('visibilitychange', handleVisibilityChange);

      // 🔄 Listener para quando a janela ganha foco - reconectar quando voltar
      const handleFocus = () => {
        console.log('🔄 Janela ganhou foco, reconectando Realtime...');
        setTimeout(() => {
          reconfigureAllSubscriptions();
          refreshData().catch(() => {
            // Silencioso
          });
        }, 500);
      };
      window.addEventListener('focus', handleFocus);

      // 🔄 Listener para eventos online/offline - reconectar quando voltar online
      const handleOnline = () => {
        console.log('🌐 Conexão restaurada, reconectando Realtime...');
        setTimeout(() => {
          reconfigureAllSubscriptions();
          refreshData().catch(() => {
            // Silencioso
          });
        }, 1000);
      };
      window.addEventListener('online', handleOnline);

      // 🧹 Cleanup ao sair
      return () => {
        // Limpar todos os timers de debounce
        debounceTimers.forEach((timer) => {
          clearTimeout(timer);
        });
        debounceTimers.clear();
        
        if (healthCheckInterval) {
          clearInterval(healthCheckInterval);
        }
        if (refreshInterval) {
          clearInterval(refreshInterval);
        }
        document.removeEventListener('visibilitychange', handleVisibilityChange);
        window.removeEventListener('focus', handleFocus);
        window.removeEventListener('online', handleOnline);
        // Remover todas as subscriptions
        removeAllSubscriptions();
      };
    } else if (!isAuthenticated || !user) {
      // Limpar dados quando não autenticado
      setProducts([]);
      setMovements([]);
      setNotifications([]);
    }
  }, [isAuthenticated, user?.id, workspaceAtivo?.id]); // Recarregar quando mudar workspace ou usuário

  // 💾 Salvar notificações no localStorage
  const saveNotificationsToLocalStorage = (notifs: Notification[]) => {
    try {
      if (user?.id) {
        localStorage.setItem(`flexi-notifications-${user.id}`, JSON.stringify(notifs));
      }
    } catch (error) {
      // Silencioso
    }
  };

  // ➕ Adicionar produto
  const addProduct = async (product: Omit<Product, 'id'>) => {
    if (!user?.id || !workspaceAtivo?.id) {
      throw new Error('Usuário não autenticado');
    }

    try {
      // 🔍 Verificar no BANCO se já existe produto com o mesmo SKU
      const { data: existingProducts, error: checkError } = await supabase
        .from('produtos')
        .select('id, nome, sku')
        .eq('sku', product.sku)
        .limit(1);
      
      if (existingProducts && existingProducts.length > 0) {
        throw new Error(`O SKU deste produto já foi adicionado`);
      }

      // Criar no workspace ATIVO (não no usuário logado)
      const { data, error } = await supabase
        .from('produtos')
        .insert([{
          nome: product.name,
          sku: product.sku,
          categoria: product.category,
          preco: product.price,
          estoque: product.stock,
          estoque_minimo: product.minStock,
          unidade_medida: (product as any).unitOfMeasure || 'UN',
          fornecedor: 'Fornecedor Padrão',
          descricao: product.description,
          gerenciado_por_lote: (product as any).managedByBatch === true,
          usuario_id: workspaceAtivo.id // Usar ID do workspace ativo!
        }])
        .select()
        .single();

      if (error) {
        // Verificar se é erro de violação de única
        if (error.code === '23505' || error.message.includes('unique') || error.message.includes('duplicate') || error.message.includes('SKU')) {
          throw new Error(`O SKU deste produto já foi adicionado`);
        }
        throw new Error(error.message);
      }

      // Recarregar produtos
      await refreshProducts();

      // Adicionar notificação
      await addNotification(
        "✅ Produto Adicionado",
        `Produto "${product.name}" foi adicionado com sucesso ao estoque`,
        'success'
      );
    } catch (error: any) {
      throw error;
    }
  };

  // ✏️ Atualizar produto
  const updateProduct = async (id: string, updates: Partial<Product>) => {
    if (!user?.id) {
      throw new Error('Usuário não autenticado');
    }

    try {
      // 🔍 Se o SKU está sendo alterado, verificar se já existe
      if (updates.sku !== undefined) {
        const { data: existingProducts } = await supabase
          .from('produtos')
          .select('id, nome, sku')
          .eq('sku', updates.sku)
          .neq('id', id)
          .limit(1);
        
        if (existingProducts && existingProducts.length > 0) {
          throw new Error(`O SKU deste produto já foi adicionado`);
        }
      }

      const updateData: any = {};
      if (updates.name !== undefined) updateData.nome = updates.name;
      if (updates.sku !== undefined) updateData.sku = updates.sku;
      if (updates.category !== undefined) updateData.categoria = updates.category;
      if (updates.price !== undefined) updateData.preco = updates.price;
      if (updates.stock !== undefined) updateData.estoque = updates.stock;
      if (updates.minStock !== undefined) updateData.estoque_minimo = updates.minStock;
      if (updates.description !== undefined) updateData.descricao = updates.description;
      if ((updates as any).unitOfMeasure !== undefined) updateData.unidade_medida = (updates as any).unitOfMeasure;
      if ((updates as any).managedByBatch !== undefined) updateData.gerenciado_por_lote = (updates as any).managedByBatch === true;
      updateData.atualizado_em = new Date().toISOString();

      // Não precisa filtrar por usuario_id aqui pois o RLS já garante
      // que só pode atualizar produtos que tem acesso
      const { error} = await supabase
        .from('produtos')
        .update(updateData)
        .eq('id', id);

      if (error) {
        // Verificar se é erro de violação de única
        if (error.code === '23505' || error.message.includes('unique')) {
          throw new Error(`O SKU deste produto já foi adicionado`);
        }
        throw new Error(error.message);
      }

      // Recarregar produtos
      await refreshProducts();

      // Adicionar notificação
      await addNotification(
        "🔄 Produto Atualizado",
        `Produto foi atualizado com sucesso`,
        'info'
      );
    } catch (error: any) {
      throw error;
    }
  };

  // 🗑️ Deletar produto
  const deleteProduct = async (id: string) => {
    if (!user?.id) {
      throw new Error('Usuário não autenticado');
    }

    try {
      const productToDelete = products.find(p => p.id === id);
      
      // Não precisa filtrar por usuario_id - RLS garante segurança
      const { error } = await supabase
        .from('produtos')
        .delete()
        .eq('id', id);

      if (error) {
        throw new Error(error.message);
      }

      // Recarregar produtos
      await refreshProducts();

      // Adicionar notificação
      if (productToDelete) {
        await addNotification(
          "🗑️ Produto Removido",
          `Produto "${productToDelete.name}" foi removido do estoque`,
          'warning'
        );
      }
    } catch (error: any) {
      throw error;
    }
  };

  // 📊 Adicionar movimentação
  const addMovement = async (movement: Omit<Movement, 'id' | 'total'> & { receiptNumber?: string }) => {
    if (!user?.id || !workspaceAtivo?.id) {
      throw new Error('Usuário não autenticado');
    }

    try {
      // Calcular total
      const total = movement.quantity * movement.unitPrice;

      // Gerar número de recibo se não fornecido ou se for saída/entrada
      let receiptNumber = movement.receiptNumber || null;
      if (!receiptNumber) {
        const now = new Date();
        const year = now.getFullYear();
        const month = String(now.getMonth() + 1).padStart(2, '0');
        const day = String(now.getDate()).padStart(2, '0');
        const hours = String(now.getHours()).padStart(2, '0');
        const minutes = String(now.getMinutes()).padStart(2, '0');
        const seconds = String(now.getSeconds()).padStart(2, '0');
        const milliseconds = String(now.getMilliseconds()).padStart(3, '0');
        
        if (movement.type === 'saida') {
          receiptNumber = `REC-${year}${month}${day}-${hours}${minutes}${seconds}${milliseconds}`;
        } else if (movement.type === 'entrada') {
          receiptNumber = `NFC-${year}${month}${day}-${hours}${minutes}${seconds}${milliseconds}`;
        }
      }
      
      const { data, error } = await supabase
        .from('movimentacoes')
        .insert([{
          produto_id: movement.productId,
          tipo: movement.type,
          quantidade: movement.quantity,
          preco_unitario: movement.unitPrice,
          preco_total: total,
          metodo_pagamento: movement.paymentMethod || null,
          observacoes: movement.description,
          numero_recibo: receiptNumber,
          status: movement.status || 'confirmado',
          usuario_id: workspaceAtivo.id // Usar ID do workspace ativo!
        }])
        .select(`
          *,
          product:produtos(id, nome, sku)
        `)
        .single();

      if (error) {
        throw new Error(error.message);
      }

      // Atualizar estoque do produto
      const product = products.find(p => p.id === movement.productId);
      if (product) {
        // Se o produto é gerenciado por lote, sincronizar estoque baseado nos lotes
        const managedByBatch = (product as any)?.managedByBatch === true;
        
        if (managedByBatch) {
          // Para produtos gerenciados por lote, o estoque deve ser sempre igual à soma dos lotes
          // Sincronizar automaticamente após a movimentação
          await syncProductStockFromBatches(
            movement.productId,
            user.id,
            async (productId: string, stock: number) => {
              await updateProduct(productId, { stock });
            }
          );
        } else {
          // Para produtos não gerenciados por lote, atualizar normalmente
          let newStock = product.stock;
          if (movement.type === 'entrada') {
            newStock += movement.quantity;
          } else if (movement.type === 'saida') {
            newStock = Math.max(0, newStock - movement.quantity);
          } else if (movement.type === 'ajuste') {
            newStock = movement.quantity;
          }

          await updateProduct(movement.productId, { stock: newStock });
        }
      }

      // Recarregar produtos e movimentações para atualizar o dashboard
      await refreshProducts();
      await refreshMovements();

      // Adicionar notificação baseada no tipo
      const notificationType = movement.type === 'entrada' ? 'success' : 'info';
      const notificationTitle = movement.type === 'entrada' ? '📥 Entrada de Estoque' : '📤 Saída de Estoque';
      const notificationMessage = `${movement.quantity} unidades foram ${movement.type === 'entrada' ? 'adicionadas' : 'removidas'}`;
      
      await addNotification(notificationTitle, notificationMessage, notificationType);
    } catch (error: any) {
      throw error;
    }
  };

  // 🗑️ Deletar movimentação
  const deleteMovement = async (id: string) => {
    if (!user?.id) {
      throw new Error('Usuário não autenticado');
    }

    try {
      // Buscar a movimentação antes de deletar para reverter o estoque
      const movementToDelete = movements.find(m => m.id === id);
      
      if (!movementToDelete) {
        throw new Error('Movimentação não encontrada');
      }

      // Deletar do Supabase - RLS garante segurança
      const { error } = await supabase
        .from('movimentacoes')
        .delete()
        .eq('id', id);

      if (error) {
        throw new Error(error.message);
      }

      // Reverter o estoque do produto
      const product = products.find(p => p.id === movementToDelete.productId);
      if (product) {
        // Se o produto é gerenciado por lote, sincronizar estoque baseado nos lotes
        const managedByBatch = (product as any)?.managedByBatch === true;
        
        if (managedByBatch) {
          // Para produtos gerenciados por lote, o estoque deve ser sempre igual à soma dos lotes
          // Sincronizar automaticamente após deletar a movimentação
          await syncProductStockFromBatches(
            movementToDelete.productId,
            user.id,
            async (productId: string, stock: number) => {
              await updateProduct(productId, { stock });
            }
          );
        } else {
          // Para produtos não gerenciados por lote, reverter normalmente
          let newStock = product.stock;
          
          // Se foi entrada, diminuir do estoque
          if (movementToDelete.type === 'entrada') {
            newStock = Math.max(0, product.stock - movementToDelete.quantity);
          }
          // Se foi saída, devolver ao estoque
          else if (movementToDelete.type === 'saida') {
            newStock = product.stock + movementToDelete.quantity;
          }

          await updateProduct(movementToDelete.productId, { stock: newStock });
        }
      }

      // Recarregar movimentações
      await refreshMovements();

      // Adicionar notificação
      const movementType = movementToDelete.type === 'entrada' ? 'Entrada' : 'Saída';
      await addNotification(
        `🗑️ ${movementType} Removida`,
        `Movimentação de ${movementToDelete.quantity} unidades foi removida e o estoque foi ajustado`,
        'warning'
      );
    } catch (error: any) {
      throw error;
    }
  };

  // 🔔 Adicionar notificação (localStorage)
  const addNotification = async (title: string, message: string, type: 'success' | 'error' | 'warning' | 'info') => {
    try {
      const newNotification: Notification = {
        id: `notif-${Date.now()}-${Math.random()}`,
        title,
        message,
        type,
        timestamp: new Date(),
        read: false
      };

      const updatedNotifications = [newNotification, ...notifications];
      setNotifications(updatedNotifications);
      saveNotificationsToLocalStorage(updatedNotifications);
    } catch (error: any) {
      // Silencioso
    }
  };

  // ✅ Marcar notificação como lida
  const markNotificationAsRead = async (id: string) => {
    try {
      const updatedNotifications = notifications.map(n => 
        n.id === id ? { ...n, read: true } : n
      );
      setNotifications(updatedNotifications);
      saveNotificationsToLocalStorage(updatedNotifications);
    } catch (error: any) {
      // Silencioso
    }
  };

  // 🗑️ Remover notificação
  const removeNotification = async (id: string) => {
    try {
      const updatedNotifications = notifications.filter(n => n.id !== id);
      setNotifications(updatedNotifications);
      saveNotificationsToLocalStorage(updatedNotifications);
    } catch (error: any) {
      // Silencioso
    }
  };

  // 🧹 Limpar todas as notificações
  const clearAllNotifications = async () => {
    try {
      setNotifications([]);
      saveNotificationsToLocalStorage([]);
    } catch (error: any) {
      // Silencioso
    }
  };

  // 🔍 Busca global
  const searchGlobal = (term: string) => {
    const lowerCaseTerm = term.toLowerCase();
    const filteredProducts = products.filter(p => 
      p.name.toLowerCase().includes(lowerCaseTerm) ||
      p.description.toLowerCase().includes(lowerCaseTerm) ||
      p.sku.toLowerCase().includes(lowerCaseTerm)
    );
    const filteredMovements = movements.filter(m => 
      m.description.toLowerCase().includes(lowerCaseTerm) ||
      m.productName?.toLowerCase().includes(lowerCaseTerm)
    );
    return { products: filteredProducts, movements: filteredMovements };
  };

  // 📊 Estatísticas do dashboard
  const getDashboardStats = () => {
    const totalProducts = products.length;
    
    // Calcular valor do estoque usando custo médio das entradas ou preço de venda
    const stockValue = products.reduce((sum, product) => {
      // Buscar todas as entradas deste produto
      const productEntries = movements
        .filter(m => m.productId === product.id && m.type === 'entrada')
        .sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime());
      
      // Se há entradas, calcular custo médio ponderado
      if (productEntries.length > 0) {
        let totalCost = 0;
        let totalQuantity = 0;
        
        productEntries.forEach(entry => {
          totalCost += (entry.unitPrice * entry.quantity);
          totalQuantity += entry.quantity;
        });
        
        const averageCost = totalQuantity > 0 ? totalCost / totalQuantity : 0;
        // Usar custo médio se disponível, senão usar preço de venda
        const unitValue = averageCost > 0 ? averageCost : product.price;
        // Arredondar para evitar erros de precisão
        const productValue = Number((unitValue * product.stock).toFixed(2));
        return sum + productValue;
      } else {
        // Se não há entradas, usar preço de venda (ou 0 se não definido)
        const productValue = Number((product.price * product.stock).toFixed(2));
        return sum + productValue;
      }
    }, 0);
    
    // Arredondar o valor total do estoque para garantir precisão
    const finalStockValue = Number(stockValue.toFixed(2));
    
    const lowStockCount = products.filter(p => p.stock <= p.minStock).length;
    
    const today = new Date();
    const todayString = today.toDateString();
    
    const todaySales = movements
      .filter(m => {
        try {
          const movementDate = new Date(m.date);
          return movementDate.toDateString() === todayString && m.type === 'saida';
        } catch (error) {
          return false;
        }
      })
      .reduce((sum, m) => sum + (m.total || 0), 0);

    return {
      totalProducts,
      stockValue: finalStockValue,
      lowStockCount,
      todaySales,
    };
  };

  // 🏷️ Funções de Categorias
  const refreshCategories = useCallback(async () => {
    if (!user?.id || !workspaceAtivo?.id) return;
    
    try {
      const { data, error } = await supabase
        .from('categorias')
        .select('nome')
        .eq('usuario_id', user.id)
        .order('nome', { ascending: true });

      if (error) throw error;

      const categoryNames = data?.map(c => c.nome) || [];
      setCategories(categoryNames);
    } catch (error) {
      console.error('Erro ao carregar categorias:', error);
    }
  }, [user?.id, workspaceAtivo?.id]);

  const addCategory = useCallback(async (categoryName: string) => {
    if (!user?.id || !workspaceAtivo?.id) return;
    
    const trimmedName = categoryName.trim();
    if (!trimmedName) throw new Error('Nome da categoria não pode ser vazio');

    const { data: existing } = await supabase
      .from('categorias')
      .select('id')
      .eq('usuario_id', user.id)
      .eq('nome', trimmedName)
      .single();

    if (existing) {
      throw new Error(`A categoria "${trimmedName}" já existe`);
    }

    const { error } = await supabase
      .from('categorias')
      .insert({
        nome: trimmedName,
        usuario_id: user.id,
        workspace_id: workspaceAtivo.id,
      });

    if (error) throw error;
    await refreshCategories();
  }, [user?.id, workspaceAtivo?.id, refreshCategories]);

  const deleteCategory = useCallback(async (categoryName: string) => {
    if (!user?.id || !workspaceAtivo?.id) return;
    
    const { data: productsUsingCategory } = await supabase
      .from('produtos')
      .select('id')
      .eq('usuario_id', user.id)
      .eq('categoria', categoryName)
      .limit(1);

    if (productsUsingCategory && productsUsingCategory.length > 0) {
      throw new Error(`Existem produtos usando essa categoria. Altere a categoria dos produtos primeiro.`);
    }

    const { error } = await supabase
      .from('categorias')
      .delete()
      .eq('usuario_id', user.id)
      .eq('nome', categoryName);

    if (error) throw error;
    await refreshCategories();
  }, [user?.id, workspaceAtivo?.id, refreshCategories]);

  // 📏 Funções de Unidades de Medida
  const refreshCustomUnits = useCallback(async () => {
    if (!user?.id || !workspaceAtivo?.id) return;
    
    try {
      const { data, error } = await supabase
        .from('unidades_medida')
        .select('sigla')
        .eq('usuario_id', user.id)
        .order('sigla', { ascending: true });

      if (error) throw error;

      const unitSiglases = data?.map(u => u.sigla) || [];
      setCustomUnits(unitSiglases);
    } catch (error) {
      console.error('Erro ao carregar unidades:', error);
    }
  }, [user?.id, workspaceAtivo?.id]);

  const addCustomUnit = useCallback(async (unitSigla: string) => {
    if (!user?.id || !workspaceAtivo?.id) return;
    
    const trimmedSigla = unitSigla.trim().toUpperCase();
    if (!trimmedSigla) throw new Error('Sigla da unidade não pode ser vazia');

    const { data: existing } = await supabase
      .from('unidades_medida')
      .select('id')
      .eq('usuario_id', user.id)
      .eq('sigla', trimmedSigla)
      .single();

    if (existing) {
      throw new Error(`A unidade "${trimmedSigla}" já existe`);
    }

    const { error } = await supabase
      .from('unidades_medida')
      .insert({
        nome: trimmedSigla,
        sigla: trimmedSigla,
        usuario_id: user.id,
        workspace_id: workspaceAtivo.id,
      });

    if (error) throw error;
    await refreshCustomUnits();
  }, [user?.id, workspaceAtivo?.id, refreshCustomUnits]);

  const deleteCustomUnit = useCallback(async (unitSigla: string) => {
    if (!user?.id || !workspaceAtivo?.id) return;
    
    const { data: productsUsingUnit } = await supabase
      .from('produtos')
      .select('id')
      .eq('usuario_id', user.id)
      .eq('unidade_medida', unitSigla.toUpperCase())
      .limit(1);

    if (productsUsingUnit && productsUsingUnit.length > 0) {
      throw new Error(`Existem produtos usando essa unidade. Altere a unidade dos produtos primeiro.`);
    }

    const { error } = await supabase
      .from('unidades_medida')
      .delete()
      .eq('usuario_id', user.id)
      .eq('sigla', unitSigla.toUpperCase());

    if (error) throw error;
    await refreshCustomUnits();
  }, [user?.id, workspaceAtivo?.id, refreshCustomUnits]);

  // Carregar categorias e unidades ao iniciar
  useEffect(() => {
    if (user?.id && workspaceAtivo?.id) {
      refreshCategories();
      refreshCustomUnits();
    }
  }, [user?.id, workspaceAtivo?.id, refreshCategories, refreshCustomUnits]);

  // Memoizar o value do provider para evitar re-renders desnecessários
  const value = useMemo(() => ({
    products,
    movements,
    notifications,
    categories,
    customUnits,
    isLoading,
    addProduct,
    updateProduct,
    deleteProduct,
    addMovement,
    deleteMovement,
    addNotification,
    markNotificationAsRead,
    removeNotification,
    clearAllNotifications,
    addCategory,
    deleteCategory,
    refreshCategories,
    addCustomUnit,
    deleteCustomUnit,
    refreshCustomUnits,
    searchGlobal,
    getDashboardStats,
    refreshData,
    refreshProducts,
    refreshMovements,
  }), [
    products,
    movements,
    notifications,
    categories,
    customUnits,
    isLoading,
    addProduct,
    updateProduct,
    deleteProduct,
    addMovement,
    deleteMovement,
    addNotification,
    markNotificationAsRead,
    removeNotification,
    clearAllNotifications,
    addCategory,
    deleteCategory,
    refreshCategories,
    addCustomUnit,
    deleteCustomUnit,
    refreshCustomUnits,
    searchGlobal,
    getDashboardStats,
    refreshData,
    refreshProducts,
    refreshMovements,
  ]);

  return (
    <DataContext.Provider value={value}>
      {children}
    </DataContext.Provider>
  );
};

export const useData = () => {
  const context = useContext(DataContext);
  if (context === undefined) {
    throw new Error('useData deve ser usado dentro de um DataProvider');
  }
  return context;
};
