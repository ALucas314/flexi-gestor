-- ============================================
-- 🔧 CORRIGIR FUNÇÃO DE ACESSO COMPARTILHADO
-- ============================================

-- Remover função antiga
DROP FUNCTION IF EXISTS tem_acesso_compartilhado(UUID) CASCADE;

-- Criar função CORRIGIDA
CREATE OR REPLACE FUNCTION tem_acesso_compartilhado(usuario_dono_id UUID)
RETURNS BOOLEAN AS $$
DECLARE
  usuario_atual UUID;
BEGIN
  -- Obter ID do usuário atual
  usuario_atual := auth.uid();
  
  -- Se não há usuário logado, negar acesso
  IF usuario_atual IS NULL THEN
    RETURN false;
  END IF;
  
  -- Verificar se:
  -- 1. É o próprio dono dos dados OU
  -- 2. Tem compartilhamento ativo onde é o dono e está vendo dados de outro OU
  -- 3. Tem compartilhamento ativo onde é o compartilhado e está vendo dados do dono
  RETURN (
    -- É o próprio dono
    usuario_atual = usuario_dono_id 
    OR
    -- Tem compartilhamento ATIVO onde ele é o dono e está vendo dados do compartilhado
    EXISTS (
      SELECT 1 FROM compartilhamentos
      WHERE dono_id = usuario_atual
      AND usuario_compartilhado_id = usuario_dono_id
      AND status = 'ativo'
    )
    OR
    -- Tem compartilhamento ATIVO onde ele é o compartilhado e está vendo dados do dono
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
-- RECRIAR POLÍTICAS RLS COM A FUNÇÃO CORRIGIDA
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

SELECT 'Função corrigida e políticas recriadas com sucesso!' as mensagem;

