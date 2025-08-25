import React, { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Plus, ShoppingCart, TrendingUp, TrendingDown, Package, ArrowRight, Settings, Edit, Trash2, Save, X, RotateCcw } from "lucide-react";
import { useNavigate } from "react-router-dom";

// Interface para ações rápidas
interface QuickAction {
  id: string;
  title: string;
  description: string;
  icon: string;
  color: string;
  hoverColor: string;
  path: string;
  order: number;
}

// Ações padrão disponíveis
const defaultActions = [
  {
    id: "new-product",
    title: "Novo Produto",
    description: "Cadastrar produto no estoque",
    icon: "Package",
    color: "from-blue-500 to-blue-600",
    hoverColor: "from-blue-600 to-blue-700",
    path: "/produtos",
    order: 0
  },
  {
    id: "new-sale",
    title: "Registrar Venda",
    description: "Nova venda de produtos",
    icon: "ShoppingCart",
    color: "from-green-500 to-green-600",
    hoverColor: "from-green-600 to-green-700",
    path: "/saidas",
    order: 1
  },
  {
    id: "stock-entry",
    title: "Entrada Estoque",
    description: "Compra de fornecedor",
    icon: "TrendingUp",
    color: "from-emerald-500 to-emerald-600",
    hoverColor: "from-emerald-600 to-emerald-700",
    path: "/entradas",
    order: 2
  },
  {
    id: "stock-adjustment",
    title: "Ajuste Estoque",
    description: "Corrigir quantidade",
    icon: "TrendingDown",
    color: "from-orange-500 to-orange-600",
    hoverColor: "from-orange-600 to-orange-700",
    path: "/movimentacoes",
    order: 3
  },
  {
    id: "reports",
    title: "Relatórios",
    description: "Visualizar relatórios",
    icon: "BarChart3",
    color: "from-purple-500 to-purple-600",
    hoverColor: "from-purple-600 to-purple-700",
    path: "/relatorios",
    order: 4
  },
  {
    id: "configurations",
    title: "Configurações",
    description: "Configurar sistema",
    icon: "Settings",
    color: "from-gray-500 to-gray-600",
    hoverColor: "from-gray-600 to-gray-700",
    path: "/configuracoes",
    order: 5
  }
];

// Páginas disponíveis para ações rápidas
const availablePages = [
  { 
    name: "Produtos", 
    path: "/produtos", 
    description: "Gerenciar produtos do estoque",
    icon: "Package"
  },
  { 
    name: "Saídas", 
    path: "/saidas", 
    description: "Registrar vendas e saídas",
    icon: "ShoppingCart"
  },
  { 
    name: "Entradas", 
    path: "/entradas", 
    description: "Registrar entradas de estoque",
    icon: "TrendingUp"
  },
  { 
    name: "Movimentações", 
    path: "/movimentacoes", 
    description: "Histórico de movimentações",
    icon: "RotateCcw"
  },
  { 
    name: "Relatórios", 
    path: "/relatorios", 
    description: "Visualizar relatórios",
    icon: "BarChart3"
  },
  { 
    name: "Configurações", 
    path: "/configuracoes", 
    description: "Configurar sistema",
    icon: "Settings"
  }
];

// Mapeamento de ícones
const iconMap = {
  Package: Package,
  ShoppingCart: ShoppingCart,
  TrendingUp: TrendingUp,
  TrendingDown: TrendingDown,
  RotateCcw: RotateCcw,
  BarChart3: () => <div className="w-5 h-5 bg-current rounded-sm" />,
  Settings: Settings
};

// Cores disponíveis
const colorOptions = [
  { name: "Azul", value: "from-blue-500 to-blue-600", hover: "from-blue-600 to-blue-700" },
  { name: "Verde", value: "from-green-500 to-green-600", hover: "from-green-600 to-green-700" },
  { name: "Esmeralda", value: "from-emerald-500 to-emerald-600", hover: "from-emerald-600 to-emerald-700" },
  { name: "Laranja", value: "from-orange-500 to-orange-600", hover: "from-orange-600 to-orange-700" },
  { name: "Roxo", value: "from-purple-500 to-purple-600", hover: "from-purple-600 to-purple-700" },
  { name: "Cinza", value: "from-gray-500 to-gray-600", hover: "from-gray-600 to-gray-700" },
  { name: "Vermelho", value: "from-red-500 to-red-600", hover: "from-red-600 to-red-700" },
  { name: "Amarelo", value: "from-yellow-500 to-yellow-600", hover: "from-yellow-600 to-yellow-700" }
];

export const QuickActions = () => {
  const navigate = useNavigate();
  const [actions, setActions] = useState<QuickAction[]>([]);
  const [isEditMode, setIsEditMode] = useState(false);
  const [isAddDialogOpen, setIsAddDialogOpen] = useState(false);
  const [editingAction, setEditingAction] = useState<QuickAction | null>(null);
  const [formData, setFormData] = useState({
    title: "",
    description: "",
    icon: "Package",
    color: "from-blue-500 to-blue-600",
    path: "/produtos"
  });

  // Carregar ações do localStorage
  useEffect(() => {
    const savedActions = localStorage.getItem('flexi-gestor-quick-actions');
    if (savedActions) {
      setActions(JSON.parse(savedActions));
    } else {
      // Usar ações padrão na primeira vez
      setActions(defaultActions);
      localStorage.setItem('flexi-gestor-quick-actions', JSON.stringify(defaultActions));
    }
  }, []);

  // Salvar ações no localStorage
  const saveActions = (newActions: QuickAction[]) => {
    setActions(newActions);
    localStorage.setItem('flexi-gestor-quick-actions', JSON.stringify(newActions));
  };

  // Adicionar nova ação
  const addAction = () => {
    const selectedPage = availablePages.find(page => page.path === formData.path);
    const finalDescription = formData.description || selectedPage?.description || "Ação rápida personalizada";
    const finalIcon = formData.icon || selectedPage?.icon || "Package";
    
    const newAction: QuickAction = {
      id: Date.now().toString(),
      title: formData.title,
      description: finalDescription,
      icon: finalIcon,
      color: formData.color,
      hoverColor: colorOptions.find(c => c.value === formData.color)?.hover || "from-blue-600 to-blue-700",
      path: formData.path,
      order: actions.length
    };
    
    const updatedActions = [...actions, newAction];
    saveActions(updatedActions);
    
    // Reset form
    setFormData({
      title: "",
      description: "",
      icon: "Package",
      color: "from-blue-500 to-blue-600",
      path: "/produtos"
    });
    
    setIsAddDialogOpen(false);
  };

  // Editar ação
  const editAction = () => {
    if (!editingAction) return;
    
    const selectedPage = availablePages.find(page => page.path === formData.path);
    const finalDescription = formData.description || selectedPage?.description || "Ação rápida personalizada";
    const finalIcon = formData.icon || selectedPage?.icon || "Package";
    
    const updatedActions = actions.map(action => 
      action.id === editingAction.id 
        ? { 
            ...action, 
            title: formData.title,
            description: finalDescription,
            icon: finalIcon,
            color: formData.color,
            path: formData.path,
            hoverColor: colorOptions.find(c => c.value === formData.color)?.hover || "from-blue-600 to-blue-700"
          }
        : action
    );
    
    saveActions(updatedActions);
    setEditingAction(null);
    setIsAddDialogOpen(false);
  };

  // Remover ação
  const removeAction = (actionId: string) => {
    const updatedActions = actions.filter(action => action.id !== actionId);
    saveActions(updatedActions);
  };

  // Reordenar ações
  const moveAction = (actionId: string, direction: 'up' | 'down') => {
    const currentIndex = actions.findIndex(action => action.id === actionId);
    if (currentIndex === -1) return;
    
    const newIndex = direction === 'up' ? currentIndex - 1 : currentIndex + 1;
    if (newIndex < 0 || newIndex >= actions.length) return;
    
    const updatedActions = [...actions];
    [updatedActions[currentIndex], updatedActions[newIndex]] = [updatedActions[newIndex], updatedActions[currentIndex]];
    
    // Atualizar ordem
    updatedActions.forEach((action, index) => {
      action.order = index;
    });
    
    saveActions(updatedActions);
  };

  // Abrir modal de edição
  const openEditDialog = (action: QuickAction) => {
    setEditingAction(action);
    setFormData({
      title: action.title,
      description: action.description,
      icon: action.icon,
      color: action.color,
      path: action.path
    });
    setIsAddDialogOpen(true);
  };

  // Atualizar dados do formulário quando página for selecionada
  const handlePageChange = (pagePath: string) => {
    const selectedPage = availablePages.find(page => page.path === pagePath);
    if (selectedPage) {
      setFormData({
        ...formData,
        path: pagePath,
        icon: selectedPage.icon,
        description: selectedPage.description
      });
    }
  };

  // Reset para ações padrão
  const resetToDefault = () => {
    saveActions(defaultActions);
  };

  // Renderizar ícone
  const renderIcon = (iconName: string) => {
    const IconComponent = iconMap[iconName as keyof typeof iconMap];
    return IconComponent ? <IconComponent className="w-5 h-5" /> : <div className="w-5 h-5 bg-current rounded-sm" />;
  };

  return (
    <Card className="bg-white border-0 shadow-lg rounded-2xl overflow-hidden">
      <CardHeader className="bg-gradient-to-r from-neutral-50 to-neutral-100 border-b border-neutral-200">
        <div className="flex items-center justify-between">
          <CardTitle className="text-xl font-bold text-neutral-900 flex items-center space-x-2">
            <div className="w-8 h-8 bg-blue-100 rounded-lg flex items-center justify-center">
              <Plus className="w-4 h-4 text-blue-600" />
            </div>
            <span 
              className="font-inter font-bold text-2xl"
              style={{
                fontFamily: 'Inter, sans-serif',
                fontWeight: 700,
                fontSize: '1.5rem'
              }}
            >
              Ações Rápidas
            </span>
          </CardTitle>
          
          <div className="flex items-center space-x-2">
            <Button
              variant="outline"
              size="sm"
              onClick={() => setIsEditMode(!isEditMode)}
              className="text-xs font-medium px-3 py-1"
              style={{ fontFamily: 'Inter, sans-serif', fontWeight: 500 }}
            >
              <Settings className="w-3 h-3 mr-1" />
              {isEditMode ? "Visualizar" : "Editar"}
            </Button>
            
            {isEditMode && (
              <>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setIsAddDialogOpen(true)}
                  className="text-xs font-semibold px-3 py-1"
                  style={{ fontFamily: 'Inter, sans-serif', fontWeight: 600 }}
                >
                  <Plus className="w-3 h-3 mr-1" />
                  Adicionar
                </Button>
                
                <Button
                  variant="outline"
                  size="sm"
                  onClick={resetToDefault}
                  className="text-xs font-bold px-3 py-1"
                  style={{ fontFamily: 'Inter, sans-serif', fontWeight: 700 }}
                >
                  Reset
                </Button>
              </>
            )}
          </div>
        </div>
      </CardHeader>
      
      <CardContent className="p-6">
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          {actions.map((action, index) => (
            <div key={action.id} className="relative group">
              <Button
                variant="ghost"
                className="h-auto p-6 flex flex-col items-start gap-4 hover:shadow-lg transition-all duration-300 transform hover:scale-105 rounded-xl border border-neutral-200 hover:border-blue-200 hover:bg-blue-50 w-full"
                onClick={() => !isEditMode && navigate(action.path)}
              >
                {/* Ícone com Background Gradiente */}
                <div className={`w-12 h-12 rounded-xl bg-gradient-to-br ${action.color} flex items-center justify-center shadow-lg`}>
                  <div className="text-white">
                    {renderIcon(action.icon)}
                  </div>
                </div>
                
                {/* Conteúdo */}
                <div className="text-left space-y-2 flex-1">
                  <h3 
                    className="font-semibold text-neutral-900 text-base font-inter"
                    style={{ fontFamily: 'Inter, sans-serif', fontWeight: 600, fontSize: '1rem' }}
                  >
                    {action.title}
                  </h3>
                  <p 
                    className="text-sm text-neutral-600 leading-relaxed font-normal"
                    style={{ fontFamily: 'Inter, sans-serif', fontWeight: 400, fontSize: '0.875rem' }}
                  >
                    {action.description}
                  </p>
                </div>
                
                {/* Seta de Navegação */}
                {!isEditMode && (
                  <div className="w-8 h-8 bg-neutral-100 rounded-lg flex items-center justify-center hover:bg-blue-100 transition-colors duration-200">
                    <ArrowRight className="w-4 h-4 text-neutral-500 hover:text-blue-600 transition-colors duration-200" />
                  </div>
                )}
              </Button>
              
              {/* Controles de Edição */}
              {isEditMode && (
                <div className="absolute top-2 right-2 flex items-center space-x-1 opacity-0 group-hover:opacity-100 transition-opacity duration-200">
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => moveAction(action.id, 'up')}
                    disabled={index === 0}
                    className="w-6 h-6 p-0 bg-white/90 hover:bg-white"
                  >
                    ↑
                  </Button>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => moveAction(action.id, 'down')}
                    disabled={index === actions.length - 1}
                    className="w-6 h-6 p-0 bg-white/90 hover:bg-white"
                  >
                    ↓
                  </Button>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => openEditDialog(action)}
                    className="w-6 h-6 p-0 bg-white/90 hover:bg-white"
                  >
                    <Edit className="w-3 h-3" />
                  </Button>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => removeAction(action.id)}
                    className="w-6 h-6 p-0 bg-white/90 hover:bg-white text-red-600 hover:text-red-700"
                  >
                    <Trash2 className="w-3 h-3" />
                  </Button>
                </div>
              )}
            </div>
          ))}
        </div>
        
        {/* Footer com Estatísticas */}
        <div className="mt-6 pt-6 border-t border-neutral-200">
          <div className="flex items-center justify-between text-sm text-neutral-500">
            <span className="font-normal">Total de ações configuradas</span>
            <span className="font-semibold text-neutral-700 text-lg">{actions.length}</span>
          </div>
          

        </div>
      </CardContent>

      {/* Modal para Adicionar/Editar Ação */}
      <Dialog open={isAddDialogOpen} onOpenChange={setIsAddDialogOpen}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>
              {editingAction ? "✏️ Editar Ação Rápida" : "✨ Adicionar Nova Ação"}
            </DialogTitle>
            <DialogDescription>
              {editingAction 
                ? "Modifique os detalhes da ação rápida selecionada"
                : "Configure uma nova ação rápida para o dashboard"
              }
            </DialogDescription>
          </DialogHeader>
          
          <div className="space-y-4">
            <div>
              <Label htmlFor="title">Título da Ação</Label>
              <Input
                id="title"
                value={formData.title}
                onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                placeholder="Ex: Novo Produto"
              />
            </div>
            
            <div>
              <Label htmlFor="page">Página de Destino</Label>
              <Select value={formData.path} onValueChange={handlePageChange}>
                <SelectTrigger>
                  <SelectValue placeholder="Selecione uma página" />
                </SelectTrigger>
                <SelectContent>
                  {availablePages.map(page => (
                    <SelectItem key={page.path} value={page.path}>
                      <div className="flex items-center space-x-2">
                        {renderIcon(page.icon)}
                        <div className="flex flex-col items-start">
                          <span className="font-medium">{page.name}</span>
                          <span className="text-xs text-muted-foreground">{page.description}</span>
                        </div>
                      </div>
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            
            <div>
              <Label htmlFor="description">Descrição Personalizada</Label>
              <Input
                id="description"
                value={formData.description}
                onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                placeholder="Descrição que aparecerá na ação rápida"
              />
              <p className="text-xs text-muted-foreground mt-1">
                Deixe em branco para usar a descrição padrão da página
              </p>
            </div>
            
            <div>
              <Label htmlFor="icon">Ícone</Label>
              <Select value={formData.icon} onValueChange={(value) => setFormData({ ...formData, icon: value })}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {Object.keys(iconMap).map(iconName => (
                    <SelectItem key={iconName} value={iconName}>
                      <div className="flex items-center space-x-2">
                        {renderIcon(iconName)}
                        <span>{iconName}</span>
                      </div>
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            
            <div>
              <Label htmlFor="color">Cor do Ícone</Label>
              <Select value={formData.color} onValueChange={(value) => setFormData({ ...formData, color: value })}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {colorOptions.map(color => (
                    <SelectItem key={color.value} value={color.value}>
                      <div className="flex items-center space-x-2">
                        <div className={`w-4 h-4 rounded bg-gradient-to-r ${color.value}`} />
                        <span>{color.name}</span>
                      </div>
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            
            {/* Prévia da Ação */}
            {formData.title && formData.path && (
              <div className="border border-neutral-200 rounded-lg p-4 bg-neutral-50">
                <Label className="text-sm font-medium text-neutral-700 mb-3 block">Prévia da Ação</Label>
                <div className="flex items-start gap-3 p-3 bg-white rounded-lg border border-neutral-200">
                  <div className={`w-10 h-10 rounded-lg bg-gradient-to-br ${formData.color} flex items-center justify-center shadow-md`}>
                    <div className="text-white">
                      {renderIcon(formData.icon)}
                    </div>
                  </div>
                  <div className="flex-1 space-y-1">
                    <h4 className="font-semibold text-neutral-900 text-sm">
                      {formData.title}
                    </h4>
                    <p className="text-xs text-neutral-600">
                      {formData.description || availablePages.find(p => p.path === formData.path)?.description || "Descrição da ação"}
                    </p>
                  </div>
                </div>
              </div>
            )}
          </div>
          
          <DialogFooter>
            <Button variant="outline" onClick={() => setIsAddDialogOpen(false)}>
              <X className="w-4 h-4 mr-2" />
              Cancelar
            </Button>
            <Button onClick={editingAction ? editAction : addAction}>
              <Save className="w-4 h-4 mr-2" />
              {editingAction ? "Salvar" : "Adicionar"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </Card>
  );
};