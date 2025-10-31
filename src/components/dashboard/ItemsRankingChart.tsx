import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Legend, Cell } from 'recharts';
import { Card, CardContent, CardHeader, CardTitle } from '../ui/card';
import { TrendingUp, Package } from 'lucide-react';
import { FullscreenChart } from '../ui/fullscreen-chart';
import { useConfig } from '@/contexts/ConfigContext';

interface ItemsRankingChartProps {
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

export function ItemsRankingChart({ movements }: ItemsRankingChartProps) {
  const { formatarMoeda } = useConfig();

  // Agrupar por produto e tipo (compras e vendas separadamente)
  const itemsByProduct = movements.reduce((acc, movement) => {
    const productName = movement.productName || 'Produto sem nome';
    const quantity = Number(movement.quantity) || 0;
    const total = Number(movement.total) || (Number(movement.unitPrice) || 0) * quantity;
    const type = movement.type;

    if (quantity <= 0 || total <= 0) return acc;

    const key = `${type}-${productName}`;
    
    if (acc[key]) {
      acc[key].quantity += quantity;
      acc[key].total += total;
      acc[key].count += 1;
    } else {
      acc[key] = {
        productName,
        type,
        quantity,
        total,
        count: 1
      };
    }
    
    return acc;
  }, {} as Record<string, { productName: string; type: string; quantity: number; total: number; count: number }>);

  // Converter para array, separar compras e vendas, e ordenar do menor para o maior por valor
  const purchasesData = Object.values(itemsByProduct)
    .filter(item => item.type === 'entrada')
    .map(item => ({
      name: item.productName.length > 20 ? item.productName.substring(0, 20) + '...' : item.productName,
      fullName: item.productName,
      quantidade: item.quantity,
      valor: item.total,
      count: item.count,
      tipo: 'Compra'
    }))
    .sort((a, b) => a.valor - b.valor) // Ordenar do menor para o maior
    .slice(0, 10); // Top 10

  const salesData = Object.values(itemsByProduct)
    .filter(item => item.type === 'saida')
    .map(item => ({
      name: item.productName.length > 20 ? item.productName.substring(0, 20) + '...' : item.productName,
      fullName: item.productName,
      quantidade: item.quantity,
      valor: item.total,
      count: item.count,
      tipo: 'Venda'
    }))
    .sort((a, b) => a.valor - b.valor) // Ordenar do menor para o maior
    .slice(0, 10); // Top 10

  // Gráfico de Valor
  const valueChartData = [
    ...purchasesData.map(item => ({ ...item, name: `[Compra] ${item.name}`, tipo: 'Compra' })),
    ...salesData.map(item => ({ ...item, name: `[Venda] ${item.name}`, tipo: 'Venda' }))
  ].sort((a, b) => a.valor - b.valor).slice(0, 10);

  const valueChartContent = valueChartData.length > 0 ? (
    <ResponsiveContainer width="100%" height={400}>
      <BarChart 
        data={valueChartData} 
        layout="vertical"
        margin={{ top: 5, right: 30, left: 150, bottom: 5 }}
      >
        <CartesianGrid strokeDasharray="3 3" />
        <XAxis type="number" />
        <YAxis 
          dataKey="name" 
          type="category" 
          width={150}
          tick={{ fontSize: 11 }}
        />
        <Tooltip 
          content={({ active, payload }) => {
            if (active && payload && payload.length) {
              const data = payload[0].payload;
              return (
                <div className="bg-white p-3 border border-gray-200 rounded-lg shadow-lg">
                  <p className="font-semibold text-gray-900 mb-2">{data.fullName}</p>
                  <p className="text-sm text-gray-600">
                    <span className="font-medium">Tipo:</span> {data.tipo}
                  </p>
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
        <Legend 
          wrapperStyle={{ fontSize: '12px', paddingTop: '10px' }}
          iconSize={12}
        />
        <Bar 
          dataKey="valor" 
          name="Valor Total (R$)" 
          radius={[0, 4, 4, 0]}
        >
          {valueChartData.map((entry, index) => (
            <Cell key={`cell-${index}`} fill={entry.tipo === 'Compra' ? '#10b981' : '#ef4444'} />
          ))}
        </Bar>
      </BarChart>
    </ResponsiveContainer>
  ) : (
    <div className="flex flex-col items-center justify-center h-[400px] text-muted-foreground">
      <Package className="h-12 w-12 mb-4 opacity-50" />
      <p>Nenhuma movimentação registrada ainda</p>
    </div>
  );

  return (
    <Card className="col-span-1 lg:col-span-6 relative">
      <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
        <CardTitle className="text-sm sm:text-base font-medium flex items-center gap-2">
          <TrendingUp className="h-4 w-4 text-indigo-600" />
          Ranking de Itens - Maior Valor (do menor para o maior)
        </CardTitle>
        <Package className="h-4 w-4 text-muted-foreground" />
      </CardHeader>
      <CardContent className="px-2 sm:px-6">
        {valueChartContent}
      </CardContent>
      
      <FullscreenChart 
        title="Ranking de Itens - Maior Valor (do menor para o maior)" 
        icon={<TrendingUp className="h-5 w-5" />}
      >
        <ResponsiveContainer width="100%" height="100%">
          <BarChart 
            data={valueChartData.slice(0, 20)} 
            layout="vertical"
            margin={{ top: 5, right: 30, left: 200, bottom: 5 }}
          >
            <CartesianGrid strokeDasharray="3 3" />
            <XAxis type="number" />
            <YAxis 
              dataKey="name" 
              type="category" 
              width={200}
              tick={{ fontSize: 11 }}
            />
            <Tooltip 
              content={({ active, payload }) => {
                if (active && payload && payload.length) {
                  const data = payload[0].payload;
                  return (
                    <div className="bg-white p-3 border border-gray-200 rounded-lg shadow-lg">
                      <p className="font-semibold text-gray-900 mb-2">{data.fullName}</p>
                      <p className="text-sm text-gray-600">
                        <span className="font-medium">Tipo:</span> {data.tipo}
                      </p>
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
              radius={[0, 4, 4, 0]}
            >
              {valueChartData.map((entry, index) => (
                <Cell key={`cell-fullscreen-${index}`} fill={entry.tipo === 'Compra' ? '#10b981' : '#ef4444'} />
              ))}
            </Bar>
          </BarChart>
        </ResponsiveContainer>
      </FullscreenChart>
    </Card>
  );
}

