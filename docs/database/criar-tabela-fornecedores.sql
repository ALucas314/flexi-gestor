-- ========================================
-- CRIAR TABELA DE FORNECEDORES
-- Flexi Gestor - Supabase PostgreSQL
-- ========================================
-- 
-- INSTRUÇÕES:
-- 1. Execute este script no SQL Editor do Supabase
-- 2. A tabela será criada com RLS (Row Level Security) habilitado
-- 3. Todos os usuários têm acesso apenas aos seus próprios dados
--
-- ========================================

-- Criar tabela de fornecedores (se não existir)
CREATE TABLE IF NOT EXISTS public.fornecedores (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  codigo TEXT NOT NULL,
  nome TEXT NOT NULL,
  cpf TEXT,
  telefone TEXT,
  usuario_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  criado_em TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  atualizado_em TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Adicionar coluna usuario_id se a tabela já existir mas não tiver essa coluna
DO $$ 
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_schema = 'public' 
    AND table_name = 'fornecedores' 
    AND column_name = 'usuario_id'
  ) THEN
    ALTER TABLE public.fornecedores 
    ADD COLUMN usuario_id UUID REFERENCES auth.users(id) ON DELETE CASCADE;
    
    -- Atualizar registros existentes com o ID do usuário atual (se houver sessão)
    -- Nota: Isso requer que você execute manualmente ou tenha uma estratégia de migração
    -- UPDATE public.fornecedores SET usuario_id = auth.uid() WHERE usuario_id IS NULL;
  END IF;
END $$;

-- Comentários
COMMENT ON TABLE public.fornecedores IS 'Cadastro de fornecedores';
COMMENT ON COLUMN public.fornecedores.codigo IS 'Código único do fornecedor';
COMMENT ON COLUMN public.fornecedores.nome IS 'Nome completo do fornecedor';
COMMENT ON COLUMN public.fornecedores.cpf IS 'CPF do fornecedor';
COMMENT ON COLUMN public.fornecedores.telefone IS 'Telefone do fornecedor';

-- RLS (Row Level Security)
ALTER TABLE public.fornecedores ENABLE ROW LEVEL SECURITY;

-- Políticas de acesso
DROP POLICY IF EXISTS "Usuarios podem ver proprios fornecedores" ON public.fornecedores;
CREATE POLICY "Usuarios podem ver proprios fornecedores" ON public.fornecedores
  FOR SELECT USING (auth.uid() = usuario_id);

DROP POLICY IF EXISTS "Usuarios podem inserir proprios fornecedores" ON public.fornecedores;
CREATE POLICY "Usuarios podem inserir proprios fornecedores" ON public.fornecedores
  FOR INSERT WITH CHECK (auth.uid() = usuario_id);

DROP POLICY IF EXISTS "Usuarios podem atualizar proprios fornecedores" ON public.fornecedores;
CREATE POLICY "Usuarios podem atualizar proprios fornecedores" ON public.fornecedores
  FOR UPDATE USING (auth.uid() = usuario_id);

DROP POLICY IF EXISTS "Usuarios podem deletar proprios fornecedores" ON public.fornecedores;
CREATE POLICY "Usuarios podem deletar proprios fornecedores" ON public.fornecedores
  FOR DELETE USING (auth.uid() = usuario_id);

-- Criar índice para melhorar performance de buscas
CREATE INDEX IF NOT EXISTS idx_fornecedores_usuario_id ON public.fornecedores(usuario_id);
CREATE INDEX IF NOT EXISTS idx_fornecedores_codigo ON public.fornecedores(codigo);

