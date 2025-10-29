import React, { useState, useEffect } from "react";
import { Plus, Search, Edit, Trash2, Package, Calendar } from "lucide-react";
import { BatchManager } from "@/components/BatchManager";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Form, FormControl, FormDescription, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { ResponsiveTable, TableColumn, TableAction, ResponsiveBadge } from "@/components/ui/responsive-table";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import { useToast } from "@/hooks/use-toast";
import { useData } from "@/contexts/DataContext";
import { useResponsive } from "@/hooks/use-responsive";

// Schema de validação - Campos essenciais apenas
const productSchema = z.object({
  sku: z.string()
    .min(1, "❌ Código do produto é obrigatório")
    .max(50, "❌ Código deve ter no máximo 50 caracteres")
    .regex(/^[a-zA-Z0-9_-]+$/, "❌ Código deve conter apenas letras, números, traços e underscores"),
  name: z.string()
    .min(1, "❌ Descrição/Nome do produto é obrigatório")
    .min(3, "❌ Descrição deve ter pelo menos 3 caracteres")
    .max(200, "❌ Descrição deve ter no máximo 200 caracteres"),
  unitOfMeasure: z.string()
    .min(1, "❌ Unidade de medida é obrigatória")
    .max(20, "❌ Unidade de medida deve ter no máximo 20 caracteres"),
  managedByBatch: z.boolean().optional().default(false), // Campo opcional para gerenciamento por lote
});

// Interface do produto - Simplificada
interface Product {
  id: string;
  sku: string; // Código do produto
  name: string; // Descrição/Nome
  unitOfMeasure: string; // Unidade de medida (caixa, quilo, litro, etc)
  managedByBatch?: boolean; // Se o produto é administrado por lote (opcional)
  // Campos legados mantidos para compatibilidade temporária
  description?: string;
  category?: string;
  price?: number;
  stock?: number;
  minStock?: number;
  status?: "ativo" | "inativo";
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
  const [isDeleting, setIsDeleting] = useState(false);
  const [skuDuplicateError, setSkuDuplicateError] = useState<string>("");
  
  // Categorias (declarado antes dos useEffect que o usam)
  const [categories, setCategories] = useState<string[]>([]);
  
  // Estados para controlar criação de nova categoria
  const [isCreatingNewCategory, setIsCreatingNewCategory] = useState(false);
  const [newCategoryName, setNewCategoryName] = useState("");
  const [isAddingCategory, setIsAddingCategory] = useState(false);
  const [newCategory, setNewCategory] = useState("");
  const [isManagingCategories, setIsManagingCategories] = useState(false);
  
  // Carregar categorias do localStorage com categorias padrão
  useEffect(() => {
    const saved = localStorage.getItem('flexi-categories');
    if (saved) {
      setCategories(JSON.parse(saved));
    } else {
      // Adicionar categorias padrão se não houver nenhuma
      const defaultCategories = [
        "Alimentos",
        "Bebidas",
        "Eletrônicos",
        "Roupas",
        "Acessórios",
        "Complementos",
        "Embalagens",
        "Outros"
      ];
      setCategories(defaultCategories);
    }
  }, []);
  
  // Salvar categorias no localStorage
  useEffect(() => {
    localStorage.setItem('flexi-categories', JSON.stringify(categories));
  }, [categories]);

  // Hooks
  const { toast } = useToast();
  const { isMobile } = useResponsive();
  const { products, addProduct: addProductContext, updateProduct, deleteProduct: deleteProductContext, refreshProducts } = useData();

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

  // Formulário - Valores padrão simplificados
  const form = useForm<ProductFormData>({
    resolver: zodResolver(productSchema),
    defaultValues: {
      sku: "",
      name: "",
      unitOfMeasure: "",
      managedByBatch: false,
    },
  });

  // Verificar SKU duplicado em tempo real
  const currentSku = form.watch('sku');
  useEffect(() => {
    // Só verificar quando o diálogo estiver aberto
    if (!isAddDialogOpen && !isEditDialogOpen) {
      setSkuDuplicateError("");
      return;
    }
    
    // Verificar se products existe e tem itens
    if (!products || products.length === 0) {
      setSkuDuplicateError("");
      return;
    }
    
    if (currentSku && currentSku.length > 0) {
      // Verificar se existe produto com esse SKU
      const isDuplicated = products.some(p => p && p.sku && p.sku.toLowerCase() === currentSku.toLowerCase());
      
      // Se estiver editando, ignorar o próprio produto
      const isEditingCurrentSku = editingProduct && editingProduct.sku && editingProduct.sku.toLowerCase() === currentSku.toLowerCase();
      
      if (isDuplicated && !isEditingCurrentSku) {
        setSkuDuplicateError("❌ Este SKU já foi adicionado. Escolha outro código.");
      } else {
        setSkuDuplicateError("");
      }
    } else {
      setSkuDuplicateError("");
    }
  }, [currentSku, products, editingProduct, isAddDialogOpen, isEditDialogOpen]);

  // Mapear produtos do DataContext para incluir campos novos
  const mappedProducts = products.map(product => ({
    ...product,
    unitOfMeasure: (product as any).unitOfMeasure || 'UN',
    managedByBatch: (product as any).managedByBatch || false,
    description: product.description || product.name,
    category: product.category || 'Geral',
    price: product.price || 0,
    stock: product.stock || 0,
    minStock: product.minStock || 0,
    status: product.status || 'ativo' as const,
  }));

  // Filtros
  const filteredProducts = mappedProducts.filter(product =>
    product.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    product.sku.toLowerCase().includes(searchTerm.toLowerCase())
  );

  // Atualizar lista de categorias com categorias existentes nos produtos (sem duplicar)
  useEffect(() => {
    const productCategories = [...new Set(products.map(product => product.category))];
    setCategories(prev => {
      const combined = [...new Set([...prev, ...productCategories])];
      return combined;
    });
  }, [products.length]); // Apenas quando o número de produtos mudar

  // Definição das colunas da tabela responsiva
  // @ts-ignore - Conflito de tipos entre Product local e do DataContext
  const columns: TableColumn<Product>[] = [
    {
      key: 'name',
      label: 'Nome',
      priority: 'high',
      render: (product) => (
        <div>
          <div className="font-medium text-sm sm:text-base">{product.name}</div>
          <div className="text-xs sm:text-sm text-muted-foreground">{product.sku}</div>
          {isMobile && product.unitOfMeasure && (
            <div className="text-xs sm:text-sm text-muted-foreground mt-1">Unidade: {product.unitOfMeasure}</div>
          )}
        </div>
      )
    },
    {
      key: 'unitOfMeasure',
      label: 'Unidade',
      hideOnMobile: true,
      priority: 'medium',
      render: (product) => (
        <span className="text-sm sm:text-base">{product.unitOfMeasure || 'UN'}</span>
      )
    },
    {
      key: 'price',
      label: 'Preço',
      priority: 'high',
      render: (product) => (
        <span className="text-sm sm:text-base">R$ {(product.price || 0).toFixed(2).replace('.', ',')}</span>
      )
    },
    {
      key: 'stock',
      label: 'Estoque',
      priority: 'high',
      render: (product) => {
        const stock = product.stock || 0;
        const minStock = product.minStock || 0;
        return (
        <div className="flex items-center gap-2">
            <span className={`text-sm sm:text-base ${stock <= minStock ? 'text-red-600 font-medium' : ''}`}>
              {stock}
          </span>
            {stock <= minStock && minStock > 0 && (
            <ResponsiveBadge variant="destructive" className="text-xs">
              Baixo
            </ResponsiveBadge>
          )}
        </div>
        );
      }
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

  // Função para deletar categoria
  const handleDeleteCategory = (categoryToDelete: string) => {
    // Verificar se há produtos usando essa categoria
    const productsUsingCategory = products.filter(p => p.category === categoryToDelete);
    
    if (productsUsingCategory.length > 0) {
      toast({
        title: "⚠️ Não é possível excluir!",
        description: `Existem ${productsUsingCategory.length} produto(s) usando essa categoria. Altere a categoria dos produtos primeiro.`,
        variant: "destructive",
        duration: 6000,
      });
      return;
    }
    
    setCategories(categories.filter(cat => cat !== categoryToDelete));
    toast({
      title: "✅ Categoria Excluída!",
      description: `A categoria "${categoryToDelete}" foi removida.`,
      variant: "default",
    });
  };

  // Funções CRUD (definidas antes de serem usadas)
  const openEditDialog = (product: Product) => {
    setEditingProduct(product);
    form.reset({
      sku: product.sku,
      name: product.name,
      unitOfMeasure: product.unitOfMeasure || "UN", // Usar unidade de medida ou padrão
      managedByBatch: product.managedByBatch || false,
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
  // @ts-ignore - Conflito de tipos entre Product local e do DataContext
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

  // Converter dados do formulário simplificado para o formato esperado pelo DataContext
  const convertFormDataToContextFormat = (data: ProductFormData) => {
    return {
      sku: data.sku,
      name: data.name,
      description: data.name, // Usar o nome como descrição
      category: "Geral", // Categoria padrão
      price: 0, // Preço inicial zerado
      stock: 0, // Estoque inicial zerado
      minStock: 0, // Estoque mínimo zerado
      status: "ativo" as const,
      // Campos adicionais para compatibilidade futura
      unitOfMeasure: data.unitOfMeasure,
      managedByBatch: data.managedByBatch || false,
    };
  };

  // Funções CRUD
  const handleAddProduct = async (data: ProductFormData) => {
    try {
      // Converter dados simplificados para formato do contexto
      const convertedData = convertFormDataToContextFormat(data);
      await addProductContext(convertedData);
      setIsAddDialogOpen(false);
      form.reset();

      toast({
        title: "✅ Produto Adicionado!",
        description: `${data.name} foi adicionado com sucesso ao catálogo.`,
        variant: "default",
      });
    } catch (error: any) {
      console.error('❌ Erro completo:', error);
      console.error('❌ Tipo do erro:', typeof error);
      console.error('❌ Error.message:', error?.message);
      console.error('❌ Error.toString():', error?.toString?.());
      
      // Extrair mensagem de erro de forma robusta
      let errorMessage = "Ocorreu um erro ao adicionar o produto.";
      
      // Tenta várias formas de extrair a mensagem
      if (error?.message) {
        errorMessage = String(error.message);
      } else if (typeof error === 'string') {
        errorMessage = error;
      } else if (error?.toString) {
        errorMessage = String(error.toString());
      } else if (error) {
        errorMessage = String(error);
      }
      
      // Mensagem do SKU duplicado
      if (errorMessage.toLowerCase().includes('sku') || errorMessage.toLowerCase().includes('código') || errorMessage.toLowerCase().includes('duplicado')) {
        errorMessage = 'O SKU deste produto já foi adicionado. Escolha outro código.';
      }
      
      console.error('❌ MENSAGEM FINAL QUE SERÁ EXIBIDA:', errorMessage);
      
      toast({
        title: "❌ Erro ao Adicionar Produto",
        description: errorMessage,
        variant: "destructive",
        duration: 7000,
      });
    }
  };

  const handleEditProduct = async (data: ProductFormData) => {
    if (!editingProduct) return;

    try {
      // Converter dados simplificados para formato do contexto
      const convertedData = convertFormDataToContextFormat(data);
      await updateProduct(editingProduct.id, convertedData);
      setIsEditDialogOpen(false);
      setEditingProduct(null);
      form.reset();

      toast({
        title: "✅ Produto Atualizado!",
        description: `${data.name} foi atualizado com sucesso.`,
        variant: "default",
      });
    } catch (error: any) {
      console.error('❌ Erro completo ao atualizar:', error);
      
      // Extrair mensagem de erro de forma robusta
      let errorMessage = "Ocorreu um erro ao atualizar o produto.";
      
      if (error?.message) {
        errorMessage = error.message;
      } else if (typeof error === 'string') {
        errorMessage = error;
      } else if (error?.toString) {
        errorMessage = error.toString();
      }
      
      // Mensagem do SKU duplicado é prioridade
      if (errorMessage.toLowerCase().includes('sku') || errorMessage.toLowerCase().includes('código')) {
        errorMessage = 'O SKU deste produto já foi adicionado. Escolha outro código.';
      }
      
      toast({
        title: "❌ Erro ao Atualizar Produto",
        description: errorMessage,
        variant: "destructive",
        duration: 7000,
      });
    }
  };

  const confirmDelete = async () => {
    if (!productToDelete || isDeleting) return;

    try {
      setIsDeleting(true);
      
      await deleteProductContext(productToDelete.id);

      toast({
        title: "🗑️ Produto Removido!",
        description: `${productToDelete.name} foi removido do catálogo.`,
        variant: "default",
      });

      // Fechar dialog após sucesso
      setIsDeleteDialogOpen(false);
      setProductToDelete(null);
    } catch (error: any) {
      toast({
        title: "❌ Erro ao Remover Produto",
        description: error.message || "Não foi possível remover o produto. Tente novamente.",
        variant: "destructive",
      });
    } finally {
      setIsDeleting(false);
    }
  };


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
      <div className="flex flex-col items-center sm:flex-row sm:items-center sm:justify-between gap-2 sm:gap-4 mt-4 sm:mt-0">
        <div className="text-center sm:text-left">
          <h1 className="text-3xl font-bold bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent flex items-center gap-2 justify-center sm:justify-start">
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
              sku: generateNextSKU(),
              name: "",
              unitOfMeasure: "",
              managedByBatch: false,
            });
            setSkuDuplicateError(""); // Limpar erro de SKU
          } else {
            setSkuDuplicateError(""); // Limpar erro quando fechar
          }
        }}>
          <DialogTrigger asChild>
            <Button className="w-full sm:w-auto bg-gradient-to-r from-indigo-600 to-indigo-700 hover:from-indigo-700 hover:to-indigo-800 text-white px-6 sm:px-8 py-3 sm:py-4 rounded-xl sm:rounded-2xl shadow-xl hover:shadow-2xl transition-all duration-200 transform hover:scale-105">
              <Plus className="w-5 h-5 sm:w-6 sm:h-6 mr-2 sm:mr-3" />
              Novo Produto
            </Button>
          </DialogTrigger>
          <DialogContent className="max-w-sm">
            <DialogHeader className="space-y-2 pb-4 sm:pb-3">
              <DialogTitle className="text-base sm:text-xl font-bold text-neutral-900">
                📦 Adicionar Novo Produto
              </DialogTitle>
              <DialogDescription className="text-sm text-neutral-600">
                Preencha as informações detalhadas do produto para seu catálogo
              </DialogDescription>
            </DialogHeader>
            <Form {...form}>
              <form onSubmit={form.handleSubmit(handleAddProduct)} className="space-y-4 sm:space-y-3">
                <FormField
                  control={form.control}
                  name="sku"
                  render={({ field }) => (
                    <FormItem className="space-y-3">
                      <FormLabel className="text-base sm:text-sm font-semibold text-neutral-700 flex items-center justify-between">
                        <span>🏷️ Código do Produto</span>
                        <span className="text-xs text-gray-500 font-normal">Gerado: {generateNextSKU()}</span>
                      </FormLabel>
                      <FormControl>
                        <Input 
                          placeholder="Código do produto" 
                          {...field} 
                          className={`h-12 sm:h-10 border-2 border-neutral-200 rounded-xl focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 text-base sm:text-sm ${skuDuplicateError ? 'border-red-500' : ''}`}
                        />
                      </FormControl>
                      <FormMessage />
                      {skuDuplicateError && (
                        <p className="text-sm text-red-600 bg-red-50 p-2 rounded-md border border-red-200">
                          {skuDuplicateError}
                        </p>
                      )}
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="name"
                  render={({ field }) => (
                    <FormItem className="space-y-3">
                      <FormLabel className="text-base sm:text-sm font-semibold text-neutral-700">
                        📝 Descrição do Produto
                      </FormLabel>
                      <FormControl>
                        <Input 
                          placeholder="Nome do produto" 
                          {...field}
                          className="h-12 sm:h-10 border-2 border-neutral-200 rounded-xl focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 text-base sm:text-sm" 
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="unitOfMeasure"
                  render={({ field }) => (
                    <FormItem className="space-y-3">
                      <FormLabel className="text-base sm:text-sm font-semibold text-neutral-700">
                        📏 Unidade de Medida
                      </FormLabel>
                      <Select onValueChange={field.onChange} defaultValue={field.value}>
                        <FormControl>
                          <SelectTrigger className="h-11 sm:h-10 border-2 border-neutral-200 rounded-xl focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500">
                            <SelectValue placeholder="Selecione a unidade de medida" />
                          </SelectTrigger>
                        </FormControl>
                        <SelectContent>
                          <SelectItem value="UN">📦 UN (Unidade)</SelectItem>
                          <SelectItem value="CX">📦 CX (Caixa)</SelectItem>
                          <SelectItem value="KG">⚖️ KG (Quilo)</SelectItem>
                          <SelectItem value="G">⚖️ G (Grama)</SelectItem>
                          <SelectItem value="L">💧 L (Litro)</SelectItem>
                          <SelectItem value="ML">💧 ML (Mililitro)</SelectItem>
                          <SelectItem value="M">📏 M (Metro)</SelectItem>
                          <SelectItem value="CM">📏 CM (Centímetro)</SelectItem>
                          <SelectItem value="PAC">📦 PAC (Pacote)</SelectItem>
                          <SelectItem value="SAC">📦 SAC (Saco)</SelectItem>
                        </SelectContent>
                      </Select>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="managedByBatch"
                  render={({ field }) => (
                    <FormItem className="flex items-center justify-between rounded-xl border-2 border-neutral-200 p-4">
                      <FormLabel className="text-base sm:text-sm font-semibold text-neutral-700">
                        📅 Gerenciamento por Lote
                      </FormLabel>
                      <FormControl>
                        <div className="flex items-center space-x-3">
                          <span className="text-xs text-gray-500">Não</span>
                          <label className="relative inline-flex items-center cursor-pointer">
                            <input
                              type="checkbox"
                              checked={field.value || false}
                              onChange={field.onChange}
                              className="sr-only peer"
                            />
                            <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-indigo-300 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-indigo-600"></div>
                          </label>
                          <span className="text-xs text-gray-500">Sim</span>
                        </div>
                      </FormControl>
                    </FormItem>
                  )}
                />

                <DialogFooter className="flex flex-col sm:flex-row gap-2 pt-2 sm:pt-3">
                  <Button type="button" variant="outline" onClick={() => setIsAddDialogOpen(false)} className="w-full sm:w-auto h-11 sm:h-10 text-sm">
                    ❌ Cancelar
                  </Button>
                  <Button type="submit" className="w-full sm:w-auto h-11 sm:h-10 text-sm bg-gradient-to-r from-indigo-600 to-indigo-700 hover:from-indigo-700 hover:to-indigo-800 text-white shadow-lg hover:shadow-xl transition-all duration-200">
                    📦 Adicionar Produto
                  </Button>
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
      <Card className="p-3 sm:p-6">
        <div className="flex gap-2 sm:gap-3">
          <div className="flex-1">
            <Input
              placeholder="🔍 Buscar por código ou nome do produto..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="h-10 sm:h-10 text-base sm:text-sm"
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
            mobileCardSubtitle={(product) => `${product.sku} • ${product.unitOfMeasure || 'UN'}`}
            cardClassName="hover:shadow-xl transition-all duration-300"
          />
        )}
      </div>

            {/* Modal de Edição */}
            <Dialog open={isEditDialogOpen} onOpenChange={(open) => {
              setIsEditDialogOpen(open);
              if (!open) {
                setSkuDuplicateError(""); // Limpar erro ao fechar
              }
            }}>
              <DialogContent className="max-w-sm">
                <DialogHeader className="space-y-2 pb-4 sm:pb-3">
                  <DialogTitle className="text-base sm:text-xl font-bold text-neutral-900">
                    ✏️ Editar Produto
                  </DialogTitle>
                  <DialogDescription className="text-sm text-neutral-600">
                    Atualize as informações detalhadas do produto
                  </DialogDescription>
                </DialogHeader>
                <Form {...form}>
                  <form onSubmit={form.handleSubmit(handleEditProduct)} className="space-y-4 sm:space-y-3">
                    <FormField
                      control={form.control}
                      name="sku"
                      render={({ field }) => (
                        <FormItem className="space-y-3">
                          <FormLabel className="text-base sm:text-sm font-semibold text-neutral-700">
                            🏷️ Código do Produto
                          </FormLabel>
                          <FormControl>
                            <Input 
                              placeholder="Código do produto" 
                              {...field} 
                              className={`h-12 sm:h-10 border-2 border-neutral-200 rounded-xl focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 text-base sm:text-sm ${skuDuplicateError ? 'border-red-500' : ''}`}
                            />
                          </FormControl>
                          <FormMessage />
                          {skuDuplicateError && (
                            <p className="text-sm text-red-600 bg-red-50 p-2 rounded-md border border-red-200">
                              {skuDuplicateError}
                            </p>
                          )}
                        </FormItem>
                      )}
                    />

                    <FormField
                      control={form.control}
                      name="name"
                      render={({ field }) => (
                        <FormItem className="space-y-3">
                          <FormLabel className="text-base sm:text-sm font-semibold text-neutral-700">
                            📝 Descrição do Produto
                          </FormLabel>
                          <FormControl>
                            <Input 
                              placeholder="Nome do produto" 
                              {...field}
                              className="h-12 sm:h-10 border-2 border-neutral-200 rounded-xl focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 text-base sm:text-sm" 
                            />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />

                    <FormField
                      control={form.control}
                      name="unitOfMeasure"
                      render={({ field }) => (
                        <FormItem className="space-y-3">
                          <FormLabel className="text-base sm:text-sm font-semibold text-neutral-700">
                            📏 Unidade de Medida
                          </FormLabel>
                          <Select onValueChange={field.onChange} defaultValue={field.value}>
                            <FormControl>
                              <SelectTrigger className="h-11 sm:h-10 border-2 border-neutral-200 rounded-xl focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500">
                                <SelectValue placeholder="Selecione a unidade de medida" />
                              </SelectTrigger>
                            </FormControl>
                            <SelectContent>
                              <SelectItem value="UN">📦 UN (Unidade)</SelectItem>
                              <SelectItem value="CX">📦 CX (Caixa)</SelectItem>
                              <SelectItem value="KG">⚖️ KG (Quilo)</SelectItem>
                              <SelectItem value="G">⚖️ G (Grama)</SelectItem>
                              <SelectItem value="L">💧 L (Litro)</SelectItem>
                              <SelectItem value="ML">💧 ML (Mililitro)</SelectItem>
                              <SelectItem value="M">📏 M (Metro)</SelectItem>
                              <SelectItem value="CM">📏 CM (Centímetro)</SelectItem>
                              <SelectItem value="PAC">📦 PAC (Pacote)</SelectItem>
                              <SelectItem value="SAC">📦 SAC (Saco)</SelectItem>
                            </SelectContent>
                          </Select>
                          <FormMessage />
                        </FormItem>
                      )}
                    />

                    <FormField
                      control={form.control}
                      name="managedByBatch"
                      render={({ field }) => (
                        <FormItem className="flex items-center justify-between rounded-xl border-2 border-neutral-200 p-4">
                          <FormLabel className="text-base sm:text-sm font-semibold text-neutral-700">
                            📅 Gerenciamento por Lote
                          </FormLabel>
                          <FormControl>
                            <div className="flex items-center space-x-3">
                              <span className="text-xs text-gray-500">Não</span>
                              <label className="relative inline-flex items-center cursor-pointer">
                                <input
                                  type="checkbox"
                                  checked={field.value || false}
                                  onChange={field.onChange}
                                  className="sr-only peer"
                                />
                                <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-indigo-300 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-indigo-600"></div>
                              </label>
                              <span className="text-xs text-gray-500">Sim</span>
                            </div>
                          </FormControl>
                        </FormItem>
                      )}
                    />

                    <DialogFooter className="flex flex-col sm:flex-row gap-2 pt-2 sm:pt-3">
                      <Button type="button" variant="outline" onClick={() => setIsEditDialogOpen(false)} className="w-full sm:w-auto h-11 sm:h-10 text-sm">
                        ❌ Cancelar
                      </Button>
                      <Button type="submit" className="w-full sm:w-auto h-11 sm:h-10 text-sm bg-gradient-to-r from-indigo-600 to-indigo-700 hover:from-indigo-700 hover:to-indigo-800 text-white shadow-lg hover:shadow-xl transition-all duration-200">
                        💾 Salvar Alterações
                      </Button>
                    </DialogFooter>
                  </form>
                </Form>
              </DialogContent>
            </Dialog>

            {/* Modal de Confirmação de Exclusão */}
            <Dialog open={isDeleteDialogOpen} onOpenChange={setIsDeleteDialogOpen}>
              <DialogContent className="max-w-sm">
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
                    disabled={isDeleting}
                    className="w-full sm:w-auto bg-red-600 hover:bg-red-700 text-white focus:ring-red-600"
                  >
                    {isDeleting ? (
                      <>
                        <div className="mr-2 h-4 w-4 animate-spin rounded-full border-2 border-white border-t-transparent"></div>
                        Excluindo...
                      </>
                    ) : (
                      <>
                        <Trash2 className="h-4 w-4 mr-2" />
                        🗑️ Excluir Produto
                      </>
                    )}
                  </Button>
                </DialogFooter>
              </DialogContent>
            </Dialog>

            {/* Modal de Gerenciamento de Lotes */}
            <Dialog open={isBatchDialogOpen} onOpenChange={setIsBatchDialogOpen}>
              <DialogContent className="max-w-sm">
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
                    productSku={selectedProductForBatch.sku}
                    productStock={selectedProductForBatch.stock}
                    onBatchesChange={async () => {
                      // Atualizar estoque silenciosamente quando lotes mudarem
                      await refreshProducts();
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