// 🗄️ Contexto de Dados com Firebase Firestore
// Este contexto gerencia todos os dados usando Firestore Database

import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { 
  collection, 
  doc, 
  addDoc, 
  updateDoc, 
  deleteDoc, 
  getDocs, 
  getDoc,
  query, 
  orderBy, 
  where,
  onSnapshot,
  serverTimestamp,
  Timestamp
} from 'firebase/firestore';
import { db, FIREBASE_CONFIG, firebaseUtils } from '../lib/firebaseConfig';
import { useFirebaseAuth } from './FirebaseAuthContext';

// Interfaces dos dados (mantendo compatibilidade)
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
  productName: string;
  quantity: number;
  unitPrice: number;
  description: string;
  date: Date;
  total: number;
  createdAt?: Date;
}

interface Notification {
  id: string;
  title: string;
  message: string;
  type: 'success' | 'error' | 'warning' | 'info';
  timestamp: Date;
  read: boolean;
  userId?: string;
}

interface FirebaseDataContextType {
  products: Product[];
  movements: Movement[];
  notifications: Notification[];
  isLoading: boolean;
  error: string | null;
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
  syncWithFirebase: () => Promise<void>;
}

const FirebaseDataContext = createContext<FirebaseDataContextType | undefined>(undefined);

export const FirebaseDataProvider = ({ children }: { children: ReactNode }) => {
  const [products, setProducts] = useState<Product[]>([]);
  const [movements, setMovements] = useState<Movement[]>([]);
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  
  const { user, firebaseUser, isAuthenticated } = useFirebaseAuth();

  // 🔄 Função para converter dados do Firestore
  const convertFirestoreData = (data: any, type: 'product' | 'movement' | 'notification') => {
    const converted = { ...data };
    
    // Converter timestamps para Date
    if (converted.createdAt && converted.createdAt.toDate) {
      converted.createdAt = converted.createdAt.toDate();
    }
    if (converted.updatedAt && converted.updatedAt.toDate) {
      converted.updatedAt = converted.updatedAt.toDate();
    }
    if (converted.date && converted.date.toDate) {
      converted.date = converted.date.toDate();
    }
    if (converted.timestamp && converted.timestamp.toDate) {
      converted.timestamp = converted.timestamp.toDate();
    }
    
    return converted;
  };

  // 📊 Configurar listeners em tempo real para os dados
  useEffect(() => {
    if (!isAuthenticated || !firebaseUser) {
      setIsLoading(false);
      return;
    }

    console.log('🔄 Configurando listeners do Firestore para usuário:', firebaseUser.uid);

    // Listener para produtos
    const productsQuery = query(
      collection(db, FIREBASE_CONFIG.COLLECTIONS.PRODUCTS),
      where('userId', '==', firebaseUser.uid)
    );

    const unsubscribeProducts = onSnapshot(productsQuery, (snapshot) => {
      console.log('🔄 Snapshot recebido:', snapshot.docs.length, 'produtos');
      
      const productsData = snapshot.docs.map(doc => {
        const data = doc.data();
        console.log('📦 Produto encontrado:', data.name, 'ID:', doc.id);
        
        return {
          id: doc.id,
          name: data.name,
          description: data.description,
          category: data.category,
          price: data.price,
          stock: data.stock,
          minStock: data.minStock,
          sku: data.sku,
          status: data.status,
          createdAt: data.createdAt?.toDate ? data.createdAt.toDate() : new Date(),
          updatedAt: data.updatedAt?.toDate ? data.updatedAt.toDate() : new Date()
        };
      });
      
      console.log('📦 Produtos processados:', productsData.length);
      setProducts(productsData);
    }, (error) => {
      console.error('❌ Erro ao carregar produtos:', error);
      setError('Erro ao carregar produtos');
    });

    // Listener para movimentações
    const movementsQuery = query(
      collection(db, FIREBASE_CONFIG.COLLECTIONS.MOVEMENTS),
      where('userId', '==', firebaseUser.uid),
      orderBy('date', 'desc')
    );

    const unsubscribeMovements = onSnapshot(movementsQuery, (snapshot) => {
      const movementsData = snapshot.docs.map(doc => ({
        id: doc.id,
        ...convertFirestoreData(doc.data(), 'movement')
      }));
      
      console.log('📊 Movimentações atualizadas:', movementsData.length);
      setMovements(movementsData);
    }, (error) => {
      console.error('❌ Erro ao carregar movimentações:', error);
      setError('Erro ao carregar movimentações');
    });

    // Listener para notificações
    const notificationsQuery = query(
      collection(db, FIREBASE_CONFIG.COLLECTIONS.NOTIFICATIONS),
      where('userId', '==', firebaseUser.uid),
      orderBy('timestamp', 'desc')
    );

    const unsubscribeNotifications = onSnapshot(notificationsQuery, (snapshot) => {
      const notificationsData = snapshot.docs.map(doc => ({
        id: doc.id,
        ...convertFirestoreData(doc.data(), 'notification')
      }));
      
      console.log('🔔 Notificações atualizadas:', notificationsData.length);
      setNotifications(notificationsData);
    }, (error) => {
      console.error('❌ Erro ao carregar notificações:', error);
      setError('Erro ao carregar notificações');
    });

    setIsLoading(false);

    // Cleanup
    return () => {
      unsubscribeProducts();
      unsubscribeMovements();
      unsubscribeNotifications();
    };
  }, [isAuthenticated, firebaseUser]);

  // ➕ Adicionar produto
  const addProduct = async (product: Omit<Product, 'id'>): Promise<void> => {
    if (!firebaseUser) throw new Error('Usuário não autenticado');

    try {
      console.log('➕ Adicionando produto:', product.name);
      console.log('👤 User ID:', firebaseUser.uid);
      console.log('📊 Dados do produto:', product);
      
      const productData = {
        ...product,
        userId: firebaseUser.uid,
        createdAt: serverTimestamp(),
        updatedAt: serverTimestamp()
      };

      console.log('📦 Dados para salvar:', productData);

      const docRef = await addDoc(collection(db, FIREBASE_CONFIG.COLLECTIONS.PRODUCTS), productData);
      console.log('✅ Produto adicionado com ID:', docRef.id);
      console.log('🔗 Caminho do documento:', docRef.path);

      // Adicionar notificação
      await addNotification(
        "✅ Produto Adicionado",
        `Produto "${product.name}" foi adicionado com sucesso ao estoque`,
        'success'
      );
      
      console.log('🎉 Produto adicionado com sucesso!');
    } catch (error) {
      console.error('❌ Erro ao adicionar produto:', error);
      throw error;
    }
  };

  // ✏️ Atualizar produto
  const updateProduct = async (id: string, updates: Partial<Product>): Promise<void> => {
    if (!firebaseUser) throw new Error('Usuário não autenticado');

    try {
      console.log('✏️ Atualizando produto:', id);
      
      const productRef = doc(db, FIREBASE_CONFIG.COLLECTIONS.PRODUCTS, id);
      await updateDoc(productRef, {
        ...updates,
        updatedAt: serverTimestamp()
      });

      console.log('✅ Produto atualizado');

      // Adicionar notificação
      await addNotification(
        "🔄 Produto Atualizado",
        `Produto foi atualizado com sucesso`,
        'info'
      );
    } catch (error) {
      console.error('❌ Erro ao atualizar produto:', error);
      throw error;
    }
  };

  // 🗑️ Deletar produto
  const deleteProduct = async (id: string): Promise<void> => {
    if (!firebaseUser) throw new Error('Usuário não autenticado');

    try {
      console.log('🗑️ Deletando produto:', id);
      
      await deleteDoc(doc(db, FIREBASE_CONFIG.COLLECTIONS.PRODUCTS, id));
      console.log('✅ Produto deletado');

      // Adicionar notificação
      await addNotification(
        "🗑️ Produto Removido",
        `Produto foi removido do estoque`,
        'warning'
      );
    } catch (error) {
      console.error('❌ Erro ao deletar produto:', error);
      throw error;
    }
  };

  // 📊 Adicionar movimentação
  const addMovement = async (movement: Omit<Movement, 'id' | 'total'>): Promise<void> => {
    if (!firebaseUser) throw new Error('Usuário não autenticado');

    try {
      console.log('📊 Adicionando movimentação:', movement);
      
      const total = movement.quantity * movement.unitPrice;
      const movementData = {
        ...movement,
        total,
        userId: user.id,
        createdAt: serverTimestamp()
      };

      const docRef = await addDoc(collection(db, FIREBASE_CONFIG.COLLECTIONS.MOVEMENTS), movementData);
      console.log('✅ Movimentação adicionada com ID:', docRef.id);

      // Atualizar estoque do produto
      const productRef = doc(db, FIREBASE_CONFIG.COLLECTIONS.PRODUCTS, movement.productId);
      const productDoc = await getDoc(productRef);
      
      if (productDoc.exists()) {
        const currentStock = productDoc.data().stock;
        const newStock = movement.type === 'entrada' 
          ? currentStock + movement.quantity 
          : Math.max(0, currentStock - movement.quantity);
        
        await updateDoc(productRef, {
          stock: newStock,
          updatedAt: serverTimestamp()
        });
      }

      // Adicionar notificação
      const notificationType = movement.type === 'entrada' ? 'success' : 'info';
      const notificationTitle = movement.type === 'entrada' ? '📥 Entrada de Estoque' : '📤 Saída de Estoque';
      const notificationMessage = `${movement.quantity} unidades de "${movement.productName}" foram ${movement.type === 'entrada' ? 'adicionadas' : 'vendidas/removidas'}`;
      
      await addNotification(notificationTitle, notificationMessage, notificationType);
    } catch (error) {
      console.error('❌ Erro ao adicionar movimentação:', error);
      throw error;
    }
  };

  // 🔔 Adicionar notificação
  const addNotification = async (title: string, message: string, type: 'success' | 'error' | 'warning' | 'info'): Promise<void> => {
    if (!firebaseUser) return;

    try {
      const notificationData = {
        title,
        message,
        type,
        userId: firebaseUser.uid,
        read: false,
        timestamp: serverTimestamp()
      };

      await addDoc(collection(db, FIREBASE_CONFIG.COLLECTIONS.NOTIFICATIONS), notificationData);
      console.log('🔔 Notificação adicionada');
    } catch (error) {
      console.error('❌ Erro ao adicionar notificação:', error);
    }
  };

  // ✅ Marcar notificação como lida
  const markNotificationAsRead = async (id: string): Promise<void> => {
    try {
      const notificationRef = doc(db, FIREBASE_CONFIG.COLLECTIONS.NOTIFICATIONS, id);
      await updateDoc(notificationRef, { read: true });
      console.log('✅ Notificação marcada como lida');
    } catch (error) {
      console.error('❌ Erro ao marcar notificação como lida:', error);
    }
  };

  // 🗑️ Remover notificação
  const removeNotification = async (id: string): Promise<void> => {
    try {
      await deleteDoc(doc(db, FIREBASE_CONFIG.COLLECTIONS.NOTIFICATIONS, id));
      console.log('🗑️ Notificação removida');
    } catch (error) {
      console.error('❌ Erro ao remover notificação:', error);
    }
  };

  // 🧹 Limpar todas as notificações
  const clearAllNotifications = async (): Promise<void> => {
    if (!user) return;

    try {
      const notificationsQuery = query(
        collection(db, FIREBASE_CONFIG.COLLECTIONS.NOTIFICATIONS),
        where('userId', '==', user.id)
      );
      
      const snapshot = await getDocs(notificationsQuery);
      const deletePromises = snapshot.docs.map(doc => deleteDoc(doc.ref));
      
      await Promise.all(deletePromises);
      console.log('🧹 Todas as notificações foram removidas');
    } catch (error) {
      console.error('❌ Erro ao limpar notificações:', error);
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
      m.description.toLowerCase().includes(lowerCaseTerm)
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

  // 🔄 Forçar atualização dos dados
  const refreshData = async (): Promise<void> => {
    console.log('🔄 Forçando atualização dos dados...');
    setIsLoading(true);
    setError(null);
    
    try {
      // Os listeners em tempo real já fazem a atualização automática
      console.log('✅ Dados atualizados via listeners');
    } catch (error) {
      console.error('❌ Erro ao atualizar dados:', error);
      setError('Erro ao atualizar dados');
    } finally {
      setIsLoading(false);
    }
  };

  // 🔄 Sincronizar com Firebase (SEMPRE limpar dados antigos)
  const syncWithFirebase = async (): Promise<void> => {
    if (!firebaseUser) return;

    try {
      console.log('🔄 Verificando dados do Firebase para o usuário:', firebaseUser.uid);
      
      // SEMPRE limpar localStorage para evitar dados antigos
      console.log('🧹 Limpando dados antigos do localStorage...');
      localStorage.removeItem('flexi-products');
      localStorage.removeItem('flexi-moviments');
      localStorage.removeItem('flexi-notifications');
      
      // Limpar dados do contexto local
      setProducts([]);
      setMovements([]);
      setNotifications([]);
      
      // Verificar se já existem dados no Firestore
      const productsSnapshot = await getDocs(
        query(collection(db, FIREBASE_CONFIG.COLLECTIONS.PRODUCTS), where('userId', '==', firebaseUser.uid))
      );
      
      if (productsSnapshot.empty) {
        console.log('📦 Usuário novo - iniciando com estoque zerado');
        console.log('✅ Nova conta criada sem produtos iniciais');
      } else {
        console.log('✅ Dados já existem no Firebase para este usuário');
      }
      
      console.log('🧹 Dados antigos removidos com sucesso');
    } catch (error) {
      console.error('❌ Erro na sincronização:', error);
    }
  };

  // 🚀 Executar sincronização inicial
  useEffect(() => {
    if (isAuthenticated && firebaseUser) {
      syncWithFirebase();
    }
  }, [isAuthenticated, firebaseUser]);

  return (
    <FirebaseDataContext.Provider value={{
      products,
      movements,
      notifications,
      isLoading,
      error,
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
      syncWithFirebase
    }}>
      {children}
    </FirebaseDataContext.Provider>
  );
};

export const useFirebaseData = () => {
  const context = useContext(FirebaseDataContext);
  if (context === undefined) {
    throw new Error('useFirebaseData must be used within a FirebaseDataProvider');
  }
  return context;
};
