import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';

// Interface do usuário
interface User {
  id: string;
  username: string;
  email: string;
  name: string;
  role: 'admin' | 'user';
  avatar?: string;
}

// Interface do contexto de autenticação
interface AuthContextType {
  user: User | null;
  isAuthenticated: boolean;
  isLoading: boolean;
  login: (username: string, password: string) => Promise<boolean>;
  logout: () => void;
  register: (userData: Omit<User, 'id'> & { password: string }) => Promise<boolean>;
  updateProfile: (userData: Partial<User>) => void;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider = ({ children }: { children: ReactNode }) => {
  const [user, setUser] = useState<User | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  // Verificar se está autenticado
  const isAuthenticated = !!user;

  // Carregar dados do usuário do localStorage
  useEffect(() => {
    const loadUserFromStorage = () => {
      try {
        const savedUser = localStorage.getItem('flexi-gestor-user');
        const savedAuth = localStorage.getItem('flexi-gestor-auth');
        
        if (savedUser && savedAuth) {
          const userData = JSON.parse(savedUser);
          const authData = JSON.parse(savedAuth);
          
          // Verificar se a sessão não expirou (nunca expira neste sistema)
          if (authData.isAuthenticated) {
            console.log('🔐 Usuário autenticado encontrado:', userData.username);
            setUser(userData);
          }
        }
      } catch (error) {
        console.error('❌ Erro ao carregar dados de autenticação:', error);
      } finally {
        setIsLoading(false);
      }
    };

    loadUserFromStorage();
  }, []);

  // Função de login
  const login = async (username: string, password: string): Promise<boolean> => {
    try {
      setIsLoading(true);
      
      // Simular validação (em um sistema real, isso seria uma chamada para API)
      await new Promise(resolve => setTimeout(resolve, 1000));
      
      // Usuários padrão do sistema (em produção, isso viria de um banco de dados)
      const defaultUsers = [
        {
          id: '1',
          username: 'admin',
          password: 'admin123',
          email: 'admin@flexigestor.com',
          name: 'Administrador',
          role: 'admin' as const,
          avatar: '👨‍💼'
        },
        {
          id: '2',
          username: 'usuario',
          password: 'user123',
          email: 'usuario@flexigestor.com',
          name: 'Usuário Padrão',
          role: 'user' as const,
          avatar: '👤'
        },
        {
          id: '3',
          username: 'demo',
          password: 'demo123',
          email: 'demo@flexigestor.com',
          name: 'Usuário Demo',
          role: 'user' as const,
          avatar: '🎯'
        }
      ];

      // Buscar usuário
      const foundUser = defaultUsers.find(u => u.username === username && u.password === password);
      
      if (foundUser) {
        const userData: User = {
          id: foundUser.id,
          username: foundUser.username,
          email: foundUser.email,
          name: foundUser.name,
          role: foundUser.role,
          avatar: foundUser.avatar
        };

        // Salvar dados no localStorage (nunca expira)
        localStorage.setItem('flexi-gestor-user', JSON.stringify(userData));
        localStorage.setItem('flexi-gestor-auth', JSON.stringify({
          isAuthenticated: true,
          loginTime: new Date().toISOString(),
          neverExpires: true
        }));

        setUser(userData);
        
        console.log('✅ Login realizado com sucesso:', userData.username);
        return true;
      } else {
        console.log('❌ Credenciais inválidas');
        return false;
      }
    } catch (error) {
      console.error('❌ Erro no login:', error);
      return false;
    } finally {
      setIsLoading(false);
    }
  };

  // Função de logout
  const logout = () => {
    console.log('🚪 Fazendo logout do usuário:', user?.username);
    
    // Remover dados do localStorage
    localStorage.removeItem('flexi-gestor-user');
    localStorage.removeItem('flexi-gestor-auth');
    
    setUser(null);
  };

  // Função de registro (simples para demonstração)
  const register = async (userData: Omit<User, 'id'> & { password: string }): Promise<boolean> => {
    try {
      setIsLoading(true);
      
      // Simular processo de registro
      await new Promise(resolve => setTimeout(resolve, 1000));
      
      // Em um sistema real, isso seria salvo em um banco de dados
      const newUser: User = {
        id: Date.now().toString(),
        username: userData.username,
        email: userData.email,
        name: userData.name,
        role: userData.role,
        avatar: userData.avatar || '👤'
      };

      // Salvar dados no localStorage
      localStorage.setItem('flexi-gestor-user', JSON.stringify(newUser));
      localStorage.setItem('flexi-gestor-auth', JSON.stringify({
        isAuthenticated: true,
        loginTime: new Date().toISOString(),
        neverExpires: true
      }));

      setUser(newUser);
      
      console.log('✅ Registro realizado com sucesso:', newUser.username);
      return true;
    } catch (error) {
      console.error('❌ Erro no registro:', error);
      return false;
    } finally {
      setIsLoading(false);
    }
  };

  // Função para atualizar perfil
  const updateProfile = (userData: Partial<User>) => {
    if (user) {
      const updatedUser = { ...user, ...userData };
      setUser(updatedUser);
      localStorage.setItem('flexi-gestor-user', JSON.stringify(updatedUser));
      console.log('✅ Perfil atualizado:', updatedUser.username);
    }
  };

  return (
    <AuthContext.Provider value={{
      user,
      isAuthenticated,
      isLoading,
      login,
      logout,
      register,
      updateProfile
    }}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};
