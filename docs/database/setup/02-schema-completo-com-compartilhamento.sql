-- ========================================
-- FLEXI GESTOR - SCHEMA COMPLETO COM COMPARTILHAMENTO
-- Supabase PostgreSQL (TABELAS EM PORTUGUÊS)
-- Versão: 3.0.0 - Com Sistema de Compartilhamento Multi-Usuário
-- Data: 2025-01-22
-- ========================================
-- 
-- ESTE SCRIPT FAZ TUDO:
-- 1. Cria estrutura base (produtos, lotes, movimentações, perfis)
-- 2. Cria sistema de compartilhamento
-- 3. Configura RLS com permissões granulares
-- 4. Permite múltiplos usuários no mesmo workspace
--
-- ========================================

-- Extensões
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";
CREATE EXTENSION IF NOT EXISTS "pg_trgm";

-- ========================================
-- LIMPAR POLÍTICAS ANTIGAS (se existirem)
-- ========================================

-- Produtos
DROP POLICY IF EXISTS "Usuarios podem ver proprios produtos" ON produtos;
DROP POLICY IF EXISTS "Usuarios podem inserir proprios produtos" ON produtos;
DROP POLICY IF EXISTS "Usuarios podem atualizar proprios produtos" ON produtos;
DROP POLICY IF EXISTS "Usuarios podem deletar proprios produtos" ON produtos;
DROP POLICY IF EXISTS "Usuários podem ver produtos próprios ou compartilhados" ON produtos;
DROP POLICY IF EXISTS "Usuários podem inserir produtos próprios ou compartilhados" ON produtos;
DROP POLICY IF EXISTS "Usuários podem atualizar produtos próprios ou compartilhados" ON produtos;
DROP POLICY IF EXISTS "Usuários podem deletar produtos próprios ou compartilhados" ON produtos;

-- Lotes
DROP POLICY IF EXISTS "Usuarios podem ver proprios lotes" ON lotes;
DROP POLICY IF EXISTS "Usuarios podem inserir proprios lotes" ON lotes;
DROP POLICY IF EXISTS "Usuarios podem atualizar proprios lotes" ON lotes;
DROP POLICY IF EXISTS "Usuarios podem deletar proprios lotes" ON lotes;
DROP POLICY IF EXISTS "Usuários podem ver lotes próprios ou compartilhados" ON lotes;
DROP POLICY IF EXISTS "Usuários podem inserir lotes próprios ou compartilhados" ON lotes;
DROP POLICY IF EXISTS "Usuários podem atualizar lotes próprios ou compartilhados" ON lotes;
DROP POLICY IF EXISTS "Usuários podem deletar lotes próprios ou compartilhados" ON lotes;

-- Movimentações
DROP POLICY IF EXISTS "Usuarios podem ver proprias movimentacoes" ON movimentacoes;
DROP POLICY IF EXISTS "Usuarios podem inserir proprias movimentacoes" ON movimentacoes;
DROP POLICY IF EXISTS "Usuarios podem atualizar proprias movimentacoes" ON movimentacoes;
DROP POLICY IF EXISTS "Usuarios podem deletar proprias movimentacoes" ON movimentacoes;
DROP POLICY IF EXISTS "Usuários podem ver movimentações próprias ou compartilhadas" ON movimentacoes;
DROP POLICY IF EXISTS "Usuários podem inserir movimentações próprias ou compartilhadas" ON movimentacoes;
DROP POLICY IF EXISTS "Usuários podem atualizar movimentações próprias ou compartilhadas" ON movimentacoes;
DROP POLICY IF EXISTS "Usuários podem deletar movimentações próprias ou compartilhadas" ON movimentacoes;

-- Perfis
DROP POLICY IF EXISTS "Usuarios podem ver proprio perfil" ON perfis;
DROP POLICY IF EXISTS "Usuarios podem atualizar proprio perfil" ON perfis;
DROP POLICY IF EXISTS "Usuarios podem inserir proprio perfil" ON perfis;
DROP POLICY IF EXISTS "Usuários podem buscar outros usuários para compartilhar" ON perfis;

-- ========================================
-- TABELAS
-- ========================================

-- Tabela de Perfis
CREATE TABLE IF NOT EXISTS perfis (
  id UUID REFERENCES auth.users(id) ON DELETE CASCADE PRIMARY KEY,
  email TEXT UNIQUE NOT NULL,
  nome TEXT,
  criado_em TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  atualizado_em TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Tabela de Produtos
CREATE TABLE IF NOT EXISTS produtos (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  nome TEXT NOT NULL,
  sku TEXT NOT NULL,
  categoria TEXT NOT NULL,
  preco DECIMAL(10, 2) NOT NULL DEFAULT 0 CHECK (preco >= 0),
  estoque INTEGER NOT NULL DEFAULT 0 CHECK (estoque >= 0),
  estoque_minimo INTEGER NOT NULL DEFAULT 0 CHECK (estoque_minimo >= 0),
  unidade_medida TEXT NOT NULL,
  fornecedor TEXT NOT NULL,
  descricao TEXT,
  usuario_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  criado_em TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  atualizado_em TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  CONSTRAINT sku_unico_por_usuario UNIQUE (sku, usuario_id)
);

-- Tabela de Lotes
CREATE TABLE IF NOT EXISTS lotes (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  produto_id UUID REFERENCES produtos(id) ON DELETE CASCADE NOT NULL,
  numero_lote TEXT NOT NULL,
  quantidade INTEGER NOT NULL DEFAULT 0 CHECK (quantidade >= 0),
  custo_unitario DECIMAL(10, 2) NOT NULL DEFAULT 0 CHECK (custo_unitario >= 0),
  data_validade DATE,
  usuario_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  criado_em TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Tabela de Movimentações
CREATE TABLE IF NOT EXISTS movimentacoes (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  produto_id UUID REFERENCES produtos(id) ON DELETE CASCADE NOT NULL,
  tipo TEXT NOT NULL CHECK (tipo IN ('entrada', 'saida')),
  quantidade INTEGER NOT NULL CHECK (quantidade > 0),
  preco_unitario DECIMAL(10, 2) NOT NULL DEFAULT 0 CHECK (preco_unitario >= 0),
  preco_total DECIMAL(10, 2) NOT NULL DEFAULT 0 CHECK (preco_total >= 0),
  metodo_pagamento TEXT,
  observacoes TEXT,
  numero_recibo TEXT,
  usuario_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  criado_em TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Tabela de Compartilhamentos
CREATE TABLE IF NOT EXISTS compartilhamentos (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  dono_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  usuario_compartilhado_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  criado_em TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  atualizado_em TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  status TEXT DEFAULT 'ativo' CHECK (status IN ('ativo', 'inativo')),
  permissoes TEXT[] DEFAULT ARRAY['produtos', 'entradas', 'saidas', 'relatorios', 'financeiro', 'pdv'],
  UNIQUE(dono_id, usuario_compartilhado_id)
);

-- ========================================
-- ÍNDICES
-- ========================================

CREATE INDEX IF NOT EXISTS idx_produtos_sku ON produtos(sku);
CREATE INDEX IF NOT EXISTS idx_produtos_usuario_id ON produtos(usuario_id);
CREATE INDEX IF NOT EXISTS idx_produtos_categoria ON produtos(categoria);
CREATE INDEX IF NOT EXISTS idx_produtos_nome_trgm ON produtos USING gin (nome gin_trgm_ops);

CREATE INDEX IF NOT EXISTS idx_lotes_produto_id ON lotes(produto_id);
CREATE INDEX IF NOT EXISTS idx_lotes_usuario_id ON lotes(usuario_id);
CREATE INDEX IF NOT EXISTS idx_lotes_data_validade ON lotes(data_validade);

CREATE INDEX IF NOT EXISTS idx_movimentacoes_produto_id ON movimentacoes(produto_id);
CREATE INDEX IF NOT EXISTS idx_movimentacoes_usuario_id ON movimentacoes(usuario_id);
CREATE INDEX IF NOT EXISTS idx_movimentacoes_tipo ON movimentacoes(tipo);
CREATE INDEX IF NOT EXISTS idx_movimentacoes_criado_em ON movimentacoes(criado_em DESC);

CREATE INDEX IF NOT EXISTS idx_compartilhamentos_dono ON compartilhamentos(dono_id) WHERE status = 'ativo';
CREATE INDEX IF NOT EXISTS idx_compartilhamentos_usuario ON compartilhamentos(usuario_compartilhado_id) WHERE status = 'ativo';

-- ========================================
-- FUNÇÕES
-- ========================================

-- Remover funções antigas se existirem
DROP FUNCTION IF EXISTS tem_acesso_compartilhado(UUID) CASCADE;
DROP FUNCTION IF EXISTS atualizar_data_modificacao() CASCADE;
DROP FUNCTION IF EXISTS criar_perfil_novo_usuario() CASCADE;

-- Atualizar data de modificação
CREATE OR REPLACE FUNCTION atualizar_data_modificacao()
RETURNS TRIGGER AS $$
BEGIN
  NEW.atualizado_em = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Criar perfil automaticamente
CREATE OR REPLACE FUNCTION criar_perfil_novo_usuario()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO perfis (id, email, nome)
  VALUES (
    NEW.id, 
    NEW.email, 
    COALESCE(NEW.raw_user_meta_data->>'name', split_part(NEW.email, '@', 1))
  )
  ON CONFLICT (id) DO NOTHING;
  RETURN NEW;
EXCEPTION
  WHEN OTHERS THEN
    RAISE WARNING 'Erro ao criar perfil: %', SQLERRM;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Verificar acesso compartilhado
CREATE OR REPLACE FUNCTION tem_acesso_compartilhado(usuario_dono_id UUID)
RETURNS BOOLEAN AS $$
DECLARE
  usuario_atual UUID;
BEGIN
  usuario_atual := auth.uid();
  
  IF usuario_atual IS NULL THEN
    RETURN false;
  END IF;
  
  RETURN (
    usuario_atual = usuario_dono_id 
    OR
    EXISTS (
      SELECT 1 FROM compartilhamentos
      WHERE dono_id = usuario_atual
      AND usuario_compartilhado_id = usuario_dono_id
      AND status = 'ativo'
    )
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

-- ========================================
-- TRIGGERS
-- ========================================

DROP TRIGGER IF EXISTS atualizar_perfis_data_modificacao ON perfis;
CREATE TRIGGER atualizar_perfis_data_modificacao
  BEFORE UPDATE ON perfis
  FOR EACH ROW
  EXECUTE FUNCTION atualizar_data_modificacao();

DROP TRIGGER IF EXISTS atualizar_produtos_data_modificacao ON produtos;
CREATE TRIGGER atualizar_produtos_data_modificacao
  BEFORE UPDATE ON produtos
  FOR EACH ROW
  EXECUTE FUNCTION atualizar_data_modificacao();

DROP TRIGGER IF EXISTS criar_perfil_automaticamente ON auth.users;
CREATE TRIGGER criar_perfil_automaticamente
  AFTER INSERT ON auth.users
  FOR EACH ROW
  EXECUTE FUNCTION criar_perfil_novo_usuario();

-- ========================================
-- HABILITAR RLS
-- ========================================

ALTER TABLE perfis ENABLE ROW LEVEL SECURITY;
ALTER TABLE produtos ENABLE ROW LEVEL SECURITY;
ALTER TABLE lotes ENABLE ROW LEVEL SECURITY;
ALTER TABLE movimentacoes ENABLE ROW LEVEL SECURITY;
ALTER TABLE compartilhamentos ENABLE ROW LEVEL SECURITY;

-- ========================================
-- POLÍTICAS RLS - PERFIS
-- ========================================

DROP POLICY IF EXISTS "Usuarios podem ver proprio perfil" ON perfis;
DROP POLICY IF EXISTS "Usuarios podem atualizar proprio perfil" ON perfis;
DROP POLICY IF EXISTS "Usuarios podem inserir proprio perfil" ON perfis;
DROP POLICY IF EXISTS "Usuários podem buscar outros usuários para compartilhar" ON perfis;

CREATE POLICY "Usuarios podem atualizar proprio perfil"
ON perfis FOR UPDATE
USING (auth.uid() = id);

CREATE POLICY "Usuarios podem inserir proprio perfil"
ON perfis FOR INSERT
WITH CHECK (auth.uid() = id);

-- Política única para ver perfis (permite buscar outros usuários para compartilhar)
CREATE POLICY "Usuários podem buscar outros usuários para compartilhar"
ON perfis FOR SELECT TO authenticated
USING (true);

-- ========================================
-- POLÍTICAS RLS - PRODUTOS
-- ========================================

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

-- ========================================
-- POLÍTICAS RLS - LOTES
-- ========================================

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

-- ========================================
-- POLÍTICAS RLS - MOVIMENTAÇÕES
-- ========================================

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

-- ========================================
-- POLÍTICAS RLS - COMPARTILHAMENTOS
-- ========================================

DROP POLICY IF EXISTS "Usuários podem ver seus compartilhamentos" ON compartilhamentos;
CREATE POLICY "Usuários podem ver seus compartilhamentos"
ON compartilhamentos FOR SELECT TO authenticated
USING (auth.uid() = dono_id OR auth.uid() = usuario_compartilhado_id);

DROP POLICY IF EXISTS "Usuários podem criar compartilhamentos" ON compartilhamentos;
CREATE POLICY "Usuários podem criar compartilhamentos"
ON compartilhamentos FOR INSERT TO authenticated
WITH CHECK (auth.uid() = dono_id);

DROP POLICY IF EXISTS "Usuários podem atualizar seus compartilhamentos" ON compartilhamentos;
CREATE POLICY "Usuários podem atualizar seus compartilhamentos"
ON compartilhamentos FOR UPDATE TO authenticated
USING (auth.uid() = dono_id);

DROP POLICY IF EXISTS "Usuários podem deletar seus compartilhamentos" ON compartilhamentos;
CREATE POLICY "Usuários podem deletar seus compartilhamentos"
ON compartilhamentos FOR DELETE TO authenticated
USING (auth.uid() = dono_id);

-- ========================================
-- POPULAR PERFIS
-- ========================================

INSERT INTO perfis (id, email, nome, criado_em, atualizado_em)
SELECT 
  u.id,
  u.email,
  COALESCE(u.raw_user_meta_data->>'name', split_part(u.email, '@', 1)) as nome,
  u.created_at,
  NOW()
FROM auth.users u
WHERE NOT EXISTS (
  SELECT 1 FROM perfis p WHERE p.id = u.id
)
ON CONFLICT (id) DO NOTHING;

-- ========================================
-- VERIFICAÇÃO FINAL
-- ========================================

SELECT 
  '✅ Schema completo com compartilhamento instalado!' as mensagem,
  (SELECT COUNT(*) FROM auth.users) as total_usuarios,
  (SELECT COUNT(*) FROM perfis) as total_perfis,
  (SELECT COUNT(*) FROM produtos) as total_produtos,
  (SELECT COUNT(*) FROM compartilhamentos WHERE status = 'ativo') as compartilhamentos_ativos;

