-- ============================================
-- 🤝 INSTALAÇÃO COMPLETA DO SISTEMA DE COMPARTILHAMENTO
-- ============================================
-- Este script faz TUDO de uma vez:
-- 1. Remove instalação antiga (se existir)
-- 2. Cria tabela, funções e políticas RLS
-- 3. Configura permissões granulares
-- 4. Permite buscar outros usuários

-- ============================================
-- PASSO 1: LIMPAR INSTALAÇÃO ANTIGA
-- ============================================

-- Remover políticas de produtos
DROP POLICY IF EXISTS "Usuários podem ver produtos próprios ou compartilhados" ON produtos;
DROP POLICY IF EXISTS "Usuários podem inserir produtos próprios ou compartilhados" ON produtos;
DROP POLICY IF EXISTS "Usuários podem atualizar produtos próprios ou compartilhados" ON produtos;
DROP POLICY IF EXISTS "Usuários podem deletar produtos próprios ou compartilhados" ON produtos;

-- Remover políticas de lotes
DROP POLICY IF EXISTS "Usuários podem ver lotes próprios ou compartilhados" ON lotes;
DROP POLICY IF EXISTS "Usuários podem inserir lotes próprios ou compartilhados" ON lotes;
DROP POLICY IF EXISTS "Usuários podem atualizar lotes próprios ou compartilhados" ON lotes;
DROP POLICY IF EXISTS "Usuários podem deletar lotes próprios ou compartilhados" ON lotes;

-- Remover políticas de movimentações
DROP POLICY IF EXISTS "Usuários podem ver movimentações próprias ou compartilhadas" ON movimentacoes;
DROP POLICY IF EXISTS "Usuários podem inserir movimentações próprias ou compartilhadas" ON movimentacoes;
DROP POLICY IF EXISTS "Usuários podem atualizar movimentações próprias ou compartilhadas" ON movimentacoes;
DROP POLICY IF EXISTS "Usuários podem deletar movimentações próprias ou compartilhadas" ON movimentacoes;

-- Remover políticas de compartilhamentos
DROP POLICY IF EXISTS "Usuários podem ver seus compartilhamentos" ON compartilhamentos;
DROP POLICY IF EXISTS "Usuários podem criar compartilhamentos" ON compartilhamentos;
DROP POLICY IF EXISTS "Usuários podem atualizar seus compartilhamentos" ON compartilhamentos;
DROP POLICY IF EXISTS "Usuários podem deletar seus compartilhamentos" ON compartilhamentos;

-- Remover funções
DROP FUNCTION IF EXISTS obter_usuarios_conectados(UUID) CASCADE;
DROP FUNCTION IF EXISTS tem_acesso_compartilhado(UUID) CASCADE;

-- Remover índices
DROP INDEX IF EXISTS idx_compartilhamentos_dono;
DROP INDEX IF EXISTS idx_compartilhamentos_usuario;

-- Remover tabela
DROP TABLE IF EXISTS compartilhamentos CASCADE;

-- ============================================
-- PASSO 2: CRIAR TABELA DE COMPARTILHAMENTOS
-- ============================================

CREATE TABLE compartilhamentos (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  dono_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  usuario_compartilhado_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  criado_em TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  atualizado_em TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  status TEXT DEFAULT 'ativo' CHECK (status IN ('ativo', 'inativo')),
  permissoes TEXT[] DEFAULT ARRAY['produtos', 'entradas', 'saidas', 'relatorios', 'financeiro', 'pdv'],
  
  UNIQUE(dono_id, usuario_compartilhado_id)
);

-- Índices para performance
CREATE INDEX idx_compartilhamentos_dono ON compartilhamentos(dono_id) WHERE status = 'ativo';
CREATE INDEX idx_compartilhamentos_usuario ON compartilhamentos(usuario_compartilhado_id) WHERE status = 'ativo';

-- Habilitar RLS
ALTER TABLE compartilhamentos ENABLE ROW LEVEL SECURITY;

-- ============================================
-- PASSO 3: CRIAR FUNÇÕES
-- ============================================

CREATE OR REPLACE FUNCTION tem_acesso_compartilhado(usuario_dono_id UUID)
RETURNS BOOLEAN AS $$
BEGIN
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
-- PASSO 4: POLÍTICAS RLS - COMPARTILHAMENTOS
-- ============================================

CREATE POLICY "Usuários podem ver seus compartilhamentos"
ON compartilhamentos FOR SELECT TO authenticated
USING (auth.uid() = dono_id OR auth.uid() = usuario_compartilhado_id);

CREATE POLICY "Usuários podem criar compartilhamentos"
ON compartilhamentos FOR INSERT TO authenticated
WITH CHECK (auth.uid() = dono_id);

CREATE POLICY "Usuários podem atualizar seus compartilhamentos"
ON compartilhamentos FOR UPDATE TO authenticated
USING (auth.uid() = dono_id);

CREATE POLICY "Usuários podem deletar seus compartilhamentos"
ON compartilhamentos FOR DELETE TO authenticated
USING (auth.uid() = dono_id);

-- ============================================
-- PASSO 5: ATUALIZAR RLS - PRODUTOS
-- ============================================

CREATE POLICY "Usuários podem ver produtos próprios ou compartilhados"
ON produtos FOR SELECT TO authenticated
USING (tem_acesso_compartilhado(usuario_id));

CREATE POLICY "Usuários podem inserir produtos próprios ou compartilhados"
ON produtos FOR INSERT TO authenticated
WITH CHECK (tem_acesso_compartilhado(usuario_id));

CREATE POLICY "Usuários podem atualizar produtos próprios ou compartilhados"
ON produtos FOR UPDATE TO authenticated
USING (tem_acesso_compartilhado(usuario_id));

CREATE POLICY "Usuários podem deletar produtos próprios ou compartilhados"
ON produtos FOR DELETE TO authenticated
USING (tem_acesso_compartilhado(usuario_id));

-- ============================================
-- PASSO 6: ATUALIZAR RLS - LOTES
-- ============================================

CREATE POLICY "Usuários podem ver lotes próprios ou compartilhados"
ON lotes FOR SELECT TO authenticated
USING (tem_acesso_compartilhado(usuario_id));

CREATE POLICY "Usuários podem inserir lotes próprios ou compartilhados"
ON lotes FOR INSERT TO authenticated
WITH CHECK (tem_acesso_compartilhado(usuario_id));

CREATE POLICY "Usuários podem atualizar lotes próprios ou compartilhados"
ON lotes FOR UPDATE TO authenticated
USING (tem_acesso_compartilhado(usuario_id));

CREATE POLICY "Usuários podem deletar lotes próprios ou compartilhados"
ON lotes FOR DELETE TO authenticated
USING (tem_acesso_compartilhado(usuario_id));

-- ============================================
-- PASSO 7: ATUALIZAR RLS - MOVIMENTAÇÕES
-- ============================================

CREATE POLICY "Usuários podem ver movimentações próprias ou compartilhadas"
ON movimentacoes FOR SELECT TO authenticated
USING (tem_acesso_compartilhado(usuario_id));

CREATE POLICY "Usuários podem inserir movimentações próprias ou compartilhadas"
ON movimentacoes FOR INSERT TO authenticated
WITH CHECK (tem_acesso_compartilhado(usuario_id));

CREATE POLICY "Usuários podem atualizar movimentações próprias ou compartilhadas"
ON movimentacoes FOR UPDATE TO authenticated
USING (tem_acesso_compartilhado(usuario_id));

CREATE POLICY "Usuários podem deletar movimentações próprias ou compartilhadas"
ON movimentacoes FOR DELETE TO authenticated
USING (tem_acesso_compartilhado(usuario_id));

-- ============================================
-- PASSO 8: PERMITIR BUSCAR OUTROS USUÁRIOS
-- ============================================

DROP POLICY IF EXISTS "Usuários podem buscar outros usuários para compartilhar" ON perfis;
CREATE POLICY "Usuários podem buscar outros usuários para compartilhar"
ON perfis FOR SELECT TO authenticated
USING (true);

-- ============================================
-- ✅ CONCLUÍDO!
-- ============================================

SELECT 'Sistema de compartilhamento instalado com sucesso!' as mensagem;

