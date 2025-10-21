-- ========================================
-- FLEXI GESTOR - SCHEMA DO BANCO DE DADOS
-- Supabase PostgreSQL
-- ========================================

-- Habilitar extensões necessárias
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- ========================================
-- 1. TABELA DE USUÁRIOS (usa auth.users do Supabase)
-- Tabela adicional para dados do perfil
-- ========================================
CREATE TABLE IF NOT EXISTS public.profiles (
  id UUID REFERENCES auth.users(id) ON DELETE CASCADE PRIMARY KEY,
  email TEXT UNIQUE NOT NULL,
  name TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- RLS (Row Level Security) para profiles
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;

-- Política: Usuários podem ver apenas seu próprio perfil
CREATE POLICY "Users can view own profile" ON public.profiles
  FOR SELECT USING (auth.uid() = id);

-- Política: Usuários podem atualizar apenas seu próprio perfil
CREATE POLICY "Users can update own profile" ON public.profiles
  FOR UPDATE USING (auth.uid() = id);

-- ========================================
-- 2. TABELA DE PRODUTOS
-- ========================================
CREATE TABLE IF NOT EXISTS public.products (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  name TEXT NOT NULL,
  sku TEXT UNIQUE NOT NULL,
  category TEXT NOT NULL,
  price DECIMAL(10, 2) NOT NULL DEFAULT 0,
  stock INTEGER NOT NULL DEFAULT 0,
  min_stock INTEGER NOT NULL DEFAULT 0,
  unit_of_measure TEXT NOT NULL,
  supplier TEXT NOT NULL,
  description TEXT,
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Índices para melhorar performance
CREATE INDEX IF NOT EXISTS idx_products_sku ON public.products(sku);
CREATE INDEX IF NOT EXISTS idx_products_user_id ON public.products(user_id);
CREATE INDEX IF NOT EXISTS idx_products_category ON public.products(category);

-- RLS para products
ALTER TABLE public.products ENABLE ROW LEVEL SECURITY;

-- Política: Usuários podem ver apenas seus próprios produtos
CREATE POLICY "Users can view own products" ON public.products
  FOR SELECT USING (auth.uid() = user_id);

-- Política: Usuários podem inserir seus próprios produtos
CREATE POLICY "Users can insert own products" ON public.products
  FOR INSERT WITH CHECK (auth.uid() = user_id);

-- Política: Usuários podem atualizar seus próprios produtos
CREATE POLICY "Users can update own products" ON public.products
  FOR UPDATE USING (auth.uid() = user_id);

-- Política: Usuários podem deletar seus próprios produtos
CREATE POLICY "Users can delete own products" ON public.products
  FOR DELETE USING (auth.uid() = user_id);

-- ========================================
-- 3. TABELA DE LOTES (BATCHES)
-- ========================================
CREATE TABLE IF NOT EXISTS public.batches (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  product_id UUID REFERENCES public.products(id) ON DELETE CASCADE NOT NULL,
  batch_number TEXT NOT NULL,
  quantity INTEGER NOT NULL DEFAULT 0,
  unit_cost DECIMAL(10, 2) NOT NULL DEFAULT 0,
  expiry_date DATE,
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Índices
CREATE INDEX IF NOT EXISTS idx_batches_product_id ON public.batches(product_id);
CREATE INDEX IF NOT EXISTS idx_batches_user_id ON public.batches(user_id);

-- RLS para batches
ALTER TABLE public.batches ENABLE ROW LEVEL SECURITY;

-- Política: Usuários podem ver apenas seus próprios lotes
CREATE POLICY "Users can view own batches" ON public.batches
  FOR SELECT USING (auth.uid() = user_id);

-- Política: Usuários podem inserir seus próprios lotes
CREATE POLICY "Users can insert own batches" ON public.batches
  FOR INSERT WITH CHECK (auth.uid() = user_id);

-- Política: Usuários podem atualizar seus próprios lotes
CREATE POLICY "Users can update own batches" ON public.batches
  FOR UPDATE USING (auth.uid() = user_id);

-- Política: Usuários podem deletar seus próprios lotes
CREATE POLICY "Users can delete own batches" ON public.batches
  FOR DELETE USING (auth.uid() = user_id);

-- ========================================
-- 4. TABELA DE MOVIMENTAÇÕES
-- ========================================
CREATE TABLE IF NOT EXISTS public.movements (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  product_id UUID REFERENCES public.products(id) ON DELETE CASCADE NOT NULL,
  type TEXT NOT NULL CHECK (type IN ('entrada', 'saida')),
  quantity INTEGER NOT NULL,
  unit_price DECIMAL(10, 2) NOT NULL DEFAULT 0,
  total_price DECIMAL(10, 2) NOT NULL DEFAULT 0,
  payment_method TEXT,
  notes TEXT,
  receipt_number TEXT,
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Índices
CREATE INDEX IF NOT EXISTS idx_movements_product_id ON public.movements(product_id);
CREATE INDEX IF NOT EXISTS idx_movements_user_id ON public.movements(user_id);
CREATE INDEX IF NOT EXISTS idx_movements_type ON public.movements(type);
CREATE INDEX IF NOT EXISTS idx_movements_created_at ON public.movements(created_at);

-- RLS para movements
ALTER TABLE public.movements ENABLE ROW LEVEL SECURITY;

-- Política: Usuários podem ver apenas suas próprias movimentações
CREATE POLICY "Users can view own movements" ON public.movements
  FOR SELECT USING (auth.uid() = user_id);

-- Política: Usuários podem inserir suas próprias movimentações
CREATE POLICY "Users can insert own movements" ON public.movements
  FOR INSERT WITH CHECK (auth.uid() = user_id);

-- Política: Usuários podem atualizar suas próprias movimentações
CREATE POLICY "Users can update own movements" ON public.movements
  FOR UPDATE USING (auth.uid() = user_id);

-- Política: Usuários podem deletar suas próprias movimentações
CREATE POLICY "Users can delete own movements" ON public.movements
  FOR DELETE USING (auth.uid() = user_id);

-- ========================================
-- 5. FUNÇÕES E TRIGGERS
-- ========================================

-- Função para atualizar updated_at automaticamente
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Trigger para profiles
CREATE TRIGGER update_profiles_updated_at
  BEFORE UPDATE ON public.profiles
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

-- Trigger para products
CREATE TRIGGER update_products_updated_at
  BEFORE UPDATE ON public.products
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

-- Função para criar perfil automaticamente quando um usuário se registra
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO public.profiles (id, email, name)
  VALUES (NEW.id, NEW.email, NEW.raw_user_meta_data->>'name');
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Trigger para criar perfil automaticamente
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW
  EXECUTE FUNCTION public.handle_new_user();

-- ========================================
-- 6. VIEWS ÚTEIS (OPCIONAL)
-- ========================================

-- View de produtos com estoque baixo
CREATE OR REPLACE VIEW public.low_stock_products AS
SELECT 
  p.id,
  p.name,
  p.sku,
  p.category,
  p.stock,
  p.min_stock,
  p.user_id
FROM public.products p
WHERE p.stock <= p.min_stock;

-- ========================================
-- SCRIPT FINALIZADO COM SUCESSO! ✅
-- ========================================

