// 🛒 Página de Ponto de Venda (PDV)
// Sistema de vendas rápido e intuitivo

import { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
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
import { movementsAPI } from "@/lib/api";
import { toast } from "@/hooks/use-toast";

interface CartItem {
  id: string;
  name: string;
  price: number;
  quantity: number;
  sku: string;
}

interface ReceiptData {
  receiptNumber: string;
  date: string;
  items: CartItem[];
  total: number;
}

const PDV = () => {
  const { isMobile } = useResponsive();
  const { products, refreshMovements, refreshProducts } = useData();
  const [cart, setCart] = useState<CartItem[]>([]);
  const [searchTerm, setSearchTerm] = useState("");
  const [isProcessingSale, setIsProcessingSale] = useState(false);
  const [showReceipt, setShowReceipt] = useState(false);
  const [receiptData, setReceiptData] = useState<ReceiptData | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  // Controlar estado de carregamento
  useEffect(() => {
    const timer = setTimeout(() => {
      setIsLoading(false);
    }, 500);
    
    return () => clearTimeout(timer);
  }, []);

  // Calcular total do carrinho
  const total = cart.reduce((sum, item) => sum + (item.price * item.quantity), 0);

  // Adicionar produto ao carrinho
  const addToCart = (product: any) => {
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

  // Gerar número de receita único
  const generateReceiptNumber = () => {
    const date = new Date();
    const year = date.getFullYear();
    const month = String(date.getMonth() + 1).padStart(2, '0');
    const day = String(date.getDate()).padStart(2, '0');
    const time = String(date.getHours()).padStart(2, '0') + String(date.getMinutes()).padStart(2, '0') + String(date.getSeconds()).padStart(2, '0');
    return `REC-${year}${month}${day}-${time}`;
  };

  // Finalizar venda
  const finalizeSale = async () => {
    if (cart.length === 0) return;
    if (isProcessingSale) return;
    
    // Validar estoque antes de processar
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
    }
    
    setIsProcessingSale(true);
    
    try {
      // Criar uma movimentação de saída para cada item do carrinho
      for (const item of cart) {
        await movementsAPI.create({
          type: 'saida',
          productId: item.id,
          quantity: item.quantity,
          unitPrice: item.price,
          description: `Venda PDV - ${item.name} (${item.quantity} unidades)`,
          date: new Date().toISOString()
        });
      }
      
      // Recarregar dados
      await Promise.all([
        refreshMovements(),
        refreshProducts()
      ]);
      
      // Gerar dados da receita
      const receipt: ReceiptData = {
        receiptNumber: generateReceiptNumber(),
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
    <div className="container mx-auto p-4 sm:p-6 max-w-7xl">
      {/* Cabeçalho */}
      <div className="mb-6">
        <h1 className="text-3xl font-bold bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent flex items-center gap-2">
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
                  placeholder="Buscar por nome ou SKU..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="pl-10"
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
                            className="text-red-600 hover:text-red-700 hover:bg-red-50 h-8 w-8 p-0"
                          >
                            <Trash2 className="h-4 w-4" />
                          </Button>
                        </div>
                        
                        <div className="flex items-center justify-between">
                          <div className="flex items-center gap-2">
                            <Button
                              variant="outline"
                              size="sm"
                              onClick={() => updateQuantity(item.id, -1)}
                              className="h-7 w-7 p-0"
                            >
                              <Minus className="h-3 w-3" />
                            </Button>
                            <span className="w-8 text-center font-semibold">{item.quantity}</span>
                            <Button
                              variant="outline"
                              size="sm"
                              onClick={() => updateQuantity(item.id, 1)}
                              className="h-7 w-7 p-0"
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
                  </div>
                </>
              )}
            </CardContent>
          </Card>
        </div>
      </div>

      {/* Modal de Receita */}
      <Dialog open={showReceipt} onOpenChange={setShowReceipt}>
        <DialogContent className="max-w-md">
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
                  className="w-full bg-blue-600 hover:bg-blue-700"
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
    </div>
  );
};

export default PDV;

