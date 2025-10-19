// 🔔 Rotas de Notificações
// Este arquivo contém todas as rotas relacionadas às notificações

import express, { Response } from 'express';
import { PrismaClient } from '@prisma/client';
import { authenticateToken, AuthRequest } from '../middleware/auth';

const router = express.Router();
const prisma = new PrismaClient();

// 🔐 Todas as rotas requerem autenticação
router.use(authenticateToken);

// 📋 Listar todas as notificações do usuário
router.get('/', async (req: AuthRequest, res: Response) => {
  try {
    const userId = req.userId!;

    const notifications = await prisma.notification.findMany({
      where: { userId },
      orderBy: { timestamp: 'desc' }
    });

    console.log(`🔔 Listando ${notifications.length} notificações para usuário:`, userId);

    res.json({ notifications });
  } catch (error: any) {
    console.error('❌ Erro ao listar notificações:', error);
    res.status(500).json({ 
      error: 'Erro ao buscar notificações',
      message: error.message 
    });
  }
});

// ➕ Criar nova notificação
router.post('/', async (req: AuthRequest, res: Response) => {
  try {
    const userId = req.userId!;
    const { title, message, type } = req.body;

    console.log('➕ Criando notificação:', { title, type });

    // Validar dados obrigatórios
    if (!title || !message || !type) {
      return res.status(400).json({ 
        error: 'Dados incompletos',
        message: 'Título, mensagem e tipo são obrigatórios'
      });
    }

    // Validar tipo
    const validTypes = ['success', 'error', 'warning', 'info'];
    if (!validTypes.includes(type)) {
      return res.status(400).json({ 
        error: 'Tipo inválido',
        message: 'O tipo deve ser: success, error, warning ou info'
      });
    }

    // Criar notificação
    const notification = await prisma.notification.create({
      data: {
        title,
        message,
        type,
        userId
      }
    });

    console.log('✅ Notificação criada:', notification.id);

    res.status(201).json({
      message: 'Notificação criada com sucesso',
      notification
    });
  } catch (error: any) {
    console.error('❌ Erro ao criar notificação:', error);
    res.status(500).json({ 
      error: 'Erro ao criar notificação',
      message: error.message 
    });
  }
});

// ✅ Marcar notificação como lida
router.patch('/:id/read', async (req: AuthRequest, res: Response) => {
  try {
    const { id } = req.params;
    const userId = req.userId!;

    console.log('✅ Marcando notificação como lida:', id);

    // Verificar se notificação existe e pertence ao usuário
    const existingNotification = await prisma.notification.findFirst({
      where: { id, userId }
    });

    if (!existingNotification) {
      return res.status(404).json({ 
        error: 'Notificação não encontrada'
      });
    }

    // Atualizar notificação
    const notification = await prisma.notification.update({
      where: { id },
      data: { read: true }
    });

    console.log('✅ Notificação marcada como lida:', notification.id);

    res.json({
      message: 'Notificação marcada como lida',
      notification
    });
  } catch (error: any) {
    console.error('❌ Erro ao marcar notificação:', error);
    res.status(500).json({ 
      error: 'Erro ao marcar notificação',
      message: error.message 
    });
  }
});

// 🗑️ Deletar TODAS as notificações (lidas e não lidas) - DEVE VIR ANTES DE /:id
router.delete('/all', async (req: AuthRequest, res: Response) => {
  try {
    const userId = req.userId!;

    console.log('🗑️ Deletando TODAS as notificações para usuário:', userId);

    const result = await prisma.notification.deleteMany({
      where: { 
        userId
      }
    });

    console.log(`✅ ${result.count} notificações deletadas`);

    res.json({
      message: `${result.count} notificações foram removidas`,
      count: result.count
    });
  } catch (error: any) {
    console.error('❌ Erro ao deletar todas as notificações:', error);
    res.status(500).json({ 
      error: 'Erro ao deletar notificações',
      message: error.message 
    });
  }
});

// 🧹 Limpar todas as notificações lidas
router.delete('/read/all', async (req: AuthRequest, res: Response) => {
  try {
    const userId = req.userId!;

    console.log('🧹 Limpando todas as notificações lidas para usuário:', userId);

    const result = await prisma.notification.deleteMany({
      where: { 
        userId,
        read: true
      }
    });

    console.log(`✅ ${result.count} notificações lidas deletadas`);

    res.json({
      message: `${result.count} notificações lidas foram removidas`,
      count: result.count
    });
  } catch (error: any) {
    console.error('❌ Erro ao limpar notificações:', error);
    res.status(500).json({ 
      error: 'Erro ao limpar notificações',
      message: error.message 
    });
  }
});

// 🗑️ Deletar notificação individual
router.delete('/:id', async (req: AuthRequest, res: Response) => {
  try {
    const { id } = req.params;
    const userId = req.userId!;

    console.log('🗑️ Deletando notificação:', id);

    // Verificar se notificação existe e pertence ao usuário
    const existingNotification = await prisma.notification.findFirst({
      where: { id, userId }
    });

    if (!existingNotification) {
      return res.status(404).json({ 
        error: 'Notificação não encontrada'
      });
    }

    // Deletar notificação
    await prisma.notification.delete({
      where: { id }
    });

    console.log('✅ Notificação deletada:', id);

    res.json({
      message: 'Notificação deletada com sucesso'
    });
  } catch (error: any) {
    console.error('❌ Erro ao deletar notificação:', error);
    res.status(500).json({ 
      error: 'Erro ao deletar notificação',
      message: error.message 
    });
  }
});

export default router;

