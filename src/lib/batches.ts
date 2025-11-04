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

// Verificar se número do lote já existe GLOBALMENTE (retorna true se já existe, false se não existe)
// Agora verifica em TODOS os produtos, não apenas no produto específico
export const checkBatchNumberExists = async (
  batchNumber: string,
  productId?: string, // Ignorado agora - verificação é global
  userId?: string
): Promise<boolean> => {
  try {
    // Verificar se o número do lote existe em QUALQUER produto (numeração global)
    const { data, error } = await supabase
      .from('lotes')
      .select('id')
      .eq('numero_lote', batchNumber)
      .limit(1);

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

// Buscar lote específico por número globalmente (sem filtrar por produto)
export const findBatchByNumber = async (
  batchNumber: string,
  userId?: string
): Promise<Batch | null> => {
  try {
    const { data, error } = await supabase
      .from('lotes')
      .select('*')
      .eq('numero_lote', batchNumber)
      .limit(1);

    if (error) {
      console.error('Erro ao buscar lote:', error);
      return null;
    }

    if (!data || data.length === 0) {
      return null;
    }

    const b = data[0];
    return {
      id: b.id,
      productId: b.produto_id,
      batchNumber: b.numero_lote,
      quantity: b.quantidade,
      unitCost: parseFloat(b.custo_unitario) || 0,
      manufactureDate: undefined,
      expiryDate: b.data_validade ? new Date(b.data_validade) : undefined,
      createdAt: new Date(b.criado_em)
    };
  } catch (error) {
    console.error('Erro ao buscar lote:', error);
    return null;
  }
};

// Buscar lote específico por número e produto (para verificar se existe e obter informações)
export const findBatchByNumberAndProduct = async (
  batchNumber: string,
  productId: string,
  userId?: string
): Promise<Batch | null> => {
  try {
    const { data, error } = await supabase
      .from('lotes')
      .select('*')
      .eq('numero_lote', batchNumber)
      .eq('produto_id', productId)
      .limit(1);

    if (error) {
      console.error('Erro ao buscar lote:', error);
      return null;
    }

    if (!data || data.length === 0) {
      return null;
    }

    const b = data[0];
    return {
      id: b.id,
      productId: b.produto_id,
      batchNumber: b.numero_lote,
      quantity: b.quantidade,
      unitCost: parseFloat(b.custo_unitario) || 0,
      manufactureDate: undefined,
      expiryDate: b.data_validade ? new Date(b.data_validade) : undefined,
      createdAt: new Date(b.criado_em)
    };
  } catch (error) {
    console.error('Erro ao buscar lote:', error);
    return null;
  }
};

// Buscar todos os lotes de todos os produtos (numeração global)
const getAllBatchesGlobal = async (userId: string): Promise<Batch[]> => {
  try {
    // Buscar TODOS os lotes de TODOS os produtos (RLS filtra automaticamente por usuario_id)
    const { data, error } = await supabase
      .from('lotes')
      .select('*')
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
      manufactureDate: undefined,
      expiryDate: b.data_validade ? new Date(b.data_validade) : undefined,
      createdAt: new Date(b.criado_em)
    }));
  } catch (error) {
    console.error('Erro ao buscar todos os lotes:', error);
    return [];
  }
};

// Gerar próximo número de lote disponível automaticamente (retorna apenas números: 1, 2, 3...)
// Numeração GLOBAL - considera lotes de TODOS os produtos
export const generateNextAvailableBatchNumber = async (
  productId: string,
  userId: string,
  currentBatches: Batch[] = []
): Promise<string> => {
  try {
    // Buscar TODOS os lotes de TODOS os produtos para numeração global
    const allBatches = await getAllBatchesGlobal(userId);
    
    console.log('[generateNextAvailableBatchNumber] Lotes encontrados globalmente:', allBatches.length);
    console.log('[generateNextAvailableBatchNumber] Números de lote encontrados:', allBatches.map(b => b.batchNumber));
    
    // Criar conjunto com números já usados (apenas os números extraídos)
    const usedNumbers = new Set<number>();
    
    // Função auxiliar para extrair número de um batchNumber
    const extractNumber = (batchNumber: string): number | null => {
      if (!batchNumber) return null;
      // Extrair número de strings como "Lote 1", "1", "Lote 123", etc.
      const numberMatch = batchNumber.match(/\d+/);
      if (numberMatch) {
        const num = parseInt(numberMatch[0], 10);
        return isNaN(num) ? null : num;
      }
      return null;
    };
    
    // Adicionar números de TODOS os lotes existentes no banco (de todos os produtos)
    allBatches.forEach(b => {
      if (b.batchNumber) {
        const num = extractNumber(b.batchNumber);
        if (num !== null) {
          usedNumbers.add(num);
          console.log('[generateNextAvailableBatchNumber] Número extraído:', b.batchNumber, '->', num);
        }
      }
    });
    
    // Adicionar números de lotes atuais na memória (ainda não salvos)
    currentBatches.forEach(b => {
      if (b.batchNumber) {
        const num = extractNumber(b.batchNumber);
        if (num !== null) {
          usedNumbers.add(num);
        }
      }
    });
    
    console.log('[generateNextAvailableBatchNumber] Números já usados (global):', Array.from(usedNumbers));
    
    // Gerar próximo número disponível começando de 1
    let nextNumber = 1;
    
    // Encontrar o próximo número que não está sendo usado
    while (usedNumbers.has(nextNumber)) {
      nextNumber++;
      
      // Proteção contra loop infinito
      if (nextNumber > 10000) {
        // Usar timestamp como fallback para garantir unicidade
        console.log('[generateNextAvailableBatchNumber] Proteção ativada, usando timestamp');
        return String(Date.now());
      }
    }
    
    console.log('[generateNextAvailableBatchNumber] Próximo número disponível (global):', nextNumber);
    
    // Retornar apenas o número (sem prefixo "Lote")
    return String(nextNumber);
  } catch (error) {
    console.error('Erro ao gerar número do lote:', error);
    // Fallback usando timestamp
    return String(Date.now());
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
    // Verificar se o número do lote já existe GLOBALMENTE (em qualquer produto)
    // Se existir, não criar novo - a lógica de adicionar ao existente deve ser feita antes
    const existingBatch = await findBatchByNumber(batchNumber, userId);
    if (existingBatch) {
      // Se o lote existente é do mesmo produto, não deveria chegar aqui
      // (a lógica de adicionar ao existente deve ser feita antes)
      // Mas se for de outro produto, permitir criar (números podem ser iguais em produtos diferentes)
      if (existingBatch.productId === productId) {
        console.error(`Número de lote '${batchNumber}' já existe para este produto`);
        throw new Error(`Número de lote '${batchNumber}' já existe para este produto. Adicione quantidade ao lote existente.`);
      }
      // Se for de outro produto, permitir criar (números podem ser iguais em produtos diferentes)
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

// 🔄 Sincronizar estoque do produto com a soma dos lotes
// Para produtos gerenciados por lote, o estoque deve ser sempre igual à soma dos lotes
export const syncProductStockFromBatches = async (
  productId: string,
  userId: string,
  updateProductStock: (productId: string, stock: number) => Promise<void>
): Promise<number | null> => {
  try {
    // Buscar todos os lotes do produto
    const batches = await getBatchesByProduct(productId, userId);
    
    // Calcular estoque total como soma dos lotes
    const totalStock = batches.reduce((sum, batch) => sum + batch.quantity, 0);
    
    // Atualizar estoque do produto
    await updateProductStock(productId, totalStock);
    
    console.log(`✅ [syncProductStockFromBatches] Estoque sincronizado: ${productId} -> ${totalStock} unidades`);
    
    return totalStock;
  } catch (error) {
    console.error('❌ [syncProductStockFromBatches] Erro ao sincronizar estoque:', error);
    return null;
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

