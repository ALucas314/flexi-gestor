/**
 * Configuração do Cliente Supabase
 * 
 * Este arquivo inicializa e exporta o cliente Supabase
 * para ser usado em toda a aplicação
 */

import { createClient } from '@supabase/supabase-js'

// Obter as variáveis de ambiente
const supabaseUrl = import.meta.env.VITE_SUPABASE_URL
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY

// Verificar se as variáveis existem
if (!supabaseUrl || !supabaseAnonKey) {
  throw new Error('Credenciais do Supabase não encontradas nas variáveis de ambiente')
}

// Listener global para tratar erros de autenticação do Supabase
// Configurar interceptadores ANTES de criar o cliente Supabase
if (typeof window !== 'undefined') {
  // Função auxiliar para limpar tokens inválidos
  const clearInvalidTokens = () => {
    try {
      const keys = Object.keys(localStorage);
      keys.forEach(key => {
        if (key.includes('supabase.auth.token') || 
            (key.includes('sb-') && key.includes('-auth-token'))) {
          localStorage.removeItem(key);
        }
      });
    } catch {
      // Ignorar erros ao limpar
    }
  };

  // Interceptar console.error ANTES de qualquer coisa para suprimir erros de refresh token
  const originalConsoleError = console.error;
  console.error = (...args: any[]) => {
    const errorMessage = args.join(' ');
    // Suprimir erros específicos de refresh token inválido
    const isRefreshTokenError = 
      errorMessage.includes('Invalid Refresh Token') ||
      errorMessage.includes('Refresh Token Not Found') ||
      errorMessage.includes('refresh_token') ||
      (errorMessage.includes('auth/v1/token') && errorMessage.includes('400')) ||
      (errorMessage.includes('400 (Bad Request)') && errorMessage.includes('token')) ||
      (errorMessage.includes('POST') && errorMessage.includes('auth/v1/token') && errorMessage.includes('400')) ||
      (errorMessage.includes('grant_type=refresh_token') && errorMessage.includes('400'));
    
    if (isRefreshTokenError) {
      // Não logar esses erros, apenas ignorar silenciosamente
      return;
    }
    // Para todos os outros erros, logar normalmente
    originalConsoleError.apply(console, args);
  };
}

// Criar e exportar o cliente Supabase com configurações de persistência
export const supabase = createClient(supabaseUrl, supabaseAnonKey, {
  auth: {
    // Persistir sessão no localStorage (não expira ao fechar aba)
    persistSession: true,
    // Auto-refresh do token antes de expirar
    autoRefreshToken: true,
    // Detectar mudanças de sessão em outras abas
    detectSessionInUrl: true,
    // Storage personalizado (usa localStorage por padrão)
    storage: typeof window !== 'undefined' ? window.localStorage : undefined,
    // Tentar recuperar sessão automaticamente
    flowType: 'pkce',
  },
  // Configurações do Realtime otimizadas para reconexão automática
  realtime: {
    params: {
      eventsPerSecond: 10
    },
    heartbeatIntervalMs: 30000,  // Heartbeat a cada 30s para manter conexão viva
    reconnectAfterMs: (tries: number) => Math.min(tries * 1000, 10000) // Reconexão rápida
  },
  // Configuração global para evitar erros de rede
  global: {
    headers: {
      'X-Client-Info': 'flexi-gestor'
    }
  }
})

// Listener global para tratar erros de autenticação do Supabase
if (typeof window !== 'undefined') {
  // Função auxiliar para limpar tokens inválidos (já definida acima, mas mantida aqui para compatibilidade)
  const clearInvalidTokens = () => {
    try {
      const keys = Object.keys(localStorage);
      keys.forEach(key => {
        if (key.includes('supabase.auth.token') || 
            (key.includes('sb-') && key.includes('-auth-token'))) {
          localStorage.removeItem(key);
        }
      });
    } catch {
      // Ignorar erros ao limpar
    }
  };

  // Escutar mudanças de autenticação para tratar erros de refresh token
  supabase.auth.onAuthStateChange(async (event, session) => {
    // Se o token foi revogado ou expirado, limpar localmente
    if (event === 'TOKEN_REFRESHED' && !session) {
      clearInvalidTokens();
    }
    
    // Se houver erro de sessão, limpar tokens inválidos
    if (event === 'SIGNED_OUT' || event === 'USER_UPDATED') {
      // Verificar se a sessão foi perdida devido a token inválido
      try {
        const { error } = await supabase.auth.getSession();
        if (error && (error.message.includes('refresh_token') || 
                     error.message.includes('Invalid') ||
                     error.message.includes('JWT'))) {
          clearInvalidTokens();
        }
      } catch {
        // Ignorar erros
      }
    }
  });

  // Limpar tokens inválidos na inicialização se houver erro de refresh
  // Isso evita que o erro 400 apareça no console
  const initializeAuthCleanup = async () => {
    try {
      // Aguardar um pouco para o Supabase tentar inicializar
      setTimeout(async () => {
        try {
          const { error } = await supabase.auth.getSession();
          if (error && (error.message.includes('refresh_token') || 
                       error.message.includes('Invalid') ||
                       error.message.includes('JWT') ||
                       error.message.includes('400'))) {
            // Limpar tokens inválidos silenciosamente
            clearInvalidTokens();
            // Fazer signOut local para limpar estado
            await supabase.auth.signOut({ scope: 'local' });
          }
        } catch {
          // Ignorar erros durante limpeza inicial
        }
      }, 1000);
    } catch {
      // Ignorar erros
    }
  };
  
  initializeAuthCleanup();

  // Interceptar erros de rede do fetch para suprimir erros 400 de refresh token
  // Apenas para requisições específicas do Supabase Auth
  const originalFetch = window.fetch;
  window.fetch = async (...args) => {
    const [url, options] = args;
    const urlString = typeof url === 'string' ? url : url.toString();
    
    // Verificar se é uma requisição de refresh token do Supabase
    const isRefreshTokenRequest = urlString.includes('auth/v1/token') && 
                                  (urlString.includes('grant_type=refresh_token') || 
                                   (options && typeof options === 'object' && 'body' in options && 
                                    typeof options.body === 'string' && 
                                    options.body.includes('refresh_token')));
    
    try {
      const response = await originalFetch(...args);
      
      // Se for uma requisição de refresh token que retornou 400, limpar tokens silenciosamente
      if (isRefreshTokenRequest && response.status === 400) {
        clearInvalidTokens();
        // Clonar a resposta para poder lê-la sem afetar o Supabase
        const clonedResponse = response.clone();
        try {
          const errorData = await clonedResponse.json();
          // Se o erro indica token inválido, limpar tokens e suprimir o erro
          if (errorData.error === 'invalid_grant' || 
              errorData.error_description?.includes('refresh') ||
              errorData.message?.includes('refresh')) {
            // Não propagar o erro visível, apenas limpar tokens
            return response;
          }
        } catch {
          // Se não conseguir ler o JSON, ainda assim limpar tokens
          clearInvalidTokens();
        }
      }
      
      return response;
    } catch (error: any) {
      // Se for erro de rede relacionado a refresh token, limpar tokens
      if (isRefreshTokenRequest) {
        clearInvalidTokens();
      }
      throw error;
    }
  };

}

// Tipos do banco de dados
export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[]

// Interface de Produto
export interface Product {
  id: string
  name: string
  sku: string
  category: string
  price: number
  stock: number
  min_stock: number
  unit_of_measure: string
  supplier: string
  description: string | null
  created_at: string
  updated_at: string
}

// Interface de Lote (Batch)
export interface Batch {
  id: string
  product_id: string
  batch_number: string
  quantity: number
  unit_cost: number
  expiry_date: string | null
  created_at: string
}

// Interface de Movimentação
export interface Movement {
  id: string
  product_id: string
  type: 'entrada' | 'saida'
  quantity: number
  unit_price: number
  total_price: number
  payment_method: string | null
  notes: string | null
  receipt_number: string | null
  created_at: string
  product?: Product
}

// Interface de Usuário
export interface User {
  id: string
  email: string
  name: string | null
  created_at: string
  updated_at: string
}

