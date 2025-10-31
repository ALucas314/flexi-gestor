// 🛒 Página de Ponto de Venda (PDV)
// Sistema de vendas rápido e intuitivo

import { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { ShoppingCart } from "lucide-react";
import { useData } from "@/contexts/DataContext";
import { useAuth } from "@/contexts/AuthContext";
import { toast } from "@/hooks/use-toast";
import { generateUniqueReceiptNumber } from "@/lib/utils";
import { getBatchesByProduct, adjustBatchQuantity, Batch as BatchInfo } from "@/lib/batches";
import { BatchSearch } from "@/components/pdv/BatchSearch";
import { ProductSearch } from "@/components/pdv/ProductSearch";
import { Cart } from "@/components/pdv/Cart";
import { ReceiptModal } from "@/components/pdv/ReceiptModal";
import { BatchSelectionDialog } from "@/components/pdv/BatchSelectionDialog";
import { usePDVCart, CartItem } from "@/hooks/usePDVCart";
import { useBatchSearch } from "@/hooks/useBatchSearch";
import { useProductSearch } from "@/hooks/useProductSearch";

interface ReceiptData {
  receiptNumber: string;
  date: string;
  items: CartItem[];
  total: number;
}

const PDV = () => {
  const { products, movements, addMovement, refreshMovements, refreshProducts } = useData();
  const { user } = useAuth();
  
  // Função para obter o preço baseado na entrada (última entrada do produto)
  const getPriceFromEntry = (productId: string): number => {
    // SEMPRE priorizar o preço de VENDA do produto (já calculado com markup)
    const product = products.find(p => p.id === productId);
    if (product && product.price > 0) {
      // Retornar o preço de venda do produto (já calculado com markup na compra)
      return product.price;
    }
    
    // Se o produto não tem preço de venda cadastrado, buscar do preço de compra da última entrada como fallback
    const productEntries = movements
      .filter(m => m.type === 'entrada' && m.productId === productId)
      .sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());
    
    if (productEntries.length > 0 && productEntries[0].unitPrice > 0) {
      // Usar preço de compra como fallback (mas deveria ter sido atualizado com markup)
      return productEntries[0].unitPrice;
    }
    
    // Último fallback: preço do produto (mesmo que seja 0)
    return product?.price || 0;
  };
  const [isProcessingSale, setIsProcessingSale] = useState(false);
  const [showReceipt, setShowReceipt] = useState(false);
  const [receiptData, setReceiptData] = useState<ReceiptData | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [paymentMethod, setPaymentMethod] = useState<string>("avista");
  const [installments, setInstallments] = useState<number>(1);
  const [productBatches, setProductBatches] = useState<Record<string, BatchInfo[]>>({});
  const [showBatchDialog, setShowBatchDialog] = useState(false);
  const [productPendingBatch, setProductPendingBatch] = useState<any>(null);
  const [selectedBatchForDialog, setSelectedBatchForDialog] = useState<string>("");

  // Hooks customizados
  const { cart, addItem, removeItem, updateQuantity, updateBatch, clearCart, getTotal } = usePDVCart();
  const { 
    availableBatches, 
    batchSearchTerm, 
    setBatchSearchTerm, 
    productSearchTerm, 
    setProductSearchTerm, 
    results: batchResults 
  } = useBatchSearch(user?.id, products);
  const { searchTerm: productSearch, setSearchTerm: setProductSearch, results: productResults } =
    useProductSearch(products);

  // Controlar estado de carregamento
  useEffect(() => {
    const timer = setTimeout(() => {
      setIsLoading(false);
    }, 500);
    
    return () => clearTimeout(timer);
  }, []);

  // Adicionar produto ao carrinho (para produtos não gerenciados por lote)
  const addToCart = async (product: any) => {
    if ((product as any).managedByBatch) {
      // Se gerenciado por lote, abrir diálogo para selecionar lote
      await loadBatchesForProduct(product.id);
      setProductPendingBatch(product);
      setShowBatchDialog(true);
      return;
    }

    // Buscar preço baseado na entrada (última movimentação de entrada)
    const productPrice = getPriceFromEntry(product.id);

    if (productPrice === 0) {
      toast({
        title: "⚠️ Aviso",
        description: `O produto ${product.name} não possui preço de entrada cadastrado. Por favor, cadastre uma entrada no módulo de Entradas.`,
        variant: "destructive",
      });
      return;
    }

    // Produto não gerenciado por lote: adicionar direto ao carrinho
    addItem({
        id: product.id,
        name: product.name,
      price: productPrice,
        quantity: 1,
      sku: product.sku,
    });
  };

  // Adicionar lote ao carrinho
  const addBatchToCart = async (batchWithProduct: any) => {
    try {
    const { product, id: batchId, batchNumber } = batchWithProduct;
      
      if (!product || !batchId || !batchNumber) {
        toast({
          title: "❌ Erro",
          description: "Dados do lote incompletos",
          variant: "destructive",
        });
        return;
      }
      
      // Buscar preço baseado na entrada (última movimentação de entrada)
      const productPrice = getPriceFromEntry(product.id);
      
      if (productPrice === 0) {
        toast({
          title: "⚠️ Aviso",
          description: `O produto ${product.name} não possui preço de entrada cadastrado. Por favor, cadastre uma entrada no módulo de Entradas.`,
          variant: "destructive",
        });
        return;
      }
    
    // Garantir que os lotes do produto estejam carregados para validação
    if (!productBatches[product.id]) {
      await loadBatchesForProduct(product.id);
    }
    
      addItem({
        id: product.id,
        name: product.name,
        price: productPrice,
        quantity: 1,
        sku: product.sku,
        selectedBatchId: batchId,
        selectedBatchNumber: batchNumber,
      });
    
    toast({
      title: "✅ Adicionado ao carrinho",
        description: `${product.name} - Lote ${batchNumber} - R$ ${productPrice.toFixed(2)}`,
      });
      
      // Limpar busca após adicionar
      setBatchSearchTerm("");
      setProductSearchTerm("");
    } catch (error: any) {
      console.error("Erro ao adicionar lote ao carrinho:", error);
      toast({
        title: "❌ Erro ao adicionar ao carrinho",
        description: error.message || "Ocorreu um erro ao adicionar o produto",
        variant: "destructive",
      });
    }
  };

  // Confirmar seleção de lote e adicionar ao carrinho
  const confirmBatchSelection = () => {
    if (!productPendingBatch || !selectedBatchForDialog) {
      toast({
        title: "❌ Selecione um Lote",
        description: "Por favor, selecione um lote antes de continuar",
        variant: "destructive",
      });
      return;
    }
    
    const batches = productBatches[productPendingBatch.id] || [];
    const selectedBatch = batches.find((b) => b.id === selectedBatchForDialog);
    
    if (!selectedBatch) {
      toast({
        title: "❌ Lote não encontrado",
        description: "O lote selecionado não foi encontrado",
        variant: "destructive",
      });
      return;
    }
    
    // Buscar preço baseado na entrada (última movimentação de entrada)
    const productPrice = getPriceFromEntry(productPendingBatch.id);
    
    if (productPrice === 0) {
      toast({
        title: "⚠️ Aviso",
        description: `O produto ${productPendingBatch.name} não possui preço de entrada cadastrado. Por favor, cadastre uma entrada no módulo de Entradas.`,
        variant: "destructive",
      });
      setShowBatchDialog(false);
      setProductPendingBatch(null);
      setSelectedBatchForDialog("");
      return;
    }

    addItem({
        id: productPendingBatch.id,
        name: productPendingBatch.name,
      price: productPrice,
        quantity: 1,
        sku: productPendingBatch.sku,
        selectedBatchId: selectedBatch.id,
      selectedBatchNumber: selectedBatch.batchNumber,
    });
    
    // Fechar diálogo
    setShowBatchDialog(false);
    setProductPendingBatch(null);
    setSelectedBatchForDialog("");
  };

  // Carregar lotes de um produto quando necessário
  const loadBatchesForProduct = async (productId: string) => {
    if (!user?.id) return [];
    if (productBatches[productId]) return productBatches[productId]; // já carregado
    const batches = await getBatchesByProduct(productId, user.id);
    setProductBatches((prev) => ({ ...prev, [productId]: batches || [] }));
    return batches || [];
  };

  // Alterar quantidade
  const handleUpdateQuantity = (id: string, delta: number) => {
    updateQuantity(id, delta);
  };

  // Alterar lote do item
  const handleBatchChange = (itemId: string, currentBatchId: string | undefined, newBatchId: string, batchNumber: string) => {
    updateBatch(itemId, currentBatchId, newBatchId, batchNumber);
  };

  // Finalizar venda
  const finalizeSale = async () => {
    if (cart.length === 0) return;
    if (isProcessingSale) return;

    const total = getTotal();
    
    // Validar estoque e lotes antes de processar
    for (const item of cart) {
      const product = products.find((p) => p.id === item.id);
      if (!product) {
        toast({
          title: "❌ Produto não encontrado",
          description: `O produto ${item.name} não está mais disponível`,
          variant: "destructive",
        });
        return;
      }
      
      if (product.stock <= 0) {
        toast({
          title: "❌ Estoque Zerado!",
          description: `O produto ${item.name} não tem estoque disponível`,
          variant: "destructive",
        });
        return;
      }
      
      if (product.stock < item.quantity) {
        toast({
          title: "❌ Estoque Insuficiente!",
          description: `${item.name}: apenas ${product.stock} unidades disponíveis`,
          variant: "destructive",
        });
        return;
      }

      // Se gerenciado por lote, exigir lote selecionado e validar quantidade do lote
      if ((product as any).managedByBatch) {
        if (!item.selectedBatchId) {
          toast({
            title: "❌ Selecione o lote",
            description: `Escolha o lote para o produto ${item.name} antes de finalizar`,
            variant: "destructive",
          });
          return;
        }
        const batches = productBatches[item.id] || [];
        const batch = batches.find((b) => b.id === item.selectedBatchId);
        if (!batch) {
          toast({
            title: "❌ Lote inválido",
            description: `O lote selecionado para ${item.name} não foi encontrado`,
            variant: "destructive",
          });
          return;
        }
        if (batch.quantity < item.quantity) {
          toast({
            title: "❌ Lote insuficiente",
            description: `${item.name} - Lote ${batch.batchNumber}: apenas ${batch.quantity} disponíveis`,
            variant: "destructive",
          });
          return;
        }
      }
    }
    
    setIsProcessingSale(true);
    
    try {
      // Criar uma movimentação de saída para cada item do carrinho
      for (const item of cart) {
        const product = products.find((p) => p.id === item.id);
        if (!product) {
          toast({
            title: "❌ Erro",
            description: `Produto ${item.name} não encontrado`,
            variant: "destructive",
          });
          continue;
        }

        // Garantir que o preço vem da entrada (não do carrinho que pode estar desatualizado)
        const salePrice = getPriceFromEntry(item.id);
        
        console.log(`[PDV] Processando venda - Produto: ${item.name}, Preço: R$ ${salePrice}, Quantidade: ${item.quantity}`);
        
        if (salePrice === 0) {
          toast({
            title: "⚠️ Aviso",
            description: `O produto ${item.name} não possui preço de entrada. A venda não será registrada. Por favor, cadastre uma entrada com preço no módulo de Entradas.`,
            variant: "destructive",
          });
          continue;
        }

        const paymentInfo =
          paymentMethod === "parcelado"
            ? `Pagamento: parcelado em ${installments}x`
            : `Pagamento: à vista (${paymentMethod})`;
        const loteInfo =
          (product as any)?.managedByBatch && item.selectedBatchNumber
            ? ` | Lote: ${item.selectedBatchNumber}`
            : "";
        
        const movementData = {
          type: "saida" as const,
          productId: item.id,
          quantity: item.quantity,
          unitPrice: salePrice,
          description: `Venda PDV - ${item.name} (${item.quantity} unidades)${loteInfo} | ${paymentInfo}`,
          paymentMethod: paymentMethod === "parcelado" ? `parcelado-${installments}x` : paymentMethod,
          date: new Date(),
          status: "confirmado" as const,
        };
        
        console.log(`[PDV] Criando movimentação:`, movementData);
        await addMovement(movementData);
        console.log(`[PDV] Movimentação criada com sucesso para ${item.name}`);

        // Se houver lote selecionado, decrementar quantidade do lote
        if ((product as any)?.managedByBatch && item.selectedBatchId && user?.id) {
          await adjustBatchQuantity(item.selectedBatchId, -item.quantity, user.id);
        }
      }
      
      // Dados já são recarregados automaticamente pelo addMovement
      // mas vamos garantir que está sincronizado
      await Promise.all([refreshMovements(), refreshProducts()]);
      
      // Gerar dados da receita
      const receipt: ReceiptData = {
        receiptNumber: generateUniqueReceiptNumber("REC"),
        date: new Date().toLocaleString("pt-BR"),
        items: [...cart],
        total: total,
      };
      
      // Mostrar toast de sucesso
      toast({
        title: "✅ Venda Finalizada!",
        description: `Total: R$ ${total.toFixed(2)} | ${cart.length} ${cart.length === 1 ? "item" : "itens"} vendido(s)`,
        duration: 5000,
      });
      
      // Mostrar receita
      setReceiptData(receipt);
      setShowReceipt(true);
      
      // Limpar carrinho
      clearCart();
      setPaymentMethod("avista");
      setInstallments(1);
    } catch (error: any) {
      console.error("Erro ao finalizar venda:", error);
      toast({
        title: "❌ Erro ao finalizar venda",
        description: error.message || "Ocorreu um erro ao processar a venda",
        variant: "destructive",
        duration: 5000,
      });
    } finally {
      setIsProcessingSale(false);
    }
  };

  // Tela de carregamento
  if (isLoading) {
    return (
      <main className="flex-1 p-3 sm:p-6 space-y-4 sm:space-y-6">
        <div className="flex items-center justify-center min-h-[400px]">
          <div className="text-center">
            <div className="w-16 h-16 bg-gradient-to-br from-indigo-500 to-indigo-600 rounded-full flex items-center justify-center mx-auto mb-4 animate-pulse">
              <ShoppingCart className="w-8 h-8 text-white" />
            </div>
            <h3 className="text-lg font-semibold text-gray-900 mb-2">🛒 Carregando PDV...</h3>
            <p className="text-gray-600">Preparando sistema de vendas</p>
          </div>
        </div>
      </main>
    );
  }

  return (
    <main className="flex-1 p-2 sm:p-6 space-y-3 sm:space-y-6">
      {/* Cabeçalho */}
      <div className="mt-4 sm:mt-0 text-center sm:text-left">
        <h1 className="text-3xl font-bold bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent flex items-center gap-2 justify-center sm:justify-start">
          <ShoppingCart className="w-8 h-8 text-blue-600" />
          Ponto de Venda (PDV)
        </h1>
        <p className="text-gray-600 mt-1">Sistema de vendas rápido e intuitivo</p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Área de Busca e Resultados */}
        <div className="lg:col-span-2">
          <Card>
            <CardHeader>
              <CardTitle>🛒 Ponto de Venda</CardTitle>
            </CardHeader>
            <CardContent className="space-y-6">
              {/* Campo de Busca por Lote */}
              <BatchSearch
                batchSearchTerm={batchSearchTerm}
                productSearchTerm={productSearchTerm}
                results={batchResults}
                movements={movements}
                products={products}
                onBatchSearchChange={setBatchSearchTerm}
                onProductSearchChange={setProductSearchTerm}
                onBatchSelect={addBatchToCart}
              />

              {/* Separador */}
              <div className="border-t pt-6"></div>

              {/* Campo de Busca por Produto */}
              <ProductSearch
                searchTerm={productSearch}
                results={productResults}
                movements={movements}
                products={products}
                onSearchChange={setProductSearch}
                onProductSelect={addToCart}
              />

              {/* Mensagem inicial */}
              {!batchSearchTerm && !productSearchTerm && !productSearch && (
                <div className="text-center py-12">
                  <ShoppingCart className="h-16 w-16 mx-auto text-gray-300 mb-4" />
                  <p className="text-gray-500">Digite o lote ou código/nome do produto para buscar</p>
                </div>
              )}
            </CardContent>
          </Card>
        </div>

        {/* Carrinho */}
        <div className="lg:col-span-1">
          <Cart
            cart={cart}
            total={getTotal()}
            products={products}
            availableBatches={availableBatches}
            paymentMethod={paymentMethod}
            installments={installments}
            isProcessingSale={isProcessingSale}
            onUpdateQuantity={handleUpdateQuantity}
            onRemove={removeItem}
            onBatchChange={handleBatchChange}
            onPaymentMethodChange={setPaymentMethod}
            onInstallmentsChange={setInstallments}
            onClearCart={clearCart}
            onFinalizeSale={finalizeSale}
          />
                </div>
        </div>

      {/* Modal de Receita */}
      <ReceiptModal open={showReceipt} onOpenChange={setShowReceipt} receiptData={receiptData} />

      {/* Dialog de Seleção de Lote */}
      <BatchSelectionDialog
        open={showBatchDialog}
        onOpenChange={setShowBatchDialog}
        product={productPendingBatch}
        batches={productPendingBatch ? productBatches[productPendingBatch.id] || [] : []}
        selectedBatchId={selectedBatchForDialog}
        onBatchSelect={setSelectedBatchForDialog}
        onConfirm={confirmBatchSelection}
      />
    </main>
  );
};

export default PDV;
