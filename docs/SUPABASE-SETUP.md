# 🚀 GUIA DE CONFIGURAÇÃO DO SUPABASE

## 📋 Passo 1: Executar Script SQL no Supabase

1. Acesse seu projeto no Supabase: https://supabase.com/dashboard
2. No menu lateral, clique em **"SQL Editor"**
3. Clique em **"New Query"**
4. Copie e cole todo o conteúdo do arquivo `supabase-schema.sql`
5. Clique em **"Run"** (ou pressione Ctrl+Enter)
6. Aguarde até ver a mensagem de sucesso ✅

## 🔧 Passo 2: Configurar Autenticação no Supabase

### Desabilitar confirmação de email (para desenvolvimento)

1. No menu lateral, clique em **"Authentication"**
2. Clique em **"Providers"**
3. Clique em **"Email"**
4. **DESMARQUE** a opção: "Confirm email"
5. Clique em **"Save"**

### Configurar URL de redirecionamento

1. Ainda em **"Authentication"** → **"URL Configuration"**
2. Em **"Site URL"**, adicione: `http://localhost:5173`
3. Em **"Redirect URLs"**, adicione:
   - `http://localhost:5173`
   - `http://localhost:5173/reset-password`
   - `http://localhost:5173/*`
4. Clique em **"Save"**

## 📧 Passo 3: Configurar Email (OPCIONAL - para recuperação de senha)

### Para desenvolvimento rápido (não configurar agora):
- O Supabase já tem um servidor de email de desenvolvimento
- Você pode testar recuperação de senha mais tarde

### Para produção (configurar depois):
1. Vá em **"Authentication"** → **"Email Templates"**
2. Configure seu provedor de email (SendGrid, AWS SES, etc.)

## ✅ Passo 4: Criar seu primeiro usuário

### Método 1: Via Registro na Aplicação
1. Rode o sistema: `npm run dev`
2. Acesse: http://localhost:5173/login
3. Clique em **"Registrar"**
4. Preencha os dados e crie sua conta
5. Pronto! Você já está logado ✅

### Método 2: Via Dashboard do Supabase
1. No Supabase, vá em **"Authentication"** → **"Users"**
2. Clique em **"Add user"** → **"Create new user"**
3. Preencha:
   - **Email**: seu email
   - **Password**: sua senha (mínimo 6 caracteres)
   - **Auto Confirm User**: ✅ MARQUE esta opção
4. Clique em **"Create user"**
5. Agora você pode fazer login com esse email/senha!

## 🎯 Passo 5: Verificar se está funcionando

1. Acesse: http://localhost:5173/login
2. Faça login com o usuário criado
3. Se aparecer o Dashboard, está tudo funcionando! 🎉

## 🔍 Verificar dados no Supabase

### Ver tabelas criadas:
1. **"Table Editor"** → você verá:
   - `profiles` (perfis dos usuários)
   - `products` (produtos)
   - `batches` (lotes)
   - `movements` (movimentações)

### Ver políticas de segurança (RLS):
1. **"Table Editor"** → selecione uma tabela
2. Clique nos 3 pontinhos ⋮ → **"View Policies"**
3. Você verá as regras de segurança (cada usuário só vê seus próprios dados)

## ⚠️ Problemas Comuns

### "Invalid login credentials"
- Verifique se o email e senha estão corretos
- Se criou usuário pelo dashboard, marque "Auto Confirm User"

### "User not found" ou "Profile not found"
- O trigger automático pode não ter criado o perfil
- Vá em SQL Editor e execute:
```sql
INSERT INTO public.profiles (id, email, name)
SELECT id, email, raw_user_meta_data->>'name'
FROM auth.users
WHERE NOT EXISTS (
  SELECT 1 FROM public.profiles WHERE id = auth.users.id
);
```

### Tabelas não aparecem no Table Editor
- Execute o script SQL novamente
- Verifique se não houve erros na execução

## 📊 Próximos Passos

Após configurar o Supabase:
1. ✅ Sistema de autenticação funcionando
2. ✅ Recuperação de senha funcionando
3. ✅ Banco de dados configurado
4. ⏳ Próximo: Migrar dados de produtos/movimentações para o Supabase

---

## 🆘 Precisa de Ajuda?

Se algo não funcionar:
1. Verifique o console do navegador (F12)
2. Verifique os logs do Supabase (Dashboard → Logs)
3. Verifique se o arquivo `.env` tem as credenciais corretas

