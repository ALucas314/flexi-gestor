# 📧 Configuração de Email para Reset de Senha

## ✅ O que foi implementado:

- ✅ Backend pronto para enviar emails
- ✅ Template de email profissional
- ✅ Token seguro (expira em 1 hora)
- ✅ Rotas da API funcionando

## 🔧 Como Configurar o Gmail:

### Passo 1: Criar Senha de App no Gmail

1. **Acesse**: https://myaccount.google.com/security

2. **Ative a verificação em 2 etapas** (se ainda não tiver):
   - Clique em "Verificação em duas etapas"
   - Siga o processo de ativação

3. **Crie uma senha de app**:
   - Ainda em "Segurança", procure por "Senhas de app"
   - Selecione "Email" e "Computador Windows"
   - Clique em "Gerar"
   - **Copie a senha gerada** (16 caracteres)

### Passo 2: Criar arquivo `.env`

Na **raiz do projeto**, crie um arquivo chamado `.env` com este conteúdo:

```env
# 📧 Configurações de Email
EMAIL_USER=seu-email@gmail.com
EMAIL_PASSWORD=xxxx xxxx xxxx xxxx

# 🌐 URL do Frontend
FRONTEND_URL=http://localhost:8082
```

**Substitua:**
- `seu-email@gmail.com` → Seu email do Gmail
- `xxxx xxxx xxxx xxxx` → A senha de app que você copiou

### Passo 3: Reiniciar o servidor

Pare o servidor (`Ctrl+C`) e rode novamente:
```bash
npm run dev:all
```

---

## 📧 Como Funciona:

### 1️⃣ Usuário Esquece a Senha:
- Clica em "Esqueci minha senha"
- Digite seu email
- Clica em "Enviar"

### 2️⃣ Sistema Envia Email:
- Gera token único e seguro
- Salva no banco com validade de 1 hora
- Envia email com link de reset

### 3️⃣ Usuário Recebe Email:
- Email com design profissional
- Link para resetar senha
- Válido por 1 hora

### 4️⃣ Usuário Redefine Senha:
- Clica no link do email
- Define nova senha
- Faz login normalmente

---

## 🧪 Testar Configuração:

Depois de configurar o `.env`, teste enviando um email de recuperação:

1. Abra: http://localhost:8082
2. Clique em "Esqueci minha senha"
3. Digite um email cadastrado
4. Verifique sua caixa de entrada

---

## ⚠️ Problemas Comuns:

### Email não chega:
- ✅ Verifique se ativou verificação em 2 etapas
- ✅ Use senha de app, não sua senha normal
- ✅ Verifique a caixa de SPAM
- ✅ Confirme que o email está correto no `.env`

### Erro "Invalid login":
- ✅ Senha de app está correta?
- ✅ Copiou sem espaços?
- ✅ Verificação em 2 etapas está ativa?

### Token expirado:
- Tokens expiram em 1 hora
- Solicite um novo link de recuperação

---

## 🎯 Rotas da API:

```
POST /api/auth/forgot-password
Body: { "email": "user@example.com" }

POST /api/auth/reset-password
Body: { "token": "xxx", "newPassword": "newpass" }

GET /api/auth/validate-reset-token/:token
```

---

## 📚 Alternativas ao Gmail:

Se preferir outro serviço, edite `server/src/services/emailService.ts`:

### SendGrid:
```javascript
service: 'SendGrid',
auth: {
  user: 'apikey',
  pass: process.env.SENDGRID_API_KEY
}
```

### Outlook/Hotmail:
```javascript
service: 'hotmail',
auth: {
  user: process.env.EMAIL_USER,
  pass: process.env.EMAIL_PASSWORD
}
```

### Servidor SMTP Custom:
```javascript
host: 'smtp.seuservidor.com',
port: 587,
secure: false,
auth: {
  user: process.env.EMAIL_USER,
  pass: process.env.EMAIL_PASSWORD
}
```

---

## ✅ Pronto!

Após configurar, o sistema estará 100% funcional com recuperação de senha por email! 🎉

