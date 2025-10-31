-- ============================================
-- ☢️ LIMPAR TUDO - INCLUINDO USUÁRIOS
-- ============================================
-- Este script APAGA TUDO:
-- - Todos os dados de TODAS as tabelas:
--   * categorias
--   * unidades_medida
--   * compartilhamentos
--   * movimentacoes
--   * lotes
--   * produtos
--   * perfis
-- - Todos os perfis
-- - Todos os usuários da autenticação (auth.users)
--
-- ⚠️⚠️⚠️ ATENÇÃO: ISTO É EXTREMAMENTE DESTRUTIVO! ⚠️⚠️⚠️
-- ⚠️ VOCÊ PERDERÁ ACESSO À SUA CONTA!
-- ⚠️ TERÁ QUE CRIAR UMA NOVA CONTA DEPOIS!
-- ⚠️ TODOS OS DADOS SERÃO PERDIDOS PERMANENTEMENTE!

-- ============================================
-- 1️⃣ DESABILITAR RLS TEMPORARIAMENTE
-- ============================================

ALTER TABLE IF EXISTS public.categorias DISABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS public.unidades_medida DISABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS public.compartilhamentos DISABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS public.movimentacoes DISABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS public.lotes DISABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS public.produtos DISABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS public.perfis DISABLE ROW LEVEL SECURITY;

-- ============================================
-- 2️⃣ DELETAR TODOS OS DADOS
-- ============================================
-- Ordem importante: deletar primeiro tabelas dependentes
-- Usando DELETE ao invés de TRUNCATE para evitar erros se tabela não existir

-- Categorias
DO $$ BEGIN
  IF EXISTS (SELECT FROM information_schema.tables WHERE table_schema = 'public' AND table_name = 'categorias') THEN
    TRUNCATE TABLE public.categorias CASCADE;
  END IF;
END $$;

-- Unidades de Medida
DO $$ BEGIN
  IF EXISTS (SELECT FROM information_schema.tables WHERE table_schema = 'public' AND table_name = 'unidades_medida') THEN
    TRUNCATE TABLE public.unidades_medida CASCADE;
  END IF;
END $$;

-- Compartilhamentos
DO $$ BEGIN
  IF EXISTS (SELECT FROM information_schema.tables WHERE table_schema = 'public' AND table_name = 'compartilhamentos') THEN
    TRUNCATE TABLE public.compartilhamentos CASCADE;
  END IF;
END $$;

-- Movimentações
DO $$ BEGIN
  IF EXISTS (SELECT FROM information_schema.tables WHERE table_schema = 'public' AND table_name = 'movimentacoes') THEN
    TRUNCATE TABLE public.movimentacoes CASCADE;
  END IF;
END $$;

-- Lotes
DO $$ BEGIN
  IF EXISTS (SELECT FROM information_schema.tables WHERE table_schema = 'public' AND table_name = 'lotes') THEN
    TRUNCATE TABLE public.lotes CASCADE;
  END IF;
END $$;

-- Produtos
DO $$ BEGIN
  IF EXISTS (SELECT FROM information_schema.tables WHERE table_schema = 'public' AND table_name = 'produtos') THEN
    TRUNCATE TABLE public.produtos CASCADE;
  END IF;
END $$;

-- Perfis
DO $$ BEGIN
  IF EXISTS (SELECT FROM information_schema.tables WHERE table_schema = 'public' AND table_name = 'perfis') THEN
    TRUNCATE TABLE public.perfis CASCADE;
  END IF;
END $$;

-- ============================================
-- 3️⃣ DELETAR USUÁRIOS DA AUTENTICAÇÃO
-- ============================================
-- ⚠️ CUIDADO: Isto apaga todos os usuários do Supabase Auth!
-- ⚠️ Você perderá acesso à sua conta!
-- ⚠️ Terá que criar uma nova conta depois!

DELETE FROM auth.users;

-- ============================================
-- 4️⃣ REABILITAR RLS
-- ============================================

ALTER TABLE IF EXISTS public.categorias ENABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS public.unidades_medida ENABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS public.compartilhamentos ENABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS public.movimentacoes ENABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS public.lotes ENABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS public.produtos ENABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS public.perfis ENABLE ROW LEVEL SECURITY;

-- ============================================
-- ✅ CONCLUÍDO!
-- ============================================
-- O banco está completamente VAZIO
-- Você precisará criar uma nova conta para acessar o sistema

SELECT 
  'categorias' as tabela, 
  COUNT(*) as registros 
FROM public.categorias
UNION ALL
SELECT 'unidades_medida', COUNT(*) FROM public.unidades_medida
UNION ALL
SELECT 'compartilhamentos', COUNT(*) FROM public.compartilhamentos
UNION ALL
SELECT 'movimentacoes', COUNT(*) FROM public.movimentacoes
UNION ALL
SELECT 'lotes', COUNT(*) FROM public.lotes
UNION ALL
SELECT 'produtos', COUNT(*) FROM public.produtos
UNION ALL
SELECT 'perfis', COUNT(*) FROM public.perfis
UNION ALL
SELECT 'auth.users', COUNT(*) FROM auth.users;

-- Resultado esperado: 0 registros em TODAS as tabelas

