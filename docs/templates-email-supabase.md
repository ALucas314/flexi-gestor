# 📧 Templates de Email Personalizados - Flexi Gestor

## 🎨 Como Configurar no Supabase

1. Acesse [Supabase Dashboard](https://app.supabase.com)
2. Selecione seu projeto **Flexi Gestor**
3. Vá em **Authentication** → **Email Templates**
4. Edite cada template abaixo

---

## 🔐 1. RESET DE SENHA (Recuperar Senha)

**Template Name:** Reset Password / Confirm signup

Cole este código no campo **Message Body (HTML)**:

```html
<!DOCTYPE html>
<html lang="pt-BR">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Recuperar Senha - Flexi Gestor</title>
</head>
<body style="margin: 0; padding: 0; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif; background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); min-height: 100vh; padding: 40px 20px;">
  
  <!-- Container Principal -->
  <table role="presentation" style="width: 100%; max-width: 600px; margin: 0 auto; background: #ffffff; border-radius: 20px; box-shadow: 0 20px 60px rgba(0,0,0,0.3); overflow: hidden;">
    
    <!-- Header com Gradiente -->
    <tr>
      <td style="background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); padding: 40px 30px; text-align: center;">
        <div style="background: rgba(255,255,255,0.2); width: 80px; height: 80px; border-radius: 50%; margin: 0 auto 20px; display: flex; align-items: center; justify-content: center; backdrop-filter: blur(10px);">
          <span style="font-size: 40px;">🔐</span>
        </div>
        <h1 style="color: #ffffff; font-size: 28px; font-weight: 800; margin: 0 0 10px 0; text-shadow: 0 2px 10px rgba(0,0,0,0.2);">
          🚀 Flexi Gestor
        </h1>
        <p style="color: rgba(255,255,255,0.9); font-size: 16px; margin: 0; font-weight: 500;">
          Sistema de Gestão Empresarial
        </p>
      </td>
    </tr>
    
    <!-- Conteúdo Principal -->
    <tr>
      <td style="padding: 40px 30px;">
        <h2 style="color: #1a202c; font-size: 24px; font-weight: 700; margin: 0 0 20px 0; text-align: center;">
          🔑 Recuperação de Senha
        </h2>
        
        <p style="color: #4a5568; font-size: 16px; line-height: 1.6; margin: 0 0 15px 0;">
          Olá! 👋
        </p>
        
        <p style="color: #4a5568; font-size: 16px; line-height: 1.6; margin: 0 0 25px 0;">
          Recebemos uma solicitação para <strong>redefinir a senha</strong> da sua conta no <strong>Flexi Gestor</strong>.
        </p>
        
        <!-- Botão Principal -->
        <div style="text-align: center; margin: 35px 0;">
          <a href="{{ .ConfirmationURL }}" 
             style="display: inline-block; background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); color: #ffffff; font-size: 16px; font-weight: 700; text-decoration: none; padding: 16px 40px; border-radius: 12px; box-shadow: 0 10px 30px rgba(102, 126, 234, 0.4); transition: all 0.3s;">
            🔐 Redefinir Minha Senha
          </a>
        </div>
        
        <!-- Informações Adicionais -->
        <div style="background: linear-gradient(135deg, #e0e7ff 0%, #ede9fe 100%); border-left: 4px solid #667eea; padding: 20px; border-radius: 10px; margin: 25px 0;">
          <p style="color: #4c51bf; font-size: 14px; font-weight: 600; margin: 0 0 10px 0;">
            ⏰ Informações Importantes:
          </p>
          <ul style="color: #5a67d8; font-size: 14px; line-height: 1.8; margin: 0; padding-left: 20px;">
            <li>Este link é válido por <strong>1 hora</strong></li>
            <li>Se você não solicitou, ignore este email</li>
            <li>Sua senha atual continua funcionando</li>
          </ul>
        </div>
        
        <p style="color: #718096; font-size: 14px; line-height: 1.6; margin: 25px 0 0 0;">
          Se o botão não funcionar, copie e cole este link no navegador:
        </p>
        <p style="color: #4299e1; font-size: 13px; word-break: break-all; background: #f7fafc; padding: 12px; border-radius: 8px; border: 1px dashed #cbd5e0; margin: 10px 0 0 0;">
          {{ .ConfirmationURL }}
        </p>
      </td>
    </tr>
    
    <!-- Footer -->
    <tr>
      <td style="background: #f7fafc; padding: 30px; text-align: center; border-top: 1px solid #e2e8f0;">
        <p style="color: #718096; font-size: 14px; margin: 0 0 10px 0;">
          💚 <strong>Flexi Gestor</strong> - Gestão Inteligente
        </p>
        <p style="color: #a0aec0; font-size: 12px; margin: 0;">
          Este é um email automático. Não responda.
        </p>
        <p style="color: #cbd5e0; font-size: 11px; margin: 15px 0 0 0;">
          © 2025 Flexi Gestor. Todos os direitos reservados.
        </p>
      </td>
    </tr>
  </table>
  
</body>
</html>
```

---

## ✉️ 2. CONFIRMAÇÃO DE CADASTRO

**Template Name:** Confirm signup

```html
<!DOCTYPE html>
<html lang="pt-BR">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Confirmar Email - Flexi Gestor</title>
</head>
<body style="margin: 0; padding: 0; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif; background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); min-height: 100vh; padding: 40px 20px;">
  
  <!-- Container Principal -->
  <table role="presentation" style="width: 100%; max-width: 600px; margin: 0 auto; background: #ffffff; border-radius: 20px; box-shadow: 0 20px 60px rgba(0,0,0,0.3); overflow: hidden;">
    
    <!-- Header com Gradiente -->
    <tr>
      <td style="background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); padding: 40px 30px; text-align: center;">
        <div style="background: rgba(255,255,255,0.2); width: 80px; height: 80px; border-radius: 50%; margin: 0 auto 20px; display: flex; align-items: center; justify-content: center; backdrop-filter: blur(10px);">
          <span style="font-size: 40px;">✨</span>
        </div>
        <h1 style="color: #ffffff; font-size: 28px; font-weight: 800; margin: 0 0 10px 0; text-shadow: 0 2px 10px rgba(0,0,0,0.2);">
          🚀 Flexi Gestor
        </h1>
        <p style="color: rgba(255,255,255,0.9); font-size: 16px; margin: 0; font-weight: 500;">
          Sistema de Gestão Empresarial
        </p>
      </td>
    </tr>
    
    <!-- Conteúdo Principal -->
    <tr>
      <td style="padding: 40px 30px;">
        <h2 style="color: #1a202c; font-size: 24px; font-weight: 700; margin: 0 0 20px 0; text-align: center;">
          🎉 Bem-vindo ao Flexi Gestor!
        </h2>
        
        <p style="color: #4a5568; font-size: 16px; line-height: 1.6; margin: 0 0 15px 0;">
          Olá! 👋
        </p>
        
        <p style="color: #4a5568; font-size: 16px; line-height: 1.6; margin: 0 0 25px 0;">
          Obrigado por se cadastrar! Para começar a usar o <strong>Flexi Gestor</strong>, você precisa <strong>confirmar seu email</strong>.
        </p>
        
        <!-- Botão Principal -->
        <div style="text-align: center; margin: 35px 0;">
          <a href="{{ .ConfirmationURL }}" 
             style="display: inline-block; background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); color: #ffffff; font-size: 16px; font-weight: 700; text-decoration: none; padding: 16px 40px; border-radius: 12px; box-shadow: 0 10px 30px rgba(102, 126, 234, 0.4);">
            ✨ Confirmar Meu Email
          </a>
        </div>
        
        <!-- Recursos Destacados -->
        <div style="background: linear-gradient(135deg, #e0e7ff 0%, #ede9fe 100%); padding: 25px; border-radius: 12px; margin: 25px 0;">
          <p style="color: #4c51bf; font-size: 15px; font-weight: 700; margin: 0 0 15px 0; text-align: center;">
            🎯 O que você pode fazer com o Flexi Gestor:
          </p>
          <ul style="color: #5a67d8; font-size: 14px; line-height: 2; margin: 0; padding-left: 20px;">
            <li>📦 <strong>Gerenciar Produtos</strong> - Catálogo completo</li>
            <li>📊 <strong>Controlar Estoque</strong> - Entradas e saídas</li>
            <li>💰 <strong>Acompanhar Vendas</strong> - Relatórios em tempo real</li>
            <li>📈 <strong>Visualizar Dashboards</strong> - Análises detalhadas</li>
            <li>🏷️ <strong>Gerenciar Lotes</strong> - Rastreabilidade completa</li>
          </ul>
        </div>
        
        <p style="color: #718096; font-size: 14px; line-height: 1.6; margin: 25px 0 0 0;">
          Se o botão não funcionar, copie e cole este link no navegador:
        </p>
        <p style="color: #4299e1; font-size: 13px; word-break: break-all; background: #f7fafc; padding: 12px; border-radius: 8px; border: 1px dashed #cbd5e0; margin: 10px 0 0 0;">
          {{ .ConfirmationURL }}
        </p>
      </td>
    </tr>
    
    <!-- Footer -->
    <tr>
      <td style="background: #f7fafc; padding: 30px; text-align: center; border-top: 1px solid #e2e8f0;">
        <p style="color: #718096; font-size: 14px; margin: 0 0 10px 0;">
          💚 <strong>Flexi Gestor</strong> - Gestão Inteligente
        </p>
        <p style="color: #a0aec0; font-size: 12px; margin: 0;">
          Este é um email automático. Não responda.
        </p>
        <p style="color: #cbd5e0; font-size: 11px; margin: 15px 0 0 0;">
          © 2025 Flexi Gestor. Todos os direitos reservados.
        </p>
      </td>
    </tr>
  </table>
  
</body>
</html>
```

**Subject (Assunto):**
```
🔐 Recupere sua senha - Flexi Gestor
```

---

## 📩 3. EMAIL DE CONVITE (Invite User)

```html
<!DOCTYPE html>
<html lang="pt-BR">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Convite - Flexi Gestor</title>
</head>
<body style="margin: 0; padding: 0; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif; background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); min-height: 100vh; padding: 40px 20px;">
  
  <table role="presentation" style="width: 100%; max-width: 600px; margin: 0 auto; background: #ffffff; border-radius: 20px; box-shadow: 0 20px 60px rgba(0,0,0,0.3); overflow: hidden;">
    
    <!-- Header -->
    <tr>
      <td style="background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); padding: 40px 30px; text-align: center;">
        <div style="background: rgba(255,255,255,0.2); width: 80px; height: 80px; border-radius: 50%; margin: 0 auto 20px;">
          <span style="font-size: 40px; line-height: 80px;">🎉</span>
        </div>
        <h1 style="color: #ffffff; font-size: 28px; font-weight: 800; margin: 0 0 10px 0;">
          🚀 Flexi Gestor
        </h1>
        <p style="color: rgba(255,255,255,0.9); font-size: 16px; margin: 0; font-weight: 500;">
          Você foi convidado!
        </p>
      </td>
    </tr>
    
    <!-- Conteúdo -->
    <tr>
      <td style="padding: 40px 30px;">
        <h2 style="color: #1a202c; font-size: 24px; font-weight: 700; margin: 0 0 20px 0; text-align: center;">
          🎊 Você Foi Convidado!
        </h2>
        
        <p style="color: #4a5568; font-size: 16px; line-height: 1.6; margin: 0 0 25px 0;">
          Você foi convidado para participar do <strong>Flexi Gestor</strong>! Clique no botão abaixo para aceitar o convite e criar sua conta.
        </p>
        
        <div style="text-align: center; margin: 35px 0;">
          <a href="{{ .ConfirmationURL }}" 
             style="display: inline-block; background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); color: #ffffff; font-size: 16px; font-weight: 700; text-decoration: none; padding: 16px 40px; border-radius: 12px; box-shadow: 0 10px 30px rgba(102, 126, 234, 0.4);">
            🎉 Aceitar Convite
          </a>
        </div>
      </td>
    </tr>
    
    <!-- Footer -->
    <tr>
      <td style="background: #f7fafc; padding: 30px; text-align: center; border-top: 1px solid #e2e8f0;">
        <p style="color: #718096; font-size: 14px; margin: 0 0 10px 0;">
          💚 <strong>Flexi Gestor</strong> - Gestão Inteligente
        </p>
        <p style="color: #cbd5e0; font-size: 11px; margin: 15px 0 0 0;">
          © 2025 Flexi Gestor. Todos os direitos reservados.
        </p>
      </td>
    </tr>
  </table>
  
</body>
</html>
```

**Subject:**
```
🎉 Você foi convidado para o Flexi Gestor!
```

---

## 📲 4. MUDANÇA DE EMAIL

```html
<!DOCTYPE html>
<html lang="pt-BR">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Confirmar Mudança de Email - Flexi Gestor</title>
</head>
<body style="margin: 0; padding: 0; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif; background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); min-height: 100vh; padding: 40px 20px;">
  
  <table role="presentation" style="width: 100%; max-width: 600px; margin: 0 auto; background: #ffffff; border-radius: 20px; box-shadow: 0 20px 60px rgba(0,0,0,0.3); overflow: hidden;">
    
    <!-- Header -->
    <tr>
      <td style="background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); padding: 40px 30px; text-align: center;">
        <div style="background: rgba(255,255,255,0.2); width: 80px; height: 80px; border-radius: 50%; margin: 0 auto 20px;">
          <span style="font-size: 40px; line-height: 80px;">📧</span>
        </div>
        <h1 style="color: #ffffff; font-size: 28px; font-weight: 800; margin: 0 0 10px 0;">
          🚀 Flexi Gestor
        </h1>
        <p style="color: rgba(255,255,255,0.9); font-size: 16px; margin: 0; font-weight: 500;">
          Sistema de Gestão Empresarial
        </p>
      </td>
    </tr>
    
    <!-- Conteúdo -->
    <tr>
      <td style="padding: 40px 30px;">
        <h2 style="color: #1a202c; font-size: 24px; font-weight: 700; margin: 0 0 20px 0; text-align: center;">
          📧 Confirmar Novo Email
        </h2>
        
        <p style="color: #4a5568; font-size: 16px; line-height: 1.6; margin: 0 0 15px 0;">
          Olá! 👋
        </p>
        
        <p style="color: #4a5568; font-size: 16px; line-height: 1.6; margin: 0 0 25px 0;">
          Recebemos uma solicitação para <strong>alterar o email</strong> da sua conta. Confirme seu novo email clicando no botão abaixo.
        </p>
        
        <div style="text-align: center; margin: 35px 0;">
          <a href="{{ .ConfirmationURL }}" 
             style="display: inline-block; background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); color: #ffffff; font-size: 16px; font-weight: 700; text-decoration: none; padding: 16px 40px; border-radius: 12px; box-shadow: 0 10px 30px rgba(102, 126, 234, 0.4);">
            📧 Confirmar Novo Email
          </a>
        </div>
        
        <div style="background: #fff5f5; border-left: 4px solid #f56565; padding: 20px; border-radius: 10px; margin: 25px 0;">
          <p style="color: #c53030; font-size: 14px; font-weight: 600; margin: 0;">
            ⚠️ Se você não solicitou essa mudança, ignore este email. Sua conta permanecerá segura.
          </p>
        </div>
      </td>
    </tr>
    
    <!-- Footer -->
    <tr>
      <td style="background: #f7fafc; padding: 30px; text-align: center; border-top: 1px solid #e2e8f0;">
        <p style="color: #718096; font-size: 14px; margin: 0 0 10px 0;">
          💚 <strong>Flexi Gestor</strong> - Gestão Inteligente
        </p>
        <p style="color: #a0aec0; font-size: 12px; margin: 0;">
          Este é um email automático. Não responda.
        </p>
        <p style="color: #cbd5e0; font-size: 11px; margin: 15px 0 0 0;">
          © 2025 Flexi Gestor. Todos os direitos reservados.
        </p>
      </td>
    </tr>
  </table>
  
</body>
</html>
```

**Subject:**
```
📧 Confirme seu novo email - Flexi Gestor
```

---

## 🔧 COMO APLICAR OS TEMPLATES

### Passo 1: Acessar Email Templates

1. Vá em [Supabase Dashboard](https://app.supabase.com)
2. Selecione seu projeto
3. **Authentication** → **Email Templates**

### Passo 2: Editar Cada Template

Para cada template:

1. Selecione o template (Reset Password, Confirm Signup, etc)
2. **Cole o HTML** no campo **"Message Body (HTML)"**
3. **Altere o Subject** (Assunto)
4. Clique em **"Save"**

### Passo 3: Configurar Textos

**Opção "Content":**
- Deixe em branco ou use textos simples em português

**Opção "Subject":**
- Use os assuntos sugeridos acima

---

## 🎨 Customização Adicional

### Alterar Logo

Substitua o emoji pela logo do seu negócio:

```html
<img src="https://seu-site.com/logo.png" alt="Flexi Gestor" style="width: 80px; height: 80px; border-radius: 50%;">
```

### Alterar Cores

Troque os gradientes:

**Atual (Roxo/Azul):**
```css
background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
```

**Para Verde:**
```css
background: linear-gradient(135deg, #48bb78 0%, #38a169 100%);
```

**Para Azul:**
```css
background: linear-gradient(135deg, #4299e1 0%, #3182ce 100%);
```

---

## ✅ Testar

Depois de configurar:

1. Vá na aplicação
2. Clique em **"Esqueci minha senha"**
3. Digite seu email
4. **Verifique sua caixa de entrada**
5. Você deve receber o **email BONITO** em português! 🎉

---

## 📱 Responsivo

Os templates são **100% responsivos**:
- ✅ Desktop
- ✅ Tablet
- ✅ Mobile
- ✅ Gmail
- ✅ Outlook
- ✅ Yahoo

---

**Cole os templates no Supabase agora!** ✨

