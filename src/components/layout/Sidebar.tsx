// Usando Lucide React
import { 
  Home,
  Package,
  TrendingUp,
  TrendingDown,
  FileText,
  DollarSign,
  Users,
  Truck,
  UserCircle,
  Settings,
  Shield,
  Pin,
  PinOff,
  ChevronDown,
  ChevronRight,
  FolderOpen
} from "lucide-react";
import { useLocation, NavLink } from "react-router-dom";
import { cn } from "@/lib/utils";
import { useEffect, useState } from "react";
import { useResponsive } from "@/hooks/use-responsive";
import { useSidebar } from "@/contexts/SidebarContext";
import { useWorkspace } from "@/contexts/WorkspaceContext";
import { useAuth } from "@/contexts/AuthContext";
import { Button } from "@/components/ui/button";

interface SidebarProps {
  className?: string;
  variant?: 'fixed' | 'overlay';
  onNavigate?: () => void; // Callback para fechar o menu ao navegar
}

interface NavigationItem {
  icon?: any;
  label: string;
  path?: string;
  description: string;
  children?: NavigationItem[];
}

const navigationItems: NavigationItem[] = [
  { 
    icon: Home, 
    label: "Dashboard", 
    path: "/",
    description: "Visão geral do sistema"
  },
  {
    icon: FolderOpen,
    label: "Cadastro",
    description: "Cadastros do sistema",
    children: [
      { 
        icon: Package, 
        label: "Produtos", 
        path: "/produtos",
        description: "Cadastro de produtos"
      },
      { 
        icon: Truck, 
        label: "Fornecedores", 
        path: "/fornecedores",
        description: "Cadastro de fornecedores"
      },
      { 
        icon: UserCircle, 
        label: "Clientes", 
        path: "/clientes",
        description: "Cadastro de clientes"
      }
    ]
  },
  {
    icon: DollarSign,
    label: "Financeiro",
    description: "Gestão financeira",
    children: [
      { 
        icon: TrendingUp, 
        label: "Compras", 
        path: "/entradas",
        description: "Controle de compras"
      },
      { 
        icon: TrendingDown, 
        label: "Vendas", 
        path: "/saidas",
        description: "Controle de vendas"
      },
      { 
        icon: FileText, 
        label: "Relatórios", 
        path: "/financeiro",
        description: "Relatórios e análises"
      }
    ]
  },
  {
    icon: Shield,
    label: "Administração",
    description: "Configurações e acesso",
    children: [
      { 
        icon: Users, 
        label: "Compartilhar", 
        path: "/compartilhar",
        description: "Gerenciar acesso"
      },
      { 
        icon: Settings, 
        label: "Configurações", 
        path: "/configuracoes",
        description: "Configurações do sistema"
      }
    ]
  }
];

export const Sidebar = ({ className, variant = 'overlay', onNavigate }: SidebarProps) => {
  const location = useLocation();
  const { isMobile, isTablet, screenWidth } = useResponsive();
  const { isPinned, togglePin } = useSidebar();
  const { workspaceAtivo } = useWorkspace();
  const { user } = useAuth();
  const [customColors, setCustomColors] = useState({
    primary: '#1E40AF',
    secondary: '#374151',
    accent: '#059669'
  });
  
  // Chave do localStorage baseada no ID do usuário
  const getStorageKey = (userId?: string) => `flexi-sidebar-expanded-${userId || 'guest'}`;
  
  // Carregar estado inicial do localStorage
  const loadExpandedGroups = (userId?: string): Set<string> => {
    if (!userId) return new Set();
    
    try {
      const saved = localStorage.getItem(getStorageKey(userId));
      if (saved) {
        const parsed = JSON.parse(saved);
        return new Set(parsed);
      }
    } catch (error) {
      console.error('Erro ao carregar estado das abas:', error);
    }
    return new Set();
  };
  
  const [expandedGroups, setExpandedGroups] = useState<Set<string>>(() => {
    // Tentar carregar do localStorage se houver usuário
    if (user?.id) {
      return loadExpandedGroups(user.id);
    }
    return new Set();
  });

  // Filtrar itens de navegação baseado nas permissões do workspace
  const getNavigationItems = (): NavigationItem[] => {
    // Se é workspace próprio, mostrar tudo
    if (!workspaceAtivo || workspaceAtivo.tipo === 'proprio') {
      return navigationItems;
    }

    // Se é workspace compartilhado, filtrar por permissões
    const permissoes = workspaceAtivo.permissoes || [];
    
    return navigationItems.map(item => {
      // Se tem filhos, filtrar os filhos
      if (item.children) {
        const filteredChildren = item.children.filter(child => {
          if (!child.path) return false;
          
          // Compartilhar e Configurações NUNCA disponível em workspace compartilhado
          if (child.path === '/compartilhar' || child.path === '/configuracoes') {
            return false;
          }
          
          const itemKey = child.path.substring(1);
          return permissoes.includes(itemKey);
        });
        
        // Retornar o item apenas se tiver filhos válidos
        return filteredChildren.length > 0 ? { ...item, children: filteredChildren } : null;
      }
      
      // Dashboard sempre disponível
      if (item.path === '/') {
        return item;
      }
      
      // Verificar se tem permissão
      if (!item.path) return null;
      const itemKey = item.path.substring(1); // Remove o /
      return permissoes.includes(itemKey) ? item : null;
    }).filter((item): item is NavigationItem => item !== null);
  };

  const filteredNavigationItems = getNavigationItems();

  const toggleGroup = (groupLabel: string) => {
    setExpandedGroups(prev => {
      const newSet = new Set(prev);
      if (newSet.has(groupLabel)) {
        newSet.delete(groupLabel);
      } else {
        newSet.add(groupLabel);
      }
      
      // Salvar no localStorage
      if (user?.id) {
        try {
          const array = Array.from(newSet);
          localStorage.setItem(getStorageKey(user.id), JSON.stringify(array));
          // Disparar evento customizado para sincronizar entre abas
          window.dispatchEvent(new CustomEvent('sidebar-groups-changed', { 
            detail: { userId: user.id, groups: array } 
          }));
        } catch (error) {
          console.error('Erro ao salvar estado das abas:', error);
        }
      }
      
      return newSet;
    });
  };

  const isGroupExpanded = (groupLabel: string) => {
    return expandedGroups.has(groupLabel);
  };

  const isPathActive = (path?: string) => {
    if (!path) return false;
    return location.pathname === path;
  };

  const isGroupActive = (children?: NavigationItem[]) => {
    if (!children) return false;
    return children.some(child => isPathActive(child.path));
  };

  // Expandir automaticamente grupos que contêm a rota ativa
  useEffect(() => {
    filteredNavigationItems.forEach(item => {
      if (item.children && item.children.some(child => isPathActive(child.path))) {
        setExpandedGroups(prev => {
          const newSet = new Set(prev);
          const groupLabel = item.label.toLowerCase();
          if (!newSet.has(groupLabel)) {
            newSet.add(groupLabel);
            
            // Salvar no localStorage quando expandir automaticamente
            if (user?.id) {
              try {
                const array = Array.from(newSet);
                localStorage.setItem(getStorageKey(user.id), JSON.stringify(array));
                window.dispatchEvent(new CustomEvent('sidebar-groups-changed', { 
                  detail: { userId: user.id, groups: array } 
                }));
              } catch (error) {
                console.error('Erro ao salvar estado das abas:', error);
              }
            }
          }
          return newSet;
        });
      }
    });
  }, [location.pathname, user?.id]); // eslint-disable-line react-hooks/exhaustive-deps

  // Sincronizar estado entre abas usando eventos de storage
  useEffect(() => {
    if (!user?.id) return;

    // Escutar mudanças no localStorage de outras abas
    const handleStorageChange = (e: StorageEvent) => {
      if (e.key === getStorageKey(user.id) && e.newValue) {
        try {
          const parsed = JSON.parse(e.newValue);
          setExpandedGroups(new Set(parsed));
        } catch (error) {
          console.error('Erro ao sincronizar estado das abas:', error);
        }
      }
    };

    // Escutar eventos customizados da mesma aba
    const handleCustomEvent = (e: CustomEvent) => {
      if (e.detail.userId === user.id) {
        setExpandedGroups(new Set(e.detail.groups));
      }
    };

    window.addEventListener('storage', handleStorageChange);
    window.addEventListener('sidebar-groups-changed', handleCustomEvent as EventListener);

    return () => {
      window.removeEventListener('storage', handleStorageChange);
      window.removeEventListener('sidebar-groups-changed', handleCustomEvent as EventListener);
    };
  }, [user?.id]);

  // Recarregar estado quando o usuário mudar (login/logout)
  useEffect(() => {
    if (user?.id) {
      const loaded = loadExpandedGroups(user.id);
      setExpandedGroups(loaded);
    } else {
      // Limpar estado quando não há usuário
      setExpandedGroups(new Set());
    }
  }, [user?.id]);

  // Aplicar cores personalizadas
  useEffect(() => {
    const applyCustomColors = () => {
      const root = document.documentElement;
      const primary = getComputedStyle(root).getPropertyValue('--color-primary').trim();
      const secondary = getComputedStyle(root).getPropertyValue('--color-secondary').trim();
      const accent = getComputedStyle(root).getPropertyValue('--color-accent').trim();
      
      if (primary && primary !== '') {
        setCustomColors({
          primary: primary || '#1E40AF',
          secondary: secondary || '#374151',
          accent: accent || '#059669'
        });
      }
    };

    applyCustomColors();
    
    // Observar mudanças nas variáveis CSS
    const observer = new MutationObserver(applyCustomColors);
    observer.observe(document.documentElement, {
      attributes: true,
      attributeFilter: ['style']
    });

    return () => observer.disconnect();
  }, []);

  return (
    <div className="flex flex-col h-full">
      {/* Header do Sidebar - Responsivo */}
      <div className="p-3 sm:p-4 md:p-6 border-b border-neutral-200 bg-gradient-to-br from-indigo-50 to-indigo-100">
        <div className="flex items-center space-x-2 sm:space-x-3">
          {/* Marca/Logo: aumentada e levemente deslocada para cima */}
          <div className="-mt-2 sm:-mt-3 md:-mt-4 w-10 h-10 sm:w-12 sm:h-12 md:w-14 md:h-14 bg-gradient-to-br from-indigo-600 to-indigo-700 rounded-lg sm:rounded-xl flex items-center justify-center shadow-lg shadow-indigo-500/30">
            <span className="text-base sm:text-lg md:text-xl text-white font-bold">FG</span>
          </div>
          <div>
            <h1 className="text-sm sm:text-base md:text-lg font-bold text-indigo-900">Flexi Gestor</h1>
            <p className="text-xs text-indigo-700">Sistema de Gestão</p>
          </div>
        </div>
      </div>

      {/* Navegação Principal - Responsiva */}
      <nav className="flex-1 p-3 sm:p-4 md:p-6 space-y-2 overflow-y-auto">
        <div className="mb-3 sm:mb-4 flex items-center justify-between">
          <h2 className="text-xs font-bold text-indigo-700 uppercase tracking-wider">
            Navegação Principal
          </h2>
          
          {/* Botão de Desafixar na navegação - Sempre quando a sidebar estiver fixada */}
          {variant === 'fixed' && (
            <Button
              variant="ghost"
              size="sm"
              onClick={togglePin}
              className="h-7 w-7 p-0 hover:bg-indigo-100 transition-colors rounded-lg"
              title="Desafixar menu (voltar ao modo overlay)"
            >
              <PinOff className="h-3.5 w-3.5 text-indigo-600" />
            </Button>
          )}
        </div>
        
        {filteredNavigationItems.map((item) => {
          // Se tem filhos, renderizar como grupo expansível
          if (item.children && item.children.length > 0) {
            const isExpanded = isGroupExpanded(item.label.toLowerCase());
            // Removido hasActiveChild para não destacar o botão pai quando uma sub-aba está ativa
            
            return (
              <div key={item.label} className="space-y-1">
                <button
                  onClick={() => toggleGroup(item.label.toLowerCase())}
                  className={cn(
                    "group w-full flex items-center rounded-xl font-medium transition-all duration-200 relative overflow-hidden",
                    isMobile ? "space-x-2 px-3 py-2.5 min-h-[40px]" : "space-x-3 px-4 py-3 min-h-[44px]",
                    "text-gray-800 font-semibold hover:text-indigo-700 hover:bg-indigo-50 hover:shadow-md"
                  )}
                >
                  {item.icon && (
                    <div className={cn(
                      "flex items-center justify-center rounded-lg transition-all duration-200",
                      isMobile ? "w-7 h-7" : "w-8 h-8",
                      "bg-indigo-100 text-indigo-700 group-hover:bg-indigo-200 group-hover:text-indigo-800"
                    )}>
                      <item.icon className={`${isMobile ? 'w-4 h-4' : 'w-5 h-5'} stroke-[2.5] relative -top-0.5`} />
                    </div>
                  )}
                  
                  <div className="flex-1 min-w-0 text-left">
                    <div className={`${isMobile ? 'text-sm' : 'font-medium'}`}>{item.label}</div>
                    {!isMobile && (
                      <div className={cn(
                        "text-xs transition-colors duration-200 font-medium",
                        "text-gray-600 group-hover:text-indigo-600"
                      )}>
                        {item.description}
                      </div>
                    )}
                  </div>
                  
                  {isExpanded ? (
                    <ChevronDown className={`${isMobile ? 'w-4 h-4' : 'w-5 h-5'} text-gray-500`} />
                  ) : (
                    <ChevronRight className={`${isMobile ? 'w-4 h-4' : 'w-5 h-5'} text-gray-500`} />
                  )}
                </button>
                
                {isExpanded && (
                  <div className="ml-4 space-y-1 border-l-2 border-indigo-200 pl-3">
                    {item.children.map((child) => {
                      const isChildActive = isPathActive(child.path);
                      
                      return (
                        <NavLink
                          key={child.path}
                          to={child.path || '#'}
                          onClick={() => onNavigate?.()}
                          className={cn(
                            "group flex items-center rounded-lg font-medium transition-all duration-200",
                            isMobile ? "space-x-2 px-3 py-2 min-h-[36px]" : "space-x-2 px-3 py-2 min-h-[40px]",
                            isChildActive
                              ? "bg-gradient-to-r from-indigo-600 to-indigo-700 text-white shadow-md shadow-indigo-500/20"
                              : "text-gray-700 hover:text-indigo-700 hover:bg-indigo-50"
                          )}
                        >
                          {child.icon && (
                            <div className={cn(
                              "flex items-center justify-center rounded-md transition-all duration-200",
                              isMobile ? "w-6 h-6" : "w-7 h-7",
                              isChildActive
                                ? "bg-white/20 text-white"
                                : "bg-indigo-100 text-indigo-600 group-hover:bg-indigo-200"
                            )}>
                              <child.icon className={`${isMobile ? 'w-3.5 h-3.5' : 'w-4 h-4'} stroke-[2.5]`} />
                            </div>
                          )}
                          
                          <div className="flex-1 min-w-0">
                            <div className={`${isMobile ? 'text-xs' : 'text-sm font-medium'}`}>{child.label}</div>
                            {!isMobile && (
                              <div className={cn(
                                "text-xs transition-colors duration-200",
                                isChildActive
                                  ? "text-white/80"
                                  : "text-gray-500 group-hover:text-indigo-600"
                              )}>
                                {child.description}
                              </div>
                            )}
                          </div>
                        </NavLink>
                      );
                    })}
                  </div>
                )}
              </div>
            );
          }
          
          // Item sem filhos - renderizar normalmente
          const isActive = isPathActive(item.path);
          
          return (
            <NavLink
              key={item.path || item.label}
              to={item.path || '#'}
              onClick={() => onNavigate?.()}
              className={cn(
                "group flex items-center rounded-xl font-medium transition-all duration-200 relative overflow-hidden",
                isMobile ? "space-x-2 px-3 py-2.5 min-h-[40px]" : "space-x-3 px-4 py-3 min-h-[44px]",
                isActive
                  ? "bg-gradient-to-r from-indigo-600 to-indigo-700 text-white shadow-lg shadow-indigo-500/25"
                  : "text-gray-800 font-semibold hover:text-indigo-700 hover:bg-indigo-50 hover:shadow-md"
              )}
            >
              {item.icon && (
                <div className={cn(
                  "flex items-center justify-center rounded-lg transition-all duration-200",
                  isMobile ? "w-7 h-7" : "w-8 h-8",
                  isActive
                    ? "bg-white/20 text-white"
                    : "bg-indigo-100 text-indigo-700 group-hover:bg-indigo-200 group-hover:text-indigo-800"
                )}>
                  <item.icon className={`${isMobile ? 'w-4 h-4' : 'w-5 h-5'} stroke-[2.5] relative -top-0.5`} />
                </div>
              )}
              
              <div className="flex-1 min-w-0">
                <div className={`${isMobile ? 'text-sm' : 'font-medium'}`}>{item.label}</div>
                {!isMobile && (
                  <div className={cn(
                    "text-xs transition-colors duration-200 font-medium",
                    isActive
                      ? "text-white/80"
                      : "text-gray-600 group-hover:text-indigo-600"
                  )}>
                    {item.description}
                  </div>
                )}
              </div>
            </NavLink>
          );
        })}
      </nav>

      {/* Footer do Sidebar - Responsivo */}
      <div className={`mt-auto ${isMobile ? 'p-3' : 'p-4'} border-t border-indigo-200 bg-gradient-to-br from-indigo-100 to-indigo-200`}>
        <div className="text-center">
          <p className={`${isMobile ? 'text-xs' : 'text-xs'} text-indigo-700 font-semibold ${isMobile ? 'mb-0.5' : 'mb-1'}`}>Versão 1.1</p>
          <p className={`${isMobile ? 'text-xs' : 'text-xs'} text-indigo-600 font-medium`}>© 2024 Flexi Gestor</p>
        </div>
      </div>
    </div>
  );
};