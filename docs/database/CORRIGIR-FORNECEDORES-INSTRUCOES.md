# 🔧 Correção: Constraint de Fornecedores

## ❌ Problema

O erro 409 estava ocorrendo porque a tabela `fornecedores` tinha uma constraint única **global** no campo `codigo`, impedindo que diferentes usuários criem fornecedores com o mesmo código.

**Exemplo do problema:**

- Usuário A cria fornecedor com código "1" ✅
- Usuário B tenta criar fornecedor com código "1" ❌ **ERRO 409**

## ✅ Solução

A constraint única foi alterada para ser **composta** por `(codigo, usuario_id)`, permitindo que cada usuário tenha seus próprios códigos de fornecedores, igual à tabela `produtos`.

**Agora:**

- Usuário A cria fornecedor com código "1" ✅
- Usuário B também pode criar fornecedor com código "1" ✅ (porque são usuários diferentes)

---

## 📋 Passo a Passo para Corrigir

### 1️⃣ Acesse o Supabase

1. Acesse: https://supabase.com/dashboard
2. Selecione seu projeto
3. Clique em **"SQL Editor"** no menu lateral

### 2️⃣ Execute o Script de Correção

1. Abra o arquivo: `docs/database/corrigir-constraint-fornecedores.sql`
2. Copie **TODO** o conteúdo
3. Cole no SQL Editor do Supabase
4. Clique em **"Run"** (ou pressione `Ctrl + Enter`)

### 3️⃣ Verificar se Funcionou

O script mostrará mensagens de sucesso. Você deve ver algo como:

```
NOTICE: Constraint única simples removida: fornecedores_codigo_key
NOTICE: Constraint única composta criada: codigo_unico_por_usuario (codigo, usuario_id)
```

### 4️⃣ Testar no Sistema

1. Recarregue a aplicação
2. Tente criar fornecedores com o mesmo código em perfis diferentes
3. Agora deve funcionar! ✅

---

## 🔍 Verificar Constraints Existentes

Se quiser verificar as constraints atuais da tabela, execute este SQL:

```sql
SELECT
  conname AS constraint_name,
  contype AS constraint_type,
  pg_get_constraintdef(oid) AS constraint_definition
FROM pg_constraint
WHERE conrelid = 'public.fornecedores'::regclass
  AND contype = 'u'
ORDER BY conname;
```

**Resultado esperado:**

```
constraint_name: codigo_unico_por_usuario
constraint_type: u
constraint_definition: UNIQUE (codigo, usuario_id)
```

---

## 📝 Notas Importantes

- ✅ O script é **seguro** e **não deleta dados**
- ✅ Ele apenas **remove** a constraint antiga e **cria** a nova
- ✅ Se já tiver a constraint correta, o script não faz nada
- ✅ Pode executar múltiplas vezes sem problemas

---

## 🆘 Se Ainda Der Erro

1. Verifique se o script foi executado completamente
2. Verifique se há erros no console do SQL Editor
3. Certifique-se de que a constraint `codigo_unico_por_usuario` foi criada
4. Recarregue a aplicação após executar o script

---

**Pronto!** Agora cada usuário pode ter seus próprios códigos de fornecedores independentemente! 🎉
