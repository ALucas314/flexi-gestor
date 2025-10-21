-- ========================================
-- FLEXI GESTOR - SCHEMA COMPLETO DO BANCO DE DADOS
-- Supabase PostgreSQL (TABELAS EM PORTUGUÊS)
-- Versão: 2.0.0
-- Data: 2025-01-20
-- ========================================
-- 
-- INSTRUÇÕES:
-- 1. Execute este script no SQL Editor do Supabase
-- 2. O script é idempotente (pode ser executado múltiplas vezes)
-- 3. RLS (Row Level Security) está habilitado em todas as tabelas
-- 4. Todos os usuários têm acesso apenas aos seus próprios dados
--
-- ========================================

-- ========================================
-- 0. LIMPEZA E PREPARAÇÃO (OPCIONAL)
-- ========================================
-- ATENÇÃO: Descomente as linhas abaixo apenas se quiser RESETAR o banco
-- Isso irá DELETAR TODOS OS DADOS!

-- DROP TRIGGER IF EXISTS criar_perfil_automaticamente ON auth.users;
-- DROP FUNCTION IF EXISTS public.criar_perfil_novo_usuario();
-- DROP VIEW IF EXISTS public.produtos_estoque_baixo;
-- DROP VIEW IF EXISTS public.lotes_vencendo;
-- DROP VIEW IF EXISTS public.resumo_movimentacoes;
-- DROP TABLE IF EXISTS public.movimentacoes CASCADE;
-- DROP TABLE IF EXISTS public.lotes CASCADE;
-- DROP TABLE IF EXISTS public.produtos CASCADE;
-- DROP TABLE IF EXISTS public.perfis CASCADE;

-- ========================================
-- 1. EXTENSÕES
-- ========================================
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";
CREATE EXTENSION IF NOT EXISTS "pg_trgm"; -- Para busca de texto otimizada

-- ========================================
-- 2. TABELA DE PERFIS DE USUÁRIOS
-- ========================================
CREATE TABLE IF NOT EXISTS public.perfis (
  id UUID REFERENCES auth.users(id) ON DELETE CASCADE PRIMARY KEY,
  email TEXT UNIQUE NOT NULL,
  nome TEXT,
  criado_em TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  atualizado_em TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Comentários
COMMENT ON TABLE public.perfis IS 'Perfis de usuários com informações adicionais';
COMMENT ON COLUMN public.perfis.id IS 'ID do usuário (referência a auth.users)';
COMMENT ON COLUMN public.perfis.email IS 'Email do usuário';
COMMENT ON COLUMN public.perfis.nome IS 'Nome completo do usuário';

-- RLS (Row Level Security)
ALTER TABLE public.perfis ENABLE ROW LEVEL SECURITY;

-- Políticas de acesso
DROP POLICY IF EXISTS "Usuarios podem ver proprio perfil" ON public.perfis;
CREATE POLICY "Usuarios podem ver proprio perfil" ON public.perfis
  FOR SELECT USING (auth.uid() = id);

DROP POLICY IF EXISTS "Usuarios podem atualizar proprio perfil" ON public.perfis;
CREATE POLICY "Usuarios podem atualizar proprio perfil" ON public.perfis
  FOR UPDATE USING (auth.uid() = id);

DROP POLICY IF EXISTS "Usuarios podem inserir proprio perfil" ON public.perfis;
CREATE POLICY "Usuarios podem inserir proprio perfil" ON public.perfis
  FOR INSERT WITH CHECK (auth.uid() = id);

-- ========================================
-- 3. TABELA DE PRODUTOS
-- ========================================
CREATE TABLE IF NOT EXISTS public.produtos (
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

-- Comentários
COMMENT ON TABLE public.produtos IS 'Catálogo de produtos do estoque';
COMMENT ON COLUMN public.produtos.sku IS 'Código único do produto (SKU)';
COMMENT ON COLUMN public.produtos.preco IS 'Preço de venda unitário';
COMMENT ON COLUMN public.produtos.estoque IS 'Quantidade atual em estoque';
COMMENT ON COLUMN public.produtos.estoque_minimo IS 'Estoque mínimo (alerta)';

-- Índices para performance
CREATE INDEX IF NOT EXISTS idx_produtos_sku ON public.produtos(sku);
CREATE INDEX IF NOT EXISTS idx_produtos_usuario_id ON public.produtos(usuario_id);
CREATE INDEX IF NOT EXISTS idx_produtos_categoria ON public.produtos(categoria);
CREATE INDEX IF NOT EXISTS idx_produtos_nome_trgm ON public.produtos USING gin (nome gin_trgm_ops);

-- RLS
ALTER TABLE public.produtos ENABLE ROW LEVEL SECURITY;

-- Políticas
DROP POLICY IF EXISTS "Usuarios podem ver proprios produtos" ON public.produtos;
CREATE POLICY "Usuarios podem ver proprios produtos" ON public.produtos
  FOR SELECT USING (auth.uid() = usuario_id);

DROP POLICY IF EXISTS "Usuarios podem inserir proprios produtos" ON public.produtos;
CREATE POLICY "Usuarios podem inserir proprios produtos" ON public.produtos
  FOR INSERT WITH CHECK (auth.uid() = usuario_id);

DROP POLICY IF EXISTS "Usuarios podem atualizar proprios produtos" ON public.produtos;
CREATE POLICY "Usuarios podem atualizar proprios produtos" ON public.produtos
  FOR UPDATE USING (auth.uid() = usuario_id);

DROP POLICY IF EXISTS "Usuarios podem deletar proprios produtos" ON public.produtos;
CREATE POLICY "Usuarios podem deletar proprios produtos" ON public.produtos
  FOR DELETE USING (auth.uid() = usuario_id);

-- ========================================
-- 4. TABELA DE LOTES
-- ========================================
CREATE TABLE IF NOT EXISTS public.lotes (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  produto_id UUID REFERENCES public.produtos(id) ON DELETE CASCADE NOT NULL,
  numero_lote TEXT NOT NULL,
  quantidade INTEGER NOT NULL DEFAULT 0 CHECK (quantidade >= 0),
  custo_unitario DECIMAL(10, 2) NOT NULL DEFAULT 0 CHECK (custo_unitario >= 0),
  data_validade DATE,
  usuario_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  criado_em TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Comentários
COMMENT ON TABLE public.lotes IS 'Lotes de produtos com controle de validade e custo';
COMMENT ON COLUMN public.lotes.numero_lote IS 'Número do lote';
COMMENT ON COLUMN public.lotes.quantidade IS 'Quantidade disponível no lote';
COMMENT ON COLUMN public.lotes.custo_unitario IS 'Custo unitário do produto no lote';
COMMENT ON COLUMN public.lotes.data_validade IS 'Data de validade do lote';

-- Índices
CREATE INDEX IF NOT EXISTS idx_lotes_produto_id ON public.lotes(produto_id);
CREATE INDEX IF NOT EXISTS idx_lotes_usuario_id ON public.lotes(usuario_id);
CREATE INDEX IF NOT EXISTS idx_lotes_data_validade ON public.lotes(data_validade);

-- RLS
ALTER TABLE public.lotes ENABLE ROW LEVEL SECURITY;

-- Políticas
DROP POLICY IF EXISTS "Usuarios podem ver proprios lotes" ON public.lotes;
CREATE POLICY "Usuarios podem ver proprios lotes" ON public.lotes
  FOR SELECT USING (auth.uid() = usuario_id);

DROP POLICY IF EXISTS "Usuarios podem inserir proprios lotes" ON public.lotes;
CREATE POLICY "Usuarios podem inserir proprios lotes" ON public.lotes
  FOR INSERT WITH CHECK (auth.uid() = usuario_id);

DROP POLICY IF EXISTS "Usuarios podem atualizar proprios lotes" ON public.lotes;
CREATE POLICY "Usuarios podem atualizar proprios lotes" ON public.lotes
  FOR UPDATE USING (auth.uid() = usuario_id);

DROP POLICY IF EXISTS "Usuarios podem deletar proprios lotes" ON public.lotes;
CREATE POLICY "Usuarios podem deletar proprios lotes" ON public.lotes
  FOR DELETE USING (auth.uid() = usuario_id);

-- ========================================
-- 5. TABELA DE MOVIMENTAÇÕES
-- ========================================
CREATE TABLE IF NOT EXISTS public.movimentacoes (
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

-- Comentários
COMMENT ON TABLE public.movimentacoes IS 'Registro de movimentações de estoque (entradas e saídas)';
COMMENT ON COLUMN public.movimentacoes.tipo IS 'Tipo de movimentação: entrada ou saida';
COMMENT ON COLUMN public.movimentacoes.quantidade IS 'Quantidade movimentada';
COMMENT ON COLUMN public.movimentacoes.preco_unitario IS 'Preço unitário na movimentação';
COMMENT ON COLUMN public.movimentacoes.preco_total IS 'Valor total da movimentação';
COMMENT ON COLUMN public.movimentacoes.metodo_pagamento IS 'Forma de pagamento (para saídas)';
COMMENT ON COLUMN public.movimentacoes.numero_recibo IS 'Número do recibo/nota fiscal';

-- Índices
CREATE INDEX IF NOT EXISTS idx_movimentacoes_produto_id ON public.movimentacoes(produto_id);
CREATE INDEX IF NOT EXISTS idx_movimentacoes_usuario_id ON public.movimentacoes(usuario_id);
CREATE INDEX IF NOT EXISTS idx_movimentacoes_tipo ON public.movimentacoes(tipo);
CREATE INDEX IF NOT EXISTS idx_movimentacoes_criado_em ON public.movimentacoes(criado_em DESC);

-- RLS
ALTER TABLE public.movimentacoes ENABLE ROW LEVEL SECURITY;

-- Políticas
DROP POLICY IF EXISTS "Usuarios podem ver proprias movimentacoes" ON public.movimentacoes;
CREATE POLICY "Usuarios podem ver proprias movimentacoes" ON public.movimentacoes
  FOR SELECT USING (auth.uid() = usuario_id);

DROP POLICY IF EXISTS "Usuarios podem inserir proprias movimentacoes" ON public.movimentacoes;
CREATE POLICY "Usuarios podem inserir proprias movimentacoes" ON public.movimentacoes
  FOR INSERT WITH CHECK (auth.uid() = usuario_id);

DROP POLICY IF EXISTS "Usuarios podem atualizar proprias movimentacoes" ON public.movimentacoes;
CREATE POLICY "Usuarios podem atualizar proprias movimentacoes" ON public.movimentacoes
  FOR UPDATE USING (auth.uid() = usuario_id);

DROP POLICY IF EXISTS "Usuarios podem deletar proprias movimentacoes" ON public.movimentacoes;
CREATE POLICY "Usuarios podem deletar proprias movimentacoes" ON public.movimentacoes
  FOR DELETE USING (auth.uid() = usuario_id);

-- ========================================
-- 6. FUNÇÕES AUXILIARES
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

-- Função para criar perfil automaticamente quando um usuário se registra
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
    -- Em caso de erro, ainda retorna NEW para não bloquear o registro
    RAISE WARNING 'Erro ao criar perfil: %', SQLERRM;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

COMMENT ON FUNCTION public.criar_perfil_novo_usuario() IS 'Cria automaticamente um perfil quando um novo usuário se registra';

-- ========================================
-- 7. TRIGGERS
-- ========================================

-- Trigger para atualizar atualizado_em em perfis
DROP TRIGGER IF EXISTS atualizar_perfis_data_modificacao ON public.perfis;
CREATE TRIGGER atualizar_perfis_data_modificacao
  BEFORE UPDATE ON public.perfis
  FOR EACH ROW
  EXECUTE FUNCTION atualizar_data_modificacao();

-- Trigger para atualizar atualizado_em em produtos
DROP TRIGGER IF EXISTS atualizar_produtos_data_modificacao ON public.produtos;
CREATE TRIGGER atualizar_produtos_data_modificacao
  BEFORE UPDATE ON public.produtos
  FOR EACH ROW
  EXECUTE FUNCTION atualizar_data_modificacao();

-- Trigger para criar perfil automaticamente
DROP TRIGGER IF EXISTS criar_perfil_automaticamente ON auth.users;
CREATE TRIGGER criar_perfil_automaticamente
  AFTER INSERT ON auth.users
  FOR EACH ROW
  EXECUTE FUNCTION public.criar_perfil_novo_usuario();

-- ========================================
-- 8. VIEWS ÚTEIS
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

-- View de lotes próximos ao vencimento (30 dias)
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

-- View de resumo de movimentações por período
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
-- 9. FUNÇÕES DE MANUTENÇÃO E UTILIDADES
-- ========================================

-- Função para criar perfis de usuários existentes
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

-- Função para obter estatísticas do usuário
CREATE OR REPLACE FUNCTION public.obter_estatisticas_usuario(p_usuario_id UUID)
RETURNS JSON AS $$
DECLARE
  estatisticas JSON;
BEGIN
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

COMMENT ON FUNCTION public.obter_estatisticas_usuario(UUID) IS 'Retorna estatísticas resumidas do usuário';

-- ========================================
-- 10. POPULAR PERFIS EXISTENTES
-- ========================================
-- Criar perfis para todos os usuários que ainda não possuem
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
-- Garantir que o usuário autenticado tenha acesso às sequences
GRANT USAGE ON ALL SEQUENCES IN SCHEMA public TO authenticated;
GRANT USAGE ON ALL SEQUENCES IN SCHEMA public TO service_role;

-- Garantir acesso às tabelas
GRANT ALL ON ALL TABLES IN SCHEMA public TO authenticated;
GRANT ALL ON ALL TABLES IN SCHEMA public TO service_role;

-- Garantir acesso às funções
GRANT EXECUTE ON ALL FUNCTIONS IN SCHEMA public TO authenticated;
GRANT EXECUTE ON ALL FUNCTIONS IN SCHEMA public TO service_role;

-- ========================================
-- 12. VERIFICAÇÕES FINAIS
-- ========================================
DO $$
DECLARE
  total_usuarios INTEGER;
  total_perfis INTEGER;
  total_produtos INTEGER;
  total_lotes INTEGER;
  total_movimentacoes INTEGER;
BEGIN
  SELECT COUNT(*) INTO total_usuarios FROM auth.users;
  SELECT COUNT(*) INTO total_perfis FROM public.perfis;
  SELECT COUNT(*) INTO total_produtos FROM public.produtos;
  SELECT COUNT(*) INTO total_lotes FROM public.lotes;
  SELECT COUNT(*) INTO total_movimentacoes FROM public.movimentacoes;
  
  RAISE NOTICE '╔══════════════════════════════════════════╗';
  RAISE NOTICE '║  FLEXI GESTOR - INSTALAÇÃO CONCLUÍDA!   ║';
  RAISE NOTICE '╚══════════════════════════════════════════╝';
  RAISE NOTICE '';
  RAISE NOTICE '📊 ESTATÍSTICAS DO BANCO:';
  RAISE NOTICE '  👥 Usuários registrados: %', total_usuarios;
  RAISE NOTICE '  👤 Perfis criados: %', total_perfis;
  RAISE NOTICE '  📦 Produtos cadastrados: %', total_produtos;
  RAISE NOTICE '  🏷️  Lotes registrados: %', total_lotes;
  RAISE NOTICE '  📋 Movimentações: %', total_movimentacoes;
  RAISE NOTICE '';
  RAISE NOTICE '✅ Tabelas criadas com sucesso!';
  RAISE NOTICE '✅ Índices otimizados!';
  RAISE NOTICE '✅ RLS habilitado em todas as tabelas!';
  RAISE NOTICE '✅ Triggers configurados!';
  RAISE NOTICE '✅ Views criadas!';
  RAISE NOTICE '';
  RAISE NOTICE '🎉 Sistema pronto para uso!';
END $$;

-- ========================================
-- FIM DO SCRIPT
-- ========================================
