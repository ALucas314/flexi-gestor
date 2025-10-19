import React, { useState, useEffect } from "react";
import { Plus, TrendingDown, Package, Search, Trash2, Calendar, DollarSign, ShoppingCart, Receipt, CheckCircle, Printer, Share2 } from "lucide-react";

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
import { batchesAPI } from "@/lib/api";

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
}

type StockExitFormData = Omit<StockExit, 'id' | 'productName' | 'productSku' | 'totalPrice'>;

const Saidas = () => {
  // Estados
  const [exits, setExits] = useState<StockExit[]>([]);
  const [searchTerm, setSearchTerm] = useState("");
  const [isAddDialogOpen, setIsAddDialogOpen] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [availableBatches, setAvailableBatches] = useState<any[]>([]);
  const [selectedBatches, setSelectedBatches] = useState<Array<{batchId: string, quantity: number}>>([]);
  const [selectedProductId, setSelectedProductId] = useState<string>("");
  const [showReceipt, setShowReceipt] = useState(false);
  const [selectedExit, setSelectedExit] = useState<StockExit | null>(null);

  // Hooks
  const { toast } = useToast();
  const { products, addMovement, addNotification } = useData();

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
      setSelectedProductId(productId);
      setSelectedBatches([]);
      
      const data = await batchesAPI.getByProduct(productId);
      setAvailableBatches(data.batches || []);
      
      console.log(`📦 ${data.batches?.length || 0} lotes carregados para o produto`);
    } catch (error) {
      console.error('Erro ao carregar lotes:', error);
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

  // Função para abrir receita
  const openReceipt = (exit: StockExit) => {
    setSelectedExit(exit);
    setShowReceipt(true);
  };

  // Função para compartilhar/baixar receita
  const downloadReceipt = (exit: StockExit) => {
    const receiptText = `
━━━━━━━━━━━━━━━━━━━━━━━━━
📄 RECEITA DE SAÍDA
Flexi Gestor - Sistema de Gestão
━━━━━━━━━━━━━━━━━━━━━━━━━

Data: ${new Date(exit.exitDate).toLocaleDateString('pt-BR')}
Cliente: ${exit.customer}

━━━━━━━━━━━━━━━━━━━━━━━━━
PRODUTO:
${exit.productName}
${exit.quantity} x R$ ${exit.unitPrice.toFixed(2)}

TOTAL: R$ ${exit.totalPrice.toFixed(2)}
━━━━━━━━━━━━━━━━━━━━━━━━━

Observações:
${exit.notes || 'Nenhuma observação'}

━━━━━━━━━━━━━━━━━━━━━━━━━
Obrigado pela preferência!
💚 Flexi Gestor - Gestão Inteligente
━━━━━━━━━━━━━━━━━━━━━━━━━
    `.trim();

    // Tentar compartilhar no mobile
    if (navigator.share) {
      navigator.share({
        title: 'Receita de Saída - Flexi Gestor',
        text: receiptText,
      }).catch((error) => console.log('Erro ao compartilhar:', error));
    } else {
      // Fallback: baixar como arquivo
      const blob = new Blob([receiptText], { type: 'text/plain' });
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `receita-saida-${new Date(exit.exitDate).toISOString().split('T')[0]}.txt`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      window.URL.revokeObjectURL(url);
    }
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

    const newExit: StockExit = {
      ...data,
      id: Date.now().toString(),
      productName: product.name,
      productSku: product.sku,
      quantity: totalQuantity,
      unitPrice: unitPrice,
      totalPrice: totalPrice,
      exitDate: data.exitDate,
    };

    // Atualizar lotes selecionados no backend
    if (selectedBatches.length > 0) {
      try {
        const batchUpdates = selectedBatches.map(async (selectedBatch) => {
          const batch = availableBatches.find(b => b.id === selectedBatch.batchId);
          if (batch) {
            return batchesAPI.update(batch.id, {
              quantity: batch.quantity - selectedBatch.quantity
            });
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

    // Adicionar saída local
    const updatedExits = [newExit, ...exits];
    setExits(updatedExits);
    localStorage.setItem('flexi-gestor-exits', JSON.stringify(updatedExits));

    // Adicionar movimentação no contexto global (isso atualiza o estoque automaticamente)
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

  const handleDeleteExit = (exitId: string) => {
    const exit = exits.find(e => e.id === exitId);
    if (!exit) return;
    
    const updatedExits = exits.filter(e => e.id !== exitId);
    setExits(updatedExits);
    localStorage.setItem('flexi-gestor-exits', JSON.stringify(updatedExits));

    // Adicionar notificação
    addNotification(
      '🗑️ Saída Removida',
      `Produto: ${exit.productName}\nQuantidade: ${exit.quantity} unidades\nCliente: ${exit.customer}\nPreço: R$ ${exit.unitPrice.toFixed(2)}\nTotal: R$ ${exit.totalPrice.toFixed(2)}`,
      'warning'
    );

    toast({
      title: "🗑️ Saída Removida!",
      description: `Saída de ${exit.productName} foi removida com sucesso.`,
      variant: "default",
    });
  };

  // Carregar dados do localStorage
  useEffect(() => {
    // Simular carregamento inicial
    const timer = setTimeout(() => {
      setIsLoading(false);
    }, 500);
    
    const savedExits = localStorage.getItem('flexi-gestor-exits');
    if (savedExits) {
      setExits(JSON.parse(savedExits).map((exit: StockExit) => ({
        ...exit,
        exitDate: new Date(exit.exitDate)
      })));
    }
    
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
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">📤 Saídas de Estoque</h1>
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
                  <DialogHeader className="space-y-1 pb-2 sm:pb-3">
                    <DialogTitle className="text-sm sm:text-xl">Registrar Nova Saída</DialogTitle>
                    <DialogDescription className="text-xs sm:text-sm">
                      Preencha as informações da saída de estoque.
                    </DialogDescription>
                  </DialogHeader>
                  <Form {...form}>
                    <form onSubmit={form.handleSubmit(handleAddExit)} className="space-y-2 sm:space-y-3">
                      <div className="grid grid-cols-2 gap-2 sm:gap-3">
                        <FormField
                          control={form.control}
                          name="productId"
                          render={({ field }) => (
                            <FormItem>
                              <FormLabel>📦 Produto</FormLabel>
                              <Select 
                                onValueChange={(value) => {
                                  field.onChange(value);
                                  loadBatchesForProduct(value);
                                }} 
                                defaultValue={field.value}
                              >
                                <FormControl>
                                  <SelectTrigger>
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
                            <FormItem>
                              <FormLabel>👤 Cliente</FormLabel>
                              <FormControl>
                                <Input placeholder="Nome do cliente" {...field} />
                              </FormControl>
                              <FormMessage />
                            </FormItem>
                          )}
                        />
                      </div>

                      {/* Seletor de Lotes Múltiplos */}
                      {selectedProductId && availableBatches.length > 0 && (
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

                          {selectedBatches.length === 0 ? (
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
                                      <div>
                                        <Label className="text-xs text-gray-600">Quantidade</Label>
                                        <Input
                                          type="number"
                                          min="1"
                                          placeholder="0"
                                          value={selectedBatch.quantity || ''}
                                          onChange={(e) => updateSelectedBatch(index, selectedBatch.batchId, parseInt(e.target.value) || 0)}
                                          className="h-9"
                                        />
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
                      
                      <div className="grid grid-cols-2 gap-2 sm:gap-3">
                        <FormField
                          control={form.control}
                          name="exitDate"
                          render={({ field }) => (
                            <FormItem>
                              <FormLabel>Data de Saída</FormLabel>
                              <FormControl>
                                <Input 
                                  type="date" 
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
                            <FormItem>
                              <FormLabel>Status</FormLabel>
                              <Select onValueChange={field.onChange} defaultValue={field.value}>
                                <FormControl>
                                  <SelectTrigger>
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
                          <FormItem>
                            <FormLabel>Observações</FormLabel>
                            <FormControl>
                              <Input placeholder="Observações adicionais..." {...field} />
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                      
                      <DialogFooter className="pt-2 sm:pt-3 flex flex-col sm:flex-row gap-2">
                        <Button type="button" variant="outline" onClick={() => setIsAddDialogOpen(false)} className="w-full sm:w-auto h-9 text-sm">
                          Cancelar
                        </Button>
                        <Button type="submit" className="w-full sm:w-auto h-9 text-sm">Registrar Saída</Button>
                      </DialogFooter>
                    </form>
                  </Form>
                </DialogContent>
              </Dialog>
            </div>
            
            {/* Cards de Estatísticas */}
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 sm:gap-6">
              {/* Card Total de Saídas */}
              <Card className="bg-gradient-to-br from-red-50 to-red-100 border-red-200 hover:shadow-lg transition-all duration-300">
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                  <CardTitle className="text-sm font-medium text-red-800">📤 Total de Saídas</CardTitle>
                  <TrendingDown className="h-5 w-5 text-red-600" />
                </CardHeader>
                <CardContent>
                  <div className="text-3xl font-bold text-red-700 mb-1">{totalExits}</div>
                  <p className="text-xs text-red-600">Saídas registradas</p>
                </CardContent>
              </Card>

              {/* Card Valor Total */}
              <Card className="bg-gradient-to-br from-green-50 to-green-100 border-green-200 hover:shadow-lg transition-all duration-300">
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                  <CardTitle className="text-sm font-medium text-green-800">💰 Valor Total</CardTitle>
                  <DollarSign className="h-5 w-5 text-green-600" />
                </CardHeader>
                <CardContent>
                  <div className="text-3xl font-bold text-green-700 mb-1">R$ {totalValue.toFixed(2).replace('.', ',')}</div>
                  <p className="text-xs text-green-600">Valor total das saídas</p>
                </CardContent>
              </Card>

              {/* Card Saídas do Mês */}
              <Card className="bg-gradient-to-br from-blue-50 to-blue-100 border-blue-200 hover:shadow-lg transition-all duration-300">
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                  <CardTitle className="text-sm font-medium text-blue-800">📅 Este Mês</CardTitle>
                  <Calendar className="h-5 w-5 text-blue-600" />
                </CardHeader>
                <CardContent>
                  <div className="text-3xl font-bold text-blue-700 mb-1">{thisMonthExits}</div>
                  <p className="text-xs text-blue-600">Saídas do mês atual</p>
                </CardContent>
              </Card>

              {/* Card Produtos Vendidos */}
              <Card className="bg-gradient-to-br from-purple-50 to-purple-100 border-purple-200 hover:shadow-lg transition-all duration-300">
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                  <CardTitle className="text-sm font-medium text-purple-800">🛒 Produtos Vendidos</CardTitle>
                  <ShoppingCart className="h-5 w-5 text-purple-600" />
                </CardHeader>
                <CardContent>
                  <div className="text-3xl font-bold text-purple-700 mb-1">
                    {exits.reduce((sum, exit) => sum + exit.quantity, 0)}
                  </div>
                  <p className="text-xs text-purple-600">Unidades vendidas</p>
                </CardContent>
              </Card>
            </div>
            
            {/* Busca */}
            <Card className="bg-gradient-to-r from-slate-50 to-gray-50 border-slate-200">
              <CardHeader className="pb-4">
                <CardTitle className="flex items-center gap-2 text-slate-800">
                  <Search className="w-5 h-5 text-slate-600" />
                  🔍 Buscar Saídas
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="relative">
                  <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-slate-500 w-5 h-5" />
                  <Input
                    placeholder="🔍 Buscar saídas por produto ou cliente..."
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    className="pl-10 bg-white border-slate-300 hover:border-slate-400 focus:border-red-500 transition-colors"
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
                                  onClick={() => handleDeleteExit(exit.id)}
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
                  onClick={() => downloadReceipt(selectedExit)}
                >
                  <Share2 className="mr-2 h-4 w-4" />
                  Compartilhar/Baixar Receita
                </Button>

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
                    </main>
        );
};

export default Saidas;
