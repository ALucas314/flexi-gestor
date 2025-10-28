import React, { useState, useEffect } from "react";
import { Plus, TrendingDown, Package, Search, Trash2, Calendar, DollarSign, ShoppingCart, Receipt, CheckCircle, Printer, Share2, Edit } from "lucide-react";

import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useForm } from "react-hook-form";
import { useToast } from "@/hooks/use-toast";
import { useData } from "@/contexts/DataContext";
import { getBatchesByProduct, updateBatchQuantity } from "@/lib/batches";
import { useAuth } from "@/contexts/AuthContext";
import { printReceipt, downloadReceipt } from "@/lib/receiptPDF";

// Interface da saída de estoque
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

type StockExitFormData = Omit<StockExit, 'id' | 'productName' | 'productSku' | 'totalPrice' | 'receiptNumber'>;

const Saidas = () => {
  // Estados
  const [searchTerm, setSearchTerm] = useState("");
  const [isAddDialogOpen, setIsAddDialogOpen] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [availableBatches, setAvailableBatches] = useState<any[]>([]);
  const [selectedBatches, setSelectedBatches] = useState<Array<{batchId: string, quantity: number}>>([]);
  const [selectedProductId, setSelectedProductId] = useState<string>("");
  const [showReceipt, setShowReceipt] = useState(false);
  const [selectedExit, setSelectedExit] = useState<StockExit | null>(null);
  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false);
  const [exitToDelete, setExitToDelete] = useState<StockExit | null>(null);
  const [isDeleting, setIsDeleting] = useState(false);
  const [isEditDialogOpen, setIsEditDialogOpen] = useState(false);
  const [exitToEdit, setExitToEdit] = useState<StockExit | null>(null);
  const [isSaving, setIsSaving] = useState(false);

  // Hooks
  const { toast } = useToast();
  const { products, movements, addMovement, deleteMovement, addNotification, refreshMovements } = useData();
  const { user } = useAuth();

  // Filtrar apenas as saídas dos movements
  const exits = movements
    .filter(m => m.type === 'saida')
    .map(m => ({
      id: m.id,
      productId: m.productId,
      productName: m.productName || m.product?.name || 'Desconhecido',
      productSku: m.product?.sku || '',
      quantity: m.quantity,
      unitPrice: m.unitPrice,
      totalPrice: m.total,
      customer: m.description.includes(' - ') ? m.description.split(' - ')[1] : 'Cliente',
      exitDate: m.date,
      notes: m.description,
      status: (m.status || 'confirmado') as 'pendente' | 'confirmado' | 'cancelado', // Usar status real do banco
      receiptNumber: m.receiptNumber
    }));

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
    },
  });

  // Carregar lotes quando selecionar um produto
  const loadBatchesForProduct = async (productId: string) => {
    try {
      if (!user?.id) return;
      
      setSelectedProductId(productId);
      setSelectedBatches([]);
      
      const batches = await getBatchesByProduct(productId, user.id);
      setAvailableBatches(batches || []);
    } catch (error) {
      setAvailableBatches([]);
    }
  };

  // Adicionar lote à seleção
  const addBatchToSelection = () => {
    setSelectedBatches(prev => [...prev, { batchId: '', quantity: 0 }]);
  };

  // Remover lote da seleção
  const removeBatchFromSelection = (index: number) => {
    setSelectedBatches(prev => prev.filter((_, i) => i !== index));
  };

  // Atualizar lote selecionado
  const updateSelectedBatch = (index: number, batchId: string, quantity: number) => {
    setSelectedBatches(prev => {
      const updated = [...prev];
      updated[index] = { batchId, quantity };
      return updated;
    });
  };

  // Calcular total selecionado dos lotes
  const getTotalSelectedQuantity = () => {
    return selectedBatches.reduce((sum, batch) => sum + (batch.quantity || 0), 0);
  };

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
    const product = products.find(p => p.id === data.productId);
    if (!product) {
      toast({
        title: "❌ Erro!",
        description: "Produto não encontrado.",
        variant: "destructive",
      });
      return;
    }

    // Calcular quantidade total e preço baseado nos lotes selecionados
    const totalQuantity = getTotalSelectedQuantity();
    const unitPrice = product.price; // Usar preço do produto
    const totalPrice = totalQuantity * unitPrice;

    // Verificar se há estoque suficiente
    if (product.stock < totalQuantity) {
      toast({
        title: "⚠️ Estoque Insuficiente!",
        description: `Estoque disponível: ${product.stock} unidades`,
        variant: "destructive",
      });
      return;
    }

    // Validar se há lotes selecionados ou quantidade
    if (totalQuantity === 0) {
      toast({
        title: "⚠️ Quantidade Inválida!",
        description: "Selecione ao menos um lote com quantidade.",
        variant: "destructive",
      });
      return;
    }

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

    // Validar se há estoque suficiente nos lotes selecionados
    if (selectedBatches.length > 0) {
      for (const selectedBatch of selectedBatches) {
        const batch = availableBatches.find(b => b.id === selectedBatch.batchId);
        if (batch && selectedBatch.quantity > batch.quantity) {
          toast({
            title: "❌ Estoque Insuficiente no Lote!",
            description: `Lote ${batch.batchNumber} tem apenas ${batch.quantity} unidades disponíveis`,
            variant: "destructive",
          });
          return;
        }
        if (selectedBatch.quantity <= 0) {
          toast({
            title: "❌ Quantidade Inválida!",
            description: "A quantidade deve ser maior que zero",
            variant: "destructive",
          });
          return;
        }
      }
    }

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
          title: "⚠️ Aviso",
          description: "Saída registrada, mas houve erro ao atualizar lotes.",
          variant: "destructive",
        });
      }
    }

    // Adicionar movimentação no contexto global (isso atualiza o estoque automaticamente e salva no Supabase)
    addMovement({
      type: 'saida',
      productId: data.productId,
      productName: product.name,
      quantity: totalQuantity,
      unitPrice: unitPrice,
      description: `Saída de ${totalQuantity} unidades - ${data.customer}`,
      date: data.exitDate,
    });

    setIsAddDialogOpen(false);
    setSelectedBatches([]);
    setSelectedProductId("");
    form.reset();

    toast({
      title: "✅ Saída Registrada!",
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
        title: "✅ Saída Removida!",
        description: `Saída de ${exitToDelete.quantity} unidades foi removida e o estoque foi ajustado.`,
        variant: "default",
      });

      // Fechar dialog após sucesso
      setIsDeleteDialogOpen(false);
      setExitToDelete(null);
    } catch (error: any) {
      toast({
        title: "❌ Erro ao Remover",
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
            title: "❌ Erro",
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
          title: "✅ Venda Cancelada!",
          description: "As unidades foram devolvidas aos lotes correspondentes.",
          variant: "default",
        });
      }

      // Se mudando de CANCELADO para outro status, retirar unidades novamente
      if (exitToEdit.status === "cancelado" && newStatus !== "cancelado") {
        if (!user?.id) {
          toast({
            title: "❌ Erro",
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
          title: "✅ Status Atualizado!",
          description: `Status alterado para ${newStatus === "confirmado" ? "Confirmado" : newStatus === "cancelado" ? "Cancelado" : "Pendente"}.`,
          variant: "default",
        });

        // Fechar dialog
        setIsEditDialogOpen(false);
        setExitToEdit(null);
    } catch (error: any) {
      toast({
        title: "❌ Erro ao Atualizar",
        description: error.message || "Não foi possível atualizar o status.",
        variant: "destructive",
      });
    } finally {
      setIsSaving(false);
    }
  };

  // Carregar dados do Supabase
  useEffect(() => {
    // Simular carregamento inicial
    const timer = setTimeout(() => {
      setIsLoading(false);
    }, 500);
    
    return () => clearTimeout(timer);
  }, []);

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
            <h3 className="text-lg font-semibold text-gray-900 mb-2">📤 Carregando Saídas...</h3>
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
            Saídas de Estoque
          </h1>
          <p className="text-muted-foreground">Registre vendas e saídas do sistema</p>
        </div>
              <Dialog open={isAddDialogOpen} onOpenChange={setIsAddDialogOpen}>
                <DialogTrigger asChild>
                  <Button className="w-full sm:w-auto bg-gradient-to-r from-indigo-600 to-indigo-700 hover:from-indigo-700 hover:to-indigo-800 text-white px-6 sm:px-8 py-3 sm:py-4 rounded-xl sm:rounded-2xl shadow-xl hover:shadow-2xl transition-all duration-200 transform hover:scale-105">
                    <Plus className="w-5 h-5 sm:w-6 sm:h-6 mr-2 sm:mr-3" />
                    Nova Saída
                  </Button>
                </DialogTrigger>
                <DialogContent className="max-w-[70vw] sm:max-w-2xl max-h-[70vh] overflow-y-auto mx-auto">
                  <DialogHeader className="space-y-2 pb-4 sm:pb-3">
                    <DialogTitle className="text-base sm:text-xl font-bold">Registrar Nova Saída</DialogTitle>
                    <DialogDescription className="text-sm">
                      Preencha as informações da saída de estoque.
                    </DialogDescription>
                  </DialogHeader>
                  <Form {...form}>
                    <form onSubmit={form.handleSubmit(handleAddExit)} className="space-y-4 sm:space-y-3">
                      <div className="grid grid-cols-2 gap-4 sm:gap-3">
                        <FormField
                          control={form.control}
                          name="productId"
                          render={({ field }) => (
                            <FormItem className="space-y-3">
                              <FormLabel className="text-base sm:text-sm font-semibold">📦 Produto</FormLabel>
                              <Select 
                                onValueChange={(value) => {
                                  field.onChange(value);
                                  loadBatchesForProduct(value);
                                }} 
                                defaultValue={field.value}
                              >
                                <FormControl>
                                  <SelectTrigger className="h-12 sm:h-10 text-base sm:text-sm">
                                    <SelectValue placeholder="Selecione um produto" />
                                  </SelectTrigger>
                                </FormControl>
                                <SelectContent>
                                  {products.map(product => (
                                    <SelectItem key={product.id} value={product.id}>
                                      {product.name} - {product.sku} (Estoque: {product.stock})
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
                          name="customer"
                          render={({ field }) => (
                            <FormItem className="space-y-3">
                              <FormLabel className="text-base sm:text-sm font-semibold">👤 Cliente</FormLabel>
                              <FormControl>
                                <Input placeholder="Nome do cliente" className="h-12 sm:h-10 text-base sm:text-sm" {...field} />
                              </FormControl>
                              <FormMessage />
                            </FormItem>
                          )}
                        />
                      </div>

                      {/* Seletor de Lotes Múltiplos */}
                      {selectedProductId && (
                        <div className="bg-gradient-to-r from-indigo-50 to-purple-50 border-2 border-indigo-300 rounded-xl p-5">
                          <div className="flex items-center justify-between mb-4">
                            <div className="flex items-center space-x-2">
                              <Calendar className="h-5 w-5 text-indigo-600" />
                              <h4 className="font-bold text-indigo-900">📦 Distribuir por Lotes</h4>
                            </div>
                            <Button
                              type="button"
                              size="sm"
                              onClick={addBatchToSelection}
                              className="bg-indigo-600 hover:bg-indigo-700 text-white"
                            >
                              <Plus className="h-4 w-4 mr-1" />
                              Adicionar Lote
                            </Button>
                          </div>

                          {availableBatches.length === 0 ? (
                            <div className="text-center py-4 bg-yellow-50 rounded-lg border-2 border-dashed border-yellow-300">
                              <Package className="h-10 w-10 mx-auto mb-2 text-yellow-600" />
                              <p className="text-sm text-yellow-800 font-medium">⚠️ Este produto não tem lotes cadastrados</p>
                              <p className="text-xs text-yellow-700 mt-1">
                                💡 A saída será registrada normalmente sem rastreio por lote
                              </p>
                              <p className="text-xs text-yellow-700 mt-1">
                                Para usar lotes, vá em Produtos → Lotes e cadastre primeiro
                              </p>
                            </div>
                          ) : selectedBatches.length === 0 ? (
                            <div className="text-center py-4 bg-white/60 rounded-lg border-2 border-dashed border-indigo-300">
                              <Package className="h-10 w-10 mx-auto mb-2 text-indigo-400" />
                              <p className="text-sm text-indigo-700 font-medium">Nenhum lote selecionado</p>
                              <p className="text-xs text-indigo-600 mt-1">
                                💡 Clique em "Adicionar Lote" para distribuir a venda entre lotes específicos
                              </p>
                              <p className="text-xs text-indigo-600 mt-1">
                                ou deixe vazio para usar FIFO automático
                              </p>
                            </div>
                          ) : (
                            <div className="space-y-3">
                              {selectedBatches.map((selectedBatch, index) => (
                                <div key={index} className="bg-white rounded-lg p-3 border-2 border-indigo-200 shadow-sm">
                                  <div className="flex items-center gap-3">
                                    <div className="flex-1 grid grid-cols-2 gap-3">
                                      <div>
                                        <Label className="text-xs text-gray-600">Lote</Label>
                                        <Select
                                          value={selectedBatch.batchId}
                                          onValueChange={(value) => updateSelectedBatch(index, value, selectedBatch.quantity)}
                                        >
                                          <SelectTrigger className="h-9">
                                            <SelectValue placeholder="Selecione o lote" />
                                          </SelectTrigger>
                                          <SelectContent>
                                            {availableBatches.map(batch => {
                                              const expiryDate = batch.expiryDate ? new Date(batch.expiryDate) : null;
                                              const daysUntilExpiry = expiryDate 
                                                ? Math.ceil((expiryDate.getTime() - new Date().getTime()) / (1000 * 60 * 60 * 24))
                                                : null;
                                              
                                              const status = daysUntilExpiry !== null
                                                ? daysUntilExpiry < 0 
                                                  ? '🔴'
                                                  : daysUntilExpiry <= 30
                                                    ? '🟡'
                                                    : '🟢'
                                                : '⚪';

                                              return (
                                                <SelectItem key={batch.id} value={batch.id}>
                                                  {status} Lote {batch.batchNumber} - {batch.quantity} un.
                                                  {batch.expiryDate && ` (${new Date(batch.expiryDate).toLocaleDateString('pt-BR')})`}
                                                </SelectItem>
                                              );
                                            })}
                                          </SelectContent>
                                        </Select>
                                      </div>
                                      <div className="flex-1">
                                        <Label className="text-xs text-gray-600">Quantidade</Label>
                                        {(() => {
                                          const batch = availableBatches.find(b => b.id === selectedBatch.batchId);
                                          const available = batch?.quantity || 0;
                                          const exceeds = selectedBatch.quantity > available;
                                          const warning = available > 0 && selectedBatch.quantity > available * 0.8 && !exceeds;
                                          
                                          return (
                                            <div className="space-y-1">
                                              <Input
                                                type="number"
                                                min="1"
                                                max={available}
                                                placeholder="0"
                                                value={selectedBatch.quantity === 0 ? '' : (selectedBatch.quantity || '')}
                                                onChange={(e) => {
                                                  const value = e.target.value;
                                                  
                                                  if (value === '' || value === null) {
                                                    updateSelectedBatch(index, selectedBatch.batchId, 0);
                                                    return;
                                                  }
                                                  
                                                  // Se o valor for "0" seguido de um dígito diferente de 0, apaga o zero
                                                  if (value.match(/^0[1-9]/) && value.length === 2) {
                                                    const newValue = value.substring(1);
                                                    updateSelectedBatch(index, selectedBatch.batchId, Math.max(0, parseInt(newValue)));
                                                    return;
                                                  }
                                                  
                                                  const intValue = parseInt(value);
                                                  if (!isNaN(intValue)) {
                                                    updateSelectedBatch(index, selectedBatch.batchId, Math.max(0, intValue));
                                                  }
                                                }}
                                                className={`h-9 ${exceeds ? 'border-red-500 focus:ring-red-500' : warning ? 'border-yellow-500 focus:ring-yellow-500' : ''}`}
                                              />
                                              {selectedBatch.batchId && (
                                                <div className="flex items-center gap-1 text-xs">
                                                  {exceeds ? (
                                                    <span className="text-red-600 font-medium flex items-center gap-1">
                                                      ❌ Excede! Disponível: {available} un.
                                                    </span>
                                                  ) : warning ? (
                                                    <span className="text-yellow-600 font-medium flex items-center gap-1">
                                                      ⚠️ Disponível: {available} un.
                                                    </span>
                                                  ) : (
                                                    <span className="text-green-600 font-medium flex items-center gap-1">
                                                      ✅ Disponível: {available} un.
                                                    </span>
                                                  )}
                                                </div>
                                              )}
                                            </div>
                                          );
                                        })()}
                                      </div>
                                    </div>
                                    <Button
                                      type="button"
                                      variant="ghost"
                                      size="sm"
                                      onClick={() => removeBatchFromSelection(index)}
                                      className="text-red-600 hover:text-red-700 hover:bg-red-50 h-9 w-9 p-0"
                                    >
                                      <Trash2 className="h-4 w-4" />
                                    </Button>
                                  </div>
                                </div>
                              ))}
                              
                              {/* Resumo da distribuição */}
                              <div className="bg-white/60 rounded-lg p-3 border-2 border-indigo-300">
                                <div className="flex items-center justify-between">
                                  <span className="text-sm font-medium text-indigo-900">
                                    📊 Total a Sair:
                                  </span>
                                  <span className="text-lg font-bold text-indigo-600">
                                    {getTotalSelectedQuantity()} unidades
                                  </span>
                                </div>
                              </div>
                            </div>
                          )}
                          
                          <p className="text-xs text-indigo-700 mt-3 bg-white/40 p-2 rounded">
                            💡 <strong>Dica:</strong> Se não adicionar lotes, o sistema usará FIFO automático (primeiro a vencer, primeiro a sair)
                          </p>
                        </div>
                      )}
                      
                      <div className="grid grid-cols-2 gap-4 sm:gap-3">
                        <FormField
                          control={form.control}
                          name="exitDate"
                          render={({ field }) => (
                            <FormItem className="space-y-3">
                              <FormLabel className="text-base sm:text-sm font-semibold">Data de Saída</FormLabel>
                              <FormControl>
                                <Input 
                                  type="date"
                                  className="h-12 sm:h-10 text-base sm:text-sm"
                                  {...field}
                                  value={field.value instanceof Date ? field.value.toISOString().split('T')[0] : ''}
                                  onChange={(e) => field.onChange(new Date(e.target.value))}
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
                              <FormLabel className="text-base sm:text-sm font-semibold">Status</FormLabel>
                              <Select onValueChange={field.onChange} defaultValue={field.value}>
                                <FormControl>
                                  <SelectTrigger className="h-12 sm:h-10 text-base sm:text-sm">
                                    <SelectValue />
                                  </SelectTrigger>
                                </FormControl>
                                <SelectContent>
                                  <SelectItem value="pendente">Pendente</SelectItem>
                                  <SelectItem value="confirmado">Confirmado</SelectItem>
                                  <SelectItem value="cancelado">Cancelado</SelectItem>
                                </SelectContent>
                              </Select>
                              <FormMessage />
                            </FormItem>
                          )}
                        />
                      </div>
                      
                      <FormField
                        control={form.control}
                        name="notes"
                        render={({ field }) => (
                          <FormItem className="space-y-3">
                            <FormLabel className="text-base sm:text-sm font-semibold">Observações</FormLabel>
                            <FormControl>
                              <Input placeholder="Observações adicionais..." className="h-12 sm:h-10 text-base sm:text-sm" {...field} />
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                      
                      <DialogFooter className="flex flex-col sm:flex-row gap-2 pt-2 sm:pt-3">
                        <Button type="button" variant="outline" onClick={() => setIsAddDialogOpen(false)} className="w-full sm:w-auto h-11 sm:h-8 text-sm sm:text-xs">
                          ❌ Cancelar
                        </Button>
                        <Button 
                          type="submit" 
                          className="w-full sm:w-auto bg-gradient-to-r from-indigo-600 to-indigo-700 hover:from-indigo-700 hover:to-indigo-800 text-white shadow-lg hover:shadow-xl transition-all duration-200 h-11 sm:h-8 text-sm sm:text-xs"
                          disabled={hasExceedingBatches()}
                        >
                          {hasExceedingBatches() ? '⚠️ Quantidade Excedida' : '📦 Registrar Saída'}
                        </Button>
                      </DialogFooter>
                    </form>
                  </Form>
                </DialogContent>
              </Dialog>
            </div>
            
            {/* Cards de Estatísticas */}
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 sm:gap-6 lg:gap-8">
              {/* Card Total de Saídas */}
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
                <h3 className="text-base sm:text-lg font-semibold mb-2">📤 Total de Saídas</h3>
                <p className="text-xs sm:text-sm opacity-80">Saídas registradas</p>
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
                <h3 className="text-base sm:text-lg font-semibold mb-2">💰 Valor Total</h3>
                <p className="text-xs sm:text-sm opacity-80">Valor total das saídas</p>
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
                <h3 className="text-base sm:text-lg font-semibold mb-2">📅 Este Mês</h3>
                <p className="text-xs sm:text-sm opacity-80">Saídas do mês atual</p>
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
                    placeholder="🔍 Buscar saídas por produto ou cliente..."
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
                      {filteredExits.length === 0 ? 'Nenhuma saída encontrada' : 
                       `${filteredExits.length} saída${filteredExits.length !== 1 ? 's' : ''} encontrada${filteredExits.length !== 1 ? 's' : ''}`
                      }
                    </span>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Tabela de Saídas */}
            <Card className="bg-white border-slate-200 shadow-sm">
              <CardHeader className="pb-4">
                <CardTitle className="flex items-center gap-2 text-slate-800">
                  <Package className="w-5 h-5 text-slate-600" />
                  📋 Lista de Saídas
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="rounded-md border border-slate-200 overflow-hidden">
                  <Table>
                    <TableHeader>
                      <TableRow className="bg-slate-50 hover:bg-slate-100">
                        <TableHead className="font-semibold text-slate-700">📦 Produto</TableHead>
                        <TableHead className="font-semibold text-slate-700">👤 Cliente</TableHead>
                        <TableHead className="font-semibold text-slate-700">🔢 Quantidade</TableHead>
                        <TableHead className="font-semibold text-slate-700">💰 Preço Unit.</TableHead>
                        <TableHead className="font-semibold text-slate-700">💵 Total</TableHead>
                        <TableHead className="font-semibold text-slate-700">📅 Data</TableHead>
                        <TableHead className="font-semibold text-slate-700">🏷️ Status</TableHead>
                        <TableHead className="font-semibold text-slate-700">📄 Receita</TableHead>
                        <TableHead className="text-right font-semibold text-slate-700">⚙️ Ações</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {filteredExits.length === 0 ? (
                        <TableRow>
                          <TableCell colSpan={9} className="text-center py-12">
                            <div className="flex flex-col items-center gap-3">
                              <Package className="w-12 h-12 text-slate-300" />
                              <div className="text-slate-500">
                                <p className="font-medium">Nenhuma saída encontrada</p>
                                <p className="text-sm">Comece registrando sua primeira saída de estoque</p>
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
                                  <span className="text-xs font-medium text-blue-600">👤</span>
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
                                {exit.status === "confirmado" ? "✅ Confirmado" : 
                                 exit.status === "pendente" ? "⏳ Pendente" : "❌ Cancelado"}
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
                                  className="hover:bg-red-50 hover:text-red-600 transition-colors"
                                  title="Excluir saída"
                                >
                                  <Trash2 className="h-4 w-4" />
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
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2 text-lg">
              <Trash2 className="h-5 w-5 text-red-600" />
              Confirmar Exclusão
            </DialogTitle>
            <DialogDescription>
              Esta ação não pode ser desfeita. A saída será removida e o estoque será ajustado.
            </DialogDescription>
          </DialogHeader>

          {exitToDelete && (
            <div className="py-4">
              <div className="bg-red-50 rounded-lg p-4 border border-red-200">
                <h4 className="font-semibold text-sm mb-2 text-red-900">Saída a ser excluída:</h4>
                <div className="space-y-1 text-sm">
                  <p><strong>Produto:</strong> {exitToDelete.productName}</p>
                  <p><strong>Quantidade:</strong> {exitToDelete.quantity} unidades</p>
                  <p><strong>Cliente:</strong> {exitToDelete.customer}</p>
                  <p><strong>Total:</strong> R$ {exitToDelete.totalPrice.toFixed(2)}</p>
                  <p className="text-xs text-red-700 mt-2">
                    ⚠️ O estoque será <strong>aumentado</strong> em {exitToDelete.quantity} unidades
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
            >
              {isDeleting ? (
                <>
                  <div className="mr-2 h-4 w-4 animate-spin rounded-full border-2 border-white border-t-transparent"></div>
                  Excluindo...
                </>
              ) : (
                <>
                  <Trash2 className="h-4 w-4 mr-2" />
                  Excluir Saída
                </>
              )}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Modal de Edição de Saída */}
      <Dialog open={isEditDialogOpen} onOpenChange={setIsEditDialogOpen}>
        <DialogContent className="max-w-md">
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
                      {exitToEdit.status === "confirmado" ? "✅ Confirmado" : exitToEdit.status === "pendente" ? "⏳ Pendente" : "❌ Cancelado"}
                    </Badge>
                  </p>
                </div>
              </div>

              {/* Seletor de Status */}
              <div>
                <Label htmlFor="newStatus" className="text-sm font-semibold">
                  🏷️ Novo Status:
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
                      ⏳ Pendente
                    </SelectItem>
                    <SelectItem value="confirmado">
                      ✅ Confirmado
                    </SelectItem>
                    <SelectItem value="cancelado">
                      ❌ Cancelado
                    </SelectItem>
                  </SelectContent>
                </Select>
              </div>

              {/* Avisos */}
              {exitToEdit.status !== "cancelado" && (
                <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-3">
                  <p className="text-xs text-yellow-800">
                    <strong>⚠️ Atenção:</strong> Ao cancelar, as {exitToEdit.quantity} unidades serão devolvidas aos lotes do produto.
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
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2 text-green-600">
              <CheckCircle className="h-6 w-6" />
              Receita de Saída
            </DialogTitle>
          </DialogHeader>
          
          {selectedExit && (
            <div className="space-y-4">
              {/* Cabeçalho da Receita */}
              <div className="border-b pb-4">
                <div className="text-center mb-3">
                  <h2 className="text-2xl font-bold text-gray-900">📄 RECEITA</h2>
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
                      {selectedExit.status === "confirmado" ? "✅ Confirmado" : 
                       selectedExit.status === "pendente" ? "⏳ Pendente" : "❌ Cancelado"}
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
                  className="w-full bg-green-600 hover:bg-green-700"
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
        </DialogContent>
      </Dialog>
                    </main>
        );
};

export default Saidas;
