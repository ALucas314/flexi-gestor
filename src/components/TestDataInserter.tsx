import React from 'react';
import { useData } from '@/contexts/DataContext';
import { X, Plus, Database } from 'lucide-react';

// Dados de produtos de AÇAÍ para teste
const testProducts = [
  {
    name: 'Açaí Puro Premium',
    description: 'Açaí 100% natural, sem conservantes, congelado',
    category: 'Açaí',
    price: 24.99,
    stock: 150,
    minStock: 30,
    sku: 'ACAI-PURO-500G',
    status: 'ativo' as const
  },
  {
    name: 'Açaí com Guaraná',
    description: 'Açaí misturado com guaraná natural, sabor único',
    category: 'Açaí',
    price: 26.99,
    stock: 120,
    minStock: 25,
    sku: 'ACAI-GUARANA-500G',
    status: 'ativo' as const
  },
  {
    name: 'Açaí com Banana',
    description: 'Açaí cremoso com banana, perfeito para smoothies',
    category: 'Açaí',
    price: 28.99,
    stock: 100,
    minStock: 20,
    sku: 'ACAI-BANANA-500G',
    status: 'ativo' as const
  },
  {
    name: 'Açaí com Morango',
    description: 'Açaí com morangos frescos, sabor delicioso',
    category: 'Açaí',
    price: 29.99,
    stock: 80,
    minStock: 15,
    sku: 'ACAI-MORANGO-500G',
    status: 'ativo' as const
  },
  {
    name: 'Granola Tradicional',
    description: 'Granola com aveia, mel e frutas secas',
    category: 'Complementos',
    price: 18.99,
    stock: 200,
    minStock: 40,
    sku: 'GRANOLA-TRAD-300G',
    status: 'ativo' as const
  },
  {
    name: 'Granola de Açaí',
    description: 'Granola especial com pedaços de açaí desidratado',
    category: 'Complementos',
    price: 22.99,
    stock: 150,
    minStock: 30,
    sku: 'GRANOLA-ACAI-300G',
    status: 'ativo' as const
  },
  {
    name: 'Banana Desidratada',
    description: 'Banana desidratada natural, sem açúcar',
    category: 'Complementos',
    price: 15.99,
    stock: 180,
    minStock: 35,
    sku: 'BANANA-DESID-200G',
    status: 'ativo' as const
  },
  {
    name: 'Morango Desidratado',
    description: 'Morangos desidratados, perfeitos para topping',
    category: 'Complementos',
    price: 19.99,
    stock: 120,
    minStock: 25,
    sku: 'MORANGO-DESID-200G',
    status: 'ativo' as const
  },
  {
    name: 'Copo Plástico 500ml',
    description: 'Copo descartável para açaí, 500ml',
    category: 'Embalagens',
    price: 0.89,
    stock: 1000,
    minStock: 200,
    sku: 'COPO-500ML-UN',
    status: 'ativo' as const
  },
  {
    name: 'Copo Plástico 300ml',
    description: 'Copo descartável para açaí, 300ml',
    category: 'Embalagens',
    price: 0.69,
    stock: 1200,
    minStock: 250,
    sku: 'COPO-300ML-UN',
    status: 'ativo' as const
  },
  {
    name: 'Colher de Plástico',
    description: 'Colher descartável para açaí, resistente',
    category: 'Embalagens',
    price: 0.29,
    stock: 2000,
    minStock: 400,
    sku: 'COLHER-PLAST-UN',
    status: 'ativo' as const
  },
  {
    name: 'Saco Plástico Pequeno',
    description: 'Saco plástico para açaí, tamanho pequeno',
    category: 'Embalagens',
    price: 0.19,
    stock: 1500,
    minStock: 300,
    sku: 'SACO-PEQ-UN',
    status: 'ativo' as const
  },
  {
    name: 'Saco Plástico Grande',
    description: 'Saco plástico para açaí, tamanho grande',
    category: 'Embalagens',
    price: 0.29,
    stock: 1200,
    minStock: 250,
    sku: 'SACO-GRANDE-UN',
    status: 'ativo' as const
  },
  {
    name: 'Xarope de Guaraná',
    description: 'Xarope de guaraná natural para bebidas',
    category: 'Bebidas',
    price: 34.99,
    stock: 60,
    minStock: 15,
    sku: 'XAROPE-GUARANA-1L',
    status: 'ativo' as const
  },
  {
    name: 'Xarope de Morango',
    description: 'Xarope de morango natural para bebidas',
    category: 'Bebidas',
    price: 32.99,
    stock: 70,
    minStock: 20,
    sku: 'XAROPE-MORANGO-1L',
    status: 'ativo' as const
  },
  {
    name: 'Leite Condensado',
    description: 'Leite condensado para complementar açaí',
    category: 'Complementos',
    price: 8.99,
    stock: 300,
    minStock: 60,
    sku: 'LEITE-COND-395G',
    status: 'ativo' as const
  },
  {
    name: 'Leite em Pó',
    description: 'Leite em pó para preparar açaí',
    category: 'Complementos',
    price: 12.99,
    stock: 250,
    minStock: 50,
    sku: 'LEITE-PO-400G',
    status: 'ativo' as const
  },
  {
    name: 'Açúcar Refinado',
    description: 'Açúcar refinado para adoçar bebidas',
    category: 'Complementos',
    price: 6.99,
    stock: 400,
    minStock: 80,
    sku: 'ACUCAR-REF-1KG',
    status: 'ativo' as const
  },
  {
    name: 'Mel Natural',
    description: 'Mel natural para adoçar açaí',
    category: 'Complementos',
    price: 24.99,
    stock: 100,
    minStock: 25,
    sku: 'MEL-NATURAL-500G',
    status: 'ativo' as const
  }
];

// Dados de movimentações para teste
const testMovements = [
  {
    type: 'entrada' as const,
    productId: '', // Será preenchido dinamicamente
    productName: 'Açaí Puro Premium',
    quantity: 200,
    unitPrice: 18.99,
    description: 'Lote de açaí puro para estoque inicial',
    date: new Date('2024-01-15')
  },
  {
    type: 'entrada' as const,
    productId: '',
    productName: 'Granola Tradicional',
    quantity: 300,
    unitPrice: 14.99,
    description: 'Granola para complementar açaí',
    date: new Date('2024-01-16')
  },
  {
    type: 'entrada' as const,
    productId: '',
    productName: 'Copo Plástico 500ml',
    quantity: 1500,
    unitPrice: 0.69,
    description: 'Copos para atender demanda alta',
    date: new Date('2024-01-17')
  },
  {
    type: 'saida' as const,
    productId: '',
    productName: 'Açaí Puro Premium',
    quantity: 25,
    unitPrice: 24.99,
    description: 'Venda para cliente restaurante',
    date: new Date('2024-01-20')
  },
  {
    type: 'saida' as const,
    productId: '',
    productName: 'Granola Tradicional',
    quantity: 15,
    unitPrice: 18.99,
    description: 'Venda para cliente lanchonete',
    date: new Date('2024-01-21')
  }
];

// Componente para inserir dados de teste
export const TestDataInserter: React.FC = () => {
  const { addProduct, addMovement, products, movements, refreshData } = useData();
  const [isOpen, setIsOpen] = React.useState(false);
  const [isInserting, setIsInserting] = React.useState(false);
  const [insertedCount, setInsertedCount] = React.useState(0);

  const insertTestData = async () => {
    setIsInserting(true);
    setInsertedCount(0);

    try {
      console.log('🍇 Iniciando inserção de dados de AÇAÍ...');
      
      // Inserir produtos
      console.log('➕ Inserindo produtos...');
      for (const product of testProducts) {
        addProduct(product);
        setInsertedCount(prev => prev + 1);
        await new Promise(resolve => setTimeout(resolve, 100)); // Delay para visualização
      }

      // Aguardar produtos serem inseridos e sincronizados
      await new Promise(resolve => setTimeout(resolve, 1000));
      
      // Forçar atualização dos dados
      refreshData();
      
      // Aguardar mais um pouco para garantir sincronização
      await new Promise(resolve => setTimeout(resolve, 500));

      // Inserir movimentações (agora com IDs reais dos produtos)
      console.log('📥 Inserindo movimentações...');
      for (const movement of testMovements) {
        // Encontrar o produto correspondente
        const product = products.find(p => p.name === movement.productName);
        if (product) {
          addMovement({
            ...movement,
            productId: product.id
          });
          setInsertedCount(prev => prev + 1);
          await new Promise(resolve => setTimeout(resolve, 100));
        }
      }

      // Forçar atualização final
      refreshData();
      
      console.log('✅ Todos os dados de AÇAÍ foram inseridos e sincronizados!');
      
      // Mostrar mensagem de sucesso
      setTimeout(() => {
        alert('🎉 Dados inseridos com sucesso! Agora você pode fazer vendas e ver as estatísticas no dashboard!');
      }, 500);
      
    } catch (error) {
      console.error('❌ Erro ao inserir dados:', error);
      alert('❌ Erro ao inserir dados. Verifique o console para mais detalhes.');
    } finally {
      setIsInserting(false);
    }
  };

  const clearTestData = () => {
    // Limpar dados do localStorage
    localStorage.removeItem('flexi-products');
    localStorage.removeItem('flexi-moviments');
    
    // Forçar atualização do contexto
    refreshData();
    
    // Recarregar a página para limpar estado completamente
    setTimeout(() => {
      window.location.reload();
    }, 500);
  };

  return (
    <>
      {/* Bolinha flutuante */}
      <button
        onClick={() => setIsOpen(true)}
        className="fixed bottom-6 right-6 z-50 w-16 h-16 bg-gradient-to-br from-purple-500 to-purple-600 rounded-full shadow-2xl hover:shadow-3xl hover:scale-110 transition-all duration-300 flex items-center justify-center group"
        title="Inserir Dados de Teste"
      >
        <Database className="w-8 h-8 text-white group-hover:rotate-12 transition-transform duration-300" />
        
        {/* Indicador de notificação */}
        <div className="absolute -top-2 -right-2 w-6 h-6 bg-red-500 rounded-full flex items-center justify-center">
          <span className="text-xs text-white font-bold">20</span>
        </div>
      </button>

      {/* Pop-up Modal */}
      {isOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center">
          {/* Backdrop */}
          <div 
            className="absolute inset-0 bg-black/50 backdrop-blur-sm"
            onClick={() => setIsOpen(false)}
          />
          
          {/* Modal */}
          <div className="relative bg-white rounded-3xl shadow-2xl border-0 p-6 max-w-md w-full mx-4 transform transition-all duration-300 scale-100">
            {/* Botão fechar */}
            <button
              onClick={() => setIsOpen(false)}
              className="absolute top-4 right-4 w-8 h-8 bg-gray-100 hover:bg-gray-200 rounded-full flex items-center justify-center transition-colors"
            >
              <X className="w-4 h-4 text-gray-600" />
            </button>

            {/* Header */}
            <div className="text-center mb-6">
              <div className="w-16 h-16 bg-gradient-to-br from-purple-500 to-purple-600 rounded-full flex items-center justify-center mx-auto mb-4">
                <Database className="w-8 h-8 text-white" />
              </div>
              <h3 className="text-2xl font-bold text-gray-900">🍇 Dados de AÇAÍ</h3>
              <p className="text-gray-600 mt-2">Inserir produtos e movimentações de teste</p>
            </div>

            {/* Conteúdo */}
            {isInserting ? (
              <div className="space-y-4 text-center">
                <div className="flex items-center justify-center space-x-2">
                  <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-purple-600"></div>
                  <span className="text-lg text-gray-700">Inserindo dados...</span>
                </div>
                
                <div className="bg-gray-100 rounded-lg p-4">
                  <div className="text-sm text-gray-600 mb-2">Progresso</div>
                  <div className="text-2xl font-bold text-purple-600">
                    {insertedCount} / {testProducts.length + testMovements.length}
                  </div>
                </div>

                <div className="text-sm text-gray-500">
                  Produtos e movimentações sendo inseridos...
                </div>
              </div>
            ) : (
              <div className="space-y-4">
                {/* Status da sincronização */}
                <div className="bg-blue-50 rounded-xl p-4 border border-blue-200">
                  <div className="flex items-center space-x-2 mb-2">
                    <div className="w-3 h-3 bg-blue-500 rounded-full animate-pulse"></div>
                    <span className="text-sm font-medium text-blue-700">Status da Sincronização</span>
                  </div>
                  <div className="text-xs text-blue-600">
                    Produtos: {products.length} | Movimentações: {movements.length}
                  </div>
                </div>

                {/* Resumo dos dados */}
                <div className="grid grid-cols-2 gap-4 mb-6">
                  <div className="bg-purple-50 rounded-xl p-4 text-center">
                    <div className="text-2xl font-bold text-purple-600">{testProducts.length}</div>
                    <div className="text-sm text-purple-700">Produtos</div>
                  </div>
                  <div className="bg-blue-50 rounded-xl p-4 text-center">
                    <div className="text-2xl font-bold text-blue-600">{testMovements.length}</div>
                    <div className="text-sm text-blue-700">Movimentações</div>
                  </div>
                </div>

                {/* Botões */}
                <button
                  onClick={insertTestData}
                  className="w-full bg-gradient-to-r from-purple-600 to-purple-700 text-white px-6 py-4 rounded-2xl hover:from-purple-700 hover:to-purple-800 transition-all duration-300 shadow-lg hover:shadow-xl transform hover:scale-105 font-semibold text-lg"
                >
                  🚀 Inserir Dados de Teste
                </button>
                
                <button
                  onClick={refreshData}
                  className="w-full bg-gradient-to-r from-blue-500 to-blue-600 text-white px-4 py-3 rounded-xl hover:from-blue-600 hover:to-blue-700 transition-all duration-300 shadow-lg hover:shadow-xl font-medium"
                >
                  🔄 Atualizar Dados
                </button>
                
                <button
                  onClick={clearTestData}
                  className="w-full bg-gradient-to-r from-red-500 to-red-600 text-white px-6 py-3 rounded-xl hover:from-red-600 hover:to-red-700 transition-all duration-300 shadow-lg hover:shadow-xl font-medium"
                >
                  🗑️ Limpar Todos os Dados
                </button>
                
                <div className="text-xs text-gray-500 text-center pt-2">
                  Produtos de açaí, complementos e embalagens
                </div>
              </div>
            )}
          </div>
        </div>
      )}
    </>
  );
};

export default TestDataInserter;
