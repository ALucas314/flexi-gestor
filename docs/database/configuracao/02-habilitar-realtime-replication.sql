-- ========================================
-- HABILITAR REPLICAÇÃO REALTIME PARA SUPABASE
-- Flexi Gestor - Supabase PostgreSQL
-- ========================================
-- 
-- INSTRUÇÕES:
-- 1. Execute este script no SQL Editor do Supabase
-- 2. Isso habilita as tabelas para receber atualizações em tempo real
-- 3. Necessário para que as subscriptions funcionem corretamente
--
-- ========================================

-- Habilitar replicação Realtime para a tabela produtos
ALTER PUBLICATION supabase_realtime ADD TABLE produtos;

-- Habilitar replicação Realtime para a tabela movimentacoes
ALTER PUBLICATION supabase_realtime ADD TABLE movimentacoes;

-- Habilitar replicação Realtime para a tabela lotes
ALTER PUBLICATION supabase_realtime ADD TABLE lotes;

-- Habilitar replicação Realtime para a tabela fornecedores (se existir)
DO $$ 
BEGIN
  IF EXISTS (SELECT FROM information_schema.tables WHERE table_schema = 'public' AND table_name = 'fornecedores') THEN
    ALTER PUBLICATION supabase_realtime ADD TABLE fornecedores;
  END IF;
END $$;

-- Habilitar replicação Realtime para a tabela clientes (se existir)
DO $$ 
BEGIN
  IF EXISTS (SELECT FROM information_schema.tables WHERE table_schema = 'public' AND table_name = 'clientes') THEN
    ALTER PUBLICATION supabase_realtime ADD TABLE clientes;
  END IF;
END $$;

-- ========================================
-- VERIFICAR SE ESTÁ FUNCIONANDO
-- ========================================
-- Execute este comando para verificar quais tabelas estão na publicação:
-- SELECT * FROM pg_publication_tables WHERE pubname = 'supabase_realtime';

