// 🔐 Contexto de Autenticação com Firebase
// Este contexto gerencia a autenticação usando Firebase Auth com sessão persistente

import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { 
  signInWithEmailAndPassword, 
  createUserWithEmailAndPassword, 
  signOut, 
  onAuthStateChanged,
  User as FirebaseUser,
  updateProfile as updateFirebaseProfile,
  updatePassword,
  reauthenticateWithCredential,
  EmailAuthProvider
} from 'firebase/auth';
import { doc, setDoc, getDoc } from 'firebase/firestore';
import { auth, db, FIREBASE_CONFIG } from '../lib/firebaseConfig';
import { configureFirebaseLanguage, getPasswordResetEmailConfig } from '../lib/emailConfig';

// Interface do usuário do Flexi Gestor
interface User {
  id: string;
  username: string;
  email: string;
  name: string;
  role: 'admin' | 'user';
  avatar?: string;
  createdAt?: Date;
  lastLogin?: Date;
}

// Interface do contexto de autenticação
interface FirebaseAuthContextType {
  user: User | null;
  firebaseUser: FirebaseUser | null;
  isAuthenticated: boolean;
  isLoading: boolean;
  login: (email: string, password: string) => Promise<boolean>;
  logout: () => Promise<void>;
  register: (userData: Omit<User, 'id'> & { password: string }) => Promise<boolean>;
  updateProfile: (userData: Partial<User>) => Promise<void>;
  resetPassword: (email: string) => Promise<boolean>;
  changePassword: (currentPassword: string, newPassword: string) => Promise<boolean>;
}

const FirebaseAuthContext = createContext<FirebaseAuthContextType | undefined>(undefined);

export const FirebaseAuthProvider = ({ children }: { children: ReactNode }) => {
  const [user, setUser] = useState<User | null>(null);
  const [firebaseUser, setFirebaseUser] = useState<FirebaseUser | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  // Verificar se está autenticado
  const isAuthenticated = !!user && !!firebaseUser;

  // 🔄 Escutar mudanças no estado de autenticação do Firebase
  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (firebaseUser) => {
      console.log('🔄 Estado de autenticação mudou:', firebaseUser ? 'Logado' : 'Deslogado');
      
      if (firebaseUser) {
        // Usuário está logado no Firebase
        setFirebaseUser(firebaseUser);
        
        try {
          // Buscar dados do usuário no Firestore
          const userDoc = await getDoc(doc(db, FIREBASE_CONFIG.COLLECTIONS.USERS, firebaseUser.uid));
          
          if (userDoc.exists()) {
            const userData = userDoc.data();
            const flexiUser: User = {
              id: firebaseUser.uid,
              username: userData.username || firebaseUser.email?.split('@')[0] || 'usuario',
              email: firebaseUser.email || '',
              name: userData.name || firebaseUser.displayName || 'Usuário',
              role: userData.role || 'user',
              avatar: userData.avatar || '👤',
              createdAt: userData.createdAt?.toDate(),
              lastLogin: new Date()
            };
            
            setUser(flexiUser);
            
            // Atualizar último login
            await setDoc(doc(db, FIREBASE_CONFIG.COLLECTIONS.USERS, firebaseUser.uid), {
              lastLogin: new Date()
            }, { merge: true });
            
            console.log('✅ Usuário carregado do Firestore:', flexiUser.username);
          } else {
            // Criar perfil do usuário no Firestore se não existir
            const newUser: User = {
              id: firebaseUser.uid,
              username: firebaseUser.email?.split('@')[0] || 'usuario',
              email: firebaseUser.email || '',
              name: firebaseUser.displayName || 'Usuário',
              role: 'user',
              avatar: '👤',
              createdAt: new Date(),
              lastLogin: new Date()
            };
            
            await setDoc(doc(db, FIREBASE_CONFIG.COLLECTIONS.USERS, firebaseUser.uid), {
              ...newUser,
              createdAt: new Date(),
              lastLogin: new Date()
            });
            
            setUser(newUser);
            console.log('✅ Novo perfil criado no Firestore:', newUser.username);
          }
        } catch (error) {
          console.error('❌ Erro ao carregar dados do usuário:', error);
        }
      } else {
        // Usuário não está logado
        setFirebaseUser(null);
        setUser(null);
        console.log('🚪 Usuário deslogado');
      }
      
      setIsLoading(false);
    });

    // Cleanup
    return () => unsubscribe();
  }, []);

  // 🔑 Função de login com Firebase
  const login = async (email: string, password: string): Promise<boolean> => {
    try {
      setIsLoading(true);
      console.log('🔐 Tentando login com Firebase...');
      
      const userCredential = await signInWithEmailAndPassword(auth, email, password);
      console.log('✅ Login realizado com sucesso:', userCredential.user.email);
      
      return true;
    } catch (error: any) {
      console.error('❌ Erro no login:', error.message);
      
      // Tratar erros específicos
      if (error.code === 'auth/user-not-found') {
        console.log('👤 Usuário não encontrado');
      } else if (error.code === 'auth/wrong-password') {
        console.log('🔒 Senha incorreta');
      } else if (error.code === 'auth/invalid-email') {
        console.log('📧 Email inválido');
      }
      
      return false;
    } finally {
      setIsLoading(false);
    }
  };

  // 🚪 Função de logout
  const logout = async (): Promise<void> => {
    try {
      console.log('🚪 Fazendo logout...');
      await signOut(auth);
      console.log('✅ Logout realizado com sucesso');
    } catch (error) {
      console.error('❌ Erro no logout:', error);
    }
  };

  // 📝 Função de registro
  const register = async (userData: Omit<User, 'id'> & { password: string }): Promise<boolean> => {
    try {
      setIsLoading(true);
      console.log('📝 Criando nova conta...');
      
      // Criar usuário no Firebase Auth
      const userCredential = await createUserWithEmailAndPassword(auth, userData.email, userData.password);
      
      // Atualizar perfil no Firebase Auth
      await updateFirebaseProfile(userCredential.user, {
        displayName: userData.name
      });
      
      // Criar perfil no Firestore
      const newUser: User = {
        id: userCredential.user.uid,
        username: userData.username,
        email: userData.email,
        name: userData.name,
        role: userData.role,
        avatar: userData.avatar || '👤',
        createdAt: new Date(),
        lastLogin: new Date()
      };
      
      await setDoc(doc(db, FIREBASE_CONFIG.COLLECTIONS.USERS, userCredential.user.uid), {
        ...newUser,
        createdAt: new Date(),
        lastLogin: new Date()
      });
      
      console.log('✅ Conta criada com sucesso:', newUser.username);
      
      // Aguardar um pouco para garantir que tudo foi salvo
      await new Promise(resolve => setTimeout(resolve, 500));
      
      return true;
    } catch (error: any) {
      console.error('❌ Erro no registro:', error.message);
      
      // Tratar erros específicos
      if (error.code === 'auth/email-already-in-use') {
        console.log('📧 Email já está em uso');
      } else if (error.code === 'auth/weak-password') {
        console.log('🔒 Senha muito fraca');
      }
      
      return false;
    } finally {
      setIsLoading(false);
    }
  };

  // ✏️ Função para atualizar perfil
  const updateProfile = async (userData: Partial<User>): Promise<void> => {
    if (!firebaseUser || !user) return;
    
    try {
      console.log('✏️ Atualizando perfil...');
      
      // Atualizar no Firestore
      await setDoc(doc(db, FIREBASE_CONFIG.COLLECTIONS.USERS, firebaseUser.uid), {
        ...userData,
        updatedAt: new Date()
      }, { merge: true });
      
      // Atualizar estado local
      setUser(prev => prev ? { ...prev, ...userData } : null);
      
      console.log('✅ Perfil atualizado com sucesso');
    } catch (error) {
      console.error('❌ Erro ao atualizar perfil:', error);
    }
  };

  // 🔄 Função para resetar senha
  const resetPassword = async (email: string): Promise<boolean> => {
    try {
      console.log('🔄 Enviando email de reset de senha...');
      
      // Configurar idioma português
      await configureFirebaseLanguage();
      
      // Importar sendPasswordResetEmail dinamicamente
      const { sendPasswordResetEmail } = await import('firebase/auth');
      
      // Usar configuração personalizada de email
      const emailConfig = getPasswordResetEmailConfig();
      await sendPasswordResetEmail(auth, email, emailConfig);
      
      console.log('✅ Email de reset enviado para:', email);
      return true;
    } catch (error: any) {
      console.error('❌ Erro ao enviar reset de senha:', error.message);
      return false;
    }
  };

  // 🔐 Função para alterar senha
  const changePassword = async (currentPassword: string, newPassword: string): Promise<boolean> => {
    if (!firebaseUser) {
      console.error('❌ Usuário não autenticado');
      return false;
    }

    try {
      console.log('🔐 Alterando senha...');
      
      // Primeiro, fazer logout para limpar a sessão
      await signOut(auth);
      console.log('🔄 Logout realizado');
      
      // Aguardar um pouco para garantir que o logout foi processado
      await new Promise(resolve => setTimeout(resolve, 1000));
      
      // Fazer login novamente com a senha atual
      const userCredential = await signInWithEmailAndPassword(auth, firebaseUser.email!, currentPassword);
      console.log('✅ Login realizado com senha atual');
      
      // Agora alterar a senha
      await updatePassword(userCredential.user, newPassword);
      
      console.log('✅ Senha alterada com sucesso');
      return true;
    } catch (error: any) {
      console.error('❌ Erro ao alterar senha:', error);
      
      // Tratar erros específicos
      if (error.code === 'auth/wrong-password') {
        console.log('🔒 Senha atual incorreta');
      } else if (error.code === 'auth/weak-password') {
        console.log('🔒 Nova senha muito fraca');
      } else if (error.code === 'auth/user-not-found') {
        console.log('🔒 Usuário não encontrado');
      } else if (error.code === 'auth/invalid-email') {
        console.log('🔒 Email inválido');
      }
      
      return false;
    }
  };

  return (
    <FirebaseAuthContext.Provider value={{
      user,
      firebaseUser,
      isAuthenticated,
      isLoading,
      login,
      logout,
      register,
      updateProfile,
      resetPassword,
      changePassword
    }}>
      {children}
    </FirebaseAuthContext.Provider>
  );
};

export const useFirebaseAuth = () => {
  const context = useContext(FirebaseAuthContext);
  if (context === undefined) {
    throw new Error('useFirebaseAuth must be used within a FirebaseAuthProvider');
  }
  return context;
};
