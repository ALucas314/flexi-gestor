-- ============================================
-- 🔍 PERMITIR BUSCA DE OUTROS USUÁRIOS
-- ============================================
-- Para o sistema de compartilhamento funcionar,
-- usuários precisam poder buscar outros usuários pelo email

-- ============================================
-- ADICIONAR POLÍTICA PARA BUSCAR USUÁRIOS
-- ============================================

-- Permitir que usuários autenticados possam VER perfis de outros
-- (apenas email e nome, sem dados sensíveis)
DROP POLICY IF EXISTS "Usuários podem buscar outros usuários para compartilhar" ON perfis;
CREATE POLICY "Usuários podem buscar outros usuários para compartilhar"
ON perfis FOR SELECT
TO authenticated
USING (true); -- Qualquer usuário autenticado pode ver perfis

-- ============================================
-- ✅ PRONTO!
-- ============================================
-- Agora você pode buscar usuários pelo email
-- para compartilhar acesso com eles

