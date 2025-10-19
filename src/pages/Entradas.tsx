import React, { useState, useEffect } from "react";
import { Plus, TrendingUp, Package, Search, Edit, Trash2, Calendar, DollarSign, Filter, Download, Eye } from "lucide-react";

import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useForm } from "react-hook-form";
import { useToast } from "@/hooks/use-toast";
import { useData } from "@/contexts/DataContext";
import { batchesAPI } from "@/lib/api";
import { Label } from "@/components/ui/label";

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
}

type StockEntryFormData = Omit<StockEntry, 'id' | 'productName' | 'productSku' | 'totalCost' | 'receiptNumber'>;

const Entradas = () => {
  // Estados
  const [entries, setEntries] = useState<StockEntry[]>([]);
  const [searchTerm, setSearchTerm] = useState("");
  const [isAddDialogOpen, setIsAddDialogOpen] = useState(false);
  const [isEditDialogOpen, setIsEditDialogOpen] = useState(false);
  const [editingEntry, setEditingEntry] = useState<StockEntry | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [availableBatches, setAvailableBatches] = useState<any[]>([]);
  const [selectedBatches, setSelectedBatches] = useState<Array<{batchNumber: string, quantity: number, manufactureDate?: Date, expiryDate?: Date}>>([]);
  const [selectedProductId, setSelectedProductId] = useState<string>("");

  // Hooks
  const { toast } = useToast();
  const { products, addMovement, addNotification } = useData();

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
    },
  });

  // Carregar lotes quando selecionar um produto
  const loadBatchesForProduct = async (productId: string) => {
    try {
      setSelectedProductId(productId);
      setSelectedBatches([]); // Resetar lotes selecionados
      
      const data = await batchesAPI.getByProduct(productId);
      setAvailableBatches(data.batches || []);
      
      console.log(`📦 ${data.batches?.length || 0} lotes existentes para o produto`);
    } catch (error) {
      console.error('Erro ao carregar lotes:', error);
      setAvailableBatches([]);
    }
  };

  // Adicionar novo lote à entrada
  const addBatchToEntry = () => {
    setSelectedBatches(prev => [...prev, { 
      batchNumber: '', 
      quantity: 0,
      unitCost: 0,
      manufactureDate: undefined,
      expiryDate: undefined
    }]);
  };

  // Remover lote da entrada
  const removeBatchFromEntry = (index: number) => {
    setSelectedBatches(prev => prev.filter((_, i) => i !== index));
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

  // Carregar dados do localStorage
  useEffect(() => {
    // Simular carregamento inicial
    const timer = setTimeout(() => {
      setIsLoading(false);
    }, 500);
    
    // Carregar entradas
    const savedEntries = localStorage.getItem('flexi-gestor-entries');
    if (savedEntries) {
      setEntries(JSON.parse(savedEntries));
    }
    
    return () => clearTimeout(timer);
  }, []);

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

  // Gerar número de nota fiscal único
  const generateReceiptNumber = () => {
    const now = new Date();
    const year = now.getFullYear();
    const month = String(now.getMonth() + 1).padStart(2, '0');
    const day = String(now.getDate()).padStart(2, '0');
    const hours = String(now.getHours()).padStart(2, '0');
    const minutes = String(now.getMinutes()).padStart(2, '0');
    const seconds = String(now.getSeconds()).padStart(2, '0');
    const milliseconds = String(now.getMilliseconds()).padStart(3, '0');
    return `NFC-${year}${month}${day}-${hours}${minutes}${seconds}${milliseconds}`;
  };

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
              title: "⚠️ Dados Incompletos!",
              description: "Todos os lotes devem ter número e quantidade válidos.",
              variant: "destructive",
            });
            return;
          }
          if (!batch.unitCost || batch.unitCost <= 0) {
            toast({
              title: "⚠️ Custo Obrigatório!",
              description: "Todos os lotes devem ter um custo unitário válido maior que zero.",
              variant: "destructive",
            });
            return;
          }
        }

        // Criar ou atualizar todos os lotes no backend
        for (const batch of selectedBatches) {
          // Verificar se o lote já existe
          const existingBatch = availableBatches.find(b => b.batchNumber === batch.batchNumber);
          
          if (existingBatch) {
            // Atualizar lote existente - adicionar quantidade
            await batchesAPI.update(existingBatch.id, {
              quantity: existingBatch.quantity + batch.quantity
            });
          } else {
            // Criar novo lote
            await batchesAPI.create({
              productId: data.productId,
              batchNumber: batch.batchNumber,
              quantity: batch.quantity,
              manufactureDate: batch.manufactureDate,
              expiryDate: batch.expiryDate
            });
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

        // Adicionar entrada local
        const updatedEntries = [newEntry, ...entries];
        setEntries(updatedEntries);
        localStorage.setItem('flexi-gestor-entries', JSON.stringify(updatedEntries));

        // Adicionar movimentação no contexto global (usar custo médio quando há lotes)
        const averageCost = totalCost / totalQuantity;
        addMovement({
          type: 'entrada',
          productId: data.productId,
          productName: product.name,
          quantity: totalQuantity,
          unitPrice: averageCost,
          description: `Entrada de ${totalQuantity} unidades em ${selectedBatches.length} lote(s) - ${data.supplier}`,
          date: data.entryDate,
        });

        setIsAddDialogOpen(false);
        setSelectedBatches([]);
        setSelectedProductId("");
        form.reset();

        // Adicionar notificação
        addNotification(
          '📦 Nova Entrada Registrada',
          `Produto: ${product.name}\nQuantidade: ${totalQuantity} unidades\nLotes: ${selectedBatches.length}\nFornecedor: ${data.supplier}\nCusto Médio: R$ ${(totalCost / totalQuantity).toFixed(2)}\nTotal: R$ ${totalCost.toFixed(2)}`,
          'success'
        );

        toast({
          title: "✅ Entrada Registrada!",
          description: `${totalQuantity} unidades de ${product.name} foram registradas em ${selectedBatches.length} lote(s).`,
          variant: "default",
        });
      } catch (error: any) {
        toast({
          title: "❌ Erro ao Criar Lotes",
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

      // Adicionar entrada local
      const updatedEntries = [newEntry, ...entries];
      setEntries(updatedEntries);
      localStorage.setItem('flexi-gestor-entries', JSON.stringify(updatedEntries));

      // Adicionar movimentação no contexto global
      addMovement({
        type: 'entrada',
        productId: data.productId,
        productName: product.name,
        quantity: data.quantity,
        unitPrice: data.unitCost,
        description: `Entrada de ${data.quantity} unidades - ${data.supplier}`,
        date: data.entryDate,
      });

      setIsAddDialogOpen(false);
      form.reset();

      // Adicionar notificação
      addNotification(
        '📦 Nova Entrada Registrada',
        `Produto: ${product.name}\nQuantidade: ${data.quantity} unidades\nFornecedor: ${data.supplier}\nCusto: R$ ${data.unitCost.toFixed(2)}\nTotal: R$ ${(data.quantity * data.unitCost).toFixed(2)}`,
        'success'
      );

      toast({
        title: "✅ Entrada Registrada!",
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

    const updatedEntries = entries.map(e => e.id === editingEntry.id ? updatedEntry : e);
    setEntries(updatedEntries);
    localStorage.setItem('flexi-gestor-entries', JSON.stringify(updatedEntries));

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

  const deleteEntry = (entryId: string) => {
    const entry = entries.find(e => e.id === entryId);
    if (!entry) return;

    const updatedEntries = entries.filter(e => e.id !== entryId);
    setEntries(updatedEntries);
    localStorage.setItem('flexi-gestor-entries', JSON.stringify(updatedEntries));

    // Adicionar notificação
    addNotification(
        '🗑️ Entrada Removida',
        `Produto: ${entry.productName}\nQuantidade: ${entry.quantity} unidades\nFornecedor: ${entry.supplier}\nCusto: R$ ${entry.unitCost.toFixed(2)}\nTotal: R$ ${entry.totalCost.toFixed(2)}`,
        'warning'
      );

    toast({
      title: "🗑️ Entrada Removida!",
      description: `Entrada de ${entry.productName} foi removida com sucesso.`,
      variant: "default",
    });
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

  // Função para exportar dados em CSV com formatação profissional
  const exportToCSV = () => {
    if (filteredEntries.length === 0) {
      alert('Não há dados para exportar');
      return;
    }

    // Cabeçalho do relatório com formatação profissional e emojis
    const reportData = [
      ['🍇 FLEXI GESTOR - SISTEMA DE GESTÃO EMPRESARIAL'],
      ['📥 RELATÓRIO DE ENTRADAS DE ESTOQUE'],
      [''],
      ['📋 INFORMAÇÕES DO RELATÓRIO'],
      ['📅 Data de Geração:', new Date().toLocaleDateString('pt-BR', { 
        day: '2-digit', 
        month: '2-digit', 
        year: 'numeric',
        hour: '2-digit',
        minute: '2-digit'
      })],
      ['🕐 Hora de Geração:', new Date().toLocaleTimeString('pt-BR', { 
        hour: '2-digit', 
        minute: '2-digit' 
      })],
      ['📊 Total de Registros:', filteredEntries.length.toString()],
      [''],
      ['💰 RESUMO EXECUTIVO'],
      ['📦 Quantidade Total de Produtos', `${filteredEntries.reduce((sum, entry) => sum + entry.quantity, 0)} unidades`],
      ['💵 Custo Total das Entradas', `R$ ${filteredEntries.reduce((sum, entry) => sum + entry.totalCost, 0).toFixed(2).replace('.', ',')}`],
      ['📈 Custo Médio por Produto', `R$ ${(filteredEntries.reduce((sum, entry) => sum + entry.totalCost, 0) / filteredEntries.reduce((sum, entry) => sum + entry.quantity, 0)).toFixed(2).replace('.', ',')}`],
      [''],
      ['📋 DETALHAMENTO COMPLETO DAS ENTRADAS'],
      ['ID da Entrada', 'Nome do Produto', 'SKU do Produto', 'Fornecedor', 'Quantidade Recebida', 'Custo Unitário (R$)', 'Custo Total (R$)', 'Data de Entrada', 'Status da Entrada', 'Observações/Notas']
    ];

    // Adicionar dados das entradas com formatação melhorada
    filteredEntries.forEach(entry => {
      const entryDate = new Date(entry.entryDate);
      const formattedDate = entryDate.toLocaleDateString('pt-BR', {
        day: '2-digit',
        month: '2-digit', 
        year: 'numeric'
      });
      
      reportData.push([
        `#${entry.id}`,
        entry.productName,
        entry.productSku,
        entry.supplier,
        `${entry.quantity} unidades`,
        `R$ ${entry.unitCost.toFixed(2).replace('.', ',')}`,
        `R$ ${entry.totalCost.toFixed(2).replace('.', ',')}`,
        formattedDate,
        entry.status === 'completed' ? '✅ Concluída' : entry.status === 'pending' ? '⏳ Pendente' : '❌ Cancelada',
        entry.notes || '📝 Sem observações'
      ]);
    });

    // Adicionar rodapé do relatório com formatação profissional
    reportData.push([
      '',
      '',
      '',
      '',
      '',
      '',
      '',
      '',
      '',
      ''
    ]);
    reportData.push([
      '✅ RELATÓRIO GERADO AUTOMATICAMENTE PELO SISTEMA FLEXI GESTOR',
      '',
      '',
      '',
      '',
      '',
      '',
      '',
      '',
      ''
    ]);
    reportData.push([
      '📧 Para suporte técnico: contato@flexigestor.com',
      '',
      '',
      '',
      '',
      '',
      '',
      '',
      '',
      ''
    ]);
    reportData.push([
      '🌐 Sistema desenvolvido com tecnologia React + Firebase',
      '',
      '',
      '',
      '',
      '',
      '',
      '',
      '',
      ''
    ]);

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
          if (field.includes(',') || field.includes(';') || field.includes('\n') || field.includes('"') || field.includes('R$') || field.includes('📊') || field.includes('💰')) {
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

    // Criar e baixar o arquivo com nome profissional e informações extras
    const currentDate = new Date().toISOString().split('T')[0];
    const currentTime = new Date().toLocaleTimeString('pt-BR', { 
      hour: '2-digit', 
      minute: '2-digit' 
    }).replace(':', 'h');
    const fileName = `📥 RELATORIO_ENTRADAS_ESTOQUE_${currentDate}_${currentTime}.csv`;
    
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
    console.log('Aplicando filtros...');
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
            <h3 className="text-lg font-semibold text-gray-900 mb-2">📦 Carregando Entradas...</h3>
            <p className="text-gray-600">Preparando dados de estoque</p>
          </div>
        </div>
      </main>
    );
  }

  return (
    <main className="flex-1 p-3 sm:p-6 space-y-6 sm:space-y-8 bg-gradient-to-br from-neutral-50 to-neutral-100 min-h-screen">
      {/* Header Principal com Design Profissional */}
      <div className="space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <div className="space-y-2">
            <h1 className="text-3xl font-bold bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent flex items-center gap-2">
              <TrendingUp className="w-8 h-8 text-blue-600" />
              Entradas de Estoque
            </h1>
            <p className="text-base sm:text-lg md:text-xl text-neutral-600 max-w-2xl">
              Gerencie todas as entradas de produtos, registre compras e mantenha o controle completo do seu inventário
            </p>
          </div>
          
          {/* Botão de Nova Entrada com Design Sofisticado */}
          <Dialog open={isAddDialogOpen} onOpenChange={(open) => {
            setIsAddDialogOpen(open);
            if (!open) {
              // Limpar estados ao fechar
              setSelectedProductId("");
              setSelectedBatches([]);
            }
          }}>
            <DialogTrigger asChild>
              <Button className="w-full sm:w-auto bg-gradient-to-r from-indigo-600 to-indigo-700 hover:from-indigo-700 hover:to-indigo-800 text-white px-6 sm:px-8 py-3 sm:py-4 rounded-xl sm:rounded-2xl shadow-xl hover:shadow-2xl transition-all duration-200 transform hover:scale-105">
                <Plus className="w-5 h-5 sm:w-6 sm:h-6 mr-2 sm:mr-3" />
                Nova Entrada
              </Button>
            </DialogTrigger>
            
            {/* Modal de Nova Entrada com Design Melhorado */}
            <DialogContent className="max-w-[70vw] sm:max-w-4xl max-h-[70vh] overflow-y-auto mx-auto">
              <DialogHeader className="space-y-1 pb-2 sm:pb-3">
                <DialogTitle className="text-sm sm:text-xl font-bold text-neutral-900">
                  ✨ Registrar Nova Entrada
                </DialogTitle>
                <DialogDescription className="text-xs sm:text-sm text-neutral-600">
                  Preencha as informações detalhadas da entrada de estoque para manter o controle preciso
                </DialogDescription>
              </DialogHeader>
              
              <Form {...form}>
                <form onSubmit={form.handleSubmit(addEntry)} className="space-y-2 sm:space-y-3">
                  {/* Primeira linha - Produto e Fornecedor */}
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-2 sm:gap-3">
                    <FormField
                      control={form.control}
                      name="productId"
                      render={({ field }) => (
                        <FormItem className="space-y-2">
                          <FormLabel className="text-sm font-semibold text-neutral-700">
                            🏷️ Produto
                          </FormLabel>
                          <Select onValueChange={(value) => {
                            field.onChange(value);
                            loadBatchesForProduct(value);
                          }} defaultValue={field.value}>
                            <FormControl>
                              <SelectTrigger className="h-8 sm:h-10 border-2 border-neutral-200 rounded-xl focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500">
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
                        <FormItem className="space-y-2">
                          <FormLabel className="text-sm font-semibold text-neutral-700">
                            🏢 Fornecedor
                          </FormLabel>
                          <FormControl>
                            <Input 
                              placeholder="Nome do fornecedor" 
                              {...field} 
                              className="h-8 sm:h-10 border-2 border-neutral-200 rounded-xl focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
                            />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                  </div>

                  {/* Interface de Gestão de Lotes - Aparece quando produto é selecionado */}
                  {selectedProductId && (
                    <div className="bg-gradient-to-r from-indigo-50 to-purple-50 border-2 border-indigo-300 rounded-xl p-5">
                      <div className="flex items-center justify-between mb-4">
                        <div className="flex items-center space-x-2">
                          <Calendar className="h-5 w-5 text-indigo-600" />
                          <h4 className="font-bold text-indigo-900">📦 Distribuir Entrada por Lotes</h4>
                        </div>
                        <Button
                          type="button"
                          size="sm"
                          onClick={addBatchToEntry}
                          className="bg-indigo-600 hover:bg-indigo-700 text-white"
                        >
                          <Plus className="h-4 w-4 mr-1" />
                          Adicionar Lote
                        </Button>
                      </div>

                      {selectedBatches.length === 0 ? (
                        <div className="text-center py-4 bg-white/60 rounded-lg border-2 border-dashed border-indigo-300">
                          <Package className="h-8 w-8 sm:h-10 sm:w-10 mx-auto mb-2 text-indigo-400" />
                          <p className="text-sm text-indigo-700 font-medium">Nenhum lote adicionado</p>
                          <p className="text-xs text-indigo-600 mt-1">
                            💡 Clique em "Adicionar Lote" para distribuir a entrada entre lotes
                          </p>
                          <p className="text-xs text-indigo-600 mt-1">
                            Você pode criar novos lotes ou usar lotes existentes
                          </p>
                        </div>
                      ) : (
                        <div className="space-y-3">
                          {selectedBatches.map((batch, index) => {
                            const existingBatch = availableBatches.find(b => b.batchNumber === batch.batchNumber);
                            return (
                              <div key={index} className="bg-white rounded-lg p-3 border-2 border-indigo-200 shadow-sm">
                                <div className="space-y-3">
                                  <div className="grid grid-cols-2 gap-3">
                                    <div>
                                      <Label className="text-xs text-gray-600">Lote</Label>
                                      <Select
                                        value={batch.batchNumber}
                                        onValueChange={(value) => {
                                          const selectedBatch = availableBatches.find(b => b.batchNumber === value);
                                          if (selectedBatch) {
                                            updateBatchData(index, 'batchNumber', value);
                                            updateBatchData(index, 'manufactureDate', selectedBatch.manufactureDate ? new Date(selectedBatch.manufactureDate) : undefined);
                                            updateBatchData(index, 'expiryDate', selectedBatch.expiryDate ? new Date(selectedBatch.expiryDate) : undefined);
                                          } else {
                                            updateBatchData(index, 'batchNumber', value);
                                          }
                                        }}
                                      >
                                        <SelectTrigger className="h-9">
                                          <SelectValue placeholder="Selecione um lote" />
                                        </SelectTrigger>
                                        <SelectContent>
                                          {availableBatches.map(b => {
                                            const expiryDate = b.expiryDate ? new Date(b.expiryDate) : null;
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
                                              <SelectItem key={b.id} value={b.batchNumber}>
                                                {status} Lote {b.batchNumber} - {b.quantity} un.
                                                {b.expiryDate && ` (${new Date(b.expiryDate).toLocaleDateString('pt-BR')})`}
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
                                        value={batch.quantity || ''}
                                        onChange={(e) => updateBatchData(index, 'quantity', parseInt(e.target.value) || 0)}
                                        className="h-9"
                                      />
                                    </div>
                                  </div>
                                  <div className="grid grid-cols-3 gap-3">
                                    <div>
                                      <Label className="text-xs text-gray-600">Custo Unitário (R$)</Label>
                                      <Input
                                        type="number"
                                        step="0.01"
                                        min="0"
                                        placeholder="0.00"
                                        value={batch.unitCost || ''}
                                        onChange={(e) => updateBatchData(index, 'unitCost', parseFloat(e.target.value) || 0)}
                                        className="h-9"
                                      />
                                    </div>
                                    <div>
                                      <Label className="text-xs text-gray-600">Data de Fabricação</Label>
                                      <Input
                                        type="date"
                                        value={batch.manufactureDate ? (batch.manufactureDate instanceof Date ? batch.manufactureDate.toISOString().split('T')[0] : batch.manufactureDate) : ''}
                                        onChange={(e) => updateBatchData(index, 'manufactureDate', e.target.value ? new Date(e.target.value) : undefined)}
                                        className="h-9"
                                        disabled={!!existingBatch}
                                      />
                                    </div>
                                    <div>
                                      <Label className="text-xs text-gray-600">Data de Validade</Label>
                                      <Input
                                        type="date"
                                        value={batch.expiryDate ? (batch.expiryDate instanceof Date ? batch.expiryDate.toISOString().split('T')[0] : batch.expiryDate) : ''}
                                        onChange={(e) => updateBatchData(index, 'expiryDate', e.target.value ? new Date(e.target.value) : undefined)}
                                        className="h-9"
                                        disabled={!!existingBatch}
                                      />
                                    </div>
                                  </div>
                                  <Button
                                    type="button"
                                    variant="ghost"
                                    size="sm"
                                    onClick={() => removeBatchFromEntry(index)}
                                    className="w-full text-red-600 hover:text-red-700 hover:bg-red-50"
                                  >
                                    <Trash2 className="h-4 w-4 mr-1" />
                                    Remover Lote
                                  </Button>
                                </div>
                              </div>
                            );
                          })}
                          
                          {/* Resumo da distribuição */}
                          <div className="bg-white/60 rounded-lg p-3 border-2 border-indigo-300 space-y-2">
                            <div className="flex items-center justify-between">
                              <span className="text-sm font-medium text-indigo-900">
                                📊 Total a Entrar:
                              </span>
                              <span className="text-lg font-bold text-indigo-600">
                                {getTotalBatchQuantity()} unidades
                              </span>
                            </div>
                            <div className="flex items-center justify-between pt-2 border-t border-indigo-200">
                              <span className="text-sm font-medium text-indigo-900">
                                💰 Valor Total:
                              </span>
                              <span className="text-lg font-bold text-emerald-600">
                                R$ {selectedBatches.reduce((total, batch) => total + (batch.quantity * (batch.unitCost || 0)), 0).toFixed(2)}
                              </span>
                            </div>
                          </div>
                        </div>
                      )}
                      
                      <p className="text-xs text-indigo-700 mt-3 bg-white/40 p-2 rounded">
                        💡 <strong>Dica:</strong> Adicione lotes para controlar validades e rastreabilidade do estoque
                      </p>
                    </div>
                  )}
                  
                  {/* Segunda linha - Data e Status */}
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4 sm:gap-8">
                    <FormField
                      control={form.control}
                      name="entryDate"
                      render={({ field }) => (
                        <FormItem className="space-y-2">
                          <FormLabel className="text-sm font-semibold text-neutral-700">
                            📅 Data de Entrada
                          </FormLabel>
                          <FormControl>
                            <Input 
                              type="date" 
                              {...field}
                              value={field.value instanceof Date ? field.value.toISOString().split('T')[0] : ''}
                              onChange={(e) => field.onChange(new Date(e.target.value))}
                              className="h-8 sm:h-10 border-2 border-neutral-200 rounded-xl focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
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
                        <FormItem className="space-y-2">
                          <FormLabel className="text-sm font-semibold text-neutral-700">
                            📋 Status
                          </FormLabel>
                          <Select onValueChange={field.onChange} defaultValue={field.value}>
                            <FormControl>
                              <SelectTrigger className="h-8 sm:h-10 border-2 border-neutral-200 rounded-xl focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500">
                                <SelectValue />
                              </SelectTrigger>
                            </FormControl>
                            <SelectContent>
                              <SelectItem value="pendente">⏳ Pendente</SelectItem>
                              <SelectItem value="aprovado">✅ Aprovado</SelectItem>
                              <SelectItem value="cancelado">❌ Cancelado</SelectItem>
                            </SelectContent>
                          </Select>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                  </div>
                  
                  {/* Campo de Observações */}
                  <FormField
                    control={form.control}
                    name="notes"
                    render={({ field }) => (
                      <FormItem className="space-y-2">
                        <FormLabel className="text-sm font-semibold text-neutral-700">
                          📝 Observações
                        </FormLabel>
                        <FormControl>
                          <Input 
                            placeholder="Observações adicionais sobre a entrada..." 
                            {...field} 
                            className="h-8 sm:h-10 border-2 border-neutral-200 rounded-xl focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
                          />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  
                  {/* Footer do Modal */}
                  <DialogFooter className="pt-2 sm:pt-3 border-t border-neutral-200 flex flex-col sm:flex-row gap-2">
                    <Button 
                      type="button" 
                      variant="outline" 
                      onClick={() => setIsAddDialogOpen(false)}
                      className="w-full sm:w-auto border-2 border-neutral-300 text-neutral-700 hover:bg-neutral-50 h-9 text-sm"
                    >
                      ❌ Cancelar
                    </Button>
                    <Button 
                      type="submit"
                      className="w-full sm:w-auto bg-gradient-to-r from-indigo-600 to-indigo-700 hover:from-indigo-700 hover:to-indigo-800 text-white shadow-lg hover:shadow-xl transition-all duration-200 h-9 text-sm"
                    >
                      ✨ Registrar Entrada
                    </Button>
                  </DialogFooter>
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
          <h3 className="text-base sm:text-lg font-semibold mb-2">📈 Total de Entradas</h3>
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
          <h3 className="text-base sm:text-lg font-semibold mb-2">💰 Valor Total</h3>
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
          <h3 className="text-base sm:text-lg font-semibold mb-2">📅 Este Mês</h3>
          <p className="text-xs sm:text-sm opacity-80">Entradas do período</p>
        </div>
      </div>

      {/* Barra de Busca e Filtros com Design Profissional */}
      <Card className="bg-white border-0 shadow-xl rounded-2xl sm:rounded-3xl overflow-hidden">
        <CardContent className="p-4 sm:p-6 md:p-8">
          <div className="flex flex-col md:flex-row gap-4 sm:gap-6 items-center justify-between">
            <div className="relative flex-1 max-w-md w-full">
              <Search className="absolute left-3 sm:left-4 top-1/2 transform -translate-y-1/2 text-neutral-400 w-4 h-4 sm:w-5 sm:h-5" />
              <Input
                placeholder="🔍 Buscar entradas por produto ou fornecedor..."
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
      <Card className="bg-white border-0 shadow-xl rounded-3xl overflow-hidden">
        <CardHeader className="bg-gradient-to-r from-neutral-50 to-neutral-100 border-b border-neutral-200">
          <CardTitle className="text-2xl font-bold text-neutral-900">
            📋 Lista de Entradas
          </CardTitle>
        </CardHeader>
        <CardContent className="p-0">
          <div className="overflow-hidden">
            <Table className="w-full">
              <TableHeader className="bg-neutral-50">
                <TableRow className="border-neutral-200 hover:bg-neutral-100">
                  <TableHead className="font-semibold text-neutral-700 py-4 sm:py-6 px-2 sm:px-4 text-xs sm:text-sm">Produto</TableHead>
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
                            Nenhuma entrada encontrada
                          </p>
                          <p className="text-sm sm:text-base text-neutral-500 max-w-md mx-auto">
                            Comece registrando sua primeira entrada de estoque para manter o controle do seu inventário
                          </p>
                        </div>
                        <div className="pt-2 sm:pt-4">
                          <Button 
                            onClick={() => setIsAddDialogOpen(true)}
                            className="bg-gradient-to-r from-indigo-600 to-indigo-700 hover:from-indigo-700 hover:to-indigo-800 text-white px-4 sm:px-6 py-2 sm:py-3 rounded-xl sm:rounded-2xl shadow-lg hover:shadow-xl transition-all duration-200"
                          >
                            <Plus className="w-4 h-4 sm:w-5 sm:h-5 mr-2" />
                            Registrar Primeira Entrada
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
                          {entry.status === "aprovado" && "✅ Aprovado"}
                          {entry.status === "pendente" && "⏳ Pendente"}
                          {entry.status === "cancelado" && "❌ Cancelado"}
                        </Badge>
                      </TableCell>
                      <TableCell className="py-4 sm:py-6 px-2 sm:px-4 text-right">
                        <div className="flex items-center justify-end space-x-1 sm:space-x-3">
                          <Button 
                            variant="ghost" 
                            size="sm"
                            onClick={() => openEditDialog(entry)}
                            className="text-indigo-600 hover:text-indigo-700 hover:bg-indigo-50 p-2 sm:p-3 rounded-xl sm:rounded-2xl transition-all duration-150"
                          >
                            <Edit className="h-3 w-3 sm:h-4 sm:w-4" />
                          </Button>
                          <Button 
                            variant="ghost" 
                            size="sm"
                            onClick={() => deleteEntry(entry.id)}
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

      {/* Modal de Edição com Design Sofisticado */}
      <Dialog open={isEditDialogOpen} onOpenChange={setIsEditDialogOpen}>
        <DialogContent className="max-w-3xl bg-white rounded-xl shadow-2xl border-0">
          <DialogHeader className="space-y-3 pb-6">
            <DialogTitle className="text-2xl font-bold text-neutral-900">
              ✏️ Editar Entrada
            </DialogTitle>
            <DialogDescription className="text-neutral-600 text-base">
              Atualize as informações da entrada de estoque selecionada
            </DialogDescription>
          </DialogHeader>
          
          <Form {...form}>
            <form onSubmit={form.handleSubmit(editEntry)} className="space-y-6">
              {/* Primeira linha - Produto e Fornecedor */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <FormField
                  control={form.control}
                  name="productId"
                  render={({ field }) => (
                    <FormItem className="space-y-2">
                      <FormLabel className="text-sm font-semibold text-neutral-700">
                        🏷️ Produto
                      </FormLabel>
                      <Select onValueChange={field.onChange} defaultValue={field.value}>
                        <FormControl>
                          <SelectTrigger className="h-12 border-neutral-200 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500">
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
                    <FormItem className="space-y-2">
                      <FormLabel className="text-sm font-semibold text-neutral-700">
                        🏢 Fornecedor
                      </FormLabel>
                      <FormControl>
                        <Input 
                          placeholder="Nome do fornecedor" 
                          {...field} 
                          className="h-12 border-neutral-200 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                        />
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
                  render={({ field }) => (
                    <FormItem className="space-y-2">
                      <FormLabel className="text-sm font-semibold text-neutral-700">
                        📊 Quantidade
                      </FormLabel>
                      <FormControl>
                        <Input 
                          type="number" 
                          placeholder="0" 
                          {...field}
                          onChange={(e) => field.onChange(parseInt(e.target.value) || 0)}
                          className="h-12 border-neutral-200 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
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
                        💰 Custo Unitário
                      </FormLabel>
                      <FormControl>
                        <Input 
                          type="number" 
                          step="0.01" 
                          placeholder="0.00" 
                          {...field}
                          onChange={(e) => field.onChange(parseFloat(e.target.value) || 0)}
                          className="h-12 border-neutral-200 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
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
                    <FormItem className="space-y-2">
                      <FormLabel className="text-sm font-semibold text-neutral-700">
                        📅 Data de Entrada
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
                    <FormItem className="space-y-2">
                      <FormLabel className="text-sm font-semibold text-neutral-700">
                        🎯 Status
                      </FormLabel>
                      <Select onValueChange={field.onChange} defaultValue={field.value}>
                        <FormControl>
                          <SelectTrigger className="h-12 border-neutral-200 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500">
                            <SelectValue />
                          </SelectTrigger>
                        </FormControl>
                        <SelectContent>
                          <SelectItem value="pendente">⏳ Pendente</SelectItem>
                          <SelectItem value="aprovado">✅ Aprovado</SelectItem>
                          <SelectItem value="cancelado">❌ Cancelado</SelectItem>
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
                      📝 Observações
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
                  ✏️ Atualizar Entrada
                </Button>
              </DialogFooter>
            </form>
          </Form>
        </DialogContent>
      </Dialog>
    </main>
  );
};

export default Entradas;
