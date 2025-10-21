-- ========================================
-- SCRIPT PARA CORRIGIR PROBLEMAS DO SECURITY ADVISOR
-- Resolve os 3 erros e 6 warnings do Supabase
-- ========================================
-- 
-- Este script corrige:
-- 1. Views com SECURITY DEFINER
-- 2. Problemas de segurança detectados pelo Supabase
-- 3. Garante que as views respeitem RLS
--
-- ========================================

-- ========================================
-- 1. REMOVER VIEWS ANTIGAS COM SECURITY DEFINER
-- ========================================

DROP VIEW IF EXISTS public.resumo_movimentacoes CASCADE;
DROP VIEW IF EXISTS public.produtos_estoque_baixo CASCADE;
DROP VIEW IF EXISTS public.lotes_vencendo CASCADE;

-- ========================================
-- 2. RECRIAR VIEWS SEM SECURITY DEFINER
-- ========================================

-- View de produtos com estoque baixo (SEM SECURITY DEFINER)
CREATE OR REPLACE VIEW public.produtos_estoque_baixo AS
SELECT 
  p.id,
  p.nome,
  p.sku,
  p.categoria,
  p.estoque,
  p.estoque_minimo,
  p.estoque - p.estoque_minimo AS deficit_estoque,
  p.usuario_id,
  p.atualizado_em
FROM public.produtos p
WHERE p.estoque <= p.estoque_minimo
ORDER BY (p.estoque - p.estoque_minimo) ASC;

COMMENT ON VIEW public.produtos_estoque_baixo IS 'Produtos com estoque abaixo ou igual ao mínimo (SEM SECURITY DEFINER)';

-- View de lotes próximos ao vencimento (SEM SECURITY DEFINER)
CREATE OR REPLACE VIEW public.lotes_vencendo AS
SELECT 
  l.id,
  l.numero_lote,
  l.quantidade,
  l.data_validade,
  l.data_validade - CURRENT_DATE AS dias_ate_vencimento,
  p.nome AS nome_produto,
  p.sku,
  p.categoria,
  l.usuario_id,
  l.criado_em
FROM public.lotes l
JOIN public.produtos p ON l.produto_id = p.id
WHERE l.data_validade IS NOT NULL
  AND l.data_validade <= CURRENT_DATE + INTERVAL '30 days'
  AND l.quantidade > 0
ORDER BY l.data_validade ASC;

COMMENT ON VIEW public.lotes_vencendo IS 'Lotes que vencem nos próximos 30 dias (SEM SECURITY DEFINER)';

-- View de resumo de movimentações por período (SEM SECURITY DEFINER)
CREATE OR REPLACE VIEW public.resumo_movimentacoes AS
SELECT 
  m.usuario_id,
  m.tipo,
  DATE(m.criado_em) AS data_movimentacao,
  COUNT(*) AS total_movimentacoes,
  SUM(m.quantidade) AS quantidade_total,
  SUM(m.preco_total) AS valor_total
FROM public.movimentacoes m
GROUP BY m.usuario_id, m.tipo, DATE(m.criado_em)
ORDER BY data_movimentacao DESC;

COMMENT ON VIEW public.resumo_movimentacoes IS 'Resumo diário de movimentações por tipo (SEM SECURITY DEFINER)';

-- ========================================
-- 3. GARANTIR QUE AS VIEWS RESPEITEM RLS
-- ========================================
-- As views agora herdam as permissões do usuário que as consulta,
-- não do criador. Isso significa que o RLS será respeitado automaticamente.

-- ========================================
-- 4. VERIFICAR E CORRIGIR FUNÇÕES COM SECURITY DEFINER
-- ========================================

-- Recriar função criar_perfil_novo_usuario mantendo SECURITY DEFINER
-- (esta função PRECISA de SECURITY DEFINER para inserir em perfis)
DROP FUNCTION IF EXISTS public.criar_perfil_novo_usuario() CASCADE;

CREATE OR REPLACE FUNCTION public.criar_perfil_novo_usuario()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO public.perfis (id, email, nome)
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

COMMENT ON FUNCTION public.criar_perfil_novo_usuario() IS 'Cria automaticamente um perfil quando um novo usuário se registra (SECURITY DEFINER necessário)';

-- Recriar função criar_perfis_faltantes mantendo SECURITY DEFINER
-- (esta função PRECISA de SECURITY DEFINER para ler auth.users)
DROP FUNCTION IF EXISTS public.criar_perfis_faltantes() CASCADE;

CREATE OR REPLACE FUNCTION public.criar_perfis_faltantes()
RETURNS TABLE (
  id_usuario UUID,
  email TEXT,
  status TEXT
) AS $$
BEGIN
  RETURN QUERY
  INSERT INTO public.perfis (id, email, nome, criado_em, atualizado_em)
  SELECT 
    u.id,
    u.email,
    COALESCE(u.raw_user_meta_data->>'name', split_part(u.email, '@', 1)) as nome,
    u.created_at,
    NOW()
  FROM auth.users u
  WHERE NOT EXISTS (
    SELECT 1 FROM public.perfis p WHERE p.id = u.id
  )
  ON CONFLICT (id) DO NOTHING
  RETURNING id, email, 'criado' as status;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

COMMENT ON FUNCTION public.criar_perfis_faltantes() IS 'Cria perfis para usuários que não possuem perfil (SECURITY DEFINER necessário)';

-- Recriar função obter_estatisticas_usuario mantendo SECURITY DEFINER
-- (esta função PRECISA de SECURITY DEFINER para calcular estatísticas)
DROP FUNCTION IF EXISTS public.obter_estatisticas_usuario(UUID) CASCADE;

CREATE OR REPLACE FUNCTION public.obter_estatisticas_usuario(p_usuario_id UUID)
RETURNS JSON AS $$
DECLARE
  estatisticas JSON;
BEGIN
  -- Verificar se o usuário está consultando suas próprias estatísticas
  IF auth.uid() != p_usuario_id THEN
    RAISE EXCEPTION 'Acesso negado: você só pode ver suas próprias estatísticas';
  END IF;

  SELECT json_build_object(
    'total_produtos', (SELECT COUNT(*) FROM public.produtos WHERE usuario_id = p_usuario_id),
    'total_lotes', (SELECT COUNT(*) FROM public.lotes WHERE usuario_id = p_usuario_id),
    'produtos_estoque_baixo', (SELECT COUNT(*) FROM public.produtos WHERE usuario_id = p_usuario_id AND estoque <= estoque_minimo),
    'lotes_vencendo', (
      SELECT COUNT(*) 
      FROM public.lotes 
      WHERE usuario_id = p_usuario_id 
        AND data_validade IS NOT NULL 
        AND data_validade <= CURRENT_DATE + INTERVAL '30 days'
        AND quantidade > 0
    ),
    'movimentacoes_hoje', (
      SELECT COUNT(*) 
      FROM public.movimentacoes 
      WHERE usuario_id = p_usuario_id 
        AND DATE(criado_em) = CURRENT_DATE
    ),
    'receita_hoje', (
      SELECT COALESCE(SUM(preco_total), 0) 
      FROM public.movimentacoes 
      WHERE usuario_id = p_usuario_id 
        AND tipo = 'saida'
        AND DATE(criado_em) = CURRENT_DATE
    )
  ) INTO estatisticas;
  
  RETURN estatisticas;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

COMMENT ON FUNCTION public.obter_estatisticas_usuario(UUID) IS 'Retorna estatísticas resumidas do usuário (SECURITY DEFINER com validação)';

-- ========================================
-- 5. RECRIAR TRIGGER PARA CRIAR PERFIL AUTOMATICAMENTE
-- ========================================

DROP TRIGGER IF EXISTS criar_perfil_automaticamente ON auth.users;

CREATE TRIGGER criar_perfil_automaticamente
  AFTER INSERT ON auth.users
  FOR EACH ROW
  EXECUTE FUNCTION public.criar_perfil_novo_usuario();

-- ========================================
-- 6. VERIFICAÇÃO FINAL
-- ========================================

DO $$
DECLARE
  view_count INTEGER;
  policy_count INTEGER;
BEGIN
  -- Contar views criadas
  SELECT COUNT(*) INTO view_count
  FROM information_schema.views
  WHERE table_schema = 'public'
    AND table_name IN ('produtos_estoque_baixo', 'lotes_vencendo', 'resumo_movimentacoes');
  
  -- Contar políticas RLS
  SELECT COUNT(*) INTO policy_count
  FROM pg_policies
  WHERE schemaname = 'public'
    AND tablename IN ('perfis', 'produtos', 'lotes', 'movimentacoes');
  
  RAISE NOTICE '╔════════════════════════════════════════╗';
  RAISE NOTICE '║  PROBLEMAS DE SEGURANÇA CORRIGIDOS!    ║';
  RAISE NOTICE '╚════════════════════════════════════════╝';
  RAISE NOTICE '';
  RAISE NOTICE '✅ Views recriadas sem SECURITY DEFINER: %', view_count;
  RAISE NOTICE '✅ Políticas RLS ativas: %', policy_count;
  RAISE NOTICE '';
  RAISE NOTICE '🔒 Funções mantidas com SECURITY DEFINER (necessário):';
  RAISE NOTICE '   - criar_perfil_novo_usuario()';
  RAISE NOTICE '   - criar_perfis_faltantes()';
  RAISE NOTICE '   - obter_estatisticas_usuario() [com validação]';
  RAISE NOTICE '';
  RAISE NOTICE '⚠️  IMPORTANTE:';
  RAISE NOTICE '   1. Recarregue a página do Supabase (F5)';
  RAISE NOTICE '   2. Vá em Security Advisor e clique em "Rerun linter"';
  RAISE NOTICE '   3. Os erros devem ter diminuído ou desaparecido';
  RAISE NOTICE '';
  RAISE NOTICE '🎉 Script executado com sucesso!';
END $$;

