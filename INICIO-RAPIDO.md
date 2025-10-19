# 🚀 Início Rápido - Flexi Gestor com Prisma

## ✅ Sistema já configurado e rodando!

### 📊 Configuração Atual:
- **Banco de dados**: SQLite Local (arquivo `prisma/dev.db`)
- **Autenticação**: JWT (tokens de 30 dias)
- **Backend**: Express + Prisma (porta 3001)
- **Frontend**: React + Vite (porta 8080)

---

## 🎯 Passo a Passo (3 minutos):

### 1️⃣ Sistema está rodando?
Você já executou `npm run dev:all`

Aguarde ver no terminal:
```
✔ Backend rodando em http://localhost:3001
✔ Frontend rodando em http://localhost:8080
```

### 2️⃣ Criar usuário administrador

**Abra um NOVO terminal** (PowerShell) e execute:
```powershell
.\criar-usuario.ps1
```

**OU manualmente via cURL:**
```bash
curl -X POST http://localhost:3001/api/auth/register -H "Content-Type: application/json" -d "{\"username\":\"admin\",\"email\":\"admin@flexi.com\",\"password\":\"admin123\",\"name\":\"Administrador\",\"role\":\"admin\"}"
```

### 3️⃣ Acessar o sistema

Abra o navegador:
```
http://localhost:8080
```

**Credenciais:**
- Email: `admin@flexi.com`
- Senha: `admin123`

---

## ✅ Funcionalidades Disponíveis:

✅ Login com email e senha
✅ Registro de novos usuários
✅ **Trocar senha** (funcionando!)
✅ Cadastro de produtos
✅ Movimentações de entrada/saída
✅ Notificações
✅ Dashboard com estatísticas

---

## 🔧 Comandos Úteis:

### Ver/Editar banco de dados visualmente:
```bash
npx prisma studio
```
Abre em: http://localhost:5555

### Parar os servidores:
Pressione `Ctrl+C` no terminal onde rodou `npm run dev:all`

### Reiniciar tudo:
```bash
npm run dev:all
```

---

## ❓ Perguntas Frequentes:

### Preciso criar conta no Prisma Cloud?
**NÃO!** O sistema usa SQLite local, totalmente gratuito e offline.

### Onde ficam meus dados?
No arquivo `prisma/dev.db` (faça backup dele!)

### Como trocar senha?
Entre no sistema → Menu → **Alterar Senha**

### Como adicionar mais usuários?
Dois jeitos:
1. Página de registro (se habilitada)
2. Via API: `POST http://localhost:3001/api/auth/register`

---

## 📱 Portas Usadas:

| Serviço | Porta | URL |
|---------|-------|-----|
| Frontend | 8080 | http://localhost:8080 |
| Backend API | 3001 | http://localhost:3001 |
| Prisma Studio | 5555 | http://localhost:5555 |

---

## 🎉 Pronto!

Você tem um sistema completo de gestão de estoque com:
- ✅ Autenticação segura (JWT)
- ✅ Banco de dados local (SQLite)
- ✅ API REST completa
- ✅ Interface moderna

**Nada de Firebase, nada de contas na nuvem, tudo local e gratuito!** 🚀

---

## 📝 Próximos Passos:

1. ✅ Fazer login
2. ✅ Adicionar seus primeiros produtos
3. ✅ Testar movimentações
4. ✅ Explorar o dashboard
5. 🎯 Trocar sua senha!

---

**💡 Dica:** Abra o Prisma Studio (`npx prisma studio`) para ver seus dados em tempo real enquanto usa o sistema!

