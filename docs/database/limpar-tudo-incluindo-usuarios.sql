-- ============================================
-- ☢️ LIMPAR TUDO - INCLUINDO USUÁRIOS
-- ============================================
-- Este script APAGA TUDO:
-- - Todos os dados (produtos, movimentos, lotes, compartilhamentos)
-- - Todos os perfis
-- - Todos os usuários da autenticação (auth.users)
--
-- ⚠️⚠️⚠️ ATENÇÃO: ISTO É EXTREMAMENTE DESTRUTIVO! ⚠️⚠️⚠️
-- ⚠️ VOCÊ PERDERÁ ACESSO À SUA CONTA!
-- ⚠️ TERÁ QUE CRIAR UMA NOVA CONTA DEPOIS!

-- ============================================
-- 1️⃣ DESABILITAR RLS TEMPORARIAMENTE
-- ============================================

ALTER TABLE compartilhamentos DISABLE ROW LEVEL SECURITY;
ALTER TABLE movimentacoes DISABLE ROW LEVEL SECURITY;
ALTER TABLE lotes DISABLE ROW LEVEL SECURITY;
ALTER TABLE produtos DISABLE ROW LEVEL SECURITY;
ALTER TABLE perfis DISABLE ROW LEVEL SECURITY;

-- ============================================
-- 2️⃣ DELETAR TODOS OS DADOS
-- ============================================

-- Compartilhamentos
TRUNCATE TABLE compartilhamentos CASCADE;

-- Movimentações
TRUNCATE TABLE movimentacoes CASCADE;

-- Lotes
TRUNCATE TABLE lotes CASCADE;

-- Produtos
TRUNCATE TABLE produtos CASCADE;

-- Perfis
TRUNCATE TABLE perfis CASCADE;

-- ============================================
-- 3️⃣ DELETAR USUÁRIOS DA AUTENTICAÇÃO
-- ============================================
-- CUIDADO: Isto apaga todos os usuários do Supabase Auth!

DELETE FROM auth.users;

-- ============================================
-- 4️⃣ REABILITAR RLS
-- ============================================

ALTER TABLE compartilhamentos ENABLE ROW LEVEL SECURITY;
ALTER TABLE movimentacoes ENABLE ROW LEVEL SECURITY;
ALTER TABLE lotes ENABLE ROW LEVEL SECURITY;
ALTER TABLE produtos ENABLE ROW LEVEL SECURITY;
ALTER TABLE perfis ENABLE ROW LEVEL SECURITY;

-- ============================================
-- ✅ CONCLUÍDO!
-- ============================================
-- O banco está completamente VAZIO
-- Você precisará criar uma nova conta para acessar o sistema

SELECT 
  'compartilhamentos' as tabela, COUNT(*) as registros FROM compartilhamentos
UNION ALL
SELECT 'movimentacoes', COUNT(*) FROM movimentacoes
UNION ALL
SELECT 'lotes', COUNT(*) FROM lotes
UNION ALL
SELECT 'produtos', COUNT(*) FROM produtos
UNION ALL
SELECT 'perfis', COUNT(*) FROM perfis
UNION ALL
SELECT 'auth.users', COUNT(*) FROM auth.users;

-- Resultado esperado: 0 registros em TODAS as tabelas

