# 🚀 Guia de Deploy Gratuito - Flexi Gestor

## 📋 Opção Recomendada: Render.com (Tudo Grátis!)

### ✅ O que você vai ter:
- ✨ Frontend público com domínio `.onrender.com`
- 🔧 Backend API funcionando
- 🗄️ Banco de dados PostgreSQL grátis
- 🔄 Deploy automático do GitHub

---

## 🎯 Passo a Passo Completo

### **PARTE 1: Preparar o Projeto**

#### 1. Criar arquivo `render.yaml` na raiz do projeto:

```yaml
services:
  # Backend API
  - type: web
    name: flexi-gestor-api
    env: node
    region: oregon
    plan: free
    buildCommand: cd server && npm install && npx prisma generate && npx prisma migrate deploy
    startCommand: cd server && npm start
    envVars:
      - key: DATABASE_URL
        fromDatabase:
          name: flexi-gestor-db
          property: connectionString
      - key: JWT_SECRET
        generateValue: true
      - key: NODE_ENV
        value: production
      - key: FRONTEND_URL
        value: https://flexi-gestor.onrender.com

  # Frontend
  - type: web
    name: flexi-gestor
    env: static
    region: oregon
    plan: free
    buildCommand: npm install && npm run build
    staticPublishPath: ./dist
    envVars:
      - key: VITE_API_URL
        value: https://flexi-gestor-api.onrender.com

databases:
  - name: flexi-gestor-db
    plan: free
    databaseName: flexigestor
    user: flexigestor
```

#### 2. Atualizar `server/package.json` (script de start):

```json
{
  "scripts": {
    "start": "node dist/index.js",
    "build": "tsc",
    "dev": "tsx watch src/index.ts"
  }
}
```

#### 3. Criar `.env.example` na raiz:

```env
# Backend
DATABASE_URL="postgresql://user:password@localhost:5432/flexigestor"
JWT_SECRET="seu-secret-super-seguro-aqui"
NODE_ENV="development"

# Frontend
VITE_API_URL="http://localhost:3001"
```

#### 4. Atualizar `server/prisma/schema.prisma`:

```prisma
datasource db {
  provider = "postgresql"  // Mudar de sqlite para postgresql
  url      = env("DATABASE_URL")
}
```

---

### **PARTE 2: Deploy no Render**

#### **Passo 1: Criar conta**
1. Acesse [render.com](https://render.com)
2. Clique em **"Get Started for Free"**
3. Conecte com GitHub

#### **Passo 2: Criar novo projeto**
1. No dashboard, clique em **"New +"**
2. Selecione **"Blueprint"**
3. Conecte o repositório `ALucas314/flexi-gestor`
4. O Render vai detectar o `render.yaml` automaticamente
5. Clique em **"Apply"**

#### **Passo 3: Aguardar deploy**
- ⏳ O deploy demora ~5-10 minutos na primeira vez
- 📊 Você pode acompanhar os logs em tempo real
- ✅ Quando terminar, você terá 2 URLs:
  - Frontend: `https://flexi-gestor.onrender.com`
  - Backend: `https://flexi-gestor-api.onrender.com`

---

### **PARTE 3: Configurações Importantes**

#### **⚠️ Limites do Plano Grátis:**
- Backend "dorme" após 15 minutos sem uso
- Primeira requisição pode demorar 30-60 segundos
- 750 horas/mês (suficiente para uso pessoal)

#### **🔧 Para manter sempre ativo (opcional):**
Use um serviço como [UptimeRobot](https://uptimerobot.com) para fazer ping a cada 14 minutos

---

## 🎯 Alternativas por Componente

### Frontend (escolha 1):
1. **Vercel** (recomendado) - Deploy mais rápido
2. **Netlify** - Bom para sites estáticos
3. **Render** - Tudo em um lugar
4. **GitHub Pages** - Só arquivos estáticos

### Backend + Banco (escolha 1):
1. **Render** (recomendado) - PostgreSQL grátis incluído
2. **Railway** - $5 grátis/mês, mais recursos
3. **Fly.io** - Ótimo desempenho
4. **Cyclic** - Deploy direto do GitHub

---

## 📱 Compartilhar com Qualquer Pessoa

Depois do deploy, você pode:

1. **Enviar o link**: `https://seu-app.onrender.com`
2. **Criar QR Code**: Use [qr-code-generator.com](https://www.qr-code-generator.com)
3. **Domínio personalizado**: Compre em [Namecheap](https://www.namecheap.com) (~$1/ano)

---

## 🆘 Troubleshooting

### Erro: "Database connection failed"
- Verifique se `DATABASE_URL` está configurada
- Aguarde o banco inicializar (~2 minutos)

### Erro: "CORS blocked"
- Atualize `FRONTEND_URL` no backend com a URL correta do Render

### App muito lento
- Normal no plano grátis após inatividade
- Use UptimeRobot para manter ativo

---

## 📞 Precisa de Ajuda?

Escolha uma das opções acima e me avise qual você prefere que eu te ajudo a configurar! 🚀

