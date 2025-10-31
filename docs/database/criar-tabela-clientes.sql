-- ========================================
-- CRIAR TABELA DE CLIENTES
-- Flexi Gestor - Supabase PostgreSQL
-- ========================================
-- 
-- INSTRUÇÕES:
-- 1. Execute este script no SQL Editor do Supabase
-- 2. A tabela será criada com RLS (Row Level Security) habilitado
-- 3. Todos os usuários têm acesso apenas aos seus próprios dados
--
-- ========================================

-- Criar tabela de clientes
CREATE TABLE IF NOT EXISTS public.clientes (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  codigo TEXT NOT NULL,
  nome TEXT NOT NULL,
  cpf TEXT,
  telefone TEXT,
  usuario_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  criado_em TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  atualizado_em TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Comentários
COMMENT ON TABLE public.clientes IS 'Cadastro de clientes';
COMMENT ON COLUMN public.clientes.codigo IS 'Código único do cliente';
COMMENT ON COLUMN public.clientes.nome IS 'Nome completo do cliente';
COMMENT ON COLUMN public.clientes.cpf IS 'CPF do cliente';
COMMENT ON COLUMN public.clientes.telefone IS 'Telefone do cliente';

-- RLS (Row Level Security)
ALTER TABLE public.clientes ENABLE ROW LEVEL SECURITY;

-- Políticas de acesso
DROP POLICY IF EXISTS "Usuarios podem ver proprios clientes" ON public.clientes;
CREATE POLICY "Usuarios podem ver proprios clientes" ON public.clientes
  FOR SELECT USING (auth.uid() = usuario_id);

DROP POLICY IF EXISTS "Usuarios podem inserir proprios clientes" ON public.clientes;
CREATE POLICY "Usuarios podem inserir proprios clientes" ON public.clientes
  FOR INSERT WITH CHECK (auth.uid() = usuario_id);

DROP POLICY IF EXISTS "Usuarios podem atualizar proprios clientes" ON public.clientes;
CREATE POLICY "Usuarios podem atualizar proprios clientes" ON public.clientes
  FOR UPDATE USING (auth.uid() = usuario_id);

DROP POLICY IF EXISTS "Usuarios podem deletar proprios clientes" ON public.clientes;
CREATE POLICY "Usuarios podem deletar proprios clientes" ON public.clientes
  FOR DELETE USING (auth.uid() = usuario_id);

-- Criar índice para melhorar performance de buscas
CREATE INDEX IF NOT EXISTS idx_clientes_usuario_id ON public.clientes(usuario_id);
CREATE INDEX IF NOT EXISTS idx_clientes_codigo ON public.clientes(codigo);

