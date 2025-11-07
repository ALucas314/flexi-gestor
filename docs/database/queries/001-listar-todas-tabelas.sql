-- ========================================
-- FLEXI GESTOR - CONSULTA DE TABELAS
-- Lista todas as tabelas do banco de dados
-- Versão: 1.0.0
-- Data: 2025-01-20
-- ========================================

-- CONSULTA 1: Listar todas as tabelas do schema público
SELECT 
    schemaname AS schema,
    tablename AS tabela,
    tableowner AS proprietario
FROM pg_tables
WHERE schemaname = 'public'
ORDER BY tablename;

-- CONSULTA 2: Listar tabelas com informações detalhadas (colunas, tipos, etc.)
SELECT 
    t.table_schema AS schema,
    t.table_name AS tabela,
    t.table_type AS tipo,
    COUNT(c.column_name) AS numero_colunas
FROM information_schema.tables t
LEFT JOIN information_schema.columns c 
    ON t.table_schema = c.table_schema 
    AND t.table_name = c.table_name
WHERE t.table_schema = 'public'
    AND t.table_type = 'BASE TABLE'
GROUP BY t.table_schema, t.table_name, t.table_type
ORDER BY t.table_name;

-- CONSULTA 3: Listar todas as tabelas com comentários (se houver)
SELECT 
    t.table_name AS tabela,
    obj_description(c.oid, 'pg_class') AS comentario,
    COUNT(col.column_name) AS numero_colunas
FROM information_schema.tables t
LEFT JOIN pg_class c ON c.relname = t.table_name
LEFT JOIN information_schema.columns col 
    ON col.table_schema = t.table_schema 
    AND col.table_name = t.table_name
WHERE t.table_schema = 'public'
    AND t.table_type = 'BASE TABLE'
GROUP BY t.table_name, c.oid
ORDER BY t.table_name;

-- CONSULTA 4: Listar apenas os nomes das tabelas (mais simples)
SELECT table_name AS tabela
FROM information_schema.tables
WHERE table_schema = 'public'
    AND table_type = 'BASE TABLE'
ORDER BY table_name;

