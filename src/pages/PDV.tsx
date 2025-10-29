// 🛒 Página de Ponto de Venda (PDV)
// Sistema de vendas rápido e intuitivo

import { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { 
  ShoppingCart, 
  Plus,
  Minus,
  Trash2,
  CreditCard,
  DollarSign,
  Barcode,
  Search,
  Receipt,
  Printer,
  Download,
  CheckCircle
} from "lucide-react";
import { useResponsive } from "@/hooks/use-responsive";
import { useData } from "@/contexts/DataContext";
import { useAuth } from "@/contexts/AuthContext";
import { toast } from "@/hooks/use-toast";
import { generateUniqueReceiptNumber } from "@/lib/utils";
import { getBatchesByProduct, adjustBatchQuantity, Batch as BatchInfo } from "@/lib/batches";

interface CartItem {
  id: string;
  name: string;
  price: number;
  quantity: number;
  sku: string;
  selectedBatchId?: string;
  selectedBatchNumber?: string;
}

interface ReceiptData {
  receiptNumber: string;
  date: string;
  items: CartItem[];
  total: number;
}

const PDV = () => {
  const { isMobile } = useResponsive();
  const { products, addMovement, refreshMovements, refreshProducts } = useData();
  const { user } = useAuth();
  const [cart, setCart] = useState<CartItem[]>([]);
  const [searchTerm, setSearchTerm] = useState("");
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

  // Controlar estado de carregamento
  useEffect(() => {
    const timer = setTimeout(() => {
      setIsLoading(false);
    }, 500);
    
    return () => clearTimeout(timer);
  }, []);

  // Calcular total do carrinho
  const total = cart.reduce((sum, item) => sum + (item.price * item.quantity), 0);

  // Adicionar produto ao carrinho (verifica se precisa selecionar lote)
  const addToCart = async (product: any) => {
    // Se o produto é gerenciado por lote, abrir diálogo para selecionar lote
    if ((product as any)?.managedByBatch) {
      // Carregar lotes se ainda não foram carregados
      const batches = await loadBatchesForProduct(product.id);
      
      // Filtrar apenas lotes com estoque > 0
      const availableBatches = batches.filter(b => b.quantity > 0);
      
      if (availableBatches.length === 0) {
        toast({
          title: "❌ Sem Lotes Disponível",
          description: `O produto ${product.name} não possui lotes com estoque disponível`,
          variant: "destructive",
        });
        return;
      }
      
      // Verificar se já existe no carrinho com lote selecionado
      const existingItem = cart.find(item => item.id === product.id && item.selectedBatchId);
      if (existingItem) {
        // Se já existe no carrinho com lote, apenas incrementar quantidade
        setCart(cart.map(item => 
          item.id === product.id && item.selectedBatchId === existingItem.selectedBatchId
            ? { ...item, quantity: item.quantity + 1 }
            : item
        ));
        return;
      }
      
      // Abrir diálogo para selecionar lote
      setProductPendingBatch(product);
      setSelectedBatchForDialog("");
      setShowBatchDialog(true);
    } else {
      // Produto não gerenciado por lote: adicionar direto ao carrinho
      const existingItem = cart.find(item => item.id === product.id);
      
      if (existingItem) {
        setCart(cart.map(item => 
          item.id === product.id 
            ? { ...item, quantity: item.quantity + 1 }
            : item
        ));
      } else {
        setCart([...cart, {
          id: product.id,
          name: product.name,
          price: product.price,
          quantity: 1,
          sku: product.sku
        }]);
      }
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
    const selectedBatch = batches.find(b => b.id === selectedBatchForDialog);
    
    if (!selectedBatch) {
      toast({
        title: "❌ Lote não encontrado",
        description: "O lote selecionado não foi encontrado",
        variant: "destructive",
      });
      return;
    }
    
    // Verificar se já existe no carrinho com o mesmo lote
    const existingItem = cart.find(
      item => item.id === productPendingBatch.id && item.selectedBatchId === selectedBatchForDialog
    );
    
    if (existingItem) {
      setCart(cart.map(item => 
        item.id === productPendingBatch.id && item.selectedBatchId === selectedBatchForDialog
          ? { ...item, quantity: item.quantity + 1 }
          : item
      ));
    } else {
      setCart([...cart, {
        id: productPendingBatch.id,
        name: productPendingBatch.name,
        price: productPendingBatch.price,
        quantity: 1,
        sku: productPendingBatch.sku,
        selectedBatchId: selectedBatch.id,
        selectedBatchNumber: selectedBatch.batchNumber
      }]);
    }
    
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
    setProductBatches(prev => ({ ...prev, [productId]: batches || [] }));
    return batches || [];
  };

  // Remover item do carrinho
  const removeFromCart = (id: string) => {
    setCart(cart.filter(item => item.id !== id));
  };

  // Alterar quantidade
  const updateQuantity = (id: string, delta: number) => {
    setCart(cart.map(item => {
      if (item.id === id) {
        const newQuantity = item.quantity + delta;
        return newQuantity > 0 ? { ...item, quantity: newQuantity } : item;
      }
      return item;
    }).filter(item => item.quantity > 0));
  };


  // Finalizar venda
  const finalizeSale = async () => {
    if (cart.length === 0) return;
    if (isProcessingSale) return;
    
    // Validar estoque e lotes antes de processar
    for (const item of cart) {
      const product = products.find(p => p.id === item.id);
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
        const batch = batches.find(b => b.id === item.selectedBatchId);
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
        const product = products.find(p => p.id === item.id);
        const paymentInfo = paymentMethod === 'parcelado' ? `Pagamento: parcelado em ${installments}x` : `Pagamento: à vista (${paymentMethod})`;
        const loteInfo = (product as any)?.managedByBatch && item.selectedBatchNumber ? ` | Lote: ${item.selectedBatchNumber}` : '';
        await addMovement({
          type: 'saida',
          productId: item.id,
          quantity: item.quantity,
          unitPrice: item.price,
          description: `Venda PDV - ${item.name} (${item.quantity} unidades)${loteInfo} | ${paymentInfo}`,
          paymentMethod: paymentMethod === 'parcelado' ? `parcelado-${installments}x` : paymentMethod,
          date: new Date()
        });

        // Se houver lote selecionado, decrementar quantidade do lote
        if ((product as any)?.managedByBatch && item.selectedBatchId && user?.id) {
          await adjustBatchQuantity(item.selectedBatchId, -item.quantity, user.id);
        }
      }
      
      // Dados já são recarregados automaticamente pelo addMovement
      // mas vamos garantir que está sincronizado
      await Promise.all([
        refreshMovements(),
        refreshProducts()
      ]);
      
      // Gerar dados da receita
      const receipt: ReceiptData = {
        receiptNumber: generateUniqueReceiptNumber("REC"),
        date: new Date().toLocaleString('pt-BR'),
        items: [...cart],
        total: total
      };
      
      // Mostrar toast de sucesso
      toast({
        title: "✅ Venda Finalizada!",
        description: `Total: R$ ${total.toFixed(2)} | ${cart.length} ${cart.length === 1 ? 'item' : 'itens'} vendido(s)`,
        duration: 5000,
      });
      
      // Mostrar receita
      setReceiptData(receipt);
      setShowReceipt(true);
      
      // Limpar carrinho
      setCart([]);
      setPaymentMethod('avista');
      setInstallments(1);
      
    } catch (error: any) {
      console.error('Erro ao finalizar venda:', error);
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

  // Filtrar produtos
  const filteredProducts = products.filter(p => 
    p.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    p.sku.toLowerCase().includes(searchTerm.toLowerCase())
  );

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
        <p className="text-gray-600 mt-1">
          Sistema de vendas rápido e intuitivo
        </p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Lista de Produtos */}
        <div className="lg:col-span-2">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center justify-between">
                <span>📦 Produtos Disponíveis</span>
              </CardTitle>
              
              {/* Busca de produtos */}
              <div className="relative mt-4">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
                <Input
                  placeholder="🔍 Buscar por código ou nome do produto..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="pl-10 h-11 text-base"
                />
              </div>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 max-h-[600px] overflow-y-auto">
                {filteredProducts.length === 0 ? (
                  <div className="col-span-2 text-center py-12">
                    <Barcode className="h-16 w-16 mx-auto text-gray-300 mb-4" />
                    <p className="text-gray-500">Nenhum produto encontrado</p>
                  </div>
                ) : (
                  filteredProducts.map(product => (
                    <Card 
                      key={product.id}
                      className="hover:shadow-lg transition-shadow cursor-pointer"
                      onClick={() => addToCart(product)}
                    >
                      <CardContent className="p-4">
                        <div className="flex justify-between items-start mb-2">
                          <div className="flex-1">
                            <h3 className="font-semibold text-gray-900">{product.name}</h3>
                            <p className="text-xs text-gray-500">SKU: {product.sku}</p>
                          </div>
                          <Plus className="h-5 w-5 text-indigo-600 flex-shrink-0 ml-2" />
                        </div>
                        <div className="flex justify-between items-center">
                          <span className="text-lg font-bold text-indigo-600">
                            R$ {product.price.toFixed(2)}
                          </span>
                          <span className="text-xs text-gray-500">
                            Estoque: {product.stock}
                          </span>
                        </div>
                      </CardContent>
                    </Card>
                  ))
                )}
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Carrinho */}
        <div className="lg:col-span-1">
          <Card className="sticky top-24">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <ShoppingCart className="h-5 w-5" />
                Carrinho ({cart.length})
              </CardTitle>
            </CardHeader>
            <CardContent>
              {cart.length === 0 ? (
                <div className="text-center py-8">
                  <ShoppingCart className="h-12 w-12 mx-auto text-gray-300 mb-3" />
                  <p className="text-gray-500 text-sm">Carrinho vazio</p>
                </div>
              ) : (
                <>
                  <div className="space-y-3 max-h-[400px] overflow-y-auto mb-4">
                    {cart.map(item => (
                      <div key={item.id} className="border rounded-lg p-3">
                        <div className="flex justify-between items-start mb-2">
                          <div className="flex-1">
                            <h4 className="font-medium text-sm">{item.name}</h4>
                            <p className="text-xs text-gray-500">R$ {item.price.toFixed(2)}</p>
                          </div>
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => removeFromCart(item.id)}
                            className="text-red-600 hover:text-red-700 hover:bg-red-50 h-10 w-10 p-0"
                          >
                            <Trash2 className="h-4 w-4" />
                          </Button>
                        </div>
                        
                        {/* Seleção de Lote (se gerenciado por lote) */}
                        {(() => {
                          const product = products.find(p => p.id === item.id) as any;
                          if (product?.managedByBatch) {
                            const batches = productBatches[item.id] || [];
                            return (
                              <div className="mb-3">
                                <div className="text-xs text-gray-600 mb-1">Lote</div>
                                <Select
                                  onValueChange={async (val) => {
                                    if (!productBatches[item.id]) {
                                      await loadBatchesForProduct(item.id);
                                    }
                                    const selected = (productBatches[item.id] || []).concat(batches).find(b => b.id === val) || batches.find(b => b.id === val);
                                    setCart(prev => prev.map(ci => ci.id === item.id ? { ...ci, selectedBatchId: val, selectedBatchNumber: selected?.batchNumber } : ci));
                                  }}
                                  value={item.selectedBatchId || undefined}
                                >
                                  <SelectTrigger className="h-9">
                                    <SelectValue placeholder={batches.length ? "Selecione o lote" : "Carregando lotes..."} />
                                  </SelectTrigger>
                                  <SelectContent>
                                    {(batches.length ? batches : []).map(b => (
                                      <SelectItem key={b.id} value={b.id}>{b.batchNumber} · qtd {b.quantity}</SelectItem>
                                    ))}
                                  </SelectContent>
                                </Select>
                              </div>
                            );
                          }
                          return null;
                        })()}

                        <div className="flex items-center justify-between">
                          <div className="flex items-center gap-2">
                            <Button
                              variant="outline"
                              size="sm"
                              onClick={() => updateQuantity(item.id, -1)}
                              className="h-9 w-9 p-0"
                            >
                              <Minus className="h-3 w-3" />
                            </Button>
                            <span className="w-8 text-center font-semibold">{item.quantity}</span>
                            <Button
                              variant="outline"
                              size="sm"
                              onClick={() => updateQuantity(item.id, 1)}
                              className="h-9 w-9 p-0"
                            >
                              <Plus className="h-3 w-3" />
                            </Button>
                          </div>
                          <span className="font-bold text-indigo-600">
                            R$ {(item.price * item.quantity).toFixed(2)}
                          </span>
                        </div>
                      </div>
                    ))}
                  </div>

                  {/* Total */}
                  <div className="border-t pt-4 mb-4">
                    <div className="flex justify-between items-center mb-2">
                      <span className="text-gray-600">Subtotal:</span>
                      <span className="font-semibold">R$ {total.toFixed(2)}</span>
                    </div>
                    <div className="flex justify-between items-center text-lg font-bold">
                      <span>Total:</span>
                      <span className="text-indigo-600">R$ {total.toFixed(2)}</span>
                    </div>
                  </div>

                  {/* Pagamento */}
                  <div className="space-y-2 mb-4">
                    <div className="text-sm font-medium text-gray-800">Forma de pagamento</div>
                    <Select value={paymentMethod} onValueChange={(v) => { setPaymentMethod(v); if (v !== 'parcelado') setInstallments(1); }}>
                      <SelectTrigger className="h-10">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="avista">À vista</SelectItem>
                        <SelectItem value="pix">Pix</SelectItem>
                        <SelectItem value="debito">Cartão débito</SelectItem>
                        <SelectItem value="credito">Cartão crédito</SelectItem>
                        <SelectItem value="dinheiro">Dinheiro</SelectItem>
                        <SelectItem value="parcelado">Parcelado</SelectItem>
                      </SelectContent>
                    </Select>
                    {paymentMethod === 'parcelado' && (
                      <div className="flex items-center gap-3">
                        <div className="text-sm text-gray-700">Quantidade de parcelas</div>
                        <Select value={String(installments)} onValueChange={(v) => setInstallments(Number(v))}>
                          <SelectTrigger className="h-9 w-28">
                            <SelectValue />
                          </SelectTrigger>
                          <SelectContent>
                            {Array.from({ length: 12 }, (_, i) => i + 1).map(n => (
                              <SelectItem key={n} value={String(n)}>{n}x</SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                      </div>
                    )}
                  </div>

                  {/* Botões de Ação */}
                  <div className="space-y-2">
                    <Button 
                      className="w-full bg-gradient-to-r from-indigo-600 to-indigo-700 hover:from-indigo-700 hover:to-indigo-800 text-white px-6 py-3 rounded-xl shadow-xl hover:shadow-2xl transition-all duration-200 transform hover:scale-105"
                      onClick={finalizeSale}
                      disabled={isProcessingSale}
                    >
                      {isProcessingSale ? (
                        <>
                          <Receipt className="w-5 h-5 mr-2 animate-pulse" />
                          Processando...
                        </>
                      ) : (
                        <>
                          <CreditCard className="w-5 h-5 mr-2" />
                          Finalizar Venda
                        </>
                      )}
                    </Button>
                    <Button 
                      variant="outline" 
                      className="w-full"
                      onClick={() => setCart([])}
                      disabled={isProcessingSale}
                    >
                      <Trash2 className="mr-2 h-4 w-4" />
                      Limpar Carrinho
                    </Button>
                    {/* Botão de Reset Geral */}
                    <Button 
                      variant="outline" 
                      className="w-full border-orange-300 text-orange-600 hover:bg-orange-50 hover:text-orange-700"
                      onClick={() => {
                        setCart([]);
                        setSearchTerm("");
                      }}
                      disabled={isProcessingSale}
                    >
                      🔄 Resetar Tudo
                    </Button>
                  </div>
                </>
              )}
            </CardContent>
          </Card>
        </div>
      </div>

      {/* Modal de Receita */}
      <Dialog open={showReceipt} onOpenChange={setShowReceipt}>
        <DialogContent className="max-w-md sm:max-w-lg">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2 text-green-600">
              <CheckCircle className="h-6 w-6" />
              Venda Finalizada com Sucesso!
            </DialogTitle>
          </DialogHeader>
          
          {receiptData && (
            <div className="space-y-4">
              {/* Cabeçalho da Receita */}
              <div className="border-b pb-4">
                <div className="text-center mb-3">
                  <h2 className="text-2xl font-bold text-gray-900">📄 RECEITA</h2>
                  <p className="text-sm text-gray-600">Flexi Gestor - Sistema de Gestão</p>
                </div>
                
                <div className="space-y-1 text-sm">
                  <div className="flex justify-between">
                    <span className="text-gray-600">Número:</span>
                    <span className="font-semibold">{receiptData.receiptNumber}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-600">Data/Hora:</span>
                    <span className="font-semibold">{receiptData.date}</span>
                  </div>
                </div>
              </div>

              {/* Itens da Venda */}
              <div className="space-y-2">
                <h3 className="font-semibold text-gray-900">Itens:</h3>
                <div className="border rounded-lg p-3 space-y-2 max-h-64 overflow-y-auto">
                  {receiptData.items.map((item, index) => (
                    <div key={index} className="flex justify-between items-start pb-2 border-b last:border-0">
                      <div className="flex-1">
                        <p className="font-medium text-sm">{item.name}</p>
                        <p className="text-xs text-gray-500">
                          {item.quantity} x R$ {item.price.toFixed(2)}
                        </p>
                      </div>
                      <p className="font-semibold text-sm">
                        R$ {(item.quantity * item.price).toFixed(2)}
                      </p>
                    </div>
                  ))}
                </div>
              </div>

              {/* Total */}
              <div className="border-t pt-4">
                <div className="flex justify-between items-center">
                  <span className="text-lg font-bold text-gray-900">TOTAL:</span>
                  <span className="text-2xl font-bold text-green-600">
                    R$ {receiptData.total.toFixed(2)}
                  </span>
                </div>
              </div>

              {/* Botões de Ação */}
              <div className="space-y-2 pt-2">
                <Button 
                  className="w-full bg-blue-600 hover:bg-blue-700 text-white"
                  onClick={() => window.print()}
                >
                  <Printer className="mr-2 h-4 w-4" />
                  Imprimir Receita
                </Button>
                
                <Button 
                  variant="outline" 
                  className="w-full"
                  onClick={() => setShowReceipt(false)}
                >
                  Fechar
                </Button>
              </div>

              {/* Rodapé */}
              <div className="text-center text-xs text-gray-500 pt-2 border-t">
                <p>Obrigado pela preferência!</p>
                <p className="mt-1">💚 Flexi Gestor - Gestão Inteligente</p>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>

      {/* Dialog de Seleção de Lote */}
      <Dialog open={showBatchDialog} onOpenChange={setShowBatchDialog}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>📦 Selecionar Lote</DialogTitle>
          </DialogHeader>
          
          {productPendingBatch && (
            <div className="space-y-4">
              <div className="p-3 bg-indigo-50 rounded-lg">
                <p className="font-semibold text-gray-900">{productPendingBatch.name}</p>
                <p className="text-sm text-gray-600">SKU: {productPendingBatch.sku}</p>
              </div>
              
              <div className="space-y-2">
                <label className="text-sm font-medium">Selecione o lote:</label>
                <Select
                  value={selectedBatchForDialog}
                  onValueChange={setSelectedBatchForDialog}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Escolha um lote disponível" />
                  </SelectTrigger>
                  <SelectContent>
                    {(() => {
                      const batches = productBatches[productPendingBatch.id] || [];
                      const availableBatches = batches.filter(b => b.quantity > 0);
                      
                      if (availableBatches.length === 0) {
                        return (
                          <SelectItem value="" disabled>
                            Nenhum lote disponível
                          </SelectItem>
                        );
                      }
                      
                      return availableBatches.map(batch => {
                        const expiryDate = batch.expiryDate ? new Date(batch.expiryDate) : null;
                        const daysUntilExpiry = expiryDate 
                          ? Math.ceil((expiryDate.getTime() - new Date().getTime()) / (1000 * 60 * 60 * 24))
                          : null;
                        
                        const status = daysUntilExpiry !== null
                          ? daysUntilExpiry < 0 
                            ? '🔴 Vencido'
                            : daysUntilExpiry <= 30
                              ? '🟡 Vence em breve'
                              : '🟢 OK'
                          : '⚪ Sem validade';

                        return (
                          <SelectItem key={batch.id} value={batch.id}>
                            <div>
                              <div className="font-medium">{status} Lote {batch.batchNumber}</div>
                              <div className="text-xs text-muted-foreground">
                                {batch.quantity} unidades disponíveis
                                {batch.expiryDate && ` • Validade: ${new Date(batch.expiryDate).toLocaleDateString('pt-BR')}`}
                              </div>
                            </div>
                          </SelectItem>
                        );
                      });
                    })()}
                  </SelectContent>
                </Select>
              </div>
              
              <div className="flex gap-2 justify-end pt-4 border-t">
                <Button
                  variant="outline"
                  onClick={() => {
                    setShowBatchDialog(false);
                    setProductPendingBatch(null);
                    setSelectedBatchForDialog("");
                  }}
                >
                  Cancelar
                </Button>
                <Button
                  onClick={confirmBatchSelection}
                  disabled={!selectedBatchForDialog}
                  className="bg-gradient-to-r from-indigo-600 to-purple-600 hover:from-indigo-700 hover:to-purple-700"
                >
                  Adicionar ao Carrinho
                </Button>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </main>
  );
};

export default PDV;

