-- ============================================
-- 👥 LISTAR TODOS OS USUÁRIOS DO SISTEMA
-- ============================================
-- Use este script para ver quais usuários estão registrados

-- Ver usuários na tabela auth (autenticação)
SELECT 
  id,
  email,
  created_at as "Criado em",
  last_sign_in_at as "Último login",
  email_confirmed_at as "Email confirmado"
FROM auth.users
ORDER BY created_at DESC;

-- Ver usuários na tabela perfis (dados do sistema)
SELECT 
  id,
  email,
  nome,
  criado_em as "Criado em"
FROM perfis
ORDER BY criado_em DESC;

-- Ver usuários que estão em auth mas NÃO estão em perfis (problema!)
SELECT 
  u.id,
  u.email,
  u.created_at as "Criado em auth",
  'PERFIL FALTANDO' as status
FROM auth.users u
LEFT JOIN perfis p ON u.id = p.id
WHERE p.id IS NULL
ORDER BY u.created_at DESC;

