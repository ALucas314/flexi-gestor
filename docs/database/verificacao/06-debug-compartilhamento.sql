-- ============================================
-- 🔍 DEBUG COMPLETO DO COMPARTILHAMENTO
-- ============================================
-- Execute este script estando LOGADO na aplicação

-- 1️⃣ Qual usuário está logado?
SELECT 
  auth.uid() as "Meu ID",
  auth.email() as "Meu Email";

-- 2️⃣ Quais compartilhamentos ATIVOS existem?
SELECT 
  c.id,
  c.status,
  p1.email as "Dono",
  p2.email as "Compartilhado",
  c.permissoes
FROM compartilhamentos c
JOIN perfis p1 ON c.dono_id = p1.id
JOIN perfis p2 ON c.usuario_compartilhado_id = p2.id
WHERE c.status = 'ativo';

-- 3️⃣ Quais produtos EXISTEM no banco?
SELECT 
  p.id,
  p.nome as "Produto",
  p.estoque as "Estoque",
  per.email as "Dono",
  p.usuario_id as "Usuario ID"
FROM produtos p
JOIN perfis per ON p.usuario_id = per.id
ORDER BY p.criado_em DESC;

-- 4️⃣ A função está funcionando?
-- Teste se a função retorna algo
SELECT 
  p.usuario_id as "ID do Dono",
  per.email as "Email do Dono",
  tem_acesso_compartilhado(p.usuario_id) as "Tenho Acesso?"
FROM produtos p
JOIN perfis per ON p.usuario_id = per.id;

-- 5️⃣ Produtos que EU posso ver (via RLS)
SELECT 
  p.nome as "Produto",
  per.email as "Dono"
FROM produtos p
JOIN perfis per ON p.usuario_id = per.id;

