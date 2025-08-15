import { 
  Home, 
  Package, 
  ShoppingCart, 
  TrendingUp, 
  TrendingDown, 
  FileText, 
  Settings,
  BarChart3
} from "lucide-react";
import { cn } from "@/lib/utils";

interface SidebarProps {
  className?: string;
}

const navigationItems = [
  { icon: Home, label: "Dashboard", href: "/", active: true },
  { icon: Package, label: "Produtos", href: "/produtos" },
  { icon: TrendingUp, label: "Entradas", href: "/entradas" },
  { icon: TrendingDown, label: "Saídas", href: "/saidas" },
  { icon: BarChart3, label: "Movimentações", href: "/movimentacoes" },
  { icon: FileText, label: "Relatórios", href: "/relatorios" },
  { icon: Settings, label: "Configurações", href: "/configuracoes" },
];

export const Sidebar = ({ className }: SidebarProps) => {
  return (
    <div className={cn(
      "hidden md:flex flex-col w-64 bg-card border-r border-border h-screen",
      className
    )}>
      {/* Logo */}
      <div className="p-6 border-b border-border">
        <h1 className="text-2xl font-bold bg-gradient-primary bg-clip-text text-transparent">
          FlexiGestor
        </h1>
        <p className="text-sm text-muted-foreground mt-1">
          Sistema de Gestão
        </p>
      </div>

      {/* Navigation */}
      <nav className="flex-1 p-4 space-y-2">
        {navigationItems.map((item) => {
          const Icon = item.icon;
          return (
            <a
              key={item.href}
              href={item.href}
              className={cn(
                "flex items-center gap-3 px-3 py-2 rounded-lg text-sm font-medium transition-colors",
                item.active
                  ? "bg-gradient-primary text-primary-foreground shadow-card"
                  : "text-muted-foreground hover:text-foreground hover:bg-accent"
              )}
            >
              <Icon className="w-5 h-5" />
              {item.label}
            </a>
          );
        })}
      </nav>

      {/* Footer */}
      <div className="p-4 border-t border-border">
        <div className="bg-gradient-card rounded-lg p-4">
          <h3 className="font-semibold text-sm text-foreground">
            Versão 1.0
          </h3>
          <p className="text-xs text-muted-foreground mt-1">
            Sistema completo de gestão empresarial
          </p>
        </div>
      </div>
    </div>
  );
};