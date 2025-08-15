import { Package, DollarSign, TrendingUp, AlertTriangle } from "lucide-react";
import { Sidebar } from "@/components/layout/Sidebar";
import { Header } from "@/components/layout/Header";
import { StatsCard } from "@/components/dashboard/StatsCard";
import { RecentMovements } from "@/components/dashboard/RecentMovements";
import { QuickActions } from "@/components/dashboard/QuickActions";
import dashboardHero from "@/assets/dashboard-hero.jpg";

const Index = () => {
  return (
    <div className="min-h-screen bg-background">
      <div className="flex">
        <Sidebar />
        
        <div className="flex-1 flex flex-col">
          <Header />
          
          <main className="flex-1 p-6 space-y-6">
            {/* Hero Section */}
            <div className="relative rounded-xl overflow-hidden bg-gradient-primary text-primary-foreground">
              <div 
                className="absolute inset-0 bg-cover bg-center opacity-20"
                style={{ backgroundImage: `url(${dashboardHero})` }}
              />
              <div className="relative p-8">
                <h1 className="text-3xl font-bold mb-2">
                  Bem-vindo ao FlexiGestor
                </h1>
                <p className="text-lg opacity-90">
                  Gerencie seu estoque, vendas e finanças em um só lugar
                </p>
              </div>
            </div>

            {/* Stats Cards */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
              <StatsCard
                title="Total de Produtos"
                value="156"
                change="+12 este mês"
                changeType="positive"
                icon={<Package className="w-8 h-8" />}
              />
              <StatsCard
                title="Valor do Estoque"
                value="R$ 45.280"
                change="+8.5% este mês"
                changeType="positive"
                icon={<DollarSign className="w-8 h-8" />}
              />
              <StatsCard
                title="Vendas Hoje"
                value="R$ 3.240"
                change="5 vendas realizadas"
                changeType="neutral"
                icon={<TrendingUp className="w-8 h-8" />}
              />
              <StatsCard
                title="Estoque Baixo"
                value="8"
                change="Produtos com estoque mínimo"
                changeType="negative"
                icon={<AlertTriangle className="w-8 h-8" />}
              />
            </div>

            {/* Dashboard Content */}
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
              <div className="lg:col-span-2">
                <RecentMovements />
              </div>
              <div>
                <QuickActions />
              </div>
            </div>
          </main>
        </div>
      </div>
    </div>
  );
};

export default Index;
