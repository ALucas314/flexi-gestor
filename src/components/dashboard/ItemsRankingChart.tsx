import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Legend, Cell, LabelList } from 'recharts';
import { Card, CardContent, CardHeader, CardTitle } from '../ui/card';
import { TrendingUp, Package } from 'lucide-react';
import { FullscreenChart } from '../ui/fullscreen-chart';
import { useConfig } from '@/contexts/ConfigContext';
import { useResponsive } from '@/hooks/use-responsive';

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
  const { isMobile } = useResponsive();

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

  // Converter para array, separar compras e vendas, e ordenar do maior para o menor por valor
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
    .sort((a, b) => b.valor - a.valor) // Ordenar do maior para o menor
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
    .sort((a, b) => b.valor - a.valor) // Ordenar do maior para o menor
    .slice(0, 10); // Top 10

  // Gráfico de Valor - ajustar nomes para mobile
  const valueChartData = [
    ...purchasesData.map(item => ({ 
      ...item, 
      name: isMobile 
        ? `C: ${item.name.length > 15 ? item.name.substring(0, 15) + '...' : item.name}` 
        : `[Compra] ${item.name}`, 
      tipo: 'Compra' 
    })),
    ...salesData.map(item => ({ 
      ...item, 
      name: isMobile 
        ? `V: ${item.name.length > 15 ? item.name.substring(0, 15) + '...' : item.name}` 
        : `[Venda] ${item.name}`, 
      tipo: 'Venda' 
    }))
  ].sort((a, b) => b.valor - a.valor).slice(0, isMobile ? 8 : 10);

  const valueChartContent = valueChartData.length > 0 ? (
    <ResponsiveContainer width="100%" height={isMobile ? 500 : 400}>
      <BarChart 
        data={valueChartData} 
        layout="vertical"
        margin={isMobile 
          ? { top: 5, right: 85, left: 60, bottom: 5 }
          : { top: 5, right: 80, left: 150, bottom: 5 }
        }
      >
        <CartesianGrid strokeDasharray="3 3" />
        <XAxis type="number" tick={{ fontSize: isMobile ? 9 : 11 }} />
        <YAxis 
          dataKey="name" 
          type="category" 
          width={isMobile ? 65 : 150}
          tick={{ fontSize: isMobile ? 8 : 11 }}
          height={isMobile ? undefined : undefined}
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
          wrapperStyle={{ fontSize: isMobile ? '10px' : '12px', paddingTop: '10px' }}
          iconSize={isMobile ? 10 : 12}
        />
        <Bar 
          dataKey="valor" 
          name="Valor Total (R$)" 
          radius={[0, 4, 4, 0]}
        >
          {valueChartData.map((entry, index) => (
            <Cell key={`cell-${index}`} fill={entry.tipo === 'Compra' ? '#10b981' : '#ef4444'} />
          ))}
          <LabelList 
            dataKey="valor" 
            position={isMobile ? "top" : "right"}
            offset={isMobile ? 5 : 5}
            formatter={(value: number) => {
              if (isMobile) {
                // Formato compacto para mobile: R$ 2k ao invés de R$ 2000.00
                if (value >= 1000) {
                  return `R$ ${(value / 1000).toFixed(1)}k`;
                }
                return `R$ ${value.toFixed(0)}`;
              }
              return formatarMoeda(value);
            }}
            style={{ 
              fill: '#374151', 
              fontSize: isMobile ? '8px' : '11px', 
              fontWeight: '600' 
            }}
          />
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
        <CardTitle className={`${isMobile ? 'text-xs' : 'text-sm sm:text-base'} font-medium flex items-center gap-2`}>
          <TrendingUp className={`${isMobile ? 'h-3 w-3' : 'h-4 w-4'} text-indigo-600 flex-shrink-0`} />
          <span className={isMobile ? 'leading-tight' : ''}>
            {isMobile ? 'Ranking de Itens' : 'Ranking de Itens - Maior Valor (do maior para o menor)'}
          </span>
        </CardTitle>
        <Package className={`${isMobile ? 'h-3 w-3' : 'h-4 w-4'} text-muted-foreground flex-shrink-0`} />
      </CardHeader>
      <CardContent className={isMobile ? "px-2 py-3" : "px-2 sm:px-6"}>
        {valueChartContent}
      </CardContent>
      
      <FullscreenChart 
        title="Ranking de Itens - Maior Valor (do maior para o menor)" 
        icon={<TrendingUp className="h-5 w-5" />}
      >
        <ResponsiveContainer width="100%" height="100%">
          <BarChart 
            data={valueChartData.slice(0, 20)} 
            layout="vertical"
            margin={{ top: 5, right: 100, left: 200, bottom: 5 }}
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
              <LabelList 
                dataKey="valor" 
                position="right"
                formatter={(value: number) => formatarMoeda(value)}
                style={{ fill: '#374151', fontSize: '11px', fontWeight: '600' }}
              />
            </Bar>
          </BarChart>
        </ResponsiveContainer>
      </FullscreenChart>
    </Card>
  );
}

