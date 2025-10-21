# 🚀 Deploy Rápido - Flexi Gestor

## Arquitetura Serverless

```
Frontend (Netlify) ──────▶ Backend (Supabase)
  React + Vite              PostgreSQL + Auth
  CDN Global                RLS + Storage
  HTTPS Auto                API REST
```

**Sem servidor backend próprio! Tudo serverless!** ✨

---

## ⚡ Deploy em 5 Minutos

### 1️⃣ Push para GitHub

```bash
git add .
git commit -m "🚀 Deploy to Netlify"
git push origin main
```

### 2️⃣ Conectar ao Netlify

1. Vá em [netlify.com](https://netlify.com)
2. **"Add new site"** → **"Import from Git"**
3. Selecione seu repositório
4. Deploy! ✅

### 3️⃣ Configurar Variáveis de Ambiente

No Netlify → **Site Settings** → **Environment Variables**:

```
VITE_SUPABASE_URL = https://ujohzrebqzeochsozmac.supabase.co
VITE_SUPABASE_ANON_KEY = eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
```

### 4️⃣ Configurar Supabase

No Supabase → **Authentication** → **URL Configuration**:

```
Site URL: https://seu-site.netlify.app
Redirect URLs: https://seu-site.netlify.app/**
```

---

## ✅ Pronto!

Seu site está no ar em: `https://seu-site.netlify.app`

---

## 📚 Guia Completo

Veja o guia detalhado: [`docs/DEPLOY-NETLIFY.md`](docs/DEPLOY-NETLIFY.md)

---

## 🔄 Atualizar

Toda vez que fizer `git push`, o Netlify atualiza automaticamente!

```bash
# Fazer mudanças
git add .
git commit -m "✨ Nova feature"
git push

# Netlify detecta e faz deploy automático! 🚀
```

---

## 🆓 Custos

- **Netlify:** Grátis (100GB/mês)
- **Supabase:** Grátis (500MB database)

**Total: R$ 0,00/mês** 🎉

---

## 🛠️ Build Local

Testar antes de fazer deploy:

```bash
npm run build
npm run preview
```

---

**Dúvidas?** Leia o guia completo em `docs/DEPLOY-NETLIFY.md`

