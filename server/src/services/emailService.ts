// 📧 Serviço de Email com Nodemailer
// Este arquivo gerencia o envio de emails para reset de senha

import nodemailer from 'nodemailer';

// 📧 Configuração do email (Gmail)
// IMPORTANTE: Configure as variáveis de ambiente no arquivo .env
const transporter = nodemailer.createTransport({
  service: 'gmail',
  auth: {
    user: process.env.EMAIL_USER || 'seu-email@gmail.com',
    pass: process.env.EMAIL_PASSWORD || 'sua-senha-app'
  }
});

// 🔐 Função para enviar email de reset de senha
export const sendPasswordResetEmail = async (
  email: string,
  resetToken: string,
  userName: string
): Promise<boolean> => {
  try {
    // URL do frontend (ajuste conforme necessário)
    const frontendUrl = process.env.FRONTEND_URL || 'http://localhost:8082';
    const resetUrl = `${frontendUrl}/reset-password?token=${resetToken}`;

    // 📧 Template do email
    const mailOptions = {
      from: process.env.EMAIL_USER || 'Flexi Gestor <seu-email@gmail.com>',
      to: email,
      subject: '🔐 Recuperação de Senha - Flexi Gestor',
      html: `
        <!DOCTYPE html>
        <html>
        <head>
          <meta charset="utf-8">
          <style>
            body {
              font-family: Arial, sans-serif;
              line-height: 1.6;
              color: #333;
              max-width: 600px;
              margin: 0 auto;
              padding: 20px;
            }
            .header {
              background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
              color: white;
              padding: 30px;
              text-align: center;
              border-radius: 10px 10px 0 0;
            }
            .content {
              background: #f9f9f9;
              padding: 30px;
              border: 1px solid #ddd;
              border-radius: 0 0 10px 10px;
            }
            .button {
              display: inline-block;
              background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
              color: white !important;
              padding: 15px 40px;
              text-decoration: none !important;
              border-radius: 5px;
              margin: 20px 0;
              font-weight: bold;
            }
            .button:visited {
              color: white !important;
            }
            .button:hover {
              color: white !important;
            }
            .footer {
              text-align: center;
              margin-top: 20px;
              font-size: 12px;
              color: #666;
            }
            .warning {
              background: #fff3cd;
              border-left: 4px solid #ffc107;
              padding: 15px;
              margin: 20px 0;
            }
          </style>
        </head>
        <body>
          <div class="header">
            <h1>🔐 Recuperação de Senha</h1>
            <p>Flexi Gestor</p>
          </div>
          
          <div class="content">
            <p>Olá, <strong>${userName}</strong>!</p>
            
            <p>Recebemos uma solicitação para redefinir a senha da sua conta no <strong>Flexi Gestor</strong>.</p>
            
            <p>Se você fez esta solicitação, clique no botão abaixo para criar uma nova senha:</p>
            
            <div style="text-align: center;">
              <a href="${resetUrl}" class="button">Redefinir Minha Senha</a>
            </div>
            
            <p>Ou copie e cole este link no seu navegador:</p>
            <p style="background: #fff; padding: 10px; border: 1px solid #ddd; word-break: break-all;">
              ${resetUrl}
            </p>
            
            <div class="warning">
              <strong>⚠️ Importante:</strong>
              <ul>
                <li>Este link é válido por <strong>1 hora</strong></li>
                <li>Só pode ser usado uma vez</li>
                <li>Se você não solicitou esta recuperação, ignore este email</li>
              </ul>
            </div>
            
            <p>Se você não solicitou a redefinição de senha, sua conta permanece segura e você pode ignorar este email.</p>
            
            <p>Atenciosamente,<br>
            <strong>Equipe Flexi Gestor</strong></p>
          </div>
          
          <div class="footer">
            <p>Este é um email automático, por favor não responda.</p>
            <p>© ${new Date().getFullYear()} Flexi Gestor - Sistema de Gestão de Estoque</p>
          </div>
        </body>
        </html>
      `
    };

    // Enviar email
    await transporter.sendMail(mailOptions);
    console.log('✅ Email de reset de senha enviado para:', email);
    return true;

  } catch (error: any) {
    console.error('❌ Erro ao enviar email:', error);
    return false;
  }
};

// ✅ Função para testar configuração do email
export const testEmailConfig = async (): Promise<boolean> => {
  try {
    await transporter.verify();
    console.log('✅ Configuração de email está correta!');
    return true;
  } catch (error) {
    console.error('❌ Erro na configuração de email:', error);
    return false;
  }
};

