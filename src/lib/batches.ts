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

// Criar um novo lote
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

