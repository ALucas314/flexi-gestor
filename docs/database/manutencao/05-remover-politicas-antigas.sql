-- ============================================
-- 🗑️ REMOVER POLÍTICAS ANTIGAS QUE BLOQUEIAM COMPARTILHAMENTO
-- ============================================
-- As políticas com role "public" estão conflitando com as novas

-- ==================== PRODUTOS ====================

DROP POLICY IF EXISTS "Usuarios podem ver proprios produtos" ON produtos;
DROP POLICY IF EXISTS "Usuarios podem inserir proprios produtos" ON produtos;
DROP POLICY IF EXISTS "Usuarios podem atualizar proprios produtos" ON produtos;
DROP POLICY IF EXISTS "Usuarios podem deletar proprios produtos" ON produtos;

-- ==================== LOTES ====================

DROP POLICY IF EXISTS "Usuarios podem ver proprios lotes" ON lotes;
DROP POLICY IF EXISTS "Usuarios podem inserir proprios lotes" ON lotes;
DROP POLICY IF EXISTS "Usuarios podem atualizar proprios lotes" ON lotes;
DROP POLICY IF EXISTS "Usuarios podem deletar proprios lotes" ON lotes;

-- ==================== MOVIMENTAÇÕES ====================

DROP POLICY IF EXISTS "Usuarios podem ver proprias movimentacoes" ON movimentacoes;
DROP POLICY IF EXISTS "Usuarios podem inserir proprias movimentacoes" ON movimentacoes;
DROP POLICY IF EXISTS "Usuarios podem atualizar proprias movimentacoes" ON movimentacoes;
DROP POLICY IF EXISTS "Usuarios podem deletar proprias movimentacoes" ON movimentacoes;

-- ==================== PERFIS ====================

DROP POLICY IF EXISTS "Usuarios podem ver proprio perfil" ON perfis;
DROP POLICY IF EXISTS "Usuarios podem atualizar proprio perfil" ON perfis;

-- ============================================
-- ✅ CONCLUÍDO!
-- ============================================
-- Políticas antigas removidas
-- Apenas as políticas novas (com compartilhamento) permanecem

SELECT 'Políticas antigas removidas com sucesso!' as mensagem;

