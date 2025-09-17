# 🔥 Configuração do Firebase - Flexi Gestor

Este guia explica como configurar o Firebase para o Flexi Gestor com **sessão persistente que nunca expira**.

## 🎯 **Por que Firebase?**

- ✅ **Sessão Persistente**: Sua sessão nunca expira
- ✅ **Dados em Tempo Real**: Sincronização automática
- ✅ **Backup na Nuvem**: Seus dados sempre seguros
- ✅ **Acesso Multi-dispositivo**: Use de qualquer lugar
- ✅ **Escalabilidade**: Cresce com seu negócio

---

## 🚀 **Passo a Passo**

### **1. Criar Projeto no Firebase**

1. Acesse [Firebase Console](https://console.firebase.google.com/)
2. Clique em "Criar um projeto"
3. Digite o nome: `flexi-gestor` (ou seu nome preferido)
4. Aceite os termos e continue

### **2. Adicionar Aplicação Web**

1. No painel do projeto, clique no ícone **Web** (`</>`)
2. Digite um nome para sua aplicação: `Flexi Gestor Web`
3. **NÃO** marque "Também configurar o Firebase Hosting"
4. Clique em "Registrar aplicativo"

### **3. Copiar Configurações**

Após registrar, você verá algo assim:

```javascript
const firebaseConfig = {
  apiKey: "AIzaSyBxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx",
  authDomain: "flexi-gestor-xxxxx.firebaseapp.com",
  projectId: "flexi-gestor-xxxxx",
  storageBucket: "flexi-gestor-xxxxx.appspot.com",
  messagingSenderId: "123456789012",
  appId: "1:123456789012:web:abcdef1234567890abcdef"
};
```

**Copie essas configurações!**

### **4. Configurar no Flexi Gestor**

1. Abra o arquivo `src/lib/firebaseConfig.ts`
2. Substitua as configurações de exemplo pelas suas:

```typescript
const firebaseConfig = {
  apiKey: "SUA_API_KEY_AQUI",
  authDomain: "seu-projeto.firebaseapp.com",
  projectId: "seu-projeto-id",
  storageBucket: "seu-projeto.appspot.com",
  messagingSenderId: "123456789",
  appId: "1:123456789:web:abcdef123456"
};
```

### **5. Habilitar Serviços**

#### **🔐 Authentication**
1. No Firebase Console, vá em "Authentication"
2. Clique em "Começar"
3. Vá na aba "Sign-in method"
4. Habilite "E-mail/senha"
5. Clique em "Salvar"

#### **🗄️ Firestore Database**
1. No Firebase Console, vá em "Firestore Database"
2. Clique em "Criar banco de dados"
3. Escolha "Começar no modo de teste" (para desenvolvimento)
4. Escolha uma localização (ex: `southamerica-east1`)
5. Clique em "Concluído"

---

## 🛠️ **Configuração Avançada**

### **Regras de Segurança do Firestore**

No Firebase Console, vá em "Firestore Database" → "Regras" e substitua por:

```javascript
rules_version = '2';
service cloud.firestore {
  match /databases/{database}/documents {
    // Usuários podem acessar apenas seus próprios dados
    match /users/{userId} {
      allow read, write: if request.auth != null && request.auth.uid == userId;
    }
    
    // Produtos do usuário
    match /products/{productId} {
      allow read, write: if request.auth != null && 
        resource.data.userId == request.auth.uid;
    }
    
    // Movimentações do usuário
    match /movements/{movementId} {
      allow read, write: if request.auth != null && 
        resource.data.userId == request.auth.uid;
    }
    
    // Notificações do usuário
    match /notifications/{notificationId} {
      allow read, write: if request.auth != null && 
        resource.data.userId == request.auth.uid;
    }
  }
}
```

### **Configuração de Persistência**

O Flexi Gestor já está configurado para usar **persistência local**, o que significa:

- ✅ Sua sessão **nunca expira**
- ✅ Dados ficam salvos mesmo offline
- ✅ Sincronização automática quando voltar online

---

## 🔄 **Migração de Dados**

Se você já tem dados no localStorage, eles serão migrados automaticamente:

1. Faça login com sua conta Firebase
2. O sistema detectará dados no localStorage
3. Migrará automaticamente para o Firestore
4. Seus dados antigos serão preservados

---

## 📱 **Usando o Firebase**

### **Login/Cadastro**
- Use seu e-mail e senha
- A sessão será persistente (nunca expira)
- Dados sincronizados em tempo real

### **Dados**
- Todos os produtos, movimentações e notificações ficam na nuvem
- Acesso de qualquer dispositivo
- Backup automático

### **Offline**
- Funciona mesmo sem internet
- Sincroniza quando voltar online
- Nunca perde dados

---

## 🆘 **Solução de Problemas**

### **Erro: "Firebase App named '[DEFAULT]' already exists"**
- Reinicie o servidor de desenvolvimento
- Limpe o cache do navegador

### **Erro: "Permission denied"**
- Verifique as regras do Firestore
- Certifique-se de estar logado

### **Dados não aparecem**
- Verifique se o Firestore está habilitado
- Confirme as regras de segurança
- Verifique o console do navegador

### **Sessão expira**
- Verifique se a persistência está configurada
- Confirme as configurações do Firebase

---

## 📞 **Suporte**

Se precisar de ajuda:

1. **Console do Firebase**: Verifique logs e erros
2. **Console do Navegador**: F12 → Console
3. **Documentação**: [Firebase Docs](https://firebase.google.com/docs)
4. **Comunidade**: [Stack Overflow](https://stackoverflow.com/questions/tagged/firebase)

---

## 🎉 **Pronto!**

Agora seu Flexi Gestor está configurado com Firebase:

- 🔐 **Autenticação persistente** (nunca expira)
- 🗄️ **Banco de dados em tempo real**
- ☁️ **Backup automático na nuvem**
- 📱 **Acesso multi-dispositivo**
- 🔄 **Sincronização automática**

**Sua sessão nunca mais vai expirar!** 🚀
