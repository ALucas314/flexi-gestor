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
  register: (email: string, password: string, name: string, username?: string) => Promise<boolean>;
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
        // Limpar tokens inválidos do localStorage se houver erro de refresh
        const clearInvalidTokens = () => {
          try {
            const keys = Object.keys(localStorage);
            keys.forEach(key => {
              if (key.includes('supabase') || key.includes('auth-token')) {
                localStorage.removeItem(key);
              }
            });
          } catch (e) {
            // Ignorar erros ao limpar
          }
        };

        // Verificar se há tokens no localStorage antes de tentar obter sessão
        const hasStoredTokens = () => {
          try {
            const keys = Object.keys(localStorage);
            return keys.some(key => key.includes('supabase.auth.token'));
          } catch {
            return false;
          }
        };

        // Obter sessão atual do Supabase com tratamento de erro melhorado
        let session = null;
        let sessionError = null;
        
        try {
          const result = await supabase.auth.getSession();
          session = result.data?.session;
          sessionError = result.error;
        } catch (err: any) {
          sessionError = err;
        }
        
        // Se houver erro de refresh token inválido, limpar e continuar sem sessão
        if (sessionError) {
          const errorMessage = sessionError?.message || '';
          const isInvalidTokenError = errorMessage.includes('Invalid Refresh Token') || 
                                     errorMessage.includes('Refresh Token Not Found') ||
                                     errorMessage.includes('refresh_token') ||
                                     errorMessage.includes('JWT');
          
          if (isInvalidTokenError) {
            // Limpar tokens inválidos silenciosamente
            clearInvalidTokens();
            try {
              await supabase.auth.signOut({ scope: 'local' });
            } catch {
              // Ignorar erros ao fazer signOut
            }
          }
          
          setIsLoading(false);
          initialLoadDone.current = true;
          return;
        }

        // SEMPRE verificar se há sessão válida, independente de tokens no localStorage
        // O Supabase pode manter a sessão mesmo sem tokens explícitos no localStorage
        if (session?.user) {
          await loadUserProfile(session.user.id);
        } else {
          // Se não há sessão, verificar se o usuário ainda existe no Supabase
          try {
            const { data: { user: currentUser } } = await supabase.auth.getUser();
            if (currentUser) {
              // Há um usuário autenticado, mas sem sessão ativa no momento
              // Tentar recarregar o perfil mesmo assim
              await loadUserProfile(currentUser.id);
            }
          } catch (err) {
            // Não há usuário autenticado, continuar sem usuário
          }
        }
        
        initialLoadDone.current = true;
      } catch (error: any) {
        // Tratar erros de refresh token silenciosamente
        const errorMessage = error?.message || '';
        const isInvalidTokenError = errorMessage.includes('Invalid Refresh Token') || 
                                   errorMessage.includes('Refresh Token Not Found') ||
                                   errorMessage.includes('refresh_token') ||
                                   errorMessage.includes('JWT');
        
        if (isInvalidTokenError) {
          // Limpar tokens inválidos e continuar
          try {
            const keys = Object.keys(localStorage);
            keys.forEach(key => {
              if (key.includes('supabase') || key.includes('auth-token')) {
                localStorage.removeItem(key);
              }
            });
            await supabase.auth.signOut({ scope: 'local' });
          } catch (e) {
            // Ignorar erros ao fazer signOut
          }
        }
      } finally {
        setIsLoading(false);
        initialLoadDone.current = true;
      }
    };

    initializeAuth();

    // Listener para mudanças no estado de autenticação
    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      async (event, session) => {
        try {
          // Tratar erros de token inválido
          if (event === 'TOKEN_REFRESHED' && !session) {
            // Token inválido ou expirado
            setUser(null);
            return;
          }

          // Carregar perfil quando houver sessão válida e eventos relevantes
          // Isso garante que após F5, se houver sessão restaurada, o perfil seja carregado
          if (session?.user) {
            // Carregar perfil se:
            // 1. Login novo (após inicialização estar completa)
            // 2. Token renovado (sessão restaurada após F5)
            // 3. Qualquer mudança de autenticação com sessão válida (após inicialização)
            if ((event === 'SIGNED_IN' || event === 'TOKEN_REFRESHED' || event === 'USER_UPDATED') && initialLoadDone.current) {
              await loadUserProfile(session.user.id);
            }
          } else if (event === 'SIGNED_OUT') {
            setUser(null);
          }
        } catch (error: any) {
          // Ignorar erros silenciosamente para evitar loops de erro
          const errorMessage = error?.message || '';
          if (errorMessage.includes('Invalid Refresh Token') || 
              errorMessage.includes('Refresh Token Not Found')) {
            setUser(null);
            try {
              await supabase.auth.signOut({ scope: 'local' });
            } catch {
              // Ignorar erros ao fazer signOut
            }
          }
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
          return;
        }
        
        if (authUser) {
          // Tentar criar o perfil
          const { data: insertData, error: insertError } = await supabase
            .from('perfis')
            .insert([{
              id: authUser.id,
              email: authUser.email,
              nome: authUser.user_metadata?.username || authUser.user_metadata?.name || null,
              criado_em: new Date().toISOString(),
              atualizado_em: new Date().toISOString()
            }])
            .select()
            .single();

          if (insertError && insertError.code !== '23505') {
            // Erro ao criar perfil
          }
          
          // Definir usuário local SEMPRE (mesmo se a criação falhar)
          // Priorizar username do user_metadata sobre tudo
          const usernameFromMetadata = authUser.user_metadata?.username;
          setUser({
            id: authUser.id,
            email: authUser.email || '',
            name: authUser.user_metadata?.name || null,
            username: usernameFromMetadata || authUser.email?.split('@')[0], // Username sempre do metadata
            role: 'user'
          });
        }
        return;
      }

      // Definir dados do usuário
      // Buscar username do user_metadata (prioridade máxima)
      const { data: { user: authUser } } = await supabase.auth.getUser();
      
      // Username vem APENAS do user_metadata, nunca do profile.nome
      let usernameFromMetadata = authUser?.user_metadata?.username;
      
      // Se não tem username no metadata mas tem no perfil.nome (para contas antigas)
      // e o profile.nome parece ser um username (sem espaços, tudo minúsculo/números)
      if (!usernameFromMetadata && profile.nome) {
        const nomeValue = profile.nome.trim();
        // Se parece ser um username (sem espaços e não é muito longo)
        if (!nomeValue.includes(' ') && nomeValue.length <= 20 && /^[a-z0-9_-]+$/i.test(nomeValue)) {
          usernameFromMetadata = nomeValue;
          // Atualizar user_metadata para ter o username
          await supabase.auth.updateUser({
            data: {
              ...authUser?.user_metadata,
              username: nomeValue
            }
          });
        }
      }
      
      const username = usernameFromMetadata || authUser?.email?.split('@')[0] || profile.email.split('@')[0];
      
      // Name pode vir do user_metadata.name ou profile.nome (se não for username)
      // Não usar profile.nome como name se ele parece ser um username
      let displayName = authUser?.user_metadata?.name;
      if (!displayName && profile.nome) {
        // Se profile.nome não é um username, usar como displayName
        const nomeValue = profile.nome.trim();
        if (nomeValue.includes(' ') || nomeValue.length > 20 || !/^[a-z0-9_-]+$/i.test(nomeValue)) {
          displayName = nomeValue;
        }
      }
      
      // DEBUG: Log temporário para verificar valores
      console.log('[AuthContext] Carregando perfil:', {
        usernameFromMetadata,
        profileNome: profile.nome,
        userMetadataName: authUser?.user_metadata?.name,
        usernameFinal: username,
        displayNameFinal: displayName,
        email: profile.email
      });
      
      setUser({
        id: profile.id,
        email: profile.email,
        name: displayName,
        username: username, // Sempre prioriza user_metadata.username
        role: 'user'
      });
    } catch (error) {
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
      // Limpar usuário imediatamente
      setUser(null);
      
      // Fazer signOut do Supabase
      const { error } = await supabase.auth.signOut();
      
      // Limpar localStorage completamente
      try {
        const keys = Object.keys(localStorage);
        keys.forEach(key => {
          if (key.includes('supabase') || key.includes('auth-token')) {
            localStorage.removeItem(key);
          }
        });
      } catch (e) {
        // Ignorar erros ao limpar
      }
      
      if (error) {
        console.error('Erro ao fazer logout:', error);
      }
      
      toast({
        title: "👋 Até logo!",
        description: "Logout realizado com sucesso.",
      });
      
      // Redirecionar para login após um pequeno delay para garantir que o estado foi atualizado
      setTimeout(() => {
        window.location.href = '/login';
      }, 100);
    } catch (error) {
      console.error('Erro ao fazer logout:', error);
      // Mesmo em caso de erro, redirecionar para login
      setUser(null);
      setTimeout(() => {
        window.location.href = '/login';
      }, 100);
    }
  };

  // 📝 Função de registro com Supabase
  const register = async (email: string, password: string, name: string, username?: string): Promise<boolean> => {
    try {
      setIsLoading(true);
      
      const { data, error } = await supabase.auth.signUp({
        email,
        password,
        options: {
          data: {
            name: name,
            username: username || email.split('@')[0]
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
        
        setIsLoading(false);
        return false;
      }

      if (data.user) {
        // Se a confirmação de email estiver desabilitada, carregar perfil
        if (data.session) {
          await loadUserProfile(data.user.id);
          
          toast({
            title: "✅ Bem-vindo ao Flexi Gestor!",
            description: `Olá ${name}! Seu cadastro foi realizado com sucesso.`,
          });
        } else {
          toast({
            title: "✅ Cadastro realizado!",
            description: "Verifique seu email para confirmar o cadastro.",
          });
        }
        
        setIsLoading(false);
        return true;
      }

      setIsLoading(false);
      return false;
    } catch (error: any) {
      toast({
        title: "❌ Erro no registro",
        description: "Não foi possível criar a conta. Tente novamente.",
        variant: "destructive"
      });
      
      setIsLoading(false);
      return false;
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

