// 📐 Layout com Sidebar Responsiva
// Gerencia a exibição da sidebar no modo pinado (desktop) ou overlay (mobile)

import { ReactNode } from "react";
import { Header } from "./Header";
import { Sidebar } from "./Sidebar";
import { useSidebar } from "@/contexts/SidebarContext";
import { useResponsive } from "@/hooks/use-responsive";

interface LayoutWithSidebarProps {
  children: ReactNode;
}

export const LayoutWithSidebar = ({ children }: LayoutWithSidebarProps) => {
  const { isPinned } = useSidebar();
  const { isMobile, isTablet } = useResponsive();
  
  // No mobile/tablet, não mostra sidebar fixa
  const showFixedSidebar = isPinned && !isMobile && !isTablet;

  return (
    <div className="min-h-screen bg-background w-full overflow-x-hidden">
      {/* Sidebar Fixa (só aparece no desktop quando pinada) */}
      {showFixedSidebar && (
        <aside className="fixed left-0 top-0 h-screen z-40 w-80 overflow-y-auto">
          <Sidebar />
        </aside>
      )}
      
      {/* Conteúdo Principal */}
      <div className={`min-h-screen transition-all duration-300 ${showFixedSidebar ? 'ml-80' : 'ml-0'}`}>
        <Header />
        <main className="pt-16 sm:pt-20">
          {children}
        </main>
      </div>
    </div>
  );
};

