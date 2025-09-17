// 🔥 Configuração do Firebase para Flexi Gestor
// Este arquivo contém todas as configurações necessárias para conectar ao Firebase

import { initializeApp } from 'firebase/app';
import { getAuth, setPersistence, browserLocalPersistence } from 'firebase/auth';
import { getFirestore } from 'firebase/firestore';

// ⚙️ Configuração do Firebase
// IMPORTANTE: Substitua estas configurações pelas suas próprias do Firebase Console
const firebaseConfig = {
  // 🔑 Configurações do Firebase - Flexi Gestor
  // Projeto: flexi-gestor
  // App: Flexi Gestor Web
  
  apiKey: "AIzaSyAxsp53SzI5BY2__dsDpcqoqrAv1vwZjlk",
  authDomain: "flexi-gestor.firebaseapp.com",
  projectId: "flexi-gestor",
  storageBucket: "flexi-gestor.firebasestorage.app",
  messagingSenderId: "193352754052",
  appId: "1:193352754052:web:54fe9919f7de666b7e73d1",
  measurementId: "G-PSY5939T1S"
};

// 🚀 Inicializar Firebase
const app = initializeApp(firebaseConfig);

// 🔐 Configurar Autenticação com persistência local (nunca expira)
export const auth = getAuth(app);

// Configurar persistência para que a sessão nunca expire
setPersistence(auth, browserLocalPersistence)
  .then(() => {
    console.log('✅ Firebase Auth configurado com persistência local (nunca expira)');
  })
  .catch((error) => {
    console.error('❌ Erro ao configurar persistência do Firebase Auth:', error);
  });

// 🗄️ Configurar Firestore Database
export const db = getFirestore(app);

// 📊 Configurações específicas do Flexi Gestor
export const FIREBASE_CONFIG = {
  // Coleções do Firestore
  COLLECTIONS: {
    USERS: 'users',
    PRODUCTS: 'products',
    MOVEMENTS: 'movements',
    NOTIFICATIONS: 'notifications',
    SETTINGS: 'settings'
  },
  
  // Configurações de cache
  CACHE: {
    // Tempo de cache em milissegundos (24 horas)
    CACHE_TIME: 24 * 60 * 60 * 1000,
    // Força atualização dos dados
    FORCE_REFRESH: false
  },
  
  // Configurações de segurança
  SECURITY: {
    // Regras de validação
    VALIDATE_DATA: true,
    // Logs de segurança
    ENABLE_SECURITY_LOGS: true
  }
};

// 🛠️ Funções utilitárias do Firebase
export const firebaseUtils = {
  // Converter timestamp do Firestore para Date
  timestampToDate: (timestamp: any) => {
    if (timestamp && timestamp.toDate) {
      return timestamp.toDate();
    }
    return new Date();
  },
  
  // Converter Date para timestamp do Firestore
  dateToTimestamp: (date: Date) => {
    return new Date(date.getTime());
  },
  
  // Gerar ID único
  generateId: () => {
    return Date.now().toString() + Math.random().toString(36).substr(2, 9);
  },
  
  // Verificar se está conectado
  isConnected: () => {
    return navigator.onLine;
  }
};

// 📝 Log de inicialização
console.log('🔥 Firebase inicializado com sucesso!');
console.log('📊 Configurações:', {
  authDomain: firebaseConfig.authDomain,
  projectId: firebaseConfig.projectId,
  collections: FIREBASE_CONFIG.COLLECTIONS
});

export default app;
