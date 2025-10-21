# 🚀 Deploy do Flexi Gestor no Netlify

Este guia mostra como fazer o deploy completo da aplicação no Netlify usando apenas o Supabase como backend (sem servidor próprio).

## 🎯 Arquitetura

```
┌─────────────────┐
│   Navegador     │
│   (Frontend)    │
└────────┬────────┘
         │
         ├─────────────────────────────────┐
         │                                 │
         ▼                                 ▼
┌─────────────────┐              ┌─────────────────┐
│    Netlify      │              │    Supabase     │
│   (Hosting)     │              │   (Backend)     │
│                 │              │                 │
│ • React App     │              │ • PostgreSQL    │
│ • Vite Build    │──────────────▶ • Auth          │
│ • CDN Global    │   API REST   │ • Storage       │
└─────────────────┘              │ • RLS           │
                                 └─────────────────┘
```

## ✅ Pré-requisitos

- [x] Conta no [Netlify](https://netlify.com) (gratuita)
- [x] Conta no [GitHub](https://github.com) (para conectar o código)
- [x] Banco de dados Supabase já configurado
- [x] Código no GitHub (fazer push do projeto)

---

## 📋 Passo a Passo

### 1️⃣ Preparar o Código para o GitHub

Se ainda não fez push do código para o GitHub:

```bash
# Inicializar git (se não tiver)
git init

# Adicionar todos os arquivos
git add .

# Fazer commit
git commit -m "🚀 Preparar para deploy no Netlify"

# Criar repositório no GitHub e conectar
git remote add origin https://github.com/SEU-USUARIO/flexi-gestor.git
git branch -M main
git push -u origin main
```

### 2️⃣ Conectar ao Netlify

1. **Acesse [Netlify](https://app.netlify.com)**
2. Clique em **"Add new site"** ou **"Import from Git"**
3. Escolha **GitHub** como provedor
4. Autorize o Netlify a acessar seus repositórios
5. Selecione o repositório **flexi-gestor**

### 3️⃣ Configurar o Build

O Netlify vai detectar automaticamente as configurações do arquivo `netlify.toml`, mas confirme:

**Build settings:**
- **Build command:** `npm run build`
- **Publish directory:** `dist`
- **Branch to deploy:** `main`

### 4️⃣ Configurar Variáveis de Ambiente

⚠️ **MUITO IMPORTANTE!** Configure as variáveis de ambiente do Supabase:

1. No painel do Netlify, vá em **Site settings** → **Environment variables**
2. Clique em **"Add a variable"**
3. Adicione estas duas variáveis:

**Variável 1:**
```
Key: VITE_SUPABASE_URL
Value: https://ujohzrebqzeochsozmac.supabase.co
```

**Variável 2:**
```
Key: VITE_SUPABASE_ANON_KEY
Value: eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InVqb2h6cmVicXplb2Noc296bWFjIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjA5NjQ0NzMsImV4cCI6MjA3NjU0MDQ3M30.UJL2gcSARkCa5TVOhgF74s4e7lvUIT64-muKRtl8_fQ
```

💡 **Dica:** Para pegar suas próprias credenciais:
- Vá no [Supabase Dashboard](https://supabase.com/dashboard)
- Settings → API
- Copie a **URL** e a **anon public key**

### 5️⃣ Fazer o Deploy

1. Clique em **"Deploy site"**
2. Aguarde o build (leva 2-5 minutos)
3. Quando terminar, você verá: **"Site is live"** ✅

### 6️⃣ Acessar a Aplicação

Seu site estará disponível em uma URL tipo:
```
https://seu-site-aleatorio.netlify.app
```

**Você pode personalizar a URL:**
1. Site settings → Domain management
2. Options → Edit site name
3. Escolha um nome: `flexi-gestor.netlify.app`

---

## 🔧 Configurações Importantes

### Permitir Supabase no Netlify

O arquivo `netlify.toml` já configura isso, mas verifique:

```toml
Content-Security-Policy = "connect-src 'self' https://ujohzrebqzeochsozmac.supabase.co"
```

### Configurar Redirect Rules (SPA)

Já configurado no `netlify.toml`:
```toml
[[redirects]]
  from = "/*"
  to = "/index.html"
  status = 200
```

Isso garante que o React Router funcione corretamente.

---

## 🔐 Segurança no Supabase

### Adicionar URL do Netlify no Supabase

1. **Vá no Supabase Dashboard**
2. **Authentication** → **URL Configuration**
3. **Site URL:** Cole a URL do Netlify: `https://seu-site.netlify.app`
4. **Redirect URLs:** Adicione:
   - `https://seu-site.netlify.app/**`
   - `https://seu-site.netlify.app/reset-password`

Isso permite que o Supabase Auth funcione corretamente.

---

## 🚀 Deploy Automático

Toda vez que você fizer um **git push** para o GitHub, o Netlify vai:
1. Detectar automaticamente a mudança
2. Fazer o build
3. Fazer o deploy
4. Atualizar o site (em ~2 minutos)

### Preview Deploys

O Netlify cria automaticamente **Preview Deploys** para:
- ✅ Cada Pull Request
- ✅ Cada branch

Isso permite testar mudanças antes de ir para produção!

---

## 📊 Monitoramento

### Ver Logs de Build

1. Netlify Dashboard → **Deploys**
2. Clique no deploy
3. Veja os **Deploy logs**

### Ver Logs de Funções (se adicionar no futuro)

1. Netlify Dashboard → **Functions**
2. Clique na função
3. Veja os **Function logs**

---

## ⚡ Performance

Com Netlify + Supabase você tem:

✅ **CDN Global:** Site replicado em 100+ localizações
✅ **HTTPS Automático:** SSL grátis
✅ **Cache Inteligente:** Assets cacheados por 1 ano
✅ **Gzip/Brotli:** Compressão automática
✅ **HTTP/2:** Protocolo moderno
✅ **Prerendering:** Páginas otimizadas

---

## 🆓 Plano Gratuito

O plano gratuito do Netlify inclui:
- ✅ 100 GB de bandwidth/mês
- ✅ 300 minutos de build/mês
- ✅ Deploys ilimitados
- ✅ HTTPS grátis
- ✅ Preview deploys
- ✅ Rollback instantâneo

**Perfeito para o Flexi Gestor!** 🎉

---

## 🔄 Atualizar a Aplicação

### Fazer mudanças:

```bash
# 1. Fazer alterações no código
# 2. Commitar
git add .
git commit -m "✨ Nova funcionalidade"

# 3. Fazer push
git push origin main

# 4. Netlify detecta e faz deploy automático!
```

### Rollback (se algo der errado):

1. Netlify Dashboard → **Deploys**
2. Encontre um deploy anterior funcionando
3. Clique nos **"..."** → **"Publish deploy"**
4. Pronto! Site volta ao estado anterior

---

## 🐛 Solução de Problemas

### Build falhou?

**Erro:** `Module not found`
- **Solução:** Certifique-se de que todas as dependências estão no `package.json`

**Erro:** `Environment variable not found`
- **Solução:** Adicione as variáveis em Site Settings → Environment variables

**Erro:** `Command failed: npm run build`
- **Solução:** Teste o build localmente: `npm run build`

### Site carregou mas não funciona?

**Problema:** Rotas não funcionam (404)
- **Solução:** Verifique se o `netlify.toml` tem os redirects corretos

**Problema:** Não conecta com Supabase
- **Solução:** Verifique as variáveis de ambiente no Netlify

**Problema:** Login não funciona
- **Solução:** Adicione a URL do Netlify nas configurações do Supabase Auth

---

## 📱 Testar em Produção

Depois do deploy:

1. ✅ Criar uma conta nova
2. ✅ Fazer login
3. ✅ Criar produtos
4. ✅ Registrar entradas/saídas
5. ✅ Ver relatórios
6. ✅ Testar em mobile (responsivo)
7. ✅ Verificar dados no Supabase

---

## 🎉 Pronto!

Sua aplicação está no ar com:
- ✅ Frontend no Netlify (CDN Global)
- ✅ Backend no Supabase (PostgreSQL + Auth)
- ✅ HTTPS automático
- ✅ Deploy automático
- ✅ Zero servidores para gerenciar

**Arquitetura Serverless Completa!** 🚀

---

## 📚 Links Úteis

- [Netlify Dashboard](https://app.netlify.com)
- [Supabase Dashboard](https://supabase.com/dashboard)
- [Documentação do Netlify](https://docs.netlify.com)
- [Documentação do Supabase](https://supabase.com/docs)

---

**Dúvidas?** Confira os logs de build no Netlify ou os logs no Supabase!

