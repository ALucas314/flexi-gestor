-- ============================================
-- 🧪 TESTAR COMPARTILHAMENTO BIDIRECIONAL
-- ============================================

-- 1️⃣ Verificar usuários cadastrados
SELECT 
  'USUÁRIOS CADASTRADOS' as info,
  email,
  id
FROM auth.users
ORDER BY email;

-- 2️⃣ Verificar compartilhamentos ativos
SELECT 
  'COMPARTILHAMENTOS ATIVOS' as info,
  c.id,
  dono.email as "Dono (Compartilhou)",
  compartilhado.email as "Compartilhado (Recebeu)",
  c.status,
  c.permissoes
FROM compartilhamentos c
JOIN perfis dono ON c.dono_id = dono.id
JOIN perfis compartilhado ON c.usuario_compartilhado_id = compartilhado.id
WHERE c.status = 'ativo';

-- 3️⃣ Testar função para cada produto
SELECT 
  'TESTE DE ACESSO' as info,
  p.nome as "Produto",
  dono.email as "Dono do Produto",
  'Deve ver quem?' as pergunta
FROM produtos p
JOIN perfis dono ON p.usuario_id = dono.id;

-- ============================================
-- 📋 INSTRUÇÕES:
-- ============================================
-- Execute este script para verificar:
-- 1. Quais usuários existem
-- 2. Quais compartilhamentos estão ativos
-- 3. Quais produtos existem e de quem são

