-- ========================================
-- ADICIONAR COLUNA gerenciado_por_lote
-- ========================================
-- Este script adiciona a coluna gerenciado_por_lote na tabela produtos
-- para controlar se um produto é gerenciado por lote

-- 1. Adicionar coluna (permite NULL inicialmente para produtos existentes)
ALTER TABLE public.produtos 
ADD COLUMN IF NOT EXISTS gerenciado_por_lote BOOLEAN NOT NULL DEFAULT false;

-- 2. Comentário na coluna
COMMENT ON COLUMN public.produtos.gerenciado_por_lote IS 'Indica se o produto é gerenciado por lote (controle de validade e custo por lote)';

-- 3. Verificar se a coluna foi criada corretamente
-- Execute: SELECT column_name, data_type, column_default 
-- FROM information_schema.columns 
-- WHERE table_name = 'produtos' AND column_name = 'gerenciado_por_lote';

-- ✅ Fim do script
-- Após executar este script, o campo managedByBatch será persistido no banco de dados

