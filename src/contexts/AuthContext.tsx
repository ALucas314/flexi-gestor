import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';

// 🌐 URL da API Backend
const API_URL = 'http://localhost:3001/api';

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
  login: (email: string, password: string) => Promise<boolean>;
  logout: () => void;
  register: (userData: Omit<User, 'id'> & { password: string }) => Promise<boolean>;
  updateProfile: (userData: Partial<User>) => Promise<void>;
  changePassword: (currentPassword: string, newPassword: string) => Promise<boolean>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider = ({ children }: { children: ReactNode }) => {
  const [user, setUser] = useState<User | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  // Verificar se está autenticado
  const isAuthenticated = !!user;

  // 🔄 Carregar usuário autenticado ao iniciar
  useEffect(() => {
    const loadUserFromToken = async () => {
      try {
        const token = localStorage.getItem('flexi-token');
        
        if (token) {
          console.log('🔐 Token encontrado, verificando usuário...');
          
          // Fazer requisição para obter dados do usuário
          const response = await fetch(`${API_URL}/auth/me`, {
            headers: {
              'Authorization': `Bearer ${token}`
            }
          });

          if (response.ok) {
            const data = await response.json();
            console.log('✅ Usuário autenticado:', data.user.username);
            setUser(data.user);
          } else {
            // Token inválido, remover
            console.log('❌ Token inválido, removendo...');
            localStorage.removeItem('flexi-token');
          }
        }
      } catch (error) {
        console.error('❌ Erro ao carregar usuário:', error);
        localStorage.removeItem('flexi-token');
      } finally {
        setIsLoading(false);
      }
    };

    loadUserFromToken();
  }, []);

  // 🔑 Função de login com API
  const login = async (email: string, password: string): Promise<boolean> => {
    try {
      setIsLoading(true);
      console.log('🔑 Tentando login com API...');
      
      const response = await fetch(`${API_URL}/auth/login`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({ email, password })
      });

      if (response.ok) {
        const data = await response.json();
        console.log('✅ Login realizado com sucesso:', data.user.username);
        
        // Salvar token JWT no localStorage
        localStorage.setItem('flexi-token', data.token);
        
        // Atualizar estado do usuário
        setUser(data.user);
        
        return true;
      } else {
        const error = await response.json();
        console.log('❌ Erro no login:', error.message);
        return false;
      }
    } catch (error) {
      console.error('❌ Erro ao conectar com API:', error);
      return false;
    } finally {
      setIsLoading(false);
    }
  };

  // 🚪 Função de logout
  const logout = () => {
    console.log('🚪 Fazendo logout do usuário:', user?.username);
    
    // Remover token do localStorage
    localStorage.removeItem('flexi-token');
    
    setUser(null);
  };

  // 📝 Função de registro com API
  const register = async (userData: Omit<User, 'id'> & { password: string }): Promise<boolean> => {
    try {
      setIsLoading(true);
      console.log('📝 Tentando registrar novo usuário...');
      
      const response = await fetch(`${API_URL}/auth/register`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(userData)
      });

      if (response.ok) {
        const data = await response.json();
        console.log('✅ Usuário registrado:', data.user.username);
        
        // Salvar token JWT no localStorage
        localStorage.setItem('flexi-token', data.token);
        
        // Atualizar estado do usuário
        setUser(data.user);
        
        return true;
      } else {
        const error = await response.json();
        console.log('❌ Erro no registro:', error.message);
        return false;
      }
    } catch (error) {
      console.error('❌ Erro ao conectar com API:', error);
      return false;
    } finally {
      setIsLoading(false);
    }
  };

  // ✏️ Função para atualizar perfil
  const updateProfile = async (userData: Partial<User>): Promise<void> => {
    try {
      const token = localStorage.getItem('flexi-token');
      
      if (!token) {
        throw new Error('Usuário não autenticado');
      }

      console.log('✏️ Atualizando perfil...');
      
      const response = await fetch(`${API_URL}/auth/profile`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify(userData)
      });

      if (response.ok) {
        const data = await response.json();
        console.log('✅ Perfil atualizado:', data.user.username);
        setUser(data.user);
      } else {
        throw new Error('Erro ao atualizar perfil');
      }
    } catch (error) {
      console.error('❌ Erro ao atualizar perfil:', error);
      throw error;
    }
  };

  // 🔐 Função para trocar senha
  const changePassword = async (currentPassword: string, newPassword: string): Promise<boolean> => {
    try {
      const token = localStorage.getItem('flexi-token');
      
      if (!token) {
        throw new Error('Usuário não autenticado');
      }

      console.log('🔐 Alterando senha...');
      
      const response = await fetch(`${API_URL}/auth/change-password`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({ currentPassword, newPassword })
      });

      if (response.ok) {
        const data = await response.json();
        console.log('✅ Senha alterada com sucesso');
        return true;
      } else {
        const error = await response.json();
        console.log('❌ Erro ao alterar senha:', error.message);
        return false;
      }
    } catch (error) {
      console.error('❌ Erro ao conectar com API:', error);
      return false;
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
      updateProfile,
      changePassword
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
