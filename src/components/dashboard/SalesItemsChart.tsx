import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Legend } from 'recharts';
import { Card, CardContent, CardHeader, CardTitle } from '../ui/card';
import { TrendingDown, DollarSign } from 'lucide-react';
import { FullscreenChart } from '../ui/fullscreen-chart';
import { useConfig } from '@/contexts/ConfigContext';

interface SalesItemsChartProps {
  movements: Array<{
    id: string;
    type: string;
    quantity: number;
    unitPrice: number;
    date: Date | string;
    productName: string;
    total: number;
  }>;
}

export function SalesItemsChart({ movements }: SalesItemsChartProps) {
  const { formatarMoeda, converterMoeda, moeda } = useConfig();

  // Filtrar apenas vendas (saídas) e agrupar por produto
  const salesByProduct = movements
    .filter(m => m.type === 'saida')
    .reduce((acc, movement) => {
      const productName = movement.productName || 'Produto sem nome';
      const quantity = Number(movement.quantity) || 0;
      const total = Number(movement.total) || (Number(movement.unitPrice) || 0) * quantity;

      if (quantity <= 0 || total <= 0) return acc;

      if (acc[productName]) {
        acc[productName].quantity += quantity;
        acc[productName].total += total;
        acc[productName].count += 1;
      } else {
        acc[productName] = {
          productName,
          quantity,
          total,
          count: 1
        };
      }
      return acc;
    }, {} as Record<string, { productName: string; quantity: number; total: number; count: number }>);

  // Converter para array e ordenar do menor para o maior (por valor total)
  const chartData = Object.values(salesByProduct)
    .map(item => ({
      name: item.productName.length > 20 ? item.productName.substring(0, 20) + '...' : item.productName,
      fullName: item.productName,
      quantidade: item.quantity,
      valor: item.total,
      count: item.count
    }))
    .sort((a, b) => a.valor - b.valor); // Ordenar do menor para o maior

  // Pegar top 10 itens para o gráfico
  const displayData = chartData.slice(0, 10);

  const chartContent = displayData.length > 0 ? (
    <ResponsiveContainer width="100%" height={400}>
      <BarChart 
        data={displayData} 
        layout="vertical"
        margin={{ top: 5, right: 30, left: 20, bottom: 5 }}
      >
        <CartesianGrid strokeDasharray="3 3" />
        <XAxis type="number" />
        <YAxis 
          dataKey="name" 
          type="category" 
          width={150}
          tick={{ fontSize: 12 }}
        />
        <Tooltip 
          content={({ active, payload }) => {
            if (active && payload && payload.length) {
              const data = payload[0].payload;
              return (
                <div className="bg-white p-3 border border-gray-200 rounded-lg shadow-lg">
                  <p className="font-semibold text-gray-900 mb-2">{data.fullName}</p>
                  <p className="text-sm text-gray-600">
                    <span className="font-medium">Quantidade:</span> {data.quantidade.toLocaleString('pt-BR')} unidades
                  </p>
                  <p className="text-sm text-gray-600">
                    <span className="font-medium">Valor Total:</span> {formatarMoeda(data.valor)}
                  </p>
                  <p className="text-sm text-gray-500 mt-1">
                    {data.count} {data.count === 1 ? 'venda' : 'vendas'}
                  </p>
                </div>
              );
            }
            return null;
          }}
        />
        <Legend 
          wrapperStyle={{ fontSize: '12px', paddingTop: '10px' }}
          iconSize={12}
        />
        <Bar 
          dataKey="valor" 
          name="Valor Total (R$)" 
          fill="#ef4444" 
          radius={[0, 4, 4, 0]}
        />
      </BarChart>
    </ResponsiveContainer>
  ) : (
    <div className="flex flex-col items-center justify-center h-[400px] text-muted-foreground">
      <TrendingDown className="h-12 w-12 mb-4 opacity-50" />
      <p>Nenhuma venda registrada ainda</p>
    </div>
  );

  // Gráfico de quantidade
  const quantityChartData = Object.values(salesByProduct)
    .map(item => ({
      name: item.productName.length > 20 ? item.productName.substring(0, 20) + '...' : item.productName,
      fullName: item.productName,
      quantidade: item.quantity,
      valor: item.total,
      count: item.count
    }))
    .sort((a, b) => a.quantidade - b.quantidade) // Ordenar do menor para o maior por quantidade
    .slice(0, 10);

  const quantityChartContent = quantityChartData.length > 0 ? (
    <ResponsiveContainer width="100%" height={400}>
      <BarChart 
        data={quantityChartData} 
        layout="vertical"
        margin={{ top: 5, right: 30, left: 20, bottom: 5 }}
      >
        <CartesianGrid strokeDasharray="3 3" />
        <XAxis type="number" />
        <YAxis 
          dataKey="name" 
          type="category" 
          width={150}
          tick={{ fontSize: 12 }}
        />
        <Tooltip 
          content={({ active, payload }) => {
            if (active && payload && payload.length) {
              const data = payload[0].payload;
              return (
                <div className="bg-white p-3 border border-gray-200 rounded-lg shadow-lg">
                  <p className="font-semibold text-gray-900 mb-2">{data.fullName}</p>
                  <p className="text-sm text-gray-600">
                    <span className="font-medium">Quantidade:</span> {data.quantidade.toLocaleString('pt-BR')} unidades
                  </p>
                  <p className="text-sm text-gray-600">
                    <span className="font-medium">Valor Total:</span> {formatarMoeda(data.valor)}
                  </p>
                  <p className="text-sm text-gray-500 mt-1">
                    {data.count} {data.count === 1 ? 'venda' : 'vendas'}
                  </p>
                </div>
              );
            }
            return null;
          }}
        />
        <Legend 
          wrapperStyle={{ fontSize: '12px', paddingTop: '10px' }}
          iconSize={12}
        />
        <Bar 
          dataKey="quantidade" 
          name="Quantidade (unidades)" 
          fill="#f59e0b" 
          radius={[0, 4, 4, 0]}
        />
      </BarChart>
    </ResponsiveContainer>
  ) : (
    <div className="flex flex-col items-center justify-center h-[400px] text-muted-foreground">
      <TrendingDown className="h-12 w-12 mb-4 opacity-50" />
      <p>Nenhuma venda registrada ainda</p>
    </div>
  );

  return (
    <>
      {/* Gráfico de Valor */}
      <Card className="col-span-1 lg:col-span-3 relative">
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <CardTitle className="text-sm sm:text-base font-medium flex items-center gap-2">
            <DollarSign className="h-4 w-4 text-red-600" />
            Vendas por Valor (do menor para o maior)
          </CardTitle>
          <TrendingDown className="h-4 w-4 text-muted-foreground" />
        </CardHeader>
        <CardContent className="px-2 sm:px-6">
          {chartContent}
        </CardContent>
        
        <FullscreenChart 
          title="Vendas por Valor (do menor para o maior)" 
          icon={<DollarSign className="h-5 w-5" />}
        >
          <ResponsiveContainer width="100%" height="100%">
            <BarChart 
              data={chartData.slice(0, 20)} 
              layout="vertical"
              margin={{ top: 5, right: 30, left: 20, bottom: 5 }}
            >
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis type="number" />
              <YAxis 
                dataKey="name" 
                type="category" 
                width={200}
                tick={{ fontSize: 12 }}
              />
              <Tooltip 
                content={({ active, payload }) => {
                  if (active && payload && payload.length) {
                    const data = payload[0].payload;
                    return (
                      <div className="bg-white p-3 border border-gray-200 rounded-lg shadow-lg">
                        <p className="font-semibold text-gray-900 mb-2">{data.fullName}</p>
                        <p className="text-sm text-gray-600">
                          <span className="font-medium">Quantidade:</span> {data.quantidade.toLocaleString('pt-BR')} unidades
                        </p>
                        <p className="text-sm text-gray-600">
                          <span className="font-medium">Valor Total:</span> {formatarMoeda(data.valor)}
                        </p>
                      </div>
                    );
                  }
                  return null;
                }}
              />
              <Legend />
              <Bar 
                dataKey="valor" 
                name="Valor Total (R$)" 
                fill="#ef4444" 
                radius={[0, 4, 4, 0]}
              />
            </BarChart>
          </ResponsiveContainer>
        </FullscreenChart>
      </Card>

      {/* Gráfico de Quantidade */}
      <Card className="col-span-1 lg:col-span-3 relative">
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <CardTitle className="text-sm sm:text-base font-medium flex items-center gap-2">
            <TrendingDown className="h-4 w-4 text-orange-600" />
            Vendas por Quantidade (do menor para o maior)
          </CardTitle>
          <TrendingDown className="h-4 w-4 text-muted-foreground" />
        </CardHeader>
        <CardContent className="px-2 sm:px-6">
          {quantityChartContent}
        </CardContent>
        
        <FullscreenChart 
          title="Vendas por Quantidade (do menor para o maior)" 
          icon={<TrendingDown className="h-5 w-5" />}
        >
          <ResponsiveContainer width="100%" height="100%">
            <BarChart 
              data={Object.values(salesByProduct)
                .map(item => ({
                  name: item.productName.length > 20 ? item.productName.substring(0, 20) + '...' : item.productName,
                  fullName: item.productName,
                  quantidade: item.quantity,
                  valor: item.total,
                  count: item.count
                }))
                .sort((a, b) => a.quantidade - b.quantidade)
                .slice(0, 20)} 
              layout="vertical"
              margin={{ top: 5, right: 30, left: 20, bottom: 5 }}
            >
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis type="number" />
              <YAxis 
                dataKey="name" 
                type="category" 
                width={200}
                tick={{ fontSize: 12 }}
              />
              <Tooltip 
                content={({ active, payload }) => {
                  if (active && payload && payload.length) {
                    const data = payload[0].payload;
                    return (
                      <div className="bg-white p-3 border border-gray-200 rounded-lg shadow-lg">
                        <p className="font-semibold text-gray-900 mb-2">{data.fullName}</p>
                        <p className="text-sm text-gray-600">
                          <span className="font-medium">Quantidade:</span> {data.quantidade.toLocaleString('pt-BR')} unidades
                        </p>
                        <p className="text-sm text-gray-600">
                          <span className="font-medium">Valor Total:</span> {formatarMoeda(data.valor)}
                        </p>
                      </div>
                    );
                  }
                  return null;
                }}
              />
              <Legend />
              <Bar 
                dataKey="quantidade" 
                name="Quantidade (unidades)" 
                fill="#f59e0b" 
                radius={[0, 4, 4, 0]}
              />
            </BarChart>
          </ResponsiveContainer>
        </FullscreenChart>
      </Card>
    </>
  );
}

