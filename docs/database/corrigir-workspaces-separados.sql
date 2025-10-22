-- ============================================
-- 🔧 CORRIGIR WORKSPACES SEPARADOS
-- ============================================
-- Cada usuário tem seu próprio workspace
-- Ao compartilhar, você pode ESCOLHER qual workspace visualizar

DROP FUNCTION IF EXISTS tem_acesso_compartilhado(UUID) CASCADE;

CREATE OR REPLACE FUNCTION tem_acesso_compartilhado(usuario_dono_id UUID)
RETURNS BOOLEAN AS $$
DECLARE
  usuario_atual UUID;
BEGIN
  usuario_atual := auth.uid();
  
  IF usuario_atual IS NULL THEN
    RETURN false;
  END IF;
  
  -- Retorna TRUE se:
  -- 1. Você É o dono dos dados OU
  -- 2. O DONO compartilhou COM VOCÊ (e está ativo)
  RETURN (
    usuario_atual = usuario_dono_id 
    OR
    EXISTS (
      SELECT 1 FROM compartilhamentos
      WHERE dono_id = usuario_dono_id
      AND usuario_compartilhado_id = usuario_atual
      AND status = 'ativo'
    )
  );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER STABLE;

-- ============================================
-- RECRIAR POLÍTICAS
-- ============================================

-- PRODUTOS
DROP POLICY IF EXISTS "Usuários podem ver produtos próprios ou compartilhados" ON produtos;
CREATE POLICY "Usuários podem ver produtos próprios ou compartilhados"
ON produtos FOR SELECT TO authenticated
USING (tem_acesso_compartilhado(usuario_id));

DROP POLICY IF EXISTS "Usuários podem inserir produtos próprios ou compartilhados" ON produtos;
CREATE POLICY "Usuários podem inserir produtos próprios ou compartilhados"
ON produtos FOR INSERT TO authenticated
WITH CHECK (tem_acesso_compartilhado(usuario_id));

DROP POLICY IF EXISTS "Usuários podem atualizar produtos próprios ou compartilhados" ON produtos;
CREATE POLICY "Usuários podem atualizar produtos próprios ou compartilhados"
ON produtos FOR UPDATE TO authenticated
USING (tem_acesso_compartilhado(usuario_id));

DROP POLICY IF EXISTS "Usuários podem deletar produtos próprios ou compartilhados" ON produtos;
CREATE POLICY "Usuários podem deletar produtos próprios ou compartilhados"
ON produtos FOR DELETE TO authenticated
USING (tem_acesso_compartilhado(usuario_id));

-- LOTES
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

-- MOVIMENTAÇÕES
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

SELECT 'Workspaces agora são SEPARADOS!' as mensagem;

