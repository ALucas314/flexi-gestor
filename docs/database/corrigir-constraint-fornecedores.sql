-- ========================================
-- CORRIGIR CONSTRAINT DE FORNECEDORES
-- Flexi Gestor - Supabase PostgreSQL
-- ========================================
-- 
-- PROBLEMA: A constraint única está sendo verificada globalmente no campo 'codigo',
-- impedindo que diferentes usuários criem fornecedores com o mesmo código.
-- 
-- SOLUÇÃO: Remover constraint única simples e criar constraint única composta
-- (codigo, usuario_id) para que cada usuário tenha seus próprios códigos.
--
-- INSTRUÇÕES:
-- 1. Execute este script no SQL Editor do Supabase
-- 2. Isso corrigirá o problema de códigos duplicados entre usuários
-- 3. Cada usuário poderá ter seus próprios códigos de fornecedores
--
-- ========================================

-- Remover todas as constraints únicas existentes na tabela fornecedores
-- (exceto a que queremos manter, se já existir)
DO $$ 
DECLARE
  constraint_name TEXT;
BEGIN
  -- Remover todas as constraints únicas, uma por uma
  FOR constraint_name IN
    SELECT conname
    FROM pg_constraint
    WHERE conrelid = 'public.fornecedores'::regclass
      AND contype = 'u'
      AND conname != 'codigo_unico_por_usuario'  -- Não remover a constraint que queremos criar
  LOOP
    EXECUTE format('ALTER TABLE public.fornecedores DROP CONSTRAINT IF EXISTS %I', constraint_name);
    RAISE NOTICE 'Constraint única removida: %', constraint_name;
  END LOOP;
END $$;

-- Remover a constraint codigo_unico_por_usuario se existir (para recriar)
ALTER TABLE public.fornecedores 
DROP CONSTRAINT IF EXISTS codigo_unico_por_usuario;

-- Criar constraint única composta (codigo, usuario_id)
-- Isso permite que cada usuário tenha seus próprios códigos
ALTER TABLE public.fornecedores
ADD CONSTRAINT codigo_unico_por_usuario UNIQUE (codigo, usuario_id);

-- Atualizar comentário para refletir a mudança
COMMENT ON CONSTRAINT codigo_unico_por_usuario ON public.fornecedores 
IS 'Código único por usuário - cada usuário pode ter seus próprios códigos de fornecedores';

-- Verificar resultado final
SELECT 
  conname AS constraint_name,
  contype AS constraint_type,
  pg_get_constraintdef(oid) AS constraint_definition
FROM pg_constraint
WHERE conrelid = 'public.fornecedores'::regclass
  AND contype = 'u'
ORDER BY conname;
