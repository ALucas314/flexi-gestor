import { PieChart, Pie, Cell, ResponsiveContainer, Tooltip, Legend } from 'recharts';
import { Card, CardContent, CardHeader, CardTitle } from '../ui/card';
import { Package } from 'lucide-react';
import { FullscreenChart } from '../ui/fullscreen-chart';

interface ProductsChartProps {
  products: Array<{
    id: string;
    name: string;
    category: string;
    stock: number;
    price: number;
  }>;
}

export function ProductsChart({ products }: ProductsChartProps) {
  // Agrupar produtos por categoria de forma correta
  const categoryData = products.reduce((acc, product) => {
    const category = product.category || 'Sem Categoria';
    if (acc[category]) {
      acc[category].count += 1;
      acc[category].totalValue += product.stock * product.price;
    } else {
      acc[category] = { count: 1, totalValue: product.stock * product.price };
    }
    return acc;
  }, {} as Record<string, { count: number; totalValue: number }>);

  const chartData = Object.entries(categoryData)
    .map(([name, data]) => ({
      name: name.length > 12 ? name.substring(0, 12) + '...' : name,
      quantidade: data.count,
      valor: data.totalValue
    }))
    .sort((a, b) => b.quantidade - a.quantidade);

  const COLORS = ['#0088FE', '#00C49F', '#FFBB28', '#FF8042', '#8884D8', '#82CA9D', '#FF6B6B', '#4ECDC4'];

  const chartContent = chartData.length > 0 ? (
    <div className="w-full flex justify-center">
      <ResponsiveContainer width="100%" height={300}>
        <PieChart>
          <Pie
            data={chartData}
            cx="50%"
            cy="50%"
            labelLine={false}
            label={({ name, quantidade }) => `${name}\n${quantidade} produtos`}
            outerRadius={80}
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
          <Legend 
            wrapperStyle={{ fontSize: '12px' }}
            iconSize={10}
          />
        </PieChart>
      </ResponsiveContainer>
    </div>
  ) : (
    <div className="flex items-center justify-center h-[300px] text-muted-foreground">
      Nenhum produto cadastrado
    </div>
  );

  return (
    <Card className="col-span-1 lg:col-span-2 relative">
      <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
        <CardTitle className="text-sm sm:text-base font-medium">Produtos por Categoria</CardTitle>
        <Package className="h-4 w-4 text-muted-foreground" />
      </CardHeader>
      <CardContent className="px-2 sm:px-6">
        {chartContent}
      </CardContent>
      
      {/* Botão de Fullscreen */}
      <FullscreenChart 
        title="Produtos por Categoria" 
        icon={<Package className="h-5 w-5" />}
      >
        <ResponsiveContainer width="100%" height="100%">
          <PieChart>
            <Pie
              data={chartData}
              cx="50%"
              cy="50%"
              labelLine={false}
              label={({ name, quantidade }) => `${name}\n${quantidade} produtos`}
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
