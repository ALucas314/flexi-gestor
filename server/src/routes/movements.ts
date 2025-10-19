// 📊 Rotas de Movimentações
// Este arquivo contém todas as rotas relacionadas às movimentações de estoque

import express, { Response } from 'express';
import { PrismaClient } from '@prisma/client';
import { authenticateToken, AuthRequest } from '../middleware/auth';

const router = express.Router();
const prisma = new PrismaClient();

// 🔐 Todas as rotas requerem autenticação
router.use(authenticateToken);

// 📋 Listar todas as movimentações do usuário
router.get('/', async (req: AuthRequest, res: Response) => {
  try {
    const userId = req.userId!;

    const movements = await prisma.movement.findMany({
      where: { userId },
      include: {
        product: {
          select: {
            id: true,
            name: true,
            sku: true
          }
        }
      },
      orderBy: { date: 'desc' }
    });

    console.log(`📊 Listando ${movements.length} movimentações para usuário:`, userId);

    res.json({ movements });
  } catch (error: any) {
    console.error('❌ Erro ao listar movimentações:', error);
    res.status(500).json({ 
      error: 'Erro ao buscar movimentações',
      message: error.message 
    });
  }
});

// ➕ Criar nova movimentação
router.post('/', async (req: AuthRequest, res: Response) => {
  try {
    const userId = req.userId!;
    const { type, productId, quantity, unitPrice, description, date } = req.body;

    console.log('➕ Criando movimentação:', { type, productId, quantity });

    // Validar dados obrigatórios
    if (!type || !productId || !quantity || unitPrice === undefined) {
      return res.status(400).json({ 
        error: 'Dados incompletos',
        message: 'Tipo, produto, quantidade e preço unitário são obrigatórios'
      });
    }

    // Verificar se produto existe e pertence ao usuário
    const product = await prisma.product.findFirst({
      where: { 
        id: productId,
        userId 
      }
    });

    if (!product) {
      return res.status(404).json({ 
        error: 'Produto não encontrado',
        message: 'O produto especificado não foi encontrado'
      });
    }

    // Calcular total
    const total = quantity * unitPrice;

    // Gerar número único para receitas (saídas) e notas fiscais (entradas)
    let receiptNumber = null;
    const now = new Date();
    const year = now.getFullYear();
    const month = String(now.getMonth() + 1).padStart(2, '0');
    const day = String(now.getDate()).padStart(2, '0');
    const hours = String(now.getHours()).padStart(2, '0');
    const minutes = String(now.getMinutes()).padStart(2, '0');
    const seconds = String(now.getSeconds()).padStart(2, '0');
    const milliseconds = String(now.getMilliseconds()).padStart(3, '0');
    
    if (type === 'saida') {
      receiptNumber = `REC-${year}${month}${day}-${hours}${minutes}${seconds}${milliseconds}`;
    } else if (type === 'entrada') {
      receiptNumber = `NFC-${year}${month}${day}-${hours}${minutes}${seconds}${milliseconds}`;
    }

    // Criar movimentação
    const movement = await prisma.movement.create({
      data: {
        type,
        quantity,
        unitPrice,
        total,
        description: description || '',
        date: date ? new Date(date) : new Date(),
        receiptNumber,
        productId,
        userId
      },
      include: {
        product: {
          select: {
            id: true,
            name: true,
            sku: true
          }
        }
      }
    });

    // Atualizar estoque do produto
    let newStock = product.stock;
    
    if (type === 'entrada') {
      newStock += quantity;
    } else if (type === 'saida') {
      newStock = Math.max(0, newStock - quantity);
    } else if (type === 'ajuste') {
      newStock = quantity; // Ajuste define o estoque exato
    }

    await prisma.product.update({
      where: { id: productId },
      data: { stock: newStock }
    });

    console.log('✅ Movimentação criada:', movement.id);
    console.log('📦 Estoque atualizado:', { produto: product.name, estoque: newStock });

    res.status(201).json({
      message: 'Movimentação criada com sucesso',
      movement
    });
  } catch (error: any) {
    console.error('❌ Erro ao criar movimentação:', error);
    res.status(500).json({ 
      error: 'Erro ao criar movimentação',
      message: error.message 
    });
  }
});

// 📊 Obter estatísticas de movimentações
router.get('/stats', async (req: AuthRequest, res: Response) => {
  try {
    const userId = req.userId!;

    // Movimentações de hoje
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    const todayMovements = await prisma.movement.findMany({
      where: {
        userId,
        date: {
          gte: today
        }
      }
    });

    const todayEntradas = todayMovements
      .filter(m => m.type === 'entrada')
      .reduce((sum, m) => sum + m.total, 0);

    const todaySaidas = todayMovements
      .filter(m => m.type === 'saida')
      .reduce((sum, m) => sum + m.total, 0);

    // Movimentações do mês
    const firstDayOfMonth = new Date(today.getFullYear(), today.getMonth(), 1);

    const monthMovements = await prisma.movement.findMany({
      where: {
        userId,
        date: {
          gte: firstDayOfMonth
        }
      }
    });

    const monthEntradas = monthMovements
      .filter(m => m.type === 'entrada')
      .reduce((sum, m) => sum + m.total, 0);

    const monthSaidas = monthMovements
      .filter(m => m.type === 'saida')
      .reduce((sum, m) => sum + m.total, 0);

    res.json({
      today: {
        entradas: todayEntradas,
        saidas: todaySaidas,
        total: todayMovements.length
      },
      month: {
        entradas: monthEntradas,
        saidas: monthSaidas,
        total: monthMovements.length
      }
    });
  } catch (error: any) {
    console.error('❌ Erro ao buscar estatísticas:', error);
    res.status(500).json({ 
      error: 'Erro ao buscar estatísticas',
      message: error.message 
    });
  }
});

export default router;

