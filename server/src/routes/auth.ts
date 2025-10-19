// 🔐 Rotas de Autenticação
// Este arquivo contém todas as rotas relacionadas à autenticação

import express, { Request, Response } from 'express';
import bcrypt from 'bcryptjs';
import crypto from 'crypto';
import { PrismaClient } from '@prisma/client';
import { generateToken, authenticateToken, AuthRequest } from '../middleware/auth';
import { sendPasswordResetEmail } from '../services/emailService';

const router = express.Router();
const prisma = new PrismaClient();

// 📝 Rota de Registro (criar nova conta)
router.post('/register', async (req: Request, res: Response) => {
  try {
    const { username, email, password, name, role } = req.body;

    console.log('📝 Tentativa de registro:', { username, email, name });

    // Validar dados
    if (!username || !email || !password || !name) {
      return res.status(400).json({ 
        error: 'Dados incompletos',
        message: 'Por favor, preencha todos os campos obrigatórios'
      });
    }

    // Verificar se usuário já existe
    const existingUser = await prisma.user.findFirst({
      where: {
        OR: [
          { email },
          { username }
        ]
      }
    });

    if (existingUser) {
      return res.status(409).json({ 
        error: 'Usuário já existe',
        message: existingUser.email === email 
          ? 'Este email já está em uso' 
          : 'Este nome de usuário já está em uso'
      });
    }

    // Hash da senha
    const hashedPassword = await bcrypt.hash(password, 10);

    // Criar usuário no banco
    const user = await prisma.user.create({
      data: {
        username,
        email,
        password: hashedPassword,
        name,
        role: role || 'user',
        avatar: '👤',
      }
    });

    // Gerar token JWT
    const token = generateToken(user.id, user.email);

    console.log('✅ Usuário registrado:', user.username);

    res.status(201).json({
      message: 'Usuário criado com sucesso',
      user: {
        id: user.id,
        username: user.username,
        email: user.email,
        name: user.name,
        role: user.role,
        avatar: user.avatar
      },
      token
    });
  } catch (error: any) {
    console.error('❌ Erro no registro:', error);
    res.status(500).json({ 
      error: 'Erro ao criar usuário',
      message: error.message 
    });
  }
});

// 🔑 Rota de Login
router.post('/login', async (req: Request, res: Response) => {
  try {
    const { email, password } = req.body;

    console.log('🔑 Tentativa de login:', email);

    // Validar dados
    if (!email || !password) {
      return res.status(400).json({ 
        error: 'Dados incompletos',
        message: 'Por favor, forneça email e senha'
      });
    }

    // Buscar usuário
    const user = await prisma.user.findUnique({
      where: { email }
    });

    if (!user) {
      return res.status(401).json({ 
        error: 'Credenciais inválidas',
        message: 'Email ou senha incorretos'
      });
    }

    // Verificar senha
    const isPasswordValid = await bcrypt.compare(password, user.password);

    if (!isPasswordValid) {
      return res.status(401).json({ 
        error: 'Credenciais inválidas',
        message: 'Email ou senha incorretos'
      });
    }

    // Atualizar último login
    await prisma.user.update({
      where: { id: user.id },
      data: { lastLogin: new Date() }
    });

    // Gerar token JWT
    const token = generateToken(user.id, user.email);

    console.log('✅ Login bem-sucedido:', user.username);

    res.json({
      message: 'Login realizado com sucesso',
      user: {
        id: user.id,
        username: user.username,
        email: user.email,
        name: user.name,
        role: user.role,
        avatar: user.avatar,
        lastLogin: user.lastLogin
      },
      token
    });
  } catch (error: any) {
    console.error('❌ Erro no login:', error);
    res.status(500).json({ 
      error: 'Erro ao fazer login',
      message: error.message 
    });
  }
});

// 🔄 Rota para Trocar Senha
router.post('/change-password', authenticateToken, async (req: AuthRequest, res: Response) => {
  try {
    const { currentPassword, newPassword } = req.body;
    const userId = req.userId;

    console.log('🔄 Tentativa de trocar senha para usuário:', userId);

    // Validar dados
    if (!currentPassword || !newPassword) {
      return res.status(400).json({ 
        error: 'Dados incompletos',
        message: 'Por favor, forneça a senha atual e a nova senha'
      });
    }

    // Validar tamanho da nova senha
    if (newPassword.length < 6) {
      return res.status(400).json({ 
        error: 'Senha fraca',
        message: 'A nova senha deve ter pelo menos 6 caracteres'
      });
    }

    // Buscar usuário
    const user = await prisma.user.findUnique({
      where: { id: userId }
    });

    if (!user) {
      return res.status(404).json({ 
        error: 'Usuário não encontrado',
        message: 'Não foi possível encontrar sua conta'
      });
    }

    // Verificar senha atual
    const isPasswordValid = await bcrypt.compare(currentPassword, user.password);

    if (!isPasswordValid) {
      return res.status(401).json({ 
        error: 'Senha incorreta',
        message: 'A senha atual está incorreta'
      });
    }

    // Hash da nova senha
    const hashedPassword = await bcrypt.hash(newPassword, 10);

    // Atualizar senha no banco
    await prisma.user.update({
      where: { id: userId },
      data: { password: hashedPassword }
    });

    console.log('✅ Senha alterada com sucesso para:', user.email);

    res.json({
      message: 'Senha alterada com sucesso',
      success: true
    });
  } catch (error: any) {
    console.error('❌ Erro ao trocar senha:', error);
    res.status(500).json({ 
      error: 'Erro ao alterar senha',
      message: error.message 
    });
  }
});

// 👤 Rota para obter dados do usuário autenticado
router.get('/me', authenticateToken, async (req: AuthRequest, res: Response) => {
  try {
    const userId = req.userId;

    const user = await prisma.user.findUnique({
      where: { id: userId },
      select: {
        id: true,
        username: true,
        email: true,
        name: true,
        role: true,
        avatar: true,
        createdAt: true,
        lastLogin: true
      }
    });

    if (!user) {
      return res.status(404).json({ 
        error: 'Usuário não encontrado'
      });
    }

    res.json({ user });
  } catch (error: any) {
    console.error('❌ Erro ao buscar usuário:', error);
    res.status(500).json({ 
      error: 'Erro ao buscar dados do usuário',
      message: error.message 
    });
  }
});

// ✏️ Rota para atualizar perfil
router.put('/profile', authenticateToken, async (req: AuthRequest, res: Response) => {
  try {
    const userId = req.userId;
    const { name, username, avatar } = req.body;

    const updatedUser = await prisma.user.update({
      where: { id: userId },
      data: {
        ...(name && { name }),
        ...(username && { username }),
        ...(avatar && { avatar })
      },
      select: {
        id: true,
        username: true,
        email: true,
        name: true,
        role: true,
        avatar: true
      }
    });

    console.log('✅ Perfil atualizado:', updatedUser.username);

    res.json({
      message: 'Perfil atualizado com sucesso',
      user: updatedUser
    });
  } catch (error: any) {
    console.error('❌ Erro ao atualizar perfil:', error);
    res.status(500).json({ 
      error: 'Erro ao atualizar perfil',
      message: error.message 
    });
  }
});

// 📧 Rota para Solicitar Reset de Senha (Esqueci minha senha)
router.post('/forgot-password', async (req: Request, res: Response) => {
  try {
    const { email } = req.body;

    console.log('📧 Solicitação de reset de senha para:', email);

    // Validar email
    if (!email) {
      return res.status(400).json({ 
        error: 'Email obrigatório',
        message: 'Por favor, forneça seu email'
      });
    }

    // Buscar usuário
    const user = await prisma.user.findUnique({
      where: { email }
    });

    // Por segurança, sempre retornar sucesso mesmo se usuário não existir
    // Isso evita que hackers descubram quais emails estão cadastrados
    if (!user) {
      console.log('⚠️ Email não encontrado:', email);
      return res.json({
        message: 'Se este email estiver cadastrado, você receberá um link de recuperação em breve.',
        success: true
      });
    }

    // Gerar token único e seguro
    const resetToken = crypto.randomBytes(32).toString('hex');
    const resetTokenExpiry = new Date(Date.now() + 3600000); // 1 hora

    // Salvar token no banco
    await prisma.user.update({
      where: { id: user.id },
      data: {
        resetToken,
        resetTokenExpiry
      }
    });

    // Enviar email
    const emailSent = await sendPasswordResetEmail(email, resetToken, user.name);

    if (emailSent) {
      console.log('✅ Email de reset enviado com sucesso para:', email);
      res.json({
        message: 'Email de recuperação enviado com sucesso! Verifique sua caixa de entrada.',
        success: true
      });
    } else {
      console.error('❌ Erro ao enviar email para:', email);
      res.status(500).json({
        error: 'Erro ao enviar email',
        message: 'Não foi possível enviar o email. Verifique as configurações de email do servidor.'
      });
    }

  } catch (error: any) {
    console.error('❌ Erro no forgot-password:', error);
    res.status(500).json({ 
      error: 'Erro ao processar solicitação',
      message: error.message 
    });
  }
});

// 🔐 Rota para Resetar Senha (com token do email)
router.post('/reset-password', async (req: Request, res: Response) => {
  try {
    const { token, newPassword } = req.body;

    console.log('🔐 Tentativa de reset de senha com token');

    // Validar dados
    if (!token || !newPassword) {
      return res.status(400).json({ 
        error: 'Dados incompletos',
        message: 'Token e nova senha são obrigatórios'
      });
    }

    // Validar tamanho da nova senha
    if (newPassword.length < 6) {
      return res.status(400).json({ 
        error: 'Senha muito curta',
        message: 'A senha deve ter pelo menos 6 caracteres'
      });
    }

    // Buscar usuário pelo token
    const user = await prisma.user.findFirst({
      where: {
        resetToken: token,
        resetTokenExpiry: {
          gte: new Date() // Token ainda não expirou
        }
      }
    });

    if (!user) {
      return res.status(400).json({ 
        error: 'Token inválido',
        message: 'Token inválido ou expirado. Solicite um novo link de recuperação.'
      });
    }

    // Hash da nova senha
    const hashedPassword = await bcrypt.hash(newPassword, 10);

    // Atualizar senha e limpar token
    await prisma.user.update({
      where: { id: user.id },
      data: {
        password: hashedPassword,
        resetToken: null,
        resetTokenExpiry: null
      }
    });

    console.log('✅ Senha resetada com sucesso para:', user.email);

    res.json({
      message: 'Senha alterada com sucesso! Você já pode fazer login.',
      success: true
    });

  } catch (error: any) {
    console.error('❌ Erro no reset-password:', error);
    res.status(500).json({ 
      error: 'Erro ao resetar senha',
      message: error.message 
    });
  }
});

// ✅ Rota para validar token (antes de mostrar formulário)
router.get('/validate-reset-token/:token', async (req: Request, res: Response) => {
  try {
    const { token } = req.params;

    const user = await prisma.user.findFirst({
      where: {
        resetToken: token,
        resetTokenExpiry: {
          gte: new Date()
        }
      },
      select: {
        email: true,
        name: true
      }
    });

    if (!user) {
      return res.status(400).json({ 
        valid: false,
        message: 'Token inválido ou expirado'
      });
    }

    res.json({
      valid: true,
      email: user.email,
      name: user.name
    });

  } catch (error: any) {
    console.error('❌ Erro ao validar token:', error);
    res.status(500).json({ 
      valid: false,
      message: error.message 
    });
  }
});

export default router;

