import { 
  Menu, 
  Bell, 
  User, 
  Settings, 
  Palette, 
  X,
  LogOut,
  Shield
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
import { useFirebaseAuth } from "@/contexts/FirebaseAuthContext";
import { useResponsive } from "@/hooks/use-responsive";
import { useNavigate } from "react-router-dom";

export const Header = () => {
  const { 
    notifications, 
    markNotificationAsRead, 
    removeNotification, 
    clearAllNotifications,
    addNotification 
  } = useData();
  
  const { user, logout } = useFirebaseAuth();
  const navigate = useNavigate();

  // Hook para responsividade
  const { isMobile, isTablet, screenWidth } = useResponsive();
  

  // Calcular notificações não lidas
  const unreadCount = notifications.filter(n => !n.read).length;

  return (
    <header className="fixed top-0 left-0 right-0 z-50 bg-white/95 backdrop-blur-md border-b border-neutral-200 shadow-lg">
      <div className={`flex items-center justify-between px-1 sm:px-2 md:px-4 lg:px-6 py-2 sm:py-3 md:py-4 ${isMobile ? 'gap-1' : 'gap-2 sm:gap-4'}`}>
        {/* Logo e Navegação */}
        <div className="flex items-center space-x-1 sm:space-x-2 md:space-x-3 lg:space-x-4">
          {/* Menu Burger - Sempre visível */}
          <Sheet>
            <SheetTrigger asChild>
              <Button 
                variant="ghost" 
                size="sm" 
                className="p-1 sm:p-1.5 md:p-2 hover:bg-indigo-50 rounded-lg sm:rounded-xl border border-neutral-200 hover:border-indigo-300 transition-all duration-200"
              >
                <Menu className="h-4 w-4 sm:h-5 sm:w-5 text-indigo-600" />
              </Button>
            </SheetTrigger>
            <SheetContent side="left" className={`${isMobile ? 'w-full max-w-sm' : 'w-80'} p-0`}>
              <Sidebar />
            </SheetContent>
          </Sheet>
          
          {/* Logo */}
          <div className="flex items-center space-x-1 sm:space-x-2 md:space-x-3">
            <div className="w-8 h-8 sm:w-9 sm:h-9 md:w-10 md:h-10 bg-gradient-to-br from-indigo-600 to-indigo-700 rounded-lg sm:rounded-xl flex items-center justify-center shadow-lg">
              <span className="text-sm sm:text-base md:text-lg text-white font-bold">FG</span>
            </div>
            <div className="hidden xs:block">
              <h1 className="text-sm sm:text-base md:text-lg lg:text-xl font-bold text-neutral-900">Flexi Gestor</h1>
              <p className="text-xs sm:text-sm text-neutral-500">Sistema de Gestão Empresarial</p>
            </div>
          </div>
        </div>

        {/* Ações do Usuário */}
        <div className="flex items-center space-x-1 sm:space-x-2 md:space-x-3">
          {/* Notificações */}
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="ghost" size="sm" className="relative p-1 sm:p-1.5 md:p-2 hover:bg-indigo-50 rounded-lg sm:rounded-xl transition-all duration-200">
                <Bell className="h-4 w-4 sm:h-5 sm:w-5 text-neutral-600" />
                {unreadCount > 0 && (
                  <Badge className="absolute -top-0.5 -right-0.5 sm:-top-1 sm:-right-1 h-4 w-4 sm:h-5 sm:w-5 rounded-full p-0 flex items-center justify-center text-xs bg-red-500 text-white">
                    {unreadCount > 9 ? '9+' : unreadCount}
                  </Badge>
                )}
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" className={`${isMobile ? 'w-72' : 'w-80'} p-0 rounded-2xl border-0 shadow-xl`}>
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
              <Button variant="ghost" className="flex items-center space-x-1 sm:space-x-2 p-1 sm:p-1.5 md:p-2 hover:bg-indigo-50 rounded-lg sm:rounded-xl transition-all duration-200">
                <div className="w-7 h-7 sm:w-8 sm:h-8 bg-gradient-to-br from-indigo-600 to-indigo-700 rounded-full flex items-center justify-center">
                  <User className="h-3 w-3 sm:h-4 sm:w-4 text-white" />
                </div>
                <div className="hidden xs:block text-left">
                  <p className="text-xs sm:text-sm font-medium text-neutral-900">
                    {user?.username || user?.name || 'Usuário'}
                  </p>
                  <p className="text-xs text-neutral-500">
                    {user?.email || 'email@exemplo.com'}
                  </p>
                </div>
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" className="w-64 rounded-2xl border-0 shadow-xl">
              {/* Informações do Usuário */}
              <div className="px-3 py-2 border-b border-gray-100">
                <div className="flex items-center space-x-3">
                  <div className="w-10 h-10 bg-gradient-to-br from-indigo-600 to-indigo-700 rounded-full flex items-center justify-center">
                    <span className="text-white text-sm font-bold">
                      {user?.avatar || '👤'}
                    </span>
                  </div>
                  <div>
                    <p className="text-sm font-medium text-gray-900">{user?.username || user?.name}</p>
                    <p className="text-xs text-gray-500">{user?.email}</p>
                    <div className="flex items-center gap-1 mt-1">
                      <Shield className="w-3 h-3 text-indigo-600" />
                      <span className="text-xs text-indigo-600 font-medium">
                        {user?.role === 'admin' ? 'Administrador' : 'Usuário'}
                      </span>
                    </div>
                  </div>
                </div>
              </div>
              
              {/* Opções do Menu */}
              <div className="py-1">
                <DropdownMenuItem 
                  className="flex items-center gap-2 px-3 py-2 cursor-pointer hover:bg-indigo-50"
                  onClick={() => navigate('/perfil')}
                >
                  <User className="w-4 h-4 text-indigo-600" />
                  <span className="text-sm">Meu Perfil</span>
                </DropdownMenuItem>
                
                <DropdownMenuItem 
                  className="flex items-center gap-2 px-3 py-2 cursor-pointer hover:bg-indigo-50"
                  onClick={() => navigate('/configuracoes')}
                >
                  <Settings className="w-4 h-4 text-indigo-600" />
                  <span className="text-sm">Configurações</span>
                </DropdownMenuItem>
                
                <DropdownMenuItem 
                  className="flex items-center gap-2 px-3 py-2 cursor-pointer hover:bg-indigo-50"
                  onClick={() => navigate('/alterar-senha')}
                >
                  <Shield className="w-4 h-4 text-indigo-600" />
                  <span className="text-sm">Alterar Senha</span>
                </DropdownMenuItem>
              </div>
              
              {/* Separador */}
              <div className="border-t border-gray-100 my-1" />
              
              {/* Logout */}
              <DropdownMenuItem 
                className="flex items-center space-x-2 p-3 hover:bg-red-50 rounded-lg text-red-600 hover:text-red-700"
                onClick={logout}
              >
                <LogOut className="h-4 w-4" />
                <span>Sair</span>
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      </div>
      
      {/* Barra de Busca Mobile - Aparece quando showSearch é true */}
      {isMobile && showSearch && (
        <div className="px-2 xs:px-4 pb-3 border-b border-neutral-200 bg-white/95 backdrop-blur-md">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-neutral-400 w-4 h-4" />
            <Input
              type="text"
              placeholder="🔍 Buscar produtos, entradas, saídas..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pl-10 pr-4 py-2 bg-neutral-50 border-2 border-neutral-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 transition-all duration-200"
              autoFocus
            />
          </div>
        </div>
      )}
    </header>
  );
};