# 🚀 Como Rodar o Sistema Flexi Gestor

## ⚡ Início Rápido (se já configurou tudo)

Se você já configurou o Supabase e o arquivo `.env`, basta:

```bash
npm run dev
```

Aguarde ver:
```
➜  Local:   http://localhost:5173/
```

Abra no navegador: **http://localhost:5173**

---

## 🆕 Primeira vez? Siga este passo a passo:

### 1️⃣ Instalar dependências

```bash
npm install
```

### 2️⃣ Configurar Supabase

**Opção A: Se já tem um projeto Supabase configurado**
- Crie o arquivo `.env` na raiz do projeto
- Adicione suas credenciais:
  ```env
  VITE_SUPABASE_URL=sua_url_do_supabase
  VITE_SUPABASE_ANON_KEY=sua_chave_anon
  ```

**Opção B: Se ainda não tem projeto Supabase**
- Siga o guia completo em: **`docs/INICIO-RAPIDO.md`**

### 3️⃣ Rodar o sistema

```bash
npm run dev
```

### 4️⃣ Acessar o sistema

Abra o navegador em: **http://localhost:5173**

### 5️⃣ Criar sua conta

1. Clique na aba **"Registrar"**
2. Preencha seus dados
3. Clique em **"Criar Nova Conta"**
4. 🎉 Pronto! Você já está usando o sistema!

---

## 🛠️ Comandos Disponíveis

```bash
# Rodar em modo desenvolvimento
npm run dev

# Fazer build para produção
npm run build

# Visualizar build de produção localmente
npm run preview

# Verificar código (linter)
npm run lint
```

---

## 📊 Portas e URLs

| Serviço | Porta/URL | Descrição |
|---------|-----------|-----------|
| **Frontend (Dev)** | http://localhost:5173 | Aplicação React com Vite |
| **Frontend (Preview)** | http://localhost:4173 | Preview do build de produção |
| **Supabase API** | Automático | API gerenciada pelo Supabase (nuvem) |

---

## ✅ O que você precisa ter instalado

- **Node.js** 18 ou superior
- **npm** (vem com Node.js)
- **Conta Supabase** (gratuita): https://supabase.com

---

## ⚠️ Problemas Comuns

### ❌ "Cannot find module '@supabase/supabase-js'"

**Causa**: Dependências não instaladas  
**Solução**:
```bash
npm install
```

### ❌ "Credenciais do Supabase não encontradas"

**Causa**: Arquivo `.env` não existe ou está vazio  
**Solução**:
1. Crie o arquivo `.env` na raiz do projeto
2. Adicione as credenciais do Supabase:
   ```env
   VITE_SUPABASE_URL=https://xxx.supabase.co
   VITE_SUPABASE_ANON_KEY=sua_chave_aqui
   ```

### ❌ "Invalid login credentials"

**Causa**: Usuário não existe ou senha incorreta  
**Solução**: Crie uma nova conta clicando em "Registrar"

### ❌ Porta 5173 já está em uso

**Causa**: Outra aplicação está usando a porta  
**Solução**: Pare o outro processo ou o Vite usará automaticamente outra porta (5174, 5175, etc.)

### ❌ Tela branca ou página não carrega

**Causa**: Erro no JavaScript ou configuração incorreta  
**Solução**:
1. Abra o console do navegador (F12)
2. Verifique se há erros
3. Verifique se o `.env` está configurado corretamente
4. Tente limpar o cache: `Ctrl + Shift + R`

---

## 🔄 Reiniciar o Sistema

### Parar o servidor:
Pressione **Ctrl+C** no terminal

### Rodar novamente:
```bash
npm run dev
```

### Limpar cache e reinstalar tudo (se algo der muito errado):
```bash
# Deletar node_modules e package-lock.json
rm -rf node_modules package-lock.json

# Ou no Windows PowerShell:
Remove-Item -Recurse -Force node_modules, package-lock.json

# Reinstalar tudo
npm install

# Rodar novamente
npm run dev
```

---

## 📚 Documentação Adicional

- **Guia Completo Supabase**: `docs/GUIA-FINAL-SUPABASE.md`
- **Início Rápido**: `docs/INICIO-RAPIDO.md`
- **Configuração Supabase**: `docs/INICIO-SUPABASE.md`
- **Setup Detalhado**: `docs/SUPABASE-SETUP.md`
- **Estrutura do Projeto**: `docs/ESTRUTURA-PROJETO.md`
- **Changelog**: `docs/CHANGELOG-ORGANIZACAO.md`

---

## 🎯 Checklist Rápido

Antes de rodar, certifique-se de que:

- [ ] Node.js 18+ instalado
- [ ] Dependências instaladas (`npm install`)
- [ ] Projeto Supabase criado
- [ ] Script SQL executado no Supabase (`supabase-schema.sql`)
- [ ] Arquivo `.env` criado com credenciais
- [ ] Confirmação de email desabilitada no Supabase
- [ ] URLs de redirecionamento configuradas

Se tudo estiver ✅, apenas rode:
```bash
npm run dev
```

---

## 🌐 Deploy para Produção

### Opção 1: Vercel (Recomendado)
```bash
# Instalar Vercel CLI
npm i -g vercel

# Fazer deploy
vercel
```

### Opção 2: Netlify
```bash
# Build
npm run build

# Faça upload da pasta 'dist' no Netlify
```

### Opção 3: Outros hosts
```bash
# Build
npm run build

# A pasta 'dist' contém os arquivos estáticos
# Faça upload para seu servidor
```

**⚠️ IMPORTANTE**: Após deploy, atualize as URLs de redirecionamento no Supabase:
1. Vá em **Authentication** → **URL Configuration**
2. Adicione a URL de produção (ex: https://seu-site.vercel.app)

---

## 💡 Dicas

### Ver logs do Supabase
1. Acesse seu projeto no Supabase
2. Clique em **"Logs"** no menu lateral
3. Filtre por tipo (API, Auth, Database, etc.)

### Ver dados em tempo real
1. Acesse **"Table Editor"** no Supabase
2. Selecione a tabela desejada
3. Veja os dados sendo atualizados

### Fazer backup do banco
1. Acesse **"Database"** → **"Backups"** no Supabase
2. Configure backups automáticos
3. Ou faça backup manual quando precisar

---

## 🆘 Precisa de ajuda?

1. Verifique os logs no console do navegador (F12)
2. Verifique os logs do Supabase
3. Leia a documentação em `docs/`
4. Verifique se seguiu todos os passos do `INICIO-RAPIDO.md`

---

**🎉 Bom trabalho! Seu sistema está pronto para uso!**
