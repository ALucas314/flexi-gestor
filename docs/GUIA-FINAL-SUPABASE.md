# 🚀 GUIA COMPLETO - MIGRAÇÃO PARA SUPABASE

## ✅ O QUE FOI FEITO

### 1. Instalação e Configuração
- ✅ Instalado `@supabase/supabase-js`
- ✅ Criado arquivo `.env` com credenciais do Supabase
- ✅ Criado `src/lib/supabase.ts` (cliente Supabase)
- ✅ Criado `src/lib/batches.ts` (helper para gerenciar lotes)

### 2. Autenticação Migrada
- ✅ `AuthContext.tsx` - Agora usa Supabase Auth
- ✅ `Login.tsx` - Login/Registro com Supabase
- ✅ `ForgotPassword.tsx` - Recuperação de senha
- ✅ `ResetPassword.tsx` - Redefinição de senha
- ✅ `AlterarSenha.tsx` - Alteração de senha

### 3. Dados Migrados
- ✅ `DataContext.tsx` - Produtos, Movimentações e Notificações
- ✅ `Entradas.tsx` - Gerenciamento de lotes com Supabase
- ✅ Todas as operações CRUD usando Supabase

### 4. Banco de Dados
- ✅ Script SQL completo criado (`supabase-schema.sql`)
- ✅ Tabelas: `profiles`, `products`, `batches`, `movements`
- ✅ Row Level Security (RLS) configurado
- ✅ Triggers automáticos para criação de perfil

---

## 🎯 INSTRUÇÕES DE CONFIGURAÇÃO

### Passo 1: Executar Script SQL no Supabase (2 minutos)

1. Acesse seu projeto: https://supabase.com/dashboard/project/ujohzrebqzeochsozmac
2. Clique em **"SQL Editor"** no menu lateral
3. Clique em **"+ New Query"**
4. Abra o arquivo **`supabase-schema.sql`** e copie TODO o conteúdo
5. Cole no SQL Editor
6. Clique em **"Run"** (ou `Ctrl + Enter`)
7. Aguarde ver: ✅ **"Success. No rows returned"**

### Passo 2: Configurar Autenticação (1 minuto)

1. No Supabase, clique em **"Authentication"** → **"Providers"**
2. Clique em **"Email"**
3. **DESMARQUE** a opção: **"Confirm email"**
4. Role até o final e clique em **"Save"**

### Passo 3: Configurar URLs (1 minuto)

1. Ainda em **"Authentication"** → **"URL Configuration"**
2. Em **"Site URL"**: `http://localhost:5173`
3. Em **"Redirect URLs"**, adicione (linha por linha):
   ```
   http://localhost:5173
   http://localhost:5173/reset-password
   http://localhost:5173/*
   ```
4. Clique em **"Save"**

### Passo 4: Rodar o Sistema

```bash
npm run dev
```

### Passo 5: Criar Sua Conta

1. Acesse: http://localhost:5173/login
2. Clique na aba **"Registrar"**
3. Preencha os dados
4. Clique em **"Criar Nova Conta"**
5. 🎉 **Pronto!** Você já está usando o Supabase!

---

## 🧪 TESTAR AS FUNCIONALIDADES

### ✅ Autenticação
- [ ] Login funciona
- [ ] Registro funciona
- [ ] Logout funciona
- [ ] Recuperar senha funciona
- [ ] Alterar senha funciona

### ✅ Produtos
- [ ] Adicionar produto
- [ ] Editar produto
- [ ] Deletar produto
- [ ] Listar produtos

### ✅ Entradas (com Lotes)
- [ ] Criar entrada sem lotes
- [ ] Criar entrada com lotes
- [ ] Lotes são salvos no Supabase
- [ ] Estoque é atualizado

### ✅ Saídas/PDV
- [ ] Registrar venda
- [ ] Estoque é atualizado
- [ ] Recibo é gerado

### ✅ Financeiro
- [ ] Ver movimentações
- [ ] Filtrar por tipo
- [ ] Baixar relatório Excel

---

## 📊 VERIFICAR DADOS NO SUPABASE

### Ver dados no Table Editor:

1. **"Table Editor"** → Selecione a tabela
2. Você verá:
   - `profiles` - perfis dos usuários
   - `products` - produtos cadastrados
   - `batches` - lotes de produtos
   - `movements` - movimentações de estoque

### Ver políticas de segurança:

1. **"Table Editor"** → Selecione uma tabela
2. Clique nos **3 pontinhos** ⋮ → **"View Policies"**
3. Você verá as regras de segurança (RLS)

---

## 🔍 ESTRUTURA DO BANCO DE DADOS

### Tabela: `products`
```
id (UUID)
name (TEXT)
sku (TEXT) - único
category (TEXT)
price (DECIMAL)
stock (INTEGER)
min_stock (INTEGER)
unit_of_measure (TEXT)
supplier (TEXT)
description (TEXT)
user_id (UUID) - referência ao usuário
created_at (TIMESTAMP)
updated_at (TIMESTAMP)
```

### Tabela: `batches`
```
id (UUID)
product_id (UUID) - referência ao produto
batch_number (TEXT)
quantity (INTEGER)
unit_cost (DECIMAL)
manufacture_date (DATE)
expiry_date (DATE)
user_id (UUID) - referência ao usuário
created_at (TIMESTAMP)
```

### Tabela: `movements`
```
id (UUID)
product_id (UUID) - referência ao produto
type (TEXT) - entrada/saida/ajuste
quantity (INTEGER)
unit_price (DECIMAL)
total_price (DECIMAL)
payment_method (TEXT)
notes (TEXT)
receipt_number (TEXT) - número único (REC-* ou NFC-*)
user_id (UUID) - referência ao usuário
created_at (TIMESTAMP)
```

### Tabela: `profiles`
```
id (UUID) - mesmo ID do auth.users
email (TEXT)
name (TEXT)
created_at (TIMESTAMP)
updated_at (TIMESTAMP)
```

---

## 🔐 SEGURANÇA (RLS)

Todas as tabelas têm Row Level Security (RLS) ativado:

- ✅ Cada usuário **só vê seus próprios dados**
- ✅ Usuários **não podem** acessar dados de outros usuários
- ✅ Políticas automáticas para SELECT, INSERT, UPDATE, DELETE

---

## ⚠️ PROBLEMAS COMUNS

### "Invalid login credentials"
**Causa**: Usuário não existe ou senha incorreta
**Solução**: Crie uma conta nova ou redefina a senha

### "User not found"
**Causa**: Perfil não foi criado automaticamente
**Solução**: Execute no SQL Editor:
```sql
INSERT INTO public.profiles (id, email, name)
SELECT id, email, raw_user_meta_data->>'name'
FROM auth.users
WHERE NOT EXISTS (
  SELECT 1 FROM public.profiles WHERE id = auth.users.id
);
```

### Tabelas não aparecem
**Causa**: Script SQL não foi executado corretamente
**Solução**: Execute o script novamente

### Erro ao adicionar produto
**Causa**: SKU duplicado
**Solução**: Use um SKU diferente (ele deve ser único)

---

## 🆕 NOVAS FUNCIONALIDADES

### 1. Recuperação de Senha
- Usuário pode clicar em "Esqueci minha senha"
- Recebe email com link de recuperação
- Define nova senha

### 2. Segurança Melhorada
- Cada usuário tem seus próprios dados
- Row Level Security (RLS) impede acesso cruzado
- Autenticação gerenciada pelo Supabase

### 3. Notificações Persistentes
- Notificações salvas no localStorage por usuário
- Não são perdidas ao recarregar a página

---

## 🚀 PRÓXIMOS PASSOS (OPCIONAL)

### 1. Configurar Email Personalizado
1. Vá em **"Authentication"** → **"Email Templates"**
2. Configure provedor (SendGrid, AWS SES, etc.)
3. Personalize templates de email

### 2. Deploy em Produção
1. Faça build do projeto: `npm run build`
2. Faça deploy (Vercel, Netlify, etc.)
3. Atualize as URLs no Supabase com a URL de produção

### 3. Backups
1. Vá em **"Database"** → **"Backups"**
2. Configure backups automáticos

---

## 📝 COMANDOS ÚTEIS

```bash
# Rodar em desenvolvimento
npm run dev

# Rodar servidor (não precisa mais!)
# cd server
# npm run dev

# Fazer build para produção
npm run build

# Visualizar build de produção
npm run preview
```

---

## ✨ O QUE MUDOU?

### Antes (Express + Prisma + SQLite)
- Servidor Express rodando em http://localhost:3001
- Banco SQLite local (dev.db)
- Autenticação manual com JWT
- API REST customizada
- Dados locais

### Agora (Supabase)
- Sem servidor Express (removido!)
- Banco PostgreSQL no Supabase (nuvem)
- Autenticação gerenciada pelo Supabase
- API gerada automaticamente
- Dados na nuvem, acessíveis de qualquer lugar
- Row Level Security (RLS) automático
- Realtime subscriptions disponíveis (para futuro)

---

## 🎉 BENEFÍCIOS DA MIGRAÇÃO

1. **Mais Simples**: Não precisa gerenciar servidor backend
2. **Mais Seguro**: RLS automático + Auth gerenciado
3. **Mais Rápido**: API otimizada do Supabase
4. **Escalável**: PostgreSQL na nuvem
5. **Grátis**: Plano gratuito generoso do Supabase
6. **Menos Código**: Menos arquivos para manter

---

## 📞 SUPORTE

Se algo não funcionar:
1. Verifique o console do navegador (F12)
2. Verifique os logs do Supabase (Dashboard → Logs)
3. Verifique se o `.env` tem as credenciais corretas
4. Verifique se executou o script SQL completo

---

**🎉 Parabéns! Seu sistema agora está rodando 100% no Supabase!**

