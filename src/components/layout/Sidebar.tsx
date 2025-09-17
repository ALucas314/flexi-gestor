import { 
  Home, 
  Package, 
  TrendingUp, 
  TrendingDown, 
  FileText, 
  Settings,
  BarChart3
} from "lucide-react";
import { useLocation, NavLink } from "react-router-dom";
import { cn } from "@/lib/utils";
import { useEffect, useState } from "react";
import { useResponsive } from "@/hooks/use-responsive";

interface SidebarProps {
  className?: string;
  variant?: 'fixed' | 'overlay';
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
    icon: BarChart3, 
    label: "Movimentações", 
    path: "/movimentacoes",
    description: "Histórico completo"
  },
  { 
    icon: FileText, 
    label: "Relatórios", 
    path: "/relatorios",
    description: "Análises e dados"
  }
];

export const Sidebar = ({ className, variant = 'overlay' }: SidebarProps) => {
  const location = useLocation();
  const { isMobile, isTablet, screenWidth } = useResponsive();
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
      "flex flex-col bg-white border-r border-neutral-200 shadow-xl h-full",
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
        <div className="mb-3 sm:mb-4">
          <h2 className="text-xs font-semibold text-neutral-500 uppercase tracking-wider mb-2 sm:mb-3">
            Navegação Principal
          </h2>
        </div>
        
        {navigationItems.map((item) => (
          <NavLink
            key={item.path}
            to={item.path}
            className={({ isActive }) =>
              cn(
                "group flex items-center rounded-xl font-medium transition-all duration-200 relative overflow-hidden",
                isMobile ? "space-x-2 px-3 py-2.5 min-h-[40px]" : "space-x-3 px-4 py-3 min-h-[44px]",
                isActive
                  ? "bg-gradient-to-r from-indigo-600 to-indigo-700 text-white shadow-lg shadow-indigo-500/25"
                  : "text-neutral-600 hover:text-neutral-900 hover:bg-indigo-50 hover:shadow-md"
              )
            }
          >
            {/* Indicador de item ativo */}
            {({ isActive }) => isActive && (
              <div className="absolute left-0 top-0 bottom-0 w-1 bg-white rounded-r-full" />
            )}
            
            <div className={cn(
              "flex items-center justify-center rounded-lg transition-all duration-200",
              isMobile ? "w-7 h-7" : "w-8 h-8",
              location.pathname === item.path
                ? "bg-white/20 text-white"
                : "bg-neutral-100 text-neutral-600 group-hover:bg-indigo-100 group-hover:text-indigo-600"
            )}>
              <item.icon className={`${isMobile ? 'w-3.5 h-3.5' : 'w-4 h-4'}`} />
            </div>
            
            <div className="flex-1 min-w-0">
              <div className={`${isMobile ? 'text-sm' : 'font-medium'}`}>{item.label}</div>
              {!isMobile && (
                <div className={cn(
                  "text-xs transition-colors duration-200",
                  location.pathname === item.path
                    ? "text-white/80"
                    : "text-neutral-400 group-hover:text-neutral-600"
                )}>
                  {item.description}
                </div>
              )}
            </div>
          </NavLink>
        ))}
      </nav>

      {/* Seção de Ferramentas - Responsiva */}
      <div className={`${isMobile ? 'p-4' : 'p-6'} border-t border-neutral-200 bg-gradient-to-br from-neutral-50 to-neutral-100`}>
        <div className={`${isMobile ? 'mb-2' : 'mb-3'}`}>
          <h3 className={`${isMobile ? 'text-xs' : 'text-xs'} font-semibold text-neutral-500 uppercase tracking-wider ${isMobile ? 'mb-2' : 'mb-3'}`}>
            Ferramentas
          </h3>
        </div>
        
        <div className="space-y-2">
          <NavLink
            to="/configuracoes"
            className={({ isActive }) =>
              cn(
                "group flex items-center rounded-xl font-medium transition-all duration-200",
                isMobile ? "space-x-2 px-3 py-2.5" : "space-x-3 px-4 py-3",
                isActive
                  ? "bg-gradient-to-r from-indigo-600 to-indigo-700 text-white shadow-lg shadow-indigo-500/25"
                  : "text-neutral-600 hover:text-neutral-900 hover:bg-indigo-50 transition-all duration-200"
              )
            }
          >
            <div className={cn(
              "flex items-center justify-center rounded-lg transition-all duration-200",
              isMobile ? "w-7 h-7" : "w-8 h-8",
              location.pathname === "/configuracoes"
                ? "bg-white/20 text-white"
                : "bg-neutral-200 text-neutral-600 group-hover:bg-indigo-100 group-hover:text-indigo-600"
            )}>
              <Settings className={`${isMobile ? 'w-3.5 h-3.5' : 'w-4 h-4'}`} />
            </div>
            <span className={`${isMobile ? 'text-sm' : 'text-sm'}`}>Configurações do Sistema</span>
          </NavLink>
        </div>
      </div>

      {/* Footer do Sidebar - Responsivo */}
      <div className={`${isMobile ? 'p-3' : 'p-4'} border-t border-neutral-200 bg-gradient-to-br from-neutral-100 to-neutral-200`}>
        <div className="text-center">
          <p className={`${isMobile ? 'text-xs' : 'text-xs'} text-neutral-500 ${isMobile ? 'mb-0.5' : 'mb-1'}`}>Versão 2.0.0</p>
          <p className={`${isMobile ? 'text-xs' : 'text-xs'} text-neutral-400`}>© 2024 Flexi Gestor</p>
        </div>
      </div>
    </div>
  );
};