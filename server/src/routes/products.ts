// 📦 Rotas de Produtos
// Este arquivo contém todas as rotas relacionadas aos produtos

import express, { Response } from 'express';
import { PrismaClient } from '@prisma/client';
import { authenticateToken, AuthRequest } from '../middleware/auth';

const router = express.Router();
const prisma = new PrismaClient();

// 🔐 Todas as rotas requerem autenticação
router.use(authenticateToken);

// 📋 Listar todos os produtos do usuário
router.get('/', async (req: AuthRequest, res: Response) => {
  try {
    const userId = req.userId!;

    const products = await prisma.product.findMany({
      where: { userId },
      orderBy: { createdAt: 'desc' }
    });

    console.log(`📦 Listando ${products.length} produtos para usuário:`, userId);

    res.json({ products });
  } catch (error: any) {
    console.error('❌ Erro ao listar produtos:', error);
    res.status(500).json({ 
      error: 'Erro ao buscar produtos',
      message: error.message 
    });
  }
});

// 🔍 Buscar produto por ID
router.get('/:id', async (req: AuthRequest, res: Response) => {
  try {
    const { id } = req.params;
    const userId = req.userId!;

    const product = await prisma.product.findFirst({
      where: { 
        id,
        userId 
      }
    });

    if (!product) {
      return res.status(404).json({ 
        error: 'Produto não encontrado'
      });
    }

    res.json({ product });
  } catch (error: any) {
    console.error('❌ Erro ao buscar produto:', error);
    res.status(500).json({ 
      error: 'Erro ao buscar produto',
      message: error.message 
    });
  }
});

// ➕ Criar novo produto
router.post('/', async (req: AuthRequest, res: Response) => {
  try {
    const userId = req.userId!;
    const { name, description, category, price, stock, minStock, sku, status } = req.body;

    console.log('➕ Criando produto:', { name, sku });

    // Validar dados obrigatórios
    if (!name || !sku) {
      return res.status(400).json({ 
        error: 'Dados incompletos',
        message: 'Nome e SKU são obrigatórios'
      });
    }

    // Verificar se SKU já existe
    const existingSku = await prisma.product.findUnique({
      where: { sku }
    });

    if (existingSku) {
      return res.status(409).json({ 
        error: 'SKU já existe',
        message: 'Já existe um produto com este SKU'
      });
    }

    // Criar produto
    const product = await prisma.product.create({
      data: {
        name,
        description: description || '',
        category: category || 'Geral',
        price: price || 0,
        stock: stock || 0,
        minStock: minStock || 0,
        sku,
        status: status || 'ativo',
        userId
      }
    });

    console.log('✅ Produto criado:', product.id);

    res.status(201).json({
      message: 'Produto criado com sucesso',
      product
    });
  } catch (error: any) {
    console.error('❌ Erro ao criar produto:', error);
    res.status(500).json({ 
      error: 'Erro ao criar produto',
      message: error.message 
    });
  }
});

// ✏️ Atualizar produto
router.put('/:id', async (req: AuthRequest, res: Response) => {
  try {
    const { id } = req.params;
    const userId = req.userId!;
    const updateData = req.body;

    console.log('✏️ Atualizando produto:', id);

    // Verificar se produto existe e pertence ao usuário
    const existingProduct = await prisma.product.findFirst({
      where: { id, userId }
    });

    if (!existingProduct) {
      return res.status(404).json({ 
        error: 'Produto não encontrado'
      });
    }

    // Atualizar produto
    const product = await prisma.product.update({
      where: { id },
      data: updateData
    });

    console.log('✅ Produto atualizado:', product.id);

    res.json({
      message: 'Produto atualizado com sucesso',
      product
    });
  } catch (error: any) {
    console.error('❌ Erro ao atualizar produto:', error);
    res.status(500).json({ 
      error: 'Erro ao atualizar produto',
      message: error.message 
    });
  }
});

// 🗑️ Deletar produto
router.delete('/:id', async (req: AuthRequest, res: Response) => {
  try {
    const { id } = req.params;
    const userId = req.userId!;

    console.log('🗑️ Deletando produto:', id);

    // Verificar se produto existe e pertence ao usuário
    const existingProduct = await prisma.product.findFirst({
      where: { id, userId }
    });

    if (!existingProduct) {
      return res.status(404).json({ 
        error: 'Produto não encontrado'
      });
    }

    // Deletar produto
    await prisma.product.delete({
      where: { id }
    });

    console.log('✅ Produto deletado:', id);

    res.json({
      message: 'Produto deletado com sucesso'
    });
  } catch (error: any) {
    console.error('❌ Erro ao deletar produto:', error);
    res.status(500).json({ 
      error: 'Erro ao deletar produto',
      message: error.message 
    });
  }
});

export default router;

