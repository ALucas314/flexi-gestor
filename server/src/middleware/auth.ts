// 🔐 Middleware de Autenticação JWT
// Este middleware valida o token JWT nas requisições protegidas

import { Request, Response, NextFunction } from 'express';
import jwt from 'jsonwebtoken';

// Chave secreta para JWT (em produção, usar variável de ambiente)
const JWT_SECRET = process.env.JWT_SECRET || 'flexi-gestor-secret-key-2024';

// Interface para o payload do JWT
export interface AuthRequest extends Request {
  userId?: string;
  userEmail?: string;
}

// 🔐 Middleware de autenticação
export const authenticateToken = (
  req: AuthRequest,
  res: Response,
  next: NextFunction
) => {
  try {
    // Pegar o token do header Authorization
    const authHeader = req.headers['authorization'];
    const token = authHeader && authHeader.split(' ')[1]; // Format: "Bearer TOKEN"

    if (!token) {
      return res.status(401).json({ 
        error: 'Token não fornecido',
        message: 'Você precisa estar autenticado para acessar este recurso'
      });
    }

    // Verificar e decodificar o token
    jwt.verify(token, JWT_SECRET, (err, decoded: any) => {
      if (err) {
        return res.status(403).json({ 
          error: 'Token inválido',
          message: 'Seu token de autenticação é inválido ou expirou'
        });
      }

      // Adicionar informações do usuário à requisição
      req.userId = decoded.userId;
      req.userEmail = decoded.email;
      
      console.log(`✅ Usuário autenticado: ${decoded.email}`);
      next();
    });
  } catch (error) {
    console.error('❌ Erro no middleware de autenticação:', error);
    res.status(500).json({ 
      error: 'Erro na autenticação',
      message: 'Erro ao validar token'
    });
  }
};

// 🔑 Função para gerar token JWT
export const generateToken = (userId: string, email: string): string => {
  // Token expira em 30 dias
  return jwt.sign(
    { userId, email },
    JWT_SECRET,
    { expiresIn: '30d' }
  );
};

