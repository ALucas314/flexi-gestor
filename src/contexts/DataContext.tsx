/**
 * 🗄️ Contexto de Dados com Supabase
 * 
 * Este contexto gerencia todos os dados usando Supabase como backend.
 * Todos os dados são isolados por usuário usando Row Level Security (RLS).
 */

import React, { createContext, useContext, useState, useEffect, useCallback, ReactNode } from 'react';
import { supabase } from '@/lib/supabase';
import { useAuth } from './AuthContext';
import { useWorkspace } from './WorkspaceContext';

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
  addMovement: (movement: Omit<Movement, 'id' | 'total'>) => Promise<void>;
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
    } catch (error) {
      console.error('Erro ao carregar produtos');
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
    } catch (error) {
      console.error('Erro ao carregar movimentações');
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

  // 🔄 Carregar dados do Supabase quando o usuário estiver autenticado OU mudar workspace
  useEffect(() => {
    if (isAuthenticated && user && workspaceAtivo) {
      // Carregar dados e notificações
      const loadData = async () => {
        await refreshData();
        loadNotificationsFromLocalStorage();
      };
      loadData();

      let produtosSubscription: any = null;
      let movimentacoesSubscription: any = null;
      let lastSuccessfulConnection = Date.now();
      let isFirstConnection = true;

      // Função para reconfigurar subscriptions quando desconectam
      const reconfigureSubscriptions = () => {
        if (produtosSubscription) {
          supabase.removeChannel(produtosSubscription);
        }
        if (movimentacoesSubscription) {
          supabase.removeChannel(movimentacoesSubscription);
        }

        try {
          produtosSubscription = supabase
            .channel(`produtos-changes-${workspaceAtivo.id}-${Date.now()}`)
            .on('postgres_changes', 
              { 
                event: '*', 
                schema: 'public', 
                table: 'produtos',
                filter: `usuario_id=eq.${workspaceAtivo.id}`
              }, 
              async (payload) => {
                await refreshProducts();
              }
            )
            .subscribe((status) => {
              if (status === 'SUBSCRIBED') {
                lastSuccessfulConnection = Date.now();
              }
            });

          movimentacoesSubscription = supabase
            .channel(`movimentacoes-changes-${workspaceAtivo.id}-${Date.now()}`)
            .on('postgres_changes', 
              { 
                event: '*', 
                schema: 'public', 
                table: 'movimentacoes',
                filter: `usuario_id=eq.${workspaceAtivo.id}`
              }, 
              async (payload) => {
                await refreshMovements();
                await refreshProducts();
              }
            )
            .subscribe((status) => {
              if (status === 'SUBSCRIBED') {
                lastSuccessfulConnection = Date.now();
              }
            });
        } catch (error) {
          // Silencioso
        }
      };

      // Configurar subscriptions inicial
      reconfigureSubscriptions();

      // 🔄 Health check que detecta desconexão e reconecta
      // Verifica a cada 30 segundos se a última conexão foi há mais de 2 minutos
      const healthCheckInterval = setInterval(() => {
        const timeSinceLastConnection = Date.now() - lastSuccessfulConnection;
        // Se não houve conexão bem-sucedida nos últimos 2 minutos, fazer reload
        if (timeSinceLastConnection > 120000) {
          window.location.reload();
        }
      }, 30000); // Verifica a cada 30 segundos

      // 🔄 Refresh periódico silencioso dos dados (a cada 60 segundos)
      const refreshInterval = setInterval(async () => {
        await refreshData();
      }, 60000); // 60 segundos

      // 🧹 Cleanup ao sair
      return () => {
        if (healthCheckInterval) {
          clearInterval(healthCheckInterval);
        }
        if (refreshInterval) {
          clearInterval(refreshInterval);
        }
        if (produtosSubscription) {
          supabase.removeChannel(produtosSubscription);
        }
        if (movimentacoesSubscription) {
          supabase.removeChannel(movimentacoesSubscription);
        }
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
  const addMovement = async (movement: Omit<Movement, 'id' | 'total'>) => {
    if (!user?.id || !workspaceAtivo?.id) {
      throw new Error('Usuário não autenticado');
    }

    try {
      // Calcular total
      const total = movement.quantity * movement.unitPrice;

      // Gerar número de recibo se for saída
      let receiptNumber = null;
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
        return sum + (unitValue * product.stock);
      } else {
        // Se não há entradas, usar preço de venda (ou 0 se não definido)
        return sum + (product.price * product.stock);
      }
    }, 0);
    
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
      stockValue,
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

  return (
    <DataContext.Provider value={{
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
    }}>
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
