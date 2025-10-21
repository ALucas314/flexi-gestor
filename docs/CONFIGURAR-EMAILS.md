# 📧 Configurar Emails Bonitos no Supabase

## 🎯 Guia Rápido (3 minutos)

### 1️⃣ Acesse o Supabase

1. Entre em [app.supabase.com](https://app.supabase.com)
2. Selecione o projeto **Flexi Gestor**
3. Menu lateral → **Authentication**
4. Aba **Email Templates**

---

### 2️⃣ Template: Reset Password (Recuperar Senha)

**O mais importante!** Este é o email que o usuário recebe ao clicar "Esqueci minha senha".

#### Configuração:

1. Clique em **"Reset Password"** na lista
2. **Subject (Assunto):** Cole isso:
   ```
   🔐 Recupere sua senha - Flexi Gestor
   ```

3. **Message Body (HTML):** Abra o arquivo `docs/templates-email-supabase.md` e copie o template completo

4. Clique em **Save**

---

### 3️⃣ Template: Confirm Signup (Confirmar Cadastro)

1. Clique em **"Confirm Signup"**
2. **Subject:**
   ```
   🎉 Bem-vindo ao Flexi Gestor! Confirme seu email
   ```

3. **Message Body (HTML):** Cole o template de "Confirmação de Cadastro" do arquivo

4. Clique em **Save**

---

### 4️⃣ Testar

1. Vá na aplicação: `http://localhost:8080`
2. Clique em **"Esqueci minha senha"**
3. Digite seu email
4. **Verifique sua caixa de entrada**

Você deve receber um email **LINDO** assim:

```
╔═══════════════════════════════════╗
║                                   ║
║            🔐 (ícone)            ║
║                                   ║
║       🚀 Flexi Gestor            ║
║   Sistema de Gestão Empresarial  ║
║                                   ║
╠═══════════════════════════════════╣
║                                   ║
║   🔑 Recuperação de Senha         ║
║                                   ║
║   Olá! 👋                         ║
║                                   ║
║   Recebemos uma solicitação...    ║
║                                   ║
║   ┌─────────────────────┐        ║
║   │ 🔐 Redefinir Senha  │        ║
║   └─────────────────────┘        ║
║                                   ║
║   ⏰ Link válido por 1 hora      ║
║                                   ║
╚═══════════════════════════════════╝
```

---

## 🎨 Tema do Email

Os emails usam as mesmas cores do site:

- 🟣 **Roxo/Azul:** Gradiente principal
- ⚪ **Branco:** Fundo do card
- 🔵 **Azul claro:** Destaques
- 💚 **Verde:** Ações positivas

---

## ⚙️ Configurações Extras

### Desabilitar Confirmação de Email (Opcional)

Se quiser que usuários façam login imediatamente sem confirmar email:

1. **Authentication** → **Settings**
2. **Email Auth** → Desmarque **"Enable email confirmations"**
3. Save

⚠️ Não recomendado para produção!

### Configurar SMTP Customizado (Opcional)

Para usar seu próprio servidor de email:

1. **Authentication** → **Settings**
2. **SMTP Settings**
3. Configure seu provedor (Gmail, SendGrid, etc)

---

## 📱 Pré-visualização

Antes de salvar, você pode:

1. Clicar em **"Preview"** no Supabase
2. Ver como o email ficará

---

## ✅ Checklist

- [ ] Template "Reset Password" configurado
- [ ] Template "Confirm Signup" configurado  
- [ ] Template "Invite User" configurado
- [ ] Template "Change Email" configurado
- [ ] Subject (Assunto) em português
- [ ] Testado enviando email de recuperação

---

## 🎉 Pronto!

Agora seus emails estão:

✅ **Bonitos** - Design profissional  
✅ **Em português** - Totalmente traduzido  
✅ **Com tema do site** - Roxo/Azul gradiente  
✅ **Responsivos** - Funcionam em todos dispositivos  
✅ **Profissionais** - Impressionam os usuários  

---

**Vá configurar agora no Supabase!** 🚀

**Arquivo completo:** `docs/templates-email-supabase.md`

