import * as React from "react";
import { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
// Usando Lucide React
import { 
  Plus,
  TrendingUp,
  TrendingDown,
  Package,
  ArrowRight,
  Settings,
  Edit,
  Trash2,
  Save,
  X,
  DollarSign,
  BarChart3,
  UserCircle,
  Truck,
  Users
} from "lucide-react";
import { useNavigate } from "react-router-dom";
import { useResponsive } from "@/hooks/use-responsive";

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
    id: "produtos",
    title: "Produtos",
    description: "Gestão de produtos",
    icon: "Package",
    color: "from-blue-500 to-blue-600",
    hoverColor: "from-blue-600 to-blue-700",
    path: "/produtos",
    order: 0
  },
  {
    id: "entradas",
    title: "Compras",
    description: "Controle de compras",
    icon: "TrendingUp",
    color: "from-emerald-500 to-emerald-600",
    hoverColor: "from-emerald-600 to-emerald-700",
    path: "/entradas",
    order: 1
  },
  {
    id: "saidas",
    title: "Vendas",
    description: "Controle de vendas",
    icon: "TrendingDown",
    color: "from-red-500 to-red-600",
    hoverColor: "from-red-600 to-red-700",
    path: "/saidas",
    order: 2
  },
  {
    id: "financeiro",
    title: "Relatórios",
    description: "Relatórios e análises",
    icon: "DollarSign",
    color: "from-amber-500 to-amber-600",
    hoverColor: "from-amber-600 to-amber-700",
    path: "/financeiro",
    order: 4
  },
  {
    id: "clientes",
    title: "Clientes",
    description: "Cadastro de clientes",
    icon: "UserCircle",
    color: "from-cyan-500 to-cyan-600",
    hoverColor: "from-cyan-600 to-cyan-700",
    path: "/clientes",
    order: 5
  }
];

// Páginas disponíveis para ações rápidas
const availablePages = [
  { 
    name: "Produtos", 
    path: "/produtos", 
    description: "Gestão de produtos",
    icon: "Package"
  },
  { 
    name: "Compras", 
    path: "/entradas", 
    description: "Controle de compras",
    icon: "TrendingUp"
  },
  { 
    name: "Vendas", 
    path: "/saidas", 
    description: "Controle de vendas",
    icon: "TrendingDown"
  },
  { 
    name: "Relatórios", 
    path: "/financeiro", 
    description: "Relatórios e análises",
    icon: "DollarSign"
  },
  { 
    name: "Clientes", 
    path: "/clientes", 
    description: "Cadastro de clientes",
    icon: "UserCircle"
  },
  { 
    name: "Fornecedores", 
    path: "/fornecedores", 
    description: "Cadastro de fornecedores",
    icon: "Truck"
  },
  { 
    name: "Compartilhar", 
    path: "/compartilhar", 
    description: "Gerenciar acesso",
    icon: "Users"
  }
];

// Mapeamento de ícones
const iconMap = {
  Package: Package,
  TrendingUp: TrendingUp,
  TrendingDown: TrendingDown,
  BarChart3: BarChart3,
  DollarSign: DollarSign,
  UserCircle: UserCircle,
  Truck: Truck,
  Users: Users
};

// Cores disponíveis
const colorOptions = [
  { name: "Índigo", value: "from-indigo-500 to-indigo-600", hover: "from-indigo-600 to-indigo-700" },
  { name: "Azul", value: "from-blue-500 to-blue-600", hover: "from-blue-600 to-blue-700" },
  { name: "Verde", value: "from-green-500 to-green-600", hover: "from-green-600 to-green-700" },
  { name: "Esmeralda", value: "from-emerald-500 to-emerald-600", hover: "from-emerald-600 to-emerald-700" },
  { name: "Âmbar", value: "from-amber-500 to-amber-600", hover: "from-amber-600 to-amber-700" },
  { name: "Laranja", value: "from-orange-500 to-orange-600", hover: "from-orange-600 to-orange-700" },
  { name: "Roxo", value: "from-purple-500 to-purple-600", hover: "from-purple-600 to-purple-700" },
  { name: "Cinza", value: "from-gray-500 to-gray-600", hover: "from-gray-600 to-gray-700" },
  { name: "Vermelho", value: "from-red-500 to-red-600", hover: "from-red-600 to-red-700" },
  { name: "Amarelo", value: "from-yellow-500 to-yellow-600", hover: "from-yellow-600 to-yellow-700" }
];

export const QuickActions = () => {
  const navigate = useNavigate();
  const { isMobile, isTablet } = useResponsive();
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
    const actionsVersion = localStorage.getItem('flexi-gestor-actions-version');
    const currentVersion = '2.3'; // bump para atualizar Financeiro para Relatórios

    const removeOldRefs = (list: QuickAction[]) =>
      (list || []).filter(a => 
        a.path !== '/pdv' && 
        a.path !== '/relatorios' &&
        a.title.toLowerCase() !== 'pdv' && 
        a.title.toLowerCase() !== 'relatórios' && 
        a.title.toLowerCase() !== 'relatorios' &&
        !/ponto de venda/i.test(a.description || '') &&
        !/relat[óo]rios/i.test(a.description || '')
      );

    // Função para migrar ações antigas: atualizar Financeiro para Relatórios
    const migrateActions = (list: QuickAction[]): QuickAction[] => {
      return list.map(action => {
        // Se é a ação financeiro, atualizar título e descrição
        if (action.path === '/financeiro' || action.id === 'financeiro' || 
            action.title === 'Financeiro' || action.title.toLowerCase() === 'financeiro') {
          return {
            ...action,
            title: 'Relatórios',
            description: 'Relatórios e análises'
          };
        }
        return action;
      });
    };
    
    // Se não tem versão ou a versão é diferente, migrar e atualizar
    if (!actionsVersion || actionsVersion !== currentVersion) {
      if (savedActions) {
        // Migrar ações existentes
        const parsed: QuickAction[] = JSON.parse(savedActions);
        const migrated = migrateActions(parsed);
        const cleaned = removeOldRefs(migrated);
        setActions(cleaned);
        localStorage.setItem('flexi-gestor-quick-actions', JSON.stringify(cleaned));
      } else {
        // Usar ações padrão na primeira vez
        const cleanedDefaults = removeOldRefs(defaultActions);
        setActions(cleanedDefaults);
        localStorage.setItem('flexi-gestor-quick-actions', JSON.stringify(cleanedDefaults));
      }
      localStorage.setItem('flexi-gestor-actions-version', currentVersion);
    } else if (savedActions) {
      // Versão atual, mas verificar se precisa migrar (caso tenha sido atualizado manualmente)
      const parsed: QuickAction[] = JSON.parse(savedActions);
      const needsMigration = parsed.some(a => 
        (a.path === '/financeiro' || a.id === 'financeiro') && 
        (a.title === 'Financeiro' || a.title.toLowerCase() === 'financeiro')
      );
      
      if (needsMigration) {
        const migrated = migrateActions(parsed);
        const cleaned = removeOldRefs(migrated);
        setActions(cleaned);
        localStorage.setItem('flexi-gestor-quick-actions', JSON.stringify(cleaned));
      } else {
        const cleaned = removeOldRefs(parsed);
        setActions(cleaned);
        if (cleaned.length !== parsed.length) {
          localStorage.setItem('flexi-gestor-quick-actions', JSON.stringify(cleaned));
        }
      }
    } else {
      // Usar ações padrão na primeira vez
      const cleanedDefaults = removeOldRefs(defaultActions);
      setActions(cleanedDefaults);
      localStorage.setItem('flexi-gestor-quick-actions', JSON.stringify(cleanedDefaults));
      localStorage.setItem('flexi-gestor-actions-version', currentVersion);
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
    <Card className={`bg-white border-0 shadow-lg ${isMobile ? 'rounded-xl' : 'rounded-2xl'} overflow-hidden`}>
      <CardHeader className={`bg-gradient-to-r from-neutral-50 to-neutral-100 border-b border-neutral-200 ${isMobile ? 'p-4' : 'p-6'}`}>
        <div className={`flex items-center ${isMobile ? 'flex-col space-y-3' : 'justify-between'}`}>
          <CardTitle className={`${isMobile ? 'text-lg' : 'text-xl'} font-bold text-neutral-900 flex items-center ${isMobile ? 'space-x-2' : 'space-x-2'}`}>
            <div className={`${isMobile ? 'w-7 h-7' : 'w-8 h-8'} bg-blue-100 ${isMobile ? 'rounded-lg' : 'rounded-lg'} flex items-center justify-center`}>
              <Plus className={`${isMobile ? 'w-3 h-3' : 'w-4 h-4'} text-blue-600`} />
            </div>
            <span 
              className={`font-inter font-bold ${isMobile ? 'text-xl' : 'text-2xl'}`}
              style={{
                fontFamily: 'Inter, sans-serif',
                fontWeight: 700,
                fontSize: isMobile ? '1.25rem' : '1.5rem'
              }}
            >
              Ações Rápidas
            </span>
          </CardTitle>
          
          <div className={`flex items-center ${isMobile ? 'space-x-1' : 'space-x-2'}`}>
            <Button
              variant="outline"
              size="sm"
              onClick={() => setIsEditMode(!isEditMode)}
              className={`${isMobile ? 'text-xs px-2 py-1' : 'text-xs font-medium px-3 py-1'}`}
              style={{ fontFamily: 'Inter, sans-serif', fontWeight: 500 }}
            >
              <Settings className={`${isMobile ? 'w-3 h-3 mr-1' : 'w-3 h-3 mr-1'}`} />
              {isMobile ? (isEditMode ? "Ver" : "Edit") : (isEditMode ? "Visualizar" : "Editar")}
            </Button>
            
            {isEditMode && (
              <>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setIsAddDialogOpen(true)}
                  className={`${isMobile ? 'text-xs px-2 py-1' : 'text-xs font-semibold px-3 py-1'}`}
                  style={{ fontFamily: 'Inter, sans-serif', fontWeight: 600 }}
                >
                  <Plus className={`${isMobile ? 'w-3 h-3 mr-1' : 'w-3 h-3 mr-1'}`} />
                  {isMobile ? "Add" : "Adicionar"}
                </Button>
                
                <Button
                  variant="outline"
                  size="sm"
                  onClick={resetToDefault}
                  className={`${isMobile ? 'text-xs px-2 py-1' : 'text-xs font-bold px-3 py-1'}`}
                  style={{ fontFamily: 'Inter, sans-serif', fontWeight: 700 }}
                >
                  Reset
                </Button>
              </>
            )}
          </div>
        </div>
      </CardHeader>
      
      <CardContent className={`${isMobile ? 'p-4' : 'p-6'}`}>
        <div className={`grid ${isMobile ? 'grid-cols-1' : 'grid-cols-1 sm:grid-cols-2'} ${isMobile ? 'gap-3' : 'gap-4'}`}>
          {actions.map((action, index) => (
            <div key={action.id} className="relative group">
              <Button
                variant="ghost"
                className={`h-auto ${isMobile ? 'p-4' : 'p-6'} flex flex-col items-start ${isMobile ? 'gap-3' : 'gap-4'} hover:shadow-lg transition-all duration-300 transform hover:scale-105 ${isMobile ? 'rounded-lg' : 'rounded-xl'} border border-neutral-200 hover:border-blue-200 hover:bg-blue-50 w-full`}
                onClick={() => !isEditMode && navigate(action.path)}
              >
                {/* Ícone com Background Gradiente - Responsivo */}
                <div className={`${isMobile ? 'w-10 h-10' : 'w-12 h-12'} ${isMobile ? 'rounded-lg' : 'rounded-xl'} bg-gradient-to-br ${action.color} flex items-center justify-center shadow-lg`}>
                  <div className="text-white">
                    {renderIcon(action.icon)}
                  </div>
                </div>
                
                {/* Conteúdo - Responsivo */}
                <div className={`text-left ${isMobile ? 'space-y-1' : 'space-y-2'} flex-1`}>
                  <h3 
                    className={`font-semibold text-neutral-900 ${isMobile ? 'text-sm' : 'text-base'} font-inter`}
                    style={{ fontFamily: 'Inter, sans-serif', fontWeight: 600, fontSize: isMobile ? '0.875rem' : '1rem' }}
                  >
                    {action.title}
                  </h3>
                  <p 
                    className={`${isMobile ? 'text-xs' : 'text-sm'} text-neutral-600 leading-relaxed font-normal`}
                    style={{ fontFamily: 'Inter, sans-serif', fontWeight: 400, fontSize: isMobile ? '0.75rem' : '0.875rem' }}
                  >
                    {action.description}
                  </p>
                </div>
                
                {/* Seta de Navegação - Responsiva */}
                {!isEditMode && (
                  <div className={`${isMobile ? 'w-7 h-7' : 'w-8 h-8'} bg-neutral-100 ${isMobile ? 'rounded-lg' : 'rounded-lg'} flex items-center justify-center hover:bg-blue-100 transition-colors duration-200`}>
                    <ArrowRight className={`${isMobile ? 'w-3 h-3' : 'w-4 h-4'} text-neutral-500 hover:text-blue-600 transition-colors duration-200`} />
                  </div>
                )}
              </Button>
              
              {/* Controles de Edição - Responsivos */}
              {isEditMode && (
                <div className={`absolute ${isMobile ? 'top-1 right-1' : 'top-2 right-2'} flex items-center ${isMobile ? 'space-x-0.5' : 'space-x-1'} opacity-0 group-hover:opacity-100 transition-opacity duration-200`}>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => moveAction(action.id, 'up')}
                    disabled={index === 0}
                    className={`${isMobile ? 'w-5 h-5' : 'w-6 h-6'} p-0 bg-white/90 hover:bg-white`}
                  >
                    ↑
                  </Button>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => moveAction(action.id, 'down')}
                    disabled={index === actions.length - 1}
                    className={`${isMobile ? 'w-5 h-5' : 'w-6 h-6'} p-0 bg-white/90 hover:bg-white`}
                  >
                    ↓
                  </Button>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => openEditDialog(action)}
                    className={`${isMobile ? 'w-5 h-5' : 'w-6 h-6'} p-0 bg-white/90 hover:bg-white`}
                  >
                    <Edit className={`${isMobile ? 'w-2.5 h-2.5' : 'w-3 h-3'}`} />
                  </Button>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => removeAction(action.id)}
                    className={`${isMobile ? 'w-5 h-5' : 'w-6 h-6'} p-0 bg-white/90 hover:bg-white text-red-600 hover:text-red-700`}
                  >
                    <Trash2 className={`${isMobile ? 'w-2.5 h-2.5' : 'w-3 h-3'}`} />
                  </Button>
                </div>
              )}
            </div>
          ))}
        </div>
        
        {/* Footer com Estatísticas - Responsivo */}
        <div className={`${isMobile ? 'mt-4 pt-4' : 'mt-6 pt-6'} border-t border-neutral-200`}>
          <div className={`flex items-center justify-between ${isMobile ? 'text-xs' : 'text-sm'} text-neutral-500`}>
            <span className="font-normal">{isMobile ? 'Total de ações' : 'Total de ações configuradas'}</span>
            <span className={`font-semibold text-neutral-700 ${isMobile ? 'text-base' : 'text-lg'}`}>{actions.length}</span>
          </div>
        </div>
      </CardContent>

      {/* Modal para Adicionar/Editar Ação - Responsivo */}
      <Dialog open={isAddDialogOpen} onOpenChange={setIsAddDialogOpen}>
        <DialogContent className={`${isMobile ? 'max-w-[95vw] mx-4' : 'max-w-md'}`}>
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