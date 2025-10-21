# ⚡ INÍCIO RÁPIDO - SUPABASE

## 🎯 O QUE VOCÊ PRECISA FAZER AGORA

### 1️⃣ Executar o SQL no Supabase (2 minutos)

1. Abra seu projeto Supabase: https://supabase.com/dashboard/project/ujohzrebqzeochsozmac
2. Clique em **"SQL Editor"** (ícone de </> no menu lateral)
3. Clique em **"+ New Query"**
4. Copie TUDO do arquivo **`supabase-schema.sql`** e cole lá
5. Clique em **"Run"** ou pressione `Ctrl + Enter`
6. ✅ Aguarde ver "Success. No rows returned"

### 2️⃣ Desabilitar Confirmação de Email (1 minuto)

1. Clique em **"Authentication"** (ícone de 🔐 no menu lateral)
2. Clique em **"Providers"**
3. Clique em **"Email"** (o primeiro da lista)
4. **DESMARQUE** a caixinha: **"Confirm email"**
5. Role até o final e clique em **"Save"**

### 3️⃣ Configurar URLs de Redirecionamento (1 minuto)

1. Ainda em **"Authentication"**
2. Clique em **"URL Configuration"**
3. Em **"Site URL"**, coloque: `http://localhost:5173`
4. Em **"Redirect URLs"**, adicione estas 3 linhas (uma por vez):
   ```
   http://localhost:5173
   http://localhost:5173/reset-password
   http://localhost:5173/*
   ```
5. Clique em **"Save"**

### 4️⃣ Rodar o Sistema

No terminal:
```bash
npm run dev
```

### 5️⃣ Criar Sua Conta

1. Acesse: http://localhost:5173/login
2. Clique na aba **"Registrar"**
3. Preencha:
   - **Nome Completo**: Seu nome
   - **Email**: seu@email.com
   - **Usuário**: qualquer nome de usuário
   - **Senha**: mínimo 6 caracteres
   - **Confirmar**: mesma senha
4. Clique em **"Criar Nova Conta"**
5. 🎉 **PRONTO!** Você está logado!

---

## ✅ O que já está funcionando:

- ✅ Login
- ✅ Registro de novos usuários
- ✅ Logout
- ✅ Recuperação de senha (esqueci minha senha)
- ✅ Alteração de senha
- ✅ Perfil do usuário
- ✅ Banco de dados PostgreSQL no Supabase
- ✅ Segurança (RLS) - cada usuário vê apenas seus dados

## 🚧 Próxima etapa:

Migrar as funcionalidades de:
- Produtos
- Entradas
- Saídas
- Movimentações
- Relatórios
- PDV

Tudo para usar o Supabase ao invés do servidor Express!

---

## ⚠️ Se der erro "Invalid login credentials"

Isso significa que você precisa criar um usuário primeiro. Duas formas:

**Forma 1: Via Aplicação (Recomendado)**
- Clique em "Registrar" e crie sua conta

**Forma 2: Via Supabase Dashboard**
1. No Supabase, vá em **"Authentication"** → **"Users"**
2. Clique em **"Add user"** → **"Create new user"**
3. Preencha email e senha
4. ✅ **MARQUE**: "Auto Confirm User"
5. Clique em **"Create user"**

