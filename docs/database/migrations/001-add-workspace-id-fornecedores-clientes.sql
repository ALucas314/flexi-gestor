-- ========================================
-- MIGRAÇÃO: Adicionar workspace_id nas tabelas fornecedores e clientes
-- Data: 2025-01-20
-- ========================================
-- 
-- Este script adiciona a coluna workspace_id nas tabelas fornecedores e clientes
-- para suportar múltiplos workspaces por usuário.
--
-- INSTRUÇÕES:
-- 1. Execute este script no SQL Editor do Supabase
-- 2. O script é seguro e idempotente (pode ser executado múltiplas vezes)
--

-- ========================================
-- 1. ADICIONAR workspace_id NA TABELA fornecedores
-- ========================================

-- Verificar se a coluna já existe e adicionar se não existir
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 
    FROM information_schema.columns 
    WHERE table_schema = 'public' 
    AND table_name = 'fornecedores' 
    AND column_name = 'workspace_id'
  ) THEN
    -- Adicionar coluna workspace_id
    ALTER TABLE public.fornecedores 
    ADD COLUMN workspace_id UUID;

    -- Criar índice para performance
    CREATE INDEX IF NOT EXISTS idx_fornecedores_workspace_id 
    ON public.fornecedores(workspace_id);

    -- Atualizar registros existentes: usar usuario_id como workspace_id temporário
    -- (assumindo que cada usuário tem seu próprio workspace padrão)
    UPDATE public.fornecedores 
    SET workspace_id = usuario_id 
    WHERE workspace_id IS NULL;

    -- Tornar a coluna NOT NULL após popular os dados
    ALTER TABLE public.fornecedores 
    ALTER COLUMN workspace_id SET NOT NULL;

    -- Adicionar comentário
    COMMENT ON COLUMN public.fornecedores.workspace_id IS 'ID do workspace ao qual o fornecedor pertence';
  END IF;
END $$;

-- ========================================
-- 2. ADICIONAR workspace_id NA TABELA clientes
-- ========================================

-- Verificar se a coluna já existe e adicionar se não existir
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 
    FROM information_schema.columns 
    WHERE table_schema = 'public' 
    AND table_name = 'clientes' 
    AND column_name = 'workspace_id'
  ) THEN
    -- Adicionar coluna workspace_id
    ALTER TABLE public.clientes 
    ADD COLUMN workspace_id UUID;

    -- Criar índice para performance
    CREATE INDEX IF NOT EXISTS idx_clientes_workspace_id 
    ON public.clientes(workspace_id);

    -- Atualizar registros existentes: usar usuario_id como workspace_id temporário
    -- (assumindo que cada usuário tem seu próprio workspace padrão)
    UPDATE public.clientes 
    SET workspace_id = usuario_id 
    WHERE workspace_id IS NULL;

    -- Tornar a coluna NOT NULL após popular os dados
    ALTER TABLE public.clientes 
    ALTER COLUMN workspace_id SET NOT NULL;

    -- Adicionar comentário
    COMMENT ON COLUMN public.clientes.workspace_id IS 'ID do workspace ao qual o cliente pertence';
  END IF;
END $$;

-- ========================================
-- 3. ADICIONAR COLUNAS DE ENDEREÇO SE NÃO EXISTIREM
-- ========================================

-- Adicionar colunas de endereço na tabela fornecedores
DO $$
BEGIN
  -- rua
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_schema = 'public' AND table_name = 'fornecedores' AND column_name = 'rua'
  ) THEN
    ALTER TABLE public.fornecedores ADD COLUMN rua TEXT;
  END IF;

  -- numero
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_schema = 'public' AND table_name = 'fornecedores' AND column_name = 'numero'
  ) THEN
    ALTER TABLE public.fornecedores ADD COLUMN numero TEXT;
  END IF;

  -- complemento
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_schema = 'public' AND table_name = 'fornecedores' AND column_name = 'complemento'
  ) THEN
    ALTER TABLE public.fornecedores ADD COLUMN complemento TEXT;
  END IF;

  -- bairro
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_schema = 'public' AND table_name = 'fornecedores' AND column_name = 'bairro'
  ) THEN
    ALTER TABLE public.fornecedores ADD COLUMN bairro TEXT;
  END IF;

  -- cidade
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_schema = 'public' AND table_name = 'fornecedores' AND column_name = 'cidade'
  ) THEN
    ALTER TABLE public.fornecedores ADD COLUMN cidade TEXT;
  END IF;

  -- estado
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_schema = 'public' AND table_name = 'fornecedores' AND column_name = 'estado'
  ) THEN
    ALTER TABLE public.fornecedores ADD COLUMN estado TEXT;
  END IF;

  -- cep
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_schema = 'public' AND table_name = 'fornecedores' AND column_name = 'cep'
  ) THEN
    ALTER TABLE public.fornecedores ADD COLUMN cep TEXT;
  END IF;
END $$;

-- Adicionar colunas de endereço na tabela clientes
DO $$
BEGIN
  -- rua
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_schema = 'public' AND table_name = 'clientes' AND column_name = 'rua'
  ) THEN
    ALTER TABLE public.clientes ADD COLUMN rua TEXT;
  END IF;

  -- numero
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_schema = 'public' AND table_name = 'clientes' AND column_name = 'numero'
  ) THEN
    ALTER TABLE public.clientes ADD COLUMN numero TEXT;
  END IF;

  -- complemento
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_schema = 'public' AND table_name = 'clientes' AND column_name = 'complemento'
  ) THEN
    ALTER TABLE public.clientes ADD COLUMN complemento TEXT;
  END IF;

  -- bairro
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_schema = 'public' AND table_name = 'clientes' AND column_name = 'bairro'
  ) THEN
    ALTER TABLE public.clientes ADD COLUMN bairro TEXT;
  END IF;

  -- cidade
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_schema = 'public' AND table_name = 'clientes' AND column_name = 'cidade'
  ) THEN
    ALTER TABLE public.clientes ADD COLUMN cidade TEXT;
  END IF;

  -- estado
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_schema = 'public' AND table_name = 'clientes' AND column_name = 'estado'
  ) THEN
    ALTER TABLE public.clientes ADD COLUMN estado TEXT;
  END IF;

  -- cep
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_schema = 'public' AND table_name = 'clientes' AND column_name = 'cep'
  ) THEN
    ALTER TABLE public.clientes ADD COLUMN cep TEXT;
  END IF;
END $$;

-- ========================================
-- 4. VERIFICAÇÃO FINAL
-- ========================================

-- Verificar se as colunas foram adicionadas corretamente
SELECT 
  'fornecedores' as tabela,
  column_name,
  data_type,
  is_nullable
FROM information_schema.columns
WHERE table_schema = 'public' 
  AND table_name = 'fornecedores'
  AND column_name IN ('workspace_id', 'rua', 'numero', 'complemento', 'bairro', 'cidade', 'estado', 'cep')
ORDER BY column_name;

SELECT 
  'clientes' as tabela,
  column_name,
  data_type,
  is_nullable
FROM information_schema.columns
WHERE table_schema = 'public' 
  AND table_name = 'clientes'
  AND column_name IN ('workspace_id', 'rua', 'numero', 'complemento', 'bairro', 'cidade', 'estado', 'cep')
ORDER BY column_name;

