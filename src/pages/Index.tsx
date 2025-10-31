import { Package, DollarSign, TrendingUp, AlertTriangle, BarChart3, Users, ShoppingCart, ArrowRight, Eye, EyeOff, TrendingDown, Bell, Clock, Activity, Info, CheckCircle, AlertCircle, XCircle } from "lucide-react";
import { Button } from "@/components/ui/button";
import { StatsCard } from "@/components/dashboard/StatsCard";
import { RecentMovements } from "@/components/dashboard/RecentMovements";
import { QuickActions } from "@/components/dashboard/QuickActions";
import { SalesChart } from "@/components/dashboard/SalesChart";
import { ProductsChart } from "@/components/dashboard/ProductsChart";
import { PurchasesSalesDiffChart } from "@/components/dashboard/PurchasesSalesDiffChart";
import { ItemsRankingChart } from "@/components/dashboard/ItemsRankingChart";
import { useData } from "@/contexts/DataContext";
import { useResponsive } from "@/hooks/use-responsive";
import { useNavigate } from "react-router-dom";
import { useConfig } from "@/contexts/ConfigContext";
import { useSidebar } from "@/contexts/SidebarContext";
import React from "react";

const Index = () => {
  const { getDashboardStats, movements, products, notifications } = useData();
  const { formatarMoeda, traduzir, converterMoeda, moeda } = useConfig();
  
  // Debug: verificar valor de stockValue
  React.useEffect(() => {
    const stats = getDashboardStats();
    console.log('🔍 Stock Value em BRL:', stats.stockValue);
    console.log('🔍 Convertido para USD:', converterMoeda(stats.stockValue));
  }, [products, movements, moeda, getDashboardStats, converterMoeda]);
  
  // Obter símbolo da moeda
  const getSimboloMoeda = () => {
    const simbolos: Record<string, string> = {
      'BRL': 'R$',
      'USD': '$',
      'EUR': '€',
      'GBP': '£',
      'JPY': '¥',
      'CAD': 'C$',
      'AUD': 'A$',
      'CHF': 'CHF',
    };
    return simbolos[moeda] || moeda;
  };
  const { isMobile, isTablet, screenWidth } = useResponsive();
  const { isPinned } = useSidebar();
  const navigate = useNavigate();
  const [stats, setStats] = React.useState(getDashboardStats());
  const [showQuickActions, setShowQuickActions] = React.useState(() => {
    const saved = localStorage.getItem('flexi-gestor-show-quick-actions');
    return saved !== null ? JSON.parse(saved) : true;
  });

  // Pegar última notificação
  const lastNotification = React.useMemo(() => {
    const sorted = [...notifications].sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime());
    return sorted[0] || null;
  }, [notifications]);

  // Quantidade de vendas (saídas) realizadas hoje
  const todaySalesCount = React.useMemo(() => {
    const todayStr = new Date().toDateString();
    return movements.filter(m => {
      try {
        const d = new Date(m.date);
        return m.type === 'saida' && d.toDateString() === todayStr;
      } catch {
        return false;
      }
    }).length;
  }, [movements]);

  // Verificar se há produtos cadastrados
  const hasProducts = products.length > 0;

  // Salvar preferência de exibição das Ações Rápidas
  React.useEffect(() => {
    localStorage.setItem('flexi-gestor-show-quick-actions', JSON.stringify(showQuickActions));
  }, [showQuickActions]);

  // Pegar movimentações mais recentes (apenas entradas e saídas)
  const recentMovements = movements
    .filter(m => m.type === 'entrada' || m.type === 'saida') // Filtrar apenas entradas e saídas
    .sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime())
    .slice(0, 4);

  // Atualizar estatísticas em tempo real quando products ou movements mudarem
  React.useEffect(() => {
    const newStats = getDashboardStats();
    setStats(newStats);
  }, [products, movements, getDashboardStats]);

  return (
    <main className={`flex-1 ${isMobile ? 'p-2 xs:p-3' : 'p-3 sm:p-6'} ${isMobile ? 'space-y-4' : 'space-y-6 sm:space-y-10'} bg-gradient-to-br from-slate-50 via-blue-50 to-indigo-50 min-h-screen`}>
      {/* Hero Section com Design Profissional e Informações Detalhadas - Responsivo */}
      <div className={`relative ${isMobile ? 'rounded-xl mt-6' : 'rounded-2xl sm:rounded-3xl mt-0'} overflow-hidden bg-gradient-to-br from-blue-300 via-indigo-400 via-purple-400 to-pink-300 text-slate-800 ${isMobile ? 'shadow-lg' : 'shadow-xl sm:shadow-2xl'} border border-slate-200/50`}>
        {/* Padrão geométrico moderno */}
        <div className="absolute inset-0 opacity-10">
          <div className="absolute inset-0 bg-[radial-gradient(circle_at_20%_80%,rgba(120,119,198,0.3)_0%,transparent_50%)]"></div>
          <div className="absolute inset-0 bg-[radial-gradient(circle_at_80%_20%,rgba(255,119,198,0.3)_0%,transparent_50%)]"></div>
          <div className="absolute inset-0 bg-[radial-gradient(circle_at_40%_40%,rgba(120,198,255,0.2)_0%,transparent_50%)]"></div>
        </div>
        <div className="absolute inset-0 bg-gradient-to-r from-blue-200/50 via-purple-200/40 to-pink-200/50" />
        
        <div className={`relative ${isMobile ? 'p-3 xs:p-4' : 'p-4 sm:p-8 md:p-12'}`}>
          <div className="max-w-7xl mx-auto space-y-6">
            {/* Header */}
            <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4">
              <div className="flex-1">
                <h1 className={`${isMobile ? 'text-2xl xs:text-3xl' : 'text-3xl sm:text-4xl md:text-5xl lg:text-6xl'} font-black ${isMobile ? 'mb-2' : 'mb-3 sm:mb-4'} tracking-tight bg-gradient-to-r from-slate-800 via-blue-700 to-purple-700 bg-clip-text text-transparent`}>
                  🚀 Flexi Gestor
                </h1>
                <p className={`${isMobile ? 'text-sm xs:text-base' : 'text-base sm:text-lg md:text-xl lg:text-2xl'} opacity-90 max-w-3xl leading-relaxed font-medium text-slate-700`}>
                  {traduzir('Sistema completo de gestão empresarial para controlar estoque, vendas e finanças com precisão e eficiência')}
                </p>
              </div>
            </div>

            {/* Cards de Informações Detalhadas */}
            <div className={`grid ${isMobile ? 'grid-cols-1' : 'grid-cols-2 lg:grid-cols-3'} gap-3 sm:gap-4`}>
              {/* Card: Total de Movimentações */}
              <div className={`relative bg-white/30 backdrop-blur-md ${isMobile ? 'rounded-lg p-3' : 'rounded-xl p-4 sm:p-5'} border border-white/40 shadow-lg hover:shadow-xl transition-all duration-300 hover:scale-[1.02] group`}>
                <div className="flex items-start justify-between gap-3">
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 mb-2">
                      <div className={`${isMobile ? 'w-8 h-8' : 'w-10 h-10'} bg-gradient-to-br from-blue-500 to-blue-600 ${isMobile ? 'rounded-lg' : 'rounded-xl'} flex items-center justify-center shadow-md group-hover:shadow-lg transition-all duration-300`}>
                        <Activity className={`${isMobile ? 'w-4 h-4' : 'w-5 h-5'} text-white`} />
                      </div>
                      <span className={`${isMobile ? 'text-xs' : 'text-sm'} font-semibold text-slate-700 uppercase tracking-wide`}>{traduzir('Total Movimentações')}</span>
                    </div>
                    <div className="flex items-baseline gap-2">
                      <span className={`${isMobile ? 'text-2xl' : 'text-3xl sm:text-4xl'} font-black text-slate-800`}>{movements.length}</span>
                      <span className={`${isMobile ? 'text-xs' : 'text-sm'} text-slate-600 opacity-75`}>{traduzir('registros')}</span>
                    </div>
                    <div className={`${isMobile ? 'mt-2' : 'mt-3'} flex items-center gap-2 ${isMobile ? 'text-xs' : 'text-sm'} text-slate-600`}>
                      <div className="flex items-center gap-1">
                        <TrendingUp className={`${isMobile ? 'w-3 h-3' : 'w-4 h-4'} text-emerald-600`} />
                        <span className="font-medium text-emerald-700">{movements.filter(m => m.type === 'entrada').length} {traduzir('compras')}</span>
                      </div>
                      <span className="text-slate-400">•</span>
                      <div className="flex items-center gap-1">
                        <TrendingDown className={`${isMobile ? 'w-3 h-3' : 'w-4 h-4'} text-red-600`} />
                        <span className="font-medium text-red-700">{movements.filter(m => m.type === 'saida').length} {traduzir('saídas')}</span>
                      </div>
                    </div>
                  </div>
                </div>
              </div>

              {/* Card: Última Atividade */}
              <div className={`relative bg-white/30 backdrop-blur-md ${isMobile ? 'rounded-lg p-3' : 'rounded-xl p-4 sm:p-5'} border border-white/40 shadow-lg hover:shadow-xl transition-all duration-300 hover:scale-[1.02] group`}>
                <div className="flex items-start justify-between gap-3">
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 mb-2">
                      <div className={`${isMobile ? 'w-8 h-8' : 'w-10 h-10'} bg-gradient-to-br from-purple-500 to-purple-600 ${isMobile ? 'rounded-lg' : 'rounded-xl'} flex items-center justify-center shadow-md group-hover:shadow-lg transition-all duration-300`}>
                        <Clock className={`${isMobile ? 'w-4 h-4' : 'w-5 h-5'} text-white`} />
                      </div>
                      <span className={`${isMobile ? 'text-xs' : 'text-sm'} font-semibold text-slate-700 uppercase tracking-wide`}>{traduzir('Última Atividade')}</span>
                    </div>
                    {recentMovements[0] ? (
                      <>
                        <div className={`flex items-baseline gap-2 mb-2`}>
                          <span className={`${isMobile ? 'text-sm' : 'text-base'} font-bold text-slate-800 truncate`}>
                            {recentMovements[0].productName || 'Sem nome'}
                          </span>
                        </div>
                        <div className={`flex items-center gap-2 ${isMobile ? 'text-xs' : 'text-sm'} text-slate-600`}>
                          <span className={`px-2 py-0.5 ${recentMovements[0].type === 'entrada' ? 'bg-emerald-100 text-emerald-700' : 'bg-red-100 text-red-700'} ${isMobile ? 'rounded' : 'rounded-md'} font-medium`}>
                            {recentMovements[0].type === 'entrada' ? '📥 Compra' : '📤 Venda'}
                          </span>
                          <span className="text-slate-600">
                            {new Date(recentMovements[0].date).toLocaleString('pt-BR', { 
                              day: '2-digit', 
                              month: '2-digit', 
                              hour: '2-digit', 
                              minute: '2-digit' 
                            })}
                          </span>
                        </div>
                      </>
                    ) : (
                      <p className={`${isMobile ? 'text-xs' : 'text-sm'} text-slate-500 italic`}>{traduzir('Nenhuma movimentação registrada')}</p>
                    )}
                  </div>
                </div>
              </div>

              {/* Card: Última Notificação */}
              <div className={`relative bg-white/30 backdrop-blur-md ${isMobile ? 'rounded-lg p-3' : 'rounded-xl p-4 sm:p-5'} border border-white/40 shadow-lg hover:shadow-xl transition-all duration-300 hover:scale-[1.02] group ${isMobile ? 'col-span-1' : 'lg:col-span-1 lg:col-start-3'}`}>
                <div className="flex items-start justify-between gap-3">
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 mb-2">
                      <div className={`${isMobile ? 'w-8 h-8' : 'w-10 h-10'} bg-gradient-to-br from-amber-500 to-amber-600 ${isMobile ? 'rounded-lg' : 'rounded-xl'} flex items-center justify-center shadow-md group-hover:shadow-lg transition-all duration-300`}>
                        <Bell className={`${isMobile ? 'w-4 h-4' : 'w-5 h-5'} text-white`} />
                      </div>
                      <span className={`${isMobile ? 'text-xs' : 'text-sm'} font-semibold text-slate-700 uppercase tracking-wide`}>{traduzir('Última Notificação')}</span>
                    </div>
                    {lastNotification ? (
                      <>
                        <div className={`flex items-center gap-2 mb-2`}>
                          {lastNotification.type === 'success' && <CheckCircle className={`${isMobile ? 'w-4 h-4' : 'w-5 h-5'} text-emerald-600 flex-shrink-0`} />}
                          {lastNotification.type === 'error' && <XCircle className={`${isMobile ? 'w-4 h-4' : 'w-5 h-5'} text-red-600 flex-shrink-0`} />}
                          {lastNotification.type === 'warning' && <AlertCircle className={`${isMobile ? 'w-4 h-4' : 'w-5 h-5'} text-amber-600 flex-shrink-0`} />}
                          {lastNotification.type === 'info' && <Info className={`${isMobile ? 'w-4 h-4' : 'w-5 h-5'} text-blue-600 flex-shrink-0`} />}
                          <span className={`${isMobile ? 'text-xs' : 'text-sm'} font-bold text-slate-800 line-clamp-1`}>
                            {lastNotification.title}
                          </span>
                        </div>
                        <p className={`${isMobile ? 'text-xs' : 'text-sm'} text-slate-600 line-clamp-2 mb-2`}>
                          {lastNotification.message}
                        </p>
                        <p className={`${isMobile ? 'text-xs' : 'text-xs'} text-slate-500`}>
                          {new Date(lastNotification.timestamp).toLocaleString('pt-BR')}
                        </p>
                      </>
                    ) : (
                      <p className={`${isMobile ? 'text-xs' : 'text-sm'} text-slate-500 italic`}>{traduzir('Nenhuma notificação')}</p>
                    )}
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Cards de Estatísticas com Design Moderno - Responsivo */}
      <div className={`grid ${isMobile ? 'grid-cols-1' : 'grid-cols-1 sm:grid-cols-2 lg:grid-cols-4'} ${isMobile ? 'gap-3' : 'gap-4 sm:gap-6'}`}>
        <div className={`group bg-gradient-to-br from-blue-100 to-blue-200 ${isMobile ? 'rounded-xl p-3' : 'rounded-2xl sm:rounded-3xl p-4 sm:p-6'} text-blue-800 shadow-lg hover:shadow-xl transition-all duration-300 hover:scale-105 border border-blue-200/50`}>
          <div className={`flex items-center justify-between ${isMobile ? 'mb-2' : 'mb-3 sm:mb-4'}`}>
            <div className={`${isMobile ? 'w-8 h-8' : 'w-10 h-10 sm:w-12 sm:h-12'} bg-blue-300/50 ${isMobile ? 'rounded-lg' : 'rounded-xl sm:rounded-2xl'} flex items-center justify-center backdrop-blur-sm`}>
              <Package className={`${isMobile ? 'w-4 h-4' : 'w-5 h-5 sm:w-6 sm:h-6'} text-blue-700`} />
            </div>
            <div className="text-right">
              <div className={`${isMobile ? 'text-xl' : 'text-2xl sm:text-3xl'} font-black`}>{stats.totalProducts}</div>
              <div className={`${isMobile ? 'text-xs' : 'text-xs sm:text-sm'} opacity-90`}>{traduzir('Total')}</div>
            </div>
          </div>
          <h3 className={`${isMobile ? 'text-sm' : 'text-base sm:text-lg'} font-semibold ${isMobile ? 'mb-1' : 'mb-2'}`}>📦 {traduzir('Total de Produtos')}</h3>
          <p className={`${isMobile ? 'text-xs' : 'text-xs sm:text-sm'} opacity-80`}>+0 {traduzir('este mês')}</p>
        </div>

        <div className={`group bg-gradient-to-br from-green-100 to-green-200 ${isMobile ? 'rounded-xl p-3' : 'rounded-2xl sm:rounded-3xl p-4 sm:p-6'} text-green-800 shadow-lg hover:shadow-xl transition-all duration-300 hover:scale-105 border border-green-200/50`}>
          <div className={`flex items-center justify-between ${isMobile ? 'mb-2' : 'mb-3 sm:mb-4'}`}>
            <div className={`${isMobile ? 'w-8 h-8' : 'w-10 h-10 sm:w-12 sm:h-12'} bg-green-300/50 ${isMobile ? 'rounded-lg' : 'rounded-xl sm:rounded-2xl'} flex items-center justify-center backdrop-blur-sm`}>
              <DollarSign className={`${isMobile ? 'w-4 h-4' : 'w-5 h-5 sm:w-6 sm:h-6'} text-green-700`} />
            </div>
            <div className="text-right">
              <div className={`${isMobile ? 'text-xl' : 'text-2xl sm:text-3xl'} font-black`}>{formatarMoeda(stats.stockValue)}</div>
              <div className={`${isMobile ? 'text-xs' : 'text-xs sm:text-sm'} opacity-90`}>{traduzir('Valor')}</div>
            </div>
          </div>
          <h3 className={`${isMobile ? 'text-sm' : 'text-base sm:text-lg'} font-semibold ${isMobile ? 'mb-1' : 'mb-2'}`}>💰 {traduzir('Valor do Estoque')}</h3>
          <p className={`${isMobile ? 'text-xs' : 'text-xs sm:text-sm'} opacity-80`}>+0% {traduzir('este mês')}</p>
        </div>

        <div className={`group bg-gradient-to-br from-purple-100 to-purple-200 ${isMobile ? 'rounded-xl p-3' : 'rounded-2xl sm:rounded-3xl p-4 sm:p-6'} text-purple-800 shadow-lg hover:shadow-xl transition-all duration-300 hover:scale-105 border border-purple-200/50`}>
          <div className={`flex items-center justify-between ${isMobile ? 'mb-2' : 'mb-3 sm:mb-4'}`}>
            <div className={`${isMobile ? 'w-8 h-8' : 'w-10 h-10 sm:w-12 sm:h-12'} bg-purple-300/50 ${isMobile ? 'rounded-lg' : 'rounded-xl sm:rounded-2xl'} flex items-center justify-center backdrop-blur-sm`}>
              <TrendingUp className={`${isMobile ? 'w-4 h-4' : 'w-5 h-5 sm:w-6 sm:h-6'} text-purple-700`} />
            </div>
            <div className="text-right">
              <div className={`${isMobile ? 'text-xl' : 'text-2xl sm:text-3xl'} font-black`}>{formatarMoeda(stats.todaySales)}</div>
              <div className={`${isMobile ? 'text-xs' : 'text-xs sm:text-sm'} opacity-90`}>{traduzir('Hoje')}</div>
            </div>
          </div>
          <h3 className={`${isMobile ? 'text-sm' : 'text-base sm:text-lg'} font-semibold ${isMobile ? 'mb-1' : 'mb-2'}`}>📈 {traduzir('Vendas Hoje')}</h3>
          <p className={`${isMobile ? 'text-xs' : 'text-xs sm:text-sm'} opacity-80`}>{todaySalesCount} {traduzir('vendas realizadas')}</p>
        </div>

        <div className={`group bg-gradient-to-br from-orange-100 to-orange-200 ${isMobile ? 'rounded-xl p-3' : 'rounded-2xl sm:rounded-3xl p-4 sm:p-6'} text-orange-800 shadow-lg hover:shadow-xl transition-all duration-300 hover:scale-105 border border-orange-200/50`}>
          <div className={`flex items-center justify-between ${isMobile ? 'mb-2' : 'mb-3 sm:mb-4'}`}>
            <div className={`${isMobile ? 'w-8 h-8' : 'w-10 h-10 sm:w-12 sm:h-12'} bg-orange-300/50 ${isMobile ? 'rounded-lg' : 'rounded-xl sm:rounded-2xl'} flex items-center justify-center backdrop-blur-sm`}>
              <AlertTriangle className={`${isMobile ? 'w-4 h-4' : 'w-5 h-5 sm:w-6 sm:h-6'} text-orange-700`} />
            </div>
            <div className="text-right">
              <div className={`${isMobile ? 'text-xl' : 'text-2xl sm:text-3xl'} font-black`}>{stats.lowStockCount}</div>
              <div className={`${isMobile ? 'text-xs' : 'text-xs sm:text-sm'} opacity-90`}>{traduzir('Baixo')}</div>
            </div>
          </div>
          <h3 className={`${isMobile ? 'text-sm' : 'text-base sm:text-lg'} font-semibold ${isMobile ? 'mb-1' : 'mb-2'}`}>⚠️ {traduzir('Estoque Baixo')}</h3>
          <p className={`${isMobile ? 'text-xs' : 'text-xs sm:text-sm'} opacity-80`}>{traduzir('Produtos com estoque mínimo')}</p>
        </div>
      </div>

      {/* Seção de Ações Rápidas - Responsiva */}
      <div className="space-y-4">
        {/* Cabeçalho com Toggle */}
        <div className="flex items-center justify-between">
          <h2 className={`${isMobile ? 'text-lg' : 'text-xl sm:text-2xl'} font-bold bg-gradient-to-r from-indigo-600 to-purple-600 bg-clip-text text-transparent flex items-center gap-2`}>
            <ShoppingCart className={`${isMobile ? 'w-5 h-5' : 'w-6 h-6'} text-indigo-600`} />
            {traduzir('Ações Rápidas')}
          </h2>
          <Button
            onClick={() => setShowQuickActions(!showQuickActions)}
            variant="outline"
            size={isMobile ? "sm" : "default"}
            className="bg-gradient-to-r from-indigo-600 to-indigo-700 text-white hover:from-indigo-700 hover:to-indigo-800 hover:text-white border-0 shadow-md"
          >
            {showQuickActions ? (
              <>
                <EyeOff className="mr-2 h-4 w-4" />
                {!isMobile && traduzir('Ocultar')}
              </>
            ) : (
              <>
                <Eye className="mr-2 h-4 w-4" />
                {!isMobile && traduzir('Mostrar')}
              </>
            )}
          </Button>
        </div>

        {showQuickActions && (
          <div className={`grid ${isMobile ? 'grid-cols-1' : 'grid-cols-1 2xl:grid-cols-3'} ${isMobile ? 'gap-4' : 'gap-6 sm:gap-8'}`}>
            <div className={`${isMobile ? '' : '2xl:col-span-2'}`}>
              <QuickActions />
            </div>
        
        {/* Card de Resumo Rápido com Design Moderno - Responsivo */}
        <div className={`bg-gradient-to-br from-slate-50 to-slate-100 ${isMobile ? 'rounded-xl' : 'rounded-2xl sm:rounded-3xl'} ${isMobile ? 'shadow-lg' : 'shadow-lg sm:shadow-xl'} border border-slate-200/50 overflow-hidden`}>
          <div className={`${isMobile ? 'p-3' : 'p-4 sm:p-6'} border-b border-slate-200/30 bg-gradient-to-r from-slate-100 to-slate-200`}>
            <h3 className={`${isMobile ? 'text-base' : 'text-lg sm:text-xl'} font-bold text-slate-800 flex items-center ${isMobile ? 'space-x-2' : 'space-x-3'}`}>
              <div className={`${isMobile ? 'w-7 h-7' : 'w-8 h-8 sm:w-10 sm:h-10'} bg-gradient-to-br from-blue-300 to-blue-400 ${isMobile ? 'rounded-lg' : 'rounded-lg sm:rounded-xl'} flex items-center justify-center`}>
                <Users className={`${isMobile ? 'w-3 h-3' : 'w-4 h-4 sm:w-5 sm:h-5'} text-blue-700`} />
              </div>
              <span>{traduzir('Resumo do Sistema')}</span>
            </h3>
          </div>
          <div className={`${isMobile ? 'p-3' : 'p-4 sm:p-6'} ${isMobile ? 'space-y-2' : 'space-y-3 sm:space-y-4'}`}>
            <div className={`group flex items-center justify-between gap-2 ${isMobile ? 'p-2' : 'p-3 sm:p-4'} bg-gradient-to-r from-blue-50 to-blue-100 ${isMobile ? 'rounded-lg' : 'rounded-xl sm:rounded-2xl'} hover:from-blue-100 hover:to-blue-200 transition-all duration-300 hover:scale-105 border border-blue-200/30`}>
              <div className={`flex items-center ${isMobile ? 'space-x-2' : 'space-x-2 sm:space-x-3'} flex-1 min-w-0`}>
                <div className={`${isMobile ? 'w-6 h-6' : 'w-8 h-8 sm:w-10 sm:h-10'} bg-gradient-to-br from-blue-300 to-blue-400 ${isMobile ? 'rounded-lg' : 'rounded-lg sm:rounded-xl'} flex items-center justify-center flex-shrink-0`}>
                  <Package className={`${isMobile ? 'w-3 h-3' : 'w-4 h-4 sm:w-5 sm:h-5'} text-blue-700`} />
                </div>
                <span className={`${isMobile ? 'text-xs' : 'text-xs sm:text-sm'} font-semibold text-slate-700 truncate`}>{traduzir('Produtos Ativos')}</span>
              </div>
              <span className={`${isMobile ? 'text-base' : 'text-lg sm:text-xl'} font-black text-blue-700 flex-shrink-0 whitespace-nowrap`}>{stats.totalProducts}</span>
            </div>
            
            <div className={`group flex items-center justify-between gap-2 ${isMobile ? 'p-2' : 'p-3 sm:p-4'} bg-gradient-to-r from-blue-50 to-blue-100 ${isMobile ? 'rounded-lg' : 'rounded-xl sm:rounded-2xl'} hover:from-blue-100 hover:to-blue-200 transition-all duration-300 hover:scale-105 border border-blue-200/30`}>
              <div className={`flex items-center ${isMobile ? 'space-x-2' : 'space-x-2 sm:space-x-3'} flex-1 min-w-0`}>
                <div className={`${isMobile ? 'w-6 h-6' : 'w-8 h-8 sm:w-10 sm:h-10'} bg-gradient-to-br from-blue-300 to-blue-400 ${isMobile ? 'rounded-lg' : 'rounded-lg sm:rounded-xl'} flex items-center justify-center flex-shrink-0`}>
                  <ShoppingCart className={`${isMobile ? 'w-3 h-3' : 'w-4 h-4 sm:w-5 sm:h-5'} text-blue-700`} />
                </div>
                <span className={`${isMobile ? 'text-xs' : 'text-xs sm:text-sm'} font-semibold text-slate-700 truncate`}>{traduzir('Movimentações')}</span>
              </div>
              <span className={`${isMobile ? 'text-base' : 'text-lg sm:text-xl'} font-black text-blue-700 flex-shrink-0 whitespace-nowrap`}>{movements.length}</span>
            </div>
            
            <div className={`group flex items-center justify-between gap-2 ${isMobile ? 'p-2' : 'p-3 sm:p-4'} bg-gradient-to-r from-purple-50 to-purple-100 ${isMobile ? 'rounded-lg' : 'rounded-xl sm:rounded-2xl'} hover:from-purple-100 hover:to-purple-200 transition-all duration-300 hover:scale-105 border border-purple-200/30`}>
              <div className={`flex items-center ${isMobile ? 'space-x-2' : 'space-x-2 sm:space-x-3'} flex-1 min-w-0`}>
                <div className={`${isMobile ? 'w-6 h-6' : 'w-8 h-8 sm:w-10 sm:h-10'} bg-gradient-to-br from-purple-300 to-purple-400 ${isMobile ? 'rounded-lg' : 'rounded-lg sm:rounded-xl'} flex items-center justify-center flex-shrink-0`}>
                  <DollarSign className={`${isMobile ? 'w-3 h-3' : 'w-4 h-4 sm:w-5 sm:h-5'} text-purple-700`} />
                </div>
                <span className={`${isMobile ? 'text-xs' : 'text-xs sm:text-sm'} font-semibold text-slate-700 truncate`}>{traduzir('Valor Total')}</span>
              </div>
              <span className={`${isMobile ? 'text-base' : 'text-lg sm:text-xl'} font-black text-purple-700 flex-shrink-0 whitespace-nowrap`}>{formatarMoeda(stats.stockValue)}</span>
            </div>
            
            {/* Top 5 Produtos - Responsivo */}
            <div className={`${isMobile ? 'mt-3 pt-3' : 'mt-4 pt-4'} border-t border-slate-200`}>
              <h4 className={`${isMobile ? 'text-xs' : 'text-sm'} font-semibold text-slate-700 ${isMobile ? 'mb-2' : 'mb-3'} flex items-center ${isMobile ? 'gap-1.5' : 'gap-2'}`}>
                <TrendingUp className={`${isMobile ? 'w-3.5 h-3.5' : 'w-4 h-4'} text-indigo-600`} />
                🏆 {traduzir('Top 5 Produtos')}
              </h4>
              {products.length > 0 ? (
                <div className={`${isMobile ? 'space-y-1.5' : 'space-y-2'}`}>
                  {products
                    .filter(p => p.stock > 0)
                    .sort((a, b) => b.stock - a.stock)
                    .slice(0, 5)
                    .map((product, index) => {
                      // Calcular preço efetivo: usar preço de venda, ou custo médio das entradas se preço for 0
                      let effectivePrice = product.price;
                      if (effectivePrice === 0 || !effectivePrice) {
                        const productEntries = movements
                          .filter(m => m.productId === product.id && m.type === 'entrada')
                          .sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime());
                        
                        if (productEntries.length > 0) {
                          let totalCost = 0;
                          let totalQuantity = 0;
                          
                          productEntries.forEach(entry => {
                            totalCost += (entry.unitPrice * entry.quantity);
                            totalQuantity += entry.quantity;
                          });
                          
                          effectivePrice = totalQuantity > 0 ? totalCost / totalQuantity : 0;
                        }
                      }
                      
                      const totalValue = product.stock * effectivePrice;
                      return (
                        <div 
                          key={product.id} 
                          className={`flex items-center justify-between ${isMobile ? 'p-1.5' : 'p-2'} bg-white rounded-lg border border-blue-100 hover:shadow-sm transition-all gap-2`}
                        >
                          <div className={`flex items-center ${isMobile ? 'gap-1.5' : 'gap-2'} flex-1 min-w-0`}>
                            <div className={`flex items-center justify-center ${isMobile ? 'w-5 h-5 flex-shrink-0' : 'w-6 h-6 flex-shrink-0'} bg-gradient-to-br from-indigo-600 to-indigo-700 rounded text-white font-bold text-xs`}>
                              {index + 1}º
                            </div>
                            <div className="flex-1 min-w-0">
                              <p className={`font-semibold text-gray-900 ${isMobile ? 'text-xs' : 'text-xs'} truncate`}>{product.name}</p>
                              <div className={`flex items-center ${isMobile ? 'gap-0.5' : 'gap-1'} mt-0.5 flex-wrap`}>
                                <span className={`${isMobile ? 'text-xs' : 'text-xs'} text-blue-600 font-medium whitespace-nowrap`}>{product.stock} {traduzir('un')}</span>
                                <span className={`${isMobile ? 'text-xs' : 'text-xs'} text-gray-400`}>×</span>
                                <span className={`${isMobile ? 'text-xs' : 'text-xs'} text-gray-600 whitespace-nowrap`}>{getSimboloMoeda()} {converterMoeda(effectivePrice).toFixed(2)}</span>
                              </div>
                            </div>
                          </div>
                          <div className="text-right flex-shrink-0">
                            <p className={`font-bold text-green-600 ${isMobile ? 'text-xs' : 'text-sm'} whitespace-nowrap`}>
                              {getSimboloMoeda()} {converterMoeda(totalValue).toFixed(2)}
                            </p>
                          </div>
                        </div>
                      );
                    })}
                </div>
              ) : (
                <p className={`${isMobile ? 'text-xs' : 'text-xs'} text-gray-500 text-center ${isMobile ? 'py-3' : 'py-4'}`}>Nenhum produto em estoque</p>
              )}
            </div>
          </div>
        </div>
          </div>
        )}
      </div>

      {/* Gráficos - Só aparecem quando há produtos - Responsivo */}
      {hasProducts ? (
        <>
          {/* Gráficos de Distribuição de Produtos e Quantidade de Vendas Mensais - Layout Responsivo baseado na Sidebar */}
          {/* Desktop com sidebar não fixada: gráficos lado a lado (grid 12 colunas) */}
          {/* Desktop com sidebar fixada: gráficos um abaixo do outro (grid 6 colunas) */}
          {/* Mobile/Tablet: gráficos um abaixo do outro (grid 1 coluna) */}
          <div className={`grid ${isMobile || isTablet ? 'grid-cols-1' : isPinned ? 'grid-cols-1 lg:grid-cols-6' : 'grid-cols-1 lg:grid-cols-12'} ${isMobile ? 'gap-4' : 'gap-6'}`}>
            {/* Distribuição de Produtos */}
            <div className={isMobile || isTablet ? 'col-span-1' : isPinned ? 'col-span-1 lg:col-span-6' : 'col-span-1 lg:col-span-7'}>
              <ProductsChart 
                products={products.map(p => ({
                  id: p.id,
                  name: p.name,
                  category: p.category,
                  stock: p.stock,
                  price: p.price
                }))}
                movements={movements.map(m => ({
                  productId: m.productId,
                  type: m.type,
                  unitPrice: m.unitPrice,
                  quantity: m.quantity,
                  date: m.date
                }))}
              />
            </div>
            {/* Quantidade de Vendas Mensais */}
            <div className={isMobile || isTablet ? 'col-span-1' : isPinned ? 'col-span-1 lg:col-span-6' : 'col-span-1 lg:col-span-5'}>
              <SalesChart movements={movements.map(m => ({
                id: m.id,
                type: m.type,
                quantity: m.quantity,
                unitPrice: m.unitPrice,
                date: m.date,
                productName: m.productName,
                total: m.total
              }))} />
            </div>
          </div>

          {/* Gráficos de Compras vs Vendas e Ranking de Itens - Layout Responsivo baseado na Sidebar */}
          {/* Desktop com sidebar não fixada: gráficos lado a lado (grid 12 colunas) */}
          {/* Desktop com sidebar fixada: gráficos um abaixo do outro (grid 6 colunas) */}
          {/* Mobile/Tablet: gráficos um abaixo do outro (grid 1 coluna) */}
          <div className={`grid ${isMobile || isTablet ? 'grid-cols-1' : isPinned ? 'grid-cols-1 lg:grid-cols-6' : 'grid-cols-1 lg:grid-cols-12'} ${isMobile ? 'gap-4' : 'gap-6'}`}>
            {/* Compras vs Vendas por Mês (Diferença) */}
            <div className={isMobile || isTablet ? 'col-span-1' : isPinned ? 'col-span-1 lg:col-span-6' : 'col-span-1 lg:col-span-6'}>
              <PurchasesSalesDiffChart movements={movements.map(m => ({
                id: m.id,
                type: m.type,
                quantity: m.quantity,
                unitPrice: m.unitPrice,
                date: m.date,
                total: m.total
              }))} />
            </div>
            {/* Ranking de Itens - Maior Valor */}
            <div className={isMobile || isTablet ? 'col-span-1' : isPinned ? 'col-span-1 lg:col-span-6' : 'col-span-1 lg:col-span-6'}>
              <ItemsRankingChart 
                movements={movements.map(m => ({
                  id: m.id,
                  type: m.type,
                  quantity: m.quantity,
                  unitPrice: m.unitPrice,
                  date: m.date,
                  productName: m.productName,
                  total: m.total
                }))}
                products={products.map(p => ({
                  id: p.id,
                  name: p.name,
                  price: p.price,
                  stock: p.stock
                }))}
              />
            </div>
          </div>
        </>
      ) : (
        /* Mensagem quando não há produtos com Design Melhorado - Responsivo */
        <div className={`text-center ${isMobile ? 'py-12' : 'py-20'} bg-gradient-to-br from-slate-50 to-slate-100 ${isMobile ? 'rounded-xl' : 'rounded-3xl'} ${isMobile ? 'shadow-lg' : 'shadow-xl'} border-0`}>
          <div className={`${isMobile ? 'max-w-sm' : 'max-w-lg'} mx-auto`}>
            <div className={`${isMobile ? 'w-16 h-16' : 'w-24 h-24'} bg-gradient-to-br from-blue-100 to-blue-200 rounded-full flex items-center justify-center mx-auto ${isMobile ? 'mb-6' : 'mb-8'} ${isMobile ? 'shadow-md' : 'shadow-lg'}`}>
              <Package className={`${isMobile ? 'w-8 h-8' : 'w-12 h-12'} text-blue-600`} />
            </div>
            <h3 className={`${isMobile ? 'text-xl' : 'text-3xl'} font-black text-slate-800 ${isMobile ? 'mb-3' : 'mb-4'} bg-gradient-to-r from-slate-800 to-slate-600 bg-clip-text text-transparent`}>
              Nenhum produto cadastrado
            </h3>
            <p className={`text-slate-600 ${isMobile ? 'mb-6' : 'mb-10'} leading-relaxed ${isMobile ? 'text-sm' : 'text-lg'}`}>
              Adicione seu primeiro produto para começar a usar o sistema e visualizar gráficos, análises e relatórios detalhados
            </p>
            <a 
              href="/produtos" 
              className={`group inline-flex items-center ${isMobile ? 'space-x-2 px-6 py-3' : 'space-x-3 px-8 py-4'} bg-gradient-to-r from-blue-600 to-purple-600 text-white ${isMobile ? 'rounded-xl' : 'rounded-2xl'} hover:from-blue-700 hover:to-purple-700 transition-all duration-300 ${isMobile ? 'shadow-lg hover:shadow-xl' : 'shadow-xl hover:shadow-2xl'} transform hover:scale-105 font-semibold ${isMobile ? 'text-sm' : 'text-lg'}`}
            >
              <Package className={`${isMobile ? 'w-4 h-4' : 'w-6 h-6'} group-hover:rotate-12 transition-transform duration-300`} />
              <span>Cadastrar Primeiro Produto</span>
              <ArrowRight className={`${isMobile ? 'w-4 h-4' : 'w-5 h-5'} group-hover:translate-x-1 transition-transform duration-300`} />
            </a>
          </div>
        </div>
      )}

      {/* Movimentações Recentes */}
      <RecentMovements movements={recentMovements.map(m => ({
        id: m.id,
        type: m.type,
        productName: m.productName || m.product?.name || 'Produto sem nome',
        description: m.description,
        total: m.total,
        date: m.date
      }))} />

    </main>
  );
};

export default Index;
