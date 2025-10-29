// 📌 Contexto para controlar o estado da Sidebar
// Permite alternar entre modo overlay e modo pinado (fixo ao lado)

import React, { createContext, useContext, useState, useEffect } from 'react';

interface SidebarContextType {
  isPinned: boolean;
  togglePin: () => void;
}

const SidebarContext = createContext<SidebarContextType | undefined>(undefined);

export const SidebarProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  // Carregar preferência do localStorage
  const [isPinned, setIsPinned] = useState(() => {
    const saved = localStorage.getItem('sidebar-pinned');
    return saved === 'true';
  });

  // Salvar preferência quando mudar
  useEffect(() => {
    localStorage.setItem('sidebar-pinned', String(isPinned));
  }, [isPinned]);

  const togglePin = () => {
    setIsPinned(prev => !prev);
  };

  return (
    <SidebarContext.Provider value={{ isPinned, togglePin }}>
      {children}
    </SidebarContext.Provider>
  );
};

export const useSidebar = () => {
  const context = useContext(SidebarContext);
  if (!context) {
    throw new Error('useSidebar must be used within SidebarProvider');
  }
  return context;
};

