-- ============================================
-- 🔍 DIAGNÓSTICO COMPLETO DO COMPARTILHAMENTO
-- ============================================

-- 1️⃣ USUÁRIOS CADASTRADOS
SELECT 
  '1️⃣ USUÁRIOS CADASTRADOS' as "Seção",
  email,
  id::text as usuario_id
FROM auth.users
ORDER BY email;

-- 2️⃣ COMPARTILHAMENTOS ATIVOS
SELECT 
  '2️⃣ COMPARTILHAMENTOS ATIVOS' as "Seção",
  dono.email as "Dono (Compartilhou)",
  compartilhado.email as "Compartilhado Com",
  c.status,
  c.permissoes,
  c.dono_id::text,
  c.usuario_compartilhado_id::text
FROM compartilhamentos c
JOIN perfis dono ON c.dono_id = dono.id
JOIN perfis compartilhado ON c.usuario_compartilhado_id = compartilhado.id
WHERE c.status = 'ativo';

-- 3️⃣ PRODUTOS E SEUS DONOS
SELECT 
  '3️⃣ PRODUTOS' as "Seção",
  p.nome as "Produto",
  p.estoque as "Estoque",
  dono.email as "Dono",
  p.usuario_id::text
FROM produtos p
JOIN perfis dono ON p.usuario_id = dono.id
ORDER BY p.criado_em DESC;

-- 4️⃣ TESTAR FUNÇÃO tem_acesso_compartilhado
-- Para cada produto, testar se os usuários têm acesso

DO $$
DECLARE
  produto_record RECORD;
  usuario_record RECORD;
  tem_acesso BOOLEAN;
BEGIN
  RAISE NOTICE '4️⃣ TESTE DE ACESSO POR PRODUTO:';
  RAISE NOTICE '=====================================';
  
  FOR produto_record IN 
    SELECT p.nome, p.usuario_id, dono.email as dono_email
    FROM produtos p
    JOIN perfis dono ON p.usuario_id = dono.id
  LOOP
    RAISE NOTICE '';
    RAISE NOTICE '📦 Produto: % (Dono: %)', produto_record.nome, produto_record.dono_email;
    
    FOR usuario_record IN SELECT id, email FROM auth.users LOOP
      -- Simular auth.uid() retornando o ID deste usuário
      tem_acesso := EXISTS (
        SELECT 1 FROM (
          SELECT produto_record.usuario_id as dono_id
        ) AS p
        WHERE p.dono_id = usuario_record.id
        OR EXISTS (
          SELECT 1 FROM compartilhamentos
          WHERE dono_id = produto_record.usuario_id
          AND usuario_compartilhado_id = usuario_record.id
          AND status = 'ativo'
        )
      );
      
      IF tem_acesso THEN
        RAISE NOTICE '   ✅ % pode ver', usuario_record.email;
      ELSE
        RAISE NOTICE '   ❌ % NÃO pode ver', usuario_record.email;
      END IF;
    END LOOP;
  END LOOP;
END $$;

-- 5️⃣ VERIFICAR FUNÇÃO tem_acesso_compartilhado EXISTE
SELECT 
  '5️⃣ FUNÇÃO tem_acesso_compartilhado' as "Seção",
  proname as "Nome",
  pg_get_functiondef(oid) as "Definição"
FROM pg_proc
WHERE proname = 'tem_acesso_compartilhado';

