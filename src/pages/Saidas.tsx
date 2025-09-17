import React, { useState, useEffect } from "react";
import { Plus, TrendingDown, Package, Search, Edit, Trash2, Calendar, DollarSign, ShoppingCart } from "lucide-react";


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
import { useFirebaseData } from "@/contexts/FirebaseDataContext";

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
  const [isEditDialogOpen, setIsEditDialogOpen] = useState(false);
  const [editingExit, setEditingExit] = useState<StockExit | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  // Hooks
  const { toast } = useToast();
  const { products, addMovement } = useFirebaseData();

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

  // Funções
  const handleAddExit = (data: StockExitFormData) => {
    const product = products.find(p => p.id === data.productId);
    if (!product) {
      toast({
        title: "❌ Erro!",
        description: "Produto não encontrado.",
        variant: "destructive",
      });
      return;
    }

    // Verificar se há estoque suficiente
    if (product.stock < data.quantity) {
      toast({
        title: "⚠️ Estoque Insuficiente!",
        description: `Estoque disponível: ${product.stock} unidades`,
        variant: "destructive",
      });
      return;
    }

    const newExit: StockExit = {
      ...data,
      id: Date.now().toString(),
      productName: product.name,
      productSku: product.sku,
      totalPrice: data.quantity * data.unitPrice,
      exitDate: data.exitDate,
    };

    // Adicionar saída local
    const updatedExits = [newExit, ...exits];
    setExits(updatedExits);
    localStorage.setItem('flexi-gestor-exits', JSON.stringify(updatedExits));

    // Adicionar movimentação no contexto global (isso atualiza o estoque automaticamente)
    addMovement({
      type: 'saida',
      productId: data.productId,
      productName: product.name,
      quantity: data.quantity,
      unitPrice: data.unitPrice,
      description: `Saída de ${data.quantity} unidades - ${data.customer}`,
      date: data.exitDate,
    });

    setIsAddDialogOpen(false);
    form.reset();

    toast({
      title: "✅ Saída Registrada!",
      description: `${data.quantity} unidades de ${product.name} foram vendidas.`,
      variant: "default",
    });

    // Adicionar notificação
    if ((window as any).addNotification) {
      (window as any).addNotification(
        '🛒 Nova Saída Registrada',
        `Produto: ${product.name}\nQuantidade: ${data.quantity} unidades\nCliente: ${data.customer}\nPreço: R$ ${data.unitPrice.toFixed(2)}\nTotal: R$ ${(data.quantity * data.unitPrice).toFixed(2)}`,
        'success'
      );
    }
  };

  const handleEditExit = (data: StockExitFormData) => {
    if (!editingExit) return;

    const product = products.find(p => p.id === data.productId);
    if (!product) {
      toast({
        title: "❌ Erro!",
        description: "Produto não encontrado.",
        variant: "destructive",
      });
      return;
    }

    const updatedExit: StockExit = {
      ...editingExit,
      ...data,
      productName: product.name,
      productSku: product.sku,
      totalPrice: data.quantity * data.unitPrice,
      exitDate: data.exitDate,
    };

    // Atualizar movimentação no contexto global
    addMovement({
      type: 'saida',
      productId: data.productId,
      productName: product.name,
      quantity: data.quantity,
      unitPrice: data.unitPrice,
      description: `Saída atualizada de ${data.quantity} unidades - ${data.customer}`,
      date: data.exitDate,
    });

    const updatedExits = exits.map(e => e.id === editingExit.id ? updatedExit : e);
    setExits(updatedExits);
    localStorage.setItem('flexi-gestor-exits', JSON.stringify(updatedExits));

    setIsEditDialogOpen(false);
    setEditingExit(null);
    form.reset();

    // Adicionar notificação
    if ((window as any).addNotification) {
      (window as any).addNotification(
        '✏️ Saída Atualizada',
        `Produto: ${product.name}\nQuantidade: ${data.quantity} unidades\nCliente: ${data.customer}\nPreço: R$ ${data.unitPrice.toFixed(2)}\nTotal: R$ ${(data.quantity * data.unitPrice).toFixed(2)}\nStatus: ${data.status}`,
        'info'
      );
    }

    toast({
      title: "✏️ Saída Atualizada!",
      description: `Saída de ${product.name} foi atualizada com sucesso.`,
      variant: "default",
    });
  };

  const handleDeleteExit = (exitId: string) => {
    const exit = exits.find(e => e.id === exitId);
    if (!exit) return;
    
    const updatedExits = exits.filter(e => e.id !== exitId);
    setExits(updatedExits);
    localStorage.setItem('flexi-gestor-exits', JSON.stringify(updatedExits));

    // Adicionar notificação
    if ((window as any).addNotification) {
      (window as any).addNotification(
        '🗑️ Saída Removida',
        `Produto: ${exit.productName}\nQuantidade: ${exit.quantity} unidades\nCliente: ${exit.customer}\nPreço: R$ ${exit.unitPrice.toFixed(2)}\nTotal: R$ ${exit.totalPrice.toFixed(2)}`,
        'warning'
      );
    }

    toast({
      title: "🗑️ Saída Removida!",
      description: `Saída de ${exit.productName} foi removida com sucesso.`,
      variant: "default",
    });
  };

  const openEditDialog = (exit: StockExit) => {
    setEditingExit(exit);
    form.reset({
      productId: exit.productId,
      quantity: exit.quantity,
      unitPrice: exit.unitPrice,
      customer: exit.customer,
      exitDate: exit.exitDate,
      notes: exit.notes,
      status: exit.status,
    });
    setIsEditDialogOpen(true);
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
                  <Button>
                    <Plus className="w-4 h-4 mr-2" />
                    Nova Saída
                  </Button>
                </DialogTrigger>
                <DialogContent className="max-w-2xl">
                  <DialogHeader>
                    <DialogTitle>Registrar Nova Saída</DialogTitle>
                    <DialogDescription>
                      Preencha as informações da saída de estoque.
                    </DialogDescription>
                  </DialogHeader>
                  <Form {...form}>
                    <form onSubmit={form.handleSubmit(handleAddExit)} className="space-y-4">
                      <div className="grid grid-cols-2 gap-4">
                        <FormField
                          control={form.control}
                          name="productId"
                          render={({ field }) => (
                            <FormItem>
                              <FormLabel>Produto</FormLabel>
                              <Select onValueChange={field.onChange} defaultValue={field.value}>
                                <FormControl>
                                  <SelectTrigger>
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
                          name="customer"
                          render={({ field }) => (
                            <FormItem>
                              <FormLabel>Cliente</FormLabel>
                              <FormControl>
                                <Input placeholder="Nome do cliente" {...field} />
                              </FormControl>
                              <FormMessage />
                            </FormItem>
                          )}
                        />
                      </div>
                      
                      <div className="grid grid-cols-2 gap-4">
                        <FormField
                          control={form.control}
                          name="quantity"
                          render={({ field }) => (
                            <FormItem>
                              <FormLabel>Quantidade</FormLabel>
                              <FormControl>
                                <Input 
                                  type="number" 
                                  placeholder="0" 
                                  {...field}
                                  onChange={(e) => field.onChange(parseInt(e.target.value) || 0)}
                                />
                              </FormControl>
                              <FormMessage />
                            </FormItem>
                          )}
                        />
                        <FormField
                          control={form.control}
                          name="unitPrice"
                          render={({ field }) => (
                            <FormItem>
                              <FormLabel>Preço Unitário</FormLabel>
                              <FormControl>
                                <Input 
                                  type="number" 
                                  step="0.01" 
                                  placeholder="0.00" 
                                  {...field}
                                  onChange={(e) => field.onChange(parseFloat(e.target.value) || 0)}
                                />
                              </FormControl>
                              <FormMessage />
                            </FormItem>
                          )}
                        />
                      </div>
                      
                      <div className="grid grid-cols-2 gap-4">
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
                      
                      <DialogFooter>
                        <Button type="button" variant="outline" onClick={() => setIsAddDialogOpen(false)}>
                          Cancelar
                        </Button>
                        <Button type="submit">Registrar Saída</Button>
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
                        <TableHead className="text-right font-semibold text-slate-700">⚙️ Ações</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {filteredExits.length === 0 ? (
                        <TableRow>
                          <TableCell colSpan={8} className="text-center py-12">
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
                            <TableCell className="text-right">
                              <div className="flex items-center justify-end gap-2">
                                <Button 
                                  variant="ghost" 
                                  size="sm"
                                  onClick={() => openEditDialog(exit)}
                                  className="hover:bg-blue-50 hover:text-blue-600 transition-colors"
                                >
                                  <Edit className="h-4 w-4" />
                                </Button>
                                <Button 
                                  variant="ghost" 
                                  size="sm"
                                  onClick={() => handleDeleteExit(exit.id)}
                                  className="hover:bg-red-50 hover:text-red-600 transition-colors"
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
                    </main>
        );
};

export default Saidas;
