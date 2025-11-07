-- ========================================
-- FLEXI GESTOR - VERIFICAR CONTAS A RECEBER
-- Consulta para verificar se há contas a receber no banco
-- Versão: 1.0.0
-- Data: 2025-01-20
-- ========================================

-- CONSULTA 1: Listar todas as contas a receber
SELECT 
    id,
    lancamento,
    observacoes,
    cliente,
    valor_total,
    valor_recebido,
    valor_restante,
    parcelas,
    parcelas_recebidas,
    data_vencimento,
    status_recebimento,
    workspace_id,
    usuario_id,
    criado_em,
    atualizado_em
FROM contas_a_receber
ORDER BY criado_em DESC;

-- CONSULTA 2: Contar contas a receber por status
SELECT 
    status_recebimento,
    COUNT(*) AS quantidade,
    SUM(valor_total) AS valor_total,
    SUM(valor_recebido) AS valor_recebido,
    SUM(valor_restante) AS valor_restante
FROM contas_a_receber
GROUP BY status_recebimento;

-- CONSULTA 3: Verificar contas a receber por workspace_id
SELECT 
    workspace_id,
    COUNT(*) AS quantidade
FROM contas_a_receber
GROUP BY workspace_id;

-- CONSULTA 4: Verificar contas a receber por usuario_id
SELECT 
    usuario_id,
    COUNT(*) AS quantidade
FROM contas_a_receber
GROUP BY usuario_id;

-- CONSULTA 5: Verificar estrutura da tabela contas_a_receber
SELECT 
    column_name,
    data_type,
    is_nullable,
    column_default
FROM information_schema.columns
WHERE table_schema = 'public'
    AND table_name = 'contas_a_receber'
ORDER BY ordinal_position;

