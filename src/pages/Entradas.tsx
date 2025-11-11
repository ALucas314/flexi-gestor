import React, { useState, useEffect, useMemo, useRef } from "react";
// Usando Lucide React
import { 
  Plus,
  TrendingUp,
  Package,
  Search,
  Edit,
  Trash2,
  Calendar,
  DollarSign,
  Filter,
  Download,
  Eye,
  X,
  Tag,
  Building2,
  Hash,
  Coins,
  FileText,
  Smartphone,
  CreditCard,
  BarChart3,
  Factory,
  Clock,
  CheckCircle,
  AlertTriangle,
  Upload,
  Sparkles,
  Info,
  Settings,
  Target,
  ShoppingCart
} from "lucide-react";
import { BatchManager } from "@/components/BatchManager";

import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { useForm } from "react-hook-form";
import { useToast } from "@/hooks/use-toast";
import { useData } from "@/contexts/DataContext";
import { getBatchesByProduct, createBatch, updateBatchQuantity, checkBatchNumberExists, generateNextAvailableBatchNumber, findBatchByNumberAndProduct, findBatchByNumber } from "@/lib/batches";
import { useAuth } from "@/contexts/AuthContext";
import { useWorkspace } from "@/contexts/WorkspaceContext";
import { supabase } from "@/lib/supabase";
import { Label } from "@/components/ui/label";
import { generateReceiptNumber } from "@/lib/utils";
import { StockEntryCart } from "@/components/entradas/StockEntryCart";

// Converte diferença em dias para string humanizada (anos, meses, semanas, dias)
function humanizeDaysDiff(diffDays: number): string {
  const abs = Math.abs(diffDays);
  const years = Math.floor(abs / 365);
  let rem = abs % 365;
  const months = Math.floor(rem / 30);
  rem = rem % 30;
  const weeks = Math.floor(rem / 7);
  const days = rem % 7;

  const parts: string[] = [];
  if (years) {
    parts.push(years === 1 ? `${years} ano` : `${years} anos`);
  }
  if (months) {
    parts.push(months === 1 ? `${months} mês` : `${months} meses`);
  }
  if (!years && !months && weeks) {
    parts.push(weeks === 1 ? `${weeks} semana` : `${weeks} semanas`); // só mostra semanas se < 1 mês
  }
  if (!years && days && (months === 0 || weeks === 0)) {
    parts.push(days === 1 ? `${days} dia` : `${days} dias`);
  }

  if (parts.length === 0) return '0 dias';
  return parts.slice(0, 2).join(' '); // no máx. 2 unidades
}

// Interface da entrada de estoque
interface StockEntry {
  id: string;
  productId: string;
  productName: string;
  productSku: string;
  quantity: number;
  unitCost: number;
  totalCost: number;
  supplier: string;
  entryDate: Date;
  notes: string;
  status: "pendente" | "aprovado" | "cancelado";
  receiptNumber?: string; // Número único da nota fiscal
  markup?: number; // Percentual de markup para calcular preço de venda
  manufactureDate?: Date; // Data de fabricação
  expiryDate?: Date; // Data de validade
}

type StockEntryFormData = Omit<StockEntry, 'id' | 'productName' | 'productSku' | 'totalCost' | 'receiptNumber'> & {
  manufactureDate?: Date;
  expiryDate?: Date;
  paymentMethod?: string; // Forma de pagamento (avista, pix, debito, credito, etc)
  installments?: number; // Número de parcelas (quando parcelado)
};

const Entradas = () => {
  // Estados
  const [searchTerm, setSearchTerm] = useState("");
  const [isAddDialogOpen, setIsAddDialogOpen] = useState(false);
  const [isEditDialogOpen, setIsEditDialogOpen] = useState(false);
  const [editingEntry, setEditingEntry] = useState<StockEntry | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [availableBatches, setAvailableBatches] = useState<any[]>([]);
  const [selectedBatches, setSelectedBatches] = useState<Array<{batchNumber: string, quantity: number, unitCost?: number, manufactureDate?: Date, expiryDate?: Date}>>([]);
  const [selectedProductId, setSelectedProductId] = useState<string>("");
  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false);
  const [entryToDelete, setEntryToDelete] = useState<StockEntry | null>(null);
  const [isDeleting, setIsDeleting] = useState(false);
  const [nextBatchNumberSuggestion, setNextBatchNumberSuggestion] = useState<string>("1");
  const [productSearchOpen, setProductSearchOpen] = useState(false);
  const [productSearchTerm, setProductSearchTerm] = useState("");
  const [productSearchFocused, setProductSearchFocused] = useState(false);
  const [productSearchUserClicked, setProductSearchUserClicked] = useState(false);
  const [supplierSearchTerm, setSupplierSearchTerm] = useState("");
  const [supplierSearchFocused, setSupplierSearchFocused] = useState(false);
  const [supplierSearchUserClicked, setSupplierSearchUserClicked] = useState(false);
  const [supplierResults, setSupplierResults] = useState<Array<{ id?: string; nome: string; codigo: string }>>([]);
  // Estado para armazenar valores parciais de datas enquanto digita
  const [dateTextValues, setDateTextValues] = useState<{[key: string]: string}>({});
  const [isBatchDialogOpen, setIsBatchDialogOpen] = useState(false);
  const [batchNumberErrors, setBatchNumberErrors] = useState<{[key: number]: string}>({});
  const [quantityErrors, setQuantityErrors] = useState<{[key: number]: string}>({});
  const [batchStatusMessages, setBatchStatusMessages] = useState<{[key: number]: {found: boolean, message: string} | null}>({});
  const [selectedProductForBatch, setSelectedProductForBatch] = useState<{id: string, name: string, sku: string, stock: number} | null>(null);
  const [supplierSuggestion, setSupplierSuggestion] = useState<{ id: string; code?: string; name: string } | null>(null);
  // Estado para armazenar todos os fornecedores cadastrados
  const [allSuppliers, setAllSuppliers] = useState<Array<{ id: string; codigo: string; nome: string }>>([]);
  const [isLoadingSuppliers, setIsLoadingSuppliers] = useState(false);
  const [showSupplierDropdown, setShowSupplierDropdown] = useState(false);
  const supplierInputRef = useRef<HTMLDivElement>(null);
  
  // Estados do carrinho
  interface CartBatchItem { batchNumber?: string; quantity: number; unitCost?: number; manufactureDate?: Date; expiryDate?: Date }
  interface CartItem { 
    productId: string; 
    productName: string; 
    productSku: string; 
    managedByBatch: boolean; 
    quantity: number; 
    unitCost: number; // Preço final com markup (para exibição)
    originalUnitCost?: number; // Custo original sem markup (para processamento)
    batches?: CartBatchItem[];
    manufactureDate?: Date; // Data de fabricação (para produtos não gerenciados por lote)
    expiryDate?: Date; // Data de validade (para produtos não gerenciados por lote)
  }
  const [cartItems, setCartItems] = useState<CartItem[]>([]);

  // Hooks
  const { toast } = useToast();
  const { products, movements, addMovement, deleteMovement, addNotification, updateProduct, refreshProducts } = useData();
  const { user } = useAuth();
  const { workspaceAtivo } = useWorkspace();

  // Filtrar apenas as compras (type 'entrada') dos movements
  const entries: StockEntry[] = movements
    .filter(m => m.type === 'entrada')
    .map(m => {
      // Mapear status do Movement para StockEntry
      // Movement objetivo: 'pendente' | 'confirmado' | 'cancelado'
      // StockEntry objetivo: 'pendente' | 'aprovado' | 'cancelado'
      let entryStatus: "pendente" | "aprovado" | "cancelado" = 'aprovado';
      if (m.status === 'pendente') {
        entryStatus = 'pendente';
      } else if (m.status === 'cancelado') {
        entryStatus = 'cancelado';
      } else if (m.status === 'confirmado') {
        entryStatus = 'aprovado';
      }
      // Extrair datas de FAB/EXP da descrição, se presentes (formatos FAB/EXP: YYYY-MM-DD ou DD/MM/YYYY)
      let parsedExpiry: Date | undefined = undefined;
      let parsedManufacture: Date | undefined = undefined;
      try {
        const desc = m.description || '';
        const expIso = desc.match(/EXP:(\d{4}-\d{2}-\d{2})/);
        const expBr = desc.match(/EXP:(\d{2}\/\d{2}\/\d{4})/);
        if (expIso && expIso[1]) parsedExpiry = new Date(expIso[1]);
        else if (expBr && expBr[1]) {
          const [d, mo, y] = expBr[1].split('/');
          parsedExpiry = new Date(parseInt(y), parseInt(mo) - 1, parseInt(d));
        }

        const fabIso = desc.match(/FAB:(\d{4}-\d{2}-\d{2})/);
        const fabBr = desc.match(/FAB:(\d{2}\/\d{2}\/\d{4})/);
        if (fabIso && fabIso[1]) parsedManufacture = new Date(fabIso[1]);
        else if (fabBr && fabBr[1]) {
          const [d, mo, y] = fabBr[1].split('/');
          parsedManufacture = new Date(parseInt(y), parseInt(mo) - 1, parseInt(d));
        }
      } catch (_) { /* silencioso */ }

      return {
        id: m.id,
        productId: m.productId,
        productName: m.productName || m.product?.name || 'Desconhecido',
        productSku: m.product?.sku || '',
        quantity: m.quantity,
        unitCost: m.unitPrice,
        totalCost: m.total,
        supplier: m.description.includes(' - ') ? m.description.split(' - ')[1] : 'Fornecedor',
        entryDate: m.date,
        notes: m.description,
        status: entryStatus,
        receiptNumber: m.receiptNumber,
        ...(parsedExpiry ? { expiryDate: parsedExpiry } as any : {}),
        ...(parsedManufacture ? { manufactureDate: parsedManufacture } as any : {})
      };
    });

  // Formulário
  const form = useForm<StockEntryFormData>({
    defaultValues: {
      productId: "",
      quantity: 0,
      unitCost: 0,
      supplier: "",
      entryDate: new Date(),
      notes: "",
      status: "pendente",
      markup: 0, // Markup padrão em percentual
      manufactureDate: undefined,
      expiryDate: undefined,
      paymentMethod: "avista", // Forma de pagamento padrão
      installments: 1, // Número de parcelas padrão
    },
  });

  // Funções do carrinho
  const addCurrentSelectionToCart = () => {
    const selectedProduct = products.find(p => p.id === selectedProductId);
    if (!selectedProduct) {
      toast({ title: 'Selecione um produto', variant: 'destructive' });
      return;
    }
    const managedByBatch = (selectedProduct as any)?.managedByBatch === true;
    const unitCost = form.getValues('unitCost') || 0;

    if (managedByBatch) {
      const totalQty = selectedBatches.reduce((s, b) => s + (b.quantity || 0), 0);
      if (totalQty <= 0) {
        toast({ title: 'Selecione lotes com quantidade', variant: 'destructive' });
        return;
      }
      const batches: CartBatchItem[] = selectedBatches
        .filter(b => (b.quantity || 0) > 0 && b.batchNumber)
        .map(b => ({ 
          batchNumber: b.batchNumber, 
          quantity: b.quantity, 
          unitCost: b.unitCost || unitCost,
          manufactureDate: b.manufactureDate,
          expiryDate: b.expiryDate
        }));
      if (batches.length === 0) {
        toast({ title: 'Selecione lotes válidos', variant: 'destructive' });
        return;
      }
      
      // Calcular custo médio ponderado dos lotes
      // Se algum lote tem unitCost específico, usar; senão usar o unitCost do formulário
      let calculatedUnitCost = unitCost || 0;
      const batchesWithCost = batches.filter(b => (b.unitCost || 0) > 0);
      if (batchesWithCost.length > 0) {
        // Calcular média ponderada: soma(custo * quantidade) / soma(quantidades)
        const totalCost = batchesWithCost.reduce((sum, b) => sum + ((b.unitCost || 0) * (b.quantity || 0)), 0);
        const totalQuantity = batchesWithCost.reduce((sum, b) => sum + (b.quantity || 0), 0);
        if (totalQuantity > 0) {
          calculatedUnitCost = totalCost / totalQuantity;
        }
      }
      
      // Se nenhum lote tem custo e o unitCost do formulário também é 0, usar o custo do primeiro lote que tiver
      if (calculatedUnitCost === 0 && batches.length > 0) {
        const firstBatchWithCost = batches.find(b => (b.unitCost || 0) > 0);
        if (firstBatchWithCost && firstBatchWithCost.unitCost) {
          calculatedUnitCost = firstBatchWithCost.unitCost;
        }
      }
      
      // Aplicar markup ao custo unitário se houver markup definido
      const markup = form.getValues('markup') || 0;
      const finalUnitCost = markup > 0 && calculatedUnitCost > 0 
        ? calculatedUnitCost * (1 + markup / 100)
        : calculatedUnitCost;
      
      setCartItems(prev => [...prev, {
        productId: selectedProduct.id,
        productName: selectedProduct.name,
        productSku: selectedProduct.sku,
        managedByBatch: true,
        quantity: totalQty,
        unitCost: finalUnitCost, // Preço final com markup (para exibição)
        originalUnitCost: calculatedUnitCost, // Custo original sem markup (para processamento)
        batches
      }]);
    } else {
      const qty = form.getValues('quantity') || 0;
      if (qty <= 0) {
        toast({ title: 'Informe a quantidade', variant: 'destructive' });
        return;
      }
      if (unitCost <= 0) {
        toast({ title: 'Informe o custo unitário', variant: 'destructive' });
        return;
      }
      
      // Aplicar markup ao custo unitário se houver markup definido
      const markup = form.getValues('markup') || 0;
      const finalUnitCost = markup > 0 && unitCost > 0 
        ? unitCost * (1 + markup / 100)
        : unitCost;
      
      // Capturar datas de fabricação e validade do formulário
      const manufactureDate = form.getValues('manufactureDate') as Date | undefined;
      const expiryDate = form.getValues('expiryDate') as Date | undefined;
      
      setCartItems(prev => [...prev, {
        productId: selectedProduct.id,
        productName: selectedProduct.name,
        productSku: selectedProduct.sku,
        managedByBatch: false,
        quantity: qty,
        unitCost: finalUnitCost, // Preço final com markup (para exibição)
        originalUnitCost: unitCost, // Custo original sem markup (para processamento)
        manufactureDate: manufactureDate, // Data de fabricação
        expiryDate: expiryDate // Data de validade
      }]);
    }
    
    // Limpar seleção após adicionar ao carrinho
    setSelectedProductId("");
    setSelectedBatches([]);
    form.reset({
      productId: "",
      quantity: 0,
      unitCost: 0,
      supplier: form.getValues('supplier'),
      entryDate: form.getValues('entryDate'),
      notes: form.getValues('notes'),
      paymentMethod: form.getValues('paymentMethod'),
      installments: form.getValues('installments'),
    });
  };

  const removeCartItem = (index: number) => {
    setCartItems(prev => prev.filter((_, i) => i !== index));
  };

  const updateCartItemQuantity = (index: number, newQuantity: number) => {
    if (newQuantity <= 0) {
      removeCartItem(index);
      return;
    }
    setCartItems(prev => prev.map((item, i) => 
      i === index ? { ...item, quantity: newQuantity } : item
    ));
  };

  const clearCart = () => {
    setCartItems([]);
  };

  const getCartTotal = () => {
    return cartItems.reduce((sum, item) => sum + (item.quantity * item.unitCost), 0);
  };

  const processCartEntry = async () => {
    // Se o carrinho estiver vazio, verificar se há uma seleção válida no formulário
    let itemsToProcess = [...cartItems];
    
    if (itemsToProcess.length === 0) {
      // Verificar se há uma seleção válida no formulário
      const selectedProduct = products.find(p => p.id === selectedProductId);
      if (!selectedProduct) {
        toast({ title: 'Selecione um produto ou adicione ao carrinho', variant: 'destructive' });
        return;
      }
      
      const managedByBatch = (selectedProduct as any)?.managedByBatch === true;
      const unitCost = form.getValues('unitCost') || 0;
      
      if (managedByBatch) {
        const totalQty = selectedBatches.reduce((s, b) => s + (b.quantity || 0), 0);
        if (totalQty <= 0) {
          toast({ title: 'Selecione lotes com quantidade', variant: 'destructive' });
          return;
        }
        const batches: CartBatchItem[] = selectedBatches
          .filter(b => (b.quantity || 0) > 0 && b.batchNumber)
          .map(b => ({ 
            batchNumber: b.batchNumber, 
            quantity: b.quantity, 
            unitCost: b.unitCost || unitCost,
            manufactureDate: b.manufactureDate,
            expiryDate: b.expiryDate
          }));
        if (batches.length === 0) {
          toast({ title: 'Selecione lotes válidos', variant: 'destructive' });
          return;
        }
        
        // Calcular custo médio ponderado dos lotes (sem markup)
        let calculatedAverageCost = unitCost || 0;
        const batchesWithCost = batches.filter(b => (b.unitCost || 0) > 0);
        if (batchesWithCost.length > 0) {
          const totalCost = batchesWithCost.reduce((sum, b) => sum + ((b.unitCost || 0) * (b.quantity || 0)), 0);
          const totalQuantity = batchesWithCost.reduce((sum, b) => sum + (b.quantity || 0), 0);
          if (totalQuantity > 0) {
            calculatedAverageCost = totalCost / totalQuantity;
          }
        }
        
        // Se nenhum lote tem custo, usar o unitCost do formulário
        if (calculatedAverageCost === 0 && batches.length > 0) {
          const firstBatchWithCost = batches.find(b => (b.unitCost || 0) > 0);
          if (firstBatchWithCost && firstBatchWithCost.unitCost) {
            calculatedAverageCost = firstBatchWithCost.unitCost;
          }
        }
        
        itemsToProcess = [{
          productId: selectedProduct.id,
          productName: selectedProduct.name,
          productSku: selectedProduct.sku,
          managedByBatch: true,
          quantity: totalQty,
          unitCost: calculatedAverageCost, // Preço final com markup (para exibição)
          originalUnitCost: calculatedAverageCost, // Custo original sem markup (para processamento)
          batches
        }];
      } else {
        const qty = form.getValues('quantity') || 0;
        if (qty <= 0) {
          toast({ title: 'Informe a quantidade', variant: 'destructive' });
          return;
        }
        if (unitCost <= 0) {
          toast({ title: 'Informe o custo unitário', variant: 'destructive' });
          return;
        }
        itemsToProcess = [{
          productId: selectedProduct.id,
          productName: selectedProduct.name,
          productSku: selectedProduct.sku,
          managedByBatch: false,
          quantity: qty,
          unitCost: unitCost, // Preço final com markup (para exibição)
          originalUnitCost: unitCost // Custo original sem markup (para processamento)
        }];
      }
    }
    
    if (itemsToProcess.length === 0) {
      toast({ title: 'Carrinho vazio', variant: 'destructive' });
      return;
    }
    
    try {
      const formData = form.getValues();
      const supplier = formData.supplier || 'Fornecedor Genérico';
      const entryDate = formData.entryDate || new Date();
      const paymentMethod = formData.paymentMethod || 'avista';
      const installments = formData.installments || 1;
      const notes = formData.notes || '';

      // Calcular valor total da compra para criar conta a pagar se for parcelado
      let totalCompra = 0;

      for (const item of itemsToProcess) {
        const product = products.find(p => p.id === item.productId);
        if (!product) continue;

        if (item.managedByBatch && item.batches && item.batches.length > 0) {
          // Processar com lotes
          // Usar originalUnitCost (sem markup) para processamento
          const baseUnitCost = item.originalUnitCost ?? item.unitCost;
          const totalCost = item.batches.reduce((sum, b) => sum + ((b.quantity || 0) * (b.unitCost || baseUnitCost)), 0);
          const totalQuantity = item.batches.reduce((sum, b) => sum + (b.quantity || 0), 0);
          const averageCost = totalQuantity > 0 ? totalCost / totalQuantity : baseUnitCost;

          // Criar ou atualizar lotes
          for (const batch of item.batches) {
            if (!batch.batchNumber || !user?.id) continue;
            
            const existing = await findBatchByNumber(batch.batchNumber, user.id);
            if (existing && existing.productId === item.productId) {
              await updateBatchQuantity(
                existing.id,
                existing.quantity + (batch.quantity || 0),
                user.id
              );
            } else {
              // Usar originalUnitCost (sem markup) para criar o lote
              const baseUnitCost = item.originalUnitCost ?? item.unitCost;
              await createBatch(
                item.productId,
                batch.batchNumber,
                batch.quantity || 0,
                batch.unitCost || baseUnitCost,
                user.id,
                batch.manufactureDate,
                batch.expiryDate
              );
            }
          }

          const minManu = item.batches
            .map(b => b.manufactureDate)
            .filter((d): d is Date => d !== undefined)
            .sort((a, b) => a.getTime() - b.getTime())[0];
          const minExpiry = item.batches
            .map(b => b.expiryDate)
            .filter((d): d is Date => d !== undefined)
            .sort((a, b) => a.getTime() - b.getTime())[0];

          // 👉 Incluímos o nome do produto na descrição para facilitar a identificação da movimentação
          const movement = await addMovement({
            type: 'entrada',
            productId: item.productId,
            productName: item.productName,
            quantity: totalQuantity,
            unitPrice: averageCost,
            description: `Entrada de ${totalQuantity} unidades de ${item.productName} em ${item.batches.length} lote(s) - ${supplier}` 
              + (minManu ? ` | FAB:${minManu.toISOString().split('T')[0]}` : '')
              + (minExpiry ? ` | EXP:${minExpiry.toISOString().split('T')[0]}` : ''),
            date: entryDate,
            paymentMethod: paymentMethod === "parcelado" ? `parcelado-${installments}x` : paymentMethod,
          });
          
          // Calcular total da compra (sem considerar markup)
          const markup = formData.markup || 0;
          totalCompra += averageCost * totalQuantity;
          
          // Atualizar preço de venda do produto se houver markup
          if (markup > 0 && averageCost > 0) {
            const salePrice = averageCost * (1 + markup / 100);
            await updateProduct(item.productId, { price: salePrice });
          }
        } else {
          // Processar sem lotes
          // Usar originalUnitCost (sem markup) para processamento
          const baseUnitCost = item.originalUnitCost ?? item.unitCost;
          
          // Incluir datas de fabricação e validade na descrição se informadas
          // Priorizar datas do item do carrinho, se não houver, usar do formulário
          const manufactureDate = item.manufactureDate || formData.manufactureDate;
          const expiryDate = item.expiryDate || formData.expiryDate;
          
          // 👉 Descrição agora inclui nome do produto quando não há lotes vinculados
          let description = `Entrada de ${item.quantity} unidades de ${item.productName} - ${supplier}`;
          if (manufactureDate) {
            const fabDate = manufactureDate instanceof Date ? manufactureDate.toISOString().split('T')[0] : manufactureDate;
            description += ` | FAB:${fabDate}`;
          }
          if (expiryDate) {
            const expDate = expiryDate instanceof Date ? expiryDate.toISOString().split('T')[0] : expiryDate;
            description += ` | EXP:${expDate}`;
          }
          
          const movement = await addMovement({
            type: 'entrada',
            productId: item.productId,
            productName: item.productName,
            quantity: item.quantity,
            unitPrice: baseUnitCost,
            description: description,
            date: entryDate,
            paymentMethod: paymentMethod === "parcelado" ? `parcelado-${installments}x` : paymentMethod,
          });
          
          // Calcular total da compra (sem considerar markup)
          const markup = formData.markup || 0;
          totalCompra += baseUnitCost * item.quantity;
          
          // Atualizar preço de venda do produto se houver markup
          if (markup > 0 && baseUnitCost > 0) {
            const salePrice = baseUnitCost * (1 + markup / 100);
            await updateProduct(item.productId, { price: salePrice });
          }
        }
      }

      // Criar conta a pagar se o pagamento for parcelado (mesmo com 1 parcela, se marcado como parcelado)
      if (paymentMethod === "parcelado" && totalCompra > 0 && installments >= 1 && workspaceAtivo?.id && user?.id) {
        try {
          const valorParcela = totalCompra / installments;
          
          // Data de vencimento da primeira parcela (30 dias a partir da data da entrada)
          const primeiraVencimento = new Date(entryDate);
          primeiraVencimento.setDate(primeiraVencimento.getDate() + 30);

          // Criar conta a pagar
          console.log('💾 Criando conta a pagar (processCartEntry):', {
            workspaceId: workspaceAtivo.id,
            userId: user.id,
            fornecedor: supplier,
            valorTotal: totalCompra,
            parcelas: installments
          });
          
          const { data: contaPagar, error: errorConta } = await supabase
            .from('contas_a_pagar')
            .insert({
              lancamento: entryDate.toISOString().split('T')[0],
              observacoes: `Compra parcelada: ${itemsToProcess.map(i => i.productName).join(', ')}${notes ? ` - ${notes}` : ''}`,
              forma_pagamento: 'parcelado',
              conta_origem: paymentMethod === "parcelado" ? 'banco' : 'caixa', // Parcelado vai para banco, à vista permanece no caixa
              centro_custo: '', // Pode ser preenchido depois
              fornecedor: supplier,
              valor_total: totalCompra,
              valor_pago: 0,
              valor_restante: totalCompra,
              parcelas: installments,
              parcelas_pagas: 0,
              data_vencimento: primeiraVencimento.toISOString().split('T')[0],
              status_pagamento: 'pendente',
              workspace_id: workspaceAtivo.id,
              usuario_id: user.id,
            })
            .select()
            .single();

          console.log('📊 Resultado da criação de conta a pagar (processCartEntry):', {
            sucesso: !!contaPagar,
            erro: errorConta?.message || null,
            contaId: contaPagar?.id || null,
            workspaceIdSalvo: contaPagar?.workspace_id || null
          });

          if (errorConta && errorConta.code === '42P01') {
            // Tabela não existe, tentar tabela antiga
            const { error: errorOld } = await supabase
              .from('contas_pagar')
              .insert({
                descricao: `Compra parcelada: ${itemsToProcess.map(i => i.productName).join(', ')}${notes ? ` - ${notes}` : ''}`,
                fornecedor: supplier,
                valor: totalCompra,
                valor_pago: 0,
                valor_restante: totalCompra,
                data_compra: entryDate.toISOString().split('T')[0],
                data_registro: entryDate.toISOString().split('T')[0],
                data_vencimento: primeiraVencimento.toISOString().split('T')[0],
                forma_pagamento: 'parcelado',
                numero_parcelas: installments,
                status: 'pendente',
                origem_pagamento: 'caixa',
                workspace_id: workspaceAtivo.id,
                usuario_id: user.id,
              });
            
            if (errorOld) {
              console.error('Erro ao criar conta a pagar:', errorOld);
            }
          } else if (errorConta) {
            console.error('Erro ao criar conta a pagar:', errorConta);
          } else if (contaPagar && installments > 1) {
            // Criar parcelas individuais
            const parcelasData = [];
            for (let i = 1; i <= installments; i++) {
              const vencimentoParcela = new Date(primeiraVencimento);
              vencimentoParcela.setMonth(vencimentoParcela.getMonth() + (i - 1));
              
              parcelasData.push({
                conta_pagar_id: contaPagar.id,
                numero: i,
                valor: valorParcela,
                data_vencimento: vencimentoParcela.toISOString().split('T')[0],
                status: 'pendente',
                observacoes: `Parcela ${i} de ${installments}`,
              });
            }

            if (parcelasData.length > 0) {
              const { error: errorParcelas } = await supabase
                .from('parcelas')
                .insert(parcelasData);

              if (errorParcelas) {
                if (
                  errorParcelas.code === '42P01' ||
                  errorParcelas.code === 'PGRST205' ||
                  errorParcelas.code === 'PGRST116' ||
                  errorParcelas?.message?.toLowerCase?.().includes('schema cache')
                ) {
                  console.warn('Tabela parcelas indisponível. Parcelas serão controladas apenas localmente.', errorParcelas);
                } else {
                  console.error('Erro ao criar parcelas:', errorParcelas);
                }
              }
            }
          }
          
          // Disparar evento para recarregar contas a pagar
          if (contaPagar) {
            console.log('📢 Disparando evento contas-pagar-changed');
            window.dispatchEvent(new CustomEvent('contas-pagar-changed'));
          }
        } catch (error: any) {
          console.error('Erro ao criar conta a pagar automaticamente:', error);
          // Não bloquear o processo se houver erro ao criar conta a pagar
        }
      }

      // Salvar tamanho antes de limpar
      const itemsCount = itemsToProcess.length;
      
      // Limpar carrinho, seleção e fechar modal
      setCartItems([]);
      setSelectedProductId("");
      setSelectedBatches([]);
      setIsAddDialogOpen(false);
      form.reset();
      
      toast({
        title: "Compra Registrada!",
        description: `${itemsCount} item(ns) foram registrados com sucesso.`,
        variant: "default",
      });
    } catch (error: any) {
      toast({
        title: "Erro ao Registrar Compra",
        description: error.message || "Não foi possível registrar a compra. Tente novamente.",
        variant: "destructive",
      });
    }
  };

  const RenderCart = ({ compact = false }: { compact?: boolean }) => (
    <StockEntryCart
      items={cartItems}
      total={getCartTotal()}
      onRemove={removeCartItem}
      onQuantityChange={updateCartItemQuantity}
      onClear={clearCart}
      onFinalize={processCartEntry}
      compact={compact}
    />
  );

  // Carregar lotes quando selecionar um produto
  const loadBatchesForProduct = async (productId: string) => {
    if (!user?.id) return;
    
    try {
      setSelectedProductId(productId);
      
      // Verificar se o produto usa gerenciamento por lote
      const product = products.find(p => p.id === productId);
      const managedByBatch = (product as any)?.managedByBatch === true;
      
      if (!managedByBatch) {
        // Se não usa lotes, limpar tudo
        setSelectedBatches([]);
        setAvailableBatches([]);
        return;
      }
      
      setSelectedBatches([]); // Resetar lotes selecionados
      
      const batches = await getBatchesByProduct(productId, user.id);
      setAvailableBatches(batches || []);
    } catch (error) {
      setAvailableBatches([]);
    }
  };

  // Carregar todos os fornecedores do workspace
  const loadAllSuppliers = async () => {
    if (!workspaceAtivo?.id) {
      setAllSuppliers([]);
      return;
    }

    try {
      setIsLoadingSuppliers(true);
      const { data, error } = await supabase
        .from('fornecedores')
        .select('id, codigo, nome')
        .eq('usuario_id', workspaceAtivo.id)
        .order('nome', { ascending: true });

      if (error) {
        console.error('Erro ao carregar fornecedores:', error);
        setAllSuppliers([]);
        return;
      }

      const mapped = (data || []).map((s: any) => ({
        id: s.id,
        codigo: String(s.codigo || ''),
        nome: s.nome || s.name || ''
      }));

      setAllSuppliers(mapped);
    } catch (error: any) {
      console.error('Erro ao carregar fornecedores:', error);
      setAllSuppliers([]);
    } finally {
      setIsLoadingSuppliers(false);
    }
  };

  // Carregar fornecedores quando o workspace mudar
  useEffect(() => {
    loadAllSuppliers();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [workspaceAtivo?.id]);

  // Fechar dropdown quando clicar fora
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (supplierInputRef.current && !supplierInputRef.current.contains(event.target as Node)) {
        setShowSupplierDropdown(false);
      }
    };

    if (showSupplierDropdown) {
      document.addEventListener('mousedown', handleClickOutside);
    }

    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [showSupplierDropdown]);

  // Filtrar fornecedores localmente baseado no termo de busca
  const filteredSuppliers = useMemo(() => {
    const search = (supplierSearchTerm || '').trim().toLowerCase();
    
    // Não retornar resultados se não houver texto digitado
    if (!search) {
      return [];
    }

    // Filtrar por código ou nome
    return allSuppliers.filter((supplier) => {
      const codigo = String(supplier.codigo || '').toLowerCase();
      const nome = String(supplier.nome || '').toLowerCase();
      return codigo.includes(search) || nome.includes(search);
    }).slice(0, 10); // Limitar a 10 resultados
  }, [allSuppliers, supplierSearchTerm]);

  // Adicionar novo lote à compra
  const addBatchToEntry = async () => {
    try {
      // Se não há produto selecionado, mostrar aviso
      if (!selectedProductId) {
        toast({
          title: "Produto não selecionado",
          description: "Por favor, selecione um produto antes de adicionar lotes.",
          variant: "destructive",
        });
        return;
      }
      
      let nextBatchNumber = '1';
      try {
        nextBatchNumber = await generateNextBatchNumber();
      } catch (error) {
        // Fallback: pegar próximo número baseado nos já selecionados
        const currentNumbers = selectedBatches
          .map(b => (b.batchNumber || '').match(/\d+/)?.[0])
          .filter(Boolean)
          .map(n => parseInt(n as string, 10))
          .filter(n => !isNaN(n));
        const maxNum = currentNumbers.length > 0 ? Math.max(...currentNumbers) : 0;
        nextBatchNumber = String(maxNum + 1);
      }

      // Obter unitCost do formulário para aplicar ao novo lote
      const formUnitCost = form.getValues('unitCost') || 0;
      
      setSelectedBatches(prev => [
        ...prev,
        {
          batchNumber: nextBatchNumber,
          quantity: 0,
          unitCost: formUnitCost,
          manufactureDate: undefined,
          expiryDate: undefined,
        },
      ]);
    } catch (error) {
      // Em caso de erro, ainda adiciona o lote com número padrão
      // Obter unitCost do formulário para aplicar ao novo lote
      const formUnitCost = form.getValues('unitCost') || 0;
      
      setSelectedBatches(prev => [
        ...prev,
        {
          batchNumber: String((prev.length || 0) + 1),
          quantity: 0,
          unitCost: formUnitCost,
          manufactureDate: undefined,
          expiryDate: undefined,
        },
      ]);
    }
  };

  // Remover lote da compra
  const removeBatchFromEntry = (index: number) => {
    setSelectedBatches(prev => prev.filter((_, i) => i !== index));
    // Limpar erro do lote removido
    setBatchNumberErrors(prev => {
      const newErrors = {...prev};
      delete newErrors[index];
      // Reindexar erros para lotes que ficaram
      const reindexed: {[key: number]: string} = {};
      Object.keys(newErrors).forEach(key => {
        const oldIndex = parseInt(key);
        if (oldIndex > index) {
          reindexed[oldIndex - 1] = newErrors[oldIndex];
        } else if (oldIndex < index) {
          reindexed[oldIndex] = newErrors[oldIndex];
        }
      });
      return reindexed;
    });
    // Limpar erros de quantidade também
    setQuantityErrors(prev => {
      const newErrors = {...prev};
      delete newErrors[index];
      // Reindexar erros para lotes que ficaram
      const reindexed: {[key: number]: string} = {};
      Object.keys(newErrors).forEach(key => {
        const oldIndex = parseInt(key);
        if (oldIndex > index) {
          reindexed[oldIndex - 1] = newErrors[oldIndex];
        } else if (oldIndex < index) {
          reindexed[oldIndex] = newErrors[oldIndex];
        }
      });
      return reindexed;
    });
    // Limpar mensagens de status também
    setBatchStatusMessages(prev => {
      const newMessages = {...prev};
      delete newMessages[index];
      // Reindexar mensagens para lotes que ficaram
      const reindexed: {[key: number]: {found: boolean, message: string} | null} = {};
      Object.keys(newMessages).forEach(key => {
        const oldIndex = parseInt(key);
        if (oldIndex > index) {
          reindexed[oldIndex - 1] = newMessages[oldIndex];
        } else if (oldIndex < index) {
          reindexed[oldIndex] = newMessages[oldIndex];
        }
      });
      return reindexed;
    });
  };

  // Atualizar dados do lote
  const updateBatchData = (index: number, field: string, value: any) => {
    setSelectedBatches(prev => {
      const updated = [...prev];
      updated[index] = { ...updated[index], [field]: value };
      return updated;
    });
  };

  // Calcular total de unidades nos lotes
  const getTotalBatchQuantity = () => {
    return selectedBatches.reduce((sum, batch) => sum + (batch.quantity || 0), 0);
  };

  // Gerar próximo número de lote disponível automaticamente (apenas números: 1, 2, 3...)
  const generateNextBatchNumber = async () => {
    if (!user?.id || !selectedProductId) {
      return '1'; // Fallback se não houver dados
    }
    
    try {
      // Buscar todos os lotes do produto no banco
      const existingBatches = await getBatchesByProduct(selectedProductId, user.id);
      
      // Criar conjunto de números já usados
      const usedNumbers = new Set<number>();
      
      // Adicionar números de lotes existentes no banco
      existingBatches.forEach(b => {
        if (b.batchNumber) {
          // Extrair apenas o número de strings como "Lote 1", "1", etc.
          const numberMatch = b.batchNumber.match(/\d+/);
          if (numberMatch) {
            const num = parseInt(numberMatch[0]);
            if (!isNaN(num)) {
              usedNumbers.add(num);
            }
          }
        }
      });
      
      // Adicionar números de lotes disponíveis
      availableBatches.forEach(b => {
        if (b.batchNumber) {
          const numberMatch = b.batchNumber.match(/\d+/);
          if (numberMatch) {
            const num = parseInt(numberMatch[0]);
            if (!isNaN(num)) {
              usedNumbers.add(num);
            }
          }
        }
      });
      
      // Adicionar números de lotes selecionados na lista atual
      selectedBatches.forEach(b => {
        if (b.batchNumber && b.batchNumber.trim() !== '') {
          const numberMatch = b.batchNumber.match(/\d+/);
          if (numberMatch) {
            const num = parseInt(numberMatch[0]);
            if (!isNaN(num)) {
              usedNumbers.add(num);
            }
          }
        }
      });
      
      // Encontrar próximo número disponível começando de 1
      let nextNumber = 1;
      while (usedNumbers.has(nextNumber)) {
        nextNumber++;
      }
      
      // Proteção contra loop infinito
      if (nextNumber > 10000) {
        return Date.now().toString().slice(-4); // Usar últimos 4 dígitos do timestamp
      }
      
      return nextNumber.toString();
    } catch (error) {
      console.error('Erro ao gerar número do lote:', error);
      // Fallback local - gerar apenas números
      const usedBatchNumbers = new Set<number>();
      
      // Adicionar números de lotes disponíveis
      availableBatches.forEach(b => {
        if (b.batchNumber) {
          const numberMatch = b.batchNumber.match(/\d+/);
          if (numberMatch) {
            const num = parseInt(numberMatch[0]);
            if (!isNaN(num)) {
              usedBatchNumbers.add(num);
            }
          }
        }
      });
      
      // Adicionar números de lotes selecionados
      selectedBatches.forEach(b => {
        if (b.batchNumber) {
          const numberMatch = b.batchNumber.match(/\d+/);
          if (numberMatch) {
            const num = parseInt(numberMatch[0]);
            if (!isNaN(num)) {
              usedBatchNumbers.add(num);
            }
          }
        }
      });
      
      // Encontrar próximo número disponível
      let nextNumber = 1;
      while (usedBatchNumbers.has(nextNumber)) {
        nextNumber++;
      }
      return nextNumber.toString();
    }
  };

  // Controlar carregamento inicial
  useEffect(() => {
    const timer = setTimeout(() => {
      setIsLoading(false);
    }, 500);
    
    return () => clearTimeout(timer);
  }, []);

  // Atualizar sugestão de próximo número do lote quando produto ou lotes mudarem
  useEffect(() => {
    const updateNextBatchNumber = async () => {
      if (selectedProductId && user?.id) {
        const nextNumber = await generateNextBatchNumber();
        setNextBatchNumberSuggestion(nextNumber);
      }
    };
    
    updateNextBatchNumber();
  }, [selectedProductId, availableBatches, selectedBatches, user?.id]);

  // Filtros
  const filteredEntries = entries.filter(entry =>
    entry.productName.toLowerCase().includes(searchTerm.toLowerCase()) ||
    entry.supplier.toLowerCase().includes(searchTerm.toLowerCase())
  );

  // Cálculos
  const totalEntries = entries.length;
  const totalValue = entries.reduce((sum, entry) => sum + entry.totalCost, 0);
  const thisMonthEntries = entries.filter(entry => {
    const entryDate = new Date(entry.entryDate);
    const now = new Date();
    return entryDate.getMonth() === now.getMonth() && entryDate.getFullYear() === now.getFullYear();
  }).length;

  // Funções CRUD
  const addEntry = async (data: StockEntryFormData) => {
    const product = products.find(p => p.id === data.productId);
    if (!product) return;

    // Se houver lotes selecionados, criar cada lote no backend
    if (selectedBatches.length > 0) {
      try {
        // Validar se todos os lotes têm número, quantidade e custo unitário
        for (const batch of selectedBatches) {
          if (!batch.batchNumber || batch.quantity <= 0) {
            toast({
              title: "Dados Incompletos!",
              description: "Todos os lotes devem ter número e quantidade válidos.",
              variant: "destructive",
            });
            return;
          }
          if (!batch.unitCost || batch.unitCost <= 0) {
            toast({
              title: "Custo Obrigatório!",
              description: "Todos os lotes devem ter um custo unitário válido maior que zero.",
              variant: "destructive",
            });
            return;
          }
        }

        // Validar duplicatas antes de salvar
        const batchNumbers = new Map<string, number>();
        for (let i = 0; i < selectedBatches.length; i++) {
          const batch = selectedBatches[i];
          if (!batch.batchNumber || batch.batchNumber.trim() === '') {
            continue;
          }
          
          // Extrair número para comparação
          const numberMatch = batch.batchNumber.match(/\d+/);
          const normalizedNumber = numberMatch ? numberMatch[0] : batch.batchNumber;
          
          // Permitir lotes duplicados - a lógica de submissão irá somar as quantidades automaticamente
          // Não bloquear aqui, apenas registrar para processamento posterior
          batchNumbers.set(normalizedNumber, i);
        }
        
        // Consolidar lotes duplicados na lista selecionada (somar quantidades)
        const consolidatedBatches = new Map<string, {
          batchNumber: string;
          quantity: number;
          unitCost?: number;
          manufactureDate?: Date;
          expiryDate?: Date;
        }>();
        
        for (const batch of selectedBatches) {
          if (!batch.batchNumber || batch.batchNumber.trim() === '') continue;
          
          const batchMatch = batch.batchNumber.match(/\d+/);
          const normalizedNumber = batchMatch ? batchMatch[0] : batch.batchNumber;
          
          if (consolidatedBatches.has(normalizedNumber)) {
            // Lote duplicado na lista - somar quantidade
            const existing = consolidatedBatches.get(normalizedNumber)!;
            existing.quantity += batch.quantity || 0;
          } else {
            // Primeira ocorrência deste número de lote
            consolidatedBatches.set(normalizedNumber, {
              batchNumber: batch.batchNumber,
              quantity: batch.quantity || 0,
              unitCost: batch.unitCost,
              manufactureDate: batch.manufactureDate,
              expiryDate: batch.expiryDate,
            });
          }
        }
        
        // Criar ou atualizar todos os lotes consolidados no backend
        for (const batch of consolidatedBatches.values()) {
          if (!user?.id || !batch.batchNumber) continue;
          
          // Primeiro: Verificar se o lote existe GLOBALMENTE no banco de dados
          // Se existir para o mesmo produto, adicionar quantidade ao lote existente
          // Se não existir, criar um novo lote
          let existingBatchInDb = null;
          try {
            // Buscar lote globalmente primeiro
            existingBatchInDb = await findBatchByNumber(batch.batchNumber, user.id);
            
            // Se encontrou um lote e é do mesmo produto, adicionar quantidade
            if (existingBatchInDb && existingBatchInDb.productId === data.productId) {
              try {
                await updateBatchQuantity(
                  existingBatchInDb.id,
                  existingBatchInDb.quantity + batch.quantity,
                  user.id
                );
                // Sucesso ao atualizar lote existente
                continue; // Continuar para o próximo lote
              } catch (error) {
                console.error('Erro ao atualizar lote:', error);
                toast({
                  title: "Erro ao Atualizar Lote",
                  description: `Não foi possível atualizar o lote "${batch.batchNumber}". Tente novamente.`,
                  variant: "destructive",
                });
                return;
              }
            }
            // Se o lote existe mas é de outro produto, continuar para criar novo (números podem ser iguais)
          } catch (error) {
            console.error('Erro ao buscar lote no banco:', error);
          }
          
          // Se não encontrou no banco, verificar na lista local (availableBatches) como fallback
          const existingBatch = availableBatches.find(b => {
            // Normalizar números de lote para comparação (extrair apenas o número)
            const bMatch = b.batchNumber?.match(/\d+/);
            const bValue = bMatch ? bMatch[0] : b.batchNumber;
            const batchMatch = batch.batchNumber?.match(/\d+/);
            const batchValue = batchMatch ? batchMatch[0] : batch.batchNumber;
            return bValue === batchValue && b.productId === data.productId;
          });
          
          if (existingBatch) {
            // Lote encontrado na lista local - atualizar quantidade no banco
            try {
              await updateBatchQuantity(
                existingBatch.id, 
                existingBatch.quantity + batch.quantity,
                user.id
              );
              continue; // Continuar para o próximo lote
            } catch (error) {
              console.error('Erro ao atualizar lote local:', error);
              toast({
                title: "Erro ao Atualizar Lote",
                description: `Não foi possível atualizar o lote "${batch.batchNumber}". Tente novamente.`,
                variant: "destructive",
              });
              return;
            }
          }
          
          // Lote não existe para este produto - criar novo lote
          // NOTA: Números de lote podem ser iguais em produtos diferentes
          try {
            const created = await createBatch(
              data.productId,
              batch.batchNumber,
              batch.quantity,
              0, // unitCost
              user.id,
              batch.manufactureDate,
              batch.expiryDate
            );
            
            if (!created) {
              // Se falhou ao criar, verificar novamente se existe (pode ter sido criado em paralelo)
              const doubleCheck = await findBatchByNumber(batch.batchNumber, user.id);
              
              if (doubleCheck && doubleCheck.productId === data.productId) {
                // Lote foi criado em outro momento - atualizar quantidade
                await updateBatchQuantity(
                  doubleCheck.id,
                  doubleCheck.quantity + batch.quantity,
                  user.id
                );
              } else {
                toast({
                  title: "Erro ao Criar Lote",
                  description: `Não foi possível criar o lote "${batch.batchNumber}". Tente novamente.`,
                  variant: "destructive",
                });
                return;
              }
            }
          } catch (error: any) {
            console.error('Erro ao criar lote:', error);
            // Se erro indica que lote já existe, tentar atualizar
            const errorMessage = error?.message || '';
            if (errorMessage.includes('já existe') || errorMessage.includes('duplicat')) {
              // Tentar encontrar o lote globalmente e atualizar se for do mesmo produto
              const existing = await findBatchByNumber(batch.batchNumber, user.id);
              if (existing && existing.productId === data.productId) {
                // Lote encontrado para este produto - atualizar quantidade
                try {
                  await updateBatchQuantity(
                    existing.id,
                    existing.quantity + batch.quantity,
                    user.id
                  );
                  continue;
                } catch (updateError) {
                  console.error('Erro ao atualizar lote após criação falha:', updateError);
                  toast({
                    title: "Erro ao Atualizar Lote",
                    description: `Não foi possível atualizar o lote "${batch.batchNumber}". Tente novamente.`,
                    variant: "destructive",
                  });
                  return;
                }
              } else if (existing) {
                // Lote existe mas é de outro produto - permitir criar (números podem ser iguais)
                // Continuar para criar novo lote
                continue;
              } else {
                // Lote não foi encontrado - erro inesperado
                toast({
                  title: "Erro ao Criar Lote",
                  description: `Não foi possível criar o lote "${batch.batchNumber}". Tente novamente.`,
                  variant: "destructive",
                });
                return;
              }
            }
            
            toast({
                  title: "Erro ao Criar Lote",
              description: `Não foi possível criar o lote "${batch.batchNumber}". ${errorMessage || 'Tente novamente.'}`,
              variant: "destructive",
            });
            return;
          }
        }

        const totalQuantity = getTotalBatchQuantity();
        const totalCost = selectedBatches.reduce((sum, batch) => sum + (batch.quantity * (batch.unitCost || 0)), 0);
        const receiptNumber = generateReceiptNumber();

        const newEntry: StockEntry = {
          ...data,
          id: Date.now().toString(),
          productName: product.name,
          productSku: product.sku,
          quantity: totalQuantity, // Usar total dos lotes
          unitCost: totalCost / totalQuantity, // Custo médio
          totalCost: totalCost,
          entryDate: data.entryDate,
          receiptNumber: receiptNumber,
        };

        // Adicionar movimentação no contexto global (usar custo médio quando há lotes) - salva no Supabase
        const averageCost = totalCost / totalQuantity;
        // Calcular menor validade e fabricação entre os lotes (se houver)
        const minExpiry = selectedBatches
          .map(b => b.expiryDate)
          .filter(Boolean)
          .map(d => d as Date)
          .sort((a, b) => a.getTime() - b.getTime())[0];
        const minManu = selectedBatches
          .map(b => b.manufactureDate)
          .filter(Boolean)
          .map(d => d as Date)
          .sort((a, b) => a.getTime() - b.getTime())[0];

        const markup = (data as any).markup || 0;
        const paymentMethod = (data as any).paymentMethod || 'avista';
        const installments = (data as any).installments || 1;
        
        await addMovement({
          type: 'entrada',
          productId: data.productId,
          productName: product.name,
          quantity: totalQuantity,
          unitPrice: averageCost,
          description: `Entrada de ${totalQuantity} unidades em ${selectedBatches.length} lote(s) - ${data.supplier}` 
            + (minManu ? ` | FAB:${minManu.toISOString().split('T')[0]}` : '')
            + (minExpiry ? ` | EXP:${minExpiry.toISOString().split('T')[0]}` : ''),
          date: data.entryDate,
          paymentMethod: paymentMethod === "parcelado" ? `parcelado-${installments}x` : paymentMethod,
        });

        // Calcular e atualizar preço de venda do produto se markup foi informado
        if (markup > 0 && averageCost > 0) {
          const salePrice = averageCost * (1 + markup / 100);
          await updateProduct(data.productId, { price: salePrice });
          toast({
            title: "Preço de Venda Atualizado",
            description: `Preço de venda do produto atualizado para R$ ${salePrice.toFixed(2)} (baseado no custo médio de R$ ${averageCost.toFixed(2)} + ${markup}% de markup)`,
            variant: "default",
          });
        } else if (markup === 0 || markup === undefined || markup === null) {
          // Aviso se markup não foi informado
          toast({
            title: "Markup não informado",
            description: "O preço de venda não foi atualizado. Informe um percentual de markup para calcular o preço de venda automaticamente.",
            variant: "default",
          });
        }

        // Criar conta a pagar se o pagamento for parcelado (mesmo com 1 parcela, se marcado como parcelado)
        if (paymentMethod === "parcelado" && totalCost > 0 && installments >= 1 && workspaceAtivo?.id && user?.id) {
          try {
            // Calcular valor por parcela
            const valorParcela = totalCost / installments;
            
            // Data de vencimento da primeira parcela (30 dias a partir da data da entrada)
            const primeiraVencimento = new Date(data.entryDate);
            primeiraVencimento.setDate(primeiraVencimento.getDate() + 30);

            // Criar conta a pagar
            console.log('💾 Criando conta a pagar (addEntry com lotes):', {
              workspaceId: workspaceAtivo.id,
              userId: user.id,
              fornecedor: data.supplier,
              valorTotal: totalCost,
              parcelas: installments
            });
            
            const { data: contaPagar, error: errorConta } = await supabase
              .from('contas_a_pagar')
              .insert({
                lancamento: data.entryDate.toISOString().split('T')[0],
                observacoes: `Compra parcelada: ${product.name} - ${totalQuantity} unidades em ${selectedBatches.length} lote(s)`,
                forma_pagamento: 'parcelado',
                conta_origem: paymentMethod === "parcelado" ? 'banco' : 'caixa',
                centro_custo: '',
                fornecedor: data.supplier,
                valor_total: totalCost,
                valor_pago: 0,
                valor_restante: totalCost,
                parcelas: installments,
                parcelas_pagas: 0,
                data_vencimento: primeiraVencimento.toISOString().split('T')[0],
                status_pagamento: 'pendente',
                workspace_id: workspaceAtivo.id,
                usuario_id: user.id,
              })
              .select()
              .single();

            console.log('📊 Resultado da criação de conta a pagar (addEntry com lotes):', {
              sucesso: !!contaPagar,
              erro: errorConta?.message || null,
              contaId: contaPagar?.id || null,
              workspaceIdSalvo: contaPagar?.workspace_id || null
            });

            if (errorConta && errorConta.code === '42P01') {
              // Tabela não existe, tentar tabela antiga
              const { error: errorOld } = await supabase
                .from('contas_pagar')
                .insert({
                  descricao: `Compra parcelada: ${product.name} - ${totalQuantity} unidades`,
                  fornecedor: data.supplier,
                  valor: totalCost,
                  valor_pago: 0,
                  valor_restante: totalCost,
                  data_compra: data.entryDate.toISOString().split('T')[0],
                  data_registro: data.entryDate.toISOString().split('T')[0],
                  data_vencimento: primeiraVencimento.toISOString().split('T')[0],
                  forma_pagamento: 'parcelado',
                  numero_parcelas: installments,
                  status: 'pendente',
                  origem_pagamento: 'caixa',
                  workspace_id: workspaceAtivo.id,
                  usuario_id: user.id,
                });
              
              if (errorOld) {
                console.error('Erro ao criar conta a pagar:', errorOld);
              }
            } else if (errorConta) {
              console.error('Erro ao criar conta a pagar:', errorConta);
            } else if (contaPagar && installments > 1) {
              // Criar parcelas individuais
              const parcelasData = [];
              for (let i = 1; i <= installments; i++) {
                const vencimentoParcela = new Date(primeiraVencimento);
                vencimentoParcela.setMonth(vencimentoParcela.getMonth() + (i - 1));
                
                parcelasData.push({
                  conta_pagar_id: contaPagar.id,
                  numero: i,
                  valor: valorParcela,
                  data_vencimento: vencimentoParcela.toISOString().split('T')[0],
                  status: 'pendente',
                  observacoes: `Parcela ${i} de ${installments}`,
                });
              }

              if (parcelasData.length > 0) {
                const { error: errorParcelas } = await supabase
                  .from('parcelas')
                  .insert(parcelasData);

                if (errorParcelas) {
                  console.error('Erro ao criar parcelas:', errorParcelas);
                }
              }
            }
            
            // Disparar evento para recarregar contas a pagar
            if (contaPagar) {
              console.log('📢 Disparando evento contas-pagar-changed (addEntry com lotes)');
              window.dispatchEvent(new CustomEvent('contas-pagar-changed'));
            }
          } catch (error: any) {
            console.error('Erro ao criar conta a pagar automaticamente:', error);
            // Não bloquear o processo se houver erro ao criar conta a pagar
          }
        }

        setIsAddDialogOpen(false);
        setSelectedBatches([]);
        setSelectedProductId("");
        form.reset();

        // Adicionar notificação
        addNotification(
          'Nova Entrada Registrada',
          `Produto: ${product.name}\nQuantidade: ${totalQuantity} unidades\nLotes: ${selectedBatches.length}\nFornecedor: ${data.supplier}\nCusto Médio: R$ ${(totalCost / totalQuantity).toFixed(2)}\nTotal: R$ ${totalCost.toFixed(2)}`,
          'success'
        );

        toast({
          title: "Entrada Registrada!",
          description: `${totalQuantity} unidades de ${product.name} foram registradas em ${selectedBatches.length} lote(s).`,
          variant: "default",
        });
      } catch (error: any) {
        toast({
          title: "Erro ao Criar Lotes",
          description: error.message || "Não foi possível criar os lotes. Tente novamente.",
          variant: "destructive",
        });
      }
    } else {
      // Entrada sem lotes (modo antigo)
      const receiptNumber = generateReceiptNumber();
      
      const newEntry: StockEntry = {
        ...data,
        id: Date.now().toString(),
        productName: product.name,
        productSku: product.sku,
        totalCost: data.quantity * data.unitCost,
        entryDate: data.entryDate,
        receiptNumber: receiptNumber,
      };

      // Adicionar movimentação no contexto global - salva no Supabase
      const manu = (data as any).manufactureDate as Date | undefined;
      const exp = (data as any).expiryDate as Date | undefined;
      const markup = (data as any).markup || 0;
      const paymentMethod = (data as any).paymentMethod || 'avista';
      const installments = (data as any).installments || 1;
      
      await addMovement({
        type: 'entrada',
        productId: data.productId,
        productName: product.name,
        quantity: data.quantity,
        unitPrice: data.unitCost,
        description: `Entrada de ${data.quantity} unidades - ${data.supplier}` + (manu ? ` | FAB:${manu.toISOString().split('T')[0]}` : '') + (exp ? ` | EXP:${exp.toISOString().split('T')[0]}` : ''),
        date: data.entryDate,
        paymentMethod: paymentMethod === "parcelado" ? `parcelado-${installments}x` : paymentMethod,
      });

      // Calcular e atualizar preço de venda do produto se markup foi informado
      if (markup > 0 && data.unitCost > 0) {
        const salePrice = data.unitCost * (1 + markup / 100);
        await updateProduct(data.productId, { price: salePrice });
        toast({
          title: "Preço de Venda Atualizado",
          description: `Preço de venda do produto atualizado para R$ ${salePrice.toFixed(2)} (baseado no custo de R$ ${data.unitCost.toFixed(2)} + ${markup}% de markup)`,
          variant: "default",
        });
      } else if (markup === 0 || markup === undefined || markup === null) {
        // Aviso se markup não foi informado
        toast({
          title: "Markup não informado",
          description: "O preço de venda não foi atualizado. Informe um percentual de markup para calcular o preço de venda automaticamente.",
          variant: "default",
        });
      }

      // Criar conta a pagar se o pagamento for parcelado (mesmo com 1 parcela, se marcado como parcelado)
      const totalCompra = data.quantity * data.unitCost;
      if (paymentMethod === "parcelado" && totalCompra > 0 && installments >= 1 && workspaceAtivo?.id && user?.id) {
        try {
          // Calcular valor por parcela
          const valorParcela = totalCompra / installments;
          
          // Data de vencimento da primeira parcela (30 dias a partir da data da entrada)
          const primeiraVencimento = new Date(data.entryDate);
          primeiraVencimento.setDate(primeiraVencimento.getDate() + 30);

          // Criar conta a pagar
          console.log('💾 Criando conta a pagar (addEntry sem lotes):', {
            workspaceId: workspaceAtivo.id,
            userId: user.id,
            fornecedor: data.supplier,
            valorTotal: totalCompra,
            parcelas: installments
          });
          
          const { data: contaPagar, error: errorConta } = await supabase
            .from('contas_a_pagar')
            .insert({
              lancamento: data.entryDate.toISOString().split('T')[0],
              observacoes: `Compra parcelada: ${product.name} - ${data.quantity} unidades`,
              forma_pagamento: 'parcelado',
              conta_origem: paymentMethod === "parcelado" ? 'banco' : 'caixa',
              centro_custo: '',
              fornecedor: data.supplier,
              valor_total: totalCompra,
              valor_pago: 0,
              valor_restante: totalCompra,
              parcelas: installments,
              parcelas_pagas: 0,
              data_vencimento: primeiraVencimento.toISOString().split('T')[0],
              status_pagamento: 'pendente',
              workspace_id: workspaceAtivo.id,
              usuario_id: user.id,
            })
            .select()
            .single();

          console.log('📊 Resultado da criação de conta a pagar (addEntry sem lotes):', {
            sucesso: !!contaPagar,
            erro: errorConta?.message || null,
            contaId: contaPagar?.id || null,
            workspaceIdSalvo: contaPagar?.workspace_id || null
          });

          if (errorConta && errorConta.code === '42P01') {
            // Tabela não existe, tentar tabela antiga
            const { error: errorOld } = await supabase
              .from('contas_pagar')
              .insert({
                descricao: `Compra parcelada: ${product.name} - ${data.quantity} unidades`,
                fornecedor: data.supplier,
                valor: totalCompra,
                valor_pago: 0,
                valor_restante: totalCompra,
                data_compra: data.entryDate.toISOString().split('T')[0],
                data_registro: data.entryDate.toISOString().split('T')[0],
                data_vencimento: primeiraVencimento.toISOString().split('T')[0],
                forma_pagamento: 'parcelado',
                numero_parcelas: installments,
                status: 'pendente',
                origem_pagamento: 'caixa',
                workspace_id: workspaceAtivo.id,
                usuario_id: user.id,
              });
            
            if (errorOld) {
              console.error('Erro ao criar conta a pagar:', errorOld);
            }
          } else if (errorConta) {
            console.error('Erro ao criar conta a pagar:', errorConta);
          } else if (contaPagar && installments > 1) {
            // Criar parcelas individuais
            const parcelasData = [];
            for (let i = 1; i <= installments; i++) {
              const vencimentoParcela = new Date(primeiraVencimento);
              vencimentoParcela.setMonth(vencimentoParcela.getMonth() + (i - 1));
              
              parcelasData.push({
                conta_pagar_id: contaPagar.id,
                numero: i,
                valor: valorParcela,
                data_vencimento: vencimentoParcela.toISOString().split('T')[0],
                status: 'pendente',
                observacoes: `Parcela ${i} de ${installments}`,
              });
            }

            if (parcelasData.length > 0) {
              const { error: errorParcelas } = await supabase
                .from('parcelas')
                .insert(parcelasData);

              if (errorParcelas) {
                console.error('Erro ao criar parcelas:', errorParcelas);
              }
            }
          }
          
          // Disparar evento para recarregar contas a pagar
          if (contaPagar) {
            console.log('📢 Disparando evento contas-pagar-changed (addEntry sem lotes)');
            window.dispatchEvent(new CustomEvent('contas-pagar-changed'));
          }
        } catch (error: any) {
          console.error('Erro ao criar conta a pagar automaticamente:', error);
          // Não bloquear o processo se houver erro ao criar conta a pagar
        }
      }

      setIsAddDialogOpen(false);
      form.reset();

      // Adicionar notificação
      addNotification(
        'Nova Entrada Registrada',
        `Produto: ${product.name}\nQuantidade: ${data.quantity} unidades\nFornecedor: ${data.supplier}\nCusto: R$ ${data.unitCost.toFixed(2)}\nTotal: R$ ${(data.quantity * data.unitCost).toFixed(2)}`,
        'success'
      );

      toast({
        title: "Entrada Registrada!",
        description: `${data.quantity} unidades de ${product.name} foram registradas.`,
        variant: "default",
      });
    }
  };

  const editEntry = (data: StockEntryFormData) => {
    if (!editingEntry) return;

    const product = products.find(p => p.id === data.productId);
    if (!product) return;

    const updatedEntry: StockEntry = {
      ...editingEntry,
      ...data,
      productName: product.name,
      productSku: product.sku,
      totalCost: data.quantity * data.unitCost,
    };

    // Nota: Edição de movimentações em desenvolvimento
    toast({
      title: "ℹ️ Em Desenvolvimento",
      description: "Edição de entradas será implementada em breve"
    });
    setIsEditDialogOpen(false);
    return;

    // Atualizar movimentação no contexto global
    addMovement({
      type: 'entrada',
      productId: data.productId,
      productName: product.name,
      quantity: data.quantity,
      unitPrice: data.unitCost,
      description: `Entrada atualizada de ${data.quantity} unidades - ${data.supplier}`,
      date: data.entryDate,
    });

    setIsEditDialogOpen(false);
    setEditingEntry(null);
    form.reset();

    // Adicionar notificação
    addNotification(
        '✏️ Entrada Atualizada',
        `Produto: ${product.name}\nQuantidade: ${data.quantity} unidades\nFornecedor: ${data.supplier}\nCusto: R$ ${data.unitCost.toFixed(2)}\nTotal: R$ ${(data.quantity * data.unitCost).toFixed(2)}\nStatus: ${data.status}`,
        'info'
      );

    toast({
      title: "✏️ Entrada Atualizada!",
      description: `Entrada de ${product.name} foi atualizada com sucesso.`,
      variant: "default",
    });
  };

  const handleDeleteEntry = (entry: StockEntry) => {
    setEntryToDelete(entry);
    setIsDeleteDialogOpen(true);
  };

  // Abrir gerenciador de lotes para uma entrada
  const openBatchManager = (entry: StockEntry) => {
    const product = products.find(p => p.id === entry.productId);
    if (product) {
      setSelectedProductForBatch({
        id: product.id,
        name: product.name,
        sku: product.sku,
        stock: product.stock || 0
      });
      setIsBatchDialogOpen(true);
    }
  };

  const confirmDeleteEntry = async () => {
    if (!entryToDelete || isDeleting) return;

    try {
      setIsDeleting(true);
      
      await deleteMovement(entryToDelete.id);

      toast({
        title: "Entrada Removida!",
        description: `Entrada de ${entryToDelete.quantity} unidades foi removida e o estoque foi ajustado.`,
        variant: "default",
      });

      // Fechar dialog após sucesso
      setIsDeleteDialogOpen(false);
      setEntryToDelete(null);
    } catch (error: any) {
      toast({
        title: "Erro ao Remover",
        description: error.message || "Não foi possível remover a entrada.",
        variant: "destructive",
      });
    } finally {
      setIsDeleting(false);
    }
  };

  const openEditDialog = (entry: StockEntry) => {
    setEditingEntry(entry);
    form.reset({
      productId: entry.productId,
      quantity: entry.quantity,
      unitCost: entry.unitCost,
      supplier: entry.supplier,
      entryDate: entry.entryDate,
      notes: entry.notes,
      status: entry.status,
    });
    setIsEditDialogOpen(true);
  };

  // Função helper para formatar data compatível com Excel
  const formatDateForExcel = (date: Date) => {
    const d = new Date(date);
    const day = String(d.getDate()).padStart(2, '0');
    const month = String(d.getMonth() + 1).padStart(2, '0');
    const year = d.getFullYear();
    return `${day}/${month}/${year}`;
  };

  // Função para exportar dados em CSV com formatação profissional
  const exportToCSV = () => {
    if (filteredEntries.length === 0) {
      toast({
        title: "Sem dados",
        description: "Não há dados para exportar",
        variant: "destructive",
      });
      return;
    }

    const now = new Date();
    const dataGeracao = formatDateForExcel(now);
    const horaGeracao = `${String(now.getHours()).padStart(2, '0')}:${String(now.getMinutes()).padStart(2, '0')}`;

    // Cabeçalho do relatório com formatação profissional e emojis
    const reportData = [
      ['FLEXI GESTOR - SISTEMA DE GESTAO EMPRESARIAL'],
      ['RELATORIO DE ENTRADAS DE ESTOQUE'],
      [''],
      ['INFORMACOES DO RELATORIO'],
      ['Data de Geracao:', dataGeracao],
      ['Hora de Geracao:', horaGeracao],
      ['Total de Registros:', filteredEntries.length.toString()],
      [''],
      ['RESUMO EXECUTIVO'],
      ['Quantidade Total de Produtos', `${filteredEntries.reduce((sum, entry) => sum + entry.quantity, 0)} unidades`],
      ['Custo Total das Entradas', `R$ ${filteredEntries.reduce((sum, entry) => sum + entry.totalCost, 0).toFixed(2).replace('.', ',')}`],
      ['Custo Medio por Produto', `R$ ${(filteredEntries.reduce((sum, entry) => sum + entry.totalCost, 0) / filteredEntries.reduce((sum, entry) => sum + entry.quantity, 0)).toFixed(2).replace('.', ',')}`],
      [''],
      ['DETALHAMENTO COMPLETO DAS ENTRADAS'],
      ['ID', 'Produto', 'SKU', 'Fornecedor', 'Quantidade', 'Custo Unit.', 'Custo Total', 'Data', 'Status', 'Observacoes']
    ];

    // Adicionar dados das entradas com formatação melhorada
    filteredEntries.forEach(entry => {
      const formattedDate = formatDateForExcel(entry.entryDate);
      
      reportData.push([
        entry.id,
        entry.productName,
        entry.productSku,
        entry.supplier,
        entry.quantity.toString(),
        entry.unitCost.toFixed(2).replace('.', ','),
        entry.totalCost.toFixed(2).replace('.', ','),
        formattedDate,
        entry.status === 'aprovado' ? 'Aprovado' : entry.status === 'pendente' ? 'Pendente' : 'Cancelado',
        entry.notes || 'Sem observacoes'
      ]);
    });

    // Adicionar rodapé do relatório
    reportData.push(['']);
    reportData.push(['RELATORIO GERADO AUTOMATICAMENTE PELO FLEXI GESTOR']);
    reportData.push(['Sistema de Gestao Empresarial - www.flexigestor.com']);

    // Converter para string CSV com formatação profissional e separadores visuais
    const csvContent = reportData.map((row, index) => {
      // Adicionar separadores visuais para seções importantes
      if (index === 0) {
        return '='.repeat(100) + '\n' + row.map(field => `"${field}"`).join(';') + '\n' + '='.repeat(100);
      }
      if (index === 1) {
        return row.map(field => `"${field}"`).join(';') + '\n' + '-'.repeat(100);
      }
      if (row[0] && row[0].includes('INFORMAÇÕES DO RELATÓRIO')) {
        return '\n' + row.map(field => `"${field}"`).join(';') + '\n' + '-'.repeat(50);
      }
      if (row[0] && row[0].includes('RESUMO EXECUTIVO')) {
        return '\n' + row.map(field => `"${field}"`).join(';') + '\n' + '-'.repeat(50);
      }
      if (row[0] && row[0].includes('DETALHAMENTO COMPLETO')) {
        return '\n' + row.map(field => `"${field}"`).join(';') + '\n' + '-'.repeat(100);
      }
      
      return row.map(field => {
        // Tratar campos especiais e formatação
        if (typeof field === 'string') {
          // Sempre envolver em aspas para garantir formatação correta
          if (field.includes(',') || field.includes(';') || field.includes('\n') || field.includes('"') || field.includes('R$')) {
            return `"${field.replace(/"/g, '""')}"`; // Escapar aspas duplas
          }
          // Se o campo está vazio, retornar espaço
          if (field === '') {
            return ' ';
          }
          return `"${field}"`;
        }
        return `"${field}"`;
      }).join(';'); // Usar ponto e vírgula como separador (padrão Excel)
    }).join('\n');

    // Criar e baixar o arquivo
    const currentDate = new Date().toISOString().split('T')[0];
    const fileName = `Entradas_${currentDate}.csv`;
    
    const blob = new Blob(['\ufeff' + csvContent], { 
      type: 'text/csv;charset=utf-8;' 
    });
    
    const link = document.createElement('a');
    const url = URL.createObjectURL(blob);
    
    link.setAttribute('href', url);
    link.setAttribute('download', fileName);
    link.style.visibility = 'hidden';
    
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    
    // Limpar URL para evitar vazamentos de memória
    URL.revokeObjectURL(url);
  };

  // Função para aplicar filtros
  const applyFilters = () => {
    // Aqui você pode implementar filtros adicionais se necessário
  };

  // Tela de carregamento
  if (isLoading) {
    return (
      <main className="flex-1 p-3 sm:p-6 space-y-4 sm:space-y-6">
        <div className="flex items-center justify-center min-h-[400px]">
          <div className="text-center">
            <div className="w-16 h-16 bg-gradient-to-br from-indigo-500 to-indigo-600 rounded-full flex items-center justify-center mx-auto mb-4 animate-pulse">
              <TrendingUp className="w-8 h-8 text-white" />
            </div>
            <h3 className="text-lg font-semibold text-gray-900 mb-2 flex items-center gap-2"><Package className="h-5 w-5" /> Carregando Entradas...</h3>
            <p className="text-gray-600">Preparando dados de estoque</p>
          </div>
        </div>
      </main>
    );
  }

  return (
    <main className="flex-1 p-3 sm:p-6 space-y-6 sm:space-y-8 bg-gradient-to-br from-neutral-50 to-neutral-100 min-h-screen">
      {/* Header Principal com Design Profissional */}
      <div className="space-y-4 mt-4 sm:mt-0">
        <div className="flex flex-col items-center sm:flex-row sm:items-center sm:justify-between gap-4">
          <div className="space-y-2 text-center sm:text-left">
            <h1 className="text-3xl font-bold bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent flex items-center gap-2 justify-center sm:justify-start">
              <TrendingUp className="w-8 h-8 text-blue-600" />
              Compras de Estoque
            </h1>
            <p className="text-base sm:text-lg md:text-xl text-neutral-600 max-w-2xl mx-auto sm:mx-0">
              Gerencie todas as compras de produtos e mantenha o controle completo do seu inventário
            </p>
          </div>
          
          {/* Botão de Nova Entrada com Design Sofisticado */}
          <Dialog open={isAddDialogOpen} onOpenChange={(open) => {
            setIsAddDialogOpen(open);
            // Resetar estados de focus quando dialog abrir ou fechar
            setProductSearchFocused(false);
            setSupplierSearchFocused(false);
            setProductSearchUserClicked(false);
            setSupplierSearchUserClicked(false);
            if (open) {
              setShowSupplierDropdown(false);
            }
            if (!open) {
              // Limpar estados ao fechar
              setSelectedProductId("");
              setSelectedBatches([]);
              setProductSearchTerm("");
              setProductSearchOpen(false);
              setBatchNumberErrors({});
            }
          }}>
            <DialogTrigger asChild>
              <Button className="w-full sm:w-auto bg-gradient-to-r from-indigo-600 to-indigo-700 hover:from-indigo-700 hover:to-indigo-800 text-white px-6 sm:px-8 py-3 sm:py-4 rounded-xl sm:rounded-2xl shadow-xl hover:shadow-2xl transition-all duration-200 transform hover:scale-105">
                <Plus className="w-5 h-5 sm:w-6 sm:h-6 mr-2 sm:mr-3" />
                Nova Compra
              </Button>
            </DialogTrigger>
            
            {/* Modal de Nova Entrada com Design Melhorado */}
            <DialogContent className="max-w-md sm:max-w-lg md:max-w-2xl max-h-[90vh] flex flex-col p-0">
              <DialogHeader className="space-y-2 pb-4 px-6 pt-6 border-b">
                <DialogTitle className="text-base sm:text-xl font-bold text-neutral-900">
                  <span className="flex items-center gap-2"><Sparkles className="h-4 w-4" /> Registrar Nova Compra</span>
                </DialogTitle>
                <DialogDescription className="text-sm text-neutral-600">
                  Preencha as informações detalhadas da compra de estoque para manter o controle preciso
                </DialogDescription>
              </DialogHeader>
              
              <Form {...form}>
                <form onSubmit={form.handleSubmit(addEntry)} className="flex flex-col flex-1 min-h-0">
                  <div className="flex-1 overflow-y-auto px-6 py-4 space-y-4">
                    {/* Primeira linha - Produto e Fornecedor */}
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
                            <FormLabel className="text-base sm:text-sm font-semibold text-neutral-700">
                              <span className="flex items-center gap-2"><Tag className="h-4 w-4" /> Produto</span>
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
                                      onMouseDown={() => {
                                        // Marcar que o usuário clicou quando pressionar o mouse
                                        setProductSearchUserClicked(true);
                                        setProductSearchFocused(true);
                                      }}
                                      onFocus={() => {
                                        // Só mostrar lista se o usuário já clicou explicitamente
                                        if (productSearchUserClicked) {
                                          setProductSearchFocused(true);
                                        }
                                      }}
                                      onBlur={() => {
                                        // Delay para permitir clique no item
                                        setTimeout(() => {
                                          setProductSearchFocused(false);
                                          setProductSearchUserClicked(false);
                                        }, 200);
                                      }}
                                      onKeyDown={(e) => {
                                        if (e.key === 'Enter' && filteredProducts.length === 1) {
                                          field.onChange(filteredProducts[0].id);
                                          loadBatchesForProduct(filteredProducts[0].id);
                                          setProductSearchTerm("");
                                          setProductSearchFocused(false);
                                        } else if (e.key === 'Escape') {
                                          setProductSearchTerm("");
                                          setProductSearchFocused(false);
                                        }
                                      }}
                                      className="h-11 sm:h-10 border-2 border-neutral-200 rounded-xl focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 pl-10"
                                    />
                                  </div>
                                  
                                  {((productSearchFocused && productSearchUserClicked) || productSearchTerm.trim() !== '') && (
                                    <div className="absolute z-[100] w-full mt-1 bg-white border-2 border-neutral-200 rounded-xl shadow-lg" style={{ maxHeight: '240px', overflowY: 'auto' }}>
                                      {(() => {
                                        const productsToShow = productSearchTerm.trim() !== '' 
                                          ? filteredProducts 
                                          : products.slice(0, 50); // Mostrar até 50 produtos quando não há busca
                                        
                                        if (productsToShow.length === 0) {
                                          return (
                                            <div className="p-4 text-center text-sm text-muted-foreground">
                                              Nenhum produto encontrado
                                            </div>
                                          );
                                        }
                                        
                                        return productsToShow.slice(0, 50).map(product => (
                                          <button
                                            key={product.id}
                                            type="button"
                                            className="w-full px-4 py-3 text-left hover:bg-accent hover:text-accent-foreground focus:bg-accent focus:text-accent-foreground focus:outline-none border-b last:border-b-0 transition-colors"
                                            onMouseDown={(e) => {
                                              e.preventDefault(); // Prevenir que o mousedown feche o dropdown antes do onClick
                                              e.stopPropagation();
                                            }}
                                            onClick={(e) => {
                                              e.preventDefault();
                                              e.stopPropagation();
                                              field.onChange(product.id);
                                              loadBatchesForProduct(product.id);
                                              setProductSearchTerm("");
                                              setProductSearchFocused(false);
                                            }}
                                          >
                                            <div className="font-medium">{product.name}</div>
                                            <div className="text-xs text-muted-foreground">Código: {product.sku}</div>
                                          </button>
                                        ));
                                      })()}
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
                    
                    <FormField
                      control={form.control}
                      name="supplier"
                      render={({ field }) => (
                        <FormItem className="space-y-3">
                          <FormLabel className="text-base sm:text-sm font-semibold text-neutral-700">
                            <span className="flex items-center gap-2"><Building2 className="h-4 w-4" /> Fornecedor</span>
                          </FormLabel>
                          <FormControl>
                            <div className="relative" ref={supplierInputRef}>
                              <Input 
                                placeholder="Código ou nome do fornecedor" 
                                value={field.value || ''}
                                onChange={(e) => {
                                  const value = e.target.value;
                                  field.onChange(value);
                                  setSupplierSearchTerm(value);
                                  // Mostrar dropdown quando houver texto digitado
                                  if (value.trim().length > 0) {
                                    setShowSupplierDropdown(true);
                                  }
                                  setSupplierSuggestion(null);
                                }}
                                onMouseDown={() => {
                                  // Marcar que o usuário clicou quando pressionar o mouse
                                  setSupplierSearchUserClicked(true);
                                  setSupplierSearchFocused(true);
                                  setShowSupplierDropdown(true);
                                  if (field.value && field.value.trim().length > 0) {
                                    setSupplierSearchTerm(field.value);
                                  }
                                }}
                                onFocus={() => {
                                  // Mostrar lista quando focar
                                  setSupplierSearchFocused(true);
                                  setShowSupplierDropdown(true);
                                  if (field.value && field.value.trim().length > 0) {
                                    setSupplierSearchTerm(field.value);
                                  }
                                }}
                                onBlur={() => {
                                  // Delay para permitir clique no item
                                  setTimeout(() => {
                                    setSupplierSearchFocused(false);
                                    setSupplierSearchUserClicked(false);
                                    setShowSupplierDropdown(false);
                                  }, 200);
                                }}
                                onKeyDown={(e) => {
                                  // Permitir navegação com teclado
                                  if (e.key === 'Escape') {
                                    setShowSupplierDropdown(false);
                                  }
                                }}
                                className="h-11 sm:h-10 border-2 border-neutral-200 rounded-xl focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 text-base sm:text-sm"
                                autoComplete="off"
                              />
                              {(supplierSearchFocused || showSupplierDropdown) && !isLoadingSuppliers && (
                                <>
                                  {(() => {
                                    const suppliersToShow = supplierSearchTerm.trim() !== '' 
                                      ? filteredSuppliers 
                                      : allSuppliers.slice(0, 50); // Mostrar até 50 fornecedores quando não há busca
                                    
                                    if (suppliersToShow.length === 0) {
                                      return (
                                        <div className="absolute z-[100] mt-1 w-full bg-white border border-neutral-200 rounded-lg shadow-lg overflow-hidden">
                                          <div className="p-4 text-center text-sm text-muted-foreground">
                                            {allSuppliers.length === 0 ? 'Nenhum fornecedor cadastrado' : 'Nenhum fornecedor encontrado'}
                                          </div>
                                        </div>
                                      );
                                    }
                                    
                                    return (
                                      <div className="absolute z-[100] mt-1 w-full bg-white border border-neutral-200 rounded-lg shadow-lg overflow-hidden" style={{ maxHeight: '240px', overflowY: 'auto' }}>
                                        {suppliersToShow.slice(0, 50).map((supplier) => (
                                        <button
                                          key={supplier.id}
                                          type="button"
                                          className="w-full px-4 py-3 text-left hover:bg-accent hover:text-accent-foreground focus:bg-accent focus:text-accent-foreground focus:outline-none border-b last:border-b-0 transition-colors"
                                          onMouseDown={(e) => {
                                            e.preventDefault(); // Prevenir que o mousedown feche o dropdown antes do onClick
                                            e.stopPropagation();
                                          }}
                                          onClick={(e) => {
                                            e.preventDefault();
                                            e.stopPropagation();
                                            field.onChange(supplier.nome);
                                            setSupplierSearchTerm('');
                                            setShowSupplierDropdown(false);
                                            setSupplierSearchFocused(false);
                                            setSupplierSuggestion(null);
                                          }}
                                        >
                                          <div className="font-medium">{supplier.nome}</div>
                                          <div className="text-xs text-muted-foreground">
                                            Código: {supplier.codigo || '—'}
                                          </div>
                                        </button>
                                      ))}
                                      {suppliersToShow.length > 4 && (
                                        <div className="px-4 py-2 text-xs text-neutral-500 bg-neutral-50 text-center border-t">
                                          Mostrando {Math.min(50, suppliersToShow.length)} de {allSuppliers.length} fornecedores
                                        </div>
                                      )}
                                    </div>
                                    );
                                  })()}
                                </>
                              )}
                            </div>
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                  </div>

                  {/* Interface de Gestão de Lotes - Aparece quando produto é selecionado E tem gerenciamento por lote */}
                  {selectedProductId && (() => {
                    const selectedProduct = products.find(p => p.id === selectedProductId);
                    const managedByBatch = (selectedProduct as any)?.managedByBatch === true;
                    
                    // Se NÃO usa gerenciamento por lote, mostrar campos simples
                    if (!managedByBatch) {
                      return (
                        <Card className="border-2 border-indigo-200">
                          <CardHeader className="pb-3">
                            <CardTitle className="text-lg font-semibold text-gray-900">
                              <span className="flex items-center gap-2"><Package className="h-4 w-4" /> Informações da Compra</span>
                            </CardTitle>
                            <p className="text-sm text-gray-600">{selectedProduct?.name || 'Produto selecionado'}</p>
                          </CardHeader>
                          <CardContent className="space-y-4">
                            <div className="space-y-4">
                              <FormField
                                control={form.control}
                                name="quantity"
                                render={({ field }) => (
                                  <FormItem className="space-y-2">
                                    <FormLabel className="text-sm font-semibold text-neutral-700">
                                      <span className="flex items-center gap-2"><Hash className="h-4 w-4" /> Quantidade *</span>
                                    </FormLabel>
                                    <FormControl>
                                      <Input
                                        type="number"
                                        min="1"
                                        placeholder="Ex: 100"
                                        {...field}
                                        onChange={(e) => {
                                          const value = e.target.value;
                                          if (value === '' || value === null) {
                                            field.onChange(0);
                                            return;
                                          }
                                          const intValue = parseInt(value);
                                          if (!isNaN(intValue)) {
                                            field.onChange(intValue);
                                          }
                                        }}
                                        value={field.value === 0 ? '' : field.value}
                                        className="h-11 sm:h-10 border-2 border-neutral-200 rounded-xl focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 text-base sm:text-sm"
                                      />
                                    </FormControl>
                                    <FormMessage />
                                  </FormItem>
                                )}
                              />
                              <FormField
                                control={form.control}
                                name="unitCost"
                                render={({ field }) => (
                                  <FormItem className="space-y-2">
                                    <FormLabel className="text-sm font-semibold text-neutral-700">
                                      <span className="flex items-center gap-2"><Coins className="h-4 w-4" /> Custo Unitário (R$)</span>
                                    </FormLabel>
                                    <FormControl>
                                      <Input
                                        type="number"
                                        step="0.01"
                                        min="0"
                                        placeholder="0.00"
                                        {...field}
                                        onChange={(e) => {
                                          const value = e.target.value;
                                          if (value === '' || value === null) {
                                            field.onChange(0);
                                            return;
                                          }
                                          const numValue = parseFloat(value);
                                          if (!isNaN(numValue)) {
                                            field.onChange(numValue);
                                          }
                                        }}
                                        value={field.value === 0 ? '' : field.value}
                                        className="h-11 sm:h-10 border-2 border-neutral-200 rounded-xl focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 text-base sm:text-sm"
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
                                  <FormItem className="space-y-2">
                                    <FormLabel className="text-sm font-semibold text-neutral-700">
                                      <span className="flex items-center gap-2"><CreditCard className="h-4 w-4" /> Forma de Pagamento</span>
                                    </FormLabel>
                                    <FormControl>
                                      <Select
                                        value={field.value || "avista"}
                                        onValueChange={field.onChange}
                                      >
                                        <SelectTrigger className="h-11 sm:h-10 border-2 border-neutral-200 rounded-xl focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 text-base sm:text-sm">
                                          <SelectValue placeholder="Selecione a forma de pagamento" />
                                        </SelectTrigger>
                                        <SelectContent>
                                          <SelectItem value="avista"><span className="flex items-center gap-2"><DollarSign className="h-4 w-4" /> À vista</span></SelectItem>
                                          <SelectItem value="pix"><span className="flex items-center gap-2"><Smartphone className="h-4 w-4" /> PIX</span></SelectItem>
                                          <SelectItem value="debito"><span className="flex items-center gap-2"><CreditCard className="h-4 w-4" /> Débito</span></SelectItem>
                                          <SelectItem value="credito"><span className="flex items-center gap-2"><CreditCard className="h-4 w-4" /> Crédito</span></SelectItem>
                                          <SelectItem value="boleto"><span className="flex items-center gap-2"><FileText className="h-4 w-4" /> Boleto</span></SelectItem>
                                          <SelectItem value="cheque"><span className="flex items-center gap-2"><FileText className="h-4 w-4" /> Cheque</span></SelectItem>
                                          <SelectItem value="transferencia"><span className="flex items-center gap-2"><Upload className="h-4 w-4" /> Transferência</span></SelectItem>
                                          <SelectItem value="parcelado"><span className="flex items-center gap-2"><BarChart3 className="h-4 w-4" /> Parcelado</span></SelectItem>
                                        </SelectContent>
                                      </Select>
                                    </FormControl>
                                    <FormMessage />
                                  </FormItem>
                                )}
                              />
                              {form.watch("paymentMethod") === "parcelado" && (
                                <FormField
                                  control={form.control}
                                  name="installments"
                                  render={({ field }) => (
                                    <FormItem className="space-y-2">
                                      <FormLabel className="text-sm font-semibold text-neutral-700">
                                        <span className="flex items-center gap-2"><BarChart3 className="h-4 w-4" /> Quantidade de Parcelas</span>
                                      </FormLabel>
                                      <FormControl>
                                        <Select 
                                          value={String(field.value || 1)} 
                                          onValueChange={(v) => field.onChange(Number(v))}
                                        >
                                          <SelectTrigger className="h-11 sm:h-10 border-2 border-neutral-200 rounded-xl focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 text-base sm:text-sm">
                                            <SelectValue />
                                          </SelectTrigger>
                                          <SelectContent>
                                            {Array.from({ length: 12 }, (_, i) => i + 1).map((n) => (
                                              <SelectItem key={n} value={String(n)}>
                                                {n}x
                                              </SelectItem>
                                            ))}
                                          </SelectContent>
                                        </Select>
                                      </FormControl>
                                      <FormMessage />
                                    </FormItem>
                                  )}
                                />
                              )}
                            </div>

                            {/* Datas e Vencimento (para produtos sem lote) */}
                            <div className="space-y-4">
                              <FormField
                                control={form.control}
                                name="manufactureDate"
                                render={({ field }) => (
                                  <FormItem className="space-y-2">
                                    <FormLabel className="text-sm font-semibold text-neutral-700">
                                      <span className="flex items-center gap-2"><Factory className="h-4 w-4" /> Data de Fabricação</span>
                                    </FormLabel>
                                    <FormControl>
                                      <Input
                                        type="date"
                                        {...field}
                                        value={field.value instanceof Date ? field.value.toISOString().split('T')[0] : (field.value || '')}
                                        onChange={(e) => field.onChange(e.target.value ? new Date(e.target.value) : undefined)}
                                        className="h-11 sm:h-10 border-2 border-neutral-200 rounded-xl focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 text-base sm:text-sm"
                                      />
                                    </FormControl>
                                    <FormMessage />
                                  </FormItem>
                                )}
                              />
                              <FormField
                                control={form.control}
                                name="expiryDate"
                                render={({ field }) => (
                                  <FormItem className="space-y-2">
                                    <FormLabel className="text-sm font-semibold text-neutral-700">
                                      <span className="flex items-center gap-2"><Clock className="h-4 w-4" /> Data de Validade</span>
                                    </FormLabel>
                                    <FormControl>
                                      <Input
                                        type="date"
                                        {...field}
                                        value={field.value instanceof Date ? field.value.toISOString().split('T')[0] : (field.value || '')}
                                        onChange={(e) => field.onChange(e.target.value ? new Date(e.target.value) : undefined)}
                                        className="h-11 sm:h-10 border-2 border-neutral-200 rounded-xl focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 text-base sm:text-sm"
                                      />
                                    </FormControl>
                                    <FormMessage />
                                  </FormItem>
                                )}
                              />
                              <div className="flex items-end">
                                {(() => {
                                  const expiry = form.watch('expiryDate') as Date | undefined;
                                  if (!expiry) return null;
                                  const today = new Date();
                                  const start = new Date(today.getFullYear(), today.getMonth(), today.getDate()).getTime();
                                  const end = new Date(expiry.getFullYear(), expiry.getMonth(), expiry.getDate()).getTime();
                                  const diffDays = Math.round((end - start) / (1000 * 60 * 60 * 24));
                                  const isExpired = diffDays < 0;
                                  const isToday = diffDays === 0;
                                  const badgeClass = isExpired
                                    ? 'bg-red-100 text-red-700 border-red-200'
                                    : isToday
                                      ? 'bg-amber-100 text-amber-700 border-amber-200'
                                      : diffDays <= 7
                                        ? 'bg-orange-100 text-orange-700 border-orange-200'
                                        : 'bg-emerald-100 text-emerald-700 border-emerald-200';
                                  const label = isExpired
                                    ? `Vencido há ${humanizeDaysDiff(diffDays)}`
                                    : isToday
                                      ? 'Vence hoje'
                                      : `Faltam ${humanizeDaysDiff(diffDays)}`;
                                  return (
                                    <div className={`inline-flex items-center px-3 py-2 rounded-lg border text-sm font-medium ${badgeClass}`}>
                                      {isExpired ? <X className="h-4 w-4 text-red-600" /> : isToday ? <AlertTriangle className="h-4 w-4 text-yellow-600" /> : <Clock className="h-4 w-4 text-blue-600" />}
                                      <span className="ml-2">{label}</span>
                                    </div>
                                  );
                                })()}
                              </div>
                            </div>

                            {/* Campo de Markup - abaixo das datas */}
                            <FormField
                              control={form.control}
                              name="markup"
                              render={({ field }) => (
                                <FormItem className="space-y-2">
                                  <FormLabel className="text-sm font-semibold text-neutral-700">
                                    <span className="flex items-center gap-2"><TrendingUp className="h-4 w-4" /> Markup (%) - Percentual para calcular preço de venda</span>
                                  </FormLabel>
                                  <FormControl>
                                    <Input
                                      type="number"
                                      step="0.1"
                                      min="0"
                                      placeholder="Ex: 30 (para 30% de margem)"
                                      {...field}
                                      onChange={(e) => {
                                        const value = e.target.value;
                                        if (value === '' || value === null) {
                                          field.onChange(0);
                                          return;
                                        }
                                        const numValue = parseFloat(value);
                                        if (!isNaN(numValue) && numValue >= 0) {
                                          field.onChange(numValue);
                                        }
                                      }}
                                      value={field.value === undefined || field.value === null || field.value === 0 ? '' : field.value}
                                      className="h-11 sm:h-10 border-2 border-indigo-300 rounded-xl focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 text-base sm:text-sm bg-indigo-50/50"
                                    />
                                  </FormControl>
                                  <FormMessage />
                                  {form.watch('unitCost') > 0 && form.watch('markup') > 0 && (
                                    <div className="mt-2 p-3 bg-emerald-50 border border-emerald-200 rounded-lg">
                                      <p className="text-sm font-semibold text-emerald-700">
                                        <span className="flex items-center gap-2"><Coins className="h-4 w-4" /> Preço de Venda Calculado: R$ {(form.watch('unitCost') * (1 + (form.watch('markup') || 0) / 100)).toFixed(2)}</span>
                                      </p>
                                      <p className="text-xs text-emerald-600 mt-1">
                                        Custo: R$ {form.watch('unitCost').toFixed(2)} + {form.watch('markup')}% = R$ {(form.watch('unitCost') * (1 + (form.watch('markup') || 0) / 100)).toFixed(2)}
                                      </p>
                                    </div>
                                  )}
                                </FormItem>
                              )}
                            />

                            {form.watch('quantity') > 0 && form.watch('unitCost') > 0 && (
                              <div className="pt-3 border-t border-indigo-200 space-y-2">
                                <div className="flex items-center justify-between">
                                  <span className="text-sm font-medium text-gray-900 flex items-center gap-2"><Coins className="h-4 w-4" /> Valor Total:</span>
                                  <span className="text-lg font-bold text-emerald-600">
                                    R$ {(form.watch('quantity') * form.watch('unitCost')).toFixed(2)}
                                  </span>
                                </div>
                                {form.watch('markup') > 0 && (
                                  <div className="flex items-center justify-between">
                                    <span className="text-sm font-medium text-gray-900 flex items-center gap-2"><Coins className="h-4 w-4" /> Preço de Venda Unitário:</span>
                                    <span className="text-base font-bold text-indigo-600">
                                      R$ {(form.watch('unitCost') * (1 + form.watch('markup') / 100)).toFixed(2)}
                                    </span>
                                  </div>
                                )}
                              </div>
                            )}
                          </CardContent>
                        </Card>
                      );
                    }
                    
                    // Se usa gerenciamento por lote, mostrar Card de Lotes
                    return (
                    <Card className="border-2 border-indigo-200">
                      <CardHeader className="pb-3">
                        <div className="flex items-center justify-end">
                          <Button
                            type="button"
                            size="sm"
                            onClick={addBatchToEntry}
                            className="inline-flex items-center gap-2 h-9 rounded-md px-3 text-sm font-medium bg-gradient-to-r from-indigo-600 to-purple-600 text-white hover:from-indigo-700 hover:to-purple-700 focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2"
                          >
                            <Plus className="h-4 w-4 mr-1" />
                            Novo Lote
                          </Button>
                        </div>
                      </CardHeader>

                      <CardContent className="space-y-4 max-h-[350px] overflow-y-auto">
                        {selectedBatches.length === 0 ? (
                          <div className="text-center py-8">
                            <Package className="h-12 w-12 mx-auto mb-3 text-gray-400" />
                            <p className="text-gray-600">Nenhum lote cadastrado</p>
                            <p className="text-sm text-gray-500 mt-1">Adicione um lote para começar</p>
                          </div>
                        ) : (
                          <div className="space-y-3">
                          {selectedBatches.map((batch, index) => {
                            const existingBatch = availableBatches.find(b => b.batchNumber === batch.batchNumber);
                            return (
                              <Card key={index} className="hover:shadow-md transition-all border-gray-200">
                                <CardContent className="p-5 space-y-5">
                                  {/* Primeira linha: Lote e Quantidade */}
                                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4 items-start">
                                    <div className="space-y-2">
                                      <div className="flex items-center justify-between gap-2 h-7">
                                        <Label htmlFor={`batch-${index}`} className="text-sm font-medium">
                                          <span className="flex items-center gap-2"><Package className="h-4 w-4" /> Número do Lote</span>
                                        </Label>
                                        <span className="h-7" />
                                      </div>
                                      <Input
                                        id={`batch-${index}`}
                                        type="text"
                                        value={batch.batchNumber || ''}
                                        onChange={async (e) => {
                                          const newBatchNumber = e.target.value.trim();
                                          
                                          // Limpar erro e mensagem de status anteriores
                                          setBatchNumberErrors(prev => {
                                            const newErrors = {...prev};
                                            delete newErrors[index];
                                            return newErrors;
                                          });
                                          setBatchStatusMessages(prev => {
                                            const newMessages = {...prev};
                                            delete newMessages[index];
                                            return newMessages;
                                          });
                                          
                                          // Extrair apenas o número para comparação
                                          const batchNumberMatch = newBatchNumber.match(/\d+/);
                                          const batchNumberValue = batchNumberMatch ? batchNumberMatch[0] : newBatchNumber;
                                          
                                          // Verificar se existe um lote com o mesmo número na lista selecionada (exceto o atual)
                                          const duplicatedBatchIndex = selectedBatches.findIndex((b, i) => {
                                            if (i === index || !b.batchNumber) return false;
                                            const bMatch = b.batchNumber.match(/\d+/);
                                            const bValue = bMatch ? bMatch[0] : b.batchNumber;
                                            return bValue === batchNumberValue && batchNumberValue !== '';
                                          });
                                          
                                          // Se houver lote duplicado na lista, mesclar automaticamente (somar quantidade e remover duplicado)
                                          if (duplicatedBatchIndex !== -1) {
                                            const duplicatedBatch = selectedBatches[duplicatedBatchIndex];
                                            const currentQuantity = batch.quantity || 0;
                                            const duplicatedQuantity = duplicatedBatch.quantity || 0;
                                            const totalQuantity = currentQuantity + duplicatedQuantity;
                                            
                                            // Somar quantidade ao lote existente
                                            setSelectedBatches(prev => {
                                              const updated = [...prev];
                                              // Adicionar quantidade ao lote duplicado
                                              updated[duplicatedBatchIndex] = {
                                                ...updated[duplicatedBatchIndex],
                                                quantity: totalQuantity,
                                              };
                                              // Remover o lote atual (duplicado)
                                              return updated.filter((_, i) => i !== index);
                                            });
                                            
                                            // Limpar mensagens e erros do lote que foi removido
                                            setBatchNumberErrors(prev => {
                                              const newErrors = {...prev};
                                              delete newErrors[index];
                                              // Reindexar erros após remoção
                                              const reindexed: typeof newErrors = {};
                                              Object.keys(newErrors).forEach(key => {
                                                const keyNum = parseInt(key);
                                                if (keyNum > index) {
                                                  reindexed[keyNum - 1] = newErrors[keyNum];
                                                } else if (keyNum < index) {
                                                  reindexed[keyNum] = newErrors[keyNum];
                                                }
                                              });
                                              return reindexed;
                                            });
                                            
                                            setBatchStatusMessages(prev => {
                                              const newMessages = {...prev};
                                              delete newMessages[index];
                                              // Reindexar mensagens após remoção
                                              const reindexed: typeof newMessages = {};
                                              Object.keys(newMessages).forEach(key => {
                                                const keyNum = parseInt(key);
                                                if (keyNum > index) {
                                                  reindexed[keyNum - 1] = newMessages[keyNum];
                                                } else if (keyNum < index) {
                                                  reindexed[keyNum] = newMessages[keyNum];
                                                }
                                              });
                                              return reindexed;
                                            });
                                            
                                            toast({
                                              title: "Lote mesclado",
                                              description: `A quantidade foi somada ao lote "${newBatchNumber}" existente. Total: ${totalQuantity} unidades.`,
                                              duration: 3000,
                                            });
                                            
                                            return; // Não continuar processamento para este lote (foi mesclado)
                                          }
                                          
                                          // Se não há duplicata, limpar mensagens anteriores
                                          setBatchStatusMessages(prev => {
                                            const newMessages = {...prev};
                                            delete newMessages[index];
                                            return newMessages;
                                          });
                                          
                                          updateBatchData(index, 'batchNumber', newBatchNumber);

                                          // Se número corresponde a um lote existente na lista local, preencher datas
                                          const matched = availableBatches.find(b => {
                                            if (!b.batchNumber) return false;
                                            const bMatch = b.batchNumber.match(/\d+/);
                                            const bValue = bMatch ? bMatch[0] : b.batchNumber;
                                            return bValue === batchNumberValue && batchNumberValue !== '';
                                          });
                                          if (matched) {
                                            if (matched.manufactureDate) {
                                              updateBatchData(index, 'manufactureDate', new Date(matched.manufactureDate));
                                            }
                                            if (matched.expiryDate) {
                                              updateBatchData(index, 'expiryDate', new Date(matched.expiryDate));
                                            }
                                          }

                                          // Verificar se o lote existe no banco de dados GLOBALMENTE
                                          if (newBatchNumber && newBatchNumber.trim() !== '' && selectedProductId && user?.id) {
                                            try {
                                              // Buscar lote globalmente primeiro
                                              const existingBatch = await findBatchByNumber(newBatchNumber, user.id);
                                              
                                              if (existingBatch) {
                                                // Lote encontrado (mesmo produto ou outro produto) - produtos diferentes podem estar no mesmo lote
                                                if (existingBatch.productId === selectedProductId) {
                                                  // Lote encontrado para este produto - adicionar quantidade ao lote existente
                                                  setBatchStatusMessages(prev => ({
                                                    ...prev,
                                                    [index]: {
                                                      found: true,
                                                      message: `Lote localizado, adicionar no lote selecionado (Quantidade atual: ${existingBatch.quantity})`
                                                    }
                                                  }));
                                                } else {
                                                  // Lote encontrado para outro produto - permitir criar novo registro com mesmo número (produtos diferentes podem estar no mesmo lote)
                                                  setBatchStatusMessages(prev => ({
                                                    ...prev,
                                                    [index]: {
                                                      found: true,
                                                      message: `Lote localizado, adicionar no lote selecionado`
                                                    }
                                                  }));
                                                }
                                                
                                                // Preencher datas do lote existente se houver
                                                if (existingBatch.expiryDate) {
                                                  updateBatchData(index, 'expiryDate', existingBatch.expiryDate);
                                                }
                                              } else {
                                                // Lote não existe - mostrar mensagem informativa
                                                setBatchStatusMessages(prev => ({
                                                  ...prev,
                                                  [index]: {
                                                    found: false,
                                                    message: `Lote não encontrado. Novo lote será criado.`
                                                  }
                                                }));
                                              }
                                            } catch (error) {
                                              // Em caso de erro, não mostrar mensagem de status
                                              console.error('Erro ao verificar lote:', error);
                                            }
                                          }
                                        }}
                                        onBlur={async () => {
                                          // Se o campo estiver vazio ao perder o foco, gerar automaticamente
                                          if (!batch.batchNumber || batch.batchNumber.trim() === '') {
                                            const nextBatchNumber = await generateNextBatchNumber();
                                            updateBatchData(index, 'batchNumber', nextBatchNumber);
                                            // Limpar erro ao gerar automaticamente
                                            setBatchNumberErrors(prev => {
                                              const newErrors = {...prev};
                                              delete newErrors[index];
                                              return newErrors;
                                            });
                                          }
                                        }}
                                        placeholder={nextBatchNumberSuggestion || "1"}
                                        className={`h-10 font-semibold ${batchNumberErrors[index] ? 'border-2 border-red-500 focus:border-red-500 focus:ring-red-500' : ''}`}
                                      />
                                      {batchNumberErrors[index] ? (
                                        <p className="text-xs text-red-600 bg-red-50 p-2 rounded-md border border-red-200">
                                          {batchNumberErrors[index]}
                                        </p>
                                      ) : batchStatusMessages[index] ? (
                                        <p className={`text-xs p-2 rounded-md border ${
                                          batchStatusMessages[index]?.found
                                            ? 'text-emerald-700 bg-emerald-50 border-emerald-200'
                                            : 'text-blue-700 bg-blue-50 border-blue-200'
                                        }`}>
                                          {batchStatusMessages[index]?.message}
                                        </p>
                                      ) : (
                                        <p className="text-xs text-gray-500">
                                          <span className="flex items-center gap-2"><Info className="h-4 w-4" /> Informe o número do lote. O sistema verificará se já existe.</span>
                                        </p>
                                      )}
                                    </div>
                                    {/* Campo Quantidade */}
                                    <div className="space-y-2">
                                      <div className="flex items-center justify-between gap-2 h-7">
                                        <Label htmlFor={`quantity-${index}`} className="text-sm font-medium">
                                          <span className="flex items-center gap-2"><Hash className="h-4 w-4" /> Quantidade</span>
                                        </Label>
                                        <span className="h-7" />
                                      </div>
                                      <Input
                                        id={`quantity-${index}`}
                                        type="number"
                                        min="1"
                                        placeholder="Ex: 100"
                                        value={batch.quantity === 0 ? '' : (batch.quantity || '')}
                                        onChange={(e) => {
                                          const value = e.target.value;
                                          
                                          // Limpar erro anterior
                                          setQuantityErrors(prev => {
                                            const newErrors = {...prev};
                                            delete newErrors[index];
                                            return newErrors;
                                          });
                                          
                                          if (value === '' || value === null) {
                                            updateBatchData(index, 'quantity', 0);
                                            return;
                                          }
                                          
                                          if (value.match(/^0[1-9]/) && value.length === 2) {
                                            const newValue = value.substring(1);
                                            updateBatchData(index, 'quantity', parseInt(newValue));
                                            return;
                                          }
                                          
                                          const intValue = parseInt(value);
                                          if (!isNaN(intValue)) {
                                            // Buscar o produto selecionado para validar
                                            const selectedProduct = products.find(p => p.id === selectedProductId);
                                            
                                            // Em ENTRADAS, não há limite de quantidade - você está ADICIONANDO estoque ao lote
                                            // A validação de limite de estoque só faz sentido em SAÍDAS (vendas)
                                            
                                            // Calcular total que já está sendo adicionado (soma de todos os lotes exceto o atual)
                                            const totalOtherBatches = selectedBatches
                                              .filter((_, i) => i !== index)
                                              .reduce((sum, b) => sum + (b.quantity || 0), 0);
                                            
                                            const totalQuantity = totalOtherBatches + intValue;
                                            
                                            // Validar se a quantidade excede um limite razoável (ex: 1 milhão como segurança)
                                            const MAX_SAFE_QUANTITY = 1000000;
                                            
                                            if (intValue > MAX_SAFE_QUANTITY) {
                                              setQuantityErrors(prev => ({
                                                ...prev,
                                                [index]: `Quantidade não permitida! O valor máximo permitido é ${MAX_SAFE_QUANTITY.toLocaleString('pt-BR')} unidades.`
                                              }));
                                              toast({
                                                title: "Quantidade Inválida",
                                                description: `A quantidade ${intValue.toLocaleString('pt-BR')} excede o limite máximo permitido de ${MAX_SAFE_QUANTITY.toLocaleString('pt-BR')} unidades.`,
                                                variant: "destructive",
                                                duration: 3000,
                                              });
                                              return;
                                            }
                                            
                                            // Se há produto selecionado, verificar se há limite de estoque máximo
                                            if (selectedProduct && (selectedProduct as any)?.maxStock) {
                                              const maxStock = (selectedProduct as any).maxStock;
                                              if (totalQuantity > maxStock) {
                                                setQuantityErrors(prev => ({
                                                  ...prev,
                                                  [index]: `Quantidade não permitida! O total de ${totalQuantity.toLocaleString('pt-BR')} unidades excede o estoque máximo de ${maxStock.toLocaleString('pt-BR')} unidades para este produto.`
                                                }));
                                                toast({
                                                  title: "Quantidade Excede Limite",
                                                  description: `O total de ${totalQuantity.toLocaleString('pt-BR')} unidades excede o estoque máximo de ${maxStock.toLocaleString('pt-BR')} unidades para este produto.`,
                                                  variant: "destructive",
                                                  duration: 3000,
                                                });
                                                return;
                                              }
                                            }
                                            
                                            updateBatchData(index, 'quantity', intValue);
                                          }
                                        }}
                                        className={`h-10 font-semibold ${quantityErrors[index] ? 'border-2 border-red-500 focus:border-red-500 focus:ring-red-500' : ''}`}
                                      />
                                      {quantityErrors[index] ? (
                                        <p className="text-xs text-red-600 bg-red-50 p-2 rounded-md border border-red-200">
                                          {quantityErrors[index]}
                                        </p>
                                      ) : (
                                        <p className="text-xs text-gray-500">
                                          <span className="flex items-center gap-2"><Info className="h-4 w-4" /> Informe a quantidade de unidades</span>
                                        </p>
                                      )}
                                    </div>
                                  </div>

                                  {/* Segunda linha: Custo Unitário e Datas */}
                                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                                    {/* Custo Unitário */}
                                    <div className="space-y-2">
                                      <Label htmlFor={`unitCost-${index}`} className="text-sm font-medium">
                                        <span className="flex items-center gap-2"><Coins className="h-4 w-4" /> Custo Unitário (R$)</span>
                                      </Label>
                                      <Input
                                        type="number"
                                        step="0.01"
                                        min="0"
                                        placeholder="0.00"
                                        value={batch.unitCost === 0 ? '' : (batch.unitCost || '')}
                                        onChange={(e) => {
                                          const value = e.target.value;
                                          
                                          if (value === '' || value === null) {
                                            updateBatchData(index, 'unitCost', 0);
                                            return;
                                          }
                                          
                                          if (value.match(/^0[1-9]/) && value.length === 2) {
                                            const newValue = value.substring(1);
                                            updateBatchData(index, 'unitCost', parseFloat(newValue));
                                            return;
                                          }
                                          
                                          const numValue = parseFloat(value);
                                          if (!isNaN(numValue)) {
                                            updateBatchData(index, 'unitCost', numValue);
                                          }
                                        }}
                                        className="h-10"
                                      />
                                    </div>

                                    {/* Data de Fabricação */}
                                    <div className="space-y-2">
                                      <Label htmlFor={`manufacture-${index}`} className="text-sm font-medium">
                                        <span className="flex items-center gap-2"><Factory className="h-4 w-4" /> Data de Fabricação</span>
                                      </Label>
                                      <Input
                                        id={`manufacture-${index}`}
                                        type="text"
                                        placeholder="DD/MM/AAAA"
                                        value={dateTextValues[`manu-${index}`] || (batch.manufactureDate ? (
                                          batch.manufactureDate instanceof Date 
                                            ? batch.manufactureDate.toLocaleDateString('pt-BR', { day: '2-digit', month: '2-digit', year: 'numeric' })
                                            : batch.manufactureDate
                                        ) : '')}
                                        onChange={(e) => {
                                          let value = e.target.value;
                                          value = value.replace(/[^0-9\/]/g, '');
                                          
                                          const numbers = value.replace(/\D/g, '');
                                          if (numbers.length <= 2) {
                                            value = numbers;
                                          } else if (numbers.length <= 4) {
                                            value = numbers.slice(0, 2) + '/' + numbers.slice(2);
                                          } else {
                                            value = numbers.slice(0, 2) + '/' + numbers.slice(2, 4) + '/' + numbers.slice(4, 8);
                                          }
                                          
                                          setDateTextValues(prev => ({ ...prev, [`manu-${index}`]: value }));
                                          
                                          if (value.length === 0) {
                                            updateBatchData(index, 'manufactureDate', undefined);
                                            return;
                                          }
                                          
                                          if (value.length === 10) {
                                            const [day, month, year] = value.split('/');
                                            if (day && month && year && day.length === 2 && month.length === 2 && year.length === 4) {
                                              const date = new Date(parseInt(year), parseInt(month) - 1, parseInt(day));
                                              if (!isNaN(date.getTime())) {
                                                updateBatchData(index, 'manufactureDate', date);
                                                setTimeout(() => setDateTextValues(prev => {
                                                  const newVal = {...prev};
                                                  delete newVal[`manu-${index}`];
                                                  return newVal;
                                                }), 100);
                                              }
                                            }
                                          }
                                        }}
                                        className="h-10"
                                        maxLength={10}
                                      />
                                      <p className="text-xs text-gray-500">
                                        {existingBatch ? <span className="flex items-center gap-2"><CheckCircle className="h-4 w-4 text-green-600" /> Data do lote existente</span> : <span className="flex items-center gap-2"><Info className="h-4 w-4" /> DD/MM/AAAA</span>}
                                      </p>
                                    </div>

                                    {/* Data de Validade */}
                                    <div className="space-y-2">
                                      <Label htmlFor={`expiry-${index}`} className="text-sm font-medium">
                                        <span className="flex items-center gap-2"><Clock className="h-4 w-4" /> Data de Validade</span>
                                      </Label>
                                      <Input
                                        id={`expiry-${index}`}
                                        type="text"
                                        placeholder="DD/MM/AAAA"
                                        value={dateTextValues[`exp-${index}`] || (batch.expiryDate ? (
                                          batch.expiryDate instanceof Date 
                                            ? batch.expiryDate.toLocaleDateString('pt-BR', { day: '2-digit', month: '2-digit', year: 'numeric' })
                                            : batch.expiryDate
                                        ) : '')}
                                        onChange={(e) => {
                                          let value = e.target.value;
                                          
                                          // Remove caracteres que não são dígitos ou /
                                          value = value.replace(/[^0-9\/]/g, '');
                                          
                                          // Limita a 8 dígitos
                                          const numbers = value.replace(/\D/g, '');
                                          if (numbers.length <= 2) {
                                            value = numbers;
                                          } else if (numbers.length <= 4) {
                                            value = numbers.slice(0, 2) + '/' + numbers.slice(2);
                                          } else {
                                            value = numbers.slice(0, 2) + '/' + numbers.slice(2, 4) + '/' + numbers.slice(4, 8);
                                          }
                                          
                                          // Atualiza o estado de texto
                                          setDateTextValues(prev => ({ ...prev, [`exp-${index}`]: value }));
                                          
                                          // Se vazio, limpa a data
                                          if (value.length === 0) {
                                            updateBatchData(index, 'expiryDate', undefined);
                                            return;
                                          }
                                          
                                          // Converte para Date quando estiver completo (DD/MM/YYYY = 10 caracteres)
                                          if (value.length === 10) {
                                            const [day, month, year] = value.split('/');
                                            if (day && month && year && day.length === 2 && month.length === 2 && year.length === 4) {
                                              const date = new Date(parseInt(year), parseInt(month) - 1, parseInt(day));
                                              if (!isNaN(date.getTime())) {
                                                updateBatchData(index, 'expiryDate', date);
                                                // Limpa o valor de texto quando converte com sucesso
                                                setTimeout(() => setDateTextValues(prev => {
                                                  const newVal = {...prev};
                                                  delete newVal[`exp-${index}`];
                                                  return newVal;
                                                }), 100);
                                              }
                                            }
                                          }
                                        }}
                                        className="h-10"
                                        maxLength={10}
                                      />
                                      <p className="text-xs text-gray-500">
                                        {existingBatch ? <span className="flex items-center gap-2"><CheckCircle className="h-4 w-4 text-green-600" /> Data do lote existente</span> : <span className="flex items-center gap-2"><Info className="h-4 w-4" /> DD/MM/AAAA</span>}
                                      </p>
                                    </div>
                                  </div>
                                  {/* Botão Remover */}
                                  <div className="flex gap-2 pt-3 border-t border-gray-200">
                                    <Button
                                      type="button"
                                      size="sm"
                                      onClick={() => removeBatchFromEntry(index)}
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
                            <Card className="bg-gradient-to-r from-indigo-50 to-purple-50 border-indigo-200">
                              <CardContent className="p-4 space-y-2">
                                <div className="flex items-center justify-between">
                                  <span className="text-sm font-medium text-gray-900">
                                    <span className="flex items-center gap-2"><BarChart3 className="h-4 w-4" /> Total a Entrar:</span>
                                  </span>
                                  <span className="text-lg font-bold text-indigo-600">
                                    {getTotalBatchQuantity()} unidades
                                  </span>
                                </div>
                                <div className="flex items-center justify-between pt-2 border-t border-indigo-200">
                                  <span className="text-sm font-medium text-gray-900">
                                    <span className="flex items-center gap-2"><Coins className="h-4 w-4" /> Valor Total:</span>
                                  </span>
                                  <span className="text-lg font-bold text-emerald-600">
                                    R$ {selectedBatches.reduce((total, batch) => total + (batch.quantity * (batch.unitCost || 0)), 0).toFixed(2)}
                                  </span>
                                </div>
                                {selectedBatches.length > 0 && (() => {
                                  const totalCost = selectedBatches.reduce((total, batch) => total + (batch.quantity * (batch.unitCost || 0)), 0);
                                  const totalQuantity = getTotalBatchQuantity();
                                  const averageCost = totalQuantity > 0 ? totalCost / totalQuantity : 0;
                                  const markup = form.watch('markup') || 0;
                                  const salePrice = markup > 0 && averageCost > 0 ? averageCost * (1 + markup / 100) : 0;
                                  
                                  return (
                                    <>
                                      {markup > 0 && averageCost > 0 && (
                                        <div className="flex items-center justify-between pt-2 border-t border-indigo-200">
                                          <span className="text-sm font-medium text-gray-900">
                                            <span className="flex items-center gap-2"><Coins className="h-4 w-4" /> Custo Médio Unitário:</span>
                                          </span>
                                          <span className="text-base font-semibold text-indigo-600">
                                            R$ {averageCost.toFixed(2)}
                                          </span>
                                        </div>
                                      )}
                                      {salePrice > 0 && (
                                        <div className="flex items-center justify-between pt-2 border-t border-indigo-200">
                                          <span className="text-sm font-medium text-gray-900">
                                            <span className="flex items-center gap-2"><Coins className="h-4 w-4" /> Preço de Venda Unitário:</span>
                                          </span>
                                          <span className="text-base font-bold text-emerald-600">
                                            R$ {salePrice.toFixed(2)}
                                          </span>
                                        </div>
                                      )}
                                    </>
                                  );
                                })()}
                              </CardContent>
                            </Card>
                            
                            {/* Campo de Markup para produtos com lote */}
                            <Card className="border-2 border-indigo-200">
                              <CardHeader className="pb-3">
                                <CardTitle className="text-base font-semibold text-gray-900">
                                  <span className="flex items-center gap-2"><TrendingUp className="h-4 w-4" /> Configuração de Preço de Venda</span>
                                </CardTitle>
                              </CardHeader>
                              <CardContent>
                                <FormField
                                  control={form.control}
                                  name="markup"
                                  render={({ field }) => (
                                    <FormItem className="space-y-2">
                                      <FormLabel className="text-sm font-semibold text-neutral-700">
                                        <span className="flex items-center gap-2"><TrendingUp className="h-4 w-4" /> Markup (%) - Percentual para calcular preço de venda</span>
                                      </FormLabel>
                                      <FormControl>
                                        <Input
                                          type="number"
                                          step="0.1"
                                          min="0"
                                          placeholder="Ex: 30 (para 30% de margem)"
                                          {...field}
                                          onChange={(e) => {
                                            const value = e.target.value;
                                            if (value === '' || value === null) {
                                              field.onChange(0);
                                              return;
                                            }
                                            const numValue = parseFloat(value);
                                            if (!isNaN(numValue) && numValue >= 0) {
                                              field.onChange(numValue);
                                            }
                                          }}
                                          value={field.value === undefined || field.value === null || field.value === 0 ? '' : field.value}
                                          className="h-11 sm:h-10 border-2 border-neutral-200 rounded-xl focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 text-base sm:text-sm"
                                        />
                                      </FormControl>
                                      <FormMessage />
                                      {(() => {
                                        const totalCost = selectedBatches.reduce((total, batch) => total + (batch.quantity * (batch.unitCost || 0)), 0);
                                        const totalQuantity = getTotalBatchQuantity();
                                        const averageCost = totalQuantity > 0 ? totalCost / totalQuantity : 0;
                                        const markup = field.value || 0;
                                        const salePrice = markup > 0 && averageCost > 0 ? averageCost * (1 + markup / 100) : 0;
                                        
                                        return (
                                          markup > 0 && averageCost > 0 && (
                                            <p className="text-xs text-emerald-600 font-medium mt-2">
                                              <span className="flex items-center gap-2"><Coins className="h-4 w-4" /> Preço de Venda Calculado: R$ {salePrice.toFixed(2)} (Custo médio: R$ {averageCost.toFixed(2)} + {markup}%)</span>
                                            </p>
                                          )
                                        );
                                      })()}
                                    </FormItem>
                                  )}
                                />
                              </CardContent>
                            </Card>
                            
                            {/* Campo de Forma de Pagamento para produtos com lote */}
                            <FormField
                              control={form.control}
                              name="paymentMethod"
                              render={({ field }) => (
                                <FormItem className="space-y-2">
                                  <FormLabel className="text-sm font-semibold text-neutral-700">
                                    💳 Forma de Pagamento
                                  </FormLabel>
                                  <FormControl>
                                    <Select
                                      value={field.value || "avista"}
                                      onValueChange={field.onChange}
                                    >
                                      <SelectTrigger className="h-11 sm:h-10 border-2 border-neutral-200 rounded-xl focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 text-base sm:text-sm">
                                        <SelectValue placeholder="Selecione a forma de pagamento" />
                                      </SelectTrigger>
                                      <SelectContent>
                                        <SelectItem value="avista"><span className="flex items-center gap-2"><DollarSign className="h-4 w-4" /> À vista</span></SelectItem>
                                        <SelectItem value="pix"><span className="flex items-center gap-2"><Smartphone className="h-4 w-4" /> PIX</span></SelectItem>
                                        <SelectItem value="debito"><span className="flex items-center gap-2"><CreditCard className="h-4 w-4" /> Débito</span></SelectItem>
                                        <SelectItem value="credito"><span className="flex items-center gap-2"><CreditCard className="h-4 w-4" /> Crédito</span></SelectItem>
                                        <SelectItem value="boleto"><span className="flex items-center gap-2"><FileText className="h-4 w-4" /> Boleto</span></SelectItem>
                                        <SelectItem value="cheque"><span className="flex items-center gap-2"><FileText className="h-4 w-4" /> Cheque</span></SelectItem>
                                        <SelectItem value="transferencia"><span className="flex items-center gap-2"><Upload className="h-4 w-4" /> Transferência</span></SelectItem>
                                        <SelectItem value="parcelado"><span className="flex items-center gap-2"><BarChart3 className="h-4 w-4" /> Parcelado</span></SelectItem>
                                      </SelectContent>
                                    </Select>
                                  </FormControl>
                                  <FormMessage />
                                </FormItem>
                              )}
                            />
                            {form.watch("paymentMethod") === "parcelado" && (
                              <FormField
                                control={form.control}
                                name="installments"
                                render={({ field }) => (
                                  <FormItem className="space-y-2">
                                    <FormLabel className="text-sm font-semibold text-neutral-700">
                                      <span className="flex items-center gap-2"><BarChart3 className="h-4 w-4" /> Quantidade de Parcelas</span>
                                    </FormLabel>
                                    <FormControl>
                                      <Select 
                                        value={String(field.value || 1)} 
                                        onValueChange={(v) => field.onChange(Number(v))}
                                      >
                                        <SelectTrigger className="h-11 sm:h-10 border-2 border-neutral-200 rounded-xl focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 text-base sm:text-sm">
                                          <SelectValue />
                                        </SelectTrigger>
                                        <SelectContent>
                                          {Array.from({ length: 12 }, (_, i) => i + 1).map((n) => (
                                            <SelectItem key={n} value={String(n)}>
                                              {n}x
                                            </SelectItem>
                                          ))}
                                        </SelectContent>
                                      </Select>
                                    </FormControl>
                                    <FormMessage />
                                  </FormItem>
                                )}
                              />
                            )}
                          </div>
                        )}
                      </CardContent>
                    </Card>
                    );
                  })()}
                  
                  {/* Segunda linha - Data de Entrada */}
                  <FormField
                    control={form.control}
                    name="entryDate"
                    render={({ field }) => (
                      <FormItem className="space-y-3">
                        <FormLabel className="text-base sm:text-sm font-semibold text-neutral-700">
                          <span className="flex items-center gap-2"><Calendar className="h-4 w-4" /> Data da Compra</span>
                        </FormLabel>
                        <FormControl>
                          <Input 
                            type="date" 
                            {...field}
                            value={field.value instanceof Date ? field.value.toISOString().split('T')[0] : ''}
                            onChange={(e) => field.onChange(new Date(e.target.value))}
                            className="h-11 sm:h-10 border-2 border-neutral-200 rounded-xl focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 text-base sm:text-sm"
                          />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  
                  {/* Campo de Observações */}
                  <FormField
                    control={form.control}
                    name="notes"
                    render={({ field }) => (
                      <FormItem className="space-y-3">
                        <FormLabel className="text-sm font-semibold text-neutral-700">
                          <span className="flex items-center gap-2"><FileText className="h-4 w-4" /> Observações</span>
                        </FormLabel>
                        <FormControl>
                          <Textarea 
                            placeholder="Observações adicionais sobre a compra..." 
                            {...field}
                            rows={3}
                            className="min-h-[80px] border-2 border-neutral-200 rounded-xl focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 text-base sm:text-sm resize-none"
                          />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  </div>
                  
                  {/* Carrinho dentro do Dialog */}
                  {cartItems.length > 0 && (
                    <div className="px-6 pt-2 pb-4">
                      <RenderCart compact={true} />
                    </div>
                  )}
                  
                  {/* Footer do Modal - Botões: Cancelar, Adicionar ao Carrinho e Registrar */}
                  <div className="flex flex-col sm:flex-row justify-center items-stretch sm:items-center gap-2 px-3 sm:px-4 lg:px-6 py-3 border-t border-neutral-200 bg-white flex-shrink-0 min-h-[60px] overflow-visible w-full">
                    {/* Botão Cancelar - Sempre visível */}
                    <Button 
                      type="button" 
                      variant="outline" 
                      onClick={() => {
                        setIsAddDialogOpen(false);
                        setBatchNumberErrors({});
                        setCartItems([]);
                        setSelectedProductId("");
                        setSelectedBatches([]);
                        form.reset();
                      }}
                      className="!flex !w-full sm:!w-auto border-2 border-neutral-300 text-neutral-700 hover:bg-neutral-50 h-9 text-xs sm:text-sm !flex-shrink-0 whitespace-nowrap min-w-[90px] !items-center !justify-center"
                    >
                      <span className="flex items-center gap-2"><X className="h-4 w-4" /> Cancelar</span>
                    </Button>
                    
                    {/* Botão Adicionar ao Carrinho - Sempre visível */}
                    <Button 
                      type="button"
                      onClick={addCurrentSelectionToCart}
                      className="!flex !w-full sm:!w-auto px-3 sm:px-4 bg-gradient-to-r from-indigo-600 to-indigo-700 hover:from-indigo-700 hover:to-indigo-800 text-white shadow-lg hover:shadow-xl transition-all duration-200 h-9 text-xs sm:text-sm !flex-shrink-0 whitespace-nowrap min-w-[140px] !items-center !justify-center"
                      disabled={(() => {
                        const selectedProduct = products.find(p => p.id === selectedProductId);
                        if (!selectedProduct) return true;
                        const managedByBatch = (selectedProduct as any)?.managedByBatch === true;
                        if (managedByBatch) {
                          const totalQty = selectedBatches.reduce((s, b) => s + (b.quantity || 0), 0);
                          return totalQty <= 0;
                        }
                        return (form.getValues('quantity') || 0) <= 0 || (form.getValues('unitCost') || 0) <= 0;
                      })()}
                    >
                      <span className="flex items-center gap-2"><Plus className="h-4 w-4" /> Adicionar ao Carrinho</span>
                    </Button>
                    
                                          {/* Botão Registrar - Habilitado quando há itens no carrinho ou seleção válida */}
                      <Button 
                        type="button"
                        onClick={processCartEntry}
                        className="!flex !w-full sm:!w-auto px-3 sm:px-4 bg-gradient-to-r from-green-600 to-green-700 hover:from-green-700 hover:to-green-800 text-white shadow-lg hover:shadow-xl transition-all duration-200 h-9 text-xs sm:text-sm !flex-shrink-0 whitespace-nowrap min-w-[140px] !items-center !justify-center"
                        disabled={(() => {
                          // Se há itens no carrinho, sempre habilitado
                          if (cartItems.length > 0) return false;
                          
                          // Se não há itens no carrinho, verificar se há seleção válida
                          const selectedProduct = products.find(p => p.id === selectedProductId);
                          if (!selectedProduct) return true;
                          
                          const managedByBatch = (selectedProduct as any)?.managedByBatch === true;
                          if (managedByBatch) {
                            const totalQty = selectedBatches.reduce((s, b) => s + (b.quantity || 0), 0);
                            return totalQty <= 0;
                          }
                          return (form.getValues('quantity') || 0) <= 0 || (form.getValues('unitCost') || 0) <= 0;
                        })()}
                      >
                        <span className="flex items-center gap-2"><CheckCircle className="h-4 w-4" /> Registrar</span>
                      </Button>
                  </div>
                </form>
              </Form>
            </DialogContent>
          </Dialog>
        </div>
      </div>
      
      {/* Cards de Estatísticas com Design Moderno */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 sm:gap-6 lg:gap-8">
        <div className="group bg-gradient-to-br from-indigo-100 to-indigo-200 rounded-2xl sm:rounded-3xl p-4 sm:p-6 text-indigo-800 shadow-lg hover:shadow-xl transition-all duration-300 hover:scale-105 border border-indigo-200/50">
          <div className="flex items-center justify-between mb-3 sm:mb-4">
            <div className="w-10 h-10 sm:w-12 sm:h-12 bg-indigo-300/50 rounded-xl sm:rounded-2xl flex items-center justify-center backdrop-blur-sm">
              <TrendingUp className="w-5 h-5 sm:w-6 sm:h-6 text-indigo-700" />
            </div>
            <div className="text-right">
              <div className="text-2xl sm:text-3xl font-black">{totalEntries.toLocaleString()}</div>
              <div className="text-xs sm:text-sm opacity-90">Total</div>
            </div>
          </div>
          <h3 className="text-base sm:text-lg font-semibold mb-2 flex items-center gap-2"><TrendingUp className="h-4 w-4" /> Total de Compras</h3>
          <p className="text-xs sm:text-sm opacity-80">Registros no sistema</p>
        </div>
        
        <div className="group bg-gradient-to-br from-emerald-100 to-emerald-200 rounded-2xl sm:rounded-3xl p-4 sm:p-6 text-emerald-800 shadow-lg hover:shadow-xl transition-all duration-300 hover:scale-105 border border-emerald-200/50">
          <div className="flex items-center justify-between mb-3 sm:mb-4">
            <div className="w-10 h-10 sm:w-12 sm:h-12 bg-emerald-300/50 rounded-xl sm:rounded-2xl flex items-center justify-center backdrop-blur-sm">
              <DollarSign className="w-5 h-5 sm:w-6 sm:h-6 text-emerald-700" />
            </div>
            <div className="text-right">
              <div className="text-2xl sm:text-3xl font-black">R$ {totalValue.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}</div>
              <div className="text-xs sm:text-sm opacity-90">Valor</div>
            </div>
          </div>
          <h3 className="text-base sm:text-lg font-semibold mb-2 flex items-center gap-2"><Coins className="h-4 w-4" /> Valor Total</h3>
          <p className="text-xs sm:text-sm opacity-80">Investimento total</p>
        </div>
        
        <div className="group bg-gradient-to-br from-violet-100 to-violet-200 rounded-2xl sm:rounded-3xl p-4 sm:p-6 text-violet-800 shadow-lg hover:shadow-xl transition-all duration-300 hover:scale-105 border border-violet-200/50 sm:col-span-2 lg:col-span-1">
          <div className="flex items-center justify-between mb-3 sm:mb-4">
            <div className="w-10 h-10 sm:w-12 sm:h-12 bg-violet-300/50 rounded-xl sm:rounded-2xl flex items-center justify-center backdrop-blur-sm">
              <Calendar className="w-5 h-5 sm:w-6 sm:h-6 text-violet-700" />
            </div>
            <div className="text-right">
              <div className="text-2xl sm:text-3xl font-black">{thisMonthEntries}</div>
              <div className="text-xs sm:text-sm opacity-90">Mês</div>
            </div>
          </div>
          <h3 className="text-base sm:text-lg font-semibold mb-2 flex items-center gap-2"><Calendar className="h-4 w-4" /> Este Mês</h3>
          <p className="text-xs sm:text-sm opacity-80">Compras do período</p>
        </div>
      </div>

      {/* Barra de Busca e Filtros com Design Profissional */}
      <Card className="bg-white border-0 shadow-xl rounded-2xl sm:rounded-3xl overflow-hidden">
        <CardContent className="p-4 sm:p-6 md:p-8">
          <div className="flex flex-col md:flex-row gap-4 sm:gap-6 items-center justify-between">
            <div className="relative flex-1 max-w-md w-full">
              <Search className="absolute left-3 sm:left-4 top-1/2 transform -translate-y-1/2 text-neutral-400 w-4 h-4 sm:w-5 sm:h-5" />
              <Input
                placeholder="Buscar entradas por produto ou fornecedor..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-10 sm:pl-12 h-11 sm:h-14 border-2 border-neutral-200 rounded-xl sm:rounded-2xl focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 bg-neutral-50"
              />
            </div>
            
            <div className="flex flex-col sm:flex-row gap-2 sm:gap-4 w-full md:w-auto">
              <Button 
                variant="outline" 
                onClick={applyFilters}
                className="w-full sm:w-auto border-2 border-neutral-300 text-neutral-700 hover:bg-indigo-50 hover:border-indigo-300 px-4 sm:px-6 py-2 sm:py-3 rounded-xl sm:rounded-2xl"
              >
                <Filter className="w-4 h-4 mr-2" />
                Filtros
              </Button>
              <Button 
                variant="outline" 
                onClick={exportToCSV}
                className="w-full sm:w-auto border-2 border-neutral-300 text-neutral-700 hover:bg-indigo-50 hover:border-indigo-300 px-4 sm:px-6 py-2 sm:py-3 rounded-xl sm:rounded-2xl"
              >
                <Download className="w-4 h-4 mr-2" />
                Exportar CSV
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Tabela de Entradas com Design Elegante */}
      <Card className="shadow-lg">
        <CardHeader className="bg-gradient-to-r from-indigo-50 to-purple-50">
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2">
            <div>
              <CardTitle className="flex items-center gap-2">
                <FileText className="w-5 h-5 text-blue-600" />
                Lista de Compras
              </CardTitle>
              <CardDescription>Gerencie suas compras cadastradas</CardDescription>
            </div>
          </div>
        </CardHeader>
        <CardContent className="p-0">
          <div className="overflow-x-auto">
            <Table className="w-full">
              <TableHeader className="bg-neutral-50">
                <TableRow className="border-neutral-200 hover:bg-neutral-100">
                  <TableHead className="font-semibold text-neutral-700 py-4 sm:py-6 px-2 sm:px-4 text-xs sm:text-sm">Produto</TableHead>
                  <TableHead className="font-semibold text-neutral-700 py-4 sm:py-6 px-2 sm:px-4 text-xs sm:text-sm">Validade</TableHead>
                  <TableHead className="font-semibold text-neutral-700 py-4 sm:py-6 px-2 sm:px-4 text-xs sm:text-sm hidden sm:table-cell">Fornecedor</TableHead>
                  <TableHead className="font-semibold text-neutral-700 py-4 sm:py-6 px-2 sm:px-4 text-xs sm:text-sm">Qtd</TableHead>
                  <TableHead className="font-semibold text-neutral-700 py-4 sm:py-6 px-2 sm:px-4 text-xs sm:text-sm hidden md:table-cell">Custo Unit.</TableHead>
                  <TableHead className="font-semibold text-neutral-700 py-4 sm:py-6 px-2 sm:px-4 text-xs sm:text-sm">Total</TableHead>
                  <TableHead className="font-semibold text-neutral-700 py-4 sm:py-6 px-2 sm:px-4 text-xs sm:text-sm hidden lg:table-cell">Data</TableHead>
                  <TableHead className="font-semibold text-neutral-700 py-4 sm:py-6 px-2 sm:px-4 text-xs sm:text-sm">Status</TableHead>
                  <TableHead className="font-semibold text-neutral-700 py-4 sm:py-6 px-2 sm:px-4 text-xs sm:text-sm text-right">Ações</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredEntries.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={8} className="text-center py-12 sm:py-16 lg:py-20 px-4 sm:px-6 lg:px-8">
                      <div className="space-y-3 sm:space-y-4 lg:space-y-6">
                        <Package className="w-12 h-12 sm:w-16 sm:h-16 lg:w-20 lg:h-20 mx-auto text-neutral-300" />
                        <div className="space-y-2">
                          <p className="text-lg sm:text-xl lg:text-2xl font-medium text-neutral-600">
                            Nenhuma compra encontrada
                          </p>
                          <p className="text-sm sm:text-base text-neutral-500 max-w-md mx-auto">
                            Comece registrando sua primeira compra de estoque para manter o controle do seu inventário
                          </p>
                        </div>
                        <div className="pt-2 sm:pt-4">
                          <Button 
                            onClick={() => setIsAddDialogOpen(true)}
                            className="bg-gradient-to-r from-indigo-600 to-indigo-700 hover:from-indigo-700 hover:to-indigo-800 text-white px-4 sm:px-6 py-2 sm:py-3 rounded-xl sm:rounded-2xl shadow-lg hover:shadow-xl transition-all duration-200"
                          >
                            <Plus className="w-4 h-4 sm:w-5 sm:h-5 mr-2" />
                            Registrar Primeira Compra
                          </Button>
                        </div>
                      </div>
                    </TableCell>
                  </TableRow>
                ) : (
                  filteredEntries.map((entry) => (
                  <TableRow key={entry.id} className="border-neutral-100 hover:bg-neutral-50 transition-colors duration-150">
                      <TableCell className="py-4 sm:py-6 px-2 sm:px-4">
                        <div className="space-y-1 sm:space-y-2">
                          <div className="font-semibold text-neutral-900 text-sm sm:text-base">{entry.productName}</div>
                          <div className="text-xs sm:text-sm text-neutral-500 font-mono">{entry.productSku}</div>
                        </div>
                      </TableCell>
                    <TableCell className="py-4 sm:py-6 px-2 sm:px-4">
                      {(() => {
                        const rawExpiry = (entry as any).expiryDate as Date | string | undefined;
                        const rawManu = (entry as any).manufactureDate as Date | string | undefined;
                        
                        // Se não há validade, mostrar data da compra como fallback
                        if (!rawExpiry) {
                          return (
                            <div className="flex items-center gap-2">
                              <span className="text-xs text-neutral-500">
                                {new Date(entry.entryDate).toLocaleDateString('pt-BR')}
                              </span>
                              <span className="text-xs text-neutral-400">(sem validade)</span>
                            </div>
                          );
                        }
                        
                        const expiryDate = rawExpiry instanceof Date ? rawExpiry : new Date(rawExpiry);
                        if (isNaN(expiryDate.getTime())) {
                          // Se a data é inválida, mostrar data da compra
                          return (
                            <div className="flex items-center gap-2">
                              <span className="text-xs text-neutral-500">
                                {new Date(entry.entryDate).toLocaleDateString('pt-BR')}
                              </span>
                              <span className="text-xs text-neutral-400">(sem validade)</span>
                            </div>
                          );
                        }
                        const manuDate = rawManu ? (rawManu instanceof Date ? rawManu : new Date(rawManu)) : undefined;

                        // Se tiver FAB e EXP, exibir prazo total (EXP - FAB). Caso contrário, exibir restante até hoje
                        let badgeClass = 'bg-emerald-100 text-emerald-700 border-emerald-200';
                        let label = '';
                        if (manuDate && !isNaN(manuDate.getTime())) {
                          const startFab = new Date(manuDate.getFullYear(), manuDate.getMonth(), manuDate.getDate()).getTime();
                          const endExp = new Date(expiryDate.getFullYear(), expiryDate.getMonth(), expiryDate.getDate()).getTime();
                          const diffDaysTotal = Math.round((endExp - startFab) / (1000 * 60 * 60 * 24));
                          label = `Validade: ${humanizeDaysDiff(diffDaysTotal)}`;
                          // cor neutra/positiva para prazo total
                          badgeClass = 'bg-blue-100 text-blue-700 border-blue-200';
                        } else {
                          const today = new Date();
                          const start = new Date(today.getFullYear(), today.getMonth(), today.getDate()).getTime();
                          const end = new Date(expiryDate.getFullYear(), expiryDate.getMonth(), expiryDate.getDate()).getTime();
                          const diffDays = Math.round((end - start) / (1000 * 60 * 60 * 24));
                          const isExpired = diffDays < 0;
                          const isToday = diffDays === 0;
                          badgeClass = isExpired
                            ? 'bg-red-100 text-red-700 border-red-200'
                            : isToday
                              ? 'bg-amber-100 text-amber-700 border-amber-200'
                              : diffDays <= 7
                                ? 'bg-orange-100 text-orange-700 border-orange-200'
                                : 'bg-emerald-100 text-emerald-700 border-emerald-200';
                          label = isExpired
                            ? `Vencido há ${humanizeDaysDiff(diffDays)}`
                            : isToday
                              ? 'Vence hoje'
                              : `Faltam ${humanizeDaysDiff(diffDays)}`;
                        }
                        return (
                          <div className="flex items-center gap-2">
                            <span className="text-xs text-neutral-600">{expiryDate.toLocaleDateString('pt-BR')}</span>
                            <span className={`inline-flex items-center px-2 py-1 rounded-md border text-[11px] font-medium ${badgeClass}`}>
                              <span className="ml-1">{label}</span>
                            </span>
                          </div>
                        );
                      })()}
                    </TableCell>
                      <TableCell className="py-4 sm:py-6 px-2 sm:px-4 hidden sm:table-cell">
                        <span className="font-medium text-neutral-700 text-sm sm:text-base">{entry.supplier}</span>
                      </TableCell>
                      <TableCell className="py-4 sm:py-6 px-2 sm:px-4">
                        <span className="font-semibold text-neutral-900 text-sm sm:text-base">{entry.quantity.toLocaleString()}</span>
                      </TableCell>
                      <TableCell className="py-4 sm:py-6 px-2 sm:px-4 hidden md:table-cell">
                        <span className="font-medium text-neutral-700 text-sm sm:text-base">R$ {entry.unitCost.toFixed(2)}</span>
                      </TableCell>
                      <TableCell className="py-4 sm:py-6 px-2 sm:px-4">
                        <span className="font-bold text-emerald-600 text-sm sm:text-base">R$ {entry.totalCost.toFixed(2)}</span>
                      </TableCell>
                      <TableCell className="py-4 sm:py-6 px-2 sm:px-4 hidden lg:table-cell">
                        <span className="text-neutral-600 text-sm sm:text-base">{new Date(entry.entryDate).toLocaleDateString('pt-BR')}</span>
                      </TableCell>
                      <TableCell className="py-4 sm:py-6 px-2 sm:px-4">
                        <Badge 
                          variant={
                            entry.status === "aprovado" ? "default" : 
                            entry.status === "pendente" ? "secondary" : "destructive"
                          }
                          className="font-medium px-2 sm:px-4 py-1 sm:py-2 rounded-full text-xs sm:text-sm"
                        >
                          {entry.status === "aprovado" && <span className="flex items-center gap-1"><CheckCircle className="h-4 w-4 text-green-600" /> Aprovado</span>}
                          {entry.status === "pendente" && <span className="flex items-center gap-1"><Clock className="h-4 w-4 text-yellow-600" /> Pendente</span>}
                          {entry.status === "cancelado" && <span className="flex items-center gap-1"><X className="h-4 w-4 text-red-600" /> Cancelado</span>}
                        </Badge>
                      </TableCell>
                      <TableCell className="py-4 sm:py-6 px-2 sm:px-4 text-right">
                        <div className="flex items-center justify-end space-x-1 sm:space-x-3">
                          <Button 
                            variant="ghost" 
                            size="sm"
                            onClick={() => openBatchManager(entry)}
                            className="text-indigo-600 hover:text-indigo-700 hover:bg-indigo-50 p-2 sm:p-3 rounded-xl sm:rounded-2xl transition-all duration-150"
                            title="Gerenciar Lotes"
                          >
                            <Calendar className="h-3 w-3 sm:h-4 sm:w-4" />
                          </Button>
                          <Button 
                            variant="ghost" 
                            size="sm"
                            onClick={() => handleDeleteEntry(entry)}
                            className="text-red-600 hover:text-red-700 hover:bg-red-50 p-2 sm:p-3 rounded-xl sm:rounded-2xl transition-all duration-150"
                          >
                            <Trash2 className="h-3 w-3 sm:h-4 sm:w-4" />
                          </Button>
                        </div>
                      </TableCell>
                    </TableRow>
                  ))
                )}
              </TableBody>
            </Table>
          </div>
        </CardContent>
      </Card>

      {/* Modal de Confirmação de Exclusão */}
      <Dialog open={isDeleteDialogOpen} onOpenChange={setIsDeleteDialogOpen}>
        <DialogContent className="max-w-md sm:max-w-lg">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2 text-lg">
              <Trash2 className="h-5 w-5 text-red-600" />
              Confirmar Exclusão de Compra
            </DialogTitle>
            <DialogDescription>
              Esta ação não pode ser desfeita. A compra será removida e o estoque será ajustado.
            </DialogDescription>
          </DialogHeader>

          {entryToDelete && (
            <div className="py-4">
              <div className="bg-red-50 rounded-lg p-4 border border-red-200">
                <h4 className="font-semibold text-sm mb-2 text-red-900">Compra a ser excluída:</h4>
                <div className="space-y-1 text-sm">
                  <p><strong>Produto:</strong> {entryToDelete.productName}</p>
                  <p><strong>Quantidade:</strong> {entryToDelete.quantity} unidades</p>
                  <p><strong>Fornecedor:</strong> {entryToDelete.supplier}</p>
                  <p><strong>Custo Total:</strong> R$ {entryToDelete.totalCost.toFixed(2)}</p>
                  <p className="text-xs text-red-700 mt-2">
                    <span className="flex items-center gap-2"><AlertTriangle className="h-4 w-4" /> O estoque será <strong>reduzido</strong> em {entryToDelete.quantity} unidades</span>
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
                setEntryToDelete(null);
              }}
            >
              Cancelar
            </Button>
              <Button
                type="button"
                onClick={confirmDeleteEntry}
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
                  Excluir Entrada
                </>
              )}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Modal de Edição com Design Sofisticado */}
      <Dialog open={isEditDialogOpen} onOpenChange={(open) => {
        setIsEditDialogOpen(open);
        if (open) {
          setShowSupplierDropdown(false);
        }
      }}>
        <DialogContent className="max-w-2xl sm:max-w-3xl bg-white rounded-xl shadow-lg border border-gray-200">
          <DialogHeader className="space-y-2 pb-4 sm:pb-6">
            <DialogTitle className="text-base sm:text-2xl font-bold text-neutral-900">
              <span className="flex items-center gap-2"><Edit className="h-4 w-4" /> Editar Compra</span>
            </DialogTitle>
            <DialogDescription className="text-sm sm:text-base text-neutral-600">
              Atualize as informações da compra de estoque selecionada
            </DialogDescription>
          </DialogHeader>
          
          <Form {...form}>
            <form onSubmit={form.handleSubmit(editEntry)} className="space-y-4 sm:space-y-6">
              {/* Primeira linha - Produto e Fornecedor */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 sm:gap-6">
                <FormField
                  control={form.control}
                  name="productId"
                  render={({ field }) => (
                    <FormItem className="space-y-3">
                      <FormLabel className="text-base sm:text-sm font-semibold text-neutral-700">
                        <span className="flex items-center gap-2"><Tag className="h-4 w-4" /> Produto</span>
                      </FormLabel>
                      <Select onValueChange={field.onChange} defaultValue={field.value}>
                        <FormControl>
                          <SelectTrigger className="h-12 sm:h-10 border-neutral-200 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 text-base sm:text-sm">
                            <SelectValue placeholder="Selecione um produto" />
                          </SelectTrigger>
                        </FormControl>
                        <SelectContent>
                          {products.map(product => (
                            <SelectItem key={product.id} value={product.id}>
                              {product.name} - {product.sku}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                
                <FormField
                  control={form.control}
                  name="supplier"
                  render={({ field }) => (
                    <FormItem className="space-y-3">
                      <FormLabel className="text-base sm:text-sm font-semibold text-neutral-700">
                        <span className="flex items-center gap-2"><Building2 className="h-4 w-4" /> Fornecedor</span>
                      </FormLabel>
                      <FormControl>
                        <div className="relative" ref={supplierInputRef}>
                          <Input 
                            placeholder="Código ou nome do fornecedor" 
                            value={field.value || ''}
                            onChange={(e) => {
                              const value = e.target.value;
                              field.onChange(value);
                              setSupplierSearchTerm(value);
                              // Só mostrar dropdown se houver texto digitado
                              if (value.trim().length > 0) {
                                setShowSupplierDropdown(true);
                              } else {
                                setShowSupplierDropdown(false);
                              }
                            }}
                            onMouseDown={() => {
                              // Marcar que o usuário clicou quando pressionar o mouse
                              setSupplierSearchUserClicked(true);
                              setSupplierSearchFocused(true);
                              setShowSupplierDropdown(true);
                              if (field.value && field.value.trim().length > 0) {
                                setSupplierSearchTerm(field.value);
                              }
                            }}
                            onFocus={() => {
                              // Mostrar lista quando focar
                              setSupplierSearchFocused(true);
                              setShowSupplierDropdown(true);
                              if (field.value && field.value.trim().length > 0) {
                                setSupplierSearchTerm(field.value);
                              }
                            }}
                            onBlur={() => {
                              // Delay para permitir clique no item
                              setTimeout(() => {
                                setSupplierSearchFocused(false);
                                setSupplierSearchUserClicked(false);
                                setShowSupplierDropdown(false);
                              }, 200);
                            }}
                            onKeyDown={(e) => {
                              // Permitir navegação com teclado
                              if (e.key === 'Escape') {
                                setShowSupplierDropdown(false);
                                setSupplierSearchFocused(false);
                              }
                            }}
                            className="h-12 border-2 border-neutral-200 rounded-xl focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 text-base sm:text-sm"
                            autoComplete="off"
                          />
                          {(supplierSearchFocused || showSupplierDropdown) && !isLoadingSuppliers && (
                            <>
                              {(() => {
                                const suppliersToShow = supplierSearchTerm.trim() !== '' 
                                  ? filteredSuppliers 
                                  : allSuppliers.slice(0, 50); // Mostrar até 50 fornecedores quando não há busca
                                
                                if (suppliersToShow.length === 0) {
                                  return (
                                    <div className="absolute z-[100] mt-1 w-full bg-white border border-neutral-200 rounded-lg shadow-lg overflow-hidden">
                                      <div className="p-4 text-center text-sm text-muted-foreground">
                                        {allSuppliers.length === 0 ? 'Nenhum fornecedor cadastrado' : 'Nenhum fornecedor encontrado'}
                                      </div>
                                    </div>
                                  );
                                }
                                
                                return (
                                  <div className="absolute z-[100] mt-1 w-full bg-white border border-neutral-200 rounded-lg shadow-lg overflow-hidden" style={{ maxHeight: '240px', overflowY: 'auto' }}>
                                    {suppliersToShow.slice(0, 50).map((supplier) => (
                                      <button
                                        key={`edit-${supplier.id}`}
                                        type="button"
                                        className="w-full px-4 py-3 text-left hover:bg-accent hover:text-accent-foreground focus:bg-accent focus:text-accent-foreground focus:outline-none border-b last:border-b-0 transition-colors"
                                        onMouseDown={(e) => {
                                          e.preventDefault(); // Prevenir que o mousedown feche o dropdown antes do onClick
                                          e.stopPropagation();
                                        }}
                                        onClick={(e) => {
                                          e.preventDefault();
                                          e.stopPropagation();
                                          field.onChange(supplier.nome);
                                          setSupplierSearchTerm('');
                                          setShowSupplierDropdown(false);
                                          setSupplierSearchFocused(false);
                                        }}
                                    >
                                      <div className="font-medium">{supplier.nome}</div>
                                      <div className="text-xs text-muted-foreground">
                                        Código: {supplier.codigo || '—'}
                                      </div>
                                    </button>
                                  ))}
                                  {suppliersToShow.length > 4 && (
                                    <div className="px-4 py-2 text-xs text-neutral-500 bg-neutral-50 text-center border-t">
                                      Mostrando {Math.min(50, suppliersToShow.length)} de {allSuppliers.length} fornecedores
                                    </div>
                                  )}
                                  </div>
                                );
                              })()}
                            </>
                          )}
                        </div>
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>
              
              {/* Segunda linha - Quantidade e Custo */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <FormField
                  control={form.control}
                  name="quantity"
                  render={({ field }) => {
                    // Converter valor numérico para string para controle
                    const valueAsString = field.value === 0 ? '' : String(field.value || '');
                    
                    return (
                      <FormItem className="space-y-3">
                        <FormLabel className="text-sm font-semibold text-neutral-700">
                          <span className="flex items-center gap-2"><BarChart3 className="h-4 w-4" /> Quantidade</span>
                        </FormLabel>
                        <FormControl>
                          <Input 
                            type="number" 
                            placeholder="0" 
                            value={valueAsString}
                            onChange={(e) => {
                              const value = e.target.value;
                              
                              // Permite campo vazio (retorna 0 mas mantém visualmente vazio)
                              if (value === '' || value === null) {
                                field.onChange(0);
                                return;
                              }
                              
                              // Se o valor for "0" seguido de um dígito diferente de 0, apaga o zero
                              if (value.match(/^0[1-9]/) && value.length === 2) {
                                const newValue = value.substring(1);
                                field.onChange(parseInt(newValue));
                                return;
                              }
                              
                              // Permite valores normais
                              const intValue = parseInt(value);
                              if (!isNaN(intValue)) {
                                field.onChange(intValue);
                              } else if (value === '' || value === '-') {
                                field.onChange(0);
                              }
                            }}
                            onBlur={() => {
                              // Quando sair do campo, garante que valor seja 0 se vazio
                              if (field.value === 0 || !field.value) {
                                field.onChange(0);
                              }
                            }}
                            className="h-12 border-neutral-200 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                          />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    );
                  }}
                />
                
                <FormField
                  control={form.control}
                  name="unitCost"
                  render={({ field }) => {
                    // Converter valor numérico para string para controle
                    const valueAsString = field.value === 0 ? '' : String(field.value || '');
                    
                    return (
                      <FormItem className="space-y-3">
                        <FormLabel className="text-sm font-semibold text-neutral-700">
                          <span className="flex items-center gap-2"><Coins className="h-4 w-4" /> Custo Unitário</span>
                        </FormLabel>
                        <FormControl>
                          <Input 
                            type="number" 
                            step="0.01" 
                            placeholder="0.00" 
                            value={valueAsString}
                            onChange={(e) => {
                              const value = e.target.value;
                              
                              // Permite campo vazio (retorna 0 mas mantém visualmente vazio)
                              if (value === '' || value === null) {
                                field.onChange(0);
                                return;
                              }
                              
                              // Se o valor for "0" seguido de um dígito diferente de 0, apaga o zero
                              if (value.match(/^0[1-9]/) && value.length === 2) {
                                const newValue = value.substring(1);
                                field.onChange(parseFloat(newValue));
                                return;
                              }
                              
                              // Permite valores normais incluindo decimais
                              const numValue = parseFloat(value);
                              if (!isNaN(numValue)) {
                                field.onChange(numValue);
                              } else if (value === '' || value === '-') {
                                field.onChange(0);
                              }
                            }}
                            onBlur={() => {
                              // Quando sair do campo, garante que valor seja 0 se vazio
                              if (field.value === 0 || !field.value) {
                                field.onChange(0);
                              }
                            }}
                            className="h-12 border-neutral-200 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                          />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    );
                  }}
                />
              </div>
              
              {/* Display do Total Calculado Automaticamente */}
              <div className="bg-gradient-to-r from-blue-50 to-emerald-50 border-2 border-blue-200 rounded-xl p-4 flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <DollarSign className="w-5 h-5 text-blue-600" />
                  <span className="text-sm font-semibold text-neutral-700">Total Calculado:</span>
                </div>
                <span className="text-2xl font-bold text-emerald-600">
                  R$ {((form.watch('quantity') || 0) * (form.watch('unitCost') || 0)).toFixed(2)}
                </span>
              </div>
              
              {/* Terceira linha - Data e Status */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <FormField
                  control={form.control}
                  name="entryDate"
                  render={({ field }) => (
                    <FormItem className="space-y-3">
                      <FormLabel className="text-base sm:text-sm font-semibold text-neutral-700">
                        <span className="flex items-center gap-2"><Calendar className="h-4 w-4" /> Data da Compra</span>
                      </FormLabel>
                      <FormControl>
                        <Input 
                          type="date" 
                          {...field}
                          value={field.value instanceof Date ? field.value.toISOString().split('T')[0] : ''}
                          onChange={(e) => field.onChange(new Date(e.target.value))}
                          className="h-12 border-neutral-200 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                
                <FormField
                  control={form.control}
                  name="status"
                  render={({ field }) => (
                    <FormItem className="space-y-3">
                      <FormLabel className="text-base sm:text-sm font-semibold text-neutral-700">
                        <span className="flex items-center gap-2"><Target className="h-4 w-4" /> Status</span>
                      </FormLabel>
                      <Select onValueChange={field.onChange} defaultValue={field.value}>
                        <FormControl>
                          <SelectTrigger className="h-12 sm:h-10 border-neutral-200 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 text-base sm:text-sm">
                            <SelectValue />
                          </SelectTrigger>
                        </FormControl>
                        <SelectContent>
                          <SelectItem value="pendente"><span className="flex items-center gap-2"><Clock className="h-4 w-4" /> Pendente</span></SelectItem>
                          <SelectItem value="aprovado"><span className="flex items-center gap-2"><CheckCircle className="h-4 w-4 text-green-600" /> Aprovado</span></SelectItem>
                          <SelectItem value="cancelado"><span className="flex items-center gap-2"><X className="h-4 w-4 text-red-600" /> Cancelado</span></SelectItem>
                        </SelectContent>
                      </Select>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>
              
              {/* Observações */}
              <FormField
                control={form.control}
                name="notes"
                render={({ field }) => (
                  <FormItem className="space-y-2">
                    <FormLabel className="text-sm font-semibold text-neutral-700">
                      <span className="flex items-center gap-2"><FileText className="h-4 w-4" /> Observações</span>
                    </FormLabel>
                    <FormControl>
                      <Input 
                        placeholder="Observações adicionais, notas de qualidade, etc..." 
                        {...field} 
                        className="h-12 border-neutral-200 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              
              {/* Footer do Modal */}
              <DialogFooter className="pt-6 border-t border-neutral-200">
                <Button 
                  type="button" 
                  variant="outline" 
                  onClick={() => setIsEditDialogOpen(false)}
                  className="px-6 py-2 border-neutral-300 text-neutral-700 hover:bg-neutral-50"
                >
                  Cancelar
                </Button>
                <Button 
                  type="submit"
                  className="bg-gradient-to-r from-blue-600 to-blue-700 hover:from-blue-700 hover:to-blue-800 text-white px-6 py-2 rounded-lg shadow-md hover:shadow-lg transition-all duration-200"
                >
                  ✏️ Atualizar Compra
                </Button>
              </DialogFooter>
            </form>
          </Form>
        </DialogContent>
      </Dialog>

      {/* Modal de Gerenciamento de Lotes */}
      <Dialog open={isBatchDialogOpen} onOpenChange={setIsBatchDialogOpen}>
        <DialogContent className="max-w-md sm:max-w-lg md:max-w-xl max-h-[90vh] flex flex-col p-0 overflow-hidden !md:overflow-hidden">
          <div className="overflow-y-auto flex-1 px-6 pt-6 pb-6 min-h-0">
            {selectedProductForBatch && (
              <BatchManager
                productId={selectedProductForBatch.id}
                productName={selectedProductForBatch.name}
                productSku={selectedProductForBatch.sku}
                productStock={selectedProductForBatch.stock}
                onBatchesChange={async () => {
                  // Atualizar estoque silenciosamente quando lotes mudarem
                  // Recarregar produtos para atualizar o estoque
                  await refreshProducts();
                  
                  // Atualizar o produto selecionado com o estoque atualizado
                  if (selectedProductForBatch) {
                    const updatedProduct = products.find(p => p.id === selectedProductForBatch.id);
                    if (updatedProduct) {
                      setSelectedProductForBatch({
                        ...selectedProductForBatch,
                        stock: updatedProduct.stock || 0
                      });
                    }
                  }
                }}
              />
            )}
          </div>
        </DialogContent>
      </Dialog>
    </main>
  );
};

export default Entradas;

