-- ========================================
-- SCRIPT PARA CORRIGIR RLS (ROW LEVEL SECURITY)
-- Remover status "unrestricted" das tabelas
-- ========================================
-- 
-- Execute este script no SQL Editor do Supabase para
-- habilitar corretamente o RLS em todas as tabelas
--
-- ========================================

-- ========================================
-- 1. HABILITAR RLS EM TODAS AS TABELAS
-- ========================================

ALTER TABLE public.perfis ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.produtos ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.lotes ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.movimentacoes ENABLE ROW LEVEL SECURITY;

-- ========================================
-- 2. REMOVER POLÍTICAS ANTIGAS (SE EXISTIREM)
-- ========================================

-- Políticas da tabela perfis
DROP POLICY IF EXISTS "Usuarios podem ver proprio perfil" ON public.perfis;
DROP POLICY IF EXISTS "Usuarios podem atualizar proprio perfil" ON public.perfis;
DROP POLICY IF EXISTS "Usuarios podem inserir proprio perfil" ON public.perfis;

-- Políticas da tabela produtos
DROP POLICY IF EXISTS "Usuarios podem ver proprios produtos" ON public.produtos;
DROP POLICY IF EXISTS "Usuarios podem inserir proprios produtos" ON public.produtos;
DROP POLICY IF EXISTS "Usuarios podem atualizar proprios produtos" ON public.produtos;
DROP POLICY IF EXISTS "Usuarios podem deletar proprios produtos" ON public.produtos;

-- Políticas da tabela lotes
DROP POLICY IF EXISTS "Usuarios podem ver proprios lotes" ON public.lotes;
DROP POLICY IF EXISTS "Usuarios podem inserir proprios lotes" ON public.lotes;
DROP POLICY IF EXISTS "Usuarios podem atualizar proprios lotes" ON public.lotes;
DROP POLICY IF EXISTS "Usuarios podem deletar proprios lotes" ON public.lotes;

-- Políticas da tabela movimentacoes
DROP POLICY IF EXISTS "Usuarios podem ver proprias movimentacoes" ON public.movimentacoes;
DROP POLICY IF EXISTS "Usuarios podem inserir proprias movimentacoes" ON public.movimentacoes;
DROP POLICY IF EXISTS "Usuarios podem atualizar proprias movimentacoes" ON public.movimentacoes;
DROP POLICY IF EXISTS "Usuarios podem deletar proprias movimentacoes" ON public.movimentacoes;

-- ========================================
-- 3. CRIAR POLÍTICAS CORRETAS PARA PERFIS
-- ========================================

CREATE POLICY "Usuarios podem ver proprio perfil"
ON public.perfis
FOR SELECT
TO authenticated
USING (auth.uid() = id);

CREATE POLICY "Usuarios podem atualizar proprio perfil"
ON public.perfis
FOR UPDATE
TO authenticated
USING (auth.uid() = id)
WITH CHECK (auth.uid() = id);

CREATE POLICY "Usuarios podem inserir proprio perfil"
ON public.perfis
FOR INSERT
TO authenticated
WITH CHECK (auth.uid() = id);

-- ========================================
-- 4. CRIAR POLÍTICAS CORRETAS PARA PRODUTOS
-- ========================================

CREATE POLICY "Usuarios podem ver proprios produtos"
ON public.produtos
FOR SELECT
TO authenticated
USING (auth.uid() = usuario_id);

CREATE POLICY "Usuarios podem inserir proprios produtos"
ON public.produtos
FOR INSERT
TO authenticated
WITH CHECK (auth.uid() = usuario_id);

CREATE POLICY "Usuarios podem atualizar proprios produtos"
ON public.produtos
FOR UPDATE
TO authenticated
USING (auth.uid() = usuario_id)
WITH CHECK (auth.uid() = usuario_id);

CREATE POLICY "Usuarios podem deletar proprios produtos"
ON public.produtos
FOR DELETE
TO authenticated
USING (auth.uid() = usuario_id);

-- ========================================
-- 5. CRIAR POLÍTICAS CORRETAS PARA LOTES
-- ========================================

CREATE POLICY "Usuarios podem ver proprios lotes"
ON public.lotes
FOR SELECT
TO authenticated
USING (auth.uid() = usuario_id);

CREATE POLICY "Usuarios podem inserir proprios lotes"
ON public.lotes
FOR INSERT
TO authenticated
WITH CHECK (auth.uid() = usuario_id);

CREATE POLICY "Usuarios podem atualizar proprios lotes"
ON public.lotes
FOR UPDATE
TO authenticated
USING (auth.uid() = usuario_id)
WITH CHECK (auth.uid() = usuario_id);

CREATE POLICY "Usuarios podem deletar proprios lotes"
ON public.lotes
FOR DELETE
TO authenticated
USING (auth.uid() = usuario_id);

-- ========================================
-- 6. CRIAR POLÍTICAS CORRETAS PARA MOVIMENTACOES
-- ========================================

CREATE POLICY "Usuarios podem ver proprias movimentacoes"
ON public.movimentacoes
FOR SELECT
TO authenticated
USING (auth.uid() = usuario_id);

CREATE POLICY "Usuarios podem inserir proprias movimentacoes"
ON public.movimentacoes
FOR INSERT
TO authenticated
WITH CHECK (auth.uid() = usuario_id);

CREATE POLICY "Usuarios podem atualizar proprias movimentacoes"
ON public.movimentacoes
FOR UPDATE
TO authenticated
USING (auth.uid() = usuario_id)
WITH CHECK (auth.uid() = usuario_id);

CREATE POLICY "Usuarios podem deletar proprias movimentacoes"
ON public.movimentacoes
FOR DELETE
TO authenticated
USING (auth.uid() = usuario_id);

-- ========================================
-- 7. VERIFICAÇÃO FINAL
-- ========================================

DO $$
DECLARE
  perfis_rls BOOLEAN;
  produtos_rls BOOLEAN;
  lotes_rls BOOLEAN;
  movimentacoes_rls BOOLEAN;
BEGIN
  -- Verificar se RLS está habilitado
  SELECT relrowsecurity INTO perfis_rls 
  FROM pg_class WHERE relname = 'perfis';
  
  SELECT relrowsecurity INTO produtos_rls 
  FROM pg_class WHERE relname = 'produtos';
  
  SELECT relrowsecurity INTO lotes_rls 
  FROM pg_class WHERE relname = 'lotes';
  
  SELECT relrowsecurity INTO movimentacoes_rls 
  FROM pg_class WHERE relname = 'movimentacoes';
  
  RAISE NOTICE '╔════════════════════════════════════════╗';
  RAISE NOTICE '║  RLS CONFIGURADO COM SUCESSO!          ║';
  RAISE NOTICE '╚════════════════════════════════════════╝';
  RAISE NOTICE '';
  RAISE NOTICE '✅ Status do RLS:';
  RAISE NOTICE '   perfis: %', CASE WHEN perfis_rls THEN '🟢 HABILITADO' ELSE '🔴 DESABILITADO' END;
  RAISE NOTICE '   produtos: %', CASE WHEN produtos_rls THEN '🟢 HABILITADO' ELSE '🔴 DESABILITADO' END;
  RAISE NOTICE '   lotes: %', CASE WHEN lotes_rls THEN '🟢 HABILITADO' ELSE '🔴 DESABILITADO' END;
  RAISE NOTICE '   movimentacoes: %', CASE WHEN movimentacoes_rls THEN '🟢 HABILITADO' ELSE '🔴 DESABILITADO' END;
  RAISE NOTICE '';
  RAISE NOTICE '🎉 Todas as políticas foram criadas!';
  RAISE NOTICE '🔒 Suas tabelas agora estão protegidas!';
  RAISE NOTICE '';
  RAISE NOTICE '⚠️  Se ainda vir "unrestricted", recarregue a página do Supabase.';
END $$;

