-- ============================================
-- 🔍 VERIFICAR POLÍTICAS RLS DE TODAS AS TABELAS
-- ============================================

-- Produtos
SELECT 'PRODUTOS' as tabela, policyname, cmd, qual
FROM pg_policies
WHERE tablename = 'produtos'
ORDER BY policyname;

-- Lotes
SELECT 'LOTES' as tabela, policyname, cmd, qual
FROM pg_policies
WHERE tablename = 'lotes'
ORDER BY policyname;

-- Movimentações
SELECT 'MOVIMENTACOES' as tabela, policyname, cmd, qual
FROM pg_policies
WHERE tablename = 'movimentacoes'
ORDER BY policyname;

-- Compartilhamentos
SELECT 'COMPARTILHAMENTOS' as tabela, policyname, cmd, qual
FROM pg_policies
WHERE tablename = 'compartilhamentos'
ORDER BY policyname;

