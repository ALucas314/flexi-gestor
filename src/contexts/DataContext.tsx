import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';

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
}

interface Movement {
  id: string;
  type: 'entrada' | 'saida' | 'ajuste';
  productId: string;
  productName: string;
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
  addProduct: (product: Omit<Product, 'id'>) => void;
  updateProduct: (id: string, product: Partial<Product>) => void;
  deleteProduct: (id: string) => void;
  addMovement: (movement: Omit<Movement, 'id' | 'total'>) => void;
  addNotification: (title: string, message: string, type: 'success' | 'error' | 'warning' | 'info') => void;
  markNotificationAsRead: (id: string) => void;
  removeNotification: (id: string) => void;
  clearAllNotifications: () => void;
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
  refreshData: () => void;
}

const DataContext = createContext<DataContextType | undefined>(undefined);

export const DataProvider = ({ children }: { children: ReactNode }) => {
  const [products, setProducts] = useState<Product[]>([]);
  const [movements, setMovements] = useState<Movement[]>([]);
  const [notifications, setNotifications] = useState<Notification[]>([]);

  // Função para carregar dados do localStorage
  const loadDataFromStorage = () => {
    try {
      // Carregar produtos
      const storedProducts = localStorage.getItem('flexi-products');
      if (storedProducts) {
        const parsedProducts = JSON.parse(storedProducts);
        console.log('🔄 Carregando produtos do localStorage:', parsedProducts.length);
        setProducts(parsedProducts);
      }

      // Carregar movimentações
      const storedMovements = localStorage.getItem('flexi-moviments');
      if (storedMovements) {
        const parsedMovements = JSON.parse(storedMovements);
        const movementsWithDates = parsedMovements.map((m: any) => ({
          ...m,
          date: new Date(m.date)
        }));
        console.log('🔄 Carregando movimentações do localStorage:', movementsWithDates.length);
        setMovements(movementsWithDates);
      }

      // Carregar notificações
      const storedNotifications = localStorage.getItem('flexi-notifications');
      if (storedNotifications) {
        const parsedNotifications = JSON.parse(storedNotifications);
        const notificationsWithDates = parsedNotifications.map((n: any) => ({
          ...n,
          timestamp: new Date(n.timestamp)
        }));
        console.log('🔄 Carregando notificações do localStorage:', notificationsWithDates.length);
        setNotifications(notificationsWithDates);
      }
    } catch (error) {
      console.error('❌ Erro ao carregar dados do localStorage:', error);
    }
  };

  // Funções CRUD
  const addProduct = (product: Omit<Product, 'id'>) => {
    const newProduct = { ...product, id: Date.now().toString() };
    console.log('➕ Adicionando produto:', newProduct.name);
    
    setProducts(prev => {
      const updated = [...prev, newProduct];
      // Salvar no localStorage imediatamente
      localStorage.setItem('flexi-products', JSON.stringify(updated));
      console.log('💾 Produtos salvos no localStorage:', updated.length);
      return updated;
    });

    // Notificação automática
    addNotification(
      "✅ Produto Adicionado",
      `Produto "${product.name}" foi adicionado com sucesso ao estoque`,
      'success'
    );
  };

  const updateProduct = (id: string, updates: Partial<Product>) => {
    const oldProduct = products.find(p => p.id === id);
    setProducts(prev => {
      const updated = prev.map(p => p.id === id ? { ...p, ...updates } : p);
      // Salvar no localStorage imediatamente
      localStorage.setItem('flexi-products', JSON.stringify(updated));
      return updated;
    });

    // Notificação automática
    if (oldProduct) {
      addNotification(
        "🔄 Produto Atualizado",
        `Produto "${oldProduct.name}" foi atualizado com sucesso`,
        'info'
      );
    }
  };

  const deleteProduct = (id: string) => {
    const deletedProduct = products.find(p => p.id === id);
    setProducts(prev => {
      const updated = prev.filter(p => p.id !== id);
      // Salvar no localStorage imediatamente
      localStorage.setItem('flexi-products', JSON.stringify(updated));
      return updated;
    });

    // Notificação automática
    if (deletedProduct) {
      addNotification(
        "🗑️ Produto Removido",
        `Produto "${deletedProduct.name}" foi removido do estoque`,
        'warning'
      );
    }
  };

  const addMovement = (movement: Omit<Movement, 'id' | 'total'>) => {
    const total = movement.quantity * movement.unitPrice;
    const newMovement = { ...movement, id: Date.now().toString(), total };
    
    console.log('📊 Adicionando movimentação:', newMovement);
    
    setMovements(prev => {
      const updated = [...prev, newMovement];
      // Salvar no localStorage imediatamente
      localStorage.setItem('flexi-moviments', JSON.stringify(updated));
      console.log('💾 Movimentações salvas no localStorage:', updated.length);
      return updated;
    });
    
    // Atualizar estoque do produto
    if (movement.type === 'entrada') {
      setProducts(prev => {
        const updated = prev.map(p => 
          p.id === movement.productId 
            ? { ...p, stock: p.stock + movement.quantity }
            : p
        );
        // Salvar no localStorage imediatamente
        localStorage.setItem('flexi-products', JSON.stringify(updated));
        return updated;
      });

      // Notificação automática para entrada
      addNotification(
        "📥 Entrada de Estoque",
        `${movement.quantity} unidades de "${movement.productName}" foram adicionadas ao estoque`,
        'success'
      );
    } else if (movement.type === 'saida') {
      setProducts(prev => {
        const updated = prev.map(p => 
          p.id === movement.productId 
            ? { ...p, stock: Math.max(0, p.stock - movement.quantity) }
            : p
        );
        // Salvar no localStorage imediatamente
        localStorage.setItem('flexi-products', JSON.stringify(updated));
        return updated;
      });

      // Notificação automática para saída
      addNotification(
        "📤 Saída de Estoque",
        `${movement.quantity} unidades de "${movement.productName}" foram vendidas/removidas`,
        'info'
      );
    }
  };

  const addNotification = (title: string, message: string, type: 'success' | 'error' | 'warning' | 'info') => {
    const newNotification: Notification = {
      id: Date.now().toString(),
      title,
      message,
      type,
      timestamp: new Date(),
      read: false,
    };
    setNotifications(prev => [...prev, newNotification]);
  };

  const markNotificationAsRead = (id: string) => {
    setNotifications(prev => prev.map(n => n.id === id ? { ...n, read: true } : n));
  };

  const removeNotification = (id: string) => {
    setNotifications(prev => prev.filter(n => n.id !== id));
  };

  const clearAllNotifications = () => {
    setNotifications([]);
  };

  const searchGlobal = (term: string) => {
    const lowerCaseTerm = term.toLowerCase();
    const filteredProducts = products.filter(p => 
      p.name.toLowerCase().includes(lowerCaseTerm) ||
      p.description.toLowerCase().includes(lowerCaseTerm) ||
      p.sku.toLowerCase().includes(lowerCaseTerm)
    );
    const filteredMovements = movements.filter(m => 
      m.description.toLowerCase().includes(lowerCaseTerm)
    );
    return { products: filteredProducts, movements: filteredMovements };
  };

  const getDashboardStats = () => {
    const totalProducts = products.length;
    const stockValue = products.reduce((sum, product) => sum + (product.price * product.stock), 0);
    const lowStockCount = products.filter(p => p.stock <= p.minStock).length;
    
    // Calcular vendas de hoje com validação de data
    const today = new Date();
    const todayString = today.toDateString();
    
    const todaySales = movements
      .filter(m => {
        try {
          const movementDate = new Date(m.date);
          return movementDate.toDateString() === todayString && m.type === 'saida';
        } catch (error) {
          console.error('Erro ao processar data da movimentação:', error, m);
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

  // Função para forçar atualização dos dados
  const refreshData = () => {
    console.log('🔄 Forçando atualização dos dados...');
    loadDataFromStorage();
  };


  // Carregar dados iniciais
  useEffect(() => {
    console.log('🚀 DataContext inicializando...');
    loadDataFromStorage();
  }, []);

  // Sincronizar com localStorage sempre que products ou movements mudarem
  useEffect(() => {
    if (products.length > 0) {
      console.log('💾 Sincronizando produtos com localStorage:', products.length);
      localStorage.setItem('flexi-products', JSON.stringify(products));
    }
  }, [products]);

  useEffect(() => {
    if (movements.length > 0) {
      console.log('💾 Sincronizando movimentações com localStorage:', movements.length);
      localStorage.setItem('flexi-moviments', JSON.stringify(movements));
    }
  }, [movements]);

  // Sincronizar notificações com localStorage
  useEffect(() => {
    if (notifications.length > 0) {
      console.log('💾 Sincronizando notificações com localStorage:', notifications.length);
      localStorage.setItem('flexi-notifications', JSON.stringify(notifications));
    }
  }, [notifications]);

  // Log para debug
  useEffect(() => {
    console.log('📊 Estado atual do DataContext:');
    console.log('  - Produtos:', products.length);
    console.log('  - Movimentações:', movements.length);
    console.log('  - Notificações:', notifications.length);
  }, [products, movements, notifications]);

  return (
    <DataContext.Provider value={{
      products,
      movements,
      notifications,
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
      refreshData, // Nova função
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



