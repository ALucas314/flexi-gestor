-- ============================================
-- 🗑️ LIMPAR SISTEMA DE COMPARTILHAMENTO
-- ============================================
-- Execute este script ANTES de executar o compartilhamento-multiusuario.sql

-- Ordem de remoção: Políticas → Funções → Índices → Tabela

-- ============================================
-- 1️⃣ REMOVER POLÍTICAS RLS
-- ============================================

-- Políticas de Produtos
DROP POLICY IF EXISTS "Usuários podem ver produtos próprios ou compartilhados" ON produtos;
DROP POLICY IF EXISTS "Usuários podem inserir produtos próprios ou compartilhados" ON produtos;
DROP POLICY IF EXISTS "Usuários podem atualizar produtos próprios ou compartilhados" ON produtos;
DROP POLICY IF EXISTS "Usuários podem deletar produtos próprios ou compartilhados" ON produtos;

-- Políticas de Lotes
DROP POLICY IF EXISTS "Usuários podem ver lotes próprios ou compartilhados" ON lotes;
DROP POLICY IF EXISTS "Usuários podem inserir lotes próprios ou compartilhados" ON lotes;
DROP POLICY IF EXISTS "Usuários podem atualizar lotes próprios ou compartilhados" ON lotes;
DROP POLICY IF EXISTS "Usuários podem deletar lotes próprios ou compartilhados" ON lotes;

-- Políticas de Movimentações
DROP POLICY IF EXISTS "Usuários podem ver movimentações próprias ou compartilhadas" ON movimentacoes;
DROP POLICY IF EXISTS "Usuários podem inserir movimentações próprias ou compartilhadas" ON movimentacoes;
DROP POLICY IF EXISTS "Usuários podem atualizar movimentações próprias ou compartilhadas" ON movimentacoes;
DROP POLICY IF EXISTS "Usuários podem deletar movimentações próprias ou compartilhadas" ON movimentacoes;

-- Políticas de Compartilhamentos
DROP POLICY IF EXISTS "Usuários podem ver seus compartilhamentos" ON compartilhamentos;
DROP POLICY IF EXISTS "Usuários podem criar compartilhamentos" ON compartilhamentos;
DROP POLICY IF EXISTS "Usuários podem atualizar seus compartilhamentos" ON compartilhamentos;
DROP POLICY IF EXISTS "Usuários podem deletar seus compartilhamentos" ON compartilhamentos;

-- ============================================
-- 2️⃣ REMOVER FUNÇÕES
-- ============================================

DROP FUNCTION IF EXISTS obter_usuarios_conectados(UUID) CASCADE;
DROP FUNCTION IF EXISTS tem_acesso_compartilhado(UUID) CASCADE;

-- ============================================
-- 3️⃣ REMOVER ÍNDICES
-- ============================================

DROP INDEX IF EXISTS idx_compartilhamentos_dono;
DROP INDEX IF EXISTS idx_compartilhamentos_usuario;

-- ============================================
-- 4️⃣ REMOVER TABELA
-- ============================================

DROP TABLE IF EXISTS compartilhamentos CASCADE;

-- ============================================
-- ✅ PRONTO! AGORA EXECUTE O SCRIPT PRINCIPAL
-- ============================================
-- Próximo passo: executar compartilhamento-multiusuario.sql
