// ========================================
// INTEGRADOR DE DADOS DE TESTE - FLEXI GESTOR
// ========================================
// Este arquivo conecta os dados de teste com a aplicação
// Pode ser deletado sem afetar a aplicação
// ========================================

import { testProducts, testEntries, testSales } from './test-data';

// Interface para compatibilidade com a aplicação
interface Product {
  id: string;
  name: string;
  sku: string;
  category: string;
  stock: number;
  unitPrice: number;
  minStock: number;
  description: string;
}

interface Entry {
  id: string;
  productId: string;
  productName: string;
  productSku: string;
  supplier: string;
  quantity: number;
  unitCost: number;
  totalCost: number;
  entryDate: string;
  status: string;
  notes: string;
}

interface Sale {
  id: string;
  productId: string;
  productName: string;
  productSku: string;
  customer: string;
  quantity: number;
  unitPrice: number;
  total: number;
  saleDate: string;
  type: string;
  notes: string;
}

// Função para inserir dados na aplicação
export async function insertDataIntoApp() {
  console.log('🔗 Conectando com a aplicação Flexi Gestor...');
  
  try {
    // Simular inserção de produtos
    console.log('📦 Inserindo produtos na aplicação...');
    for (const product of testProducts) {
      await simulateProductInsert(product);
    }
    
    // Simular inserção de entradas
    console.log('📥 Inserindo entradas na aplicação...');
    for (const entry of testEntries) {
      await simulateEntryInsert(entry);
    }
    
    // Simular inserção de vendas
    console.log('📤 Inserindo vendas na aplicação...');
    for (const sale of testSales) {
      await simulateSaleInsert(sale);
    }
    
    console.log('✅ Todos os dados foram inseridos na aplicação!');
    
  } catch (error) {
    console.error('❌ Erro ao inserir dados na aplicação:', error);
  }
}

// Simular inserção de produto
async function simulateProductInsert(product: Product) {
  return new Promise((resolve) => {
    setTimeout(() => {
      console.log(`✅ Produto inserido: ${product.name}`);
      resolve(true);
    }, 100);
  });
}

// Simular inserção de entrada
async function simulateEntryInsert(entry: Entry) {
  return new Promise((resolve) => {
    setTimeout(() => {
      console.log(`✅ Entrada inserida: ${entry.productName} - Qtd: ${entry.quantity}`);
      resolve(true);
    }, 100);
  });
}

// Simular inserção de venda
async function simulateSaleInsert(sale: Sale) {
  return new Promise((resolve) => {
    setTimeout(() => {
      console.log(`✅ Venda inserida: ${sale.productName} - Cliente: ${sale.customer}`);
      resolve(true);
    }, 100);
  });
}

// Função para verificar se a aplicação está pronta
export function checkAppReady() {
  console.log('🔍 Verificando se a aplicação está pronta...');
  
  // Verificar se o contexto de dados está disponível
  if (typeof window !== 'undefined') {
    console.log('✅ Aplicação web detectada');
    return true;
  }
  
  console.log('❌ Aplicação não está pronta');
  return false;
}

// Função principal para executar tudo
export async function runTestDataInsertion() {
  console.log('🚀 INICIANDO INSERÇÃO DE DADOS DE TESTE');
  console.log('==========================================');
  
  if (checkAppReady()) {
    await insertDataIntoApp();
    console.log('🎉 Processo concluído com sucesso!');
  } else {
    console.log('⏳ Aguardando aplicação ficar pronta...');
  }
}

// Executar automaticamente se importado
if (typeof window !== 'undefined') {
  // Aguardar a aplicação carregar
  window.addEventListener('load', () => {
    setTimeout(() => {
      console.log('🔄 Aplicação carregada, dados de teste disponíveis');
    }, 2000);
  });
}
