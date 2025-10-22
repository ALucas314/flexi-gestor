/**
 * 🔐 CONTEXTO DE AUTENTICAÇÃO COM SUPABASE
 * 
 * Este contexto gerencia toda a autenticação usando Supabase Auth.
 * Fornece funções para login, registro, logout, recuperação de senha e perfil.
 */

import React, { createContext, useContext, useState, useEffect, useRef, ReactNode } from 'react';
import { supabase } from '../lib/supabase';
import { User as SupabaseUser } from '@supabase/supabase-js';
import { toast } from '@/components/ui/use-toast';

// Interface do usuário customizada
interface User {
  id: string;
  email: string;
  name: string | null;
  username?: string;
  role?: 'admin' | 'user';
  avatar?: string;
}

// Interface do contexto de autenticação
interface AuthContextType {
  user: User | null;
  isAuthenticated: boolean;
  isLoading: boolean;
  login: (email: string, password: string) => Promise<boolean>;
  logout: () => void;
  register: (email: string, password: string, name: string) => Promise<boolean>;
  updateProfile: (userData: Partial<User>) => Promise<void>;
  changePassword: (newPassword: string) => Promise<boolean>;
  resetPassword: (email: string) => Promise<boolean>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider = ({ children }: { children: ReactNode }) => {
  const [user, setUser] = useState<User | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const initialLoadDone = useRef(false);

  // Verificar se está autenticado
  const isAuthenticated = !!user;

  // 🔄 Carregar usuário autenticado ao iniciar
  useEffect(() => {
    const initializeAuth = async () => {
      try {
        // Obter sessão atual do Supabase
        const { data: { session }, error } = await supabase.auth.getSession();
        
        if (error) {
          console.error('Erro ao obter sessão');
          setIsLoading(false);
          return;
        }

        if (session?.user) {
          await loadUserProfile(session.user.id);
        }
      } catch (error) {
        console.error('Erro ao inicializar autenticação');
      } finally {
        setIsLoading(false);
        initialLoadDone.current = true;
      }
    };

    initializeAuth();

    // Listener para mudanças no estado de autenticação
    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      async (event, session) => {
        // Apenas carregar perfil se for um login NOVO (não na inicialização)
        if (event === 'SIGNED_IN' && session?.user && initialLoadDone.current) {
          await loadUserProfile(session.user.id);
        } else if (event === 'SIGNED_OUT') {
          setUser(null);
        }
      }
    );

    return () => {
      subscription.unsubscribe();
    };
  }, []);

  // 👤 Função para carregar o perfil do usuário
  const loadUserProfile = async (userId: string) => {
    try {
      // Buscar perfil do usuário na tabela perfis
      const { data: profile, error } = await supabase
        .from('perfis')
        .select('*')
        .eq('id', userId)
        .single();

      if (error) {
        // Se não existir perfil, criar automaticamente
        const { data: { user: authUser }, error: authError } = await supabase.auth.getUser();
        
        if (authError) {
          setIsLoading(false);
          return;
        }
        
        if (authUser) {
          // Tentar criar o perfil
          const { data: insertData, error: insertError } = await supabase
            .from('perfis')
            .insert([{
              id: authUser.id,
              email: authUser.email,
              nome: authUser.user_metadata?.name || null,
              criado_em: new Date().toISOString(),
              atualizado_em: new Date().toISOString()
            }])
            .select()
            .single();

          if (insertError && insertError.code !== '23505') {
            console.error('Erro ao criar perfil');
          }
          
          // Definir usuário local SEMPRE (mesmo se a criação falhar)
          setUser({
            id: authUser.id,
            email: authUser.email || '',
            name: authUser.user_metadata?.name || null,
            username: authUser.email?.split('@')[0],
            role: 'user'
          });
        }
        setIsLoading(false);
        return;
      }

      // Definir dados do usuário
      setUser({
        id: profile.id,
        email: profile.email,
        name: profile.nome,
        username: profile.email.split('@')[0],
        role: 'user'
      });

      setIsLoading(false);
    } catch (error) {
      console.error('Erro ao carregar perfil');
      setIsLoading(false);
      setUser(null);
    }
  };

  // 🔑 Função de login com Supabase
  const login = async (email: string, password: string): Promise<boolean> => {
    try {
      setIsLoading(true);
      
      const { data, error } = await supabase.auth.signInWithPassword({
        email,
        password
      });

      if (error) {
        
        // Traduzir mensagens de erro
        const errorMessages: Record<string, string> = {
          'Invalid login credentials': 'Email ou senha incorretos',
          'Email not confirmed': 'Email não confirmado. Verifique sua caixa de entrada.',
          'User not found': 'Usuário não encontrado',
          'Invalid email': 'Email inválido',
        };
        
        const errorMsg = errorMessages[error.message] || error.message;
        
        toast({
          title: "❌ Erro no login",
          description: errorMsg,
          variant: "destructive"
        });
        
        return false;
      }

      if (data.user) {
        await loadUserProfile(data.user.id);
        
        toast({
          title: "✅ Login realizado!",
          description: `Bem-vindo(a) de volta!`,
        });
        
        return true;
      }

      return false;
    } catch (error: any) {
      
      toast({
        title: "❌ Erro no login",
        description: "Não foi possível conectar. Tente novamente.",
        variant: "destructive"
      });
      
      return false;
    } finally {
      setIsLoading(false);
    }
  };

  // 🚪 Função de logout
  const logout = async () => {
    try {
      const { error } = await supabase.auth.signOut();
      
      if (error) {
        return;
      }
      
      setUser(null);
      
      toast({
        title: "👋 Até logo!",
        description: "Logout realizado com sucesso.",
      });
    } catch (error) {
      console.error('Erro ao fazer logout');
    }
  };

  // 📝 Função de registro com Supabase
  const register = async (email: string, password: string, name: string): Promise<boolean> => {
    try {
      setIsLoading(true);
      
      const { data, error } = await supabase.auth.signUp({
        email,
        password,
        options: {
          data: {
            name: name
          }
        }
      });

      if (error) {
        
        // Traduzir mensagens de erro
        const errorMessages: Record<string, string> = {
          'User already registered': 'Usuário já cadastrado. Por favor, faça login.',
          'Invalid email': 'Email inválido',
          'Password should be at least 6 characters': 'A senha deve ter pelo menos 6 caracteres',
          'Email not confirmed': 'Email não confirmado. Verifique sua caixa de entrada.',
        };
        
        const errorMsg = errorMessages[error.message] || error.message;
        
        toast({
          title: "❌ Erro no registro",
          description: errorMsg,
          variant: "destructive"
        });
        
        return false;
      }

      if (data.user) {
        toast({
          title: "✅ Cadastro realizado!",
          description: "Verifique seu email para confirmar o cadastro.",
        });
        
        // Se a confirmação de email estiver desabilitada, carregar perfil
        if (data.session) {
          await loadUserProfile(data.user.id);
        }
        
        return true;
      }

      return false;
    } catch (error: any) {
      
      toast({
        title: "❌ Erro no registro",
        description: "Não foi possível criar a conta. Tente novamente.",
        variant: "destructive"
      });
      
      return false;
    } finally {
      setIsLoading(false);
    }
  };

  // ✏️ Função para atualizar perfil
  const updateProfile = async (userData: Partial<User>): Promise<void> => {
    try {
      if (!user) {
        throw new Error('Usuário não autenticado');
      }
      
      // Atualizar na tabela perfis
      const { error } = await supabase
        .from('perfis')
        .update({
          nome: userData.name,
          atualizado_em: new Date().toISOString()
        })
        .eq('id', user.id);

      if (error) {
        throw error;
      }

      // Atualizar estado local
      setUser({
        ...user,
        ...userData
      });
      
      toast({
        title: "✅ Perfil atualizado!",
        description: "Suas informações foram salvas com sucesso.",
      });
    } catch (error: any) {
      
      toast({
        title: "❌ Erro ao atualizar perfil",
        description: error.message,
        variant: "destructive"
      });
      
      throw error;
    }
  };

  // 🔐 Função para trocar senha
  const changePassword = async (newPassword: string): Promise<boolean> => {
    try {
      if (!user) {
        toast({
          title: "❌ Não Autenticado",
          description: "Faça login novamente.",
          variant: "destructive"
        });
        return false;
      }

      // Tentar renovar a sessão primeiro
      const { data: { session }, error: sessionError } = await supabase.auth.refreshSession();
      
      if (sessionError || !session) {
        toast({
          title: "❌ Sessão Expirada",
          description: "Sua sessão expirou. Faça login novamente.",
          variant: "destructive"
        });
        
        // Fazer logout para limpar dados
        setTimeout(() => {
          logout();
        }, 2000);
        
        return false;
      }
      
      // Agora sim, tentar trocar a senha
      const { error } = await supabase.auth.updateUser({
        password: newPassword
      });

      if (error) {
        toast({
          title: "❌ Erro ao alterar senha",
          description: error.message,
          variant: "destructive"
        });
        return false;
      }
      
      toast({
        title: "✅ Senha alterada!",
        description: "Sua senha foi atualizada com sucesso.",
      });
      
      return true;
    } catch (error: any) {
      console.error('Erro ao alterar senha:', error);
      
      toast({
        title: "❌ Erro ao alterar senha",
        description: "Não foi possível alterar a senha. Tente novamente.",
        variant: "destructive"
      });
      
      return false;
    }
  };

  // 🔄 Função para recuperar senha
  const resetPassword = async (email: string): Promise<boolean> => {
    try {
      const { error } = await supabase.auth.resetPasswordForEmail(email, {
        redirectTo: `${window.location.origin}/reset-password`
      });

      if (error) {
        
        // Traduzir mensagens de erro
        const errorMessages: Record<string, string> = {
          'User not found': 'Usuário não encontrado. Verifique o email digitado.',
          'Invalid email': 'Email inválido',
          'Email rate limit exceeded': 'Muitas tentativas. Aguarde alguns minutos e tente novamente.',
        };
        
        const errorMsg = errorMessages[error.message] || error.message;
        
        toast({
          title: "❌ Erro ao enviar email",
          description: errorMsg,
          variant: "destructive"
        });
        
        return false;
      }
      
      toast({
        title: "✅ Email enviado!",
        description: "Verifique sua caixa de entrada para redefinir a senha.",
      });
      
      return true;
    } catch (error: any) {
      
      toast({
        title: "❌ Erro ao enviar email",
        description: "Não foi possível enviar o email. Tente novamente.",
        variant: "destructive"
      });
      
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
      changePassword,
      resetPassword
    }}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth deve ser usado dentro de um AuthProvider');
  }
  return context;
};
