# 🚀 Guia de Uso - Flexi Gestor com Prisma

## ✅ Migração Concluída!

O sistema foi migrado do Firebase para o Prisma com sucesso! Agora você tem:

### 📦 O que foi implementado:

1. **✅ Backend com Express + Prisma**
   - API REST completa
   - Banco de dados SQLite (arquivo `dev.db`)
   - Autenticação JWT (tokens que duram 30 dias)

2. **✅ Modelos do Prisma**
   - User (usuários)
   - Product (produtos)
   - Movement (movimentações)
   - Notification (notificações)

3. **✅ Rotas da API**
   - `/api/auth/login` - Login
   - `/api/auth/register` - Registro
   - `/api/auth/change-password` - Trocar senha
   - `/api/auth/profile` - Atualizar perfil
   - `/api/products` - CRUD de produtos
   - `/api/movements` - Movimentações
   - `/api/notifications` - Notificações

4. **✅ Contextos React Atualizados**
   - `AuthContext` - se conecta à API
   - `DataContext` - se conecta à API

---

## 🚀 Como Rodar o Sistema

### 1️⃣ Rodar Backend e Frontend Juntos

```bash
npm run dev:all
```

Isso vai iniciar:
- **Frontend**: `http://localhost:5173` (ou 8080)
- **Backend**: `http://localhost:3001`

### 2️⃣ Rodar Separadamente

**Backend (Terminal 1):**
```bash
npm run server
```

**Frontend (Terminal 2):**
```bash
npm run dev
```

---

## 👤 Criar Primeiro Usuário

Como o banco está vazio, você precisa criar um usuário. Existem 2 formas:

### Opção 1: Através da interface (Recomendado)

1. Abra o sistema no navegador
2. Na tela de login, clique em "Criar conta" (se existir)
3. Preencha os dados e registre

### Opção 2: Através da API (mais rápido)

Você pode usar uma ferramenta como **Postman** ou **cURL**:

```bash
curl -X POST http://localhost:3001/api/auth/register \
  -H "Content-Type: application/json" \
  -d '{
    "username": "admin",
    "email": "admin@flexi.com",
    "password": "admin123",
    "name": "Administrador",
    "role": "admin"
  }'
```

---

## 🔐 Trocar Senha

Agora você pode trocar senha através da página **Alterar Senha** ou pela API:

```bash
curl -X POST http://localhost:3001/api/auth/change-password \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer SEU_TOKEN_AQUI" \
  -d '{
    "currentPassword": "senha_atual",
    "newPassword": "nova_senha"
  }'
```

---

## 📊 Estrutura do Banco de Dados

**Arquivo:** `prisma/dev.db` (SQLite)

**Tabelas:**
- `User` - Usuários do sistema
- `Product` - Produtos do estoque
- `Movement` - Movimentações de entrada/saída
- `Notification` - Notificações do sistema

**Ver dados:** Você pode usar qualquer cliente SQLite ou rodar:
```bash
npx prisma studio
```

---

## 🔧 Comandos Úteis

### Prisma

```bash
# Ver/Editar dados no navegador
npx prisma studio

# Criar nova migration
npx prisma migrate dev --name nome_da_migration

# Gerar Prisma Client (após mudanças no schema)
npx prisma generate

# Reset do banco (CUIDADO: apaga tudo!)
npx prisma migrate reset
```

### Backend

```bash
# Rodar servidor
npm run server

# Ver logs do servidor
# Eles aparecem no terminal automaticamente
```

---

## 🐛 Solução de Problemas

### Backend não inicia
- Verifique se a porta 3001 está livre
- Rode: `npx prisma generate`

### Frontend não conecta
- Verifique se o backend está rodando
- Confirme a URL da API em `src/lib/api.ts`

### Dados não aparecem
- Verifique se você está logado
- Abra o console do navegador (F12) para ver logs

### Erro de autenticação
- Limpe o localStorage: `localStorage.clear()` no console
- Faça login novamente

---

## 📚 Diferenças do Firebase

| Antes (Firebase) | Agora (Prisma) |
|-----------------|----------------|
| Firestore | SQLite (arquivo local) |
| Firebase Auth | JWT (tokens) |
| Sessão nunca expira | Token expira em 30 dias |
| Dados na nuvem | Dados locais (dev.db) |
| Sem senha | Com trocar senha ✅ |

---

## 🎯 Próximos Passos

1. ✅ Criar seu primeiro usuário
2. ✅ Testar login
3. ✅ Adicionar produtos
4. ✅ Testar trocar senha
5. 🚀 Usar o sistema normalmente!

---

## ⚠️ Importante

- **Backup:** O arquivo `prisma/dev.db` contém todos os dados
- **Desenvolvimento:** Use SQLite (já configurado)
- **Produção:** Troque para PostgreSQL/MySQL no `schema.prisma`

---

**🎉 Parabéns! Sistema migrado com sucesso!**

Qualquer dúvida, consulte a documentação do Prisma: https://www.prisma.io/docs

