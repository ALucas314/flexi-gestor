-- ============================================
-- 🔧 CORRIGIR RLS DE LOTES E MOVIMENTAÇÕES
-- ============================================
-- Atualiza apenas lotes e movimentações para usar compartilhamento

-- ==================== LOTES ====================

-- Remover políticas antigas
DROP POLICY IF EXISTS "Usuarios podem ver proprios lotes" ON lotes;
DROP POLICY IF EXISTS "Usuarios podem inserir proprios lotes" ON lotes;
DROP POLICY IF EXISTS "Usuarios podem atualizar proprios lotes" ON lotes;
DROP POLICY IF EXISTS "Usuarios podem deletar proprios lotes" ON lotes;

-- Criar políticas com compartilhamento
DROP POLICY IF EXISTS "Usuários podem ver lotes próprios ou compartilhados" ON lotes;
CREATE POLICY "Usuários podem ver lotes próprios ou compartilhados"
ON lotes FOR SELECT TO authenticated
USING (tem_acesso_compartilhado(usuario_id));

DROP POLICY IF EXISTS "Usuários podem inserir lotes próprios ou compartilhados" ON lotes;
CREATE POLICY "Usuários podem inserir lotes próprios ou compartilhados"
ON lotes FOR INSERT TO authenticated
WITH CHECK (tem_acesso_compartilhado(usuario_id));

DROP POLICY IF EXISTS "Usuários podem atualizar lotes próprios ou compartilhados" ON lotes;
CREATE POLICY "Usuários podem atualizar lotes próprios ou compartilhados"
ON lotes FOR UPDATE TO authenticated
USING (tem_acesso_compartilhado(usuario_id));

DROP POLICY IF EXISTS "Usuários podem deletar lotes próprios ou compartilhados" ON lotes;
CREATE POLICY "Usuários podem deletar lotes próprios ou compartilhados"
ON lotes FOR DELETE TO authenticated
USING (tem_acesso_compartilhado(usuario_id));

-- ==================== MOVIMENTAÇÕES ====================

-- Remover políticas antigas
DROP POLICY IF EXISTS "Usuarios podem ver proprias movimentacoes" ON movimentacoes;
DROP POLICY IF EXISTS "Usuarios podem inserir proprias movimentacoes" ON movimentacoes;
DROP POLICY IF EXISTS "Usuarios podem atualizar proprias movimentacoes" ON movimentacoes;
DROP POLICY IF EXISTS "Usuarios podem deletar proprias movimentacoes" ON movimentacoes;

-- Criar políticas com compartilhamento
DROP POLICY IF EXISTS "Usuários podem ver movimentações próprias ou compartilhadas" ON movimentacoes;
CREATE POLICY "Usuários podem ver movimentações próprias ou compartilhadas"
ON movimentacoes FOR SELECT TO authenticated
USING (tem_acesso_compartilhado(usuario_id));

DROP POLICY IF EXISTS "Usuários podem inserir movimentações próprias ou compartilhadas" ON movimentacoes;
CREATE POLICY "Usuários podem inserir movimentações próprias ou compartilhadas"
ON movimentacoes FOR INSERT TO authenticated
WITH CHECK (tem_acesso_compartilhado(usuario_id));

DROP POLICY IF EXISTS "Usuários podem atualizar movimentações próprias ou compartilhadas" ON movimentacoes;
CREATE POLICY "Usuários podem atualizar movimentações próprias ou compartilhadas"
ON movimentacoes FOR UPDATE TO authenticated
USING (tem_acesso_compartilhado(usuario_id));

DROP POLICY IF EXISTS "Usuários podem deletar movimentações próprias ou compartilhadas" ON movimentacoes;
CREATE POLICY "Usuários podem deletar movimentações próprias ou compartilhadas"
ON movimentacoes FOR DELETE TO authenticated
USING (tem_acesso_compartilhado(usuario_id));

-- ============================================
-- ✅ CONCLUÍDO!
-- ============================================

SELECT 'Políticas de lotes e movimentações atualizadas!' as mensagem;

