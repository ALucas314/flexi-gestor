-- ========================================
-- ADICIONAR CAMPO STATUS À TABELA MOVIMENTAÇÕES
-- ========================================
-- Adiciona campo status para controlar se a movimentação está pendente, confirmada ou cancelada
-- ========================================

-- Adicionar coluna status se não existir
ALTER TABLE movimentacoes 
ADD COLUMN IF NOT EXISTS status TEXT DEFAULT 'confirmado' 
CHECK (status IN ('pendente', 'confirmado', 'cancelado'));

-- Atualizar movimentações existentes para 'confirmado' (valor padrão)
UPDATE movimentacoes SET status = 'confirmado' WHERE status IS NULL;

-- Comentário explicativo
COMMENT ON COLUMN movimentacoes.status IS 'Status da movimentação: pendente, confirmado ou cancelado';

-- ========================================
-- VERIFICAÇÃO
-- ========================================
SELECT 
  '✅ Campo status adicionado à tabela movimentacoes!' as mensagem,
  COUNT(*) as total_movimentacoes,
  COUNT(CASE WHEN status = 'confirmado' THEN 1 END) as confirmadas,
  COUNT(CASE WHEN status = 'pendente' THEN 1 END) as pendentes,
  COUNT(CASE WHEN status = 'cancelado' THEN 1 END) as canceladas
FROM movimentacoes;

