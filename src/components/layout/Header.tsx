import { 
  Menu, 
  Bell, 
  User, 
  Settings, 
  Palette, 
  X 
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { 
  DropdownMenu, 
  DropdownMenuContent, 
  DropdownMenuItem, 
  DropdownMenuTrigger 
} from "@/components/ui/dropdown-menu";
import { Sheet, SheetContent, SheetTrigger } from "@/components/ui/sheet";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Sidebar } from "./Sidebar";
import { useState, useEffect } from "react";
import { useData } from "@/contexts/DataContext";

export const Header = () => {
  const { 
    notifications, 
    markNotificationAsRead, 
    removeNotification, 
    clearAllNotifications,
    addNotification 
  } = useData();

  // Calcular notificações não lidas
  const unreadCount = notifications.filter(n => !n.read).length;

  return (
    <header className="fixed top-0 left-0 right-0 z-50 bg-white/95 backdrop-blur-md border-b border-neutral-200 shadow-lg">
      <div className="flex items-center justify-between px-4 md:px-6 py-4">
        {/* Logo e Navegação */}
        <div className="flex items-center space-x-3 md:space-x-4">
          {/* Menu Burger - Sempre visível */}
          <Sheet>
            <SheetTrigger asChild>
              <Button 
                variant="ghost" 
                size="sm" 
                className="p-2 hover:bg-indigo-50 rounded-xl border border-neutral-200 hover:border-indigo-300 transition-all duration-200"
              >
                <Menu className="h-5 w-5 text-indigo-600" />
              </Button>
            </SheetTrigger>
            <SheetContent side="left" className="w-80 p-0">
              <Sidebar />
            </SheetContent>
          </Sheet>
          
          {/* Logo */}
          <div className="flex items-center space-x-3">
            <div className="w-10 h-10 bg-gradient-to-br from-indigo-600 to-indigo-700 rounded-xl flex items-center justify-center shadow-lg">
              <span className="text-white font-bold text-lg">FG</span>
            </div>
            <div className="hidden md:block">
              <h1 className="text-xl font-bold text-neutral-900">Flexi Gestor</h1>
              <p className="text-xs text-neutral-500">Sistema de Gestão Empresarial</p>
            </div>
          </div>
        </div>

        {/* Barra de Busca Central */}
        {/* <div className="hidden lg:flex flex-1 max-w-md mx-8">
          <div className="relative w-full">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-neutral-400 w-4 h-4" />
            <input
              type="text"
              placeholder="🔍 Buscar produtos, entradas, saídas..."
              className="w-full pl-10 pr-4 py-3 bg-neutral-50 border-2 border-neutral-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 transition-all duration-200"
            />
          </div>
        </div> */}

        {/* Ações do Usuário */}
        <div className="flex items-center space-x-2 md:space-x-3">
          {/* Notificações */}
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="ghost" size="sm" className="relative p-2 hover:bg-indigo-50 rounded-xl transition-all duration-200">
                <Bell className="h-5 w-5 text-neutral-600" />
                {unreadCount > 0 && (
                  <Badge className="absolute -top-1 -right-1 h-5 w-5 rounded-full p-0 flex items-center justify-center text-xs bg-red-500 text-white">
                    {unreadCount > 9 ? '9+' : unreadCount}
                  </Badge>
                )}
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" className="w-80 p-0 rounded-2xl border-0 shadow-xl">
              <div className="p-6 border-b border-neutral-200">
                <div className="flex items-center justify-between">
                  <h3 className="font-semibold text-neutral-900">Notificações</h3>
                  {unreadCount > 0 && (
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={clearAllNotifications}
                      className="text-xs text-neutral-500 hover:text-neutral-700 hover:bg-neutral-100 rounded-lg"
                    >
                      Limpar todas
                    </Button>
                  )}
                </div>
              </div>
              
              <ScrollArea className="h-80">
                {notifications.length === 0 ? (
                  <div className="p-8 text-center text-neutral-500">
                    <Bell className="h-12 w-12 mx-auto mb-3 text-neutral-300" />
                    <p className="text-sm">Nenhuma notificação</p>
                  </div>
                ) : (
                  <div className="p-2">
                    {notifications.map((notification) => (
                      <div
                        key={notification.id}
                        className={`p-4 rounded-xl mb-2 cursor-pointer transition-all duration-200 ${
                          notification.read 
                            ? 'bg-neutral-50 hover:bg-neutral-100' 
                            : 'bg-indigo-50 hover:bg-indigo-100 border-l-4 border-indigo-500'
                        }`}
                        onClick={() => markNotificationAsRead(notification.id)}
                      >
                        <div className="flex items-start justify-between">
                          <div className="flex-1">
                            <div className="flex items-center space-x-2 mb-2">
                              <span className={`inline-block w-2 h-2 rounded-full ${
                                notification.type === 'success' ? 'bg-blue-500' :
                                notification.type === 'error' ? 'bg-red-500' :
                                notification.type === 'warning' ? 'bg-yellow-500' :
                                'bg-indigo-500'
                              }`} />
                              <h4 className={`text-sm font-medium ${
                                notification.read ? 'text-neutral-700' : 'text-neutral-900'
                              }`}>
                                {notification.title}
                              </h4>
                            </div>
                            <p className={`text-xs ${
                              notification.read ? 'text-neutral-500' : 'text-neutral-600'
                            }`}>
                              {notification.message}
                            </p>
                            <p className="text-xs text-neutral-400 mt-2">
                              {notification.timestamp.toLocaleTimeString('pt-BR', {
                                hour: '2-digit',
                                minute: '2-digit'
                              })}
                            </p>
                          </div>
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={(e) => {
                              e.stopPropagation();
                              removeNotification(notification.id);
                            }}
                            className="p-1 h-6 w-6 text-neutral-400 hover:text-red-500 hover:bg-red-50 rounded-lg"
                          >
                            <X className="h-3 w-3" />
                          </Button>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </ScrollArea>
            </DropdownMenuContent>
          </DropdownMenu>

          {/* Menu do Usuário */}
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="ghost" className="flex items-center space-x-2 p-2 hover:bg-indigo-50 rounded-xl transition-all duration-200">
                <div className="w-8 h-8 bg-gradient-to-br from-indigo-600 to-indigo-700 rounded-full flex items-center justify-center">
                  <User className="h-4 w-4 text-white" />
                </div>
                <div className="hidden md:block text-left">
                  <p className="text-sm font-medium text-neutral-900">Administrador</p>
                  <p className="text-xs text-neutral-500">admin@flexi.com</p>
                </div>
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" className="w-56 rounded-2xl border-0 shadow-xl">
              <DropdownMenuItem className="flex items-center space-x-2 p-3 hover:bg-indigo-50 rounded-lg">
                <User className="h-4 w-4" />
                <span>Perfil</span>
              </DropdownMenuItem>
              <DropdownMenuItem className="flex items-center space-x-2 p-3 hover:bg-indigo-50 rounded-lg">
                <Settings className="h-4 w-4" />
                <span>Configurações</span>
              </DropdownMenuItem>
              <DropdownMenuItem className="flex items-center space-x-2 p-3 hover:bg-indigo-50 rounded-lg">
                <Palette className="h-4 w-4" />
                <span>Personalizar</span>
              </DropdownMenuItem>
              <div className="border-t border-neutral-200 my-1" />
              <DropdownMenuItem className="flex items-center space-x-2 p-3 text-red-600 hover:text-red-700 hover:bg-red-50 rounded-lg">
                <span>Sair</span>
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      </div>
    </header>
  );
};