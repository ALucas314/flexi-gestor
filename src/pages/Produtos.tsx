import React, { useState, useEffect } from "react";
// Usando Lucide React
import { 
  Plus,
  Search,
  Edit,
  Trash2,
  Package,
  Calendar,
  X,
  Tag,
  CheckCircle,
  AlertTriangle,
  Hash,
  FileText,
  Coins
} from "lucide-react";
import { BatchManager } from "@/components/BatchManager";

import { Button } from "@/components/ui/button";
import DangerButton from "@/components/ui/DangerButton";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Form, FormControl, FormDescription, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue, SelectSeparator } from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { ResponsiveTable, TableColumn, TableAction, ResponsiveBadge } from "@/components/ui/responsive-table";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import { toast } from "sonner";
import { useData } from "@/contexts/DataContext";
import { useResponsive } from "@/hooks/use-responsive";

// Schema de validação - Campos essenciais apenas
const productSchema = z.object({
  sku: z.string().optional(), // SKU será gerado automaticamente
  name: z.string()
    .min(1, "Descrição/Nome do produto é obrigatório")
    .min(3, "Descrição deve ter pelo menos 3 caracteres")
    .max(200, "Descrição deve ter no máximo 200 caracteres"),
  unitOfMeasure: z.string()
    .min(1, "Unidade de medida é obrigatória")
    .max(20, "Unidade de medida deve ter no máximo 20 caracteres"),
  category: z.string().optional().default("Geral"),
  managedByBatch: z.boolean().optional().default(false), // Campo opcional para gerenciamento por lote
  minStock: z.number().optional(), // Estoque mínimo
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
  const [isManagingUnits, setIsManagingUnits] = useState(false);
  const [categoryToDelete, setCategoryToDelete] = useState<string | null>(null);
  
  // Estados para unidades de medida personalizadas
  const [customUnits, setCustomUnits] = useState<string[]>([]);
  const [isAddingCustomUnit, setIsAddingCustomUnit] = useState(false);
  const [newCustomUnit, setNewCustomUnit] = useState("");
  const [selectedUnitInput, setSelectedUnitInput] = useState<string>(""); // Para controlar qual input está sendo usado
  const [unitToDelete, setUnitToDelete] = useState<string | null>(null); // Unidade que será deletada
  const [isDeleteUnitDialogOpen, setIsDeleteUnitDialogOpen] = useState(false); // Dialog de confirmação
  
  // Unidades padrão
  const defaultUnits = [
    { value: "UN", label: "UN (Unidade)" },
    { value: "CX", label: "CX (Caixa)" },
    { value: "KG", label: "KG (Quilo)" },
    { value: "G", label: "G (Grama)" },
    { value: "L", label: "L (Litro)" },
    { value: "ML", label: "ML (Mililitro)" },
    { value: "M", label: "M (Metro)" },
    { value: "CM", label: "CM (Centímetro)" },
    { value: "PAC", label: "PAC (Pacote)" },
    { value: "SAC", label: "SAC (Saco)" },
  ];
  
  // Hooks
  // toast importado diretamente do sonner
  const { isMobile } = useResponsive();
  const { 
    products,
    movements,
    addProduct: addProductContext, 
    updateProduct, 
    deleteProduct: deleteProductContext, 
    refreshProducts,
    categories: categoriesFromContext,
    customUnits: customUnitsFromContext,
    addCategory,
    deleteCategory,
    refreshCategories,
    addCustomUnit,
    deleteCustomUnit,
    refreshCustomUnits
  } = useData();

  // Categorias padrão (não podem ser excluídas)
  const defaultCategories = [
    "Geral",
    "Alimentos",
    "Bebidas",
    "Eletrônicos",
    "Roupas",
    "Acessórios",
    "Complementos",
    "Embalagens",
    "Outros"
  ];

  // Usar categorias e unidades do contexto (que vem do banco de dados)
  useEffect(() => {
    if (categoriesFromContext.length > 0) {
      // Combinar categorias do banco com padrões (sem duplicatas)
      const combined = [...new Set([...defaultCategories, ...categoriesFromContext])];
      setCategories(combined);
    } else {
      // Se não há categorias no banco, usar apenas as padrão
      setCategories(defaultCategories);
    }
  }, [categoriesFromContext]);

  // Separar categorias padrão das personalizadas
  const customCategories = categories.filter(cat => !defaultCategories.includes(cat));

  // Usar unidades do contexto
  useEffect(() => {
    setCustomUnits(customUnitsFromContext);
  }, [customUnitsFromContext]);

  // Formulário - Valores padrão simplificados
  const form = useForm<ProductFormData>({
    resolver: zodResolver(productSchema),
    defaultValues: {
      sku: "",
      name: "",
      unitOfMeasure: "",
      category: "Geral",
      managedByBatch: false,
    },
  });
  
  // Todas as unidades disponíveis (padrão + personalizadas)
  const allUnits = [
    ...defaultUnits,
    ...customUnits.map(unit => ({
      value: unit,
      label: `${unit} (Personalizada)`
    }))
  ];
  
  // Função para adicionar unidade personalizada
  const handleAddCustomUnit = async () => {
    if (!newCustomUnit.trim()) {
      toast.error("Campo Vazio", {
        description: "Por favor, digite uma unidade de medida."
      });
      return;
    }
    
    const unitValue = newCustomUnit.trim().toUpperCase();
    
    // Verificar se já existe nas unidades padrão
    const existsInDefault = defaultUnits.some(u => u.value === unitValue);
    if (existsInDefault) {
      toast.error("Unidade Já Existe", {
        description: `A unidade "${unitValue}" já está cadastrada como unidade padrão.`
      });
      return;
    }
    
    try {
      // Salvar no banco de dados
      await addCustomUnit(unitValue);
      
      setNewCustomUnit("");
      setIsAddingCustomUnit(false);
      
      // Selecionar a nova unidade no campo
      if (selectedUnitInput === "add" || selectedUnitInput === "edit") {
        form.setValue("unitOfMeasure", unitValue);
      }
      
      toast.success("Unidade Adicionada!", {
        description: `A unidade "${unitValue}" foi adicionada com sucesso ao banco de dados.`
      });
    } catch (error: any) {
      toast.error("Erro ao Adicionar Unidade", {
        description: error.message || "Não foi possível adicionar a unidade. Tente novamente."
      });
    }
  };
  
  // Função para deletar unidade personalizada
  const handleDeleteCustomUnit = async (unitToDelete: string) => {
    try {
      // Deletar do banco de dados (a verificação de produtos já é feita no contexto)
      await deleteCustomUnit(unitToDelete);
      
      setIsDeleteUnitDialogOpen(false);
      setUnitToDelete(null);
      
      toast.success("Unidade Excluída!", {
        description: `A unidade "${unitToDelete}" foi removida do banco de dados.`
      });
    } catch (error: any) {
      toast.error("Erro ao Excluir Unidade", {
        description: error.message || "Não foi possível excluir a unidade. Tente novamente.",
        duration: 6000
      });
      setIsDeleteUnitDialogOpen(false);
      setUnitToDelete(null);
    }
  };
  
  // Função para solicitar deleção (abre dialog de confirmação)
  const requestDeleteUnit = (unit: string, e: React.MouseEvent) => {
    e.stopPropagation(); // Evitar que o select seja fechado
    setUnitToDelete(unit);
    setIsDeleteUnitDialogOpen(true);
  };

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
        setSkuDuplicateError("Este SKU já foi adicionado. Escolha outro código.");
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
      key: 'sku',
      label: 'Código do Produto',
      priority: 'high',
      render: (product) => (
        <span className="text-sm sm:text-base text-muted-foreground">{product.sku}</span>
      )
    },
    {
      key: 'name',
      label: 'Descrição',
      priority: 'high',
      render: (product) => (
        <div>
          <div className="font-medium text-sm sm:text-base">{product.name || product.description || 'Sem nome'}</div>
        </div>
      )
    },
    {
      key: 'unitOfMeasure',
      label: 'Unidade de Medida',
      priority: 'high',
      render: (product) => (
        <span className="text-sm sm:text-base">{product.unitOfMeasure || 'UN'}</span>
      )
    },
    {
      key: 'stock',
      label: 'Quantidade no Estoque',
      priority: 'high',
      render: (product) => {
        const stock = product.stock || 0;
        const minStock = product.minStock || 0;
        return (
        <div className="flex items-center gap-2">
            <span className={`text-sm sm:text-base font-medium ${stock <= minStock && minStock > 0 ? 'text-red-600' : 'text-gray-900'}`}>
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
      key: 'category',
      label: 'Categoria',
      priority: 'medium',
      render: (product) => (
        <span className="text-sm sm:text-base text-muted-foreground">
          <span className="flex items-center gap-2"><Tag className="h-4 w-4" /> {product.category || 'Geral'}</span>
        </span>
      )
    },
    {
      key: 'managedByBatch',
      label: 'Gerenciado por Lote',
      priority: 'medium',
      className: 'text-right sm:text-left px-4',
      render: (product) => {
        const managedByBatch = (product as any).managedByBatch || false;
        return (
          <div className="flex items-center justify-end sm:justify-start">
            {managedByBatch ? (
              <ResponsiveBadge variant="default" className="text-xs bg-indigo-100 text-indigo-700 whitespace-nowrap">
                <span className="flex items-center gap-2"><Calendar className="h-4 w-4" /> Sim</span>
              </ResponsiveBadge>
            ) : (
              <span className="text-sm sm:text-base text-muted-foreground whitespace-nowrap">Não</span>
            )}
          </div>
        );
      }
    }
  ];

  // Função para adicionar nova categoria
  const handleAddCategory = async () => {
    if (!newCategoryName.trim()) {
      toast.error("Campo Vazio", {
        description: "Por favor, digite um nome para a categoria.",
      });
      return;
    }
    
    const categoryValue = newCategoryName.trim();
    
    try {
      // Salvar no banco de dados
      await addCategory(categoryValue);
      
      setNewCategoryName("");
      setIsCreatingNewCategory(false);
      
      // Selecionar a nova categoria no campo
      form.setValue("category", categoryValue);
      
      toast.success("Categoria Adicionada!", {
        description: `A categoria "${categoryValue}" foi adicionada com sucesso ao banco de dados.`,
      });
    } catch (error: any) {
      toast.error("Erro ao Adicionar Categoria", {
        description: error.message || "Não foi possível adicionar a categoria. Tente novamente.",
      });
    }
  };  // Função para deletar categoria
  const handleDeleteCategory = async (categoryToDelete: string) => {
    // Verificar se é uma categoria padrão (não pode ser excluída)
    if (defaultCategories.includes(categoryToDelete)) {
      toast.error("Categoria Padrão", {
        description: "Categorias padrão não podem ser excluídas.",
        duration: 3000,
      });
      return;
    }

    try {
      // Deletar do banco de dados (a verificação de produtos já é feita no contexto)
      await deleteCategory(categoryToDelete);
      
      // Se a categoria deletada estava selecionada, voltar para "Geral"
      const currentCategory = form.getValues("category");
      if (currentCategory === categoryToDelete) {
        form.setValue("category", "Geral");
      }
      
      toast.success("Categoria Excluída!", {
        description: `A categoria "${categoryToDelete}" foi removida do banco de dados.`,
      });
    } catch (error: any) {
      toast.error("Erro ao Excluir Categoria", {
        description: error.message || "Não foi possível excluir a categoria. Tente novamente.",
        duration: 6000,
      });
    }
  };

  // Funções CRUD (definidas antes de serem usadas)
  const openEditDialog = (product: Product) => {
    setEditingProduct(product);
    // Obter valores do produto mapeado para garantir que managedByBatch seja preservado
    const mappedProduct = mappedProducts.find(p => p.id === product.id) || product;
    form.reset({
      sku: mappedProduct.sku,
      name: mappedProduct.name,
      unitOfMeasure: (mappedProduct as any).unitOfMeasure || "UN", // Usar unidade de medida ou padrão
      category: mappedProduct.category || "Geral",
      managedByBatch: (mappedProduct as any).managedByBatch === true, // Garantir que seja boolean verdadeiro
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
      label: 'Editar',
      icon: <Edit className="h-3 w-3 sm:h-4 sm:w-4" />,
      onClick: openEditDialog,
      variant: 'ghost',
      className: 'inline-flex items-center justify-center gap-2 whitespace-nowrap text-sm font-medium ring-offset-background transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:pointer-events-none disabled:opacity-50 [&_svg]:pointer-events-none [&_svg]:size-4 [&_svg]:shrink-0 hover:bg-accent hover:text-accent-foreground rounded-md h-8 w-8 sm:h-9 sm:w-9 p-0'
    },
    {
      label: 'Excluir',
      icon: <Trash2 className="h-3 w-3 sm:h-4 sm:w-4 text-red-600" />,
      onClick: handleDeleteProduct,
      variant: 'ghost',
      className: 'inline-flex items-center justify-center gap-2 whitespace-nowrap text-sm font-medium ring-offset-background transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:pointer-events-none disabled:opacity-50 [&_svg]:pointer-events-none [&_svg]:size-4 [&_svg]:shrink-0 hover:bg-red-50 hover:text-red-700 rounded-md h-8 w-8 sm:h-9 sm:w-9 p-0 text-red-600'
    }
  ];

  // Converter dados do formulário simplificado para o formato esperado pelo DataContext
  const convertFormDataToContextFormat = (data: ProductFormData) => {
    return {
      sku: data.sku,
      name: data.name,
      description: data.name, // Usar o nome como descrição
      category: data.category || "Geral", // Usar categoria do formulário ou padrão
      price: 0, // Preço inicial zerado
      stock: 0, // Estoque inicial zerado
      minStock: data.minStock || 0, // Estoque mínimo do formulário
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

      toast.success("Produto Adicionado!", {
        description: `${data.name} foi adicionado com sucesso ao catálogo.`,
      });
    } catch (error: any) {
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
      
      toast.error("Erro ao Adicionar Produto", {
        description: errorMessage,
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

      toast.success("Produto Atualizado!", {
        description: `${data.name} foi atualizado com sucesso.`,
      });
    } catch (error: any) {
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
      
      toast.error("Erro ao Atualizar Produto", {
        description: errorMessage,
        duration: 7000,
      });
    }
  };

  const confirmDelete = async () => {
    if (!productToDelete || isDeleting) return;

    try {
      setIsDeleting(true);
      
      await deleteProductContext(productToDelete.id);

      toast.success("Produto Removido!", {
        description: `${productToDelete.name} foi removido do catálogo.`,
      });

      // Fechar dialog após sucesso
      setIsDeleteDialogOpen(false);
      setProductToDelete(null);
    } catch (error: any) {
      toast.error("Erro ao Remover Produto", {
        description: error.message || "Não foi possível remover o produto. Tente novamente.",
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
            <h3 className="text-lg font-semibold text-gray-900 mb-2 flex items-center gap-2"><Package className="h-5 w-5" /> Carregando Produtos...</h3>
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
              category: "Geral",
              managedByBatch: false,
              minStock: undefined,
            });
            setSkuDuplicateError(""); // Limpar erro de SKU
            setIsAddingCustomUnit(false); // Limpar estado de adicionar unidade
            setNewCustomUnit(""); // Limpar input de unidade
            setIsCreatingNewCategory(false); // Limpar estado de criar categoria
            setNewCategoryName(""); // Limpar input de categoria
          } else {
            setSkuDuplicateError(""); // Limpar erro quando fechar
            setIsAddingCustomUnit(false); // Limpar estado de adicionar unidade
            setNewCustomUnit(""); // Limpar input de unidade
            setIsCreatingNewCategory(false); // Limpar estado de criar categoria
            setNewCategoryName(""); // Limpar input de categoria
          }
        }}>
          <DialogTrigger asChild>
            <Button className="w-full sm:w-auto bg-gradient-to-r from-indigo-600 to-indigo-700 hover:from-indigo-700 hover:to-indigo-800 text-white px-6 sm:px-8 py-3 sm:py-4 rounded-xl sm:rounded-2xl shadow-xl hover:shadow-2xl transition-all duration-200 transform hover:scale-105">
              <Plus className="w-5 h-5 sm:w-6 sm:h-6 mr-2 sm:mr-3" />
              Novo Produto
            </Button>
          </DialogTrigger>
          <DialogContent className="max-w-md sm:max-w-lg flex flex-col max-h-[90vh] overflow-hidden">
            <DialogHeader className="space-y-2 pb-4 sm:pb-3 flex-shrink-0">
              <DialogTitle className="text-base sm:text-xl font-bold text-neutral-900">
                <span className="flex items-center gap-2"><Package className="h-4 w-4" /> Adicionar Novo Produto</span>
              </DialogTitle>
              <DialogDescription className="text-sm text-neutral-600">
                Preencha as informações detalhadas do produto para seu catálogo
              </DialogDescription>
            </DialogHeader>
            <Form {...form}>
              <form onSubmit={form.handleSubmit(handleAddProduct)} className="flex flex-col flex-1 min-h-0">
                <div className="flex-1 overflow-y-auto space-y-4 sm:space-y-3 pr-1 -mr-1">

                <FormField
                  control={form.control}
                  name="name"
                  render={({ field }) => (
                    <FormItem className="space-y-3">
                      <FormLabel className="text-base sm:text-sm font-semibold text-neutral-700">
                        <span className="flex items-center gap-2"><FileText className="h-4 w-4" /> Descrição do Produto</span>
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
                      <FormLabel className="text-base sm:text-sm font-semibold text-neutral-700 flex items-center justify-between">
                        <span className="flex items-center gap-2"><Hash className="h-4 w-4" /> Unidade de Medida</span>
                        <Button
                          type="button"
                          variant="ghost"
                          size="sm"
                          onClick={(e) => {
                            e.preventDefault();
                            setIsManagingUnits(true);
                          }}
                          className="h-7 text-xs text-indigo-600 hover:text-indigo-700 hover:bg-indigo-50"
                        >
                          Gerenciar
                        </Button>
                      </FormLabel>
                      <Select 
                        onValueChange={(value) => {
                          field.onChange(value);
                        }} 
                        value={field.value || ""}
                      >
                        <FormControl>
                          <SelectTrigger className="h-11 sm:h-10 border-2 border-neutral-200 rounded-xl focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500">
                            <SelectValue placeholder="Selecione a unidade de medida" />
                          </SelectTrigger>
                        </FormControl>
                        <SelectContent>
                          {/* Unidades Padrão */}
                          {defaultUnits.map((unit) => (
                            <SelectItem 
                              key={unit.value} 
                              value={unit.value}
                            >
                              {unit.label}
                            </SelectItem>
                          ))}
                          
                          {/* Unidades Personalizadas */}
                          {customUnits.length > 0 && (
                            <>
                              <SelectSeparator />
                              {customUnits.map((unit) => (
                                <SelectItem 
                                  key={unit} 
                                  value={unit}
                                >
                                  <span className="flex items-center gap-2"><Hash className="h-4 w-4" /> {unit} (Personalizada)</span>
                                </SelectItem>
                              ))}
                            </>
                          )}
                        </SelectContent>
                      </Select>
                      
                      {isAddingCustomUnit && selectedUnitInput === "add" && (
                        <div className="mt-2 p-3 bg-indigo-50 border border-indigo-200 rounded-lg space-y-2">
                          <div className="flex items-center gap-2">
                            <Input
                              placeholder="Ex: FD (Fardo), PL (Pote)..."
                              value={newCustomUnit}
                              onChange={(e) => setNewCustomUnit(e.target.value)}
                              onKeyDown={(e) => {
                                if (e.key === 'Enter') {
                                  e.preventDefault();
                                  handleAddCustomUnit();
                                } else if (e.key === 'Escape') {
                                  setIsAddingCustomUnit(false);
                                  setNewCustomUnit("");
                                }
                              }}
                              className="flex-1 h-9 text-sm"
                              autoFocus
                            />
                            <Button
                              type="button"
                              size="sm"
                              onClick={handleAddCustomUnit}
                              className="h-9 bg-indigo-600 hover:bg-indigo-700 text-white"
                            >
                              <Plus className="h-4 w-4" />
                            </Button>
                            <Button
                              type="button"
                              size="sm"
                              variant="ghost"
                              onClick={() => {
                                setIsAddingCustomUnit(false);
                                setNewCustomUnit("");
                              }}
                              className="h-9"
                            >
                              <X className="h-4 w-4" />
                            </Button>
                          </div>
                          <p className="text-xs text-indigo-600">Pressione Enter para adicionar</p>
                        </div>
                      )}
                      
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="category"
                  render={({ field }) => (
                    <FormItem className="space-y-3">
                      <FormLabel className="text-base sm:text-sm font-semibold text-neutral-700 flex items-center justify-between">
                        <span className="flex items-center gap-2"><Tag className="h-4 w-4" /> Categoria</span>
                        <Button
                          type="button"
                          variant="ghost"
                          size="sm"
                          onClick={(e) => {
                            e.preventDefault();
                            setIsManagingCategories(true);
                          }}
                          className="h-7 text-xs text-indigo-600 hover:text-indigo-700 hover:bg-indigo-50"
                        >
                          Gerenciar
                        </Button>
                      </FormLabel>
                      <Select 
                        onValueChange={(value) => {
                          field.onChange(value);
                        }} 
                        value={field.value || "Geral"}
                      >
                        <FormControl>
                          <SelectTrigger className="h-11 sm:h-10 border-2 border-neutral-200 rounded-xl focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500">
                            <SelectValue placeholder="Selecione a categoria" />
                          </SelectTrigger>
                        </FormControl>
                        <SelectContent>
                          {/* Categorias existentes */}
                          {categories.map((category) => (
                            <SelectItem 
                              key={category} 
                              value={category}
                            >
                              <span className="flex items-center gap-2"><Tag className="h-4 w-4" /> {category}</span>
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                      
                      {isCreatingNewCategory && (
                        <div className="mt-2 p-3 bg-indigo-50 border border-indigo-200 rounded-lg space-y-2">
                          <div className="flex items-center gap-2">
                            <Input
                              placeholder="Ex: Eletrônicos, Roupas..."
                              value={newCategoryName}
                              onChange={(e) => setNewCategoryName(e.target.value)}
                              onKeyDown={(e) => {
                                if (e.key === 'Enter') {
                                  e.preventDefault();
                                  handleAddCategory();
                                } else if (e.key === 'Escape') {
                                  setIsCreatingNewCategory(false);
                                  setNewCategoryName("");
                                }
                              }}
                              className="flex-1 h-9 text-sm"
                              autoFocus
                            />
                            <Button
                              type="button"
                              size="sm"
                              onClick={handleAddCategory}
                              className="h-9 bg-indigo-600 hover:bg-indigo-700 text-white"
                            >
                              <Plus className="h-4 w-4" />
                            </Button>
                            <Button
                              type="button"
                              size="sm"
                              variant="ghost"
                              onClick={() => {
                                setIsCreatingNewCategory(false);
                                setNewCategoryName("");
                              }}
                              className="h-9"
                            >
                              <X className="h-4 w-4" />
                            </Button>
                          </div>
                          <p className="text-xs text-indigo-600">Pressione Enter para adicionar</p>
                        </div>
                      )}
                      
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
                        <span className="flex items-center gap-2"><Calendar className="h-4 w-4" /> Gerenciamento por Lote</span>
                      </FormLabel>
                      <FormControl>
                        <div className="flex items-center space-x-3">
                          <span className="text-xs text-gray-500">Não</span>
                          <label className="relative inline-flex items-center cursor-pointer">
                            <input
                              type="checkbox"
                              checked={field.value === true}
                              onChange={(e) => field.onChange(e.target.checked)}
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

                <FormField
                  control={form.control}
                  name="minStock"
                  render={({ field }) => (
                    <FormItem className="space-y-3">
                      <FormLabel className="text-base sm:text-sm font-semibold text-neutral-700">
                        <span className="flex items-center gap-2"><AlertTriangle className="h-4 w-4" /> Estoque Mínimo</span>
                      </FormLabel>
                      <FormControl>
                        <Input
                          type="number"
                          min="0"
                          placeholder=""
                          {...field}
                          value={field.value === undefined || field.value === null || field.value === 0 ? '' : field.value}
                          onChange={(e) => {
                            const value = e.target.value;
                            if (value === '' || value === null) {
                              field.onChange(undefined);
                              return;
                            }
                            const intValue = parseInt(value, 10);
                            if (!isNaN(intValue) && intValue >= 0) {
                              field.onChange(intValue);
                            }
                          }}
                          className="h-12 sm:h-10 border-2 border-neutral-200 rounded-xl focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 text-base sm:text-sm"
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                  </div>
                <DialogFooter className="flex flex-col sm:flex-row gap-2 pt-4 mt-4 flex-shrink-0 border-t border-neutral-200">
                  <Button type="button" variant="outline" onClick={() => setIsAddDialogOpen(false)} className="w-full sm:w-auto h-11 sm:h-10 text-sm">
                    <span className="flex items-center gap-2"><X className="h-4 w-4" /> Cancelar</span>
                  </Button>
                  <Button type="submit" className="w-full sm:w-auto h-11 sm:h-10 text-sm bg-gradient-to-r from-indigo-600 to-indigo-700 hover:from-indigo-700 hover:to-indigo-800 text-white shadow-lg hover:shadow-xl transition-all duration-200">
                    <span className="flex items-center gap-2"><Package className="h-4 w-4" /> Adicionar Produto</span>
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
          <h3 className="text-base sm:text-lg font-semibold mb-1 sm:mb-2 flex items-center gap-2"><Package className="h-4 w-4" /> Total de Produtos</h3>
          <p className="text-sm sm:text-sm opacity-80">Produtos cadastrados no sistema</p>
        </div>

        <div className="group bg-gradient-to-br from-green-100 to-green-200 rounded-xl sm:rounded-3xl p-3 sm:p-6 text-green-800 shadow-lg hover:shadow-xl transition-all duration-300 hover:scale-105 border border-green-200/50">
          <div className="flex items-center justify-between mb-2 sm:mb-4">
            <div className="w-8 h-8 sm:w-12 sm:h-12 bg-green-300/50 rounded-lg sm:rounded-2xl flex items-center justify-center backdrop-blur-sm">
              <Package className="w-4 h-4 sm:w-6 sm:h-6 text-green-700" />
            </div>
            <div className="text-right">
              <div className="text-2xl sm:text-3xl font-black">
                {(() => {
                  const totalValue = mappedProducts.reduce((sum, product) => {
                    // Buscar todas as entradas deste produto
                    const productEntries = movements
                      .filter(m => m.productId === product.id && m.type === 'entrada')
                      .sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime());
                    
                    let unitValue = 0;
                    
                    // Se há entradas, calcular custo médio ponderado
                    if (productEntries.length > 0) {
                      let totalCost = 0;
                      let totalQuantity = 0;
                      
                      productEntries.forEach(entry => {
                        totalCost += (entry.unitPrice * entry.quantity);
                        totalQuantity += entry.quantity;
                      });
                      
                      const averageCost = totalQuantity > 0 ? totalCost / totalQuantity : 0;
                      // Usar custo médio se disponível, senão usar preço de venda
                      unitValue = averageCost > 0 ? averageCost : (product.price || 0);
                    } else {
                      // Se não há entradas, usar preço de venda (ou 0 se não definido)
                      unitValue = product.price || 0;
                    }
                    
                    const stock = typeof product.stock === 'number' ? product.stock : parseFloat(String(product.stock || 0));
                    return sum + (unitValue * stock);
                  }, 0);
                  return `R$ ${totalValue.toLocaleString('pt-BR', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
                })()}
              </div>
              <div className="text-sm sm:text-sm opacity-90">Valor</div>
            </div>
          </div>
          <h3 className="text-base sm:text-lg font-semibold mb-1 sm:mb-2 flex items-center gap-2"><Coins className="h-4 w-4" /> Valor Total</h3>
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
          <h3 className="text-base sm:text-lg font-semibold mb-1 sm:mb-2 flex items-center gap-2"><AlertTriangle className="h-4 w-4" /> Estoque Baixo</h3>
          <p className="text-sm sm:text-sm opacity-80">Produtos com estoque mínimo</p>
        </div>
      </div>

      {/* Busca e Filtros */}
      <Card className="p-3 sm:p-6">
        <div className="flex gap-2 sm:gap-3">
          <div className="relative flex-1">
            <Search className="absolute left-3 sm:left-4 top-1/2 transform -translate-y-1/2 text-neutral-400 w-4 h-4 sm:w-5 sm:h-5" />
            <Input
              placeholder="Buscar por código ou nome do produto..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="pl-10 sm:pl-12 h-10 sm:h-10 text-base sm:text-sm"
            />
          </div>
        </div>
      </Card>

      {/* Tabela de Produtos Responsiva */}
      <Card className="shadow-lg">
        <CardHeader className="bg-gradient-to-r from-indigo-50 to-purple-50">
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2">
            <div>
              <CardTitle className="flex items-center gap-2">
                <FileText className="w-5 h-5 text-blue-600" />
                Lista de Produtos
              </CardTitle>
              <CardDescription>Gerencie seus produtos cadastrados</CardDescription>
            </div>
          </div>
        </CardHeader>
        <CardContent className="p-0">
          {/* Mensagem especial quando não há produtos */}
          {products.length === 0 ? (
            <div className="p-4 sm:p-8 text-center">
              <div className="w-16 h-16 sm:w-20 sm:h-20 bg-gradient-to-br from-purple-500 to-blue-500 rounded-full flex items-center justify-center mx-auto mb-4 sm:mb-6">
                <Package className="w-8 h-8 sm:w-10 sm:h-10 text-white" />
              </div>
              <h3 className="text-xl sm:text-xl font-bold text-gray-900 mb-2 sm:mb-3 flex items-center gap-2 justify-center"><Package className="h-5 w-5" /> Bem-vindo ao Flexi Gestor!</h3>
              <p className="text-base sm:text-base text-gray-600 mb-4 sm:mb-6 max-w-md mx-auto">
                Parece que você ainda não tem produtos cadastrados. Clique no botão abaixo para adicionar seu primeiro produto.
              </p>
              
              {/* Debug Info - Discreto */}
              <div className="bg-gray-50 border border-gray-200 rounded-lg p-2 sm:p-3 mb-4 sm:mb-6 text-center">
                <p className="text-xs text-gray-600">
                  Sistema funcionando • {products.length} produtos • DataContext <CheckCircle className="h-3 w-3 text-green-600 inline" />
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
            </div>
          ) : (
            <div className="overflow-x-auto">
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
            </div>
          )}
        </CardContent>
      </Card>

            {/* Modal de Edição */}
            <Dialog open={isEditDialogOpen} onOpenChange={(open) => {
              setIsEditDialogOpen(open);
              if (!open) {
                setSkuDuplicateError(""); // Limpar erro ao fechar
                setIsAddingCustomUnit(false); // Limpar estado de adicionar unidade
                setNewCustomUnit(""); // Limpar input de unidade
                setIsCreatingNewCategory(false); // Limpar estado de criar categoria
                setNewCategoryName(""); // Limpar input de categoria
              }
            }}>
              <DialogContent className="max-w-md sm:max-w-lg flex flex-col max-h-[90vh] overflow-hidden">
                <DialogHeader className="space-y-2 pb-4 sm:pb-3 flex-shrink-0">
                  <DialogTitle className="text-base sm:text-xl font-bold text-neutral-900">
                    ✏️ Editar Produto
                  </DialogTitle>
                  <DialogDescription className="text-sm text-neutral-600">
                    Atualize as informações detalhadas do produto
                  </DialogDescription>
                </DialogHeader>
                <Form {...form}>
                  <form onSubmit={form.handleSubmit(handleEditProduct)} className="flex flex-col flex-1 min-h-0">
                    <div className="flex-1 overflow-y-auto space-y-4 sm:space-y-3 pr-1 -mr-1">
                    <FormField
                      control={form.control}
                      name="sku"
                      render={({ field }) => (
                        <FormItem className="space-y-3">
                          <FormLabel className="text-base sm:text-sm font-semibold text-neutral-700">
                            <span className="flex items-center gap-2"><Tag className="h-4 w-4" /> Código do Produto</span>
                          </FormLabel>
                          <FormControl>
                            <Input 
                              placeholder="Código do produto" 
                              {...field} 
                              readOnly
                              className="h-12 sm:h-10 border-2 border-neutral-200 rounded-xl focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 text-base sm:text-sm bg-gray-50 cursor-not-allowed"
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
                            <span className="flex items-center gap-2"><FileText className="h-4 w-4" /> Descrição do Produto</span>
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
                          <FormLabel className="text-base sm:text-sm font-semibold text-neutral-700 flex items-center justify-between">
                            <span className="flex items-center gap-2"><Hash className="h-4 w-4" /> Unidade de Medida</span>
                            <Button
                              type="button"
                              variant="ghost"
                              size="sm"
                              onClick={(e) => {
                                e.preventDefault();
                                setIsManagingUnits(true);
                              }}
                              className="h-7 text-xs text-indigo-600 hover:text-indigo-700 hover:bg-indigo-50"
                            >
                              Gerenciar
                            </Button>
                          </FormLabel>
                          <Select 
                            onValueChange={(value) => {
                              field.onChange(value);
                            }} 
                            value={field.value || ""}
                          >
                            <FormControl>
                              <SelectTrigger className="h-11 sm:h-10 border-2 border-neutral-200 rounded-xl focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500">
                                <SelectValue placeholder="Selecione a unidade de medida" />
                              </SelectTrigger>
                            </FormControl>
                            <SelectContent>
                              {/* Unidades Padrão */}
                              {defaultUnits.map((unit) => (
                                <SelectItem 
                                  key={unit.value} 
                                  value={unit.value}
                                >
                                  {unit.label}
                                </SelectItem>
                              ))}
                              
                              {/* Unidades Personalizadas */}
                              {customUnits.length > 0 && (
                                <>
                                  <SelectSeparator />
                                  {customUnits.map((unit) => (
                                    <SelectItem 
                                      key={unit} 
                                      value={unit}
                                    >
                                      📏 {unit} (Personalizada)
                                    </SelectItem>
                                  ))}
                                </>
                              )}
                              
                            </SelectContent>
                          </Select>
                          
                          {isAddingCustomUnit && selectedUnitInput === "edit" && (
                            <div className="mt-2 p-3 bg-indigo-50 border border-indigo-200 rounded-lg space-y-2">
                              <div className="flex items-center gap-2">
                                <Input
                                  placeholder="Ex: FD (Fardo), PL (Pote)..."
                                  value={newCustomUnit}
                                  onChange={(e) => setNewCustomUnit(e.target.value)}
                                  onKeyDown={(e) => {
                                    if (e.key === 'Enter') {
                                      e.preventDefault();
                                      handleAddCustomUnit();
                                    } else if (e.key === 'Escape') {
                                      setIsAddingCustomUnit(false);
                                      setNewCustomUnit("");
                                    }
                                  }}
                                  className="flex-1 h-9 text-sm"
                                  autoFocus
                                />
                                <Button
                                  type="button"
                                  size="sm"
                                  onClick={handleAddCustomUnit}
                                  className="h-9 bg-indigo-600 hover:bg-indigo-700 text-white"
                                >
                                  <Plus className="h-4 w-4" />
                                </Button>
                                <Button
                                  type="button"
                                  size="sm"
                                  variant="ghost"
                                  onClick={() => {
                                    setIsAddingCustomUnit(false);
                                    setNewCustomUnit("");
                                  }}
                                  className="h-9"
                                >
                                  <X className="h-4 w-4" />
                                </Button>
                              </div>
                              <p className="text-xs text-indigo-600">Pressione Enter para adicionar</p>
                            </div>
                          )}
                          
                          <FormMessage />
                        </FormItem>
                      )}
                    />

                    <FormField
                      control={form.control}
                      name="category"
                      render={({ field }) => (
                        <FormItem className="space-y-3">
                          <FormLabel className="text-base sm:text-sm font-semibold text-neutral-700 flex items-center justify-between">
                            <span className="flex items-center gap-2"><Tag className="h-4 w-4" /> Categoria</span>
                            <Button
                              type="button"
                              variant="ghost"
                              size="sm"
                              onClick={(e) => {
                                e.preventDefault();
                                setIsManagingCategories(true);
                              }}
                              className="h-7 text-xs text-indigo-600 hover:text-indigo-700 hover:bg-indigo-50"
                            >
                              Gerenciar
                            </Button>
                          </FormLabel>
                          <Select 
                            onValueChange={(value) => {
                              field.onChange(value);
                            }} 
                            value={field.value || "Geral"}
                          >
                            <FormControl>
                              <SelectTrigger className="h-11 sm:h-10 border-2 border-neutral-200 rounded-xl focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500">
                                <SelectValue placeholder="Selecione a categoria" />
                              </SelectTrigger>
                            </FormControl>
                            <SelectContent>
                              {/* Categorias existentes */}
                              {categories.map((category) => (
                                <SelectItem 
                                  key={category} 
                                  value={category}
                                >
                                  <span className="flex items-center gap-2"><Tag className="h-4 w-4" /> {category}</span>
                                </SelectItem>
                              ))}
                            </SelectContent>
                          </Select>
                          
                          {isCreatingNewCategory && (
                            <div className="mt-2 p-3 bg-indigo-50 border border-indigo-200 rounded-lg space-y-2">
                              <div className="flex items-center gap-2">
                                <Input
                                  placeholder="Ex: Eletrônicos, Roupas..."
                                  value={newCategoryName}
                                  onChange={(e) => setNewCategoryName(e.target.value)}
                                  onKeyDown={(e) => {
                                    if (e.key === 'Enter') {
                                      e.preventDefault();
                                      handleAddCategory();
                                    } else if (e.key === 'Escape') {
                                      setIsCreatingNewCategory(false);
                                      setNewCategoryName("");
                                    }
                                  }}
                                  className="flex-1 h-9 text-sm"
                                  autoFocus
                                />
                                <Button
                                  type="button"
                                  size="sm"
                                  onClick={handleAddCategory}
                                  className="h-9 bg-indigo-600 hover:bg-indigo-700 text-white"
                                >
                                  <Plus className="h-4 w-4" />
                                </Button>
                                <Button
                                  type="button"
                                  size="sm"
                                  variant="ghost"
                                  onClick={() => {
                                    setIsCreatingNewCategory(false);
                                    setNewCategoryName("");
                                  }}
                                  className="h-9"
                                >
                                  <X className="h-4 w-4" />
                                </Button>
                              </div>
                              <p className="text-xs text-indigo-600">Pressione Enter para adicionar</p>
                            </div>
                          )}
                          
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
                            <span className="flex items-center gap-2"><Calendar className="h-4 w-4" /> Gerenciamento por Lote</span>
                          </FormLabel>
                          <FormControl>
                            <div className="flex items-center space-x-3">
                              <span className="text-xs text-gray-500">Não</span>
                              <label className="relative inline-flex items-center cursor-pointer">
                                <input
                                  type="checkbox"
                                  checked={field.value === true}
                                  onChange={(e) => field.onChange(e.target.checked)}
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

                      </div>
                    <DialogFooter className="flex flex-col sm:flex-row gap-2 pt-4 mt-4 flex-shrink-0 border-t border-neutral-200">
                      <Button type="button" variant="outline" onClick={() => setIsEditDialogOpen(false)} className="w-full sm:w-auto h-11 sm:h-10 text-sm">
                        <span className="flex items-center gap-2"><X className="h-4 w-4" /> Cancelar</span>
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
              <DialogContent className="max-w-md sm:max-w-lg">
                <DialogHeader>
                  <DialogTitle className="flex items-center gap-2 text-lg sm:text-xl">
                    <span className="flex items-center gap-2"><Trash2 className="h-4 w-4 text-destructive" /> Confirmar Exclusão de Produto</span>
                  </DialogTitle>
                  <DialogDescription className="text-sm sm:text-base">
                    Esta ação não pode ser desfeita. O produto será removido permanentemente.
                  </DialogDescription>
                </DialogHeader>

                <div className="py-4">
                  <div className="bg-muted/50 rounded-lg p-4">
                    <h4 className="font-semibold text-sm mb-2 flex items-center gap-2"><Package className="h-4 w-4" /> Produto a ser excluído:</h4>
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
                    <span className="flex items-center gap-2"><X className="h-4 w-4" /> Cancelar</span>
                  </Button>
                  <DangerButton
                    type="button"
                    onClick={confirmDelete}
                    disabled={isDeleting}
                    className="w-full sm:w-auto"
                  >
                    {isDeleting ? (
                      <>
                        <div className="mr-2 h-4 w-4 animate-spin rounded-full border-2 border-white border-t-transparent"></div>
                        Excluindo...
                      </>
                    ) : (
                      <>
                        <span className="flex items-center gap-2"><Trash2 className="h-4 w-4" /> Excluir Produto</span>
                      </>
                    )}
                  </DangerButton>
                </DialogFooter>
              </DialogContent>
            </Dialog>

            {/* Modal de Gerenciamento de Lotes */}
            <Dialog open={isBatchDialogOpen} onOpenChange={setIsBatchDialogOpen}>
              <DialogContent className="max-w-md sm:max-w-lg md:max-w-xl max-h-[90vh] overflow-y-auto pt-8">
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
              </DialogContent>
            </Dialog>

      {/* Modal de Confirmação de Exclusão de Unidade */}
      <Dialog open={isDeleteUnitDialogOpen} onOpenChange={setIsDeleteUnitDialogOpen}>
        <DialogContent className="max-w-md sm:max-w-lg">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2 text-lg sm:text-xl">
              <Trash2 className="h-5 w-5 text-red-600" />
              Confirmar Exclusão de Unidade
            </DialogTitle>
            <DialogDescription className="text-sm sm:text-base">
              Tem certeza que deseja excluir a unidade de medida "{unitToDelete}"? Esta ação não pode ser desfeita.
            </DialogDescription>
          </DialogHeader>

          <div className="py-4">
            <div className="bg-red-50 border border-red-200 rounded-lg p-4">
              <h4 className="font-semibold text-sm mb-2 text-red-900 flex items-center gap-2"><AlertTriangle className="h-4 w-4" /> Atenção:</h4>
              <p className="text-xs sm:text-sm text-red-700">
                Se houver produtos usando esta unidade, a exclusão será bloqueada para evitar problemas nos dados.
              </p>
            </div>
          </div>

          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => {
                setIsDeleteUnitDialogOpen(false);
                setUnitToDelete(null);
              }}
            >
              Cancelar
            </Button>
            <Button
              variant="destructive"
              onClick={() => {
                if (unitToDelete) {
                  handleDeleteCustomUnit(unitToDelete);
                }
              }}
            >
              <Trash2 className="h-4 w-4 mr-2" />
              Excluir Unidade
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Modal de Gerenciamento de Categorias */}
      <Dialog open={isManagingCategories} onOpenChange={setIsManagingCategories}>
        <DialogContent className="max-w-md sm:max-w-lg">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2 text-lg sm:text-xl">
              <span className="flex items-center gap-2"><Tag className="h-4 w-4" /> Gerenciar Categorias</span>
            </DialogTitle>
            <DialogDescription className="text-sm sm:text-base">
              Crie, edite e exclua categorias de produtos
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4 py-4">
            {/* Adicionar Nova Categoria */}
            <div className="space-y-2">
              <h4 className="text-sm font-semibold">Adicionar Nova Categoria</h4>
              <div className="flex items-center gap-2">
                <Input
                  placeholder="Nome da categoria..."
                  value={newCategoryName}
                  onChange={(e) => setNewCategoryName(e.target.value)}
                  onKeyDown={(e) => {
                    if (e.key === 'Enter') {
                      e.preventDefault();
                      handleAddCategory();
                    }
                  }}
                  className="flex-1"
                />
                <Button
                  type="button"
                  onClick={handleAddCategory}
                  className="bg-indigo-600 hover:bg-indigo-700 text-white"
                >
                  <Plus className="h-4 w-4 mr-2" />
                  Adicionar
                </Button>
              </div>
            </div>

            {/* Lista de Categorias */}
            <div className="space-y-4">
              {/* Categorias Padrão */}
              <div className="space-y-2">
                <h4 className="text-sm font-semibold text-gray-600">Categorias Padrão (não podem ser excluídas)</h4>
                <div className="max-h-32 overflow-y-auto border rounded-lg divide-y bg-gray-50">
                  {defaultCategories.map((category) => (
                    <div
                      key={category}
                      className="flex items-center justify-between p-3"
                    >
                      <span className="text-sm text-gray-700 flex items-center gap-2"><Tag className="h-3 w-3" /> {category}</span>
                    </div>
                  ))}
                </div>
              </div>

              {/* Categorias Personalizadas */}
              {customCategories.length > 0 && (
                <div className="space-y-2">
                  <h4 className="text-sm font-semibold">Categorias Personalizadas</h4>
                  <div className="max-h-32 overflow-y-auto border rounded-lg divide-y">
                    {customCategories.map((category) => (
                      <div
                        key={category}
                        className="flex items-center justify-between p-3 hover:bg-gray-50"
                      >
                        <span className="text-sm font-medium flex items-center gap-2"><Tag className="h-3 w-3" /> {category}</span>
                        <Button
                          type="button"
                          variant="ghost"
                          size="sm"
                          onClick={() => {
                            setCategoryToDelete(category);
                            handleDeleteCategory(category);
                          }}
                          className="text-red-600 hover:text-red-700 hover:bg-red-50"
                        >
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
          </div>

          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => {
                setIsManagingCategories(false);
                setNewCategoryName("");
              }}
            >
              Fechar
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Modal de Gerenciamento de Unidades */}
      <Dialog open={isManagingUnits} onOpenChange={setIsManagingUnits}>
        <DialogContent className="max-w-md sm:max-w-lg">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2 text-lg sm:text-xl">
              <span className="flex items-center gap-2"><Hash className="h-4 w-4" /> Gerenciar Unidades de Medida</span>
            </DialogTitle>
            <DialogDescription className="text-sm sm:text-base">
              Crie e exclua unidades de medida personalizadas
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4 py-4">
            {/* Adicionar Nova Unidade */}
            <div className="space-y-2">
              <h4 className="text-sm font-semibold">Adicionar Nova Unidade</h4>
              <div className="flex items-center gap-2">
                <Input
                  placeholder="Ex: FD (Fardo), PL (Pote)..."
                  value={newCustomUnit}
                  onChange={(e) => setNewCustomUnit(e.target.value)}
                  onKeyDown={(e) => {
                    if (e.key === 'Enter') {
                      e.preventDefault();
                      handleAddCustomUnit();
                      setNewCustomUnit("");
                    }
                  }}
                  className="flex-1"
                />
                <Button
                  type="button"
                  onClick={() => {
                    handleAddCustomUnit();
                    setNewCustomUnit("");
                  }}
                  className="bg-indigo-600 hover:bg-indigo-700 text-white"
                >
                  <Plus className="h-4 w-4 mr-2" />
                  Adicionar
                </Button>
              </div>
            </div>

            {/* Lista de Unidades Personalizadas */}
            <div className="space-y-2">
              <h4 className="text-sm font-semibold">Unidades Personalizadas</h4>
              <div className="max-h-64 overflow-y-auto border rounded-lg divide-y">
                {customUnits.length === 0 ? (
                  <div className="p-4 text-center text-sm text-gray-500">
                    Nenhuma unidade personalizada cadastrada
                  </div>
                ) : (
                  customUnits.map((unit) => (
                    <div
                      key={unit}
                      className="flex items-center justify-between p-3 hover:bg-gray-50"
                    >
                      <span className="text-sm font-medium flex items-center gap-2"><Hash className="h-3 w-3" /> {unit} (Personalizada)</span>
                      <Button
                        type="button"
                        variant="ghost"
                        size="sm"
                        onClick={() => {
                          setUnitToDelete(unit);
                          setIsDeleteUnitDialogOpen(true);
                        }}
                        className="text-red-600 hover:text-red-700 hover:bg-red-50"
                      >
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </div>
                  ))
                )}
              </div>
            </div>

            {/* Unidades Padrão (somente leitura) */}
            <div className="space-y-2">
              <h4 className="text-sm font-semibold text-gray-600">Unidades Padrão (não podem ser excluídas)</h4>
              <div className="max-h-32 overflow-y-auto border rounded-lg divide-y bg-gray-50">
                {defaultUnits.map((unit) => (
                  <div
                    key={unit.value}
                    className="flex items-center justify-between p-3"
                  >
                    <span className="text-sm text-gray-700">{unit.label}</span>
                  </div>
                ))}
              </div>
            </div>
          </div>

          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => {
                setIsManagingUnits(false);
                setNewCustomUnit("");
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