# 🔧 Configurar URLs do Netlify no Supabase

## 🎯 Problema

Quando você clica no botão "Redefinir Minha Senha" no email, o Supabase redireciona para `localhost` ao invés do seu domínio no Netlify.

## ✅ Solução

Configurar as URLs corretas no Supabase Authentication.

---

## 📋 Passo a Passo

### 1️⃣ **Acesse o Supabase Dashboard**

```
https://supabase.com/dashboard
```

### 2️⃣ **Navegue até URL Configuration**

```
Authentication → URL Configuration
```

### 3️⃣ **Configure as URLs**

#### **Site URL:**
Esta é a URL principal da sua aplicação.

```
https://flexigestor.netlify.app
```

#### **Redirect URLs:**
Estas são as URLs permitidas para redirecionamento após ações de autenticação (login, reset password, etc.)

Adicione **TODAS** estas URLs (uma por linha):

```
https://flexigestor.netlify.app/**
https://flexigestor.netlify.app/reset-password
https://flexigestor.netlify.app/login
http://localhost:5173/**
http://localhost:5173/reset-password
http://localhost:5173/login
```

> 💡 **Nota:** O `**` permite qualquer caminho depois da URL base. Isso é útil para rotas dinâmicas.

> 💡 **Localhost:** Mantemos o localhost para desenvolvimento local.

### 4️⃣ **Salvar Configurações**

Role a página até o final e clique no botão **"Save"** (Salvar).

⚠️ **Importante:** As mudanças são aplicadas imediatamente, mas emails já enviados continuarão usando a URL antiga.

---

## 🧪 Testar a Correção

### **1. Solicite um novo reset de senha:**

1. Acesse: `https://flexigestor.netlify.app`
2. Clique em **"Esqueci minha senha"**
3. Digite seu email
4. Clique em **"Enviar link de recuperação"**

### **2. Verifique o email:**

Você receberá o email com o template do Flexi Gestor.

### **3. Clique no botão:**

Clique em **"🔐 Redefinir Minha Senha"**

### **4. Verificar redirecionamento:**

Agora você deve ser redirecionado para:
```
https://flexigestor.netlify.app/reset-password?token=...
```

✅ **Se funcionou:** A página de redefinição de senha vai aparecer!

❌ **Se ainda não funcionou:** Verifique se salvou as configurações no Supabase.

---

## 🔍 Explicação Técnica

### **O que acontecia antes:**

```
Email → Clique no botão → Redirect para: http://localhost:5173/reset-password
```

❌ Isso não funciona em produção porque `localhost` só existe no seu computador.

### **O que acontece agora:**

```
Email → Clique no botão → Redirect para: https://flexigestor.netlify.app/reset-password
```

✅ Funciona em produção porque o Netlify está hospedando sua aplicação nesta URL.

---

## 🌐 URLs Importantes

### **Produção (Netlify):**
- Site principal: `https://flexigestor.netlify.app`
- Login: `https://flexigestor.netlify.app/login`
- Reset password: `https://flexigestor.netlify.app/reset-password`

### **Desenvolvimento (Local):**
- Site principal: `http://localhost:5173`
- Login: `http://localhost:5173/login`
- Reset password: `http://localhost:5173/reset-password`

---

## 🔐 Outras Configurações Importantes

### **Email Rate Limits** (Opcional)

Se quiser limitar quantos emails um usuário pode solicitar:

1. Authentication → Settings
2. **Rate Limits:**
   - Email rate limit: `3` emails por hora
   - SMS rate limit: `3` SMS por hora

### **Email Templates** (Já configurado! ✅)

Você já configurou os templates bonitos em português:
- Reset Password ✅
- Confirm Signup ✅
- Magic Link ✅

---

## 🚨 Problemas Comuns

### **Ainda redireciona para localhost:**

1. **Causa:** Cache do navegador ou email antigo
2. **Solução:** 
   - Limpe o cache do navegador (Ctrl+Shift+Del)
   - Solicite um **novo** reset de senha
   - Use uma aba anônima/privada

### **Erro 404 na página de reset:**

1. **Causa:** Página não existe no Netlify
2. **Solução:** 
   - Verifique se o arquivo `netlify.toml` tem os redirects corretos
   - Verifique se a rota `/reset-password` existe no `src/App.tsx`

### **Token inválido ou expirado:**

1. **Causa:** Token expira em 1 hora
2. **Solução:** Solicite um novo reset de senha

---

## 📝 Checklist Final

Antes de considerar tudo configurado:

- [ ] Site URL configurada: `https://flexigestor.netlify.app`
- [ ] Redirect URLs adicionadas (todas as 6 URLs)
- [ ] Configurações salvas no Supabase
- [ ] Testado o fluxo completo de reset de senha
- [ ] Email com template bonito recebido
- [ ] Redirecionamento funcionando (não vai para localhost)
- [ ] Consegue redefinir a senha com sucesso

---

## 🎉 Pronto!

Agora o fluxo completo de recuperação de senha está funcionando em produção! 🚀

### **Fluxo Completo:**

```
1. Usuário esquece senha
   ↓
2. Clica em "Esqueci minha senha"
   ↓
3. Digite email
   ↓
4. Recebe email bonito com template do Flexi Gestor
   ↓
5. Clica em "Redefinir Minha Senha"
   ↓
6. É redirecionado para: https://flexigestor.netlify.app/reset-password
   ↓
7. Define nova senha
   ↓
8. Faz login com a nova senha
   ↓
9. ✅ SUCESSO!
```

---

## 📚 Links Úteis

- [Supabase Dashboard](https://supabase.com/dashboard)
- [Netlify Dashboard](https://app.netlify.com)
- [Documentação Supabase Auth URLs](https://supabase.com/docs/guides/auth/redirect-urls)

---

**Dúvidas?** Verifique se todas as URLs estão corretas e salvas no Supabase!


