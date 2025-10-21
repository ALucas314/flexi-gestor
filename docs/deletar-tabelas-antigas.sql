-- ========================================
-- SCRIPT PARA DELETAR TABELAS ANTIGAS (EM INGLÊS)
-- ========================================
-- 
-- ⚠️ ATENÇÃO: Este script irá DELETAR as tabelas antigas!
-- Execute APENAS se você já executou o script supabase-schema-completo.sql
-- e tem certeza que os dados foram migrados.
--
-- ========================================

-- Deletar triggers antigos
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
DROP TRIGGER IF EXISTS update_profiles_updated_at ON public.profiles;
DROP TRIGGER IF EXISTS update_products_updated_at ON public.products;

-- Deletar funções antigas
DROP FUNCTION IF EXISTS public.handle_new_user();
DROP FUNCTION IF EXISTS update_updated_at_column();
DROP FUNCTION IF EXISTS public.get_user_stats(UUID);
DROP FUNCTION IF EXISTS public.create_missing_profiles();

-- Deletar views antigas
DROP VIEW IF EXISTS public.low_stock_products;
DROP VIEW IF EXISTS public.expiring_batches;
DROP VIEW IF EXISTS public.movements_summary;

-- Deletar tabelas antigas (CASCADE remove dependências)
DROP TABLE IF EXISTS public.movements CASCADE;
DROP TABLE IF EXISTS public.batches CASCADE;
DROP TABLE IF EXISTS public.products CASCADE;
DROP TABLE IF EXISTS public.profiles CASCADE;

-- Mensagem de confirmação
DO $$
BEGIN
  RAISE NOTICE '╔════════════════════════════════════════╗';
  RAISE NOTICE '║  TABELAS ANTIGAS DELETADAS!            ║';
  RAISE NOTICE '╚════════════════════════════════════════╝';
  RAISE NOTICE '';
  RAISE NOTICE '✅ Tabelas em inglês removidas:';
  RAISE NOTICE '   - profiles (deletada)';
  RAISE NOTICE '   - products (deletada)';
  RAISE NOTICE '   - batches (deletada)';
  RAISE NOTICE '   - movements (deletada)';
  RAISE NOTICE '';
  RAISE NOTICE '✅ Tabelas em português ativas:';
  RAISE NOTICE '   - perfis';
  RAISE NOTICE '   - produtos';
  RAISE NOTICE '   - lotes';
  RAISE NOTICE '   - movimentacoes';
  RAISE NOTICE '';
  RAISE NOTICE '🎉 Limpeza concluída com sucesso!';
END $$;

