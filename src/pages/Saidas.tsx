import React, { useState, useEffect } from "react";
import { createPortal } from "react-dom";
// Usando Lucide React
import { 
  Plus,
  TrendingDown,
  Package,
  Search,
  Trash2,
  Calendar,
  DollarSign,
  ShoppingCart,
  Receipt,
  CheckCircle,
  Printer,
  Share2,
  Edit,
  X,
  Tag,
  User,
  Hash,
  BarChart3,
  Coins,
  Upload,
  AlertTriangle,
  Clock,
  FileText,
  Settings,
  TrendingDown as TrendingDownIcon,
  Calculator
} from "lucide-react";

import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Textarea } from "@/components/ui/textarea";
import { useForm } from "react-hook-form";
import { useToast } from "@/hooks/use-toast";
import { useData } from "@/contexts/DataContext";
import { getBatchesByProduct, updateBatchQuantity } from "@/lib/batches";
import { useAuth } from "@/contexts/AuthContext";
import { printReceipt, downloadReceipt } from "@/lib/receiptPDF";
import { StockExitCart } from "@/components/saidas/StockExitCart";
import { supabase } from "@/lib/supabase";

// Interface da venda de estoque
interface StockExit {
  id: string;
  productId: string;
  productName: string;
  productSku: string;
  quantity: number;
  unitPrice: number;
  totalPrice: number;
  customer: string;
  exitDate: Date;
  notes: string;
  status: "pendente" | "confirmado" | "cancelado";
  receiptNumber?: string; // Número único da receita
}

type StockExitFormData = Omit<StockExit, 'id' | 'productName' | 'productSku' | 'totalPrice' | 'receiptNumber'> & {
  paymentMethod?: string;
  installments?: number;
  discount?: number; // Percentual de desconto para aplicar no preço de venda
};

// Carrinho
interface CartBatchItem { batchId?: string; batchNumber?: string; quantity: number }
interface CartItem { productId: string; productName: string; productSku: string; managedByBatch: boolean; quantity: number; unitPrice: number; batches?: CartBatchItem[] }

const Saidas = () => {
  // Estados
  const [searchTerm, setSearchTerm] = useState("");
  const [isAddDialogOpen, setIsAddDialogOpen] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [availableBatches, setAvailableBatches] = useState<any[]>([]);
  const [selectedBatches, setSelectedBatches] = useState<Array<{batchId: string, batchNumber?: string, quantity: number}>>([]);
  const [selectedProductId, setSelectedProductId] = useState<string>("");
  const [showReceipt, setShowReceipt] = useState(false);
  const [selectedExit, setSelectedExit] = useState<StockExit | null>(null);
  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false);
  const [exitToDelete, setExitToDelete] = useState<StockExit | null>(null);
  const [isDeleting, setIsDeleting] = useState(false);
  const [isEditDialogOpen, setIsEditDialogOpen] = useState(false);
  const [exitToEdit, setExitToEdit] = useState<StockExit | null>(null);
  const [isSaving, setIsSaving] = useState(false);
  const [productSearchTerm, setProductSearchTerm] = useState("");
  const [productSearchOpen, setProductSearchOpen] = useState(false);
  const [isCartPanelOpen, setIsCartPanelOpen] = useState(false);
  const cartToggleRef = React.useRef<HTMLButtonElement | null>(null);
  const [customerSearchTerm, setCustomerSearchTerm] = useState("");
  const [customers, setCustomers] = useState<Array<{id: string, code: string, name: string}>>([]);
  const [selectedCustomerId, setSelectedCustomerId] = useState<string>("");

  // Carrinho de vendas
  const [cartItems, setCartItems] = useState<CartItem[]>([]);
  const [discount, setDiscount] = useState<number>(0); // Desconto em R$
  const [amountReceived, setAmountReceived] = useState<number>(0); // Valor recebido para cálculo de troco

  // Hooks
  const { toast } = useToast();
  const { products, movements, addMovement, deleteMovement, addNotification, refreshMovements } = useData();
  const { user } = useAuth();

  // Filtrar apenas as vendas (type 'saida') dos movements
  const exits = movements
    .filter(m => m.type === 'saida')
    .map(m => {
      // Usar o preço salvo na movimentação (já inclui desconto se foi aplicado na venda)
      // O preço da movimentação é o preço efetivamente cobrado, então deve ser usado
      const displayUnitPrice = m.unitPrice || 0;
      const displayTotalPrice = m.total || (m.quantity * displayUnitPrice);
      
      return {
        id: m.id,
        productId: m.productId,
        productName: m.productName || m.product?.name || 'Desconhecido',
        productSku: m.product?.sku || '',
        quantity: m.quantity,
        unitPrice: displayUnitPrice, // Usar preço salvo na movimentação (já com desconto aplicado se houver)
        totalPrice: displayTotalPrice, // Usar total salvo na movimentação
        customer: m.description.includes(' - ') ? m.description.split(' - ')[1] : 'Cliente',
        exitDate: m.date,
        notes: m.description,
        status: (m.status || 'confirmado') as 'pendente' | 'confirmado' | 'cancelado', // Usar status real do banco
        receiptNumber: m.receiptNumber
      };
    });

  // Formulário
  const form = useForm<StockExitFormData>({
    defaultValues: {
      productId: "",
      quantity: 0,
      unitPrice: 0,
      customer: "",
      exitDate: new Date(),
      notes: "",
      status: "pendente",
      paymentMethod: "avista",
      installments: 1,
      discount: 0, // Desconto padrão em percentual
    },
  });

  // Carregar lotes quando selecionar um produto
  const loadBatchesForProduct = async (productId: string) => {
    try {
      if (!user?.id) return;
      setSelectedProductId(productId);
      setSelectedBatches([]);
      
      const batches = await getBatchesByProduct(productId, user.id);
      // Filtrar apenas lotes com estoque > 0 para saídas
      const batchesWithStock = (batches || []).filter(b => b.quantity > 0);
      setAvailableBatches(batchesWithStock);
    } catch (error) {
      setAvailableBatches([]);
    }
  };

  // Adicionar lote à seleção
  const addBatchToSelection = () => {
    setSelectedBatches(prev => [...prev, { batchId: '', batchNumber: '', quantity: 0 }]);
  };

  // Remover lote da seleção
  const removeBatchFromSelection = (index: number) => {
    setSelectedBatches(prev => prev.filter((_, i) => i !== index));
  };

  // Atualizar lote selecionado
  const updateSelectedBatch = (index: number, batchId: string, quantity: number, batchNumber?: string) => {
    setSelectedBatches(prev => {
      const updated = [...prev];
      updated[index] = { batchId, batchNumber, quantity };
      return updated;
    });
  };

  // Atualizar número do lote (digitável)
  const updateBatchNumber = (index: number, batchNumber: string) => {
    setSelectedBatches(prev => {
      const updated = [...prev];
      // Buscar lote pelo número digitado
      const foundBatch = availableBatches.find(b => {
        const bNumber = b.batchNumber?.toString() || '';
        const inputNumber = batchNumber.trim();
        // Comparar números extraídos
        const bMatch = bNumber.match(/\d+/);
        const inputMatch = inputNumber.match(/\d+/);
        return bMatch && inputMatch && bMatch[0] === inputMatch[0];
      });
      
      if (foundBatch) {
        updated[index] = { ...updated[index], batchId: foundBatch.id, batchNumber: foundBatch.batchNumber };
      } else {
        // Se não encontrou, permite digitar mas limpa o batchId
        updated[index] = { ...updated[index], batchNumber, batchId: '' };
      }
      return updated;
    });
  };

  // Calcular total selecionado dos lotes
  const getTotalSelectedQuantity = () => {
    return selectedBatches.reduce((sum, batch) => sum + (batch.quantity || 0), 0);
  };

  // Obter preço de venda do produto ou preço da última entrada como fallback (igual ao PDV)
  const getProductPrice = (productId: string): number => {
    // SEMPRE priorizar o preço de VENDA do produto (já calculado com markup)
    const product = products.find(p => p.id === productId);
    if (product && product.price > 0) {
      // Retornar o preço de venda do produto (já calculado com markup na compra)
      return product.price;
    }
    
    // Se o produto não tem preço de venda cadastrado, buscar do preço de compra da última entrada como fallback
    if (!movements || movements.length === 0) {
      return product?.price || 0;
    }
    
    const productEntries = movements.filter(m => {
      const typeStr = String(m.type || '').toLowerCase().trim();
      const isEntry = typeStr === 'entrada';
      const matchesProduct = String(m.productId || '') === String(productId || '');
      return isEntry && matchesProduct;
    }).sort((a, b) => {
      const dateA = a.date instanceof Date ? a.date : new Date(a.date);
      const dateB = b.date instanceof Date ? b.date : new Date(b.date);
      return dateB.getTime() - dateA.getTime();
    });

    if (productEntries.length > 0 && productEntries[0].unitPrice > 0) {
      // Usar preço de compra como fallback (mas deveria ter sido atualizado com markup)
      return productEntries[0].unitPrice;
    }
    
    // Último fallback: preço do produto (mesmo que seja 0)
    return product?.price || 0;
  };

  // Adicionar item ao carrinho (suporta com/sem lote)
  const addCurrentSelectionToCart = () => {
    const selectedProduct = products.find(p => p.id === selectedProductId);
    if (!selectedProduct) {
      toast({ title: 'Selecione um produto', variant: 'destructive' });
      return;
    }
    const managedByBatch = (selectedProduct as any)?.managedByBatch === true;
    const unitPrice = getProductPrice(selectedProduct.id);

    if (managedByBatch) {
      const totalQty = getTotalSelectedQuantity();
      if (totalQty <= 0) {
        toast({ title: 'Selecione lotes com quantidade', variant: 'destructive' });
        return;
      }
      const batches: CartBatchItem[] = selectedBatches
        .filter(b => (b.quantity || 0) > 0 && b.batchId)
        .map(b => ({ batchId: b.batchId, batchNumber: b.batchNumber, quantity: b.quantity }));
      if (batches.length === 0) {
        toast({ title: 'Selecione lotes válidos', variant: 'destructive' });
        return;
      }
      setCartItems(prev => [...prev, {
        productId: selectedProduct.id,
        productName: selectedProduct.name,
        productSku: selectedProduct.sku,
        managedByBatch: true,
        quantity: totalQty,
        unitPrice,
        batches
      }]);
      setIsCartPanelOpen(true);
      setTimeout(() => {
        try { cartToggleRef.current?.scrollIntoView({ behavior: 'smooth', block: 'nearest', inline: 'nearest' }); } catch {}
      }, 0);
    } else {
      const qty = form.getValues('quantity') || 0;
      if (qty <= 0) {
        toast({ title: 'Informe a quantidade', variant: 'destructive' });
        return;
      }
      setCartItems(prev => [...prev, {
        productId: selectedProduct.id,
        productName: selectedProduct.name,
        productSku: selectedProduct.sku,
        managedByBatch: false,
        quantity: qty,
        unitPrice
      }]);
      setIsCartPanelOpen(true);
      setTimeout(() => {
        try { cartToggleRef.current?.scrollIntoView({ behavior: 'smooth', block: 'nearest', inline: 'nearest' }); } catch {}
      }, 0);
    }

    // Limpar seleção atual para permitir selecionar outro produto
    setSelectedProductId('');
    setSelectedBatches([]);
    form.setValue('productId', '');
    form.setValue('quantity', 0);
    setProductSearchTerm('');
    setProductSearchOpen(false);
    toast({ title: 'Adicionado ao carrinho', description: selectedProduct.name });
  };

  const removeCartItem = (index: number) => {
    setCartItems(prev => prev.filter((_, i) => i !== index));
  };

  const updateCartItemQuantity = (index: number, newQuantity: number) => {
    setCartItems(prev => prev.map((item, i) => {
      if (i !== index) return item;
      const targetQty = Math.max(1, newQuantity);

      // Sem gerenciamento por lote: apenas ajusta a quantidade
      if (!item.managedByBatch || !item.batches || item.batches.length === 0) {
        return { ...item, quantity: targetQty };
      }

      // Com gerenciamento por lote: ajustar quantidades dentro dos lotes
      const delta = targetQty - (item.quantity || 0);
      let batches = [...(item.batches || [])];

      if (delta > 0) {
        // Aumentar: distribuir +1 por unidade começando do primeiro lote que tiver disponibilidade
        let unitsToAdd = delta;
        while (unitsToAdd > 0 && batches.length > 0) {
          let adjusted = false;
          for (let b = 0; b < batches.length && unitsToAdd > 0; b++) {
            const batchEntry = batches[b];
            const available = availableBatches.find(x => x.id === batchEntry.batchId)?.quantity ?? 0;
            const currentUsed = batchEntry.quantity || 0;
            if (currentUsed < available) {
              batches[b] = { ...batchEntry, quantity: currentUsed + 1 };
              unitsToAdd -= 1;
              adjusted = true;
            }
          }
          if (!adjusted) {
            // Sem disponibilidade adicional em nenhum lote
            break;
          }
        }
      } else if (delta < 0) {
        // Diminuir: remover unidades dos lotes do último para o primeiro
        let unitsToRemove = -delta;
        for (let b = batches.length - 1; b >= 0 && unitsToRemove > 0; b--) {
          const current = batches[b].quantity || 0;
          if (current > 0) {
            const remove = Math.min(current, unitsToRemove);
            batches[b] = { ...batches[b], quantity: current - remove };
            unitsToRemove -= remove;
          }
        }
        // Remover lotes zerados
        batches = batches.filter(b => (b.quantity || 0) > 0);
      }

      const recomputedQty = batches.reduce((sum, b) => sum + (b.quantity || 0), 0);
      // Garante pelo menos 1
      const finalQty = Math.max(1, recomputedQty);
      return { ...item, quantity: finalQty, batches };
    }));
  };

  const clearCartNow = () => {
    try {
      setCartItems([]);
      setDiscount(0);
      setAmountReceived(0);
      localStorage.removeItem('fg_cart_items');
      setIsCartPanelOpen(false);
      toast({ title: 'Carrinho esvaziado' });
    } catch {}
  };

  // Carrinho renderizado dentro do Dialog (evita conflitos de overlay/fora)

  // Calcular total do carrinho sem desconto
  const getCartSubtotal = () => cartItems.reduce((sum, i) => sum + (i.quantity * i.unitPrice), 0);
  
  // Calcular total com desconto
  const getCartTotal = () => {
    const subtotal = getCartSubtotal();
    return Math.max(0, subtotal - discount);
  };
  
  // Calcular custo total dos produtos (baseado nas entradas)
  const getCartCostTotal = () => {
    return cartItems.reduce((sum, item) => {
      // Buscar custo da última entrada do produto
      const productEntries = movements.filter(m => {
        const typeStr = String(m.type || '').toLowerCase().trim();
        return typeStr === 'entrada' && m.productId === item.productId;
      }).sort((a, b) => {
        const dateA = a.date instanceof Date ? a.date : new Date(a.date);
        const dateB = b.date instanceof Date ? b.date : new Date(b.date);
        return dateB.getTime() - dateA.getTime();
      });
      
      const unitCost = productEntries.length > 0 && productEntries[0].unitPrice > 0 
        ? productEntries[0].unitPrice 
        : 0;
      
      return sum + (item.quantity * unitCost);
    }, 0);
  };
  
  // Calcular margem de lucro
  const getProfitMargin = () => {
    const total = getCartTotal();
    const costTotal = getCartCostTotal();
    return total - costTotal;
  };
  
  // Calcular percentual de margem de lucro
  const getProfitMarginPercent = () => {
    const costTotal = getCartCostTotal();
    if (costTotal === 0) return 0;
    const profit = getProfitMargin();
    return (profit / costTotal) * 100;
  };

  // Processar todos itens do carrinho como uma única saída
  const processCartSale = async () => {
    if (cartItems.length === 0) {
      toast({ title: 'Carrinho vazio', variant: 'destructive' });
      return;
    }
    
    try {
      // Obter dados do formulário (cliente, data, método de pagamento, observações)
      const formData = form.getValues();
      const customer = formData.customer || 'Cliente Genérico';
      const exitDate = formData.exitDate || new Date();
      const paymentMethod = formData.paymentMethod || 'avista';
      const installments = formData.installments || 1;
      const notes = formData.notes || '';
      
      // Gerar um único número de recibo para toda a venda
      const receiptNumber = generateReceiptNumber();
      
      // Calcular totais e salvar informações antes de limpar
      const subtotal = getCartSubtotal();
      const totalGeral = getCartTotal();
      const costTotal = getCartCostTotal();
      const profitMargin = getProfitMargin();
      const totalQuantity = cartItems.reduce((sum, item) => sum + item.quantity, 0);
      const totalProducts = cartItems.length;
      
      // Preparar informações de pagamento
      const paymentInfo = paymentMethod === "parcelado" 
        ? `Pagamento: parcelado em ${installments}x`
        : `Pagamento: à vista (${paymentMethod})`;
      
      // Lista de produtos para descrição
      const productsList = cartItems.map(item => 
        `${item.quantity}x ${item.productName}`
      ).join(', ');
      
      // Validar estoque de todos os itens antes de processar
      for (const item of cartItems) {
        const product = products.find(p => p.id === item.productId);
        if (!product) {
          toast({ title: `Produto não encontrado: ${item.productName}`, variant: 'destructive' });
          return;
        }

        // Verificar estoque
        if ((product.stock || 0) < item.quantity) {
          toast({ title: `Estoque insuficiente: ${product.name}`, variant: 'destructive' });
          return;
        }
      }

      // Processar todos os itens com o mesmo número de recibo
      for (const item of cartItems) {
        const product = products.find(p => p.id === item.productId);
        if (!product) continue;

        // Atualizar lotes quando houver
        if (item.managedByBatch && user?.id && item.batches && item.batches.length > 0) {
          for (const b of item.batches) {
            const batch = availableBatches.find(x => x.id === b.batchId);
            if (batch) {
              const newQty = Math.max(0, (batch.quantity || 0) - b.quantity);
              await updateBatchQuantity(batch.id, newQty, user.id);
            }
          }
        }

        // Registrar movimentação com o mesmo número de recibo
        // Aplicar desconto proporcional ao item (se houver desconto)
        const itemSubtotal = item.quantity * item.unitPrice;
        const subtotal = getCartSubtotal();
        const discountRatio = subtotal > 0 ? discount / subtotal : 0;
        const itemDiscount = itemSubtotal * discountRatio;
        const itemFinalPrice = itemSubtotal - itemDiscount;
        const itemUnitPrice = item.quantity > 0 ? itemFinalPrice / item.quantity : item.unitPrice;
        
        await addMovement({
          type: 'saida',
          productId: item.productId,
          productName: item.productName,
          quantity: item.quantity,
          unitPrice: itemUnitPrice, // Preço unitário já com desconto proporcional aplicado
          description: `Venda múltiplos itens - ${item.productName} | ${paymentInfo}${discount > 0 ? ` | Desconto: R$ ${itemDiscount.toFixed(2)}` : ''}${notes ? ' | Obs: ' + notes : ''}`,
          date: exitDate,
          status: 'confirmado',
          paymentMethod: paymentMethod === "parcelado" ? `parcelado-${installments}x` : paymentMethod,
          receiptNumber: receiptNumber // Mesmo número de recibo para todos os itens
        });
      }

      // Limpar carrinho e fechar modal
      setCartItems([]);
      setDiscount(0);
      setAmountReceived(0);
      setIsCartPanelOpen(false);
      setIsAddDialogOpen(false);
      
      // Limpar formulário
      form.reset({
        productId: "",
        quantity: 0,
        unitPrice: 0,
        customer: customer, // Manter o cliente para próxima venda
        exitDate: new Date(),
        notes: "",
        paymentMethod: "avista",
        installments: 1,
      });
      
      // Toast com informações agregadas
      toast({ 
        title: 'Venda Registrada!', 
        description: `${totalProducts} produto(s) totalizando ${totalQuantity} unidades por R$ ${totalGeral.toFixed(2).replace('.', ',')}. Recibo: ${receiptNumber}`,
        variant: 'default'
      });
      
      // Adicionar notificação
      addNotification(
        '🛒 Venda Múltiplos Produtos',
        `Produtos: ${productsList}\nQuantidade Total: ${totalQuantity} unidades\nCliente: ${customer}\nTotal: R$ ${totalGeral.toFixed(2)}\nRecibo: ${receiptNumber}`,
        'success'
      );
    } catch (e: any) {
      toast({ title: 'Erro ao processar venda', description: e?.message || String(e), variant: 'destructive' });
    }
  };

  // Carrinho (novo componente)
  const RenderCart = ({ compact = false }: { compact?: boolean }) => (
    <StockExitCart
      items={cartItems}
      total={getCartTotal()}
      subtotal={getCartSubtotal()}
      discount={discount}
      costTotal={getCartCostTotal()}
      profitMargin={getProfitMargin()}
      profitMarginPercent={getProfitMarginPercent()}
      onRemove={removeCartItem}
      onQuantityChange={updateCartItemQuantity}
      onDiscountChange={setDiscount}
      onClear={() => {
        clearCartNow();
        setDiscount(0);
      }}
      onFinalize={processCartSale}
      compact={compact}
    />
  );

  // Verificar se algum lote excede a quantidade disponível
  const hasExceedingBatches = () => {
    return selectedBatches.some(selectedBatch => {
      const batch = availableBatches.find(b => b.id === selectedBatch.batchId);
      return selectedBatch.quantity > (batch?.quantity || 0);
    });
  };

  // Gerar número de receita único
  const generateReceiptNumber = () => {
    const now = new Date();
    const year = now.getFullYear();
    const month = String(now.getMonth() + 1).padStart(2, '0');
    const day = String(now.getDate()).padStart(2, '0');
    const hours = String(now.getHours()).padStart(2, '0');
    const minutes = String(now.getMinutes()).padStart(2, '0');
    const seconds = String(now.getSeconds()).padStart(2, '0');
    const milliseconds = String(now.getMilliseconds()).padStart(3, '0');
    return `REC-${year}${month}${day}-${hours}${minutes}${seconds}${milliseconds}`;
  };

  // Função para abrir receita
  const openReceipt = (exit: StockExit) => {
    setSelectedExit(exit);
    setShowReceipt(true);
  };

  // Função para compartilhar/baixar receita
  // Função para compartilhar/baixar receita em PDF
  const handleDownloadReceipt = (exit: StockExit) => {
    downloadReceipt({
      type: 'saida',
      receiptNumber: exit.receiptNumber,
      date: exit.exitDate,
      customer: exit.customer,
      productName: exit.productName,
      quantity: exit.quantity,
      unitPrice: exit.unitPrice,
      totalPrice: exit.totalPrice,
      notes: exit.notes
    });
  };

  // Função para imprimir receita em PDF
  const handlePrintReceipt = (exit: StockExit) => {
    printReceipt({
      type: 'saida',
      receiptNumber: exit.receiptNumber,
      date: exit.exitDate,
      customer: exit.customer,
      productName: exit.productName,
      quantity: exit.quantity,
      unitPrice: exit.unitPrice,
      totalPrice: exit.totalPrice,
      notes: exit.notes
    });
  };

  // Funções
  const handleAddExit = async (data: StockExitFormData) => {
    // Se houver itens no carrinho, processa todos; caso contrário, segue o fluxo atual de único item
    if (cartItems.length > 0) {
      for (const item of cartItems) {
        const product = products.find(p => p.id === item.productId);
        if (!product) continue;
        const quantity = item.quantity;
        if (quantity <= 0 || (product.stock || 0) < quantity) {
          toast({ title: "Verifique o carrinho", description: `${product?.name || 'Produto'} com quantidade inválida ou estoque insuficiente.`, variant: "destructive" });
          return;
        }
        let unitPrice = getProductPrice(item.productId);
        // Aplicar desconto se informado (subtrair percentual do preço de venda)
        const discount = form.watch('discount') || (data as any).discount || 0;
        const basePriceBeforeDiscount = unitPrice;
        if (discount > 0 && unitPrice > 0) {
          const discountValue = discount;
          if (typeof discountValue === 'number' && !isNaN(discountValue)) {
            unitPrice = unitPrice * (1 - discountValue / 100);
            console.log(`[SAIDAS-CARRINHO] Aplicando desconto no item ${item.productId}:`);
            console.log(`  - Preço base: R$ ${basePriceBeforeDiscount.toFixed(2)}`);
            console.log(`  - Desconto: ${discountValue}%`);
            console.log(`  - Preço final: R$ ${unitPrice.toFixed(2)}`);
          }
        }
        const receiptNumber = generateReceiptNumber();

        // Atualizar lotes se gerenciado por lote
        if (item.managedByBatch && item.batches.length > 0 && user?.id) {
          try {
            const batches = await getBatchesByProduct(item.productId, user.id);
            await Promise.all(item.batches.map(async sel => {
              const batch = batches.find(b => b.id === sel.batchId);
              if (batch) {
                const newQuantity = Math.max(0, (batch.quantity || 0) - sel.quantity);
                await updateBatchQuantity(batch.id, newQuantity, user.id);
              }
            }));
          } catch (error) {
            console.error('Erro ao atualizar lotes:', error);
          }
        }

        addMovement({
          type: 'saida',
          productId: item.productId,
          productName: product.name,
          quantity,
          unitPrice,
          description: `Saída de ${quantity} unidades - ${data.customer || 'Cliente'}`,
          date: data.exitDate,
          paymentMethod: data.paymentMethod === "parcelado" ? `parcelado-${data.installments || 1}x` : (data.paymentMethod || 'avista'),
          status: "confirmado",
          receiptNumber,
        });
      }

      setIsAddDialogOpen(false);
      setSelectedBatches([]);
      setSelectedProductId("");
      setCartItems([]);
      form.reset();
      toast({ title: "Venda Registrada!", description: `${cartItems.length} item(ns) processado(s).`, variant: "default" });
      addNotification('🛒 Nova Venda', `${cartItems.length} item(ns) registrado(s) no pedido.`, 'success');
      return;
    }

    const product = products.find(p => p.id === data.productId);
    if (!product) {
      toast({
        title: "Erro!",
        description: "Produto não encontrado.",
        variant: "destructive",
      });
      return;
    }

    // Verificar se o produto é gerenciado por lote
    const managedByBatch = (product as any)?.managedByBatch === true;
    
    // Calcular quantidade total e preço baseado no tipo de gerenciamento
    let totalQuantity: number;
    let unitPrice: number;
    
    // Flag para indicar se o desconto já foi aplicado
    let discountAlreadyApplied = false;
    
    if (managedByBatch) {
      // Se gerencia por lote, usar quantidade dos lotes selecionados
      totalQuantity = getTotalSelectedQuantity();
      // Usar preço de venda do produto (não o custo médio dos lotes)
      let baseUnitPrice = getProductPrice(data.productId);
      
      // Aplicar desconto se informado (subtrair percentual do preço de venda)
      const discount = form.watch('discount') || (data as any).discount || 0;
      if (discount > 0 && baseUnitPrice > 0) {
        // Calcular preço com desconto: Preço Base * (1 - Desconto/100)
        // Exemplo: 26 * (1 - 10/100) = 26 * 0.90 = 23.40
        const discountValue = discount;
        if (typeof discountValue === 'number' && !isNaN(discountValue)) {
          unitPrice = baseUnitPrice * (1 - discountValue / 100);
          discountAlreadyApplied = true; // Marcar que desconto já foi aplicado
          console.log(`[SAIDAS-LOTE] Aplicando desconto:`);
          console.log(`  - Preço base: R$ ${baseUnitPrice.toFixed(2)}`);
          console.log(`  - Desconto: ${discountValue}%`);
          console.log(`  - Preço final: R$ ${unitPrice.toFixed(2)}`);
        } else {
          console.error('[SAIDAS-LOTE] Erro: Desconto inválido:', discount);
          unitPrice = baseUnitPrice;
        }
      } else {
        unitPrice = baseUnitPrice;
      }
      
      // Validar se há lotes selecionados
      if (totalQuantity === 0) {
        toast({
          title: "Quantidade Inválida!",
          description: "Selecione ao menos um lote com quantidade.",
          variant: "destructive",
        });
        return;
      }
      
      // Validar se há estoque suficiente nos lotes selecionados
      if (selectedBatches.length > 0) {
        for (const selectedBatch of selectedBatches) {
          const batch = availableBatches.find(b => b.id === selectedBatch.batchId);
          if (batch && selectedBatch.quantity > batch.quantity) {
            toast({
              title: "Estoque Insuficiente no Lote!",
              description: `Lote ${batch.batchNumber} tem apenas ${batch.quantity} unidades disponíveis`,
              variant: "destructive",
            });
            return;
          }
          if (selectedBatch.quantity <= 0) {
            toast({
              title: "Quantidade Inválida!",
              description: "A quantidade deve ser maior que zero",
              variant: "destructive",
            });
            return;
          }
        }
      }
    } else {
      // Se NÃO gerencia por lote, usar quantidade do formulário e preço de venda do produto
      totalQuantity = data.quantity || 0;
      unitPrice = getProductPrice(data.productId); // Usar preço de venda do produto
      
      // Validar quantidade
      if (totalQuantity <= 0) {
        toast({
          title: "Quantidade Inválida!",
          description: "Informe uma quantidade maior que zero.",
          variant: "destructive",
        });
        return;
      }
    }

    // Aplicar desconto se informado (apenas se ainda não foi aplicado no bloco de lote)
    if (!discountAlreadyApplied) {
      const discount = form.watch('discount') || (data as any).discount || 0;
      const basePriceBeforeDiscount = unitPrice; // Guardar preço base para debug
      if (discount > 0 && unitPrice > 0) {
        // Calcular preço com desconto: Preço Base * (1 - Desconto/100)
        // Exemplo: Se preço base é R$ 26,00 e desconto é 10%:
        // 26 * (1 - 10/100) = 26 * 0.90 = 23.40
        const originalPrice = unitPrice;
        const discountValue = discount; // Garantir que é um número
        if (typeof discountValue !== 'number' || isNaN(discountValue)) {
          console.error('[SAIDAS] Erro: Desconto inválido:', discount);
        } else {
          unitPrice = unitPrice * (1 - discountValue / 100);
          console.log(`[SAIDAS] Aplicando desconto:`);
          console.log(`  - Preço base ANTES desconto: R$ ${originalPrice.toFixed(2)}`);
          console.log(`  - Desconto informado: ${discountValue}%`);
          console.log(`  - Multiplicador: ${(1 - discountValue / 100).toFixed(4)}`);
          console.log(`  - Preço final DEPOIS desconto: R$ ${unitPrice.toFixed(2)}`);
          console.log(`  - Fórmula: ${originalPrice.toFixed(2)} * (1 - ${discountValue}/100) = ${originalPrice.toFixed(2)} * ${(1 - discountValue / 100).toFixed(4)} = ${unitPrice.toFixed(2)}`);
        }
      } else {
        console.log(`[SAIDAS] Sem desconto aplicado. Preço base: R$ ${unitPrice.toFixed(2)}`);
      }
    } else {
      console.log(`[SAIDAS] Desconto já foi aplicado anteriormente. Preço final: R$ ${unitPrice.toFixed(2)}`);
    }

    // Verificar se há estoque suficiente
    if (product.stock < totalQuantity) {
      toast({
        title: "Estoque Insuficiente!",
        description: `Estoque disponível: ${product.stock} unidades`,
        variant: "destructive",
      });
      return;
    }

    const totalPrice = totalQuantity * unitPrice;
    const receiptNumber = generateReceiptNumber();
    
    const newExit: StockExit = {
      ...data,
      id: Date.now().toString(),
      productName: product.name,
      productSku: product.sku,
      quantity: totalQuantity,
      unitPrice: unitPrice,
      totalPrice: totalPrice,
      exitDate: data.exitDate,
      receiptNumber: receiptNumber,
    };

    // Atualizar lotes selecionados no backend
    if (selectedBatches.length > 0 && user?.id) {
      try {
        const batchUpdates = selectedBatches.map(async (selectedBatch) => {
          const batch = availableBatches.find(b => b.id === selectedBatch.batchId);
          if (batch) {
            const newQuantity = batch.quantity - selectedBatch.quantity;
            // Garantir que nunca fique negativo
            return updateBatchQuantity(batch.id, Math.max(0, newQuantity), user.id);
          }
        });
        
        await Promise.all(batchUpdates);
      } catch (error) {
        console.error('Erro ao atualizar lotes:', error);
        toast({
          title: "Aviso",
          description: "Saída registrada, mas houve erro ao atualizar lotes.",
          variant: "destructive",
        });
      }
    }

    // Preparar informações de pagamento
    const paymentMethod = data.paymentMethod || "avista";
    const installments = data.installments || 1;
    const paymentInfo = paymentMethod === "parcelado" 
      ? `Pagamento: parcelado em ${installments}x`
      : `Pagamento: à vista (${paymentMethod})`;
    
    // Adicionar movimentação no contexto global (isso atualiza o estoque automaticamente e salva no Supabase)
    addMovement({
      type: 'saida',
      productId: data.productId,
      productName: product.name,
      quantity: totalQuantity,
      unitPrice: unitPrice,
      description: `Saída de ${totalQuantity} unidades - ${data.customer} | ${paymentInfo}`,
      date: data.exitDate,
      paymentMethod: paymentMethod === "parcelado" ? `parcelado-${installments}x` : paymentMethod,
      status: "confirmado",
    });

    setIsAddDialogOpen(false);
    setSelectedBatches([]);
    setSelectedProductId("");
    form.reset();

    toast({
      title: "Saída Registrada!",
      description: `${totalQuantity} unidades de ${product.name} foram vendidas.`,
      variant: "default",
    });

    // Adicionar notificação
    addNotification(
      '🛒 Nova Saída Registrada',
      `Produto: ${product.name}\nQuantidade: ${totalQuantity} unidades\nCliente: ${data.customer}\nPreço: R$ ${unitPrice.toFixed(2)}\nTotal: R$ ${totalPrice.toFixed(2)}`,
      'success'
    );
  };

  const handleDeleteExit = (exit: StockExit) => {
    setExitToDelete(exit);
    setIsDeleteDialogOpen(true);
  };

  const confirmDelete = async () => {
    if (!exitToDelete || isDeleting) return;

    try {
      setIsDeleting(true);
      
      await deleteMovement(exitToDelete.id);
      
      toast({
        title: "Saída Removida!",
        description: `Saída de ${exitToDelete.quantity} unidades foi removida e o estoque foi ajustado.`,
        variant: "default",
      });

      // Fechar dialog após sucesso
      setIsDeleteDialogOpen(false);
      setExitToDelete(null);
    } catch (error: any) {
      toast({
        title: "Erro ao Remover",
        description: error.message || "Não foi possível remover a saída.",
        variant: "destructive",
      });
    } finally {
      setIsDeleting(false);
    }
  };

  // Abrir diálogo de edição
  const handleEditExit = (exit: StockExit) => {
    setExitToEdit(exit);
    setIsEditDialogOpen(true);
  };

  // Salvar alteração de status
  const handleSaveStatus = async (newStatus: "pendente" | "confirmado" | "cancelado") => {
    if (!exitToEdit || isSaving) return;

    try {
      setIsSaving(true);

      // Atualizar status localmente
      // Nota: Integração com Supabase removida temporariamente
      console.log('Status atualizado para:', newStatus);

      // Se mudando para CANCELADO, devolver unidades aos lotes
      if (newStatus === "cancelado" && exitToEdit.status !== "cancelado") {
        if (!user?.id) {
          toast({
            title: "Erro",
            description: "Usuário não autenticado",
            variant: "destructive",
          });
          return;
        }

        // Buscar todos os lotes do produto
        const batches = await getBatchesByProduct(exitToEdit.productId, user.id);
        
        // Tentar devolver unidades aos lotes usando FIFO (primeiros a vencer primeiro)
        let remainingQuantity = exitToEdit.quantity;
        const sortedBatches = [...batches].sort((a, b) => {
          if (!a.expiryDate && !b.expiryDate) return 0;
          if (!a.expiryDate) return 1;
          if (!b.expiryDate) return -1;
          return new Date(a.expiryDate).getTime() - new Date(b.expiryDate).getTime();
        });

        // Distribuir de volta aos lotes proporcionalmente
        if (batches.length > 0) {
          const quantityPerBatch = Math.ceil(exitToEdit.quantity / batches.length);
          
          for (const batch of batches) {
            const currentBatch = batches.find(b => b.id === batch.id);
            if (currentBatch) {
              const newQuantity = currentBatch.quantity + quantityPerBatch;
              await updateBatchQuantity(batch.id, newQuantity, user.id);
            }
          }
        }

        toast({
          title: "Venda Cancelada!",
          description: "As unidades foram devolvidas aos lotes correspondentes.",
          variant: "default",
        });
      }

      // Se mudando de CANCELADO para outro status, retirar unidades novamente
      if (exitToEdit.status === "cancelado" && newStatus !== "cancelado") {
        if (!user?.id) {
          toast({
            title: "Erro",
            description: "Usuário não autenticado",
            variant: "destructive",
          });
          return;
        }

        // Buscar todos os lotes do produto
        const batches = await getBatchesByProduct(exitToEdit.productId, user.id);
        
        // Retirar unidades dos lotes proporcionalmente
        if (batches.length > 0) {
          const quantityPerBatch = Math.ceil(exitToEdit.quantity / batches.length);
          
          for (const batch of batches) {
            const currentBatch = batches.find(b => b.id === batch.id);
            if (currentBatch) {
              const quantityToRemove = Math.min(quantityPerBatch, currentBatch.quantity);
              const newQuantity = currentBatch.quantity - quantityToRemove;
              await updateBatchQuantity(batch.id, newQuantity, user.id);
            }
          }
        }
      }

        // Recarregar movements para atualizar a lista
        await refreshMovements();

        toast({
          title: "Status Atualizado!",
          description: `Status alterado para ${newStatus === "confirmado" ? "Confirmado" : newStatus === "cancelado" ? "Cancelado" : "Pendente"}.`,
          variant: "default",
        });

        // Fechar dialog
        setIsEditDialogOpen(false);
        setExitToEdit(null);
    } catch (error: any) {
      toast({
        title: "Erro ao Atualizar",
        description: error.message || "Não foi possível atualizar o status.",
        variant: "destructive",
      });
    } finally {
      setIsSaving(false);
    }
  };

  // Carregar dados do Supabase
  useEffect(() => {
    // Restaurar carrinho do storage
    try {
      const raw = localStorage.getItem('fg_cart_items');
      if (raw) {
        const parsed: CartItem[] = JSON.parse(raw);
        if (Array.isArray(parsed)) {
          setCartItems(parsed);
          setIsCartPanelOpen(parsed.length > 0);
        }
      }
    } catch {}
    // Simular carregamento inicial
    const timer = setTimeout(() => {
      setIsLoading(false);
    }, 500);
    
    return () => clearTimeout(timer);
  }, []);

  // Persistir carrinho no storage a cada mudança
  useEffect(() => {
    try {
      localStorage.setItem('fg_cart_items', JSON.stringify(cartItems));
    } catch {}
  }, [cartItems]);

  // Carregar clientes do banco de dados
  useEffect(() => {
    const loadCustomers = async () => {
      if (!user?.id) return;
      try {
        const { data, error } = await supabase
          .from('clientes')
          .select('id, codigo, nome')
          .order('nome', { ascending: true });
        if (error) throw error;
        const mapped = (data || []).map((c: any) => ({
          id: c.id,
          code: String(c.codigo ?? c.code ?? ''),
          name: c.nome ?? c.name,
        }));
        setCustomers(mapped);
      } catch (error: any) {
        console.error('Erro ao carregar clientes:', error);
      }
    };
    loadCustomers();
  }, [user?.id]);


  // Filtros
  const filteredExits = exits.filter(exit =>
    exit.productName.toLowerCase().includes(searchTerm.toLowerCase()) ||
    exit.customer.toLowerCase().includes(searchTerm.toLowerCase())
  );

  // Cálculos
  const totalExits = exits.length;
  const totalValue = exits.reduce((sum, exit) => sum + exit.totalPrice, 0);
  const thisMonthExits = exits.filter(exit => {
    const exitDate = new Date(exit.exitDate);
    const now = new Date();
    return exitDate.getMonth() === now.getMonth() && exitDate.getFullYear() === now.getFullYear();
  }).length;

  // Tela de carregamento
  if (isLoading) {
    return (
      <main className="flex-1 p-3 sm:p-6 space-y-4 sm:space-y-6">
        <div className="flex items-center justify-center min-h-[400px]">
          <div className="text-center">
            <div className="w-16 h-16 bg-gradient-to-br from-red-500 to-red-600 rounded-full flex items-center justify-center mx-auto mb-4 animate-pulse">
              <TrendingDown className="w-8 h-8 text-white" />
            </div>
            <h3 className="text-lg font-semibold text-gray-900 mb-2">🛒 Carregando Vendas...</h3>
            <p className="text-gray-600">Preparando dados de vendas</p>
          </div>
        </div>
      </main>
    );
  }

  return (
    <main className="flex-1 p-6 space-y-6">
      {/* Header */}
      <div className="flex flex-col items-center sm:flex-row sm:items-center sm:justify-between gap-4 mt-4 sm:mt-0">
        <div className="text-center sm:text-left">
          <h1 className="text-3xl font-bold bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent flex items-center gap-2 justify-center sm:justify-start">
            <TrendingDown className="w-8 h-8 text-blue-600" />
            Vendas de Estoque
          </h1>
          <p className="text-muted-foreground">Registre vendas do sistema</p>
        </div>
      <div className="relative flex items-center gap-4 flex-wrap">
        <Dialog open={isAddDialogOpen} onOpenChange={(open) => {
          setIsAddDialogOpen(open);
          if (!open) {
            // Limpar estados ao fechar
            setSelectedProductId("");
            setSelectedBatches([]);
            setProductSearchTerm("");
            setProductSearchOpen(false);
            setSelectedCustomerId("");
            setCustomerSearchTerm("");
            form.reset({
              productId: "",
              quantity: 0,
              unitPrice: 0,
              customer: "",
              exitDate: new Date(),
              notes: "",
              paymentMethod: "avista",
              installments: 1,
            });
          }
        }}>
          <DialogTrigger asChild>
            <Button className="w-full sm:w-auto bg-gradient-to-r from-indigo-600 to-indigo-700 hover:from-indigo-700 hover:to-indigo-800 text-white px-6 sm:px-8 py-3 sm:py-4 rounded-xl sm:rounded-2xl shadow-xl hover:shadow-2xl transition-all duration-200 transform hover:scale-105">
              <Plus className="w-5 h-5 sm:w-6 sm:h-6 mr-2 sm:mr-3" />
              Nova Saída
            </Button>
          </DialogTrigger>
                <DialogContent
                  className="max-w-md sm:max-w-lg md:max-w-2xl max-h-[90vh] flex flex-col p-0 overflow-hidden"
                  onInteractOutside={(e) => {
                    const cart = document.getElementById('cart-panel');
                    // Radix repassa o evento original em e.detail.originalEvent
                    const original = (e as any)?.detail?.originalEvent as Event | undefined;
                    const path = original && (original as any).composedPath ? (original as any).composedPath() as EventTarget[] : [];
                    if (cart) {
                      const isInCart = path.includes(cart) || (e.target instanceof Node && cart.contains(e.target as Node));
                      if (isInCart) {
                        e.preventDefault();
                      }
                    }
                  }}
                >
                  <DialogHeader className="space-y-2 pb-4 px-6 pt-6 border-b">
                    <DialogTitle className="text-base sm:text-xl font-bold text-neutral-900">
                      🛒 Registrar Nova Venda
                    </DialogTitle>
                    <DialogDescription className="text-sm text-neutral-600">
                      Preencha as informações detalhadas da venda para manter o controle preciso
                    </DialogDescription>
                  </DialogHeader>
                  <Form {...form}>
                    <form onSubmit={form.handleSubmit(handleAddExit)} className="flex flex-col flex-1 min-h-0 overflow-hidden">
                      <div className="flex-1 overflow-y-auto px-6 py-4 space-y-4 min-h-0">
                        {/* Primeira linha - Produto e Cliente */}
                        <div className="space-y-4">
                          <FormField
                            control={form.control}
                            name="productId"
                            render={({ field }) => {
                              const selectedProduct = products.find(p => p.id === field.value);
                              const filteredProducts = products.filter(product =>
                                product.name.toLowerCase().includes(productSearchTerm.toLowerCase()) ||
                                product.sku.toLowerCase().includes(productSearchTerm.toLowerCase())
                              );

                              return (
                                <FormItem className="space-y-3">
                                  <FormLabel className="text-base sm:text-sm font-semibold text-neutral-700 flex items-center gap-2">
                                    <Tag className="h-4 w-4" /> Produto
                                  </FormLabel>
                                  <div className="relative">
                                    {selectedProduct ? (
                                      <div className="flex items-center gap-2">
                                        <Input
                                          value={selectedProduct.name}
                                          readOnly
                                          className="h-11 sm:h-10 border-2 border-neutral-200 rounded-xl pr-10 cursor-pointer"
                                          onClick={() => {
                                            setProductSearchTerm("");
                                            field.onChange("");
                                            setSelectedProductId("");
                                            setSelectedBatches([]);
                                          }}
                                        />
                                        <Button
                                          type="button"
                                          variant="ghost"
                                          size="sm"
                                          onClick={() => {
                                            setProductSearchTerm("");
                                            field.onChange("");
                                            setSelectedProductId("");
                                            setSelectedBatches([]);
                                          }}
                                          className="absolute right-2 h-7 w-7 p-0"
                                        >
                                          <X className="h-4 w-4" />
                                        </Button>
                                      </div>
                                    ) : (
                                      <>
                                        <div className="relative">
                                          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
                                          <Input
                                            placeholder="Digite o código ou nome do produto..."
                                            value={productSearchTerm}
                                            onChange={(e) => {
                                              setProductSearchTerm(e.target.value);
                                              // Se limpar o campo, limpar também a seleção
                                              if (e.target.value === '') {
                                                field.onChange("");
                                                setSelectedProductId("");
                                                setSelectedBatches([]);
                                              }
                                            }}
                                            onKeyDown={(e) => {
                                              if (e.key === 'Enter' && filteredProducts.length === 1) {
                                                field.onChange(filteredProducts[0].id);
                                                loadBatchesForProduct(filteredProducts[0].id);
                                                setProductSearchTerm("");
                                              } else if (e.key === 'Escape') {
                                                setProductSearchTerm("");
                                              }
                                            }}
                                            className="h-11 sm:h-10 border-2 border-neutral-200 rounded-xl focus:ring-2 focus:ring-red-500 focus:border-red-500 pl-10"
                                            autoFocus={productSearchTerm !== ''}
                                          />
                                        </div>
                                        
                                        {productSearchTerm.trim() !== '' && (
                                          <div className="absolute z-50 w-full mt-1 bg-white border-2 border-neutral-200 rounded-xl shadow-lg max-h-[300px] overflow-y-auto">
                                            {filteredProducts.length === 0 ? (
                                              <div className="p-4 text-center text-sm text-muted-foreground">
                                                Nenhum produto encontrado
                                              </div>
                                            ) : (
                                              filteredProducts.slice(0, 2).map(product => (
                                                <button
                                                  key={product.id}
                                                  type="button"
                                                  className="w-full px-4 py-3 text-left hover:bg-accent hover:text-accent-foreground focus:bg-accent focus:text-accent-foreground focus:outline-none border-b last:border-b-0 transition-colors"
                                                  onClick={() => {
                                                    field.onChange(product.id);
                                                    loadBatchesForProduct(product.id);
                                                    setProductSearchTerm("");
                                                  }}
                                                >
                                                  <div className="font-medium">{product.name}</div>
                                                  <div className="text-xs text-muted-foreground">Código: {product.sku} (Estoque: {product.stock})</div>
                                                </button>
                                              ))
                                            )}
                                          </div>
                                        )}
                                      </>
                                    )}
                                  </div>
                                  <FormMessage />
                                  {/* Botão de adicionar ao carrinho movido para o footer */}
                                </FormItem>
                              );
                            }}
                          />
                          <FormField
                            control={form.control}
                            name="customer"
                            render={({ field }) => {
                              const selectedCustomer = customers.find(c => c.id === selectedCustomerId);
                              const filteredCustomers = customers.filter(customer =>
                                customer.name.toLowerCase().includes(customerSearchTerm.toLowerCase()) ||
                                customer.code.toLowerCase().includes(customerSearchTerm.toLowerCase())
                              );

                              return (
                                <FormItem className="space-y-3">
                                  <FormLabel className="text-base sm:text-sm font-semibold text-neutral-700 flex items-center gap-2">
                                    <User className="h-4 w-4" /> Cliente
                                  </FormLabel>
                                  <div className="relative">
                                    {selectedCustomer ? (
                                      <div className="flex items-center gap-2">
                                        <Input
                                          value={selectedCustomer.name}
                                          readOnly
                                          className="h-12 sm:h-10 border-2 border-neutral-200 rounded-xl pr-10 cursor-pointer"
                                          onClick={() => {
                                            setCustomerSearchTerm("");
                                            setSelectedCustomerId("");
                                            field.onChange("");
                                          }}
                                        />
                                        <Button
                                          type="button"
                                          variant="ghost"
                                          size="sm"
                                          onClick={() => {
                                            setCustomerSearchTerm("");
                                            setSelectedCustomerId("");
                                            field.onChange("");
                                          }}
                                          className="absolute right-2 h-7 w-7 p-0"
                                        >
                                          <X className="h-4 w-4" />
                                        </Button>
                                      </div>
                                    ) : (
                                      <>
                                        <div className="relative">
                                          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
                                          <Input
                                            placeholder="Digite o código ou nome do cliente..."
                                            value={customerSearchTerm}
                                            onChange={(e) => {
                                              setCustomerSearchTerm(e.target.value);
                                              if (e.target.value === '') {
                                                setSelectedCustomerId("");
                                                field.onChange("");
                                              }
                                            }}
                                            onKeyDown={(e) => {
                                              if (e.key === 'Enter' && filteredCustomers.length === 1) {
                                                setSelectedCustomerId(filteredCustomers[0].id);
                                                field.onChange(filteredCustomers[0].name);
                                                setCustomerSearchTerm("");
                                              } else if (e.key === 'Escape') {
                                                setCustomerSearchTerm("");
                                              }
                                            }}
                                            className="h-12 sm:h-10 border-2 border-neutral-200 rounded-xl focus:ring-2 focus:ring-red-500 focus:border-red-500 pl-10 text-base sm:text-sm"
                                          />
                                        </div>
                                        
                                        {customerSearchTerm.trim() !== '' && (
                                          <div className="absolute z-50 w-full mt-1 bg-white border-2 border-neutral-200 rounded-xl shadow-lg max-h-[300px] overflow-y-auto">
                                            {filteredCustomers.length === 0 ? (
                                              <div className="p-4 text-center text-sm text-muted-foreground">
                                                Nenhum cliente encontrado
                                              </div>
                                            ) : (
                                              filteredCustomers.slice(0, 5).map(customer => (
                                                <button
                                                  key={customer.id}
                                                  type="button"
                                                  className="w-full px-4 py-3 text-left hover:bg-accent hover:text-accent-foreground focus:bg-accent focus:text-accent-foreground focus:outline-none border-b last:border-b-0 transition-colors"
                                                  onClick={() => {
                                                    setSelectedCustomerId(customer.id);
                                                    field.onChange(customer.name);
                                                    setCustomerSearchTerm("");
                                                  }}
                                                >
                                                  <div className="font-medium">{customer.name}</div>
                                                  <div className="text-xs text-muted-foreground">Código: {customer.code}</div>
                                                </button>
                                              ))
                                            )}
                                          </div>
                                        )}
                                      </>
                                    )}
                                  </div>
                                  <FormMessage />
                                </FormItem>
                              );
                            }}
                          />
                        </div>

                      {/* Interface de Gestão de Lotes - Aparece quando produto é selecionado E tem gerenciamento por lote */}
                      {selectedProductId && (() => {
                        const selectedProduct = products.find(p => p.id === selectedProductId);
                        const managedByBatch = (selectedProduct as any)?.managedByBatch === true;
                        
                        // Se NÃO usa gerenciamento por lote, mostrar campos simples
                        if (!managedByBatch) {
                          return (
                            <Card className="border-2 border-red-200">
                              <CardHeader className="pb-3">
                                <CardTitle className="text-lg font-semibold text-gray-900">
                                  🧾 Informações da Venda
                                </CardTitle>
                                <p className="text-sm text-gray-600">{selectedProduct?.name || 'Produto selecionado'}</p>
                              </CardHeader>
                              <CardContent className="space-y-4">
                                <FormField
                                  control={form.control}
                                  name="quantity"
                                  render={({ field }) => (
                                    <FormItem className="space-y-2">
                                      <FormLabel className="text-sm font-semibold text-neutral-700">
                                        <div className="flex items-center gap-2"><Hash className="h-4 w-4" /> Quantidade a Retirar *</div>
                                      </FormLabel>
                                      <FormControl>
                                        <Input
                                          type="number"
                                          min="1"
                                          max={selectedProduct?.stock || 0}
                                          placeholder="Ex: 10"
                                          {...field}
                                          onChange={(e) => {
                                            const value = e.target.value;
                                            if (value === '' || value === null) {
                                              field.onChange(0);
                                              return;
                                            }
                                            const intValue = parseInt(value);
                                            if (!isNaN(intValue)) {
                                              const maxStock = selectedProduct?.stock || 0;
                                              if (intValue > maxStock) {
                                                toast({
                                                  title: "Quantidade Maior que o Permitido!",
                                                  description: `A quantidade máxima permitida é ${maxStock} unidades (estoque disponível).`,
                                                  variant: "destructive",
                                                });
                                                field.onChange(maxStock);
                                              } else {
                                                field.onChange(intValue);
                                              }
                                            }
                                          }}
                                          value={field.value === 0 ? '' : field.value}
                                          className="h-11 sm:h-10 border-2 border-neutral-200 rounded-xl focus:ring-2 focus:ring-red-500 focus:border-red-500 text-base sm:text-sm"
                                        />
                                      </FormControl>
                                      <FormMessage />
                                      <p className="text-xs text-gray-500">
                                        Estoque disponível: <strong>{selectedProduct?.stock || 0} unidades</strong>
                                      </p>
                                    </FormItem>
                                  )}
                                />

                                {/* Datas removidas para saída de produtos sem lote */}
                                
                                {form.watch('quantity') > 0 && selectedProduct && (() => {
                                  const baseUnitPrice = getProductPrice(selectedProduct.id);
                                  const discount = form.watch('discount') || 0;
                                  // Calcular preço com desconto (subtrair percentual do preço base)
                                  const unitPriceWithDiscount = discount > 0 && baseUnitPrice > 0 
                                    ? baseUnitPrice * (1 - discount / 100) 
                                    : baseUnitPrice;
                                  const quantityToExit = form.watch('quantity');
                                  const totalPrice = quantityToExit * unitPriceWithDiscount;
                                  const currentStock = selectedProduct?.stock || 0;
                                  const remaining = currentStock - quantityToExit;
                                  
                                  // Buscar entradas do produto para calcular preço original de aquisição
                                  const normalizeId = (id: any): string => {
                                    if (!id) return '';
                                    return String(id).trim().toLowerCase();
                                  };
                                  
                                  const allMovementsForProduct = movements.filter(m => {
                                    const mProductId = normalizeId(m.productId);
                                    const selectedId = normalizeId(selectedProduct.id);
                                    return mProductId === selectedId;
                                  });
                                  
                                  // Buscar entradas (type pode estar em diferentes formatos)
                                  const productEntries = allMovementsForProduct
                                    .filter(m => {
                                      const typeStr = String(m.type || '').toLowerCase().trim();
                                      return typeStr === 'entrada';
                                    })
                                    .sort((a, b) => {
                                      const dateA = a.date instanceof Date ? a.date : new Date(a.date);
                                      const dateB = b.date instanceof Date ? b.date : new Date(b.date);
                                      return dateB.getTime() - dateA.getTime(); // Mais recente primeiro
                                    });
                                  
                                  // Calcular custo de aquisição (preço original antes do markup)
                                  // Usar o custo unitário da última entrada (mais recente)
                                  let acquisitionCost = 0;
                                  if (productEntries.length > 0) {
                                    const latestEntry = productEntries[0];
                                    if (latestEntry.unitPrice && latestEntry.unitPrice > 0) {
                                      acquisitionCost = latestEntry.unitPrice;
                                    } else if (latestEntry.total && latestEntry.quantity && latestEntry.quantity > 0) {
                                      acquisitionCost = latestEntry.total / latestEntry.quantity;
                                    }
                                  }
                                  
                                  // Calcular lucro e margem de contribuição
                                  const sellingPrice = unitPriceWithDiscount > 0 ? unitPriceWithDiscount : baseUnitPrice;
                                  const profit = quantityToExit > 0 && acquisitionCost > 0 
                                    ? (sellingPrice - acquisitionCost) * quantityToExit 
                                    : 0;
                                  
                                  // Margem de Contribuição (%) = (Lucro / Total de venda) * 100
                                  const contributionMarginPercent = totalPrice > 0 && profit !== 0
                                    ? (profit / totalPrice) * 100
                                    : 0;
                                  
                                  return (
                                    <div className="p-4 space-y-2">
                                      {/* 1. Total a Sair */}
                                      <div className="flex items-center justify-between">
                                        <span className="text-sm font-medium text-gray-900 flex items-center gap-2"><BarChart3 className="h-4 w-4" /> Total a Sair:</span>
                                        <span className="text-lg font-bold text-red-600">{quantityToExit} unidades</span>
                                      </div>
                                      
                                      {/* 2. Preço Original de Aquisição */}
                                      {acquisitionCost > 0 && (
                                        <div className="flex items-center justify-between pt-2 border-t border-red-200">
                                          <span className="text-sm font-medium text-gray-900 flex items-center gap-2"><DollarSign className="h-4 w-4" /> Preço Original de Aquisição:</span>
                                          <span className="text-sm font-semibold text-gray-700">R$ {acquisitionCost.toFixed(2).replace('.', ',')}</span>
                                        </div>
                                      )}
                                      
                                      {/* 3. Preço Unitário */}
                                      <div className="flex items-center justify-between pt-2 border-t border-red-200">
                                        <span className="text-sm font-medium text-gray-900 flex items-center gap-2"><DollarSign className="h-4 w-4" /> Preço Unitário {discount > 0 ? '(Base)' : ''}:</span>
                                        <span className="text-sm font-semibold text-gray-700">R$ {baseUnitPrice.toFixed(2).replace('.', ',')}</span>
                                      </div>
                                      {discount > 0 && (
                                        <div className="flex items-center justify-between pt-2 border-t border-red-200">
                                          <span className="text-sm font-medium text-gray-900 flex items-center gap-2"><DollarSign className="h-4 w-4" /> Preço Unitário (com desconto):</span>
                                          <span className="text-sm font-bold text-red-600">R$ {unitPriceWithDiscount.toFixed(2).replace('.', ',')}</span>
                                        </div>
                                      )}
                                      
                                      {/* 4. Valor Total */}
                                      <div className="flex items-center justify-between pt-2 border-t border-red-200">
                                        <span className="text-sm font-medium text-gray-900 flex items-center gap-2"><Coins className="h-4 w-4" /> Valor Total:</span>
                                        <span className="text-lg font-bold text-blue-600">R$ {totalPrice.toFixed(2).replace('.', ',')}</span>
                                      </div>
                                      
                                      {/* 5. Estoque Restante */}
                                      <div className="flex items-center justify-between pt-2 border-t border-red-200">
                                        <span className="text-sm font-medium text-gray-900 flex items-center gap-2"><Package className="h-4 w-4" /> Estoque Restante:</span>
                                        <span className={`text-lg font-bold ${remaining < 0 ? 'text-red-600' : remaining < (currentStock * 0.2) && currentStock > 0 ? 'text-yellow-600' : 'text-green-600'}`}>
                                          {Math.max(0, remaining)} unidades
                                        </span>
                                      </div>
                                      
                                      {/* 6. Lucro */}
                                      {acquisitionCost > 0 && (
                                        <div className="flex items-center justify-between pt-2 border-t border-red-200">
                                          <span className="text-sm font-medium text-gray-900 flex items-center gap-2"><Coins className="h-4 w-4" /> Lucro:</span>
                                          <span className={`text-sm font-bold ${profit >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                                            R$ {profit.toFixed(2).replace('.', ',')}
                                          </span>
                                        </div>
                                      )}
                                      
                                      {/* 7. Margem de Contribuição */}
                                      {acquisitionCost > 0 && (
                                        <div className="flex items-center justify-between pt-2 border-t border-red-200">
                                          <span className="text-sm font-medium text-gray-900 flex items-center gap-2"><BarChart3 className="h-4 w-4" /> Margem de Contribuição:</span>
                                          <span className={`text-sm font-bold ${contributionMarginPercent >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                                            {contributionMarginPercent.toFixed(2).replace('.', ',')}%
                                          </span>
                                        </div>
                                      )}
                                    </div>
                                  );
                                })()}
                              </CardContent>
                            </Card>
                          );
                        }
                        
                        // Se usa gerenciamento por lote, mostrar Card de Lotes
                        return (
                          <Card className="border-2 border-red-200">
                            <CardHeader className="pb-3">
                              <div className="flex items-center justify-end">
                                <Button
                                  type="button"
                                  size="sm"
                                  onClick={addBatchToSelection}
                                  className="inline-flex items-center gap-2 h-9 rounded-md px-3 text-sm font-medium bg-gradient-to-r from-indigo-600 to-purple-600 text-white hover:from-indigo-700 hover:to-purple-700 focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2"
                                >
                                  <Plus className="h-4 w-4 mr-1" />
                                  Selecionar Lote
                                </Button>
                              </div>
                            </CardHeader>

                            <CardContent className="space-y-4 max-h-[350px] overflow-y-auto">
                              {availableBatches.length === 0 ? (
                                <div className="text-center py-8">
                                  <Package className="h-12 w-12 mx-auto mb-3 text-gray-400" />
                                  <p className="text-gray-600 flex items-center gap-2"><AlertTriangle className="h-4 w-4" /> Nenhum lote com estoque disponível</p>
                                  <p className="text-sm text-gray-500 mt-1">Todos os lotes deste produto estão sem estoque</p>
                                </div>
                              ) : selectedBatches.length === 0 ? (
                                <div className="text-center py-8">
                                  <Package className="h-12 w-12 mx-auto mb-3 text-gray-400" />
                                  <p className="text-gray-600">Nenhum lote selecionado</p>
                                  <p className="text-sm text-gray-500 mt-1">Adicione um lote para começar a retirar estoque</p>
                                </div>
                              ) : (
                                <div className="space-y-3">
                                  {selectedBatches.map((selectedBatch, index) => {
                                    const batch = availableBatches.find(b => b.id === selectedBatch.batchId);
                                    const available = batch?.quantity || 0;
                                    const exceeds = selectedBatch.quantity > available;
                                    
                                    return (
                                      <Card key={index} className="hover:shadow-md transition-all border-gray-200">
                                        <CardContent className="p-5 space-y-5">
                                          {/* Primeira linha: Lote e Quantidade */}
                                          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 items-start">
                                            {/* Campo Lote */}
                                            <div className="space-y-2">
                                              <div className="flex items-center justify-between gap-2 h-7">
                                                <Label htmlFor={`batch-${index}`} className="text-sm font-medium">
                                                  <div className="flex items-center gap-2"><Package className="h-4 w-4" /> Selecione o Lote</div>
                                                </Label>
                                                <span className="h-7" />
                                              </div>
                                              <Input
                                                id={`batch-${index}`}
                                                type="text"
                                                value={selectedBatch.batchNumber || (batch?.batchNumber || '')}
                                                onChange={(e) => {
                                                  const value = e.target.value.trim();
                                                  updateBatchNumber(index, value);
                                                }}
                                                placeholder="Digite o número do lote"
                                                className="h-10 font-semibold"
                                              />
                                              {batch ? (
                                                <p className="text-xs text-gray-500">
                                                  <span className="flex items-center gap-2"><CheckCircle className="h-4 w-4 text-green-600" /> Lote encontrado: {batch.quantity} unidades disponíveis</span>
                                                  {batch.expiryDate && ` • Validade: ${new Date(batch.expiryDate).toLocaleDateString('pt-BR')}`}
                                                </p>
                                              ) : selectedBatch.batchNumber ? (
                                                <p className="text-xs text-yellow-600">
                                                  <span className="flex items-center gap-2"><AlertTriangle className="h-4 w-4 text-yellow-600" /> Lote não encontrado. Verifique o número digitado.</span>
                                                </p>
                                              ) : null}
                                            </div>
                                            {/* Campo Quantidade */}
                                            <div className="space-y-2">
                                              <div className="flex items-center justify-between gap-2 h-7">
                                                <Label htmlFor={`quantity-${index}`} className="text-sm font-medium">
                                                  <div className="flex items-center gap-2"><Hash className="h-4 w-4" /> Quantidade a Retirar</div>
                                                </Label>
                                                <span className="h-7" />
                                              </div>
                                              <Input
                                                id={`quantity-${index}`}
                                                type="number"
                                                min="1"
                                                max={available}
                                                placeholder="0"
                                                value={selectedBatch.quantity === 0 ? '' : (selectedBatch.quantity || '')}
                                                onChange={(e) => {
                                                  const value = e.target.value;
                                                  
                                                  if (value === '' || value === null) {
                                                    updateSelectedBatch(index, selectedBatch.batchId, 0, selectedBatch.batchNumber);
                                                    return;
                                                  }
                                                  
                                                  if (value.match(/^0[1-9]/) && value.length === 2) {
                                                    const newValue = value.substring(1);
                                                    const intValue = Math.max(0, parseInt(newValue));
                                                    updateSelectedBatch(index, selectedBatch.batchId, intValue, selectedBatch.batchNumber);
                                                    return;
                                                  }
                                                  
                                                  const intValue = parseInt(value);
                                                  if (!isNaN(intValue)) {
                                                    // Permitir valores até a quantidade disponível (incluindo igual)
                                                    if (intValue <= available) {
                                                      updateSelectedBatch(index, selectedBatch.batchId, intValue, selectedBatch.batchNumber);
                                                    } else {
                                                      toast({
                                                        title: "Quantidade Maior que o Permitido!",
                                                        description: `A quantidade máxima permitida para o lote ${selectedBatch.batchNumber || ''} é ${available} unidades.`,
                                                        variant: "destructive",
                                                      });
                                                      updateSelectedBatch(index, selectedBatch.batchId, available, selectedBatch.batchNumber);
                                                    }
                                                  }
                                                }}
                                                className={`h-10 font-semibold ${exceeds ? 'border-2 border-red-500 focus:border-red-500 focus:ring-red-500' : available > 0 && selectedBatch.quantity >= available * 0.8 && selectedBatch.quantity < available ? 'border-2 border-yellow-500 focus:border-yellow-500 focus:ring-yellow-500' : ''}`}
                                              />
                                              {selectedBatch.batchId && (
                                                <p className={`text-xs ${exceeds ? 'text-red-600 bg-red-50 p-2 rounded-md border border-red-200' : selectedBatch.quantity === available ? 'text-green-600 bg-green-50 p-2 rounded-md border border-green-200' : 'text-gray-500'}`}>
                                                  {exceeds ? (
                                                    <><span className="flex items-center gap-1"><X className="h-4 w-4 text-red-600" /> Excede disponível!</span> Disponível: <strong>{available} un.</strong></>
                                                  ) : selectedBatch.quantity === available ? (
                                                    <><span className="flex items-center gap-1"><CheckCircle className="h-4 w-4 text-green-600" /> Usando todo o estoque disponível:</span> <strong>{available} un.</strong></>
                                                  ) : (
                                                    <><span className="flex items-center gap-1"><CheckCircle className="h-4 w-4 text-green-600" /> Disponível:</span> <strong>{available} un.</strong></>
                                                  )}
                                                </p>
                                              )}
                                            </div>
                                          </div>
                                          {/* Botão Remover */}
                                          <div className="flex gap-2 pt-3 border-t border-gray-200">
                                            <Button
                                              type="button"
                                              size="sm"
                                              onClick={() => removeBatchFromSelection(index)}
                                              className="flex-1 bg-red-600 hover:bg-red-700 text-white focus:ring-red-600 transition-colors"
                                            >
                                              <Trash2 className="h-4 w-4 mr-1" />
                                              Remover Lote
                                            </Button>
                                          </div>
                                        </CardContent>
                                      </Card>
                                    );
                                  })}
                                  
                                  {/* Resumo da distribuição */}
                                  <Card className="bg-gradient-to-r from-red-50 to-orange-50 border-red-200">
                                    <CardContent className="p-4 space-y-2">
                                      <div className="flex items-center justify-between">
                                        <span className="text-sm font-medium text-gray-900">
                                          <span className="flex items-center gap-2"><BarChart3 className="h-4 w-4" /> Total a Sair:</span>
                                        </span>
                                        <span className="text-lg font-bold text-red-600">
                                          {getTotalSelectedQuantity()} unidades
                                        </span>
                                      </div>
                                      {(() => {
                                        const product = products.find(p => p.id === selectedProductId);
                                        const totalToExit = getTotalSelectedQuantity();
                                        
                                        // Verificar se o produto usa gerenciamento por lote
                                        const managedByBatch = (product as any)?.managedByBatch === true;
                                        
                                        // Quando trabalha com lotes, calcular estoque restante baseado nos lotes selecionados
                                        // ao invés do estoque total do produto
                                        let totalStock = 0;
                                        let remaining = 0;
                                        
                                        // Verificar se está trabalhando com lotes E se há lotes realmente selecionados
                                        // Se o produto usa lotes E há lotes disponíveis E há lotes selecionados com batchId válido
                                        const hasSelectedBatches = managedByBatch && 
                                                                   availableBatches.length > 0 && 
                                                                   selectedBatches.length > 0 && 
                                                                   selectedBatches.some(b => b.batchId && b.quantity > 0);
                                        
                                        if (hasSelectedBatches) {
                                          // Calcular estoque total dos lotes selecionados
                                          // IMPORTANTE: Somar apenas os lotes que estão realmente selecionados (com batchId válido)
                                          selectedBatches.forEach(batch => {
                                            if (batch.batchId && batch.quantity > 0) {
                                              const batchInfo = availableBatches.find(b => b.id === batch.batchId);
                                              if (batchInfo && batchInfo.quantity > 0) {
                                                // Soma a quantidade disponível no lote ANTES da retirada
                                                totalStock += batchInfo.quantity;
                                              }
                                            }
                                          });
                                          
                                          // Estoque restante = estoque total dos lotes selecionados - quantidade total a retirar
                                          // Exemplo: Lote tem 10 unidades, vamos retirar 10 → 10 - 10 = 0 unidades restantes
                                          remaining = Math.max(0, totalStock - totalToExit);
                                          
                                          // Debug temporário para verificar cálculo
                                          console.log('DEBUG LOTE RESTANTE:', {
                                            managedByBatch,
                                            totalStock,
                                            totalToExit,
                                            remaining,
                                            selectedBatches: selectedBatches.map(b => ({ batchId: b.batchId, quantity: b.quantity, batchNumber: b.batchNumber })),
                                            hasSelectedBatches,
                                            productStock: product?.stock
                                          });
                                        } else {
                                          // Se não há lotes selecionados OU produto não usa lotes, usar estoque total do produto
                                          totalStock = product?.stock || 0;
                                          remaining = totalStock - totalToExit;
                                        }
                                        // Buscar entradas diretamente para calcular o preço
                                        // Comparação mais robusta: normalizar IDs (pode ser UUID, string ou número)
                                        const normalizeId = (id: any): string => {
                                          if (!id) return '';
                                          return String(id).trim().toLowerCase();
                                        };
                                        
                                        const allMovementsForProduct = movements.filter(m => {
                                          const mProductId = normalizeId(m.productId);
                                          const selectedId = normalizeId(selectedProductId);
                                          const matches = mProductId === selectedId;
                                          return matches;
                                        });
                                        
                                        // Buscar entradas (tipo pode estar em diferentes formatos)
                                        const productEntries = allMovementsForProduct
                                          .filter(m => {
                                            const typeStr = String(m.type || '').toLowerCase().trim();
                                            const isEntry = typeStr === 'entrada' || typeStr === 'entrada';
                                            return isEntry;
                                          })
                                          .sort((a, b) => {
                                            const dateA = a.date instanceof Date ? a.date : new Date(a.date);
                                            const dateB = b.date instanceof Date ? b.date : new Date(b.date);
                                            return dateB.getTime() - dateA.getTime();
                                          });
                                        
                                        // SEMPRE priorizar o preço de VENDA do produto (já calculado com markup)
                                        let baseUnitPrice = 0;
                                        // Primeiro: usar preço de venda do produto (com markup aplicado)
                                        if (product && product.price > 0) {
                                          baseUnitPrice = product.price;
                                        }
                                        // Se o produto não tem preço de venda, usar preço de compra da última entrada como fallback
                                        else if (productEntries.length > 0) {
                                          // Pegar o primeiro (mais recente) e verificar se tem unitPrice válido
                                          const latestEntry = productEntries[0];
                                          if (latestEntry.unitPrice && latestEntry.unitPrice > 0) {
                                            baseUnitPrice = latestEntry.unitPrice;
                                          } else if (latestEntry.total && latestEntry.quantity && latestEntry.quantity > 0) {
                                            // Se não tiver unitPrice, calcular a partir do total e quantidade
                                            baseUnitPrice = latestEntry.total / latestEntry.quantity;
                                          }
                                        }
                                        
                                        // Aplicar desconto se informado
                                        const discount = form.watch('discount') || 0;
                                        const unitPrice = discount > 0 && baseUnitPrice > 0 
                                          ? baseUnitPrice * (1 - discount / 100) 
                                          : baseUnitPrice;
                                        
                                        const totalPrice = totalToExit * unitPrice;
                                        
                                        // Debug temporário - sempre logar quando houver produto selecionado
                                        if (selectedProductId) {
                                          console.log('=== DEBUG SAIDAS - PREÇO UNITÁRIO ===');
                                          console.log('ProductId selecionado:', selectedProductId, `(tipo: ${typeof selectedProductId})`);
                                          console.log('Produto encontrado:', product?.name, `(ID: ${product?.id})`);
                                          console.log('Total de movimentações no sistema:', movements.length);
                                          console.log('Movimentações do produto encontradas:', allMovementsForProduct.length);
                                          console.log('Detalhes das movimentações:', allMovementsForProduct.map(m => ({
                                            id: m.id,
                                            type: m.type,
                                            productId: m.productId,
                                            productIdNormalized: normalizeId(m.productId),
                                            productName: m.productName,
                                            unitPrice: m.unitPrice,
                                            total: m.total,
                                            quantity: m.quantity,
                                            date: m.date
                                          })));
                                          console.log('Entradas encontradas:', productEntries.length);
                                          if (productEntries.length > 0) {
                                            console.log('Detalhes da última entrada:', {
                                              ...productEntries[0],
                                              unitPriceCalculated: productEntries[0].unitPrice || (productEntries[0].total / productEntries[0].quantity)
                                            });
                                          } else {
                                            console.log('NENHUMA ENTRADA ENCONTRADA!');
                                            console.log('Tipos de movimentações encontradas:', [...new Set(allMovementsForProduct.map(m => m.type))]);
                                          }
                                          console.log('Preço unitário final calculado:', unitPrice);
                                          console.log('Valor total:', totalPrice);
                                          console.log('=====================================');
                                        }
                                        
                                        // Calcular custo de aquisição (preço original antes do markup)
                                        // Usar o custo unitário da última entrada (mais recente)
                                        let acquisitionCost = 0;
                                        if (productEntries.length > 0) {
                                          // Pegar a última entrada (mais recente) - já está ordenado por data descendente
                                          const latestEntry = productEntries[0];
                                          
                                          // O unitPrice na entrada é o custo de compra original (antes do markup)
                                          if (latestEntry.unitPrice && latestEntry.unitPrice > 0) {
                                            acquisitionCost = latestEntry.unitPrice;
                                          } else if (latestEntry.total && latestEntry.quantity && latestEntry.quantity > 0) {
                                            // Se não tiver unitPrice, calcular a partir do total e quantidade
                                            acquisitionCost = latestEntry.total / latestEntry.quantity;
                                          }
                                        }
                                        
                                        // Calcular lucro e margem de contribuição
                                        // Lucro = (Preço de venda com desconto - Custo de aquisição) * Quantidade
                                        // Usar unitPrice (preço de venda com desconto) se houver desconto, senão usar baseUnitPrice
                                        const sellingPrice = unitPrice > 0 ? unitPrice : baseUnitPrice;
                                        const profit = totalToExit > 0 && acquisitionCost > 0 
                                          ? (sellingPrice - acquisitionCost) * totalToExit 
                                          : 0;
                                        
                                        // Margem de Contribuição (%) = (Lucro / Total de venda) * 100
                                        const contributionMarginPercent = totalPrice > 0 && profit !== 0
                                          ? (profit / totalPrice) * 100
                                          : 0;
                                        
                                        return (
                                          <>
                                            {totalToExit > 0 && (
                                              <>
                                                {/* 2. Preço Original de Aquisição */}
                                                {acquisitionCost > 0 && (
                                                  <div className="flex items-center justify-between pt-2 border-t border-red-200">
                                                    <span className="text-sm font-medium text-gray-900 flex items-center gap-2">
                                                      <DollarSign className="h-4 w-4" /> Preço Original de Aquisição:
                                                    </span>
                                                    <span className="text-sm font-semibold text-gray-700">
                                                      R$ {acquisitionCost.toFixed(2).replace('.', ',')}
                                                    </span>
                                                  </div>
                                                )}
                                                
                                                {/* 3. Preço Unitário */}
                                                <div className="flex items-center justify-between pt-2 border-t border-red-200">
                                                  <span className="text-sm font-medium text-gray-900 flex items-center gap-2">
                                                    <DollarSign className="h-4 w-4" /> Preço Unitário {discount > 0 ? '(Base)' : ''}:
                                                  </span>
                                                  <span className="text-sm font-semibold text-gray-700">
                                                    {baseUnitPrice > 0 ? `R$ ${baseUnitPrice.toFixed(2).replace('.', ',')}` : 'Não encontrado'}
                                                  </span>
                                                </div>
                                                {discount > 0 && baseUnitPrice > 0 && (
                                                  <div className="flex items-center justify-between pt-2 border-t border-red-200">
                                                    <span className="text-sm font-medium text-gray-900 flex items-center gap-2">
                                                      <DollarSign className="h-4 w-4" /> Preço Unitário (com desconto):
                                                    </span>
                                                    <span className="text-sm font-bold text-red-600">
                                                      R$ {unitPrice.toFixed(2).replace('.', ',')}
                                                    </span>
                                                  </div>
                                                )}
                                                
                                                {/* 4. Valor Total */}
                                                <div className="flex items-center justify-between pt-2 border-t border-red-200">
                                                  <span className="text-sm font-medium text-gray-900 flex items-center gap-2">
                                                    <Coins className="h-4 w-4" /> Valor Total:
                                                  </span>
                                                  <span className="text-lg font-bold text-blue-600">
                                                    R$ {totalPrice.toFixed(2).replace('.', ',')}
                                                  </span>
                                                </div>
                                                
                                                {/* 5. Lote Restante */}
                                                <div className="flex items-center justify-between pt-2 border-t border-red-200">
                                                  <span className="text-sm font-medium text-gray-900 flex items-center gap-2">
                                                    <Package className="h-4 w-4" /> {hasSelectedBatches ? 'Lote Restante:' : 'Estoque Restante:'}
                                                  </span>
                                                  <span className={`text-lg font-bold ${remaining < 0 ? 'text-red-600' : remaining < (totalStock * 0.2) && totalStock > 0 ? 'text-yellow-600' : 'text-green-600'}`}>
                                                    {Math.max(0, remaining)} unidades
                                                  </span>
                                                </div>
                                                
                                                {/* 6. Lucro */}
                                                {acquisitionCost > 0 && (
                                                  <div className="flex items-center justify-between pt-2 border-t border-red-200">
                                                    <span className="text-sm font-medium text-gray-900 flex items-center gap-2">
                                                      <Coins className="h-4 w-4" /> Lucro:
                                                    </span>
                                                    <span className={`text-sm font-bold ${profit >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                                                      R$ {profit.toFixed(2).replace('.', ',')}
                                                    </span>
                                                  </div>
                                                )}
                                                
                                                {/* 7. Margem de Contribuição */}
                                                {acquisitionCost > 0 && (
                                                  <div className="flex items-center justify-between pt-2 border-t border-red-200">
                                                    <span className="text-sm font-medium text-gray-900 flex items-center gap-2">
                                                      <BarChart3 className="h-4 w-4" /> Margem de Contribuição:
                                                    </span>
                                                    <span className={`text-sm font-bold ${contributionMarginPercent >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                                                      {contributionMarginPercent.toFixed(2).replace('.', ',')}%
                                                    </span>
                                                  </div>
                                                )}
                                                
                                                {unitPrice === 0 && productEntries.length === 0 && (
                                                  <div className="pt-2 text-xs text-orange-600 bg-orange-50 p-2 rounded border border-orange-200">
                                                    <span className="flex items-center gap-2"><AlertTriangle className="h-4 w-4" /> Este produto não possui entradas registradas. O preço será R$ 0,00. Por favor, cadastre uma entrada no módulo "Entradas".</span>
                                                  </div>
                                                )}
                                              </>
                                            )}
                                          </>
                                        );
                                      })()}
                                    </CardContent>
                                  </Card>
                                </div>
                              )}
                            </CardContent>
                          </Card>
                        );
                      })()}
                      
                        {/* Configuração de Desconto */}
                        {selectedProductId && (
                          <Card className="border-2 border-red-200">
                            <CardHeader className="pb-3">
                              <CardTitle className="text-base font-semibold text-gray-900">
                                <div className="flex items-center gap-2"><TrendingDownIcon className="h-4 w-4" /> Configuração de Desconto</div>
                              </CardTitle>
                            </CardHeader>
                            <CardContent>
                              <FormField
                                control={form.control}
                                name="discount"
                                render={({ field }) => (
                                  <FormItem className="space-y-2">
                                    <FormLabel className="text-sm font-semibold text-neutral-700">
                                      <div className="flex items-center gap-2"><TrendingDownIcon className="h-4 w-4" /> Desconto (%) - Percentual para aplicar no preço de venda</div>
                                    </FormLabel>
                                    <FormControl>
                                      <Input
                                        type="number"
                                        step="0.1"
                                        min="0"
                                        max="100"
                                        placeholder="Ex: 10 (para 10% de desconto)"
                                        {...field}
                                        onChange={(e) => {
                                          const value = e.target.value;
                                          if (value === '' || value === null) {
                                            field.onChange(0);
                                            return;
                                          }
                                          const numValue = parseFloat(value);
                                          if (!isNaN(numValue) && numValue >= 0 && numValue <= 100) {
                                            field.onChange(numValue);
                                          }
                                        }}
                                        value={field.value === undefined || field.value === null || field.value === 0 ? '' : field.value}
                                        className="h-11 sm:h-10 border-2 border-red-300 rounded-xl focus:ring-2 focus:ring-red-500 focus:border-red-500 text-base sm:text-sm bg-red-50/50"
                                      />
                                    </FormControl>
                                    <FormMessage />
                                    {(() => {
                                      const selectedProduct = products.find(p => p.id === selectedProductId);
                                      if (!selectedProduct) return null;
                                      
                                      const basePrice = getProductPrice(selectedProduct.id);
                                      const discount = field.value || 0;
                                      const priceWithDiscount = discount > 0 && basePrice > 0 
                                        ? basePrice * (1 - discount / 100) 
                                        : basePrice;
                                      
                                      return (
                                        discount > 0 && basePrice > 0 && (
                                          <div className="mt-2 p-3 bg-red-50 border border-red-200 rounded-lg">
                                            <p className="text-sm font-semibold text-red-700">
                                              <span className="flex items-center gap-2"><Coins className="h-4 w-4" /> Preço Final com Desconto: R$ {priceWithDiscount.toFixed(2)}</span>
                                            </p>
                                            <p className="text-xs text-red-600 mt-1">
                                              Preço base: R$ {basePrice.toFixed(2)} - {discount}% = R$ {priceWithDiscount.toFixed(2)}
                                            </p>
                                          </div>
                                        )
                                      );
                                    })()}
                                  </FormItem>
                                )}
                              />
                            </CardContent>
                          </Card>
                        )}

                        {/* Campo de Troco */}
                        {(selectedProductId || cartItems.length > 0) && (
                          <Card className="border-2 border-blue-200">
                            <CardHeader className="pb-3">
                              <CardTitle className="text-base font-semibold text-gray-900">
                                <div className="flex items-center gap-2"><Calculator className="h-4 w-4" /> Cálculo de Troco</div>
                              </CardTitle>
                            </CardHeader>
                            <CardContent>
                              <div className="space-y-2">
                                <Label className="text-sm font-semibold text-neutral-700">
                                  <div className="flex items-center gap-2"><DollarSign className="h-4 w-4" /> Valor Recebido</div>
                                </Label>
                                <Input
                                  type="number"
                                  step="0.01"
                                  min="0"
                                  placeholder="Ex: 100.00"
                                  value={amountReceived === 0 ? '' : amountReceived}
                                  onChange={(e) => {
                                    const value = e.target.value;
                                    if (value === '' || value === null) {
                                      setAmountReceived(0);
                                      return;
                                    }
                                    const numValue = parseFloat(value);
                                    if (!isNaN(numValue) && numValue >= 0) {
                                      setAmountReceived(numValue);
                                    }
                                  }}
                                  className="h-11 sm:h-10 border-2 border-blue-300 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-blue-500 text-base sm:text-sm bg-blue-50/50"
                                />
                                {(() => {
                                  // Se houver itens no carrinho, usar o total do carrinho (já com desconto aplicado)
                                  let totalToPay = 0;
                                  
                                  if (cartItems.length > 0) {
                                    // Usar o total do carrinho (subtotal - desconto)
                                    const subtotal = cartItems.reduce((sum, i) => sum + (i.quantity * i.unitPrice), 0);
                                    totalToPay = Math.max(0, subtotal - discount);
                                  } else if (selectedProductId) {
                                    // Calcular baseado no produto selecionado
                                    const selectedProduct = products.find(p => p.id === selectedProductId);
                                    if (!selectedProduct) return null;
                                    
                                    const basePrice = getProductPrice(selectedProduct.id);
                                    const discountValue = form.watch('discount') || 0;
                                    const priceWithDiscount = discountValue > 0 && basePrice > 0 
                                      ? basePrice * (1 - discountValue / 100) 
                                      : basePrice;
                                    
                                    // Calcular total: considerar a quantidade do produto ou dos lotes selecionados
                                    let quantityToCalculate = 0;
                                    if ((selectedProduct as any)?.managedByBatch === true) {
                                      quantityToCalculate = selectedBatches.reduce((sum, b) => sum + (b.quantity || 0), 0);
                                    } else {
                                      quantityToCalculate = form.watch('quantity') || 0;
                                    }
                                    
                                    totalToPay = priceWithDiscount * quantityToCalculate;
                                  }
                                  
                                  const change = amountReceived > 0 ? amountReceived - totalToPay : 0;
                                  
                                  return (
                                    <div className="mt-3 space-y-2">
                                      <div className="p-3 bg-blue-50 border border-blue-200 rounded-lg">
                                        <div className="flex items-center justify-between mb-2">
                                          <span className="text-sm font-medium text-gray-700">Total a Pagar:</span>
                                          <span className="text-lg font-bold text-blue-600">
                                            R$ {totalToPay.toFixed(2).replace('.', ',')}
                                          </span>
                                        </div>
                                        {amountReceived > 0 && (
                                          <>
                                            <div className="flex items-center justify-between pt-2 border-t border-blue-200">
                                              <span className="text-sm font-medium text-gray-700">Valor Recebido:</span>
                                              <span className="text-sm font-semibold text-gray-900">
                                                R$ {amountReceived.toFixed(2).replace('.', ',')}
                                              </span>
                                            </div>
                                            <div className="flex items-center justify-between pt-2 border-t border-blue-200">
                                              <span className="text-sm font-bold text-gray-900 flex items-center gap-2">
                                                <Calculator className="h-4 w-4" /> Troco:
                                              </span>
                                              <span className={`text-lg font-bold ${change >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                                                R$ {Math.abs(change).toFixed(2).replace('.', ',')}
                                              </span>
                                            </div>
                                            {change < 0 && (
                                              <p className="text-xs text-red-600 mt-2 flex items-center gap-1">
                                                <AlertTriangle className="h-3 w-3" />
                                                Valor insuficiente! Faltam R$ {Math.abs(change).toFixed(2).replace('.', ',')}
                                              </p>
                                            )}
                                          </>
                                        )}
                                      </div>
                                    </div>
                                  );
                                })()}
                              </div>
                            </CardContent>
                          </Card>
                        )}
                      
                        {/* Carrinho (aparece quando há itens) */}
                        {cartItems.length > 0 && (
                          <Card className="border-2 border-amber-200">
                            <CardHeader className="pb-3">
                              <CardTitle className="text-lg font-semibold text-gray-900">🧺 Itens no Carrinho</CardTitle>
                            </CardHeader>
                            <CardContent className="space-y-3">
                              {cartItems.map((ci, idx) => {
                                const p = products.find(p => p.id === ci.productId);
                                return (
                                  <div key={idx} className="flex items-center justify-between rounded-lg border p-3">
                                    <div className="text-sm">
                                      <div className="font-medium">{p?.name || 'Produto'}</div>
                                      <div className="text-xs text-muted-foreground">
                                        {ci.managedByBatch ? `${ci.batches.reduce((s, b) => s + (b.quantity || 0), 0)} un em ${ci.batches.length} lote(s)` : `${ci.quantity} un`}
                                      </div>
                                    </div>
                                    <Button variant="ghost" size="sm" className="text-red-600 hover:text-red-700 hover:bg-red-50" onClick={() => removeCartItem(idx)}>
                                      <Trash2 className="w-4 h-4" />
                                    </Button>
                                  </div>
                                );
                              })}
                            </CardContent>
                          </Card>
                        )}

                        {/* Segunda linha - Data da Venda e Forma de Pagamento */}
                        <div className="space-y-4">
                          <FormField
                            control={form.control}
                            name="exitDate"
                            render={({ field }) => (
                              <FormItem className="space-y-3">
                                <FormLabel className="text-base sm:text-sm font-semibold text-neutral-700">
                                  <div className="flex items-center gap-2"><Calendar className="h-4 w-4" /> Data da Venda</div>
                                </FormLabel>
                                <FormControl>
                                  <Input 
                                    type="date"
                                    {...field}
                                    value={field.value instanceof Date ? field.value.toISOString().split('T')[0] : ''}
                                    onChange={(e) => field.onChange(new Date(e.target.value))}
                                    className="h-11 sm:h-10 border-2 border-neutral-200 rounded-xl focus:ring-2 focus:ring-red-500 focus:border-red-500 text-base sm:text-sm"
                                  />
                                </FormControl>
                                <FormMessage />
                              </FormItem>
                            )}
                          />
                          <FormField
                            control={form.control}
                            name="paymentMethod"
                            render={({ field }) => (
                              <FormItem className="space-y-3">
                                <FormLabel className="text-base sm:text-sm font-semibold text-neutral-700">
                                  💳 Forma de Pagamento
                                </FormLabel>
                                <Select onValueChange={(v) => {
                                  field.onChange(v);
                                  if (v !== "parcelado") {
                                    form.setValue("installments", 1);
                                  }
                                }} defaultValue={field.value || "avista"}>
                                  <FormControl>
                                    <SelectTrigger className="h-12 sm:h-10 border-neutral-200 rounded-lg focus:ring-2 focus:ring-red-500 focus:border-red-500 text-base sm:text-sm">
                                      <SelectValue />
                                    </SelectTrigger>
                                  </FormControl>
                                  <SelectContent>
                                    <SelectItem value="avista">À vista</SelectItem>
                                    <SelectItem value="pix">Pix</SelectItem>
                                    <SelectItem value="debito">Cartão débito</SelectItem>
                                    <SelectItem value="credito">Cartão crédito</SelectItem>
                                    <SelectItem value="dinheiro">Dinheiro</SelectItem>
                                    <SelectItem value="parcelado">Parcelado</SelectItem>
                                  </SelectContent>
                                </Select>
                                <FormMessage />
                              </FormItem>
                            )}
                          />
                        </div>
                        
                        {/* Terceira linha - Parcelas (se parcelado) */}
                        {form.watch("paymentMethod") === "parcelado" && (
                          <div className="space-y-4">
                            <FormField
                              control={form.control}
                              name="installments"
                              render={({ field }) => (
                                <FormItem className="space-y-3">
                                  <FormLabel className="text-base sm:text-sm font-semibold text-neutral-700">
                                    <div className="flex items-center gap-2"><BarChart3 className="h-4 w-4" /> Parcelas</div>
                                  </FormLabel>
                                  <Select 
                                    value={String(field.value || 1)} 
                                    onValueChange={(v) => field.onChange(Number(v))}
                                  >
                                    <FormControl>
                                      <SelectTrigger className="h-12 sm:h-10 border-neutral-200 rounded-lg focus:ring-2 focus:ring-red-500 focus:border-red-500 text-base sm:text-sm">
                                        <SelectValue />
                                      </SelectTrigger>
                                    </FormControl>
                                    <SelectContent>
                                      {Array.from({ length: 12 }, (_, i) => i + 1).map((n) => (
                                        <SelectItem key={n} value={String(n)}>
                                          {n}x
                                        </SelectItem>
                                      ))}
                                    </SelectContent>
                                  </Select>
                                  <FormMessage />
                                </FormItem>
                              )}
                            />
                          </div>
                        )}
                        
                        {/* Campo de Observações */}
                        <FormField
                          control={form.control}
                          name="notes"
                          render={({ field }) => (
                            <FormItem className="space-y-3">
                              <FormLabel className="text-sm font-semibold text-neutral-700">
                                <div className="flex items-center gap-2"><FileText className="h-4 w-4" /> Observações</div>
                              </FormLabel>
                              <FormControl>
                                <Textarea 
                                  placeholder="Observações adicionais sobre a saída..." 
                                  {...field}
                                  rows={3}
                                  className="min-h-[80px] border-2 border-neutral-200 rounded-xl focus:ring-2 focus:ring-red-500 focus:border-red-500 text-base sm:text-sm resize-none"
                                />
                              </FormControl>
                              <FormMessage />
                            </FormItem>
                          )}
                        />
                      
                      {/* Carrinho dentro do Dialog */}
                      <div className="px-6 pt-2 pb-4">
                        <RenderCart compact={true} />
                      </div>
                      </div>
                      
                      {/* Footer do Modal - Sempre mostra os 3 botões: Cancelar, Adicionar e Registrar */}
                      <div className="flex flex-col sm:flex-row justify-center items-stretch sm:items-center gap-2 px-3 sm:px-4 lg:px-6 py-3 border-t border-neutral-200 bg-white flex-shrink-0 min-h-[60px] overflow-visible w-full">
                          {/* Botão Cancelar - Sempre visível */}
                          <Button 
                            type="button" 
                            variant="outline" 
                            onClick={() => {
                              setIsAddDialogOpen(false);
                              setProductSearchTerm("");
                              setSelectedProductId("");
                              setSelectedBatches([]);
                              form.reset({
                                productId: "",
                                quantity: 0,
                                unitPrice: 0,
                                customer: "",
                                exitDate: new Date(),
                                notes: "",
                                paymentMethod: "avista",
                                installments: 1,
                              });
                            }}
                            className="!flex !w-full md:!w-auto border-2 border-neutral-300 text-neutral-700 hover:bg-neutral-50 h-9 text-xs md:text-sm !flex-shrink-0 whitespace-nowrap min-w-[90px] !items-center !justify-center"
                          >
                            <span className="flex items-center gap-2"><X className="h-4 w-4" /> Cancelar</span>
                          </Button>
                          
                          {/* Botão Adicionar - Sempre visível */}
                          <Button
                            type="button"
                            onClick={addCurrentSelectionToCart}
                            className="!flex !w-full md:!w-auto px-3 md:px-4 h-9 text-xs md:text-sm rounded-md bg-green-600 hover:bg-green-700 text-white !flex-shrink-0 whitespace-nowrap min-w-[100px] !items-center !justify-center"
                            disabled={(() => {
                              const selectedProduct = products.find(p => p.id === selectedProductId);
                              if (!selectedProduct) return true;
                              const managedByBatch = (selectedProduct as any)?.managedByBatch === true;
                              if (managedByBatch) {
                                const totalQty = selectedBatches.reduce((s, b) => s + (b.quantity || 0), 0);
                                return totalQty <= 0;
                              }
                              return (form.getValues('quantity') || 0) <= 0;
                            })()}
                          >
                            <span className="flex items-center gap-2"><Plus className="h-4 w-4" /> Adicionar</span>
                          </Button>
                          
                          {/* Botão Registrar - Sempre visível */}
                          <Button 
                            type="button"
                            onClick={() => {
                              if (cartItems.length > 0) {
                                processCartSale();
                              } else {
                                form.handleSubmit(handleAddExit)();
                              }
                            }}
                            className="!flex !w-full md:!w-auto px-3 md:px-4 bg-gradient-to-r from-red-600 to-red-700 hover:from-red-700 hover:to-red-800 text-white shadow-lg hover:shadow-xl transition-all duration-200 h-9 text-xs md:text-sm !flex-shrink-0 whitespace-nowrap min-w-[100px] !items-center !justify-center"
                            disabled={(() => {
                              if (cartItems.length > 0) return false;
                              const selectedProduct = products.find(p => p.id === selectedProductId);
                              if (!selectedProduct) return true;
                              const managedByBatch = (selectedProduct as any)?.managedByBatch === true;
                              if (managedByBatch) {
                                const totalQty = selectedBatches.reduce((s, b) => s + (b.quantity || 0), 0);
                                return totalQty <= 0;
                              }
                              return (form.getValues('quantity') || 0) <= 0;
                            })()}
                          >
                            <span className="flex items-center gap-2"><Upload className="h-4 w-4" /> Registrar</span>
                          </Button>
                        </div>
                    </form>
                  </Form>
                </DialogContent>
        </Dialog>
        
      </div>
            </div>
            
            {/* Cards de Estatísticas */}
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 sm:gap-6 lg:gap-8">
              {/* Card Total de Vendas */}
              <div className="group bg-gradient-to-br from-red-100 to-red-200 rounded-2xl sm:rounded-3xl p-4 sm:p-6 text-red-800 shadow-lg hover:shadow-xl transition-all duration-300 hover:scale-105 border border-red-200/50">
                <div className="flex items-center justify-between mb-3 sm:mb-4">
                  <div className="w-10 h-10 sm:w-12 sm:h-12 bg-red-300/50 rounded-xl sm:rounded-2xl flex items-center justify-center backdrop-blur-sm">
                    <TrendingDown className="w-5 h-5 sm:w-6 sm:h-6 text-red-700" />
                  </div>
                  <div className="text-right">
                    <div className="text-2xl sm:text-3xl font-black">{totalExits.toLocaleString()}</div>
                    <div className="text-xs sm:text-sm opacity-90">Total</div>
                  </div>
                </div>
                <h3 className="text-base sm:text-lg font-semibold mb-2">🛒 Total de Vendas</h3>
                <p className="text-xs sm:text-sm opacity-80">Vendas registradas</p>
              </div>

              {/* Card Valor Total */}
              <div className="group bg-gradient-to-br from-green-100 to-green-200 rounded-2xl sm:rounded-3xl p-4 sm:p-6 text-green-800 shadow-lg hover:shadow-xl transition-all duration-300 hover:scale-105 border border-green-200/50">
                <div className="flex items-center justify-between mb-3 sm:mb-4">
                  <div className="w-10 h-10 sm:w-12 sm:h-12 bg-green-300/50 rounded-xl sm:rounded-2xl flex items-center justify-center backdrop-blur-sm">
                    <DollarSign className="w-5 h-5 sm:w-6 sm:h-6 text-green-700" />
                  </div>
                  <div className="text-right">
                    <div className="text-2xl sm:text-3xl font-black">R$ {totalValue.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}</div>
                    <div className="text-xs sm:text-sm opacity-90">Valor</div>
                  </div>
                </div>
                <h3 className="text-base sm:text-lg font-semibold mb-2 flex items-center gap-2"><Coins className="h-4 w-4" /> Valor Total</h3>
                <p className="text-xs sm:text-sm opacity-80">Valor total das vendas</p>
              </div>

              {/* Card Saídas do Mês */}
              <div className="group bg-gradient-to-br from-blue-100 to-blue-200 rounded-2xl sm:rounded-3xl p-4 sm:p-6 text-blue-800 shadow-lg hover:shadow-xl transition-all duration-300 hover:scale-105 border border-blue-200/50">
                <div className="flex items-center justify-between mb-3 sm:mb-4">
                  <div className="w-10 h-10 sm:w-12 sm:h-12 bg-blue-300/50 rounded-xl sm:rounded-2xl flex items-center justify-center backdrop-blur-sm">
                    <Calendar className="w-5 h-5 sm:w-6 sm:h-6 text-blue-700" />
                  </div>
                  <div className="text-right">
                    <div className="text-2xl sm:text-3xl font-black">{thisMonthExits}</div>
                    <div className="text-xs sm:text-sm opacity-90">Mês</div>
                  </div>
                </div>
                <h3 className="text-base sm:text-lg font-semibold mb-2 flex items-center gap-2"><Calendar className="h-4 w-4" /> Este Mês</h3>
                <p className="text-xs sm:text-sm opacity-80">Vendas do mês atual</p>
              </div>

              {/* Card Produtos Vendidos */}
              <div className="group bg-gradient-to-br from-purple-100 to-purple-200 rounded-2xl sm:rounded-3xl p-4 sm:p-6 text-purple-800 shadow-lg hover:shadow-xl transition-all duration-300 hover:scale-105 border border-purple-200/50">
                <div className="flex items-center justify-between mb-3 sm:mb-4">
                  <div className="w-10 h-10 sm:w-12 sm:h-12 bg-purple-300/50 rounded-xl sm:rounded-2xl flex items-center justify-center backdrop-blur-sm">
                    <ShoppingCart className="w-5 h-5 sm:w-6 sm:h-6 text-purple-700" />
                  </div>
                  <div className="text-right">
                    <div className="text-2xl sm:text-3xl font-black">
                      {exits.reduce((sum, exit) => sum + exit.quantity, 0)}
                    </div>
                    <div className="text-xs sm:text-sm opacity-90">Unidades</div>
                  </div>
                </div>
                <h3 className="text-base sm:text-lg font-semibold mb-2">🛒 Produtos Vendidos</h3>
                <p className="text-xs sm:text-sm opacity-80">Unidades vendidas</p>
              </div>
            </div>
            
            {/* Barra de Busca com Design Profissional */}
            <Card className="bg-white border-0 shadow-xl rounded-2xl sm:rounded-3xl overflow-hidden">
              <CardContent className="p-4 sm:p-6 md:p-8">
                <div className="relative">
                  <Search className="absolute left-3 sm:left-4 top-1/2 transform -translate-y-1/2 text-neutral-400 w-4 h-4 sm:w-5 sm:h-5" />
                  <Input
                    placeholder="Buscar saídas por produto ou cliente..."
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    className="pl-10 sm:pl-12 h-11 sm:h-14 border-2 border-neutral-200 rounded-xl sm:rounded-2xl focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 bg-neutral-50"
                  />
                </div>
                
                {/* Informação de resultados */}
                <div className="mt-3 p-3 bg-blue-50 rounded-lg border border-blue-200">
                  <div className="flex items-center gap-2">
                    <div className="w-2 h-2 bg-blue-500 rounded-full"></div>
                    <span className="text-sm font-medium text-blue-800">
                      {filteredExits.length === 0 ? 'Nenhuma venda encontrada' : 
                       `${filteredExits.length} venda${filteredExits.length !== 1 ? 's' : ''} encontrada${filteredExits.length !== 1 ? 's' : ''}`
                      }
                    </span>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Tabela de Vendas */}
            <Card className="shadow-lg">
              <CardHeader className="bg-gradient-to-r from-indigo-50 to-purple-50">
                <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2">
                  <div>
                    <CardTitle className="flex items-center gap-2">
                      <FileText className="w-5 h-5 text-blue-600" />
                      Lista de Vendas
                    </CardTitle>
                    <CardDescription>Gerencie suas vendas cadastradas</CardDescription>
                  </div>
                </div>
              </CardHeader>
              <CardContent className="p-0">
                <div className="overflow-x-auto">
                  <div className="rounded-md border border-slate-200 overflow-hidden">
                    <Table>
                    <TableHeader>
                      <TableRow className="bg-slate-50 hover:bg-slate-100">
                        <TableHead className="font-semibold text-slate-700"><span className="flex items-center gap-1"><Package className="h-4 w-4" /> Produto</span></TableHead>
                        <TableHead className="font-semibold text-slate-700"><span className="flex items-center gap-1"><User className="h-4 w-4" /> Cliente</span></TableHead>
                        <TableHead className="font-semibold text-slate-700"><span className="flex items-center gap-1"><Hash className="h-4 w-4" /> Quantidade</span></TableHead>
                        <TableHead className="font-semibold text-slate-700"><span className="flex items-center gap-1"><Coins className="h-4 w-4" /> Preço Unit.</span></TableHead>
                        <TableHead className="font-semibold text-slate-700"><span className="flex items-center gap-1"><DollarSign className="h-4 w-4" /> Total</span></TableHead>
                        <TableHead className="font-semibold text-slate-700"><span className="flex items-center gap-1"><Calendar className="h-4 w-4" /> Data</span></TableHead>
                        <TableHead className="font-semibold text-slate-700"><span className="flex items-center gap-1"><Tag className="h-4 w-4" /> Status</span></TableHead>
                        <TableHead className="font-semibold text-slate-700"><span className="flex items-center gap-1"><FileText className="h-4 w-4" /> Receita</span></TableHead>
                        <TableHead className="text-right font-semibold text-slate-700"><span className="flex items-center gap-1 justify-end"><Settings className="h-4 w-4" /> Ações</span></TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {filteredExits.length === 0 ? (
                        <TableRow>
                          <TableCell colSpan={9} className="text-center py-12">
                            <div className="flex flex-col items-center gap-3">
                              <Package className="w-12 h-12 text-slate-300" />
                              <div className="text-slate-500">
                                <p className="font-medium">Nenhuma venda encontrada</p>
                                <p className="text-sm">Comece registrando sua primeira venda</p>
                              </div>
                            </div>
                          </TableCell>
                        </TableRow>
                      ) : (
                        filteredExits.map((exit) => (
                          <TableRow key={exit.id} className="hover:bg-slate-50 transition-colors">
                            <TableCell>
                              <div className="flex items-center gap-3">
                                <div className="w-8 h-8 bg-red-100 rounded-lg flex items-center justify-center">
                                  <Package className="w-4 h-4 text-red-600" />
                                </div>
                                <div>
                                  <div className="font-medium text-slate-900">{exit.productName}</div>
                                  <div className="text-sm text-slate-500">SKU: {exit.productSku}</div>
                                </div>
                              </div>
                            </TableCell>
                            <TableCell>
                              <div className="flex items-center gap-2">
                                <div className="w-6 h-6 bg-blue-100 rounded-full flex items-center justify-center">
                                  <User className="h-3 w-3 text-blue-600" />
                                </div>
                                <span className="font-medium text-slate-700">{exit.customer}</span>
                              </div>
                            </TableCell>
                            <TableCell>
                              <Badge variant="outline" className="bg-blue-50 text-blue-700 border-blue-200">
                                {exit.quantity} un
                              </Badge>
                            </TableCell>
                            <TableCell>
                              <span className="font-medium text-slate-700">
                                R$ {exit.unitPrice.toFixed(2).replace('.', ',')}
                              </span>
                            </TableCell>
                            <TableCell>
                              <span className="font-bold text-green-600">
                                R$ {exit.totalPrice.toFixed(2).replace('.', ',')}
                              </span>
                            </TableCell>
                            <TableCell>
                              <div className="flex items-center gap-2">
                                <Calendar className="w-4 h-4 text-slate-400" />
                                <span className="text-sm text-slate-600">
                                  {new Date(exit.exitDate).toLocaleDateString('pt-BR')}
                                </span>
                              </div>
                            </TableCell>
                            <TableCell>
                              <Badge variant={
                                exit.status === "confirmado" ? "default" : 
                                exit.status === "pendente" ? "secondary" : "destructive"
                              } className="capitalize">
                                {exit.status === "confirmado" ? <span className="flex items-center gap-1"><CheckCircle className="h-4 w-4 text-green-600" /> Confirmado</span> : 
                                 exit.status === "pendente" ? <span className="flex items-center gap-1"><Clock className="h-4 w-4 text-yellow-600" /> Pendente</span> : <span className="flex items-center gap-1"><X className="h-4 w-4 text-red-600" /> Cancelado</span>}
                              </Badge>
                            </TableCell>
                            <TableCell>
                              <Badge 
                                className="bg-blue-100 text-blue-800 hover:bg-blue-200 border-blue-300 cursor-pointer transition-all hover:scale-105"
                                onClick={() => openReceipt(exit)}
                              >
                                <Receipt className="w-3 h-3 mr-1" />
                                Receita
                              </Badge>
                            </TableCell>
                            <TableCell className="text-right">
                              <div className="flex items-center justify-end gap-2">
                                <Button 
                                  variant="ghost" 
                                  size="sm"
                                  onClick={() => handleDeleteExit(exit)}
                                  className="text-red-600 hover:text-red-700 hover:bg-red-50 transition-colors rounded-md h-8 w-8 sm:h-9 sm:w-9 p-0"
                                  title="Excluir saída"
                                >
                                  <Trash2 className="h-4 w-4 text-red-600" />
                                </Button>
                              </div>
                            </TableCell>
                          </TableRow>
                        ))
                      )}
                    </TableBody>
                  </Table>
                  </div>
                </div>
              </CardContent>
            </Card>

      {/* Modal de Confirmação de Exclusão */}
      <Dialog open={isDeleteDialogOpen} onOpenChange={setIsDeleteDialogOpen}>
        <DialogContent className="max-w-md sm:max-w-lg">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2 text-lg">
              <Trash2 className="h-5 w-5 text-red-600" />
              Confirmar Exclusão
            </DialogTitle>
            <DialogDescription>
              Esta ação não pode ser desfeita. A venda será removida e o estoque será ajustado.
            </DialogDescription>
          </DialogHeader>

          {exitToDelete && (
            <div className="py-4">
              <div className="bg-red-50 rounded-lg p-4 border border-red-200">
                <h4 className="font-semibold text-sm mb-2 text-red-900">Venda a ser excluída:</h4>
                <div className="space-y-1 text-sm">
                  <p><strong>Produto:</strong> {exitToDelete.productName}</p>
                  <p><strong>Quantidade:</strong> {exitToDelete.quantity} unidades</p>
                  <p><strong>Cliente:</strong> {exitToDelete.customer}</p>
                  <p><strong>Total:</strong> R$ {exitToDelete.totalPrice.toFixed(2)}</p>
                  <p className="text-xs text-red-700 mt-2">
                    <span className="flex items-center gap-2"><AlertTriangle className="h-4 w-4" /> O estoque será <strong>aumentado</strong> em {exitToDelete.quantity} unidades</span>
                  </p>
                </div>
              </div>
            </div>
          )}

          <DialogFooter className="gap-2">
            <Button
              type="button"
              variant="outline"
              onClick={() => {
                setIsDeleteDialogOpen(false);
                setExitToDelete(null);
              }}
            >
              Cancelar
            </Button>
            <Button
              type="button"
              variant="destructive"
              onClick={confirmDelete}
              disabled={isDeleting}
              className="inline-flex items-center justify-center gap-2 whitespace-nowrap rounded-md text-sm font-medium ring-offset-background transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-red-600 focus-visible:ring-offset-2 disabled:pointer-events-none disabled:opacity-50 [&_svg]:pointer-events-none [&_svg]:size-4 [&_svg]:shrink-0 bg-red-600 hover:bg-red-700 text-white h-10 px-4 py-2"
            >
              {isDeleting ? (
                <>
                  <div className="mr-2 h-4 w-4 animate-spin rounded-full border-2 border-white border-t-transparent"></div>
                  Excluindo...
                </>
              ) : (
                <>
                  <Trash2 className="h-4 w-4 mr-2" />
                  Excluir Venda
                </>
              )}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Modal de Edição de Saída */}
      <Dialog open={isEditDialogOpen} onOpenChange={setIsEditDialogOpen}>
        <DialogContent className="max-w-md sm:max-w-lg">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2 text-lg">
              <Edit className="h-5 w-5 text-blue-600" />
              Alterar Status da Venda
            </DialogTitle>
            <DialogDescription>
              Altere o status da venda. Se cancelar, as unidades retornarão aos lotes.
            </DialogDescription>
          </DialogHeader>

          {exitToEdit && (
            <div className="space-y-4">
              {/* Informações da Venda */}
              <div className="bg-blue-50 rounded-lg p-4 border border-blue-200">
                <h4 className="font-semibold text-sm mb-2 text-blue-900">Informações da Venda:</h4>
                <div className="space-y-1 text-sm">
                  <p><strong>Produto:</strong> {exitToEdit.productName}</p>
                  <p><strong>Quantidade:</strong> {exitToEdit.quantity} unidades</p>
                  <p><strong>Cliente:</strong> {exitToEdit.customer}</p>
                  <p><strong>Total:</strong> R$ {exitToEdit.totalPrice.toFixed(2)}</p>
                  <p className="text-xs text-blue-700 mt-2">
                    Status Atual: <Badge variant={exitToEdit.status === "confirmado" ? "default" : exitToEdit.status === "pendente" ? "secondary" : "destructive"}>
                      {exitToEdit.status === "confirmado" ? <span className="flex items-center gap-1"><CheckCircle className="h-4 w-4 text-green-600" /> Confirmado</span> : exitToEdit.status === "pendente" ? <span className="flex items-center gap-1"><Clock className="h-4 w-4 text-yellow-600" /> Pendente</span> : <span className="flex items-center gap-1"><X className="h-4 w-4 text-red-600" /> Cancelado</span>}
                    </Badge>
                  </p>
                </div>
              </div>

              {/* Seletor de Status */}
              <div>
                <Label htmlFor="newStatus" className="text-sm font-semibold">
                  <div className="flex items-center gap-2"><Tag className="h-4 w-4" /> Novo Status:</div>
                </Label>
                <Select
                  defaultValue={exitToEdit.status}
                  onValueChange={(value) => {
                    if (value !== exitToEdit.status) {
                      handleSaveStatus(value as "pendente" | "confirmado" | "cancelado");
                    }
                  }}
                >
                  <SelectTrigger id="newStatus" className="mt-2">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="pendente">
                      <span className="flex items-center gap-2"><Clock className="h-4 w-4" /> Pendente</span>
                    </SelectItem>
                    <SelectItem value="confirmado">
                      <span className="flex items-center gap-2"><CheckCircle className="h-4 w-4" /> Confirmado</span>
                    </SelectItem>
                    <SelectItem value="cancelado">
                      <span className="flex items-center gap-2"><X className="h-4 w-4" /> Cancelado</span>
                    </SelectItem>
                  </SelectContent>
                </Select>
              </div>

              {/* Avisos */}
              {exitToEdit.status !== "cancelado" && (
                <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-3">
                  <p className="text-xs text-yellow-800">
                    <strong className="flex items-center gap-2"><AlertTriangle className="h-4 w-4" /> Atenção:</strong> Ao cancelar, as {exitToEdit.quantity} unidades serão devolvidas aos lotes do produto.
                  </p>
                </div>
              )}

              {exitToEdit.status === "cancelado" && (
                <div className="bg-green-50 border border-green-200 rounded-lg p-3">
                  <p className="text-xs text-green-800">
                    <strong>ℹ️ Informação:</strong> Esta venda está cancelada. Ao confirmar, as unidades serão retiradas novamente dos lotes.
                  </p>
                </div>
              )}
            </div>
          )}

          <DialogFooter className="gap-2">
            <Button
              type="button"
              variant="outline"
              onClick={() => {
                setIsEditDialogOpen(false);
                setExitToEdit(null);
              }}
              disabled={isSaving}
            >
              Fechar
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Modal de Receita */}
      <Dialog open={showReceipt} onOpenChange={setShowReceipt}>
        <DialogContent className="max-w-md sm:max-w-lg max-h-[90vh] flex flex-col p-0 overflow-hidden !md:overflow-hidden">
          <div className="overflow-y-auto flex-1 px-6 pt-6 pb-6 min-h-0">
            <DialogHeader className="pb-4 border-b">
              <DialogTitle className="flex items-center gap-2 text-green-600">
                <CheckCircle className="h-6 w-6" />
                Receita de Venda
              </DialogTitle>
            </DialogHeader>
            
            {selectedExit && (
              <div className="space-y-4 pt-4">
              {/* Cabeçalho da Receita */}
              <div className="border-b pb-4">
                <div className="text-center mb-3">
                  <h2 className="text-2xl font-bold text-gray-900 flex items-center gap-2"><FileText className="h-6 w-6" /> RECEITA</h2>
                  <p className="text-sm text-gray-600">Flexi Gestor - Sistema de Gestão</p>
                </div>
                
                <div className="space-y-1 text-sm">
                  {selectedExit.receiptNumber && (
                    <div className="flex justify-between bg-indigo-50 p-2 rounded-lg border border-indigo-200">
                      <span className="text-indigo-700 font-semibold">Nº Receita:</span>
                      <span className="font-bold text-indigo-900">{selectedExit.receiptNumber}</span>
                    </div>
                  )}
                  <div className="flex justify-between">
                    <span className="text-gray-600">Data:</span>
                    <span className="font-semibold">
                      {new Date(selectedExit.exitDate).toLocaleDateString('pt-BR')}
                    </span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-600">Cliente:</span>
                    <span className="font-semibold">{selectedExit.customer}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-600">Status:</span>
                    <Badge variant={
                      selectedExit.status === "confirmado" ? "default" : 
                      selectedExit.status === "pendente" ? "secondary" : "destructive"
                    } className="capitalize">
                      {selectedExit.status === "confirmado" ? <span className="flex items-center gap-1"><CheckCircle className="h-4 w-4 text-green-600" /> Confirmado</span> : 
                       selectedExit.status === "pendente" ? <span className="flex items-center gap-1"><Clock className="h-4 w-4 text-yellow-600" /> Pendente</span> : <span className="flex items-center gap-1"><X className="h-4 w-4 text-red-600" /> Cancelado</span>}
                    </Badge>
                  </div>
                </div>
              </div>

              {/* Produto */}
              <div className="space-y-2">
                <h3 className="font-semibold text-gray-900">Produto:</h3>
                <div className="border rounded-lg p-3">
                  <div className="flex justify-between items-start pb-2">
                    <div className="flex-1">
                      <p className="font-medium text-sm">{selectedExit.productName}</p>
                      <p className="text-xs text-gray-500">SKU: {selectedExit.productSku}</p>
                      <p className="text-xs text-gray-500">
                        {selectedExit.quantity} x R$ {selectedExit.unitPrice.toFixed(2)}
                      </p>
                    </div>
                    <p className="font-semibold text-sm">
                      R$ {selectedExit.totalPrice.toFixed(2)}
                    </p>
                  </div>
                </div>
              </div>

              {/* Observações */}
              {selectedExit.notes && (
                <div className="space-y-2">
                  <h3 className="font-semibold text-gray-900">Observações:</h3>
                  <div className="border rounded-lg p-3 bg-gray-50">
                    <p className="text-sm text-gray-700">{selectedExit.notes}</p>
                  </div>
                </div>
              )}

              {/* Total */}
              <div className="border-t pt-4">
                <div className="flex justify-between items-center">
                  <span className="text-lg font-bold text-gray-900">TOTAL:</span>
                  <span className="text-2xl font-bold text-green-600">
                    R$ {selectedExit.totalPrice.toFixed(2)}
                  </span>
                </div>
              </div>

              {/* Botões de Ação */}
              <div className="space-y-2 pt-2">
                <Button 
                  className="w-full bg-green-600 hover:bg-green-700 text-white"
                  onClick={() => handleDownloadReceipt(selectedExit)}
                >
                  <Share2 className="mr-2 h-4 w-4" />
                  Compartilhar/Baixar PDF
                </Button>

                <Button 
                  className="w-full bg-blue-600 hover:bg-blue-700 text-white"
                  onClick={() => handlePrintReceipt(selectedExit)}
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
          </div>
        </DialogContent>
      </Dialog>
                    </main>
        );
};

export default Saidas;
