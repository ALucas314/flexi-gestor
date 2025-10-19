import React, { useState, useEffect } from "react";
import { Plus, Search, Edit, Trash2, Package, Calendar } from "lucide-react";
import { BatchManager } from "@/components/BatchManager";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Form, FormControl, FormDescription, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { ResponsiveTable, TableColumn, TableAction, ResponsiveBadge } from "@/components/ui/responsive-table";
import { useForm } from "react-hook-form";
import { useToast } from "@/hooks/use-toast";
import { useData } from "@/contexts/DataContext";
import { useResponsive } from "@/hooks/use-responsive";

// Interface do produto
interface Product {
  id: string;
  name: string;
  description: string;
  category: string;
  price: number;
  stock: number;
  minStock: number;
  sku: string;
  status: "ativo" | "inativo";
}

type ProductFormData = Omit<Product, 'id'>;

const Produtos = () => {
  // Estados
  const [searchTerm, setSearchTerm] = useState("");
  const [isAddDialogOpen, setIsAddDialogOpen] = useState(false);
  const [isEditDialogOpen, setIsEditDialogOpen] = useState(false);
  const [editingProduct, setEditingProduct] = useState<Product | null>(null);
  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false);
  const [productToDelete, setProductToDelete] = useState<Product | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isBatchDialogOpen, setIsBatchDialogOpen] = useState(false);
  const [selectedProductForBatch, setSelectedProductForBatch] = useState<Product | null>(null);

  // Hooks
  const { toast } = useToast();
  const { isMobile } = useResponsive();
  const { products, addProduct: addProductContext, updateProduct, deleteProduct: deleteProductContext } = useData();

  // Controlar estado de carregamento
  useEffect(() => {
    // Simular carregamento inicial
    const timer = setTimeout(() => {
      setIsLoading(false);
    }, 500);
    
    return () => clearTimeout(timer);
  }, []);

  // Gerar próximo SKU automaticamente
  const generateNextSKU = () => {
    if (products.length === 0) {
      return "1";
    }
    
    // Pegar todos os SKUs numéricos
    const numericSKUs = products
      .map(p => parseInt(p.sku))
      .filter(n => !isNaN(n))
      .sort((a, b) => b - a); // Ordenar decrescente
    
    if (numericSKUs.length === 0) {
      return "1";
    }
    
    return (numericSKUs[0] + 1).toString();
  };

  // Formulário
  const form = useForm<ProductFormData>({
    defaultValues: {
      name: "",
      description: "",
      category: "",
      price: 0,
      stock: 0,
      minStock: 0,
      sku: "",
      status: "ativo",
    },
  });

  // Filtros
  const filteredProducts = products.filter(product =>
    product.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    product.sku.toLowerCase().includes(searchTerm.toLowerCase())
  );

  // Categorias únicas
  const categories = [...new Set(products.map(product => product.category))];

  // Definição das colunas da tabela responsiva
  const columns: TableColumn<Product>[] = [
    {
      key: 'name',
      label: 'Nome',
      priority: 'high',
      render: (product) => (
        <div>
          <div className="font-medium text-sm sm:text-base">{product.name}</div>
          <div className="text-xs sm:text-sm text-muted-foreground">{product.sku}</div>
          {isMobile && (
            <div className="text-xs sm:text-sm text-muted-foreground mt-1">{product.category}</div>
          )}
        </div>
      )
    },
    {
      key: 'category',
      label: 'Categoria',
      hideOnMobile: true,
      priority: 'medium'
    },
    {
      key: 'price',
      label: 'Preço',
      priority: 'high',
      render: (product) => (
        <span className="text-sm sm:text-base">R$ {product.price.toFixed(2).replace('.', ',')}</span>
      )
    },
    {
      key: 'stock',
      label: 'Estoque',
      priority: 'high',
      render: (product) => (
        <div className="flex items-center gap-2">
          <span className={`text-sm sm:text-base ${product.stock <= product.minStock ? 'text-red-600 font-medium' : ''}`}>
            {product.stock}
          </span>
          {product.stock <= product.minStock && (
            <ResponsiveBadge variant="destructive" className="text-xs">
              Baixo
            </ResponsiveBadge>
          )}
        </div>
      )
    },
    {
      key: 'status',
      label: 'Status',
      hideOnMobile: true,
      priority: 'low',
      render: (product) => (
        <ResponsiveBadge variant={product.status === 'ativo' ? 'default' : 'secondary'}>
          {product.status === 'ativo' ? 'Ativo' : 'Inativo'}
        </ResponsiveBadge>
      )
    }
  ];

  // Funções CRUD (definidas antes de serem usadas)
  const openEditDialog = (product: Product) => {
    setEditingProduct(product);
    form.reset({
      name: product.name,
      description: product.description,
      category: product.category,
      price: product.price,
      stock: product.stock,
      minStock: product.minStock,
      sku: product.sku,
      status: product.status,
    });
    setIsEditDialogOpen(true);
  };

  const handleDeleteProduct = (product: Product) => {
    setProductToDelete(product);
    setIsDeleteDialogOpen(true);
  };

  // Abrir gerenciador de lotes
  const openBatchManager = (product: Product) => {
    setSelectedProductForBatch(product);
    setIsBatchDialogOpen(true);
  };

  // Definição das ações da tabela
  const actions: TableAction<Product>[] = [
    {
      label: 'Lotes',
      icon: <Calendar className="h-3 w-3 sm:h-4 sm:w-4" />,
      onClick: openBatchManager,
      variant: 'ghost',
      className: 'text-indigo-600 hover:text-indigo-700 hover:bg-indigo-50'
    },
    {
      label: 'Editar',
      icon: <Edit className="h-3 w-3 sm:h-4 sm:w-4" />,
      onClick: openEditDialog,
      variant: 'ghost'
    },
    {
      label: 'Excluir',
      icon: <Trash2 className="h-3 w-3 sm:h-4 sm:w-4" />,
      onClick: handleDeleteProduct,
      variant: 'ghost',
      className: 'text-red-600 hover:text-red-700 hover:bg-red-50'
    }
  ];

  // Funções CRUD
  const handleAddProduct = async (data: ProductFormData) => {
    try {
      await addProductContext(data);
      setIsAddDialogOpen(false);
      form.reset();

      toast({
        title: "✅ Produto Adicionado!",
        description: `${data.name} foi adicionado com sucesso ao catálogo.`,
        variant: "default",
      });
    } catch (error: any) {
      console.error('❌ Erro ao adicionar produto:', error);
      
      // Mensagem de erro específica
      let errorTitle = "❌ Erro ao Adicionar Produto";
      let errorMessage = "Não foi possível adicionar o produto. Tente novamente.";
      
      if (error.message?.includes('SKU')) {
        errorTitle = "⚠️ SKU Duplicado!";
        errorMessage = `Não é possível inserir devido já existir um item com o código SKU "${data.sku}". Por favor, escolha outro código único.`;
      }
      
      toast({
        title: errorTitle,
        description: errorMessage,
        variant: "destructive",
        duration: 6000,
      });
    }
  };

  const handleEditProduct = async (data: ProductFormData) => {
    if (!editingProduct) return;

    try {
      await updateProduct(editingProduct.id, data);
      setIsEditDialogOpen(false);
      setEditingProduct(null);
      form.reset();

      toast({
        title: "✅ Produto Atualizado!",
        description: `${data.name} foi atualizado com sucesso.`,
        variant: "default",
      });
    } catch (error) {
      console.error('❌ Erro ao atualizar produto:', error);
      toast({
        title: "❌ Erro ao Atualizar Produto",
        description: "Não foi possível atualizar o produto. Tente novamente.",
        variant: "destructive",
      });
    }
  };

  const confirmDelete = async () => {
    if (!productToDelete) return;

    try {
      await deleteProductContext(productToDelete.id);
      setIsDeleteDialogOpen(false);
      setProductToDelete(null);

      toast({
        title: "🗑️ Produto Removido!",
        description: `${productToDelete.name} foi removido do catálogo.`,
        variant: "default",
      });
    } catch (error) {
      console.error('❌ Erro ao deletar produto:', error);
      toast({
        title: "❌ Erro ao Remover Produto",
        description: "Não foi possível remover o produto. Tente novamente.",
        variant: "destructive",
      });
    }
  };

  // Debug: Log do estado atual
  console.log('🔍 Estado da página Produtos:', {
    productsCount: products.length,
    searchTerm,
    filteredProductsCount: filteredProducts.length,
    isAddDialogOpen,
    isEditDialogOpen,
    isLoading
  });

  // Tela de carregamento
  if (isLoading) {
    return (
      <main className="flex-1 p-3 sm:p-6 space-y-4 sm:space-y-6">
        <div className="flex items-center justify-center min-h-[400px]">
          <div className="text-center">
            <div className="w-16 h-16 bg-gradient-to-br from-purple-500 to-blue-500 rounded-full flex items-center justify-center mx-auto mb-4 animate-pulse">
              <Package className="w-8 h-8 text-white" />
            </div>
            <h3 className="text-lg font-semibold text-gray-900 mb-2">🍇 Carregando Produtos...</h3>
            <p className="text-gray-600">Preparando seu catálogo de produtos</p>
          </div>
        </div>
      </main>
    );
  }

  return (
    <main className="flex-1 p-2 sm:p-6 space-y-3 sm:space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2 sm:gap-4">
        <div>
          <h1 className="text-3xl font-bold bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent flex items-center gap-2">
            <Package className="w-8 h-8 text-blue-600" />
            Produtos
          </h1>
          <p className="text-xs sm:text-base text-muted-foreground">Gerencie seu catálogo completo de produtos</p>
        </div>
        <Dialog open={isAddDialogOpen} onOpenChange={(open) => {
          setIsAddDialogOpen(open);
          if (open) {
            // Limpar formulário e gerar SKU automaticamente ao abrir
            form.reset({
              name: "",
              description: "",
              category: "",
              price: 0,
              stock: 0,
              minStock: 0,
              sku: generateNextSKU(),
              status: "ativo",
            });
          }
        }}>
          <DialogTrigger asChild>
            <Button className="w-full sm:w-auto bg-gradient-to-r from-indigo-600 to-indigo-700 hover:from-indigo-700 hover:to-indigo-800 text-white px-6 sm:px-8 py-3 sm:py-4 rounded-xl sm:rounded-2xl shadow-xl hover:shadow-2xl transition-all duration-200 transform hover:scale-105">
              <Plus className="w-5 h-5 sm:w-6 sm:h-6 mr-2 sm:mr-3" />
              Novo Produto
            </Button>
          </DialogTrigger>
          <DialogContent className="max-w-[70vw] sm:max-w-2xl max-h-[70vh] overflow-y-auto mx-auto">
            <DialogHeader className="space-y-1 pb-2 sm:pb-3">
              <DialogTitle className="text-sm sm:text-base">📦 Adicionar Novo Produto</DialogTitle>
              <DialogDescription className="text-xs">
                Preencha as informações detalhadas do produto para seu catálogo.
              </DialogDescription>
            </DialogHeader>
            <Form {...form}>
              <form onSubmit={form.handleSubmit(handleAddProduct)} className="space-y-2 sm:space-y-3">
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 sm:gap-3">
                  <FormField
                    control={form.control}
                    name="name"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel className="text-xs sm:text-sm">Nome do Produto</FormLabel>
                        <FormControl>
                          <Input placeholder="Ex: Produto Exemplo 500ml" {...field} className="h-8 sm:h-10" />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  <FormField
                    control={form.control}
                    name="sku"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel className="text-sm sm:text-base flex items-center justify-between">
                          <span>SKU (Código)</span>
                          <span className="text-xs text-gray-500 font-normal">
                            Gerado: {generateNextSKU()}
                          </span>
                        </FormLabel>
                        <FormControl>
                          <Input placeholder="Gerado automaticamente ou digite seu código" {...field} className="h-8 sm:h-10" />
                        </FormControl>
                        <FormDescription className="text-xs">
                          💡 O código é gerado automaticamente, mas você pode editá-lo
                        </FormDescription>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </div>

                <FormField
                  control={form.control}
                  name="description"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel className="text-sm sm:text-base">Descrição do Produto</FormLabel>
                      <FormControl>
                        <Textarea
                          placeholder="Descreva o produto, ingredientes, benefícios, tamanho, etc..."
                          className="min-h-[80px] text-sm sm:text-base"
                          {...field}
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 sm:gap-3">
                  <FormField
                    control={form.control}
                    name="category"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel className="text-xs sm:text-sm">Categoria</FormLabel>
                        <Select onValueChange={field.onChange} defaultValue={field.value}>
                          <FormControl>
                            <SelectTrigger className="h-8 sm:h-10">
                              <SelectValue placeholder="Selecione uma categoria" />
                            </SelectTrigger>
                          </FormControl>
                          <SelectContent>
                            <SelectItem value="Alimentos">🍽️ Alimentos</SelectItem>
                            <SelectItem value="Bebidas">🥤 Bebidas</SelectItem>
                            <SelectItem value="Eletrônicos">📱 Eletrônicos</SelectItem>
                            <SelectItem value="Roupas">👕 Roupas</SelectItem>
                            <SelectItem value="Acessórios">💍 Acessórios</SelectItem>
                            <SelectItem value="Complementos">🥜 Complementos (Granola, Frutas)</SelectItem>
                            <SelectItem value="Embalagens">📦 Embalagens e Copos</SelectItem>
                            <SelectItem value="Outros">🔧 Outros Produtos</SelectItem>
                          </SelectContent>
                        </Select>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  <FormField
                    control={form.control}
                    name="status"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel className="text-xs sm:text-sm">Status do Produto</FormLabel>
                        <Select onValueChange={field.onChange} defaultValue={field.value}>
                          <FormControl>
                            <SelectTrigger className="h-8 sm:h-10">
                              <SelectValue />
                            </SelectTrigger>
                          </FormControl>
                          <SelectContent>
                            <SelectItem value="ativo">✅ Ativo (Disponível para Venda)</SelectItem>
                            <SelectItem value="inativo">❌ Inativo (Indisponível)</SelectItem>
                          </SelectContent>
                        </Select>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 sm:gap-4">
                  <FormField
                    control={form.control}
                    name="price"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel className="text-xs sm:text-sm">Preço de Venda (R$)</FormLabel>
                        <FormControl>
                          <Input
                            type="number"
                            step="0.01"
                            placeholder="0.00"
                            className="h-8 sm:h-10"
                            {...field}
                            onChange={(e) => field.onChange(parseFloat(e.target.value) || 0)}
                          />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  <FormField
                    control={form.control}
                    name="stock"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel className="text-xs sm:text-sm">Estoque Atual</FormLabel>
                        <FormControl>
                          <Input
                            type="number"
                            placeholder="0"
                            className="h-8 sm:h-10"
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
                    name="minStock"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel className="text-xs sm:text-sm">Estoque Mínimo</FormLabel>
                        <FormControl>
                          <Input
                            type="number"
                            placeholder="0"
                            className="h-8 sm:h-10"
                            {...field}
                            onChange={(e) => field.onChange(parseInt(e.target.value) || 0)}
                          />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </div>

                <DialogFooter className="flex flex-col sm:flex-row gap-2 pt-2 sm:pt-3">
                  <Button type="button" variant="outline" onClick={() => setIsAddDialogOpen(false)} className="w-full sm:w-auto h-8 text-xs">
                    ❌ Cancelar
                  </Button>
                  <Button type="submit" className="w-full sm:w-auto h-8 text-xs">📦 Adicionar Produto</Button>
                </DialogFooter>
              </form>
            </Form>
          </DialogContent>
        </Dialog>
      </div>

      {/* Estatísticas */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-2 sm:gap-4">
        <div className="group bg-gradient-to-br from-blue-100 to-blue-200 rounded-xl sm:rounded-3xl p-3 sm:p-6 text-blue-800 shadow-lg hover:shadow-xl transition-all duration-300 hover:scale-105 border border-blue-200/50">
          <div className="flex items-center justify-between mb-2 sm:mb-4">
            <div className="w-8 h-8 sm:w-12 sm:h-12 bg-blue-300/50 rounded-lg sm:rounded-2xl flex items-center justify-center backdrop-blur-sm">
              <Package className="w-4 h-4 sm:w-6 sm:h-6 text-blue-700" />
            </div>
            <div className="text-right">
              <div className="text-2xl sm:text-3xl font-black">{products.length}</div>
              <div className="text-sm sm:text-sm opacity-90">Total</div>
            </div>
          </div>
          <h3 className="text-base sm:text-lg font-semibold mb-1 sm:mb-2">🍇 Total de Produtos</h3>
          <p className="text-sm sm:text-sm opacity-80">Produtos cadastrados no sistema</p>
        </div>

        <div className="group bg-gradient-to-br from-green-100 to-green-200 rounded-xl sm:rounded-3xl p-3 sm:p-6 text-green-800 shadow-lg hover:shadow-xl transition-all duration-300 hover:scale-105 border border-green-200/50">
          <div className="flex items-center justify-between mb-2 sm:mb-4">
            <div className="w-8 h-8 sm:w-12 sm:h-12 bg-green-300/50 rounded-lg sm:rounded-2xl flex items-center justify-center backdrop-blur-sm">
              <Package className="w-4 h-4 sm:w-6 sm:h-6 text-green-700" />
            </div>
            <div className="text-right">
              <div className="text-2xl sm:text-3xl font-black">
                R$ {products.reduce((sum, p) => sum + (p.price * p.stock), 0).toFixed(0)}
              </div>
              <div className="text-sm sm:text-sm opacity-90">Valor</div>
            </div>
          </div>
          <h3 className="text-base sm:text-lg font-semibold mb-1 sm:mb-2">💰 Valor Total</h3>
          <p className="text-sm sm:text-sm opacity-80">Valor total em estoque</p>
        </div>

        <div className="group bg-gradient-to-br from-orange-100 to-orange-200 rounded-xl sm:rounded-3xl p-3 sm:p-6 text-orange-800 shadow-lg hover:shadow-xl transition-all duration-300 hover:scale-105 border border-orange-200/50 sm:col-span-2 lg:col-span-1">
          <div className="flex items-center justify-between mb-2 sm:mb-4">
            <div className="w-8 h-8 sm:w-12 sm:h-12 bg-orange-300/50 rounded-lg sm:rounded-2xl flex items-center justify-center backdrop-blur-sm">
              <Package className="w-4 h-4 sm:w-6 sm:h-6 text-orange-700" />
            </div>
            <div className="text-right">
              <div className="text-2xl sm:text-3xl font-black">
                {products.filter(p => p.stock <= p.minStock).length}
              </div>
              <div className="text-sm sm:text-sm opacity-90">Baixo</div>
            </div>
          </div>
          <h3 className="text-base sm:text-lg font-semibold mb-1 sm:mb-2">⚠️ Estoque Baixo</h3>
          <p className="text-sm sm:text-sm opacity-80">Produtos com estoque mínimo</p>
        </div>
      </div>

      {/* Busca e Filtros */}
      <Card className="p-2 sm:p-6">
        <div className="flex gap-2">
          <div className="flex-1">
            <Input
              placeholder="Buscar produtos..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="h-8 sm:h-10 text-sm sm:text-sm"
            />
          </div>
        </div>
      </Card>

      {/* Tabela de Produtos Responsiva */}
      <div>
        <div className="mb-2 sm:mb-4">
          <h2 className="text-base sm:text-lg font-semibold text-neutral-900">📋 Lista de Produtos</h2>
        </div>
        
        {/* Mensagem especial quando não há produtos */}
        {products.length === 0 ? (
          <Card className="bg-gradient-to-br from-purple-50 to-blue-50 border border-purple-200/50 shadow-lg">
            <CardContent className="p-4 sm:p-8 text-center">
              <div className="w-16 h-16 sm:w-20 sm:h-20 bg-gradient-to-br from-purple-500 to-blue-500 rounded-full flex items-center justify-center mx-auto mb-4 sm:mb-6">
                <Package className="w-8 h-8 sm:w-10 sm:h-10 text-white" />
              </div>
              <h3 className="text-xl sm:text-xl font-bold text-gray-900 mb-2 sm:mb-3">🍇 Bem-vindo ao Flexi Gestor!</h3>
              <p className="text-base sm:text-base text-gray-600 mb-4 sm:mb-6 max-w-md mx-auto">
                Parece que você ainda não tem produtos cadastrados. Clique no botão abaixo para adicionar seu primeiro produto.
              </p>
              
              {/* Debug Info - Discreto */}
              <div className="bg-gray-50 border border-gray-200 rounded-lg p-2 sm:p-3 mb-4 sm:mb-6 text-center">
                <p className="text-xs text-gray-600">
                  Sistema funcionando • {products.length} produtos • DataContext ✅
                </p>
              </div>
              
              <div className="flex justify-center">
                <Button 
                  onClick={() => setIsAddDialogOpen(true)}
                  className="bg-gradient-to-r from-purple-600 to-purple-700 hover:from-purple-700 hover:to-purple-800 text-white h-9 text-sm"
                >
                  <Plus className="w-3 h-3 sm:w-4 sm:h-4 mr-1 sm:mr-2" />
                  <span className="text-xs sm:text-sm">Adicionar Primeiro Produto</span>
                </Button>
              </div>
            </CardContent>
          </Card>
        ) : (
          <ResponsiveTable
            data={filteredProducts}
            columns={columns}
            actions={actions}
            keyExtractor={(product) => product.id}
            emptyMessage="Nenhum produto encontrado"
            showMobileCards={true}
            mobileCardTitle={(product) => product.name}
            mobileCardSubtitle={(product) => `${product.sku} • ${product.category}`}
            cardClassName="hover:shadow-xl transition-all duration-300"
          />
        )}
      </div>

            {/* Modal de Edição */}
            <Dialog open={isEditDialogOpen} onOpenChange={setIsEditDialogOpen}>
              <DialogContent className="max-w-[70vw] sm:max-w-2xl max-h-[70vh] overflow-y-auto mx-auto">
                <DialogHeader className="space-y-2 pb-3 sm:pb-4">
                  <DialogTitle className="text-base sm:text-lg">✏️ Editar Produto</DialogTitle>
                  <DialogDescription className="text-xs sm:text-sm">
                    Atualize as informações detalhadas do produto.
                  </DialogDescription>
                </DialogHeader>
                <Form {...form}>
                  <form onSubmit={form.handleSubmit(handleEditProduct)} className="space-y-3 sm:space-y-4">
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 sm:gap-3">
                      <FormField
                        control={form.control}
                        name="name"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel className="text-xs sm:text-sm">Nome do Produto</FormLabel>
                            <FormControl>
                              <Input placeholder="Ex: Produto Exemplo 500ml" {...field} className="h-8 sm:h-10" />
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                      <FormField
                        control={form.control}
                        name="sku"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel className="text-xs sm:text-sm">SKU (Código)</FormLabel>
                            <FormControl>
                              <Input placeholder="Ex: ACAI-500-TRAD" {...field} className="h-8 sm:h-10" />
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                    </div>

                    <FormField
                      control={form.control}
                      name="description"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel className="text-xs sm:text-sm">Descrição do Produto</FormLabel>
                          <FormControl>
                            <Textarea
                              placeholder="Descreva o produto, ingredientes, benefícios, tamanho, etc..."
                              className="min-h-[80px] text-sm sm:text-base"
                              {...field}
                            />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />

                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 sm:gap-3">
                      <FormField
                        control={form.control}
                        name="category"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel className="text-xs sm:text-sm">Categoria</FormLabel>
                            <Select onValueChange={field.onChange} defaultValue={field.value}>
                              <FormControl>
                                <SelectTrigger className="h-8 sm:h-10">
                                  <SelectValue placeholder="Selecione uma categoria" />
                                </SelectTrigger>
                              </FormControl>
                              <SelectContent>
                                <SelectItem value="Açaí Puro">🍇 Açaí Puro (100% Natural)</SelectItem>
                                <SelectItem value="Açaí Tradicional">🥤 Açaí Tradicional</SelectItem>
                                <SelectItem value="Açaí Especial">⭐ Açaí Especial (Gourmet)</SelectItem>
                                <SelectItem value="Complementos">🥜 Complementos (Granola, Frutas)</SelectItem>
                                <SelectItem value="Embalagens">📦 Embalagens e Copos</SelectItem>
                                <SelectItem value="Outros">🔧 Outros Produtos</SelectItem>
                              </SelectContent>
                            </Select>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                      <FormField
                        control={form.control}
                        name="status"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel className="text-xs sm:text-sm">Status do Produto</FormLabel>
                            <Select onValueChange={field.onChange} defaultValue={field.value}>
                              <FormControl>
                                <SelectTrigger className="h-8 sm:h-10">
                                  <SelectValue />
                                </SelectTrigger>
                              </FormControl>
                              <SelectContent>
                                <SelectItem value="ativo">✅ Ativo (Disponível para Venda)</SelectItem>
                                <SelectItem value="inativo">❌ Inativo (Indisponível)</SelectItem>
                              </SelectContent>
                            </Select>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                    </div>

                    <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 sm:gap-4">
                      <FormField
                        control={form.control}
                        name="price"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel className="text-xs sm:text-sm">Preço de Venda (R$)</FormLabel>
                            <FormControl>
                              <Input
                                type="number"
                                step="0.01"
                                placeholder="0.00"
                                className="h-8 sm:h-10"
                                {...field}
                                onChange={(e) => field.onChange(parseFloat(e.target.value) || 0)}
                              />
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                      <FormField
                        control={form.control}
                        name="stock"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel className="text-xs sm:text-sm">Estoque Atual</FormLabel>
                            <FormControl>
                              <Input
                                type="number"
                                placeholder="0"
                                className="h-8 sm:h-10"
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
                        name="minStock"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel className="text-xs sm:text-sm">Estoque Mínimo</FormLabel>
                            <FormControl>
                              <Input
                                type="number"
                                placeholder="0"
                                className="h-8 sm:h-10"
                                {...field}
                                onChange={(e) => field.onChange(parseInt(e.target.value) || 0)}
                              />
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                    </div>

                    <DialogFooter className="flex flex-col sm:flex-row gap-2 pt-2 sm:pt-3">
                      <Button type="button" variant="outline" onClick={() => setIsEditDialogOpen(false)} className="w-full sm:w-auto h-8 text-xs">
                        ❌ Cancelar
                      </Button>
                      <Button type="submit" className="w-full sm:w-auto h-8 text-xs">💾 Salvar Alterações</Button>
                    </DialogFooter>
                  </form>
                </Form>
              </DialogContent>
            </Dialog>

            {/* Modal de Confirmação de Exclusão */}
            <Dialog open={isDeleteDialogOpen} onOpenChange={setIsDeleteDialogOpen}>
              <DialogContent className="max-w-[70vw] sm:max-w-md max-h-[70vh] overflow-y-auto mx-auto">
                <DialogHeader>
                  <DialogTitle className="flex items-center gap-2 text-lg sm:text-xl">
                    <Trash2 className="h-5 w-4 text-destructive" />
                    🗑️ Confirmar Exclusão de Produto
                  </DialogTitle>
                  <DialogDescription className="text-sm sm:text-base">
                    Esta ação não pode ser desfeita. O produto será removido permanentemente.
                  </DialogDescription>
                </DialogHeader>

                <div className="py-4">
                  <div className="bg-muted/50 rounded-lg p-4">
                    <h4 className="font-semibold text-sm mb-2">🍇 Produto a ser excluído:</h4>
                    <div className="space-y-1">
                      <p className="font-medium text-sm sm:text-base">{productToDelete?.name}</p>
                      <p className="text-xs sm:text-sm text-muted-foreground">{productToDelete?.sku}</p>
                      <p className="text-xs sm:text-sm text-muted-foreground">Categoria: {productToDelete?.category}</p>
                    </div>
                  </div>
                </div>

                <DialogFooter className="gap-2 flex flex-col sm:flex-row">
                  <Button
                    type="button"
                    variant="outline"
                    onClick={() => {
                      setIsDeleteDialogOpen(false);
                      setProductToDelete(null);
                    }}
                    className="w-full sm:w-auto"
                  >
                    ❌ Cancelar
                  </Button>
                  <Button
                    type="button"
                    variant="destructive"
                    onClick={confirmDelete}
                    className="w-full sm:w-auto"
                  >
                    <Trash2 className="h-4 w-4 mr-2" />
                    🗑️ Excluir Produto
                  </Button>
                </DialogFooter>
              </DialogContent>
            </Dialog>

            {/* Modal de Gerenciamento de Lotes */}
            <Dialog open={isBatchDialogOpen} onOpenChange={setIsBatchDialogOpen}>
              <DialogContent className="max-w-[70vw] sm:max-w-3xl max-h-[70vh] overflow-y-auto mx-auto">
                <DialogHeader>
                  <DialogTitle className="flex items-center gap-2 text-lg sm:text-xl">
                    <Calendar className="h-5 w-5 text-indigo-600" />
                    Gerenciar Lotes
                  </DialogTitle>
                  <DialogDescription className="text-sm sm:text-base">
                    Controle os lotes deste produto com datas de fabricação e validade
                  </DialogDescription>
                </DialogHeader>

                {selectedProductForBatch && (
                  <BatchManager
                    productId={selectedProductForBatch.id}
                    productName={selectedProductForBatch.name}
                    productStock={selectedProductForBatch.stock}
                    onBatchesChange={() => {
                      // Recarregar dados quando lotes mudarem
                      window.location.reload(); // Recarrega a página para atualizar o estoque
                    }}
                  />
                )}

                <DialogFooter>
                  <Button
                    variant="outline"
                    onClick={() => {
                      setIsBatchDialogOpen(false);
                      setSelectedProductForBatch(null);
                    }}
                  >
                    Fechar
                  </Button>
                </DialogFooter>
              </DialogContent>
            </Dialog>
          </main>
        );
};

export default Produtos;