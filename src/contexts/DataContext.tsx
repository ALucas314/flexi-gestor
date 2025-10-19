// 🗄️ Contexto de Dados com API Prisma
// Este contexto gerencia todos os dados usando a API backend com Prisma

import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { productsAPI, movementsAPI, notificationsAPI } from '@/lib/api';
import { useAuth } from './AuthContext';

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

  const { isAuthenticated } = useAuth();

  // 🔄 Carregar dados da API quando o usuário estiver autenticado
  useEffect(() => {
    if (isAuthenticated) {
      console.log('🔄 Usuário autenticado, carregando dados da API...');
      refreshData();
    } else {
      // Limpar dados quando não autenticado
      setProducts([]);
      setMovements([]);
      setNotifications([]);
    }
  }, [isAuthenticated]);

  // 🔄 Função para recarregar todos os dados da API
  const refreshData = async () => {
    try {
      setIsLoading(true);
      console.log('🔄 Carregando dados da API...');

      // Buscar produtos, movimentações e notificações em paralelo
      const [productsData, movementsData, notificationsData] = await Promise.all([
        productsAPI.getAll(),
        movementsAPI.getAll(),
        notificationsAPI.getAll(),
      ]);

      console.log('✅ Produtos carregados:', productsData.products?.length || 0);
      setProducts(productsData.products || []);

      // Processar movimentações (converter dates e adicionar productName)
      const processedMovements = (movementsData.movements || []).map((m: any) => ({
        ...m,
        date: new Date(m.date),
        productName: m.product?.name || 'Produto desconhecido',
      }));
      console.log('✅ Movimentações carregadas:', processedMovements.length);
      setMovements(processedMovements);

      // Processar notificações (converter dates)
      const processedNotifications = (notificationsData.notifications || []).map((n: any) => ({
        ...n,
        timestamp: new Date(n.timestamp),
      }));
      console.log('✅ Notificações carregadas:', processedNotifications.length);
      setNotifications(processedNotifications);

    } catch (error) {
      console.error('❌ Erro ao carregar dados:', error);
    } finally {
      setIsLoading(false);
    }
  };

  // 🔄 Função para recarregar apenas os produtos
  const refreshProducts = async () => {
    try {
      console.log('🔄 Recarregando produtos...');
      const productsData = await productsAPI.getAll();
      console.log('✅ Produtos recarregados:', productsData.products?.length || 0);
      setProducts(productsData.products || []);
    } catch (error) {
      console.error('❌ Erro ao recarregar produtos:', error);
    }
  };

  // 🔄 Função para recarregar apenas as movimentações
  const refreshMovements = async () => {
    try {
      console.log('🔄 Recarregando movimentações...');
      const movementsData = await movementsAPI.getAll();
      const processedMovements = (movementsData.movements || []).map((m: any) => ({
        ...m,
        date: new Date(m.date),
        productName: m.product?.name || 'Produto desconhecido',
      }));
      console.log('✅ Movimentações recarregadas:', processedMovements.length);
      setMovements(processedMovements);
    } catch (error) {
      console.error('❌ Erro ao recarregar movimentações:', error);
    }
  };

  // ➕ Adicionar produto
  const addProduct = async (product: Omit<Product, 'id'>) => {
    try {
      console.log('➕ Adicionando produto:', product.name);
      
      const data = await productsAPI.create(product);
      console.log('✅ Produto adicionado com sucesso:', data.product.id);

      // Adicionar ao estado local
      setProducts(prev => [...prev, data.product]);

      // Adicionar notificação
      await addNotification(
        "✅ Produto Adicionado",
        `Produto "${product.name}" foi adicionado com sucesso ao estoque`,
        'success'
      );
    } catch (error: any) {
      console.error('❌ Erro ao adicionar produto:', error);
      throw error;
    }
  };

  // ✏️ Atualizar produto
  const updateProduct = async (id: string, updates: Partial<Product>) => {
    try {
      console.log('✏️ Atualizando produto:', id);
      
      const data = await productsAPI.update(id, updates);
      console.log('✅ Produto atualizado com sucesso');

      // Atualizar no estado local
      setProducts(prev => prev.map(p => p.id === id ? data.product : p));

      // Adicionar notificação
      await addNotification(
        "🔄 Produto Atualizado",
        `Produto foi atualizado com sucesso`,
        'info'
      );
    } catch (error: any) {
      console.error('❌ Erro ao atualizar produto:', error);
      throw error;
    }
  };

  // 🗑️ Deletar produto
  const deleteProduct = async (id: string) => {
    try {
      const productToDelete = products.find(p => p.id === id);
      console.log('🗑️ Deletando produto:', id);
      
      await productsAPI.delete(id);
      console.log('✅ Produto deletado com sucesso');

      // Remover do estado local
      setProducts(prev => prev.filter(p => p.id !== id));

      // Adicionar notificação
      if (productToDelete) {
        await addNotification(
          "🗑️ Produto Removido",
          `Produto "${productToDelete.name}" foi removido do estoque`,
          'warning'
        );
      }
    } catch (error: any) {
      console.error('❌ Erro ao deletar produto:', error);
      throw error;
    }
  };

  // 📊 Adicionar movimentação
  const addMovement = async (movement: Omit<Movement, 'id' | 'total'>) => {
    try {
      console.log('📊 Adicionando movimentação:', movement);
      
      const data = await movementsAPI.create(movement);
      console.log('✅ Movimentação adicionada com sucesso:', data.movement.id);

      // Processar movimentação e adicionar ao estado local
      const processedMovement = {
        ...data.movement,
        date: new Date(data.movement.date),
        productName: data.movement.product?.name || movement.productName || 'Produto desconhecido',
      };
      setMovements(prev => [processedMovement, ...prev]);

      // Atualizar estoque do produto no estado local
      setProducts(prev => prev.map(p => {
        if (p.id === movement.productId) {
          let newStock = p.stock;
          if (movement.type === 'entrada') {
            newStock += movement.quantity;
          } else if (movement.type === 'saida') {
            newStock = Math.max(0, newStock - movement.quantity);
          } else if (movement.type === 'ajuste') {
            newStock = movement.quantity;
          }
          return { ...p, stock: newStock };
        }
        return p;
      }));

      // Adicionar notificação baseada no tipo
      const notificationType = movement.type === 'entrada' ? 'success' : 'info';
      const notificationTitle = movement.type === 'entrada' ? '📥 Entrada de Estoque' : '📤 Saída de Estoque';
      const notificationMessage = `${movement.quantity} unidades foram ${movement.type === 'entrada' ? 'adicionadas' : 'removidas'}`;
      
      await addNotification(notificationTitle, notificationMessage, notificationType);
    } catch (error: any) {
      console.error('❌ Erro ao adicionar movimentação:', error);
      throw error;
    }
  };

  // 🔔 Adicionar notificação
  const addNotification = async (title: string, message: string, type: 'success' | 'error' | 'warning' | 'info') => {
    try {
      const data = await notificationsAPI.create({ title, message, type });
      console.log('🔔 Notificação adicionada:', data.notification.id);

      // Processar e adicionar ao estado local
      const processedNotification = {
        ...data.notification,
        timestamp: new Date(data.notification.timestamp),
      };
      setNotifications(prev => [processedNotification, ...prev]);
    } catch (error: any) {
      console.error('❌ Erro ao adicionar notificação:', error);
    }
  };

  // ✅ Marcar notificação como lida
  const markNotificationAsRead = async (id: string) => {
    try {
      await notificationsAPI.markAsRead(id);
      console.log('✅ Notificação marcada como lida:', id);

      // Atualizar no estado local
      setNotifications(prev => prev.map(n => n.id === id ? { ...n, read: true } : n));
    } catch (error: any) {
      console.error('❌ Erro ao marcar notificação:', error);
    }
  };

  // 🗑️ Remover notificação
  const removeNotification = async (id: string) => {
    try {
      await notificationsAPI.delete(id);
      console.log('🗑️ Notificação removida:', id);

      // Remover do estado local
      setNotifications(prev => prev.filter(n => n.id !== id));
    } catch (error: any) {
      console.error('❌ Erro ao remover notificação:', error);
    }
  };

  // 🧹 Limpar todas as notificações (lidas e não lidas)
  const clearAllNotifications = async () => {
    try {
      await notificationsAPI.deleteAll();
      console.log('🗑️ Todas as notificações removidas');

      // Limpar todas as notificações do estado local
      setNotifications([]);
    } catch (error: any) {
      console.error('❌ Erro ao limpar todas as notificações:', error);
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
    throw new Error('useData must be used within a DataProvider');
  }
  return context;
};
