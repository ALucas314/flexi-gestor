// 📧 Configuração de Emails Personalizados - Flexi Gestor
// Este arquivo contém configurações para personalizar os emails do Firebase Auth

export const EMAIL_CONFIG = {
  // 🌐 Configurações de idioma
  LANGUAGE: 'pt-BR',
  
  // 🎨 Configurações visuais dos emails
  BRANDING: {
    appName: 'Flexi Gestor',
    appLogo: 'https://flexi-gestor.firebaseapp.com/logo.png',
    primaryColor: '#8B5CF6', // Purple
    secondaryColor: '#3B82F6', // Blue
    backgroundColor: '#F8FAFC',
    textColor: '#1F2937'
  },
  
  // 📝 Templates de email personalizados
  TEMPLATES: {
    // Template para reset de senha
    passwordReset: {
      subject: '🔐 Redefinir sua senha - Flexi Gestor',
      title: 'Redefinir Senha',
      greeting: 'Olá!',
      message: 'Você solicitou a redefinição da sua senha no Flexi Gestor.',
      buttonText: 'Redefinir Senha',
      footer: 'Se você não solicitou esta redefinição, pode ignorar este email.',
      signature: 'Equipe Flexi Gestor'
    },
    
    // Template para verificação de email
    emailVerification: {
      subject: '✅ Verifique seu email - Flexi Gestor',
      title: 'Verificar Email',
      greeting: 'Bem-vindo ao Flexi Gestor!',
      message: 'Por favor, verifique seu endereço de email para ativar sua conta.',
      buttonText: 'Verificar Email',
      footer: 'Este link expira em 24 horas.',
      signature: 'Equipe Flexi Gestor'
    }
  },
  
  // 🔗 URLs de redirecionamento
  REDIRECT_URLS: {
    passwordReset: '/login?mode=resetPassword',
    emailVerification: '/login?mode=verifyEmail',
    signIn: '/login'
  }
};

// 🛠️ Função para configurar o idioma do Firebase Auth
export const configureFirebaseLanguage = async () => {
  try {
    // Importar a função de configuração de idioma
    const { getAuth } = await import('firebase/auth');
    
    // Configurar idioma português brasileiro
    const auth = getAuth();
    auth.languageCode = 'pt-BR';
    
    console.log('✅ Idioma do Firebase Auth configurado para português brasileiro');
    return true;
  } catch (error) {
    console.error('❌ Erro ao configurar idioma do Firebase Auth:', error);
    return false;
  }
};

// 📧 Função para personalizar o email de reset de senha
export const getPasswordResetEmailConfig = () => {
  return {
    url: `${window.location.origin}${EMAIL_CONFIG.REDIRECT_URLS.passwordReset}`,
    handleCodeInApp: false,
    // Configurações para personalização visual
    dynamicLinkDomain: undefined,
    iOS: {
      bundleId: 'com.flexigestor.app'
    },
    android: {
      packageName: 'com.flexigestor.app',
      installApp: true,
      minimumVersion: '1.0.0'
    }
  };
};

// 🎨 Função para gerar HTML personalizado do email
export const generateEmailHTML = (template: 'passwordReset' | 'emailVerification', data: any) => {
  const config = EMAIL_CONFIG.TEMPLATES[template];
  const branding = EMAIL_CONFIG.BRANDING;
  
  return `
    <!DOCTYPE html>
    <html lang="pt-BR">
    <head>
      <meta charset="UTF-8">
      <meta name="viewport" content="width=device-width, initial-scale=1.0">
      <title>${config.subject}</title>
      <style>
        body {
          font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif;
          line-height: 1.6;
          color: ${branding.textColor};
          background-color: ${branding.backgroundColor};
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
          background: linear-gradient(135deg, ${branding.primaryColor}, ${branding.secondaryColor});
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
          color: ${branding.primaryColor};
          margin-bottom: 20px;
        }
        .message {
          font-size: 16px;
          margin-bottom: 30px;
          line-height: 1.8;
        }
        .button {
          display: inline-block;
          background: linear-gradient(135deg, ${branding.primaryColor}, ${branding.secondaryColor});
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
          <div class="logo">🍇 ${branding.appName}</div>
          <p>Sistema de Gestão de Açaí</p>
        </div>
        <div class="content">
          <h1 class="title">${config.title}</h1>
          <p class="message">
            <span class="emoji">👋</span>${config.greeting}<br><br>
            ${config.message}
          </p>
          <div style="text-align: center;">
            <a href="${data.actionUrl}" class="button">
              ${config.buttonText}
            </a>
          </div>
        </div>
        <div class="footer">
          <p>${config.footer}</p>
          <p><strong>${config.signature}</strong></p>
        </div>
      </div>
    </body>
    </html>
  `;
};

export default EMAIL_CONFIG;
