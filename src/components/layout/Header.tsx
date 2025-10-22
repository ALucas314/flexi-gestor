import { 
  Menu, 
  Bell, 
  User, 
  X,
  LogOut,
  Shield,
  UserCircle
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
import { WorkspaceSelector } from "@/components/WorkspaceSelector";
import { useState, useEffect } from "react";
import { useData } from "@/contexts/DataContext";
import { useAuth } from "@/contexts/AuthContext";
import { useSidebar } from "@/contexts/SidebarContext";
import { useResponsive } from "@/hooks/use-responsive";
import { useNavigate } from "react-router-dom";

export const Header = () => {
  // Todos os hooks devem estar no topo, antes de qualquer lógica condicional
  const { 
    notifications, 
    markNotificationAsRead, 
    removeNotification, 
    clearAllNotifications,
    addNotification 
  } = useData();
  
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const { isPinned, togglePin } = useSidebar();
  const { isMobile, isTablet, screenWidth } = useResponsive();
  const [isSheetOpen, setIsSheetOpen] = useState(false);

  // Mostrar burger apenas se: for mobile OU sidebar não está pinado
  const showBurger = isMobile || isTablet || !isPinned;

  // Calcular notificações não lidas
  const unreadCount = notifications?.filter(n => !n.read).length || 0;

  return (
    <header className="fixed top-0 left-0 right-0 z-50 bg-gradient-to-r from-indigo-50 via-indigo-100/60 to-indigo-100 backdrop-blur-md border-b border-indigo-200 shadow-lg">
      <div className={`flex items-center justify-between ${isMobile ? 'px-3 py-3' : 'px-2 sm:px-4 md:px-6 py-3 sm:py-4'} ${isMobile ? 'gap-2' : 'gap-2 sm:gap-4'}`}>
        {/* Logo e Navegação */}
        <div className={`flex items-center ${isMobile ? 'space-x-2' : 'space-x-2 md:space-x-3 lg:space-x-4'}`}>
          {/* Menu Burger - Visível apenas se não estiver pinado OU for mobile */}
          {showBurger && (
            <Sheet open={isSheetOpen} onOpenChange={setIsSheetOpen}>
              <SheetTrigger asChild>
                <Button 
                  variant="ghost" 
                  size={isMobile ? "default" : "sm"}
                  className={`${isMobile ? 'p-3 h-12 w-12' : 'p-1.5 md:p-2'} hover:bg-indigo-50 rounded-xl transition-all duration-200`}
                >
                  <Menu className={`${isMobile ? 'h-6 w-6' : 'h-5 w-5'} text-indigo-600`} />
                </Button>
              </SheetTrigger>
              <SheetContent 
                side="left" 
                className={`${isMobile ? 'w-full max-w-sm' : 'w-80'} p-0`}
                showPin={!isMobile && !isTablet}
                onPinClick={() => {
                  togglePin();
                  setIsSheetOpen(false);
                }}
              >
                <Sidebar onNavigate={() => setIsSheetOpen(false)} />
              </SheetContent>
            </Sheet>
          )}
          
          {/* Logo */}
          <div className={`flex items-center ${isMobile ? 'space-x-2' : 'space-x-2 md:space-x-3'}`}>
            <div className={`${isMobile ? 'w-10 h-10' : 'w-9 h-9 md:w-10 md:h-10'} bg-gradient-to-br from-indigo-600 to-indigo-700 rounded-xl flex items-center justify-center shadow-lg`}>
              <span className={`${isMobile ? 'text-base' : 'text-sm md:text-lg'} text-white font-bold`}>FG</span>
            </div>
            <div className="hidden xs:block">
              <h1 className={`${isMobile ? 'text-base' : 'text-sm md:text-lg lg:text-xl'} font-bold text-neutral-900`}>Flexi Gestor</h1>
              <p className={`${isMobile ? 'text-xs' : 'text-xs sm:text-sm'} text-neutral-500`}>Sistema de Gestão</p>
            </div>
          </div>
        </div>

        {/* Ações do Usuário */}
        <div className={`flex items-center ${isMobile ? 'space-x-2' : 'space-x-2 md:space-x-3'}`}>
          {/* Notificações */}
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button 
                variant="ghost" 
                size={isMobile ? "default" : "sm"}
                className={`relative ${isMobile ? 'p-3 h-12 w-12' : 'p-1.5 md:p-2'} hover:bg-indigo-50 rounded-xl transition-all duration-200`}
              >
                <Bell className={`${isMobile ? 'h-6 w-6' : 'h-5 w-5'} ${unreadCount > 0 ? 'text-red-600' : 'text-neutral-600'}`} />
                {unreadCount > 0 && (
                  <Badge className={`absolute ${isMobile ? '-top-1 -right-1 h-6 w-6 text-xs' : '-top-1 -right-1 h-5 w-5 text-xs'} rounded-full p-0 flex items-center justify-center bg-red-500 text-white font-bold shadow-lg`}>
                    {unreadCount > 9 ? '9+' : unreadCount}
                  </Badge>
                )}
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align={isMobile ? "center" : "end"} className={`${isMobile ? 'w-[calc(100vw-2rem)] max-w-md mx-4' : 'w-96'} p-0 rounded-2xl border border-gray-200/50 shadow-2xl bg-white/95 backdrop-blur-lg`}>
              <div className={`${isMobile ? 'p-4' : 'p-6'} border-b border-neutral-200 bg-gradient-to-r from-indigo-50 to-purple-50`}>
                <div className="flex items-center justify-between">
                  <div className="flex items-center space-x-2">
                    <div className="w-10 h-10 bg-gradient-to-br from-indigo-600 to-purple-600 rounded-xl flex items-center justify-center">
                      <Bell className="h-5 w-5 text-white" />
                    </div>
                    <div>
                      <h3 className="font-bold text-gray-900">Notificações</h3>
                      <p className="text-xs text-gray-600">
                        {unreadCount > 0 ? `${unreadCount} não lida${unreadCount > 1 ? 's' : ''}` : 'Todas lidas'}
                      </p>
                    </div>
                  </div>
                  {notifications.length > 0 && (
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={clearAllNotifications}
                      className={`${isMobile ? 'text-xs px-3 py-2' : 'text-xs'} text-red-600 hover:text-red-700 hover:bg-red-100 rounded-lg font-semibold`}
                    >
                      🗑️ Limpar
                    </Button>
                  )}
                </div>
              </div>
              
              <ScrollArea className={`${isMobile ? 'h-72' : 'h-96'}`}>
                {notifications.length === 0 ? (
                  <div className="p-8 text-center text-neutral-500">
                    <Bell className="h-12 w-12 mx-auto mb-3 text-neutral-300" />
                    <p className="text-sm">Nenhuma notificação</p>
                  </div>
                ) : (
                  <div className={`${isMobile ? 'p-2' : 'p-3'}`}>
                    {notifications.map((notification) => (
                      <div
                        key={notification.id}
                        className={`${isMobile ? 'p-3 mb-2' : 'p-4 mb-2'} rounded-xl cursor-pointer transition-all duration-200 ${
                          notification.read 
                            ? 'bg-neutral-50 hover:bg-neutral-100 border border-neutral-200' 
                            : 'bg-gradient-to-r from-indigo-50 to-purple-50 hover:from-indigo-100 hover:to-purple-100 border-l-4 border-indigo-500 shadow-sm'
                        }`}
                        onClick={() => markNotificationAsRead(notification.id)}
                      >
                        <div className="flex items-start justify-between gap-3">
                          <div className="flex-1 min-w-0">
                            <div className="flex items-center space-x-2 mb-2">
                              <div className={`w-2 h-2 rounded-full flex-shrink-0 ${
                                notification.type === 'success' ? 'bg-green-500' :
                                notification.type === 'error' ? 'bg-red-500' :
                                notification.type === 'warning' ? 'bg-yellow-500' :
                                'bg-blue-500'
                              }`} />
                              <h4 className={`${isMobile ? 'text-sm' : 'text-sm'} font-semibold ${
                                notification.read ? 'text-neutral-700' : 'text-neutral-900'
                              } truncate`}>
                                {notification.title}
                              </h4>
                            </div>
                            <p className={`${isMobile ? 'text-xs' : 'text-sm'} ${
                              notification.read ? 'text-neutral-500' : 'text-neutral-700'
                            } line-clamp-2`}>
                              {notification.message}
                            </p>
                            <p className={`${isMobile ? 'text-xs' : 'text-xs'} text-neutral-400 mt-2 flex items-center space-x-1`}>
                              <span>🕐</span>
                              <span>
                                {notification.timestamp.toLocaleTimeString('pt-BR', {
                                  hour: '2-digit',
                                  minute: '2-digit'
                                })}
                              </span>
                            </p>
                          </div>
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={(e) => {
                              e.stopPropagation();
                              removeNotification(notification.id);
                            }}
                            className={`${isMobile ? 'p-2 h-8 w-8' : 'p-1.5 h-7 w-7'} flex-shrink-0 text-neutral-400 hover:text-red-600 hover:bg-red-100 rounded-lg transition-all`}
                          >
                            <X className={`${isMobile ? 'h-4 w-4' : 'h-3.5 w-3.5'}`} />
                          </Button>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </ScrollArea>
            </DropdownMenuContent>
          </DropdownMenu>

          {/* 🏢 Seletor de Workspace */}
          <WorkspaceSelector />

          {/* Menu do Usuário */}
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button 
                variant="ghost" 
                className={`flex items-center ${isMobile ? 'p-3 h-12 space-x-2' : 'space-x-2 p-1.5 md:p-2'} hover:bg-indigo-50 rounded-xl transition-all duration-200`}
              >
                <div className={`${isMobile ? 'w-9 h-9' : 'w-8 h-8'} bg-gradient-to-br from-indigo-600 to-indigo-700 rounded-full flex items-center justify-center shadow-md`}>
                  <User className={`${isMobile ? 'h-5 w-5' : 'h-4 w-4'} text-white`} />
                </div>
                {!isMobile && (
                  <div className="hidden xs:block text-left">
                    <p className="text-xs sm:text-sm font-medium text-neutral-900">
                      {user?.username || user?.name || 'Usuário'}
                    </p>
                    <p className="text-xs text-neutral-500">
                      {user?.email || 'email@exemplo.com'}
                    </p>
                  </div>
                )}
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align={isMobile ? "center" : "end"} className={`${isMobile ? 'w-[calc(100vw-2rem)] max-w-sm mx-4' : 'w-72 sm:w-80'} rounded-2xl border border-gray-200/50 shadow-2xl bg-white/95 backdrop-blur-lg p-2`}>
              {/* Informações do Usuário */}
              <div className="px-4 py-4 border-b border-gray-200/50 bg-gradient-to-br from-indigo-50/50 to-purple-50/50 rounded-xl mb-2">
                <div className="flex items-center space-x-3">
                  <div className="relative">
                    <div className="w-12 h-12 bg-gradient-to-br from-indigo-600 via-indigo-600 to-purple-600 rounded-full flex items-center justify-center shadow-lg ring-2 ring-white">
                      <UserCircle className="w-8 h-8 text-white" />
                    </div>
                    <div className="absolute -bottom-0.5 -right-0.5 w-4 h-4 bg-green-500 border-2 border-white rounded-full"></div>
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-semibold text-gray-900 truncate">{user?.username || user?.name}</p>
                    <p className="text-xs text-gray-600 truncate">{user?.email}</p>
                    <div className="flex items-center gap-1.5 mt-1.5">
                      <Shield className="w-3.5 h-3.5 text-indigo-600" />
                      <span className="text-xs text-indigo-600 font-medium">
                        {user?.role === 'admin' ? '✨ Administrador' : '👤 Usuário'}
                      </span>
                    </div>
                  </div>
                </div>
              </div>
              
              {/* Opções do Menu */}
              <div className="py-2 space-y-1">
                <DropdownMenuItem 
                  className="flex items-center gap-3 px-4 py-3 cursor-pointer hover:bg-gradient-to-r hover:from-indigo-50 hover:to-indigo-100/50 rounded-xl transition-all duration-200 group"
                  onClick={() => navigate('/perfil')}
                >
                  <div className="w-9 h-9 bg-indigo-100 rounded-lg flex items-center justify-center group-hover:bg-indigo-200 group-hover:scale-110 transition-all duration-200">
                    <User className="w-4 h-4 text-indigo-600" />
                  </div>
                  <div className="flex-1">
                    <span className="text-sm font-medium text-gray-900">Meu Perfil</span>
                    <p className="text-xs text-gray-500">Gerencie suas informações</p>
                  </div>
                </DropdownMenuItem>
                
                <DropdownMenuItem 
                  className="flex items-center gap-3 px-4 py-3 cursor-pointer hover:bg-gradient-to-r hover:from-purple-50 hover:to-purple-100/50 rounded-xl transition-all duration-200 group"
                  onClick={() => navigate('/alterar-senha')}
                >
                  <div className="w-9 h-9 bg-purple-100 rounded-lg flex items-center justify-center group-hover:bg-purple-200 group-hover:scale-110 transition-all duration-200">
                    <Shield className="w-4 h-4 text-purple-600" />
                  </div>
                  <div className="flex-1">
                    <span className="text-sm font-medium text-gray-900">Alterar Senha</span>
                    <p className="text-xs text-gray-500">Segurança da conta</p>
                  </div>
                </DropdownMenuItem>
              </div>
              
              {/* Separador com gradiente */}
              <div className="h-px bg-gradient-to-r from-transparent via-gray-300 to-transparent my-2" />
              
              {/* Logout com destaque */}
              <DropdownMenuItem 
                className="flex items-center gap-3 px-4 py-3 mx-1 cursor-pointer bg-gradient-to-r from-red-50 to-red-100/50 hover:from-red-100 hover:to-red-200/50 rounded-xl text-red-600 hover:text-red-700 transition-all duration-200 group mb-1"
                onClick={logout}
              >
                <div className="w-9 h-9 bg-red-200/50 rounded-lg flex items-center justify-center group-hover:bg-red-300/50 group-hover:scale-110 transition-all duration-200">
                  <LogOut className="h-4 w-4" />
                </div>
                <div className="flex-1">
                  <span className="text-sm font-semibold">Sair da Conta</span>
                  <p className="text-xs text-red-500">Encerrar sessão</p>
                </div>
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      </div>
    </header>
  );
};