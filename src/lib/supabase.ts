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
  // Desabilitar Realtime por padrão para evitar problemas de CSP
  // Se precisar usar Realtime, pode ser habilitado depois
  realtime: {
    params: {
      eventsPerSecond: 10
    }
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
  // Escutar mudanças de autenticação para tratar erros de refresh token
  supabase.auth.onAuthStateChange((event, session) => {
    // Se o token foi revogado ou expirado, limpar localmente
    if (event === 'TOKEN_REFRESHED' && !session) {
      try {
        const keys = Object.keys(localStorage);
        keys.forEach(key => {
          if (key.includes('supabase.auth.token')) {
            localStorage.removeItem(key);
          }
        });
      } catch {
        // Ignorar erros
      }
    }
  });

  // Interceptar console.error para suprimir erros de refresh token
  const originalConsoleError = console.error;
  console.error = (...args: any[]) => {
    const errorMessage = args.join(' ');
    // Suprimir erros específicos de refresh token inválido
    if (errorMessage.includes('Invalid Refresh Token') ||
        errorMessage.includes('Refresh Token Not Found') ||
        errorMessage.includes('refresh_token')) {
      // Não logar esses erros, apenas ignorar
      return;
    }
    // Para todos os outros erros, logar normalmente
    originalConsoleError.apply(console, args);
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

