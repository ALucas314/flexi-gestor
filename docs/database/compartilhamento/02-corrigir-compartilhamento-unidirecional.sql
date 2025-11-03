-- ============================================
-- 🔧 CORRIGIR COMPARTILHAMENTO UNIDIRECIONAL
-- ============================================
-- Apenas o DONO compartilha COM outro usuário
-- O outro usuário NÃO precisa compartilhar de volta

-- Remover compartilhamentos bidirecionais desnecessários
-- Manter apenas: Lucas → Antônio

DELETE FROM compartilhamentos
WHERE dono_id = '5dbd9444-a299-4dd6-8070-69b0099f5806' -- Antônio
AND usuario_compartilhado_id = '53ddbf80-c25a-4732-931b-00fb6e8d7006'; -- Lucas

-- Verificar resultado
SELECT 
  'COMPARTILHAMENTOS ATIVOS' as "Seção",
  dono.email as "Dono (Compartilha)",
  compartilhado.email as "Recebe Acesso",
  c.status
FROM compartilhamentos c
JOIN perfis dono ON c.dono_id = dono.id
JOIN perfis compartilhado ON c.usuario_compartilhado_id = compartilhado.id
WHERE c.status = 'ativo';

-- ============================================
-- Resultado esperado:
-- Lucas (9014) → Antônio (araujo1)
-- ============================================

