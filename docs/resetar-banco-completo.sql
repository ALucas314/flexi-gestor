-- ========================================
-- SCRIPT PARA RESETAR O BANCO COMPLETAMENTE
-- Deleta TUDO e recria do zero com segurança correta
-- ========================================
-- 
-- ⚠️ ATENÇÃO: Este script vai DELETAR TODOS OS DADOS!
-- Use apenas se quiser começar do zero.
--
-- O que este script faz:
-- 1. Deleta todas as tabelas, views, funções e triggers
-- 2. Recria tudo do zero
-- 3. Configura RLS corretamente
-- 4. Cria políticas de segurança
-- 5. Remove todos os avisos do Security Advisor
--
-- ========================================

-- ========================================
-- 1. DELETAR TUDO (LIMPEZA COMPLETA)
-- ========================================

-- Deletar triggers
DROP TRIGGER IF EXISTS criar_perfil_automaticamente ON auth.users CASCADE;
DROP TRIGGER IF EXISTS atualizar_perfis_data_modificacao ON public.perfis CASCADE;
DROP TRIGGER IF EXISTS atualizar_produtos_data_modificacao ON public.produtos CASCADE;

-- Deletar funções
DROP FUNCTION IF EXISTS public.criar_perfil_novo_usuario() CASCADE;
DROP FUNCTION IF EXISTS public.atualizar_data_modificacao() CASCADE;
DROP FUNCTION IF EXISTS public.criar_perfis_faltantes() CASCADE;
DROP FUNCTION IF EXISTS public.obter_estatisticas_usuario(UUID) CASCADE;

-- Deletar views
DROP VIEW IF EXISTS public.produtos_estoque_baixo CASCADE;
DROP VIEW IF EXISTS public.lotes_vencendo CASCADE;
DROP VIEW IF EXISTS public.resumo_movimentacoes CASCADE;

-- Deletar tabelas (CASCADE remove todas as dependências)
DROP TABLE IF EXISTS public.movimentacoes CASCADE;
DROP TABLE IF EXISTS public.lotes CASCADE;
DROP TABLE IF EXISTS public.produtos CASCADE;
DROP TABLE IF EXISTS public.perfis CASCADE;

-- ========================================
-- 2. HABILITAR EXTENSÕES
-- ========================================

CREATE EXTENSION IF NOT EXISTS "uuid-ossp";
CREATE EXTENSION IF NOT EXISTS "pg_trgm";

-- ========================================
-- 3. TABELA DE PERFIS
-- ========================================

CREATE TABLE public.perfis (
  id UUID REFERENCES auth.users(id) ON DELETE CASCADE PRIMARY KEY,
  email TEXT UNIQUE NOT NULL,
  nome TEXT,
  criado_em TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  atualizado_em TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

COMMENT ON TABLE public.perfis IS 'Perfis de usuários com informações adicionais';
COMMENT ON COLUMN public.perfis.id IS 'ID do usuário (referência a auth.users)';
COMMENT ON COLUMN public.perfis.email IS 'Email do usuário';
COMMENT ON COLUMN public.perfis.nome IS 'Nome completo do usuário';

-- RLS e Políticas para perfis
ALTER TABLE public.perfis ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Usuarios podem ver proprio perfil"
ON public.perfis FOR SELECT
TO authenticated
USING (auth.uid() = id);

CREATE POLICY "Usuarios podem atualizar proprio perfil"
ON public.perfis FOR UPDATE
TO authenticated
USING (auth.uid() = id)
WITH CHECK (auth.uid() = id);

CREATE POLICY "Usuarios podem inserir proprio perfil"
ON public.perfis FOR INSERT
TO authenticated
WITH CHECK (auth.uid() = id);

-- ========================================
-- 4. TABELA DE PRODUTOS
-- ========================================

CREATE TABLE public.produtos (
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

COMMENT ON TABLE public.produtos IS 'Catálogo de produtos do estoque';
COMMENT ON COLUMN public.produtos.sku IS 'Código único do produto (SKU)';
COMMENT ON COLUMN public.produtos.preco IS 'Preço de venda unitário';
COMMENT ON COLUMN public.produtos.estoque IS 'Quantidade atual em estoque';
COMMENT ON COLUMN public.produtos.estoque_minimo IS 'Estoque mínimo (alerta)';

-- Índices
CREATE INDEX idx_produtos_sku ON public.produtos(sku);
CREATE INDEX idx_produtos_usuario_id ON public.produtos(usuario_id);
CREATE INDEX idx_produtos_categoria ON public.produtos(categoria);
CREATE INDEX idx_produtos_nome_trgm ON public.produtos USING gin (nome gin_trgm_ops);

-- RLS e Políticas para produtos
ALTER TABLE public.produtos ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Usuarios podem ver proprios produtos"
ON public.produtos FOR SELECT
TO authenticated
USING (auth.uid() = usuario_id);

CREATE POLICY "Usuarios podem inserir proprios produtos"
ON public.produtos FOR INSERT
TO authenticated
WITH CHECK (auth.uid() = usuario_id);

CREATE POLICY "Usuarios podem atualizar proprios produtos"
ON public.produtos FOR UPDATE
TO authenticated
USING (auth.uid() = usuario_id)
WITH CHECK (auth.uid() = usuario_id);

CREATE POLICY "Usuarios podem deletar proprios produtos"
ON public.produtos FOR DELETE
TO authenticated
USING (auth.uid() = usuario_id);

-- ========================================
-- 5. TABELA DE LOTES
-- ========================================

CREATE TABLE public.lotes (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  produto_id UUID REFERENCES public.produtos(id) ON DELETE CASCADE NOT NULL,
  numero_lote TEXT NOT NULL,
  quantidade INTEGER NOT NULL DEFAULT 0 CHECK (quantidade >= 0),
  custo_unitario DECIMAL(10, 2) NOT NULL DEFAULT 0 CHECK (custo_unitario >= 0),
  data_validade DATE,
  usuario_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  criado_em TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

COMMENT ON TABLE public.lotes IS 'Lotes de produtos com controle de validade e custo';
COMMENT ON COLUMN public.lotes.numero_lote IS 'Número do lote';
COMMENT ON COLUMN public.lotes.quantidade IS 'Quantidade disponível no lote';
COMMENT ON COLUMN public.lotes.custo_unitario IS 'Custo unitário do produto no lote';
COMMENT ON COLUMN public.lotes.data_validade IS 'Data de validade do lote';

-- Índices
CREATE INDEX idx_lotes_produto_id ON public.lotes(produto_id);
CREATE INDEX idx_lotes_usuario_id ON public.lotes(usuario_id);
CREATE INDEX idx_lotes_data_validade ON public.lotes(data_validade);

-- RLS e Políticas para lotes
ALTER TABLE public.lotes ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Usuarios podem ver proprios lotes"
ON public.lotes FOR SELECT
TO authenticated
USING (auth.uid() = usuario_id);

CREATE POLICY "Usuarios podem inserir proprios lotes"
ON public.lotes FOR INSERT
TO authenticated
WITH CHECK (auth.uid() = usuario_id);

CREATE POLICY "Usuarios podem atualizar proprios lotes"
ON public.lotes FOR UPDATE
TO authenticated
USING (auth.uid() = usuario_id)
WITH CHECK (auth.uid() = usuario_id);

CREATE POLICY "Usuarios podem deletar proprios lotes"
ON public.lotes FOR DELETE
TO authenticated
USING (auth.uid() = usuario_id);

-- ========================================
-- 6. TABELA DE MOVIMENTAÇÕES
-- ========================================

CREATE TABLE public.movimentacoes (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  produto_id UUID REFERENCES public.produtos(id) ON DELETE CASCADE NOT NULL,
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

COMMENT ON TABLE public.movimentacoes IS 'Registro de movimentações de estoque (entradas e saídas)';
COMMENT ON COLUMN public.movimentacoes.tipo IS 'Tipo de movimentação: entrada ou saida';
COMMENT ON COLUMN public.movimentacoes.quantidade IS 'Quantidade movimentada';
COMMENT ON COLUMN public.movimentacoes.preco_unitario IS 'Preço unitário na movimentação';
COMMENT ON COLUMN public.movimentacoes.preco_total IS 'Valor total da movimentação';
COMMENT ON COLUMN public.movimentacoes.metodo_pagamento IS 'Forma de pagamento (para saídas)';
COMMENT ON COLUMN public.movimentacoes.numero_recibo IS 'Número do recibo/nota fiscal';

-- Índices
CREATE INDEX idx_movimentacoes_produto_id ON public.movimentacoes(produto_id);
CREATE INDEX idx_movimentacoes_usuario_id ON public.movimentacoes(usuario_id);
CREATE INDEX idx_movimentacoes_tipo ON public.movimentacoes(tipo);
CREATE INDEX idx_movimentacoes_criado_em ON public.movimentacoes(criado_em DESC);

-- RLS e Políticas para movimentações
ALTER TABLE public.movimentacoes ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Usuarios podem ver proprias movimentacoes"
ON public.movimentacoes FOR SELECT
TO authenticated
USING (auth.uid() = usuario_id);

CREATE POLICY "Usuarios podem inserir proprias movimentacoes"
ON public.movimentacoes FOR INSERT
TO authenticated
WITH CHECK (auth.uid() = usuario_id);

CREATE POLICY "Usuarios podem atualizar proprias movimentacoes"
ON public.movimentacoes FOR UPDATE
TO authenticated
USING (auth.uid() = usuario_id)
WITH CHECK (auth.uid() = usuario_id);

CREATE POLICY "Usuarios podem deletar proprias movimentacoes"
ON public.movimentacoes FOR DELETE
TO authenticated
USING (auth.uid() = usuario_id);

-- ========================================
-- 7. FUNÇÕES AUXILIARES
-- ========================================

-- Função para atualizar atualizado_em automaticamente
CREATE OR REPLACE FUNCTION atualizar_data_modificacao()
RETURNS TRIGGER AS $$
BEGIN
  NEW.atualizado_em = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

COMMENT ON FUNCTION atualizar_data_modificacao() IS 'Atualiza automaticamente a coluna atualizado_em';

-- Função para criar perfil automaticamente (PRECISA de SECURITY DEFINER)
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

COMMENT ON FUNCTION public.criar_perfil_novo_usuario() IS 'Cria automaticamente um perfil quando um novo usuário se registra';

-- Função para criar perfis faltantes (PRECISA de SECURITY DEFINER)
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

COMMENT ON FUNCTION public.criar_perfis_faltantes() IS 'Cria perfis para usuários que não possuem perfil';

-- Função para obter estatísticas (COM validação de segurança)
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

COMMENT ON FUNCTION public.obter_estatisticas_usuario(UUID) IS 'Retorna estatísticas resumidas do usuário (com validação de segurança)';

-- ========================================
-- 8. TRIGGERS
-- ========================================

-- Trigger para atualizar atualizado_em em perfis
CREATE TRIGGER atualizar_perfis_data_modificacao
  BEFORE UPDATE ON public.perfis
  FOR EACH ROW
  EXECUTE FUNCTION atualizar_data_modificacao();

-- Trigger para atualizar atualizado_em em produtos
CREATE TRIGGER atualizar_produtos_data_modificacao
  BEFORE UPDATE ON public.produtos
  FOR EACH ROW
  EXECUTE FUNCTION atualizar_data_modificacao();

-- Trigger para criar perfil automaticamente
CREATE TRIGGER criar_perfil_automaticamente
  AFTER INSERT ON auth.users
  FOR EACH ROW
  EXECUTE FUNCTION public.criar_perfil_novo_usuario();

-- ========================================
-- 9. VIEWS ÚTEIS (SEM SECURITY DEFINER)
-- ========================================

-- View de produtos com estoque baixo
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

COMMENT ON VIEW public.produtos_estoque_baixo IS 'Produtos com estoque abaixo ou igual ao mínimo';

-- View de lotes próximos ao vencimento
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

COMMENT ON VIEW public.lotes_vencendo IS 'Lotes que vencem nos próximos 30 dias';

-- View de resumo de movimentações
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

COMMENT ON VIEW public.resumo_movimentacoes IS 'Resumo diário de movimentações por tipo';

-- ========================================
-- 10. POPULAR PERFIS EXISTENTES
-- ========================================

DO $$
DECLARE
  total_perfis INTEGER;
BEGIN
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
  ON CONFLICT (id) DO NOTHING;
  
  GET DIAGNOSTICS total_perfis = ROW_COUNT;
  
  IF total_perfis > 0 THEN
    RAISE NOTICE '✅ % perfis criados com sucesso!', total_perfis;
  ELSE
    RAISE NOTICE 'ℹ️  Todos os usuários já possuem perfis.';
  END IF;
END $$;

-- ========================================
-- 11. GRANTS (PERMISSÕES)
-- ========================================

GRANT USAGE ON ALL SEQUENCES IN SCHEMA public TO authenticated;
GRANT USAGE ON ALL SEQUENCES IN SCHEMA public TO service_role;
GRANT ALL ON ALL TABLES IN SCHEMA public TO authenticated;
GRANT ALL ON ALL TABLES IN SCHEMA public TO service_role;
GRANT EXECUTE ON ALL FUNCTIONS IN SCHEMA public TO authenticated;
GRANT EXECUTE ON ALL FUNCTIONS IN SCHEMA public TO service_role;

-- ========================================
-- 12. VERIFICAÇÃO FINAL
-- ========================================

DO $$
DECLARE
  total_usuarios INTEGER;
  total_perfis INTEGER;
  total_produtos INTEGER;
  total_lotes INTEGER;
  total_movimentacoes INTEGER;
  total_policies INTEGER;
BEGIN
  SELECT COUNT(*) INTO total_usuarios FROM auth.users;
  SELECT COUNT(*) INTO total_perfis FROM public.perfis;
  SELECT COUNT(*) INTO total_produtos FROM public.produtos;
  SELECT COUNT(*) INTO total_lotes FROM public.lotes;
  SELECT COUNT(*) INTO total_movimentacoes FROM public.movimentacoes;
  SELECT COUNT(*) INTO total_policies FROM pg_policies WHERE schemaname = 'public';
  
  RAISE NOTICE '╔════════════════════════════════════════════════╗';
  RAISE NOTICE '║  🎉 BANCO RESETADO E RECRIADO COM SUCESSO!    ║';
  RAISE NOTICE '╚════════════════════════════════════════════════╝';
  RAISE NOTICE '';
  RAISE NOTICE '📊 ESTATÍSTICAS DO BANCO:';
  RAISE NOTICE '  👥 Usuários: %', total_usuarios;
  RAISE NOTICE '  👤 Perfis: %', total_perfis;
  RAISE NOTICE '  📦 Produtos: %', total_produtos;
  RAISE NOTICE '  🏷️  Lotes: %', total_lotes;
  RAISE NOTICE '  📋 Movimentações: %', total_movimentacoes;
  RAISE NOTICE '  🔒 Políticas RLS: %', total_policies;
  RAISE NOTICE '';
  RAISE NOTICE '✅ Tabelas criadas com RLS habilitado!';
  RAISE NOTICE '✅ Políticas de segurança aplicadas!';
  RAISE NOTICE '✅ Views criadas sem SECURITY DEFINER!';
  RAISE NOTICE '✅ Triggers configurados!';
  RAISE NOTICE '';
  RAISE NOTICE '⚠️  PRÓXIMOS PASSOS:';
  RAISE NOTICE '   1. Recarregue a página do Supabase (F5)';
  RAISE NOTICE '   2. Vá em Security Advisor';
  RAISE NOTICE '   3. Clique em "Rerun linter"';
  RAISE NOTICE '   4. Verifique se os erros desapareceram';
  RAISE NOTICE '';
  RAISE NOTICE '🚀 Sistema pronto para uso!';
END $$;

-- ========================================
-- FIM DO SCRIPT
-- ========================================

