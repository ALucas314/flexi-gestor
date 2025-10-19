import { Package, DollarSign, TrendingUp, AlertTriangle, BarChart3, Users, ShoppingCart, ArrowRight } from "lucide-react";
import { StatsCard } from "@/components/dashboard/StatsCard";
import { RecentMovements } from "@/components/dashboard/RecentMovements";
import { QuickActions } from "@/components/dashboard/QuickActions";
import { SalesChart } from "@/components/dashboard/SalesChart";
import { ProductsChart } from "@/components/dashboard/ProductsChart";
import { StockChart } from "@/components/dashboard/StockChart";
import { useData } from "@/contexts/DataContext";
import { useResponsive } from "@/hooks/use-responsive";
import React from "react";

const Index = () => {
  const { getDashboardStats, movements, products } = useData();
  const { isMobile, isTablet, screenWidth } = useResponsive();
  const [stats, setStats] = React.useState(getDashboardStats());

  // Verificar se há produtos cadastrados
  const hasProducts = products.length > 0;

  // Pegar movimentações mais recentes
  const recentMovements = movements
    .sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime())
    .slice(0, 4);

  // Atualizar estatísticas em tempo real quando products ou movements mudarem
  React.useEffect(() => {
    console.log('🔄 Dashboard atualizando estatísticas...');
    console.log('  - Produtos:', products.length);
    console.log('  - Movimentações:', movements.length);
    
    const newStats = getDashboardStats();
    setStats(newStats);
    
    console.log('📊 Novas estatísticas:', newStats);
  }, [products, movements, getDashboardStats]);

  return (
    <main className={`flex-1 ${isMobile ? 'p-2 xs:p-3' : 'p-3 sm:p-6'} ${isMobile ? 'space-y-4' : 'space-y-6 sm:space-y-10'} bg-gradient-to-br from-slate-50 via-blue-50 to-indigo-50 min-h-screen`}>
      {/* Hero Section com Design Profissional - Responsivo */}
      <div className={`relative ${isMobile ? 'rounded-xl' : 'rounded-2xl sm:rounded-3xl'} overflow-hidden bg-gradient-to-br from-blue-300 via-indigo-400 via-purple-400 to-pink-300 text-slate-800 ${isMobile ? 'shadow-lg' : 'shadow-xl sm:shadow-2xl'} border border-slate-200/50`}>
        {/* Padrão geométrico moderno em vez da imagem */}
        <div className="absolute inset-0 opacity-10">
          <div className="absolute inset-0 bg-[radial-gradient(circle_at_20%_80%,rgba(120,119,198,0.3)_0%,transparent_50%)]"></div>
          <div className="absolute inset-0 bg-[radial-gradient(circle_at_80%_20%,rgba(255,119,198,0.3)_0%,transparent_50%)]"></div>
          <div className="absolute inset-0 bg-[radial-gradient(circle_at_40%_40%,rgba(120,198,255,0.2)_0%,transparent_50%)]"></div>
        </div>
        <div className="absolute inset-0 bg-gradient-to-r from-blue-200/50 via-purple-200/40 to-pink-200/50" />
        <div className={`relative ${isMobile ? 'p-3 xs:p-4' : 'p-4 sm:p-8 md:p-12'}`}>
          <div className="max-w-5xl">
            <div className={`flex items-center ${isMobile ? 'space-x-2' : 'space-x-4'} ${isMobile ? 'mb-3' : 'mb-4 sm:mb-6'}`}>
              <div>
                <h1 className={`${isMobile ? 'text-2xl xs:text-3xl' : 'text-3xl sm:text-4xl md:text-5xl lg:text-6xl'} font-black ${isMobile ? 'mb-2' : 'mb-3 sm:mb-4'} tracking-tight bg-gradient-to-r from-slate-800 via-blue-700 to-purple-700 bg-clip-text text-transparent`}>
                  🚀 Flexi Gestor
                </h1>
                <p className={`${isMobile ? 'text-sm xs:text-base' : 'text-base sm:text-lg md:text-xl lg:text-2xl'} opacity-90 max-w-3xl leading-relaxed font-medium text-slate-700`}>
                  Sistema completo de gestão empresarial para controlar estoque, vendas e finanças com precisão e eficiência
                </p>
              </div>
            </div>
            
            {/* Quick Stats no Hero com Design Melhorado - Responsivo */}
            <div className={`grid ${isMobile ? 'grid-cols-2' : 'grid-cols-2 md:grid-cols-4'} ${isMobile ? 'gap-2' : 'gap-3 sm:gap-6'} ${isMobile ? 'mt-4' : 'mt-6 sm:mt-10'}`}>
              <div className={`bg-white/60 backdrop-blur-md ${isMobile ? 'rounded-lg p-2' : 'rounded-xl sm:rounded-2xl p-3 sm:p-6'} text-center border border-white/40 hover:bg-white/80 transition-all duration-300 hover:scale-105 shadow-md`}>
                <div className={`${isMobile ? 'text-lg' : 'text-xl sm:text-2xl md:text-3xl'} font-black ${isMobile ? 'mb-1' : 'mb-1 sm:mb-2'} text-slate-800`}>{stats.totalProducts}</div>
                <div className={`${isMobile ? 'text-xs' : 'text-xs sm:text-sm'} font-medium opacity-90 text-slate-700`}>Produtos</div>
              </div>
              <div className={`bg-white/60 backdrop-blur-md ${isMobile ? 'rounded-lg p-2' : 'rounded-xl sm:rounded-2xl p-3 sm:p-6'} text-center border border-white/40 hover:bg-white/80 transition-all duration-300 hover:scale-105 shadow-md`}>
                <div className={`${isMobile ? 'text-lg' : 'text-xl sm:text-2xl md:text-3xl'} font-black ${isMobile ? 'mb-1' : 'mb-1 sm:mb-2'} text-slate-800`}>{movements.length}</div>
                <div className={`${isMobile ? 'text-xs' : 'text-xs sm:text-sm'} font-medium opacity-90 text-slate-700`}>Movimentações</div>
              </div>
              <div className={`bg-white/60 backdrop-blur-md ${isMobile ? 'rounded-lg p-2' : 'rounded-xl sm:rounded-2xl p-3 sm:p-6'} text-center border border-white/40 hover:bg-white/80 transition-all duration-300 hover:scale-105 shadow-md`}>
                <div className={`${isMobile ? 'text-lg' : 'text-xl sm:text-2xl md:text-3xl'} font-black ${isMobile ? 'mb-1' : 'mb-1 sm:mb-2'} text-slate-800`}>R$ {stats.stockValue.toFixed(0)}</div>
                <div className={`${isMobile ? 'text-xs' : 'text-xs sm:text-sm'} font-medium opacity-90 text-slate-700`}>Valor Estoque</div>
              </div>
              <div className={`bg-white/60 backdrop-blur-md ${isMobile ? 'rounded-lg p-2' : 'rounded-xl sm:rounded-2xl p-3 sm:p-6'} text-center border border-white/40 hover:bg-white/80 transition-all duration-300 hover:scale-105 shadow-md`}>
                <div className={`${isMobile ? 'text-lg' : 'text-xl sm:text-2xl md:text-3xl'} font-black ${isMobile ? 'mb-1' : 'mb-1 sm:mb-2'} text-slate-800`}>{stats.lowStockCount}</div>
                <div className={`${isMobile ? 'text-xs' : 'text-xs sm:text-sm'} font-medium opacity-90 text-slate-700`}>Estoque Baixo</div>
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
              <div className={`${isMobile ? 'text-xs' : 'text-xs sm:text-sm'} opacity-90`}>Total</div>
            </div>
          </div>
          <h3 className={`${isMobile ? 'text-sm' : 'text-base sm:text-lg'} font-semibold ${isMobile ? 'mb-1' : 'mb-2'}`}>📦 Total de Produtos</h3>
          <p className={`${isMobile ? 'text-xs' : 'text-xs sm:text-sm'} opacity-80`}>+0 este mês</p>
        </div>

        <div className={`group bg-gradient-to-br from-green-100 to-green-200 ${isMobile ? 'rounded-xl p-3' : 'rounded-2xl sm:rounded-3xl p-4 sm:p-6'} text-green-800 shadow-lg hover:shadow-xl transition-all duration-300 hover:scale-105 border border-green-200/50`}>
          <div className={`flex items-center justify-between ${isMobile ? 'mb-2' : 'mb-3 sm:mb-4'}`}>
            <div className={`${isMobile ? 'w-8 h-8' : 'w-10 h-10 sm:w-12 sm:h-12'} bg-green-300/50 ${isMobile ? 'rounded-lg' : 'rounded-xl sm:rounded-2xl'} flex items-center justify-center backdrop-blur-sm`}>
              <DollarSign className={`${isMobile ? 'w-4 h-4' : 'w-5 h-5 sm:w-6 sm:h-6'} text-green-700`} />
            </div>
            <div className="text-right">
              <div className={`${isMobile ? 'text-xl' : 'text-2xl sm:text-3xl'} font-black`}>R$ {stats.stockValue.toFixed(0)}</div>
              <div className={`${isMobile ? 'text-xs' : 'text-xs sm:text-sm'} opacity-90`}>Valor</div>
            </div>
          </div>
          <h3 className={`${isMobile ? 'text-sm' : 'text-base sm:text-lg'} font-semibold ${isMobile ? 'mb-1' : 'mb-2'}`}>💰 Valor do Estoque</h3>
          <p className={`${isMobile ? 'text-xs' : 'text-xs sm:text-sm'} opacity-80`}>+0% este mês</p>
        </div>

        <div className={`group bg-gradient-to-br from-purple-100 to-purple-200 ${isMobile ? 'rounded-xl p-3' : 'rounded-2xl sm:rounded-3xl p-4 sm:p-6'} text-purple-800 shadow-lg hover:shadow-xl transition-all duration-300 hover:scale-105 border border-purple-200/50`}>
          <div className={`flex items-center justify-between ${isMobile ? 'mb-2' : 'mb-3 sm:mb-4'}`}>
            <div className={`${isMobile ? 'w-8 h-8' : 'w-10 h-10 sm:w-12 sm:h-12'} bg-purple-300/50 ${isMobile ? 'rounded-lg' : 'rounded-xl sm:rounded-2xl'} flex items-center justify-center backdrop-blur-sm`}>
              <TrendingUp className={`${isMobile ? 'w-4 h-4' : 'w-5 h-5 sm:w-6 sm:h-6'} text-purple-700`} />
            </div>
            <div className="text-right">
              <div className={`${isMobile ? 'text-xl' : 'text-2xl sm:text-3xl'} font-black`}>R$ {stats.todaySales.toFixed(0)}</div>
              <div className={`${isMobile ? 'text-xs' : 'text-xs sm:text-sm'} opacity-90`}>Hoje</div>
            </div>
          </div>
          <h3 className={`${isMobile ? 'text-sm' : 'text-base sm:text-lg'} font-semibold ${isMobile ? 'mb-1' : 'mb-2'}`}>📈 Vendas Hoje</h3>
          <p className={`${isMobile ? 'text-xs' : 'text-xs sm:text-sm'} opacity-80`}>0 vendas realizadas</p>
        </div>

        <div className={`group bg-gradient-to-br from-orange-100 to-orange-200 ${isMobile ? 'rounded-xl p-3' : 'rounded-2xl sm:rounded-3xl p-4 sm:p-6'} text-orange-800 shadow-lg hover:shadow-xl transition-all duration-300 hover:scale-105 border border-orange-200/50`}>
          <div className={`flex items-center justify-between ${isMobile ? 'mb-2' : 'mb-3 sm:mb-4'}`}>
            <div className={`${isMobile ? 'w-8 h-8' : 'w-10 h-10 sm:w-12 sm:h-12'} bg-orange-300/50 ${isMobile ? 'rounded-lg' : 'rounded-xl sm:rounded-2xl'} flex items-center justify-center backdrop-blur-sm`}>
              <AlertTriangle className={`${isMobile ? 'w-4 h-4' : 'w-5 h-5 sm:w-6 sm:h-6'} text-orange-700`} />
            </div>
            <div className="text-right">
              <div className={`${isMobile ? 'text-xl' : 'text-2xl sm:text-3xl'} font-black`}>{stats.lowStockCount}</div>
              <div className={`${isMobile ? 'text-xs' : 'text-xs sm:text-sm'} opacity-90`}>Baixo</div>
            </div>
          </div>
          <h3 className={`${isMobile ? 'text-sm' : 'text-base sm:text-lg'} font-semibold ${isMobile ? 'mb-1' : 'mb-2'}`}>⚠️ Estoque Baixo</h3>
          <p className={`${isMobile ? 'text-xs' : 'text-xs sm:text-sm'} opacity-80`}>Produtos com estoque mínimo</p>
        </div>
      </div>

      {/* Seção de Ações Rápidas - Responsiva */}
      <div className={`grid ${isMobile ? 'grid-cols-1' : 'grid-cols-1 lg:grid-cols-3'} ${isMobile ? 'gap-4' : 'gap-6 sm:gap-8'}`}>
        <div className={`${isMobile ? '' : 'lg:col-span-2'}`}>
          <QuickActions />
        </div>
        
        {/* Card de Resumo Rápido com Design Moderno - Responsivo */}
        <div className={`bg-gradient-to-br from-slate-50 to-slate-100 ${isMobile ? 'rounded-xl' : 'rounded-2xl sm:rounded-3xl'} ${isMobile ? 'shadow-lg' : 'shadow-lg sm:shadow-xl'} border border-slate-200/50 overflow-hidden`}>
          <div className={`${isMobile ? 'p-3' : 'p-4 sm:p-6'} border-b border-slate-200/30 bg-gradient-to-r from-slate-100 to-slate-200`}>
            <h3 className={`${isMobile ? 'text-base' : 'text-lg sm:text-xl'} font-bold text-slate-800 flex items-center ${isMobile ? 'space-x-2' : 'space-x-3'}`}>
              <div className={`${isMobile ? 'w-7 h-7' : 'w-8 h-8 sm:w-10 sm:h-10'} bg-gradient-to-br from-blue-300 to-blue-400 ${isMobile ? 'rounded-lg' : 'rounded-lg sm:rounded-xl'} flex items-center justify-center`}>
                <Users className={`${isMobile ? 'w-3 h-3' : 'w-4 h-4 sm:w-5 sm:h-5'} text-blue-700`} />
              </div>
              <span>Resumo do Sistema</span>
            </h3>
          </div>
          <div className={`${isMobile ? 'p-3' : 'p-4 sm:p-6'} ${isMobile ? 'space-y-2' : 'space-y-3 sm:space-y-4'}`}>
            <div className={`group flex items-center justify-between ${isMobile ? 'p-2' : 'p-3 sm:p-4'} bg-gradient-to-r from-blue-50 to-blue-100 ${isMobile ? 'rounded-lg' : 'rounded-xl sm:rounded-2xl'} hover:from-blue-100 hover:to-blue-200 transition-all duration-300 hover:scale-105 border border-blue-200/30`}>
              <div className={`flex items-center ${isMobile ? 'space-x-2' : 'space-x-2 sm:space-x-3'}`}>
                <div className={`${isMobile ? 'w-6 h-6' : 'w-8 h-8 sm:w-10 sm:h-10'} bg-gradient-to-br from-blue-300 to-blue-400 ${isMobile ? 'rounded-lg' : 'rounded-lg sm:rounded-xl'} flex items-center justify-center`}>
                  <Package className={`${isMobile ? 'w-3 h-3' : 'w-4 h-4 sm:w-5 sm:h-5'} text-blue-700`} />
                </div>
                <span className={`${isMobile ? 'text-xs' : 'text-xs sm:text-sm'} font-semibold text-slate-700`}>Produtos Ativos</span>
              </div>
              <span className={`${isMobile ? 'text-base' : 'text-lg sm:text-xl'} font-black text-blue-700`}>{stats.totalProducts}</span>
            </div>
            
            <div className={`group flex items-center justify-between ${isMobile ? 'p-2' : 'p-3 sm:p-4'} bg-gradient-to-r from-blue-50 to-blue-100 ${isMobile ? 'rounded-lg' : 'rounded-xl sm:rounded-2xl'} hover:from-blue-100 hover:to-blue-200 transition-all duration-300 hover:scale-105 border border-blue-200/30`}>
              <div className={`flex items-center ${isMobile ? 'space-x-2' : 'space-x-2 sm:space-x-3'}`}>
                <div className={`${isMobile ? 'w-6 h-6' : 'w-8 h-8 sm:w-10 sm:h-10'} bg-gradient-to-br from-blue-300 to-blue-400 ${isMobile ? 'rounded-lg' : 'rounded-lg sm:rounded-xl'} flex items-center justify-center`}>
                  <ShoppingCart className={`${isMobile ? 'w-3 h-3' : 'w-4 h-4 sm:w-5 sm:h-5'} text-blue-700`} />
                </div>
                <span className={`${isMobile ? 'text-xs' : 'text-xs sm:text-sm'} font-semibold text-slate-700`}>Movimentações</span>
              </div>
              <span className={`${isMobile ? 'text-base' : 'text-lg sm:text-xl'} font-black text-blue-700`}>{movements.length}</span>
            </div>
            
            <div className={`group flex items-center justify-between ${isMobile ? 'p-2' : 'p-3 sm:p-4'} bg-gradient-to-r from-purple-50 to-purple-100 ${isMobile ? 'rounded-lg' : 'rounded-xl sm:rounded-2xl'} hover:from-purple-100 hover:to-purple-200 transition-all duration-300 hover:scale-105 border border-purple-200/30`}>
              <div className={`flex items-center ${isMobile ? 'space-x-2' : 'space-x-2 sm:space-x-3'}`}>
                <div className={`${isMobile ? 'w-6 h-6' : 'w-8 h-8 sm:w-10 sm:h-10'} bg-gradient-to-br from-purple-300 to-purple-400 ${isMobile ? 'rounded-lg' : 'rounded-lg sm:rounded-xl'} flex items-center justify-center`}>
                  <DollarSign className={`${isMobile ? 'w-3 h-3' : 'w-4 h-4 sm:w-5 sm:h-5'} text-purple-700`} />
                </div>
                <span className={`${isMobile ? 'text-xs' : 'text-xs sm:text-sm'} font-semibold text-slate-700`}>Valor Total</span>
              </div>
              <span className={`${isMobile ? 'text-base' : 'text-lg sm:text-xl'} font-black text-purple-700`}>R$ {stats.stockValue.toFixed(0)}</span>
            </div>
          </div>
        </div>
      </div>

      {/* Gráficos - Só aparecem quando há produtos - Responsivo */}
      {hasProducts ? (
        <>
          <div className={`grid ${isMobile ? 'grid-cols-1' : 'grid-cols-1 lg:grid-cols-6'} ${isMobile ? 'gap-4' : 'gap-6'}`}>
            <SalesChart movements={movements.map(m => ({
              id: m.id,
              type: m.type,
              quantity: m.quantity,
              unitPrice: m.unitPrice,
              date: m.date,
              productName: m.productName,
              total: m.total
            }))} />
            <ProductsChart products={products.map(p => ({
              id: p.id,
              name: p.name,
              category: p.category,
              stock: p.stock,
              unitPrice: p.price
            }))} />
          </div>

          <StockChart products={products.map(p => ({
            id: p.id,
            name: p.name,
            stock: p.stock,
            unitPrice: p.price
          }))} />
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
      <RecentMovements movements={recentMovements} />

    </main>
  );
};

export default Index;
