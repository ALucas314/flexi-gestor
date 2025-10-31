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

  // Agrupar por produto (somando compras e vendas)
  const itemsByProduct = movements.reduce((acc, movement) => {
    const productName = movement.productName || 'Produto sem nome';
    const quantity = Number(movement.quantity) || 0;
    const unitPrice = Number(movement.unitPrice) || 0;
    const total = Number(movement.total) || unitPrice * quantity;

    if (quantity <= 0 || total <= 0) return acc;
    
    if (acc[productName]) {
      acc[productName].quantity += quantity;
      acc[productName].total += total;
      acc[productName].totalUnitPrice += unitPrice * quantity; // Soma ponderada para calcular média
      acc[productName].count += 1;
    } else {
      acc[productName] = {
        productName,
        quantity,
        total,
        totalUnitPrice: unitPrice * quantity,
        count: 1
      };
    }
    
    return acc;
  }, {} as Record<string, { productName: string; quantity: number; total: number; totalUnitPrice: number; count: number }>);

  // Converter para array, calcular preço médio e ordenar por maior preço E maior quantidade
  const valueChartData = Object.values(itemsByProduct)
    .map(item => {
      const precoMedio = item.quantity > 0 ? item.totalUnitPrice / item.quantity : 0;
      return {
        name: item.productName.length > 12 ? item.productName.substring(0, 12) + '...' : item.productName,
        fullName: item.productName,
        quantidade: item.quantity,
        valor: item.total,
        precoMedio: precoMedio,
        count: item.count,
        // Score combinado: preço médio * quantidade (considera ambos os fatores)
        score: precoMedio * item.quantity
      };
    })
    .sort((a, b) => {
      // Ordenar primeiro por preço médio (maior preço), depois por quantidade (maior quantidade)
      if (b.precoMedio !== a.precoMedio) {
        return b.precoMedio - a.precoMedio;
      }
      return b.quantidade - a.quantidade;
    })
    .slice(0, isMobile ? 8 : 10) // Top 10
    .map(item => ({ 
      ...item, 
      name: isMobile 
        ? item.name.length > 8 ? item.name.substring(0, 8) + '...' : item.name
        : item.name
    }));

  const valueChartContent = valueChartData.length > 0 ? (
    <ResponsiveContainer width="100%" height={isMobile ? 500 : 350}>
      <BarChart 
        data={valueChartData} 
        margin={isMobile 
          ? { top: 100, right: 20, left: 5, bottom: 10 }
          : { top: 70, right: 20, left: 0, bottom: 5 }
        }
      >
        <CartesianGrid strokeDasharray="3 3" />
        <XAxis 
          dataKey="name" 
          tick={{ fontSize: isMobile ? 9 : 10, fill: '#374151', fontWeight: 600 }}
          angle={0}
          textAnchor="middle"
          interval={0}
        />
        <YAxis 
          tick={{ fontSize: isMobile ? 10 : 12, fill: '#374151', fontWeight: 600 }}
        />
        <Tooltip 
          content={({ active, payload }) => {
            if (active && payload && payload.length) {
              const data = payload[0].payload;
              return (
                <div className="bg-white p-3 border border-gray-200 rounded-lg shadow-lg">
                  <p className="font-semibold text-gray-900 mb-2">{data.fullName}</p>
                  <p className="text-sm text-gray-600">
                    <span className="font-medium">Preço Médio:</span> {formatarMoeda(data.precoMedio || 0)} / un
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
          radius={[4, 4, 0, 0]}
          fill="#3b82f6"
        >
          <LabelList 
            dataKey="valor" 
            position="top"
            offset={isMobile ? 3 : 5}
            formatter={(value: number) => {
              if (isMobile && value >= 1000) {
                return `R$ ${(value / 1000).toFixed(1)}k`;
              }
              return formatarMoeda(value);
            }}
            style={{ 
              fill: '#374151', 
              fontSize: isMobile ? '10px' : '10px', 
              fontWeight: '700' 
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
    <Card className="w-full h-full relative">
      <CardHeader className={`flex flex-row items-center justify-between space-y-0 ${isMobile ? 'p-4 pb-3' : 'pb-2'}`}>
        <CardTitle className={`${isMobile ? 'text-xs' : 'text-sm sm:text-base'} font-medium flex items-center gap-2`}>
          <TrendingUp className={`${isMobile ? 'h-3 w-3' : 'h-4 w-4'} text-indigo-600 flex-shrink-0`} />
          <span className={isMobile ? 'leading-tight' : ''}>
            {isMobile ? 'Ranking de Itens' : 'Ranking de Itens - Maior Valor (do maior para o menor)'}
          </span>
        </CardTitle>
        <div className="flex items-center gap-2" style={{ visibility: 'hidden', height: '36px' }}>
          <div></div>
        </div>
      </CardHeader>
      <CardContent className={isMobile ? "px-4 pr-6 py-4" : "px-2 sm:px-6"}>
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
            margin={isMobile 
              ? { top: 10, right: 60, left: 50, bottom: 10 }
              : { top: 5, right: 100, left: 200, bottom: 5 }
            }
          >
            <CartesianGrid strokeDasharray="3 3" />
            <XAxis 
              type="number" 
              tick={{ fontSize: isMobile ? 11 : 11 }}
            />
            <YAxis 
              dataKey="name" 
              type="category" 
              width={isMobile ? 50 : 200}
              tick={{ 
                fontSize: isMobile ? 11 : 11, 
                fill: '#374151', 
                fontWeight: isMobile ? 700 : 600 
              }}
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
              radius={[4, 4, 0, 0]}
              fill="#3b82f6"
            >
              <LabelList 
                dataKey="valor" 
                position={isMobile ? "top" : "right"}
                offset={isMobile ? 8 : 5}
                formatter={(value: number) => {
                  if (isMobile) {
                    if (value >= 1000) {
                      return `R$ ${(value / 1000).toFixed(1)}k`;
                    }
                    return `R$ ${value.toFixed(0)}`;
                  }
                  return formatarMoeda(value);
                }}
                style={{ 
                  fill: '#374151', 
                  fontSize: isMobile ? '10px' : '11px', 
                  fontWeight: isMobile ? '700' : '600' 
                }}
              />
            </Bar>
          </BarChart>
        </ResponsiveContainer>
      </FullscreenChart>
    </Card>
  );
}

