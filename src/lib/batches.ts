/**
 * 📦 Helper para gerenciar Batches no Supabase
 */

import { supabase } from './supabase';

export interface Batch {
  id: string;
  productId: string;
  batchNumber: string;
  quantity: number;
  unitCost: number;
  manufactureDate?: Date;
  expiryDate?: Date;
  createdAt: Date;
}

// Buscar todos os lotes de um produto
export const getBatchesByProduct = async (productId: string, userId: string): Promise<Batch[]> => {
  try {
    // Remover filtro por usuario_id - RLS automático faz isso!
    const { data, error } = await supabase
      .from('lotes')
      .select('*')
      .eq('produto_id', productId)
      .order('criado_em', { ascending: false });

    if (error) {
      throw error;
    }

    return (data || []).map((b: any) => ({
      id: b.id,
      productId: b.produto_id,
      batchNumber: b.numero_lote,
      quantity: b.quantidade,
      unitCost: parseFloat(b.custo_unitario) || 0,
      manufactureDate: undefined, // Removido do schema
      expiryDate: b.data_validade ? new Date(b.data_validade) : undefined,
      createdAt: new Date(b.criado_em)
    }));
  } catch (error) {
    return [];
  }
};

// Verificar se número do lote já existe (retorna true se já existe, false se não existe)
export const checkBatchNumberExists = async (
  batchNumber: string,
  productId?: string, // Se fornecido, verifica apenas para esse produto
  userId?: string
): Promise<boolean> => {
  try {
    let query = supabase
      .from('lotes')
      .select('id')
      .eq('numero_lote', batchNumber)
      .limit(1);

    // Se fornecido, verificar apenas no produto específico
    if (productId) {
      query = query.eq('produto_id', productId);
    }

    const { data, error } = await query;

    if (error) {
      console.error('Erro ao verificar número do lote:', error);
      return false;
    }

    return (data?.length || 0) > 0;
  } catch (error) {
    console.error('Erro ao verificar número do lote:', error);
    return false;
  }
};

// Gerar próximo número de lote disponível automaticamente
export const generateNextAvailableBatchNumber = async (
  productId: string,
  userId: string,
  currentBatches: Batch[] = []
): Promise<string> => {
  try {
    // Buscar todos os lotes existentes do banco para esse produto
    const existingBatches = await getBatchesByProduct(productId, userId);
    
    // Criar conjunto com números já usados
    const usedNumbers = new Set<string>();
    
    // Adicionar lotes existentes no banco
    existingBatches.forEach(b => {
      if (b.batchNumber) usedNumbers.add(b.batchNumber);
    });
    
    // Adicionar lotes atuais na memória (ainda não salvos)
    currentBatches.forEach(b => {
      if (b.batchNumber) usedNumbers.add(b.batchNumber);
    });
    
    // Gerar próximo número disponível começando de 1
    let nextNumber = 1;
    let batchNumber = '';
    
    while (true) {
      batchNumber = `Lote ${nextNumber}`;
      
      // Verificar se já existe no banco
      const exists = await checkBatchNumberExists(batchNumber, productId, userId);
      
      // Se não existe nem no banco nem na memória, usar este número
      if (!exists && !usedNumbers.has(batchNumber)) {
        break;
      }
      
      nextNumber++;
      
      // Proteção contra loop infinito
      if (nextNumber > 10000) {
        // Usar timestamp como fallback para garantir unicidade
        batchNumber = `Lote ${Date.now()}`;
        break;
      }
    }
    
    return batchNumber;
  } catch (error) {
    console.error('Erro ao gerar número do lote:', error);
    // Fallback usando timestamp
    return `Lote ${Date.now()}`;
  }
};

// Criar um novo lote com validação de unicidade
export const createBatch = async (
  productId: string,
  batchNumber: string,
  quantity: number,
  unitCost: number,
  userId: string,
  manufactureDate?: Date,
  expiryDate?: Date
): Promise<Batch | null> => {
  try {
    // Validar se o número do lote já existe
    const exists = await checkBatchNumberExists(batchNumber, productId, userId);
    if (exists) {
      console.error(`Número de lote '${batchNumber}' já existe para este produto`);
      throw new Error(`Número de lote '${batchNumber}' já existe. Use outro número.`);
    }

    // Buscar o produto para pegar o usuario_id correto (pode ser do usuário compartilhado)
    const { data: produto, error: produtoError } = await supabase
      .from('produtos')
      .select('usuario_id')
      .eq('id', productId)
      .single();

    if (produtoError) {
      throw produtoError;
    }

    const productOwnerId = produto?.usuario_id;
    
    if (!productOwnerId) {
      throw new Error('Produto não encontrado');
    }

    const { data, error } = await supabase
      .from('lotes')
      .insert([{
        produto_id: productId,
        numero_lote: batchNumber,
        quantidade: quantity,
        custo_unitario: unitCost,
        data_validade: expiryDate?.toISOString(),
        usuario_id: productOwnerId // Usar o dono do produto, não o usuário atual
      }])
      .select()
      .single();

    if (error) {
      throw error;
    }

    return {
      id: data.id,
      productId: data.produto_id,
      batchNumber: data.numero_lote,
      quantity: data.quantidade,
      unitCost: parseFloat(data.custo_unitario) || 0,
      manufactureDate: undefined,
      expiryDate: data.data_validade ? new Date(data.data_validade) : undefined,
      createdAt: new Date(data.criado_em)
    };
  } catch (error) {
    console.error('Erro ao criar lote:', error);
    return null;
  }
};

// Atualizar quantidade de um lote existente
export const updateBatchQuantity = async (
  batchId: string,
  newQuantity: number,
  userId: string
): Promise<boolean> => {
  try {
    // Remover filtro por usuario_id - RLS garante segurança
    const { error } = await supabase
      .from('lotes')
      .update({ quantidade: newQuantity })
      .eq('id', batchId);

    if (error) {
      throw error;
    }

    return true;
  } catch (error) {
    return false;
  }
};

// Deletar lote
export const deleteBatch = async (batchId: string, userId: string): Promise<boolean> => {
  try {
    // Remover filtro por usuario_id - RLS garante segurança
    const { error } = await supabase
      .from('lotes')
      .delete()
      .eq('id', batchId);

    if (error) {
      throw error;
    }

    return true;
  } catch (error) {
    return false;
  }
};

// Atualizar estoque ao fazer movimentação de entrada/saída
export const adjustBatchQuantity = async (
  batchId: string,
  quantityChange: number,
  userId: string
): Promise<boolean> => {
  try {
    // Buscar lote atual (RLS filtra automaticamente)
    const { data: batch, error: fetchError } = await supabase
      .from('lotes')
      .select('quantidade')
      .eq('id', batchId)
      .single();

    if (fetchError || !batch) {
      return false;
    }

    // Calcular nova quantidade
    const newQuantity = Math.max(0, batch.quantidade + quantityChange);

    // Atualizar
    return await updateBatchQuantity(batchId, newQuantity, userId);
  } catch (error) {
    return false;
  }
};

// Buscar todos os lotes disponíveis (com quantidade > 0) junto com informações do produto
export interface BatchWithProduct extends Batch {
  product: {
    id: string;
    name: string;
    sku: string;
    price: number;
    stock: number;
  };
}

export const getAllAvailableBatches = async (userId: string): Promise<BatchWithProduct[]> => {
  try {
    const { data, error } = await supabase
      .from('lotes')
      .select(`
        *,
        produtos:produto_id (
          id,
          nome,
          sku,
          preco,
          estoque
        )
      `)
      .gt('quantidade', 0)
      .order('criado_em', { ascending: false });

    if (error) {
      throw error;
    }

    return (data || [])
      .filter((b: any) => b.produtos) // Filtrar lotes sem produto (caso raro)
      .map((b: any) => ({
        id: b.id,
        productId: b.produto_id,
        batchNumber: b.numero_lote,
        quantity: b.quantidade,
        unitCost: parseFloat(b.custo_unitario) || 0,
        manufactureDate: undefined,
        expiryDate: b.data_validade ? new Date(b.data_validade) : undefined,
        createdAt: new Date(b.criado_em),
        product: {
          id: b.produtos.id,
          name: b.produtos.nome,
          sku: b.produtos.sku,
          price: parseFloat(b.produtos.preco) || 0,
          stock: parseFloat(b.produtos.estoque) || 0,
        }
      }));
  } catch (error) {
    console.error('Erro ao buscar lotes disponíveis:', error);
    return [];
  }
};

