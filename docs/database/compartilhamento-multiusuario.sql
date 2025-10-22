-- ============================================
-- 🤝 SISTEMA DE COMPARTILHAMENTO MULTI-USUÁRIO
-- ============================================
-- Permite que usuários compartilhem acesso aos seus dados
-- Ambos podem ver e editar os mesmos produtos, movimentos e lotes

-- ============================================
-- 1️⃣ CRIAR TABELA DE COMPARTILHAMENTOS
-- ============================================

CREATE TABLE IF NOT EXISTS compartilhamentos (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  dono_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  usuario_compartilhado_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  criado_em TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  atualizado_em TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  status TEXT DEFAULT 'ativo' CHECK (status IN ('ativo', 'inativo')),
  
  -- Evitar duplicatas
  UNIQUE(dono_id, usuario_compartilhado_id)
);

-- Índices para performance
CREATE INDEX idx_compartilhamentos_dono ON compartilhamentos(dono_id) WHERE status = 'ativo';
CREATE INDEX idx_compartilhamentos_usuario ON compartilhamentos(usuario_compartilhado_id) WHERE status = 'ativo';

-- Comentários
COMMENT ON TABLE compartilhamentos IS 'Gerencia o compartilhamento de acesso entre usuários';
COMMENT ON COLUMN compartilhamentos.dono_id IS 'Usuário que está compartilhando seus dados';
COMMENT ON COLUMN compartilhamentos.usuario_compartilhado_id IS 'Usuário que recebe acesso aos dados';

-- ============================================
-- 2️⃣ HABILITAR ROW LEVEL SECURITY
-- ============================================

ALTER TABLE compartilhamentos ENABLE ROW LEVEL SECURITY;

-- ============================================
-- 3️⃣ POLÍTICAS RLS PARA COMPARTILHAMENTOS
-- ============================================

-- Ver compartilhamentos (dono ou compartilhado)
DROP POLICY IF EXISTS "Usuários podem ver seus compartilhamentos" ON compartilhamentos;
CREATE POLICY "Usuários podem ver seus compartilhamentos"
ON compartilhamentos FOR SELECT
TO authenticated
USING (
  auth.uid() = dono_id OR 
  auth.uid() = usuario_compartilhado_id
);

-- Criar compartilhamentos (apenas dono)
DROP POLICY IF EXISTS "Usuários podem criar compartilhamentos" ON compartilhamentos;
CREATE POLICY "Usuários podem criar compartilhamentos"
ON compartilhamentos FOR INSERT
TO authenticated
WITH CHECK (auth.uid() = dono_id);

-- Atualizar compartilhamentos (apenas dono)
DROP POLICY IF EXISTS "Usuários podem atualizar seus compartilhamentos" ON compartilhamentos;
CREATE POLICY "Usuários podem atualizar seus compartilhamentos"
ON compartilhamentos FOR UPDATE
TO authenticated
USING (auth.uid() = dono_id)
WITH CHECK (auth.uid() = dono_id);

-- Deletar compartilhamentos (apenas dono)
DROP POLICY IF EXISTS "Usuários podem deletar seus compartilhamentos" ON compartilhamentos;
CREATE POLICY "Usuários podem deletar seus compartilhamentos"
ON compartilhamentos FOR DELETE
TO authenticated
USING (auth.uid() = dono_id);

-- ============================================
-- 4️⃣ FUNÇÃO PARA VERIFICAR ACESSO COMPARTILHADO
-- ============================================

CREATE OR REPLACE FUNCTION tem_acesso_compartilhado(usuario_dono_id UUID)
RETURNS BOOLEAN AS $$
BEGIN
  -- Verifica se o usuário atual é o dono OU tem acesso compartilhado
  RETURN (
    auth.uid() = usuario_dono_id OR
    EXISTS (
      SELECT 1 FROM compartilhamentos
      WHERE dono_id = usuario_dono_id
      AND usuario_compartilhado_id = auth.uid()
      AND status = 'ativo'
    ) OR
    EXISTS (
      SELECT 1 FROM compartilhamentos
      WHERE usuario_compartilhado_id = usuario_dono_id
      AND dono_id = auth.uid()
      AND status = 'ativo'
    )
  );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- ============================================
-- 5️⃣ ATUALIZAR POLÍTICAS RLS DAS TABELAS EXISTENTES
-- ============================================

-- ==================== PRODUTOS ====================

DROP POLICY IF EXISTS "Usuários podem ver produtos próprios ou compartilhados" ON produtos;
CREATE POLICY "Usuários podem ver produtos próprios ou compartilhados"
ON produtos FOR SELECT
TO authenticated
USING (tem_acesso_compartilhado(usuario_id));

DROP POLICY IF EXISTS "Usuários podem inserir produtos próprios ou compartilhados" ON produtos;
CREATE POLICY "Usuários podem inserir produtos próprios ou compartilhados"
ON produtos FOR INSERT
TO authenticated
WITH CHECK (tem_acesso_compartilhado(usuario_id));

DROP POLICY IF EXISTS "Usuários podem atualizar produtos próprios ou compartilhados" ON produtos;
CREATE POLICY "Usuários podem atualizar produtos próprios ou compartilhados"
ON produtos FOR UPDATE
TO authenticated
USING (tem_acesso_compartilhado(usuario_id))
WITH CHECK (tem_acesso_compartilhado(usuario_id));

DROP POLICY IF EXISTS "Usuários podem deletar produtos próprios ou compartilhados" ON produtos;
CREATE POLICY "Usuários podem deletar produtos próprios ou compartilhados"
ON produtos FOR DELETE
TO authenticated
USING (tem_acesso_compartilhado(usuario_id));

-- ==================== LOTES ====================

DROP POLICY IF EXISTS "Usuários podem ver lotes próprios ou compartilhados" ON lotes;
CREATE POLICY "Usuários podem ver lotes próprios ou compartilhados"
ON lotes FOR SELECT
TO authenticated
USING (tem_acesso_compartilhado(usuario_id));

DROP POLICY IF EXISTS "Usuários podem inserir lotes próprios ou compartilhados" ON lotes;
CREATE POLICY "Usuários podem inserir lotes próprios ou compartilhados"
ON lotes FOR INSERT
TO authenticated
WITH CHECK (tem_acesso_compartilhado(usuario_id));

DROP POLICY IF EXISTS "Usuários podem atualizar lotes próprios ou compartilhados" ON lotes;
CREATE POLICY "Usuários podem atualizar lotes próprios ou compartilhados"
ON lotes FOR UPDATE
TO authenticated
USING (tem_acesso_compartilhado(usuario_id))
WITH CHECK (tem_acesso_compartilhado(usuario_id));

DROP POLICY IF EXISTS "Usuários podem deletar lotes próprios ou compartilhados" ON lotes;
CREATE POLICY "Usuários podem deletar lotes próprios ou compartilhados"
ON lotes FOR DELETE
TO authenticated
USING (tem_acesso_compartilhado(usuario_id));

-- ==================== MOVIMENTAÇÕES ====================

DROP POLICY IF EXISTS "Usuários podem ver movimentações próprias ou compartilhadas" ON movimentacoes;
CREATE POLICY "Usuários podem ver movimentações próprias ou compartilhadas"
ON movimentacoes FOR SELECT
TO authenticated
USING (tem_acesso_compartilhado(usuario_id));

DROP POLICY IF EXISTS "Usuários podem inserir movimentações próprias ou compartilhadas" ON movimentacoes;
CREATE POLICY "Usuários podem inserir movimentações próprias ou compartilhadas"
ON movimentacoes FOR INSERT
TO authenticated
WITH CHECK (tem_acesso_compartilhado(usuario_id));

DROP POLICY IF EXISTS "Usuários podem atualizar movimentações próprias ou compartilhadas" ON movimentacoes;
CREATE POLICY "Usuários podem atualizar movimentações próprias ou compartilhadas"
ON movimentacoes FOR UPDATE
TO authenticated
USING (tem_acesso_compartilhado(usuario_id))
WITH CHECK (tem_acesso_compartilhado(usuario_id));

DROP POLICY IF EXISTS "Usuários podem deletar movimentações próprias ou compartilhadas" ON movimentacoes;
CREATE POLICY "Usuários podem deletar movimentações próprias ou compartilhadas"
ON movimentacoes FOR DELETE
TO authenticated
USING (tem_acesso_compartilhado(usuario_id));

-- ============================================
-- 6️⃣ FUNÇÃO PARA OBTER USUÁRIOS CONECTADOS
-- ============================================

CREATE OR REPLACE FUNCTION obter_usuarios_conectados(usuario_base_id UUID)
RETURNS TABLE (
  id UUID,
  email TEXT,
  nome TEXT,
  tipo TEXT,
  ultima_conexao TIMESTAMP WITH TIME ZONE
) AS $$
BEGIN
  RETURN QUERY
  SELECT 
    p.id,
    p.email,
    p.nome,
    CASE 
      WHEN p.id = usuario_base_id THEN 'dono'
      WHEN c.dono_id = usuario_base_id THEN 'compartilhado'
      ELSE 'compartilhando'
    END as tipo,
    p.atualizado_em as ultima_conexao
  FROM perfis p
  LEFT JOIN compartilhamentos c ON (
    (c.dono_id = usuario_base_id AND c.usuario_compartilhado_id = p.id) OR
    (c.usuario_compartilhado_id = usuario_base_id AND c.dono_id = p.id)
  )
  WHERE 
    p.id = usuario_base_id OR
    (c.status = 'ativo' AND c.id IS NOT NULL)
  ORDER BY tipo, p.nome;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- ============================================
-- ✅ SCRIPT CONCLUÍDO!
-- ============================================

-- Para aplicar este script:
-- 1. Acesse: https://supabase.com/dashboard
-- 2. Vá em: SQL Editor
-- 3. Cole este script completo
-- 4. Execute (RUN)

