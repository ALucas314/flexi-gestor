// 📅 Rotas de Lotes (Batches)
// Este arquivo contém todas as rotas relacionadas aos lotes de produtos

import express, { Response } from 'express';
import { PrismaClient } from '@prisma/client';
import { authenticateToken, AuthRequest } from '../middleware/auth';

const router = express.Router();
const prisma = new PrismaClient();

// 🔐 Todas as rotas requerem autenticação
router.use(authenticateToken);

// 📋 Listar todos os lotes de um produto
router.get('/product/:productId', async (req: AuthRequest, res: Response) => {
  try {
    const { productId } = req.params;
    const userId = req.userId!;

    console.log(`📦 Listando lotes do produto: ${productId}`);

    // Buscar lotes do produto que pertencem ao usuário
    const batches = await prisma.batch.findMany({
      where: { 
        productId,
        userId 
      },
      include: {
        product: {
          select: {
            name: true,
            sku: true
          }
        }
      },
      orderBy: { expiryDate: 'asc' } // Ordenar por validade (vencimento próximo primeiro)
    });

    console.log(`✅ ${batches.length} lotes encontrados`);

    res.json({ batches });
  } catch (error: any) {
    console.error('❌ Erro ao listar lotes:', error);
    res.status(500).json({ 
      error: 'Erro ao buscar lotes',
      message: error.message 
    });
  }
});

// 📋 Listar todos os lotes (de todos os produtos)
router.get('/', async (req: AuthRequest, res: Response) => {
  try {
    const userId = req.userId!;

    console.log(`📦 Listando todos os lotes do usuário: ${userId}`);

    const batches = await prisma.batch.findMany({
      where: { userId },
      include: {
        product: {
          select: {
            name: true,
            sku: true,
            category: true
          }
        }
      },
      orderBy: { expiryDate: 'asc' }
    });

    console.log(`✅ ${batches.length} lotes encontrados`);

    res.json({ batches });
  } catch (error: any) {
    console.error('❌ Erro ao listar lotes:', error);
    res.status(500).json({ 
      error: 'Erro ao buscar lotes',
      message: error.message 
    });
  }
});

// ➕ Criar novo lote
router.post('/', async (req: AuthRequest, res: Response) => {
  try {
    const userId = req.userId!;
    const { productId, batchNumber, quantity, manufactureDate, expiryDate } = req.body;

    console.log('➕ Criando lote:', { productId, batchNumber, quantity });

    // Validar dados obrigatórios
    if (!productId || !batchNumber || !quantity) {
      return res.status(400).json({ 
        error: 'Dados incompletos',
        message: 'Produto, número do lote e quantidade são obrigatórios'
      });
    }

    // Verificar se o produto existe e pertence ao usuário
    const product = await prisma.product.findFirst({
      where: { id: productId, userId }
    });

    if (!product) {
      return res.status(404).json({ 
        error: 'Produto não encontrado'
      });
    }

    // Verificar se já existe lote com este número para este produto
    const existingBatch = await prisma.batch.findFirst({
      where: { 
        productId, 
        batchNumber,
        userId 
      }
    });

    if (existingBatch) {
      return res.status(400).json({ 
        error: 'Lote já existe',
        message: `Já existe um lote com o número ${batchNumber} para este produto`
      });
    }

    // Criar lote
    const batch = await prisma.batch.create({
      data: {
        productId,
        batchNumber,
        quantity: parseInt(quantity),
        manufactureDate: manufactureDate ? new Date(manufactureDate) : null,
        expiryDate: expiryDate ? new Date(expiryDate) : null,
        userId
      },
      include: {
        product: {
          select: {
            name: true,
            sku: true
          }
        }
      }
    });

    console.log('✅ Lote criado:', batch.id);
    console.log(`📦 Quantidade do lote: ${quantity} unidades`);

    res.status(201).json({
      message: 'Lote criado com sucesso',
      batch
    });
  } catch (error: any) {
    console.error('❌ Erro ao criar lote:', error);
    res.status(500).json({ 
      error: 'Erro ao criar lote',
      message: error.message 
    });
  }
});

// 🔄 Atualizar lote
router.put('/:id', async (req: AuthRequest, res: Response) => {
  try {
    const { id } = req.params;
    const userId = req.userId!;
    const { batchNumber, quantity, manufactureDate, expiryDate } = req.body;

    console.log('🔄 Atualizando lote:', id);

    // Verificar se o lote existe e pertence ao usuário
    const existingBatch = await prisma.batch.findFirst({
      where: { id, userId }
    });

    if (!existingBatch) {
      return res.status(404).json({ 
        error: 'Lote não encontrado'
      });
    }

    // Atualizar lote
    const batch = await prisma.batch.update({
      where: { id },
      data: {
        ...(batchNumber && { batchNumber }),
        ...(quantity && { quantity: parseInt(quantity) }),
        ...(manufactureDate && { manufactureDate: new Date(manufactureDate) }),
        ...(expiryDate && { expiryDate: new Date(expiryDate) })
      },
      include: {
        product: {
          select: {
            name: true,
            sku: true
          }
        }
      }
    });

    console.log('✅ Lote atualizado:', batch.id);

    res.json({
      message: 'Lote atualizado com sucesso',
      batch
    });
  } catch (error: any) {
    console.error('❌ Erro ao atualizar lote:', error);
    res.status(500).json({ 
      error: 'Erro ao atualizar lote',
      message: error.message 
    });
  }
});

// 🗑️ Deletar lote
router.delete('/:id', async (req: AuthRequest, res: Response) => {
  try {
    const { id } = req.params;
    const userId = req.userId!;

    console.log('🗑️ Deletando lote:', id);

    // Verificar se o lote existe e pertence ao usuário
    const existingBatch = await prisma.batch.findFirst({
      where: { id, userId }
    });

    if (!existingBatch) {
      return res.status(404).json({ 
        error: 'Lote não encontrado'
      });
    }

    // Deletar lote
    await prisma.batch.delete({
      where: { id }
    });

    console.log('✅ Lote deletado:', id);

    res.json({
      message: 'Lote deletado com sucesso'
    });
  } catch (error: any) {
    console.error('❌ Erro ao deletar lote:', error);
    res.status(500).json({ 
      error: 'Erro ao deletar lote',
      message: error.message 
    });
  }
});

// ⚠️ Listar lotes próximos do vencimento
router.get('/expiring-soon/:days', async (req: AuthRequest, res: Response) => {
  try {
    const userId = req.userId!;
    const days = parseInt(req.params.days) || 30;

    console.log(`⚠️ Buscando lotes que vencem em ${days} dias`);

    const futureDate = new Date();
    futureDate.setDate(futureDate.getDate() + days);

    const batches = await prisma.batch.findMany({
      where: { 
        userId,
        expiryDate: {
          lte: futureDate,
          gte: new Date() // Não incluir vencidos
        }
      },
      include: {
        product: {
          select: {
            name: true,
            sku: true,
            category: true
          }
        }
      },
      orderBy: { expiryDate: 'asc' }
    });

    console.log(`✅ ${batches.length} lotes próximos do vencimento`);

    res.json({ batches, days });
  } catch (error: any) {
    console.error('❌ Erro ao buscar lotes próximos do vencimento:', error);
    res.status(500).json({ 
      error: 'Erro ao buscar lotes',
      message: error.message 
    });
  }
});

// 🔴 Listar lotes vencidos
router.get('/expired', async (req: AuthRequest, res: Response) => {
  try {
    const userId = req.userId!;

    console.log('🔴 Buscando lotes vencidos');

    const batches = await prisma.batch.findMany({
      where: { 
        userId,
        expiryDate: {
          lt: new Date()
        }
      },
      include: {
        product: {
          select: {
            name: true,
            sku: true,
            category: true
          }
        }
      },
      orderBy: { expiryDate: 'desc' }
    });

    console.log(`✅ ${batches.length} lotes vencidos encontrados`);

    res.json({ batches });
  } catch (error: any) {
    console.error('❌ Erro ao buscar lotes vencidos:', error);
    res.status(500).json({ 
      error: 'Erro ao buscar lotes vencidos',
      message: error.message 
    });
  }
});

// 🔄 Sincronizar estoque do produto com seus lotes
router.post('/sync-product-stock/:productId', async (req: AuthRequest, res: Response) => {
  try {
    const { productId } = req.params;
    const userId = req.userId!;

    console.log('🔄 Sincronizando estoque do produto:', productId);

    // Verificar se o produto existe e pertence ao usuário
    const product = await prisma.product.findFirst({
      where: { id: productId, userId }
    });

    if (!product) {
      return res.status(404).json({ 
        error: 'Produto não encontrado'
      });
    }

    // Somar quantidade de todos os lotes do produto
    const batches = await prisma.batch.findMany({
      where: { productId, userId }
    });

    const totalInBatches = batches.reduce((sum, batch) => sum + batch.quantity, 0);

    // Atualizar estoque do produto
    const updatedProduct = await prisma.product.update({
      where: { id: productId },
      data: { stock: totalInBatches }
    });

    console.log(`✅ Estoque sincronizado: ${product.stock} → ${totalInBatches}`);

    res.json({
      message: 'Estoque sincronizado com sucesso',
      oldStock: product.stock,
      newStock: totalInBatches,
      batchesCount: batches.length
    });
  } catch (error: any) {
    console.error('❌ Erro ao sincronizar estoque:', error);
    res.status(500).json({ 
      error: 'Erro ao sincronizar estoque',
      message: error.message 
    });
  }
});

export default router;

