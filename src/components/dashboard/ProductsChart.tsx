import { PieChart, Pie, Cell, ResponsiveContainer, Tooltip, Legend } from 'recharts';
import { Card, CardContent, CardHeader, CardTitle } from '../ui/card';
import { Package } from 'lucide-react';
import { FullscreenChart } from '../ui/fullscreen-chart';
import { useResponsive } from '@/hooks/use-responsive';

interface ProductsChartProps {
  products: Array<{
    id: string;
    name: string;
    category: string;
    stock: number;
    price: number;
  }>;
  movements?: Array<{
    productId: string;
    type: 'entrada' | 'saida' | 'ajuste';
    unitPrice: number;
    quantity: number;
    date: Date;
  }>;
}

export function ProductsChart({ products, movements = [] }: ProductsChartProps) {
  const { isMobile } = useResponsive();
  
  // Se há poucos produtos (até 10), mostrar cada produto individualmente
  // Se há muitos, agrupar por categoria
  const shouldShowIndividual = products.length <= 10;
  
  let chartData: Array<{ name: string; quantidade: number; valor: number; fullName?: string }>;
  
  if (shouldShowIndividual) {
    // Mostrar cada produto individualmente
    chartData = products
      .filter(p => p.stock > 0) // Apenas produtos com estoque
      .map(product => {
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
        
        return {
          name: product.name.length > 15 ? product.name.substring(0, 15) + '...' : product.name,
          fullName: product.name,
          quantidade: product.stock,
          valor: totalValue
        };
      })
      .sort((a, b) => b.valor - a.valor); // Ordenar por valor total
  } else {
    // Agrupar produtos por categoria
    const categoryData = products.reduce((acc, product) => {
      const category = product.category || 'Sem Categoria';
      
      // Calcular preço efetivo para este produto
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
      
      const productValue = product.stock * effectivePrice;
      
      if (acc[category]) {
        acc[category].count += 1;
        acc[category].totalValue += productValue;
      } else {
        acc[category] = { count: 1, totalValue: productValue };
      }
      return acc;
    }, {} as Record<string, { count: number; totalValue: number }>);

    chartData = Object.entries(categoryData)
      .map(([name, data]) => ({
        name: name.length > 12 ? name.substring(0, 12) + '...' : name,
        quantidade: data.count,
        valor: data.totalValue
      }))
      .sort((a, b) => b.quantidade - a.quantidade);
  }

  const COLORS = ['#0088FE', '#00C49F', '#FFBB28', '#FF8042', '#8884D8', '#82CA9D', '#FF6B6B', '#4ECDC4'];

  const chartContent = chartData.length > 0 ? (
    <div className="w-full flex justify-center">
      <ResponsiveContainer width="100%" height={isMobile ? 300 : 280}>
        <PieChart>
          <Pie
            data={chartData}
            cx="50%"
            cy="50%"
            labelLine={false}
            label={({ name, quantidade }) => `${name}\n${quantidade} produtos`}
            outerRadius={isMobile ? 80 : 70}
            fill="#8884d8"
            dataKey="quantidade"
          >
            {chartData.map((entry, index) => (
              <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
            ))}
          </Pie>
          <Tooltip 
            content={({ active, payload }) => {
              if (active && payload && payload.length) {
                const data = payload[0].payload;
                return (
                  <div className="bg-white p-3 border border-gray-ected rounded-lg shadow-lg">
                    <p className="font-semibold text-gray-900">{data.fullName || data.name}</p>
                    <p className="text-sm text-gray-600">
                      {shouldShowIndividual ? `Estoque: ${data.quantidade} unidades` : `Quantidade: ${data.quantidade} produtos`}
                    </p>
                    <p className="text-sm font-bold text-green-600">Valor Total: R$ {data.valor.toFixed(2)}</p>
                  </div>
                );
              }
              return null;
            }}
          />
          <Legend 
            wrapperStyle={{ fontSize: '12px' }}
            iconSize={10}
          />
        </PieChart>
      </ResponsiveContainer>
    </div>
  ) : (
    <div className={`flex items-center justify-center ${isMobile ? 'h-[300px]' : 'h-[280px]'} text-muted-foreground`}>
      Nenhum produto cadastrado
    </div>
  );

  return (
    <Card className="col-span-1 lg:col-span-2 relative">
      <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
        <CardTitle className="text-sm sm:text-base font-medium">
          {shouldShowIndividual ? 'Distribuição de Produtos' : 'Produtos por Categoria'}
        </CardTitle>
        <Package className="h-4 w-4 text-muted-foreground" />
      </CardHeader>
      <CardContent className="px-2 sm:px-6">
        {chartContent}
      </CardContent>
      
      {/* Botão de Fullscreen */}
      <FullscreenChart 
        title={shouldShowIndividual ? 'Distribuição de Produtos' : 'Produtos por Categoria'} 
        icon={<Package className="h-5 w-5" />}
      >
        <ResponsiveContainer width="100%" height="100%">
          <PieChart>
            <Pie
              data={chartData}
              cx="50%"
              cy="50%"
              labelLine={false}
              label={({ name, quantidade }) => shouldShowIndividual ? `${name}\n${quantidade} un` : `${name}\n${quantidade} produtos`}
              outerRadius={120}
              fill="#8884d8"
              dataKey="quantidade"
            >
              {chartData.map((entry, index) => (
                <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
              ))}
            </Pie>
            <Tooltip 
              content={({ active, payload }) => {
                if (active && payload && payload.length) {
                  const data = payload[0].payload;
                  return (
                    <div className="bg-white p-3 border border-gray-200 rounded-lg shadow-lg">
                      <p className="font-semibold text-gray-900">{data.name}</p>
                      <p className="text-sm text-gray-600">Quantidade: {data.quantidade} produtos</p>
                      <p className="text-sm font-bold text-green-600">Valor Total: R$ {data.valor.toFixed(2)}</p>
                    </div>
                  );
                }
                return null;
              }}
            />
            <Legend />
          </PieChart>
        </ResponsiveContainer>
      </FullscreenChart>
    </Card>
  );
}
