-- ========================================
-- CONFIGURAR AUTO-REFRESH PERMANENTE
-- Flexi Gestor - Supabase PostgreSQL
-- ========================================
-- 
-- INSTRUÇÕES:
-- 1. Execute este script no SQL Editor do Supabase
-- 2. Isso configura o banco para manter conexões vivas
-- 3. Necessário para que a aplicação não precise de F5
--
-- ========================================

-- ========================================
-- 1. GARANTIR QUE TODAS AS TABELAS ESTÃO NA PUBLICAÇÃO REALTIME
-- ========================================

-- Adicionar tabelas principais à publicação supabase_realtime (se ainda não estiverem)
DO $$ 
BEGIN
  -- Produtos
  IF EXISTS (SELECT FROM information_schema.tables WHERE table_schema = 'public' AND table_name = 'produtos') THEN
    BEGIN
      ALTER PUBLICATION supabase_realtime ADD TABLE produtos;
    EXCEPTION WHEN duplicate_object THEN
      -- Já está na publicação, ignorar
      NULL;
    END;
  END IF;

  -- Movimentações
  IF EXISTS (SELECT FROM information_schema.tables WHERE table_schema = 'public' AND table_name = 'movimentacoes') THEN
    BEGIN
      ALTER PUBLICATION supabase_realtime ADD TABLE movimentacoes;
    EXCEPTION WHEN duplicate_object THEN
      NULL;
    END;
  END IF;

  -- Lotes
  IF EXISTS (SELECT FROM information_schema.tables WHERE table_schema = 'public' AND table_name = 'lotes') THEN
    BEGIN
      ALTER PUBLICATION supabase_realtime ADD TABLE lotes;
    EXCEPTION WHEN duplicate_object THEN
      NULL;
    END;
  END IF;

  -- Fornecedores
  IF EXISTS (SELECT FROM information_schema.tables WHERE table_schema = 'public' AND table_name = 'fornecedores') THEN
    BEGIN
      ALTER PUBLICATION supabase_realtime ADD TABLE fornecedores;
    EXCEPTION WHEN duplicate_object THEN
      NULL;
    END;
  END IF;

  -- Clientes
  IF EXISTS (SELECT FROM information_schema.tables WHERE table_schema = 'public' AND table_name = 'clientes') THEN
    BEGIN
      ALTER PUBLICATION supabase_realtime ADD TABLE clientes;
    EXCEPTION WHEN duplicate_object THEN
      NULL;
    END;
  END IF;

  -- Categorias
  IF EXISTS (SELECT FROM information_schema.tables WHERE table_schema = 'public' AND table_name = 'categorias') THEN
    BEGIN
      ALTER PUBLICATION supabase_realtime ADD TABLE categorias;
    EXCEPTION WHEN duplicate_object THEN
      NULL;
    END;
  END IF;

  -- Unidades de Medida
  IF EXISTS (SELECT FROM information_schema.tables WHERE table_schema = 'public' AND table_name = 'unidades_medida') THEN
    BEGIN
      ALTER PUBLICATION supabase_realtime ADD TABLE unidades_medida;
    EXCEPTION WHEN duplicate_object THEN
      NULL;
    END;
  END IF;

  -- Compartilhamentos
  IF EXISTS (SELECT FROM information_schema.tables WHERE table_schema = 'public' AND table_name = 'compartilhamentos') THEN
    BEGIN
      ALTER PUBLICATION supabase_realtime ADD TABLE compartilhamentos;
    EXCEPTION WHEN duplicate_object THEN
      NULL;
    END;
  END IF;

  -- Perfis
  IF EXISTS (SELECT FROM information_schema.tables WHERE table_schema = 'public' AND table_name = 'perfis') THEN
    BEGIN
      ALTER PUBLICATION supabase_realtime ADD TABLE perfis;
    EXCEPTION WHEN duplicate_object THEN
      NULL;
    END;
  END IF;
END $$;

-- ========================================
-- 2. CONFIGURAR TIMEOUTS PARA CONEXÕES LONGAS
-- ========================================

-- Aumentar timeout de statement para permitir operações longas (300 segundos = 5 minutos)
ALTER DATABASE postgres SET statement_timeout = '300s';

-- Aumentar timeout de idle para manter conexões vivas (300 segundos = 5 minutos)
ALTER DATABASE postgres SET idle_in_transaction_session_timeout = '300s';

-- Configurar timeout de lock para evitar deadlocks (60 segundos)
ALTER DATABASE postgres SET lock_timeout = '60s';

-- NOTA: Essas configurações permitem que:
-- - Conexões permaneçam vivas por até 5 minutos sem atividade
-- - Operações longas não sejam interrompidas prematuramente
-- - Com heartbeat a cada 15 segundos, nunca chegaremos perto do timeout

-- ========================================
-- 3. CONFIGURAR PARÂMETROS DE CONEXÃO
-- ========================================

-- NOTA: No Supabase, as configurações de ALTER SYSTEM são gerenciadas pela plataforma
-- e não podem ser alteradas pelo usuário. Essas configurações já estão otimizadas
-- pelo Supabase para manter conexões vivas.
--
-- As configurações importantes já foram feitas acima:
-- - Timeouts de statement e idle
-- - Publicação Realtime configurada
--
-- O código da aplicação já está configurado com heartbeat e reconexão automática.

-- ========================================
-- 4. VERIFICAR CONFIGURAÇÃO
-- ========================================

-- Verificar quais tabelas estão na publicação
SELECT 
  schemaname,
  tablename
FROM pg_publication_tables 
WHERE pubname = 'supabase_realtime'
ORDER BY tablename;

-- Verificar timeouts configurados (para informação)
SELECT 
  name,
  setting,
  unit,
  short_desc
FROM pg_settings
WHERE name IN (
  'statement_timeout',
  'idle_in_transaction_session_timeout',
  'lock_timeout'
)
ORDER BY name;

-- ✅ Se os valores mostrados forem:
-- - statement_timeout: 300000 ms (300 segundos = 5 minutos) ✅
-- - idle_in_transaction_session_timeout: 300000 ms (300 segundos = 5 minutos) ✅
-- - lock_timeout: 60000 ms (60 segundos) ✅
-- 
-- Então está tudo configurado corretamente!
--
-- Com esses timeouts:
-- - Conexões podem ficar vivas por até 5 minutos sem atividade
-- - Com heartbeat a cada 15 segundos, nunca chegaremos perto do timeout
-- - O código faz health check a cada 30 segundos
-- - O código faz refresh de dados a cada 45 segundos
-- A aplicação vai funcionar sem precisar de F5!

-- ========================================
-- NOTA IMPORTANTE
-- ========================================
-- 
-- No Supabase, algumas configurações são gerenciadas pela plataforma e não podem
-- ser alteradas pelo usuário (como ALTER SYSTEM). Isso é normal e esperado.
--
-- As configurações mais importantes para o Realtime funcionar são:
-- - ✅ ALTER PUBLICATION supabase_realtime (já configurado acima)
-- - ✅ Timeouts de statement e idle (já configurados acima)
--
-- O código da aplicação já está configurado com:
-- - ✅ Heartbeat a cada 15 segundos
-- - ✅ Reconexão automática
-- - ✅ Health check a cada 30 segundos
-- - ✅ Refresh de dados a cada 45 segundos
-- - ✅ Detecção de desconexão e reconexão automática
-- - ✅ Reconexão quando a página volta a ficar visível
--
-- Execute este script uma vez e a aplicação deve funcionar sem precisar de F5!
--
-- ========================================

