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

// Criar e exportar o cliente Supabase
export const supabase = createClient(supabaseUrl, supabaseAnonKey)

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

