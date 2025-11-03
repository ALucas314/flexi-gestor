-- ============================================
-- 🔍 VERIFICAR TODOS OS COMPARTILHAMENTOS
-- ============================================

-- Ver TODOS os compartilhamentos (ativos e inativos)
SELECT 
  c.id,
  c.status,
  c.criado_em as "Criado em",
  p1.email as "Dono (quem compartilhou)",
  p1.nome as "Nome do Dono",
  p2.email as "Compartilhado (quem recebe)",
  p2.nome as "Nome do Compartilhado"
FROM compartilhamentos c
JOIN perfis p1 ON c.dono_id = p1.id
JOIN perfis p2 ON c.usuario_compartilhado_id = p2.id
ORDER BY c.criado_em DESC;

-- Ver compartilhamentos apenas ATIVOS
SELECT 
  c.id,
  p1.email as "Dono",
  p2.email as "Compartilhado"
FROM compartilhamentos c
JOIN perfis p1 ON c.dono_id = p1.id
JOIN perfis p2 ON c.usuario_compartilhado_id = p2.id
WHERE c.status = 'ativo'
ORDER BY c.criado_em DESC;

