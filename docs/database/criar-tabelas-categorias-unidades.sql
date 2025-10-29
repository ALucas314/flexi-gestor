-- ========================================
-- FLEXI GESTOR - TABELAS DE CATEGORIAS E UNIDADES DE MEDIDA
-- Supabase PostgreSQL
-- ========================================
-- 
-- Este script cria as tabelas para armazenar categorias e unidades de medida
-- personalizadas por usuário no banco de dados.
--

-- ========================================
-- TABELA DE CATEGORIAS
-- ========================================
CREATE TABLE IF NOT EXISTS public.categorias (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  nome TEXT NOT NULL,
  usuario_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  workspace_id UUID, -- Para suporte a workspaces
  criado_em TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  atualizado_em TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  CONSTRAINT nome_unico_por_usuario UNIQUE (nome, usuario_id)
);

-- Comentários
COMMENT ON TABLE public.categorias IS 'Categorias de produtos personalizadas por usuário';
COMMENT ON COLUMN public.categorias.nome IS 'Nome da categoria';
COMMENT ON COLUMN public.categorias.usuario_id IS 'Usuário proprietário da categoria';
COMMENT ON COLUMN public.categorias.workspace_id IS 'Workspace associado (para compartilhamento futuro)';

-- Índices
CREATE INDEX IF NOT EXISTS idx_categorias_usuario_id ON public.categorias(usuario_id);
CREATE INDEX IF NOT EXISTS idx_categorias_workspace_id ON public.categorias(workspace_id);
CREATE INDEX IF NOT EXISTS idx_categorias_nome ON public.categorias(nome);

-- RLS
ALTER TABLE public.categorias ENABLE ROW LEVEL SECURITY;

-- Políticas de acesso
DROP POLICY IF EXISTS "Usuarios podem ver proprias categorias" ON public.categorias;
CREATE POLICY "Usuarios podem ver proprias categorias" ON public.categorias
  FOR SELECT USING (auth.uid() = usuario_id);

DROP POLICY IF EXISTS "Usuarios podem inserir proprias categorias" ON public.categorias;
CREATE POLICY "Usuarios podem inserir proprias categorias" ON public.categorias
  FOR INSERT WITH CHECK (auth.uid() = usuario_id);

DROP POLICY IF EXISTS "Usuarios podem atualizar proprias categorias" ON public.categorias;
CREATE POLICY "Usuarios podem atualizar proprias categorias" ON public.categorias
  FOR UPDATE USING (auth.uid() = usuario_id);

DROP POLICY IF EXISTS "Usuarios podem deletar proprias categorias" ON public.categorias;
CREATE POLICY "Usuarios podem deletar proprias categorias" ON public.categorias
  FOR DELETE USING (auth.uid() = usuario_id);

-- ========================================
-- TABELA DE UNIDADES DE MEDIDA
-- ========================================
CREATE TABLE IF NOT EXISTS public.unidades_medida (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  nome TEXT NOT NULL,
  sigla TEXT NOT NULL,
  usuario_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  workspace_id UUID, -- Para suporte a workspaces
  criado_em TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  atualizado_em TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  CONSTRAINT sigla_unica_por_usuario UNIQUE (sigla, usuario_id)
);

-- Comentários
COMMENT ON TABLE public.unidades_medida IS 'Unidades de medida personalizadas por usuário';
COMMENT ON COLUMN public.unidades_medida.nome IS 'Nome completo da unidade';
COMMENT ON COLUMN public.unidades_medida.sigla IS 'Sigla da unidade (ex: KG, L, UN)';
COMMENT ON COLUMN public.unidades_medida.usuario_id IS 'Usuário proprietário da unidade';
COMMENT ON COLUMN public.unidades_medida.workspace_id IS 'Workspace associado (para compartilhamento futuro)';

-- Índices
CREATE INDEX IF NOT EXISTS idx_unidades_usuario_id ON public.unidades_medida(usuario_id);
CREATE INDEX IF NOT EXISTS idx_unidades_workspace_id ON public.unidades_medida(workspace_id);
CREATE INDEX IF NOT EXISTS idx_unidades_sigla ON public.unidades_medida(sigla);

-- RLS
ALTER TABLE public.unidades_medida ENABLE ROW LEVEL SECURITY;

-- Políticas de acesso
DROP POLICY IF EXISTS "Usuarios podem ver proprias unidades" ON public.unidades_medida;
CREATE POLICY "Usuarios podem ver proprias unidades" ON public.unidades_medida
  FOR SELECT USING (auth.uid() = usuario_id);

DROP POLICY IF EXISTS "Usuarios podem inserir proprias unidades" ON public.unidades_medida;
CREATE POLICY "Usuarios podem inserir proprias unidades" ON public.unidades_medida
  FOR INSERT WITH CHECK (auth.uid() = usuario_id);

DROP POLICY IF EXISTS "Usuarios podem atualizar proprias unidades" ON public.unidades_medida;
CREATE POLICY "Usuarios podem atualizar proprias unidades" ON public.unidades_medida
  FOR UPDATE USING (auth.uid() = usuario_id);

DROP POLICY IF EXISTS "Usuarios podem deletar proprias unidades" ON public.unidades_medida;
CREATE POLICY "Usuarios podem deletar proprias unidades" ON public.unidades_medida
  FOR DELETE USING (auth.uid() = usuario_id);

-- ========================================
-- TRIGGER PARA ATUALIZAR atualizado_em
-- ========================================
-- Trigger para categorias
DROP TRIGGER IF EXISTS atualizar_categorias_data_modificacao ON public.categorias;
CREATE TRIGGER atualizar_categorias_data_modificacao
  BEFORE UPDATE ON public.categorias
  FOR EACH ROW
  EXECUTE FUNCTION atualizar_data_modificacao();

-- Trigger para unidades
DROP TRIGGER IF EXISTS atualizar_unidades_data_modificacao ON public.unidades_medida;
CREATE TRIGGER atualizar_unidades_data_modificacao
  BEFORE UPDATE ON public.unidades_medida
  FOR EACH ROW
  EXECUTE FUNCTION atualizar_data_modificacao();

-- ========================================
-- GRANTS (PERMISSÕES)
-- ========================================
GRANT ALL ON public.categorias TO authenticated;
GRANT ALL ON public.unidades_medida TO authenticated;

-- ========================================
-- VERIFICAÇÃO
-- ========================================
DO $$
BEGIN
  RAISE NOTICE '✅ Tabelas de categorias e unidades criadas com sucesso!';
  RAISE NOTICE '  📁 Tabela: public.categorias';
  RAISE NOTICE '  📏 Tabela: public.unidades_medida';
END $$;

