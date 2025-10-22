/**
 * 🗄️ Contexto de Dados com Supabase
 * 
 * Este contexto gerencia todos os dados usando Supabase como backend.
 * Todos os dados são isolados por usuário usando Row Level Security (RLS).
 */

import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';
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
  const [isLoading, setIsLoading] = useState(false);

  const { isAuthenticated, user } = useAuth();
  const { workspaceAtivo } = useWorkspace();

  // 🔄 Carregar dados do Supabase quando o usuário estiver autenticado OU workspace mudar
  useEffect(() => {
    if (isAuthenticated && user && workspaceAtivo) {
      refreshData();
      loadNotificationsFromLocalStorage();
    } else if (!isAuthenticated || !user) {
      // Limpar dados quando não autenticado
      setProducts([]);
      setMovements([]);
      setNotifications([]);
    }
  }, [isAuthenticated, user, workspaceAtivo]);

  // 📦 Carregar notificações do localStorage
  const loadNotificationsFromLocalStorage = () => {
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
  };

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

  // 🔄 Função para recarregar todos os dados do Supabase
  const refreshData = async () => {
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
  };

  // 🔄 Função para recarregar apenas os produtos
  const refreshProducts = async () => {
    if (!user?.id || !workspaceAtivo?.id) return;

    try {
      // Usar workspace ativo ao invés de user.id
      const usuarioId = workspaceAtivo.id;
      
      const { data, error } = await supabase
        .from('produtos')
        .select('*')
        .eq('usuario_id', usuarioId)
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
        updatedAt: new Date(p.atualizado_em)
      }));

      setProducts(mappedProducts);
    } catch (error) {
      console.error('Erro ao carregar produtos');
    }
  };

  // 🔄 Função para recarregar apenas as movimentações
  const refreshMovements = async () => {
    if (!user?.id || !workspaceAtivo?.id) return;

    try {
      // Usar workspace ativo ao invés de user.id
      const usuarioId = workspaceAtivo.id;
      
      const { data, error } = await supabase
        .from('movimentacoes')
        .select(`
          *,
          product:produtos(id, nome, sku)
        `)
        .eq('usuario_id', usuarioId)
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
        receiptNumber: m.numero_recibo
      }));

      setMovements(mappedMovements);
    } catch (error) {
      console.error('Erro ao carregar movimentações');
    }
  };

  // ➕ Adicionar produto
  const addProduct = async (product: Omit<Product, 'id'>) => {
    if (!user?.id || !workspaceAtivo?.id) {
      throw new Error('Usuário não autenticado ou workspace não selecionado');
    }

    try {
      // Usar workspace ativo para criar o produto
      const usuarioId = workspaceAtivo.id;
      const { data, error } = await supabase
        .from('produtos')
        .insert([{
          nome: product.name,
          sku: product.sku,
          categoria: product.category,
          preco: product.price,
          estoque: product.stock,
          estoque_minimo: product.minStock,
          unidade_medida: 'UN',
          fornecedor: 'Fornecedor Padrão',
          descricao: product.description,
          usuario_id: usuarioId
        }])
        .select()
        .single();

      if (error) {
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
      const updateData: any = {};
      if (updates.name !== undefined) updateData.nome = updates.name;
      if (updates.sku !== undefined) updateData.sku = updates.sku;
      if (updates.category !== undefined) updateData.categoria = updates.category;
      if (updates.price !== undefined) updateData.preco = updates.price;
      if (updates.stock !== undefined) updateData.estoque = updates.stock;
      if (updates.minStock !== undefined) updateData.estoque_minimo = updates.minStock;
      if (updates.description !== undefined) updateData.descricao = updates.description;
      updateData.atualizado_em = new Date().toISOString();

      // Não precisa filtrar por usuario_id aqui pois o RLS já garante
      // que só pode atualizar produtos que tem acesso
      const { error} = await supabase
        .from('produtos')
        .update(updateData)
        .eq('id', id);

      if (error) {
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
    if (!user?.id) {
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
          metodo_pagamento: null,
          observacoes: movement.description,
          numero_recibo: receiptNumber,
          usuario_id: workspaceAtivo?.id || user.id
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

      // Recarregar movimentações
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
    const stockValue = products.reduce((sum, product) => sum + (product.price * product.stock), 0);
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

  return (
    <DataContext.Provider value={{
      products,
      movements,
      notifications,
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
