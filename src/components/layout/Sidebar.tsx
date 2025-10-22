import { 
  Home, 
  Package, 
  TrendingUp, 
  TrendingDown, 
  FileText, 
  DollarSign,
  ShoppingCart,
  Users,
  Pin,
  PinOff
} from "lucide-react";
import { useLocation, NavLink } from "react-router-dom";
import { cn } from "@/lib/utils";
import { useEffect, useState } from "react";
import { useResponsive } from "@/hooks/use-responsive";
import { useSidebar } from "@/contexts/SidebarContext";
import { Button } from "@/components/ui/button";

interface SidebarProps {
  className?: string;
  variant?: 'fixed' | 'overlay';
  onNavigate?: () => void; // Callback para fechar o menu ao navegar
}

const navigationItems = [
  { 
    icon: Home, 
    label: "Dashboard", 
    path: "/",
    description: "Visão geral do sistema"
  },
  { 
    icon: Package, 
    label: "Produtos", 
    path: "/produtos",
    description: "Gestão de produtos"
  },
  { 
    icon: TrendingUp, 
    label: "Entradas", 
    path: "/entradas",
    description: "Controle de entradas"
  },
  { 
    icon: TrendingDown, 
    label: "Saídas", 
    path: "/saidas",
    description: "Controle de saídas"
  },
  { 
    icon: FileText, 
    label: "Relatórios", 
    path: "/relatorios",
    description: "Análises e dados"
  },
  { 
    icon: DollarSign, 
    label: "Financeiro", 
    path: "/financeiro",
    description: "Controle financeiro"
  },
  { 
    icon: ShoppingCart, 
    label: "PDV", 
    path: "/pdv",
    description: "Ponto de Venda"
  },
  { 
    icon: Users, 
    label: "Compartilhar", 
    path: "/compartilhar",
    description: "Gerenciar acesso"
  }
];

export const Sidebar = ({ className, variant = 'overlay', onNavigate }: SidebarProps) => {
  const location = useLocation();
  const { isMobile, isTablet, screenWidth } = useResponsive();
  const { isPinned, togglePin } = useSidebar();
  const [customColors, setCustomColors] = useState({
    primary: '#1E40AF',
    secondary: '#374151',
    accent: '#059669'
  });

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
    <div className={cn(
      "flex flex-col bg-gradient-to-br from-indigo-50 via-indigo-100/60 to-indigo-100 border-r border-indigo-200 shadow-xl h-full",
      isMobile ? "w-full max-w-sm" : isTablet ? "w-72" : "w-80",
      className
    )}>
      
      {/* Header do Sidebar - Responsivo */}
      <div className="p-3 sm:p-4 md:p-6 border-b border-neutral-200 bg-gradient-to-br from-indigo-50 to-indigo-100">
        <div className="flex items-center space-x-2 sm:space-x-3">
          <div className="w-8 h-8 sm:w-9 sm:h-9 md:w-10 md:h-10 bg-gradient-to-br from-indigo-600 to-indigo-700 rounded-lg sm:rounded-xl flex items-center justify-center shadow-lg">
            <span className="text-sm sm:text-base md:text-lg text-white font-bold">FG</span>
          </div>
          <div>
            <h1 className="text-sm sm:text-base md:text-lg font-bold text-indigo-900">Flexi Gestor</h1>
            <p className="text-xs text-indigo-700">Sistema de Gestão</p>
          </div>
        </div>
      </div>

      {/* Navegação Principal - Responsiva */}
      <nav className="flex-1 p-3 sm:p-4 md:p-6 space-y-2">
        <div className="mb-3 sm:mb-4 flex items-center justify-between">
          <h2 className="text-xs font-bold text-indigo-700 uppercase tracking-wider">
            Navegação Principal
          </h2>
          
          {/* Botão de Pin na navegação - Só quando fixado */}
          {variant === 'fixed' && !isMobile && !isTablet && (
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
        
        {navigationItems.map((item) => {
          const isActive = location.pathname === item.path;
          
          return (
            <NavLink
              key={item.path}
              to={item.path}
              onClick={() => onNavigate?.()} // Fechar o menu ao clicar
              className={cn(
                "group flex items-center rounded-xl font-medium transition-all duration-200 relative overflow-hidden",
                isMobile ? "space-x-2 px-3 py-2.5 min-h-[40px]" : "space-x-3 px-4 py-3 min-h-[44px]",
                isActive
                  ? "bg-gradient-to-r from-indigo-600 to-indigo-700 text-white shadow-lg shadow-indigo-500/25"
                  : "text-gray-800 font-semibold hover:text-indigo-700 hover:bg-indigo-50 hover:shadow-md"
              )}
            >
              {/* Indicador de item ativo */}
              {isActive && (
                <div className="absolute left-0 top-0 bottom-0 w-1 bg-white rounded-r-full" />
              )}
              
              <div className={cn(
                "flex items-center justify-center rounded-lg transition-all duration-200",
                isMobile ? "w-7 h-7" : "w-8 h-8",
                isActive
                  ? "bg-white/20 text-white"
                  : "bg-indigo-100 text-indigo-700 group-hover:bg-indigo-200 group-hover:text-indigo-800"
              )}>
                <item.icon className={`${isMobile ? 'w-4 h-4' : 'w-5 h-5'} stroke-[2.5]`} />
              </div>
              
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
      <div className={`${isMobile ? 'p-3' : 'p-4'} border-t border-indigo-200 bg-gradient-to-br from-indigo-100 to-indigo-200`}>
        <div className="text-center">
          <p className={`${isMobile ? 'text-xs' : 'text-xs'} text-indigo-700 font-semibold ${isMobile ? 'mb-0.5' : 'mb-1'}`}>Versão 2.0.0</p>
          <p className={`${isMobile ? 'text-xs' : 'text-xs'} text-indigo-600 font-medium`}>© 2024 Flexi Gestor</p>
        </div>
      </div>
    </div>
  );
};