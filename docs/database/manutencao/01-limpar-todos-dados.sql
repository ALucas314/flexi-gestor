-- ============================================
-- 🗑️ LIMPAR TODOS OS DADOS DO BANCO
-- ============================================
-- Este script APAGA todos os registros mas MANTÉM:
-- - Estrutura das tabelas
-- - Políticas RLS
-- - Funções
-- - Índices
--
-- ⚠️ ATENÇÃO: Esta ação é IRREVERSÍVEL!
-- ⚠️ Todos os produtos, movimentos, lotes e compartilhamentos serão DELETADOS!

-- ============================================
-- 1️⃣ DESABILITAR RLS TEMPORARIAMENTE
-- ============================================
-- Necessário para permitir DELETE de todos os dados

ALTER TABLE compartilhamentos DISABLE ROW LEVEL SECURITY;
ALTER TABLE movimentacoes DISABLE ROW LEVEL SECURITY;
ALTER TABLE lotes DISABLE ROW LEVEL SECURITY;
ALTER TABLE produtos DISABLE ROW LEVEL SECURITY;
ALTER TABLE perfis DISABLE ROW LEVEL SECURITY;

-- ============================================
-- 2️⃣ DELETAR DADOS (ordem inversa das dependências)
-- ============================================

-- Compartilhamentos (não tem dependências)
DELETE FROM compartilhamentos;

-- Movimentações (depende de produtos)
DELETE FROM movimentacoes;

-- Lotes (depende de produtos)
DELETE FROM lotes;

-- Produtos (depende de usuários)
DELETE FROM produtos;

-- Perfis (CUIDADO: Isso não apaga usuários da auth, apenas da tabela perfis)
-- Comentado para segurança - descomente se quiser apagar perfis também
-- DELETE FROM perfis;

-- ============================================
-- 3️⃣ REABILITAR RLS
-- ============================================

ALTER TABLE compartilhamentos ENABLE ROW LEVEL SECURITY;
ALTER TABLE movimentacoes ENABLE ROW LEVEL SECURITY;
ALTER TABLE lotes ENABLE ROW LEVEL SECURITY;
ALTER TABLE produtos ENABLE ROW LEVEL SECURITY;
ALTER TABLE perfis ENABLE ROW LEVEL SECURITY;

-- ============================================
-- ✅ CONCLUÍDO!
-- ============================================
-- Todos os dados foram apagados
-- Estrutura do banco mantida intacta
-- RLS reabilitado

SELECT 
  'compartilhamentos' as tabela, COUNT(*) as registros FROM compartilhamentos
UNION ALL
SELECT 'movimentacoes', COUNT(*) FROM movimentacoes
UNION ALL
SELECT 'lotes', COUNT(*) FROM lotes
UNION ALL
SELECT 'produtos', COUNT(*) FROM produtos
UNION ALL
SELECT 'perfis', COUNT(*) FROM perfis;

-- Resultado esperado: 0 registros em todas as tabelas (exceto perfis se não deletou)

