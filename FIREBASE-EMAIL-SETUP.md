# 📧 Configuração de Emails em Português - Firebase Auth

## 🎯 Objetivo
Configurar os emails de autenticação do Firebase para serem enviados em português brasileiro com visual personalizado do Flexi Gestor.

## 🔧 Configuração no Firebase Console

### 1. 🌐 Configurar Idioma Padrão
1. Acesse o [Firebase Console](https://console.firebase.google.com/)
2. Selecione o projeto `flexi-gestor`
3. Vá em **Authentication** > **Templates**
4. Clique em **Language** e selecione **Português (Brasil)**

### 2. 📝 Personalizar Template de Reset de Senha
1. Em **Authentication** > **Templates**
2. Clique em **Password reset**
3. Configure os seguintes campos:

#### **Assunto do Email:**
```
🔐 Redefinir sua senha - Flexi Gestor
```

#### **Corpo do Email (HTML):**
```html
<!DOCTYPE html>
<html lang="pt-BR">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Redefinir Senha - Flexi Gestor</title>
    <style>
        body {
            font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif;
            line-height: 1.6;
            color: #1F2937;
            background-color: #F8FAFC;
            margin: 0;
            padding: 20px;
        }
        .container {
            max-width: 600px;
            margin: 0 auto;
            background: white;
            border-radius: 12px;
            box-shadow: 0 4px 6px rgba(0, 0, 0, 0.1);
            overflow: hidden;
        }
        .header {
            background: linear-gradient(135deg, #8B5CF6, #3B82F6);
            color: white;
            padding: 30px;
            text-align: center;
        }
        .logo {
            font-size: 28px;
            font-weight: bold;
            margin-bottom: 10px;
        }
        .content {
            padding: 30px;
        }
        .title {
            font-size: 24px;
            color: #8B5CF6;
            margin-bottom: 20px;
        }
        .message {
            font-size: 16px;
            margin-bottom: 30px;
            line-height: 1.8;
        }
        .button {
            display: inline-block;
            background: linear-gradient(135deg, #8B5CF6, #3B82F6);
            color: white;
            padding: 15px 30px;
            text-decoration: none;
            border-radius: 8px;
            font-weight: bold;
            margin: 20px 0;
        }
        .footer {
            background: #F8FAFC;
            padding: 20px;
            text-align: center;
            font-size: 14px;
            color: #6B7280;
        }
        .emoji {
            font-size: 20px;
            margin-right: 8px;
        }
    </style>
</head>
<body>
    <div class="container">
        <div class="header">
            <div class="logo">🍇 Flexi Gestor</div>
            <p>Sistema de Gestão de Açaí</p>
        </div>
        <div class="content">
            <h1 class="title">🔐 Redefinir Senha</h1>
            <p class="message">
                <span class="emoji">👋</span>Olá!<br><br>
                Você solicitou a redefinição da sua senha no Flexi Gestor. 
                Clique no botão abaixo para criar uma nova senha segura.
            </p>
            <div style="text-align: center;">
                <a href="%LINK%" class="button">
                    🔑 Redefinir Senha
                </a>
            </div>
            <p class="message">
                <strong>⚠️ Importante:</strong> Este link expira em 1 hora por motivos de segurança.
            </p>
        </div>
        <div class="footer">
            <p>Se você não solicitou esta redefinição, pode ignorar este email.</p>
            <p><strong>Equipe Flexi Gestor</strong></p>
            <p style="font-size: 12px; margin-top: 15px;">
                📧 Este email foi enviado automaticamente. Por favor, não responda.
            </p>
        </div>
    </div>
</body>
</html>
```

### 3. 📧 Configurar Remetente
1. Em **Authentication** > **Templates**
2. Clique em **Customize domain**
3. Configure um domínio personalizado (opcional):
   - `auth.flexi-gestor.com` (se você tiver um domínio)
   - Ou mantenha o padrão: `noreply@flexi-gestor.firebaseapp.com`

### 4. 🔒 Configurar Segurança
1. Em **Authentication** > **Settings**
2. Configure **Authorized domains**:
   - `flexi-gestor.firebaseapp.com`
   - `localhost` (para desenvolvimento)
   - Seu domínio personalizado (se aplicável)

## 🎨 Personalizações Implementadas

### ✅ **Visual Melhorado:**
- Logo do Flexi Gestor com emoji 🍇
- Cores da marca (roxo e azul)
- Design responsivo
- Botões com gradiente

### ✅ **Conteúdo em Português:**
- Assunto em português
- Mensagem amigável
- Instruções claras
- Avisos de segurança

### ✅ **Funcionalidades:**
- Link de redirecionamento para `/login`
- Expiração em 1 hora
- Design profissional
- Compatível com todos os clientes de email

## 🚀 Como Testar

1. **Teste Local:**
   ```bash
   npm run dev
   ```

2. **Acesse a página de login**
3. **Clique em "Esqueci minha senha"**
4. **Digite um email válido**
5. **Verifique o email recebido**

## 📱 Resultado Esperado

O usuário receberá um email com:
- ✅ Assunto em português
- ✅ Visual personalizado do Flexi Gestor
- ✅ Mensagem clara e amigável
- ✅ Botão de ação destacado
- ✅ Informações de segurança

## 🔧 Troubleshooting

### Email não chega:
1. Verifique a pasta de spam
2. Confirme se o email está cadastrado no Firebase
3. Verifique as configurações de domínio autorizado

### Email em inglês:
1. Verifique se o idioma está configurado como "Português (Brasil)"
2. Limpe o cache do navegador
3. Teste com um email diferente

### Link não funciona:
1. Verifique se o domínio está autorizado
2. Confirme se a URL de redirecionamento está correta
3. Teste em modo incógnito

## 📞 Suporte

Se precisar de ajuda com a configuração, consulte:
- [Documentação do Firebase Auth](https://firebase.google.com/docs/auth)
- [Templates de Email Personalizados](https://firebase.google.com/docs/auth/custom-email-handler)
