-- ========================================
-- FLEXI GESTOR - SCHEMA FINANCEIRO
-- Tabelas para Contas a Pagar e Contas a Receber
-- Versão: 1.1.0
-- Data: 2025-01-20
-- ========================================
-- 
-- INSTRUÇÕES:
-- 1. Execute este script no SQL Editor do Supabase
-- 2. O script é idempotente (pode ser executado múltiplas vezes)
-- 3. RLS (Row Level Security) está habilitado em todas as tabelas
-- 4. Triggers automáticos para atualização de saldos
--
-- ========================================

-- ========================================
-- 0. TABELAS DE FORNECEDORES E CLIENTES
-- ========================================

-- Tabela de Fornecedores
CREATE TABLE IF NOT EXISTS public.fornecedores (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  nome TEXT NOT NULL,
  nome_fantasia TEXT,
  cnpj TEXT,
  cpf TEXT,
  email TEXT,
  telefone TEXT,
  celular TEXT,
  rua TEXT,
  numero TEXT,
  complemento TEXT,
  bairro TEXT,
  cidade TEXT,
  estado TEXT,
  cep TEXT,
  observacoes TEXT,
  ativo BOOLEAN NOT NULL DEFAULT true,
  workspace_id UUID NOT NULL,
  usuario_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  criado_em TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  atualizado_em TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Comentários
COMMENT ON TABLE public.fornecedores IS 'Cadastro completo de fornecedores';
COMMENT ON COLUMN public.fornecedores.nome IS 'Nome ou razão social do fornecedor';
COMMENT ON COLUMN public.fornecedores.nome_fantasia IS 'Nome fantasia (se aplicável)';
COMMENT ON COLUMN public.fornecedores.cnpj IS 'CNPJ do fornecedor';
COMMENT ON COLUMN public.fornecedores.cpf IS 'CPF do fornecedor (se pessoa física)';

-- Índices
CREATE INDEX IF NOT EXISTS idx_fornecedores_usuario_id ON public.fornecedores(usuario_id);
CREATE INDEX IF NOT EXISTS idx_fornecedores_workspace_id ON public.fornecedores(workspace_id);
CREATE INDEX IF NOT EXISTS idx_fornecedores_nome ON public.fornecedores(nome);
CREATE INDEX IF NOT EXISTS idx_fornecedores_cnpj ON public.fornecedores(cnpj);
CREATE INDEX IF NOT EXISTS idx_fornecedores_ativo ON public.fornecedores(ativo);

-- RLS
ALTER TABLE public.fornecedores ENABLE ROW LEVEL SECURITY;

-- Políticas
DROP POLICY IF EXISTS "Usuarios podem ver proprios fornecedores" ON public.fornecedores;
CREATE POLICY "Usuarios podem ver proprios fornecedores" ON public.fornecedores
  FOR SELECT USING (auth.uid() = usuario_id);

DROP POLICY IF EXISTS "Usuarios podem inserir proprios fornecedores" ON public.fornecedores;
CREATE POLICY "Usuarios podem inserir proprios fornecedores" ON public.fornecedores
  FOR INSERT WITH CHECK (auth.uid() = usuario_id);

DROP POLICY IF EXISTS "Usuarios podem atualizar proprios fornecedores" ON public.fornecedores;
CREATE POLICY "Usuarios podem atualizar proprios fornecedores" ON public.fornecedores
  FOR UPDATE USING (auth.uid() = usuario_id);

DROP POLICY IF EXISTS "Usuarios podem deletar proprios fornecedores" ON public.fornecedores;
CREATE POLICY "Usuarios podem deletar proprios fornecedores" ON public.fornecedores
  FOR DELETE USING (auth.uid() = usuario_id);

-- Tabela de Clientes
CREATE TABLE IF NOT EXISTS public.clientes (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  nome TEXT NOT NULL,
  nome_fantasia TEXT,
  cnpj TEXT,
  cpf TEXT,
  email TEXT,
  telefone TEXT,
  celular TEXT,
  rua TEXT,
  numero TEXT,
  complemento TEXT,
  bairro TEXT,
  cidade TEXT,
  estado TEXT,
  cep TEXT,
  observacoes TEXT,
  ativo BOOLEAN NOT NULL DEFAULT true,
  workspace_id UUID NOT NULL,
  usuario_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  criado_em TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  atualizado_em TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Comentários
COMMENT ON TABLE public.clientes IS 'Cadastro completo de clientes';
COMMENT ON COLUMN public.clientes.nome IS 'Nome ou razão social do cliente';
COMMENT ON COLUMN public.clientes.nome_fantasia IS 'Nome fantasia (se aplicável)';
COMMENT ON COLUMN public.clientes.cnpj IS 'CNPJ do cliente';
COMMENT ON COLUMN public.clientes.cpf IS 'CPF do cliente (se pessoa física)';

-- Índices
CREATE INDEX IF NOT EXISTS idx_clientes_usuario_id ON public.clientes(usuario_id);
CREATE INDEX IF NOT EXISTS idx_clientes_workspace_id ON public.clientes(workspace_id);
CREATE INDEX IF NOT EXISTS idx_clientes_nome ON public.clientes(nome);
CREATE INDEX IF NOT EXISTS idx_clientes_cnpj ON public.clientes(cnpj);
CREATE INDEX IF NOT EXISTS idx_clientes_ativo ON public.clientes(ativo);

-- RLS
ALTER TABLE public.clientes ENABLE ROW LEVEL SECURITY;

-- Políticas
DROP POLICY IF EXISTS "Usuarios podem ver proprios clientes" ON public.clientes;
CREATE POLICY "Usuarios podem ver proprios clientes" ON public.clientes
  FOR SELECT USING (auth.uid() = usuario_id);

DROP POLICY IF EXISTS "Usuarios podem inserir proprios clientes" ON public.clientes;
CREATE POLICY "Usuarios podem inserir proprios clientes" ON public.clientes
  FOR INSERT WITH CHECK (auth.uid() = usuario_id);

DROP POLICY IF EXISTS "Usuarios podem atualizar proprios clientes" ON public.clientes;
CREATE POLICY "Usuarios podem atualizar proprios clientes" ON public.clientes
  FOR UPDATE USING (auth.uid() = usuario_id);

DROP POLICY IF EXISTS "Usuarios podem deletar proprios clientes" ON public.clientes;
CREATE POLICY "Usuarios podem deletar proprios clientes" ON public.clientes
  FOR DELETE USING (auth.uid() = usuario_id);

-- ========================================
-- 1. TABELA DE CONTAS A PAGAR
-- ========================================
CREATE TABLE IF NOT EXISTS public.contas_a_pagar (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  lancamento DATE NOT NULL DEFAULT CURRENT_DATE,
  observacoes TEXT,
  forma_pagamento TEXT NOT NULL CHECK (forma_pagamento IN ('dinheiro', 'cartao', 'pix', 'boleto', 'transferencia', 'parcelado', 'cheque')),
  conta_origem TEXT NOT NULL CHECK (conta_origem IN ('caixa', 'banco')),
  centro_custo TEXT,
  fornecedor_id UUID REFERENCES public.fornecedores(id) ON DELETE SET NULL,
  fornecedor TEXT, -- Campo legado para compatibilidade (será preenchido automaticamente)
  valor_total DECIMAL(10, 2) NOT NULL CHECK (valor_total > 0),
  valor_pago DECIMAL(10, 2) NOT NULL DEFAULT 0 CHECK (valor_pago >= 0),
  valor_restante DECIMAL(10, 2) NOT NULL CHECK (valor_restante >= 0),
  parcelas INTEGER NOT NULL DEFAULT 1 CHECK (parcelas > 0),
  parcelas_pagas INTEGER NOT NULL DEFAULT 0 CHECK (parcelas_pagas >= 0),
  data_vencimento DATE NOT NULL,
  data_pagamento DATE,
  status_pagamento TEXT NOT NULL DEFAULT 'pendente' CHECK (status_pagamento IN ('pendente', 'parcial', 'pago')),
  workspace_id UUID NOT NULL,
  usuario_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  criado_em TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  atualizado_em TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  CONSTRAINT valor_restante_valido CHECK (valor_restante = valor_total - valor_pago),
  CONSTRAINT parcelas_pagas_valido CHECK (parcelas_pagas <= parcelas)
);

-- Comentários
COMMENT ON TABLE public.contas_a_pagar IS 'Registro de contas a pagar (despesas e aquisições)';
COMMENT ON COLUMN public.contas_a_pagar.lancamento IS 'Data do lançamento da conta';
COMMENT ON COLUMN public.contas_a_pagar.conta_origem IS 'Origem do pagamento: caixa ou banco';
COMMENT ON COLUMN public.contas_a_pagar.centro_custo IS 'Categoria do produto ou despesa';
COMMENT ON COLUMN public.contas_a_pagar.valor_pago IS 'Valor já pago (soma de pagamentos parciais)';
COMMENT ON COLUMN public.contas_a_pagar.valor_restante IS 'Valor ainda pendente';
COMMENT ON COLUMN public.contas_a_pagar.parcelas_pagas IS 'Número de parcelas já pagas';
COMMENT ON COLUMN public.contas_a_pagar.status_pagamento IS 'Status: pendente, parcial ou pago';

-- Índices
CREATE INDEX IF NOT EXISTS idx_contas_a_pagar_usuario_id ON public.contas_a_pagar(usuario_id);
CREATE INDEX IF NOT EXISTS idx_contas_a_pagar_workspace_id ON public.contas_a_pagar(workspace_id);
CREATE INDEX IF NOT EXISTS idx_contas_a_pagar_status ON public.contas_a_pagar(status_pagamento);
CREATE INDEX IF NOT EXISTS idx_contas_a_pagar_data_vencimento ON public.contas_a_pagar(data_vencimento);
CREATE INDEX IF NOT EXISTS idx_contas_a_pagar_data_pagamento ON public.contas_a_pagar(data_pagamento);
CREATE INDEX IF NOT EXISTS idx_contas_a_pagar_fornecedor_id ON public.contas_a_pagar(fornecedor_id);
CREATE INDEX IF NOT EXISTS idx_contas_a_pagar_fornecedor ON public.contas_a_pagar(fornecedor);

-- RLS
ALTER TABLE public.contas_a_pagar ENABLE ROW LEVEL SECURITY;

-- Políticas
DROP POLICY IF EXISTS "Usuarios podem ver proprias contas a pagar" ON public.contas_a_pagar;
CREATE POLICY "Usuarios podem ver proprias contas a pagar" ON public.contas_a_pagar
  FOR SELECT USING (auth.uid() = usuario_id);

DROP POLICY IF EXISTS "Usuarios podem inserir proprias contas a pagar" ON public.contas_a_pagar;
CREATE POLICY "Usuarios podem inserir proprias contas a pagar" ON public.contas_a_pagar
  FOR INSERT WITH CHECK (auth.uid() = usuario_id);

DROP POLICY IF EXISTS "Usuarios podem atualizar proprias contas a pagar" ON public.contas_a_pagar;
CREATE POLICY "Usuarios podem atualizar proprias contas a pagar" ON public.contas_a_pagar
  FOR UPDATE USING (auth.uid() = usuario_id);

DROP POLICY IF EXISTS "Usuarios podem deletar proprias contas a pagar" ON public.contas_a_pagar;
CREATE POLICY "Usuarios podem deletar proprias contas a pagar" ON public.contas_a_pagar
  FOR DELETE USING (auth.uid() = usuario_id);

-- ========================================
-- 2. TABELA DE CONTAS A RECEBER
-- ========================================
CREATE TABLE IF NOT EXISTS public.contas_a_receber (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  lancamento DATE NOT NULL DEFAULT CURRENT_DATE,
  observacoes TEXT,
  forma_recebimento TEXT NOT NULL CHECK (forma_recebimento IN ('dinheiro', 'cartao', 'pix', 'boleto', 'transferencia', 'parcelado', 'cheque')),
  conta_destino TEXT NOT NULL CHECK (conta_destino IN ('caixa', 'banco')),
  centro_custo TEXT,
  cliente_id UUID REFERENCES public.clientes(id) ON DELETE SET NULL,
  cliente TEXT, -- Campo legado para compatibilidade (será preenchido automaticamente)
  valor_total DECIMAL(10, 2) NOT NULL CHECK (valor_total > 0),
  valor_recebido DECIMAL(10, 2) NOT NULL DEFAULT 0 CHECK (valor_recebido >= 0),
  valor_restante DECIMAL(10, 2) NOT NULL CHECK (valor_restante >= 0),
  parcelas INTEGER NOT NULL DEFAULT 1 CHECK (parcelas > 0),
  parcelas_recebidas INTEGER NOT NULL DEFAULT 0 CHECK (parcelas_recebidas >= 0),
  data_vencimento DATE NOT NULL,
  data_recebimento DATE,
  status_recebimento TEXT NOT NULL DEFAULT 'pendente' CHECK (status_recebimento IN ('pendente', 'parcial', 'recebido')),
  workspace_id UUID NOT NULL,
  usuario_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  criado_em TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  atualizado_em TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  CONSTRAINT valor_restante_receber_valido CHECK (valor_restante = valor_total - valor_recebido),
  CONSTRAINT parcelas_recebidas_valido CHECK (parcelas_recebidas <= parcelas)
);

-- Comentários
COMMENT ON TABLE public.contas_a_receber IS 'Registro de contas a receber (vendas e receitas)';
COMMENT ON COLUMN public.contas_a_receber.lancamento IS 'Data do lançamento da conta';
COMMENT ON COLUMN public.contas_a_receber.conta_destino IS 'Destino do recebimento: caixa ou banco';
COMMENT ON COLUMN public.contas_a_receber.centro_custo IS 'Categoria do produto ou serviço';
COMMENT ON COLUMN public.contas_a_receber.valor_recebido IS 'Valor já recebido (soma de recebimentos parciais)';
COMMENT ON COLUMN public.contas_a_receber.valor_restante IS 'Valor ainda pendente';
COMMENT ON COLUMN public.contas_a_receber.parcelas_recebidas IS 'Número de parcelas já recebidas';
COMMENT ON COLUMN public.contas_a_receber.status_recebimento IS 'Status: pendente, parcial ou recebido';

-- Índices
CREATE INDEX IF NOT EXISTS idx_contas_a_receber_usuario_id ON public.contas_a_receber(usuario_id);
CREATE INDEX IF NOT EXISTS idx_contas_a_receber_workspace_id ON public.contas_a_receber(workspace_id);
CREATE INDEX IF NOT EXISTS idx_contas_a_receber_status ON public.contas_a_receber(status_recebimento);
CREATE INDEX IF NOT EXISTS idx_contas_a_receber_data_vencimento ON public.contas_a_receber(data_vencimento);
CREATE INDEX IF NOT EXISTS idx_contas_a_receber_data_recebimento ON public.contas_a_receber(data_recebimento);
CREATE INDEX IF NOT EXISTS idx_contas_a_receber_cliente_id ON public.contas_a_receber(cliente_id);
CREATE INDEX IF NOT EXISTS idx_contas_a_receber_cliente ON public.contas_a_receber(cliente);

-- RLS
ALTER TABLE public.contas_a_receber ENABLE ROW LEVEL SECURITY;

-- Políticas
DROP POLICY IF EXISTS "Usuarios podem ver proprias contas a receber" ON public.contas_a_receber;
CREATE POLICY "Usuarios podem ver proprias contas a receber" ON public.contas_a_receber
  FOR SELECT USING (auth.uid() = usuario_id);

DROP POLICY IF EXISTS "Usuarios podem inserir proprias contas a receber" ON public.contas_a_receber;
CREATE POLICY "Usuarios podem inserir proprias contas a receber" ON public.contas_a_receber
  FOR INSERT WITH CHECK (auth.uid() = usuario_id);

DROP POLICY IF EXISTS "Usuarios podem atualizar proprias contas a receber" ON public.contas_a_receber;
CREATE POLICY "Usuarios podem atualizar proprias contas a receber" ON public.contas_a_receber
  FOR UPDATE USING (auth.uid() = usuario_id);

DROP POLICY IF EXISTS "Usuarios podem deletar proprias contas a receber" ON public.contas_a_receber;
CREATE POLICY "Usuarios podem deletar proprias contas a receber" ON public.contas_a_receber
  FOR DELETE USING (auth.uid() = usuario_id);

-- ========================================
-- 3. TABELA DE MOVIMENTAÇÕES FINANCEIRAS
-- ========================================
-- Esta tabela registra todas as movimentações financeiras (entradas e saídas)
-- relacionadas a contas a pagar e receber
CREATE TABLE IF NOT EXISTS public.movimentacoes_financeiras (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  conta_pagar_id UUID REFERENCES public.contas_a_pagar(id) ON DELETE SET NULL,
  conta_receber_id UUID REFERENCES public.contas_a_receber(id) ON DELETE SET NULL,
  tipo TEXT NOT NULL CHECK (tipo IN ('entrada', 'saida')),
  valor DECIMAL(10, 2) NOT NULL CHECK (valor > 0),
  data_movimentacao DATE NOT NULL DEFAULT CURRENT_DATE,
  conta TEXT NOT NULL CHECK (conta IN ('caixa', 'banco')),
  descricao TEXT,
  workspace_id UUID NOT NULL,
  usuario_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  criado_em TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  CONSTRAINT conta_relacionada_valida CHECK (
    (conta_pagar_id IS NOT NULL AND conta_receber_id IS NULL) OR
    (conta_pagar_id IS NULL AND conta_receber_id IS NOT NULL)
  )
);

-- Comentários
COMMENT ON TABLE public.movimentacoes_financeiras IS 'Registro de movimentações financeiras (entradas e saídas)';
COMMENT ON COLUMN public.movimentacoes_financeiras.conta_pagar_id IS 'ID da conta a pagar relacionada (se saída)';
COMMENT ON COLUMN public.movimentacoes_financeiras.conta_receber_id IS 'ID da conta a receber relacionada (se entrada)';
COMMENT ON COLUMN public.movimentacoes_financeiras.tipo IS 'Tipo: entrada (recebimento) ou saida (pagamento)';
COMMENT ON COLUMN public.movimentacoes_financeiras.conta IS 'Conta afetada: caixa ou banco';

-- Índices
CREATE INDEX IF NOT EXISTS idx_movimentacoes_financeiras_usuario_id ON public.movimentacoes_financeiras(usuario_id);
CREATE INDEX IF NOT EXISTS idx_movimentacoes_financeiras_workspace_id ON public.movimentacoes_financeiras(workspace_id);
CREATE INDEX IF NOT EXISTS idx_movimentacoes_financeiras_tipo ON public.movimentacoes_financeiras(tipo);
CREATE INDEX IF NOT EXISTS idx_movimentacoes_financeiras_conta ON public.movimentacoes_financeiras(conta);
CREATE INDEX IF NOT EXISTS idx_movimentacoes_financeiras_data ON public.movimentacoes_financeiras(data_movimentacao DESC);
CREATE INDEX IF NOT EXISTS idx_movimentacoes_financeiras_conta_pagar ON public.movimentacoes_financeiras(conta_pagar_id);
CREATE INDEX IF NOT EXISTS idx_movimentacoes_financeiras_conta_receber ON public.movimentacoes_financeiras(conta_receber_id);

-- RLS
ALTER TABLE public.movimentacoes_financeiras ENABLE ROW LEVEL SECURITY;

-- Políticas
DROP POLICY IF EXISTS "Usuarios podem ver proprias movimentacoes financeiras" ON public.movimentacoes_financeiras;
CREATE POLICY "Usuarios podem ver proprias movimentacoes financeiras" ON public.movimentacoes_financeiras
  FOR SELECT USING (auth.uid() = usuario_id);

DROP POLICY IF EXISTS "Usuarios podem inserir proprias movimentacoes financeiras" ON public.movimentacoes_financeiras;
CREATE POLICY "Usuarios podem inserir proprias movimentacoes financeiras" ON public.movimentacoes_financeiras
  FOR INSERT WITH CHECK (auth.uid() = usuario_id);

DROP POLICY IF EXISTS "Usuarios podem atualizar proprias movimentacoes financeiras" ON public.movimentacoes_financeiras;
CREATE POLICY "Usuarios podem atualizar proprias movimentacoes financeiras" ON public.movimentacoes_financeiras
  FOR UPDATE USING (auth.uid() = usuario_id);

DROP POLICY IF EXISTS "Usuarios podem deletar proprias movimentacoes financeiras" ON public.movimentacoes_financeiras;
CREATE POLICY "Usuarios podem deletar proprias movimentacoes financeiras" ON public.movimentacoes_financeiras
  FOR DELETE USING (auth.uid() = usuario_id);

-- ========================================
-- 4. FUNÇÕES PARA ATUALIZAÇÃO AUTOMÁTICA
-- ========================================

-- Função para preencher nome do fornecedor automaticamente
CREATE OR REPLACE FUNCTION preencher_nome_fornecedor()
RETURNS TRIGGER AS $$
BEGIN
  -- Se fornecedor_id foi preenchido e fornecedor está vazio, buscar nome
  IF NEW.fornecedor_id IS NOT NULL AND (NEW.fornecedor IS NULL OR NEW.fornecedor = '') THEN
    SELECT nome INTO NEW.fornecedor
    FROM public.fornecedores
    WHERE id = NEW.fornecedor_id;
  END IF;
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

COMMENT ON FUNCTION preencher_nome_fornecedor() IS 'Preenche automaticamente o campo fornecedor baseado no fornecedor_id';

-- Função para preencher nome do cliente automaticamente
CREATE OR REPLACE FUNCTION preencher_nome_cliente()
RETURNS TRIGGER AS $$
BEGIN
  -- Se cliente_id foi preenchido e cliente está vazio, buscar nome
  IF NEW.cliente_id IS NOT NULL AND (NEW.cliente IS NULL OR NEW.cliente = '') THEN
    SELECT nome INTO NEW.cliente
    FROM public.clientes
    WHERE id = NEW.cliente_id;
  END IF;
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

COMMENT ON FUNCTION preencher_nome_cliente() IS 'Preenche automaticamente o campo cliente baseado no cliente_id';
RETURNS TRIGGER AS $$
BEGIN
  -- Atualizar valor_restante
  NEW.valor_restante = NEW.valor_total - NEW.valor_pago;
  
  -- Atualizar status baseado no valor pago
  IF NEW.valor_pago = 0 THEN
    NEW.status_pagamento = 'pendente';
  ELSIF NEW.valor_pago < NEW.valor_total THEN
    NEW.status_pagamento = 'parcial';
  ELSE
    NEW.status_pagamento = 'pago';
    -- Se foi totalmente pago e não tem data_pagamento, definir como hoje
    IF NEW.data_pagamento IS NULL THEN
      NEW.data_pagamento = CURRENT_DATE;
    END IF;
  END IF;
  
  -- Atualizar parcelas_pagas baseado no valor pago
  IF NEW.parcelas > 0 THEN
    NEW.parcelas_pagas = LEAST(
      NEW.parcelas,
      GREATEST(0, FLOOR((NEW.valor_pago / NEW.valor_total) * NEW.parcelas))
    );
  END IF;
  
  NEW.atualizado_em = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

COMMENT ON FUNCTION atualizar_status_contas_pagar() IS 'Atualiza automaticamente status e valores de contas a pagar';

-- Função para atualizar status e valores de contas a receber
CREATE OR REPLACE FUNCTION atualizar_status_contas_receber()
RETURNS TRIGGER AS $$
BEGIN
  -- Atualizar valor_restante
  NEW.valor_restante = NEW.valor_total - NEW.valor_recebido;
  
  -- Atualizar status baseado no valor recebido
  IF NEW.valor_recebido = 0 THEN
    NEW.status_recebimento = 'pendente';
  ELSIF NEW.valor_recebido < NEW.valor_total THEN
    NEW.status_recebimento = 'parcial';
  ELSE
    NEW.status_recebimento = 'recebido';
    -- Se foi totalmente recebido e não tem data_recebimento, definir como hoje
    IF NEW.data_recebimento IS NULL THEN
      NEW.data_recebimento = CURRENT_DATE;
    END IF;
  END IF;
  
  -- Atualizar parcelas_recebidas baseado no valor recebido
  IF NEW.parcelas > 0 THEN
    NEW.parcelas_recebidas = LEAST(
      NEW.parcelas,
      GREATEST(0, FLOOR((NEW.valor_recebido / NEW.valor_total) * NEW.parcelas))
    );
  END IF;
  
  NEW.atualizado_em = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

COMMENT ON FUNCTION atualizar_status_contas_receber() IS 'Atualiza automaticamente status e valores de contas a receber';

-- Função para criar movimentação financeira quando conta a pagar é paga
CREATE OR REPLACE FUNCTION criar_movimentacao_pagamento()
RETURNS TRIGGER AS $$
DECLARE
  valor_diferenca DECIMAL(10, 2);
BEGIN
  -- Só criar movimentação se houve mudança no valor_pago e status mudou para pago ou parcial
  IF NEW.status_pagamento IN ('pago', 'parcial') AND 
     (OLD.valor_pago IS NULL OR OLD.valor_pago < NEW.valor_pago) THEN
    
    valor_diferenca = NEW.valor_pago - COALESCE(OLD.valor_pago, 0);
    
    -- Criar movimentação financeira (saída)
    IF valor_diferenca > 0 THEN
      INSERT INTO public.movimentacoes_financeiras (
        conta_pagar_id,
        tipo,
        valor,
        data_movimentacao,
        conta,
        descricao,
        workspace_id,
        usuario_id
      ) VALUES (
        NEW.id,
        'saida',
        valor_diferenca,
        COALESCE(NEW.data_pagamento, CURRENT_DATE),
        NEW.conta_origem,
        'Pagamento: ' || COALESCE(NEW.observacoes, NEW.fornecedor),
        NEW.workspace_id,
        NEW.usuario_id
      );
    END IF;
  END IF;
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

COMMENT ON FUNCTION criar_movimentacao_pagamento() IS 'Cria movimentação financeira quando conta a pagar é paga';

-- Função para criar movimentação financeira quando conta a receber é recebida
CREATE OR REPLACE FUNCTION criar_movimentacao_recebimento()
RETURNS TRIGGER AS $$
DECLARE
  valor_diferenca DECIMAL(10, 2);
BEGIN
  -- Só criar movimentação se houve mudança no valor_recebido e status mudou para recebido ou parcial
  IF NEW.status_recebimento IN ('recebido', 'parcial') AND 
     (OLD.valor_recebido IS NULL OR OLD.valor_recebido < NEW.valor_recebido) THEN
    
    valor_diferenca = NEW.valor_recebido - COALESCE(OLD.valor_recebido, 0);
    
    -- Criar movimentação financeira (entrada)
    IF valor_diferenca > 0 THEN
      INSERT INTO public.movimentacoes_financeiras (
        conta_receber_id,
        tipo,
        valor,
        data_movimentacao,
        conta,
        descricao,
        workspace_id,
        usuario_id
      ) VALUES (
        NEW.id,
        'entrada',
        valor_diferenca,
        COALESCE(NEW.data_recebimento, CURRENT_DATE),
        NEW.conta_destino,
        'Recebimento: ' || COALESCE(NEW.observacoes, NEW.cliente),
        NEW.workspace_id,
        NEW.usuario_id
      );
    END IF;
  END IF;
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

COMMENT ON FUNCTION criar_movimentacao_recebimento() IS 'Cria movimentação financeira quando conta a receber é recebida';

-- ========================================
-- 5. TRIGGERS
-- ========================================

-- Trigger para preencher nome do fornecedor antes de inserir/atualizar
DROP TRIGGER IF EXISTS trigger_preencher_nome_fornecedor ON public.contas_a_pagar;
CREATE TRIGGER trigger_preencher_nome_fornecedor
  BEFORE INSERT OR UPDATE ON public.contas_a_pagar
  FOR EACH ROW
  EXECUTE FUNCTION preencher_nome_fornecedor();

-- Trigger para preencher nome do cliente antes de inserir/atualizar
DROP TRIGGER IF EXISTS trigger_preencher_nome_cliente ON public.contas_a_receber;
CREATE TRIGGER trigger_preencher_nome_cliente
  BEFORE INSERT OR UPDATE ON public.contas_a_receber
  FOR EACH ROW
  EXECUTE FUNCTION preencher_nome_cliente();

-- Trigger para atualizar status de contas a pagar
DROP TRIGGER IF EXISTS trigger_atualizar_status_contas_pagar ON public.contas_a_pagar;
CREATE TRIGGER trigger_atualizar_status_contas_pagar
  BEFORE INSERT OR UPDATE ON public.contas_a_pagar
  FOR EACH ROW
  EXECUTE FUNCTION atualizar_status_contas_pagar();

-- Trigger para criar movimentação quando conta a pagar é paga
DROP TRIGGER IF EXISTS trigger_criar_movimentacao_pagamento ON public.contas_a_pagar;
CREATE TRIGGER trigger_criar_movimentacao_pagamento
  AFTER UPDATE ON public.contas_a_pagar
  FOR EACH ROW
  WHEN (OLD.valor_pago IS DISTINCT FROM NEW.valor_pago)
  EXECUTE FUNCTION criar_movimentacao_pagamento();

-- Trigger para atualizar status de contas a receber
DROP TRIGGER IF EXISTS trigger_atualizar_status_contas_receber ON public.contas_a_receber;
CREATE TRIGGER trigger_atualizar_status_contas_receber
  BEFORE INSERT OR UPDATE ON public.contas_a_receber
  FOR EACH ROW
  EXECUTE FUNCTION atualizar_status_contas_receber();

-- Trigger para criar movimentação quando conta a receber é recebida
DROP TRIGGER IF EXISTS trigger_criar_movimentacao_recebimento ON public.contas_a_receber;
CREATE TRIGGER trigger_criar_movimentacao_recebimento
  AFTER UPDATE ON public.contas_a_receber
  FOR EACH ROW
  WHEN (OLD.valor_recebido IS DISTINCT FROM NEW.valor_recebido)
  EXECUTE FUNCTION criar_movimentacao_recebimento();

-- Trigger para atualizar atualizado_em em contas a pagar
DROP TRIGGER IF EXISTS atualizar_contas_pagar_data_modificacao ON public.contas_a_pagar;
CREATE TRIGGER atualizar_contas_pagar_data_modificacao
  BEFORE UPDATE ON public.contas_a_pagar
  FOR EACH ROW
  EXECUTE FUNCTION atualizar_data_modificacao();

-- Trigger para atualizar atualizado_em em contas a receber
DROP TRIGGER IF EXISTS atualizar_contas_receber_data_modificacao ON public.contas_a_receber;
CREATE TRIGGER atualizar_contas_receber_data_modificacao
  BEFORE UPDATE ON public.contas_a_receber
  FOR EACH ROW
  EXECUTE FUNCTION atualizar_data_modificacao();

-- ========================================
-- 6. VIEWS ÚTEIS
-- ========================================

-- View de resumo de contas a pagar por status
CREATE OR REPLACE VIEW public.resumo_contas_pagar AS
SELECT 
  usuario_id,
  workspace_id,
  status_pagamento,
  COUNT(*) AS total_contas,
  SUM(valor_total) AS valor_total,
  SUM(valor_pago) AS valor_pago,
  SUM(valor_restante) AS valor_restante
FROM public.contas_a_pagar
GROUP BY usuario_id, workspace_id, status_pagamento;

COMMENT ON VIEW public.resumo_contas_pagar IS 'Resumo de contas a pagar por status';

-- View de resumo de contas a receber por status
CREATE OR REPLACE VIEW public.resumo_contas_receber AS
SELECT 
  usuario_id,
  workspace_id,
  status_recebimento,
  COUNT(*) AS total_contas,
  SUM(valor_total) AS valor_total,
  SUM(valor_recebido) AS valor_recebido,
  SUM(valor_restante) AS valor_restante
FROM public.contas_a_receber
GROUP BY usuario_id, workspace_id, status_recebimento;

COMMENT ON VIEW public.resumo_contas_receber IS 'Resumo de contas a receber por status';

-- View de saldo de caixa e banco
CREATE OR REPLACE VIEW public.saldo_caixa_banco AS
SELECT 
  usuario_id,
  workspace_id,
  conta,
  SUM(CASE WHEN tipo = 'entrada' THEN valor ELSE 0 END) AS total_entradas,
  SUM(CASE WHEN tipo = 'saida' THEN valor ELSE 0 END) AS total_saidas,
  SUM(CASE WHEN tipo = 'entrada' THEN valor ELSE -valor END) AS saldo
FROM public.movimentacoes_financeiras
GROUP BY usuario_id, workspace_id, conta;

COMMENT ON VIEW public.saldo_caixa_banco IS 'Saldo atual de caixa e banco por usuário e workspace';

-- ========================================
-- FIM DO SCRIPT
-- ========================================

