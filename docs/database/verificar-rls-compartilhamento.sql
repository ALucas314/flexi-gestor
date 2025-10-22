-- ============================================
-- 🔍 VERIFICAR SE RLS ESTÁ CONFIGURADO CORRETAMENTE
-- ============================================

-- Ver todas as políticas da tabela produtos
SELECT 
  schemaname,
  tablename,
  policyname,
  permissive,
  roles,
  cmd,
  qual as "USING clause"
FROM pg_policies
WHERE tablename = 'produtos'
ORDER BY policyname;

-- Ver se a função existe
SELECT 
  proname as "Nome da Função",
  prosrc as "Código"
FROM pg_proc
WHERE proname = 'tem_acesso_compartilhado';

-- Testar a função manualmente
-- Substitua os UUIDs pelos IDs reais dos usuários
SELECT 
  'Antônio pode acessar dados do Antônio' as teste,
  tem_acesso_compartilhado('cb1743a7-a1e9-4a14-80db-36be33d0b2eb'::UUID) as resultado;

SELECT 
  'Lucas pode acessar dados do Antônio' as teste,
  tem_acesso_compartilhado('cb1743a7-a1e9-4a14-80db-36be33d0b2eb'::UUID) as resultado;

