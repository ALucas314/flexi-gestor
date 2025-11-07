-- ========================================
-- FLEXI GESTOR - DIAGNÓSTICO DE CONTAS A RECEBER
-- Consulta para diagnosticar por que as contas não aparecem
-- Versão: 1.0.0
-- Data: 2025-01-20
-- ========================================

-- CONSULTA 1: Listar TODAS as contas a receber (sem filtro de workspace)
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
ORDER BY criado_em DESC
LIMIT 50;

-- CONSULTA 2: Verificar se há contas com workspace_id NULL
SELECT 
    COUNT(*) AS total_contas,
    COUNT(workspace_id) AS contas_com_workspace_id,
    COUNT(*) - COUNT(workspace_id) AS contas_sem_workspace_id
FROM contas_a_receber;

-- CONSULTA 3: Verificar valores únicos de workspace_id e usuario_id
SELECT DISTINCT
    workspace_id,
    usuario_id,
    COUNT(*) AS quantidade
FROM contas_a_receber
GROUP BY workspace_id, usuario_id
ORDER BY quantidade DESC;

-- CONSULTA 4: Verificar contas criadas recentemente (últimas 24 horas)
SELECT 
    id,
    observacoes,
    cliente,
    valor_total,
    parcelas,
    data_vencimento,
    status_recebimento,
    workspace_id,
    usuario_id,
    criado_em
FROM contas_a_receber
WHERE criado_em >= NOW() - INTERVAL '24 hours'
ORDER BY criado_em DESC;

-- CONSULTA 5: Verificar estrutura completa da tabela (incluindo constraints)
SELECT 
    c.column_name,
    c.data_type,
    c.is_nullable,
    c.column_default,
    CASE 
        WHEN pk.column_name IS NOT NULL THEN 'PRIMARY KEY'
        WHEN fk.column_name IS NOT NULL THEN 'FOREIGN KEY'
        ELSE ''
    END AS constraint_type
FROM information_schema.columns c
LEFT JOIN (
    SELECT ku.column_name
    FROM information_schema.table_constraints tc
    JOIN information_schema.key_column_usage ku
        ON tc.constraint_name = ku.constraint_name
    WHERE tc.table_schema = 'public'
        AND tc.table_name = 'contas_a_receber'
        AND tc.constraint_type = 'PRIMARY KEY'
) pk ON c.column_name = pk.column_name
LEFT JOIN (
    SELECT ku.column_name
    FROM information_schema.table_constraints tc
    JOIN information_schema.key_column_usage ku
        ON tc.constraint_name = ku.constraint_name
    WHERE tc.table_schema = 'public'
        AND tc.table_name = 'contas_a_receber'
        AND tc.constraint_type = 'FOREIGN KEY'
) fk ON c.column_name = fk.column_name
WHERE c.table_schema = 'public'
    AND c.table_name = 'contas_a_receber'
ORDER BY c.ordinal_position;

-- CONSULTA 6: Verificar políticas RLS (Row Level Security) da tabela
SELECT 
    schemaname,
    tablename,
    policyname,
    permissive,
    roles,
    cmd,
    qual,
    with_check
FROM pg_policies
WHERE schemaname = 'public'
    AND tablename = 'contas_a_receber';

