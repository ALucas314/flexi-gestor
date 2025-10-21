# 🚀 Início Rápido - Flexi Gestor com Supabase

## ✅ Sistema configurado e pronto para usar!

### 📊 Configuração Atual:
- **Banco de dados**: PostgreSQL no Supabase (nuvem)
- **Autenticação**: Supabase Auth (seguro e gerenciado)
- **Backend**: Supabase API (automático)
- **Frontend**: React + Vite (porta 5173)

---

## 🎯 Passo a Passo (5 minutos):

### 1️⃣ Criar conta no Supabase (GRATUITO)

Se ainda não tem conta:
1. Acesse: https://supabase.com
2. Clique em **"Start your project"**
3. Faça login com GitHub (recomendado) ou email
4. Crie um novo projeto:
   - **Nome**: flexi-gestor
   - **Senha do banco**: anote essa senha!
   - **Região**: South America (São Paulo)
5. Aguarde 2 minutos enquanto o projeto é criado

### 2️⃣ Executar o SQL no Supabase (2 minutos)

1. No dashboard do seu projeto, clique em **"SQL Editor"** (ícone </> no menu lateral)
2. Clique em **"+ New Query"**
3. Abra o arquivo **`docs/supabase-schema.sql`** deste projeto
4. Copie TUDO e cole no SQL Editor
5. Clique em **"Run"** ou pressione `Ctrl + Enter`
6. ✅ Aguarde ver "Success. No rows returned"

### 3️⃣ Configurar Autenticação (1 minuto)

1. No Supabase, clique em **"Authentication"** → **"Providers"**
2. Clique em **"Email"** (primeiro da lista)
3. **DESMARQUE** a opção: **"Confirm email"**
4. Role até o final e clique em **"Save"**

### 4️⃣ Configurar URLs de Redirecionamento (1 minuto)

1. Ainda em **"Authentication"** → **"URL Configuration"**
2. Em **"Site URL"**: `http://localhost:5173`
3. Em **"Redirect URLs"**, adicione (uma por linha, clicando "Add URL" entre cada):
   ```
   http://localhost:5173
   http://localhost:5173/reset-password
   http://localhost:5173/*
   ```
4. Clique em **"Save"**

### 5️⃣ Configurar variáveis de ambiente

1. No Supabase, clique em **"Project Settings"** (ícone ⚙️)
2. Clique em **"API"**
3. Copie os valores de:
   - **Project URL** (algo como: https://xxx.supabase.co)
   - **anon public** key (uma chave longa)

4. No seu projeto, crie um arquivo **`.env`** na raiz (mesma pasta do package.json):
   ```env
   VITE_SUPABASE_URL=cole_a_project_url_aqui
   VITE_SUPABASE_ANON_KEY=cole_a_anon_key_aqui
   ```

### 6️⃣ Instalar dependências e rodar

No terminal:
```bash
# Instalar dependências (se ainda não instalou)
npm install

# Rodar o sistema
npm run dev
```

Aguarde ver:
```
➜  Local:   http://localhost:5173/
```

### 7️⃣ Criar sua primeira conta

1. Abra o navegador em: http://localhost:5173
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

## ✅ Funcionalidades Disponíveis:

✅ Login com email e senha  
✅ Registro de novos usuários  
✅ **Recuperar senha** (esqueci minha senha)  
✅ **Trocar senha** (dentro do sistema)  
✅ Cadastro de produtos  
✅ Movimentações de entrada/saída  
✅ Gerenciamento de lotes  
✅ Notificações  
✅ Dashboard com estatísticas  
✅ Relatórios financeiros  
✅ PDV (Ponto de Venda)  

---

## 🔧 Comandos Úteis:

### Rodar em desenvolvimento:
```bash
npm run dev
```

### Ver dados no Supabase:
1. Acesse seu projeto no Supabase
2. Clique em **"Table Editor"**
3. Selecione a tabela que quer ver (products, movements, batches, etc.)

### Parar o servidor:
Pressione `Ctrl+C` no terminal

### Fazer build para produção:
```bash
npm run build
```

---

## ❓ Perguntas Frequentes:

### Preciso pagar pelo Supabase?
**NÃO!** O plano gratuito é muito generoso:
- 500 MB de banco de dados
- 1 GB de armazenamento de arquivos
- 50.000 usuários ativos mensais
- 2 GB de largura de banda

### Onde ficam meus dados?
No banco de dados PostgreSQL do Supabase (na nuvem, seguro e com backup automático)

### Como trocar senha?
Entre no sistema → Menu → **Alterar Senha**

### Como adicionar mais usuários?
Cada pessoa pode criar sua própria conta na tela de registro.  
Cada usuário verá apenas seus próprios dados (isolamento automático).

### Esqueci minha senha, e agora?
1. Na tela de login, clique em **"Esqueci minha senha"**
2. Digite seu email
3. Verifique sua caixa de entrada
4. Clique no link e defina nova senha

---

## 📱 Portas Usadas:

| Serviço | Porta | URL |
|---------|-------|-----|
| Frontend | 5173 | http://localhost:5173 |
| Supabase API | - | Automático (nuvem) |

---

## 🎉 Pronto!

Você tem um sistema completo de gestão de estoque com:
- ✅ Autenticação segura (Supabase Auth)
- ✅ Banco de dados na nuvem (PostgreSQL)
- ✅ API REST automática
- ✅ Interface moderna e responsiva
- ✅ Segurança (RLS - cada usuário vê apenas seus dados)

**Sem servidor local, sem banco SQLite, tudo na nuvem e gratuito!** 🚀

---

## 📝 Próximos Passos:

1. ✅ Fazer login
2. ✅ Adicionar seus primeiros produtos
3. ✅ Testar movimentações de entrada/saída
4. ✅ Explorar o dashboard
5. ✅ Criar alguns lotes de produtos
6. 🎯 Experimentar o PDV (Ponto de Venda)

---

## ⚠️ Problemas Comuns:

### "Invalid login credentials"
**Causa**: Email ou senha incorretos, ou usuário não existe  
**Solução**: Crie uma conta nova ou use "Esqueci minha senha"

### Tela branca ou erro no console
**Causa**: Variáveis de ambiente não configuradas  
**Solução**: Verifique se o arquivo `.env` existe e tem as credenciais corretas

### "Failed to fetch"
**Causa**: URL do Supabase incorreta  
**Solução**: Verifique a URL no `.env` (deve começar com https://)

### Dados não aparecem
**Causa**: Script SQL não foi executado  
**Solução**: Execute o `supabase-schema.sql` novamente no SQL Editor

---

**💡 Dica:** Explore o dashboard do Supabase para ver seus dados em tempo real, configurar backups, ver logs e muito mais!

---

**📚 Documentação completa:** Veja `docs/GUIA-FINAL-SUPABASE.md` para mais detalhes técnicos.
