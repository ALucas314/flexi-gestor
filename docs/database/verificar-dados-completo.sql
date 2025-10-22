-- ============================================
-- 🔍 VERIFICAR TODOS OS DADOS DO BANCO
-- ============================================

-- 1️⃣ Usuários
SELECT 'USUÁRIOS' as tipo, COUNT(*) as total FROM auth.users;

-- 2️⃣ Perfis
SELECT 'PERFIS' as tipo, COUNT(*) as total FROM perfis;

-- 3️⃣ Produtos
SELECT 'PRODUTOS' as tipo, COUNT(*) as total FROM produtos;

-- 4️⃣ Lotes
SELECT 'LOTES' as tipo, COUNT(*) as total FROM lotes;

-- 5️⃣ Movimentações
SELECT 'MOVIMENTACOES' as tipo, COUNT(*) as total FROM movimentacoes;

-- 6️⃣ Compartilhamentos Ativos
SELECT 'COMPARTILHAMENTOS ATIVOS' as tipo, COUNT(*) as total 
FROM compartilhamentos WHERE status = 'ativo';

-- ============================================
-- DETALHES DOS PRODUTOS
-- ============================================

SELECT 
  p.nome as "Produto",
  p.estoque as "Estoque",
  per.email as "Dono"
FROM produtos p
JOIN perfis per ON p.usuario_id = per.id
ORDER BY p.criado_em DESC;

-- ============================================
-- DETALHES DOS LOTES
-- ============================================

SELECT 
  l.numero_lote as "Lote",
  l.quantidade as "Qtd",
  prod.nome as "Produto",
  per.email as "Dono"
FROM lotes l
JOIN produtos prod ON l.produto_id = prod.id
JOIN perfis per ON l.usuario_id = per.id
ORDER BY l.criado_em DESC;

-- ============================================
-- DETALHES DAS MOVIMENTAÇÕES
-- ============================================

SELECT 
  m.tipo as "Tipo",
  m.quantidade as "Qtd",
  prod.nome as "Produto",
  per.email as "Dono",
  m.criado_em as "Data"
FROM movimentacoes m
JOIN produtos prod ON m.produto_id = prod.id
JOIN perfis per ON m.usuario_id = per.id
ORDER BY m.criado_em DESC;

