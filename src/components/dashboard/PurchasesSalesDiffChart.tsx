import { ComposedChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Legend, Bar } from 'recharts';
import { Card, CardContent, CardHeader, CardTitle } from '../ui/card';
import { TrendingUp, TrendingDown, DollarSign } from 'lucide-react';
import { FullscreenChart } from '../ui/fullscreen-chart';
import { useConfig } from '@/contexts/ConfigContext';

interface PurchasesSalesDiffChartProps {
  movements: Array<{
    id: string;
    type: string;
    quantity: number;
    unitPrice: number;
    date: Date | string;
    total: number;
  }>;
}

export function PurchasesSalesDiffChart({ movements }: PurchasesSalesDiffChartProps) {
  const { formatarMoeda } = useConfig();

  // Agrupar movimentações por mês
  const monthlyData = movements.reduce((acc, movement) => {
    const date = new Date(movement.date);
    if (isNaN(date.getTime())) return acc;
    
    const monthKey = `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}`;
    const monthName = date.toLocaleDateString('pt-BR', { month: 'short', year: '2-digit' });
    
    const quantity = Number(movement.quantity) || 0;
    const total = Number(movement.total) || (Number(movement.unitPrice) || 0) * quantity;
    
    if (!acc[monthKey]) {
      acc[monthKey] = {
        month: monthName,
        compras: 0,
        vendas: 0,
        comprasValor: 0,
        vendasValor: 0
      };
    }
    
    if (movement.type === 'entrada') {
      acc[monthKey].compras += quantity;
      acc[monthKey].comprasValor += total;
    } else if (movement.type === 'saida') {
      acc[monthKey].vendas += quantity;
      acc[monthKey].vendasValor += total;
    }
    
    return acc;
  }, {} as Record<string, {
    month: string;
    compras: number;
    vendas: number;
    comprasValor: number;
    vendasValor: number;
  }>);

  // Converter para array e ordenar por mês
  const chartData = Object.values(monthlyData)
    .sort((a, b) => {
      const dateA = new Date(a.month.split('/')[1] + '/' + a.month.split('/')[0]);
      const dateB = new Date(b.month.split('/')[1] + '/' + b.month.split('/')[0]);
      return dateA.getTime() - dateB.getTime();
    })
    .slice(-6) // Últimos 6 meses
    .map(data => ({
      ...data,
      diferencaQuantidade: data.compras - data.vendas,
      diferencaValor: data.comprasValor - data.vendasValor
    }));

  const chartContent = chartData.length > 0 ? (
    <ResponsiveContainer width="100%" height={400}>
      <ComposedChart data={chartData}>
        <CartesianGrid strokeDasharray="3 3" />
        <XAxis dataKey="month" />
        <YAxis yAxisId="left" />
        <YAxis yAxisId="right" orientation="right" />
        <Tooltip 
          formatter={(value: number, name: string) => {
            if (name === 'comprasValor' || name === 'vendasValor' || name === 'diferencaValor') {
              return [formatarMoeda(value), name === 'comprasValor' ? 'Compras (R$)' : name === 'vendasValor' ? 'Vendas (R$)' : 'Diferença (R$)'];
            }
            return [`${value} unidades`, name === 'compras' ? 'Compras (un)' : name === 'vendas' ? 'Vendas (un)' : 'Diferença (un)'];
          }}
          labelFormatter={(label) => `Mês: ${label}`}
        />
        <Legend 
          wrapperStyle={{ fontSize: '12px', paddingTop: '10px' }}
        />
        <Bar yAxisId="left" dataKey="comprasValor" name="Compras (R$)" fill="#10b981" radius={[4, 4, 0, 0]} />
        <Bar yAxisId="left" dataKey="vendasValor" name="Vendas (R$)" fill="#ef4444" radius={[4, 4, 0, 0]} />
        <Line 
          yAxisId="right"
          type="monotone" 
          dataKey="diferencaValor" 
          name="Diferença (R$)" 
          stroke="#3b82f6" 
          strokeWidth={3}
          dot={{ fill: '#3b82f6', r: 4 }}
        />
      </ComposedChart>
    </ResponsiveContainer>
  ) : (
    <div className="flex flex-col items-center justify-center h-[400px] text-muted-foreground">
      <DollarSign className="h-12 w-12 mb-4 opacity-50" />
      <p>Nenhuma movimentação registrada ainda</p>
    </div>
  );

  return (
    <Card className="col-span-1 lg:col-span-6 relative">
      <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
        <CardTitle className="text-sm sm:text-base font-medium flex items-center gap-2">
          <DollarSign className="h-4 w-4 text-indigo-600" />
          Compras vs Vendas por Mês (Diferença)
        </CardTitle>
        <div className="flex items-center gap-2">
          <TrendingUp className="h-4 w-4 text-green-600" />
          <TrendingDown className="h-4 w-4 text-red-600" />
        </div>
      </CardHeader>
      <CardContent className="px-2 sm:px-6">
        {chartContent}
      </CardContent>
      
      <FullscreenChart 
        title="Compras vs Vendas por Mês (Diferença)" 
        icon={<DollarSign className="h-5 w-5" />}
      >
        <ResponsiveContainer width="100%" height="100%">
          <ComposedChart data={chartData}>
            <CartesianGrid strokeDasharray="3 3" />
            <XAxis dataKey="month" />
            <YAxis yAxisId="left" />
            <YAxis yAxisId="right" orientation="right" />
            <Tooltip 
              formatter={(value: number, name: string) => {
                if (name === 'comprasValor' || name === 'vendasValor' || name === 'diferencaValor') {
                  return [formatarMoeda(value), name === 'comprasValor' ? 'Compras (R$)' : name === 'vendasValor' ? 'Vendas (R$)' : 'Diferença (R$)'];
                }
                return [`${value} unidades`, name === 'compras' ? 'Compras (un)' : name === 'vendas' ? 'Vendas (un)' : 'Diferença (un)'];
              }}
            />
            <Legend />
            <Bar yAxisId="left" dataKey="comprasValor" name="Compras (R$)" fill="#10b981" radius={[4, 4, 0, 0]} />
            <Bar yAxisId="left" dataKey="vendasValor" name="Vendas (R$)" fill="#ef4444" radius={[4, 4, 0, 0]} />
            <Line 
              yAxisId="right"
              type="monotone" 
              dataKey="diferencaValor" 
              name="Diferença (R$)" 
              stroke="#3b82f6" 
              strokeWidth={3}
              dot={{ fill: '#3b82f6', r: 4 }}
            />
          </ComposedChart>
        </ResponsiveContainer>
      </FullscreenChart>
    </Card>
  );
}

