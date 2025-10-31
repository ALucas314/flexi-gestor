import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, LabelList } from 'recharts';
import { Card, CardContent, CardHeader, CardTitle } from '../ui/card';
import { TrendingUp } from 'lucide-react';
import { FullscreenChart } from '../ui/fullscreen-chart';

interface SalesChartProps {
  movements: Array<{
    id: string;
    type: string;
    quantity: number;
    unitPrice: number;
    date: Date;
    productName: string;
    total: number;
  }>;
}

export function SalesChart({ movements }: SalesChartProps) {
  // Agrupar vendas por mês de forma correta
  const monthlySales = movements
    .filter(m => m.type === 'saida')
    .reduce((acc, movement) => {
      // Validar se quantity é um número válido
      const quantity = Number(movement.quantity) || 0;
      
      if (quantity <= 0) return acc;
      
      const date = new Date(movement.date);
      // Verificar se a data é válida
      if (isNaN(date.getTime())) return acc;
      
      const monthKey = `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}`;
      const monthName = date.toLocaleDateString('pt-BR', { month: 'short', year: '2-digit' });
      
      if (acc[monthKey]) {
        acc[monthKey].quantity += quantity;
        acc[monthKey].count += 1;
      } else {
        acc[monthKey] = { quantity, count: 1, monthName };
      }
      return acc;
    }, {} as Record<string, { quantity: number; count: number; monthName: string }>);

  // Ordenar por mês e pegar últimos 6 meses
  const chartData = Object.entries(monthlySales)
    .sort(([a], [b]) => a.localeCompare(b))
    .slice(-6)
    .map(([_, data]) => ({
      month: data.monthName,
      vendas: data.quantity, // Quantidade de unidades vendidas
      quantidade: data.count
    }));

  const chartContent = chartData.length > 0 ? (
    <ResponsiveContainer width="100%" height={300}>
      <BarChart data={chartData} barCategoryGap="20%">
        <CartesianGrid strokeDasharray="3 3" />
        <XAxis dataKey="month" />
        <YAxis />
        <Tooltip 
          formatter={(value, name) => [
            name === 'vendas' ? `${value} unidades` : value,
            name === 'vendas' ? 'Quantidade Vendida' : 'Número de Vendas'
          ]}
          labelFormatter={(label) => `Mês: ${label}`}
        />
        <Bar 
          dataKey="vendas" 
          fill="#3b82f6" 
          radius={[4, 4, 0, 0]}
          name="Quantidade Vendida"
          barSize={180}
        >
          <LabelList 
            dataKey="vendas" 
            position="top"
            formatter={(value: number) => `${value} un`}
            style={{ 
              fill: '#2563eb', 
              fontSize: '10px', 
              fontWeight: '700' 
            }}
          />
        </Bar>
      </BarChart>
    </ResponsiveContainer>
  ) : (
    <div className="flex items-center justify-center h-[300px] text-muted-foreground">
      Nenhuma venda registrada ainda
    </div>
  );

  return (
    <Card className="w-full h-full relative">
      <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
        <CardTitle className="text-sm sm:text-base font-medium">Quantidade de Vendas Mensais</CardTitle>
        <TrendingUp className="h-4 w-4 text-muted-foreground" />
      </CardHeader>
      <CardContent className="px-2 sm:px-6">
        {chartContent}
      </CardContent>
      
      {/* Botão de Fullscreen */}
      <FullscreenChart 
        title="Quantidade de Vendas Mensais" 
        icon={<TrendingUp className="h-5 w-5" />}
      >
        <ResponsiveContainer width="100%" height="100%">
          <BarChart data={chartData} barCategoryGap="20%">
            <CartesianGrid strokeDasharray="3 3" />
            <XAxis dataKey="month" />
            <YAxis />
            <Tooltip 
              formatter={(value, name) => [
                name === 'vendas' ? `${value} unidades` : value,
                name === 'vendas' ? 'Quantidade Vendida' : 'Número de Vendas'
              ]}
              labelFormatter={(label) => `Mês: ${label}`}
            />
            <Bar 
              dataKey="vendas" 
              fill="#3b82f6" 
              radius={[4, 4, 0, 0]}
              name="Quantidade Vendida"
              barSize={180}
            >
              <LabelList 
                dataKey="vendas" 
                position="top"
                formatter={(value: number) => `${value} un`}
                style={{ 
                  fill: '#2563eb', 
                  fontSize: '10px', 
                  fontWeight: '700' 
                }}
              />
            </Bar>
          </BarChart>
        </ResponsiveContainer>
      </FullscreenChart>
    </Card>
  );
}
