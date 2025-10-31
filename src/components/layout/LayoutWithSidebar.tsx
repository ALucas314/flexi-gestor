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
  const { isMobile, isTablet, screenWidth } = useResponsive();
  
  // Mostrar sidebar fixa se:
  // - Estiver pinada pelo usuário
  // - Não for mobile ou tablet pequeno (< 768px)
  // Se a tela for menor que 1024px, usar largura menor para evitar problemas
  const showFixedSidebar = isPinned && !isMobile && screenWidth >= 768;
  
  // Largura da sidebar baseada no tamanho da tela
  const sidebarWidth = screenWidth >= 1280 ? 'w-80' : screenWidth >= 1024 ? 'w-72' : 'w-64';
  const marginLeft = screenWidth >= 1280 ? 'ml-80' : screenWidth >= 1024 ? 'ml-72' : 'ml-64';

  return (
    <div className="min-h-screen bg-background w-full overflow-x-hidden max-w-full">
      {/* Sidebar Fixa (aparece quando pinada e não for mobile) */}
      {showFixedSidebar && (
        <aside className={`fixed left-0 top-0 h-screen z-40 ${sidebarWidth} overflow-y-auto overflow-x-hidden bg-gradient-to-br from-indigo-50 via-indigo-100 to-indigo-100 shadow-xl`}>
          <Sidebar variant="fixed" />
        </aside>
      )}
      
      {/* Conteúdo Principal */}
      <div className={`min-h-screen transition-all duration-300 max-w-full ${showFixedSidebar ? marginLeft : 'ml-0'}`}>
        <Header />
        <main className="pt-16 sm:pt-20 max-w-full overflow-x-hidden">
          <div className="w-full max-w-full">
            {children}
          </div>
        </main>
      </div>
    </div>
  );
};

