import { ComposedChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Legend, Bar, LabelList } from 'recharts';
import { Card, CardContent, CardHeader, CardTitle } from '../ui/card';
import { TrendingUp, TrendingDown, DollarSign, Calculator, X, Download } from 'lucide-react';
import { FullscreenChart } from '../ui/fullscreen-chart';
import { useConfig } from '@/contexts/ConfigContext';
import { useResponsive } from '@/hooks/use-responsive';
import { useState } from 'react';
import { Button } from '../ui/button';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '../ui/dialog';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '../ui/table';

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
  const { isMobile } = useResponsive();
  const [showDetails, setShowDetails] = useState(false);

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

  // Converter para array e ordenar por mês (todos os meses para detalhes)
  const allMonthsData = Object.values(monthlyData)
    .sort((a, b) => {
      const dateA = new Date(a.month.split('/')[1] + '/' + a.month.split('/')[0]);
      const dateB = new Date(b.month.split('/')[1] + '/' + b.month.split('/')[0]);
      return dateA.getTime() - dateB.getTime();
    })
    .map(data => ({
      ...data,
      diferencaQuantidade: data.compras - data.vendas,
      diferencaValor: data.comprasValor - data.vendasValor
    }));

  // Últimos 6 meses para o gráfico
  const chartData = allMonthsData.slice(-6);

  // Calcular totais gerais
  const totalGeral = allMonthsData.reduce((acc, month) => ({
    compras: acc.compras + month.comprasValor,
    vendas: acc.vendas + month.vendasValor,
    diferenca: acc.diferenca + month.diferencaValor
  }), { compras: 0, vendas: 0, diferenca: 0 });

  // Função para exportar para CSV
  const exportToCSV = () => {
    // Preparar dados CSV
    const csvData = [
      ['Mês', 'Compras (R$)', 'Vendas (R$)', 'Diferença (R$)'],
      ...allMonthsData.map(month => [
        month.month,
        month.comprasValor.toFixed(2).replace('.', ','),
        month.vendasValor.toFixed(2).replace('.', ','),
        month.diferencaValor.toFixed(2).replace('.', ',')
      ]),
      [
        'TOTAL GERAL',
        totalGeral.compras.toFixed(2).replace('.', ','),
        totalGeral.vendas.toFixed(2).replace('.', ','),
        totalGeral.diferenca.toFixed(2).replace('.', ',')
      ]
    ];

    // Converter para string CSV
    const csvContent = csvData.map(row => row.join(';')).join('\n');
    
    // Adicionar BOM para Excel reconhecer UTF-8
    const BOM = '\uFEFF';
    const csvWithBOM = BOM + csvContent;

    // Criar blob e fazer download
    const blob = new Blob([csvWithBOM], { type: 'text/csv;charset=utf-8;' });
    const link = document.createElement('a');
    const url = URL.createObjectURL(blob);
    
    link.setAttribute('href', url);
    link.setAttribute('download', `compras-vs-vendas-${new Date().toISOString().split('T')[0]}.csv`);
    link.style.visibility = 'hidden';
    
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    
    // Limpar URL do objeto
    URL.revokeObjectURL(url);
  };

  const chartContent = chartData.length > 0 ? (
    <ResponsiveContainer width="100%" height={isMobile ? 500 : 400}>
      <ComposedChart 
        data={chartData} 
        margin={isMobile 
          ? { top: 100, right: 20, left: 5, bottom: 10 }
          : { top: 70, right: 20, left: 0, bottom: 5 }
        }
      >
        <CartesianGrid strokeDasharray="3 3" />
        <XAxis 
          dataKey="month" 
          tick={{ fontSize: isMobile ? 11 : 12, fill: '#374151', fontWeight: 600 }}
        />
        <YAxis 
          yAxisId="left" 
          tick={{ fontSize: isMobile ? 10 : 12, fill: '#374151', fontWeight: 600 }}
        />
        <YAxis 
          yAxisId="right" 
          orientation="right" 
          tick={{ fontSize: isMobile ? 10 : 12, fill: '#374151', fontWeight: 600 }}
        />
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
          wrapperStyle={{ fontSize: isMobile ? '10px' : '12px', paddingTop: '10px' }}
          iconSize={isMobile ? 10 : 12}
        />
        <Bar yAxisId="left" dataKey="comprasValor" name="Compras (R$)" fill="#10b981" radius={[4, 4, 0, 0]}>
          <LabelList 
            dataKey="comprasValor" 
            position="top"
            offset={isMobile ? 3 : 5}
            formatter={(value: number) => {
              if (isMobile && value >= 1000) {
                return `R$ ${(value / 1000).toFixed(1)}k`;
              }
              return formatarMoeda(value);
            }}
            style={{ 
              fill: '#059669', 
              fontSize: isMobile ? '10px' : '10px', 
              fontWeight: '700' 
            }}
          />
        </Bar>
        <Bar yAxisId="left" dataKey="vendasValor" name="Vendas (R$)" fill="#ef4444" radius={[4, 4, 0, 0]}>
          <LabelList 
            dataKey="vendasValor" 
            position="top"
            offset={isMobile ? 3 : 5}
            formatter={(value: number) => {
              if (isMobile && value >= 1000) {
                return `R$ ${(value / 1000).toFixed(1)}k`;
              }
              return formatarMoeda(value);
            }}
            style={{ 
              fill: '#dc2626', 
              fontSize: isMobile ? '10px' : '10px', 
              fontWeight: '700' 
            }}
          />
        </Bar>
        <Line 
          yAxisId="right"
          type="monotone" 
          dataKey="diferencaValor" 
          name="Diferença (R$)" 
          stroke="#3b82f6" 
          strokeWidth={isMobile ? 2 : 3}
          dot={{ fill: '#3b82f6', r: isMobile ? 3 : 4 }}
        >
          <LabelList 
            dataKey="diferencaValor" 
            position="top"
            offset={isMobile ? 12 : 10}
            formatter={(value: number) => {
              if (isMobile && Math.abs(value) >= 1000) {
                return `${value >= 0 ? '+' : ''}R$ ${Math.abs(value / 1000).toFixed(1)}k`;
              }
              if (isMobile) {
                return `${value >= 0 ? '+' : ''}R$ ${Math.abs(value).toFixed(0)}`;
              }
              return formatarMoeda(value);
            }}
            style={{ 
              fill: '#2563eb', 
              fontSize: isMobile ? '11px' : '12px', 
              fontWeight: '700', 
              backgroundColor: 'white', 
              padding: isMobile ? '2px 3px' : '2px 4px', 
              borderRadius: '3px' 
            }}
          />
        </Line>
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
      <CardHeader className={`flex flex-row items-center justify-between space-y-0 ${isMobile ? 'p-4 pb-3' : 'pb-2'}`}>
        <CardTitle className={`${isMobile ? 'text-xs' : 'text-sm sm:text-base'} font-medium flex items-center gap-2`}>
          <DollarSign className={`${isMobile ? 'h-3 w-3' : 'h-4 w-4'} text-indigo-600 flex-shrink-0`} />
          <span className={isMobile ? 'leading-tight' : ''}>
            {isMobile ? 'Compras vs Vendas' : 'Compras vs Vendas por Mês (Diferença)'}
          </span>
        </CardTitle>
        <div className="flex items-center gap-2">
          <Button
            variant="outline"
            size={isMobile ? "sm" : "default"}
            onClick={() => setShowDetails(true)}
            className={`${isMobile ? 'h-7 px-2 text-xs' : 'h-9 px-3'} flex items-center gap-1.5`}
          >
            <Calculator className={`${isMobile ? 'h-3 w-3' : 'h-4 w-4'}`} />
            {!isMobile && <span>Detalhes</span>}
          </Button>
          <div className="flex items-center gap-2">
            <TrendingUp className={`${isMobile ? 'h-3 w-3' : 'h-4 w-4'} text-green-600 flex-shrink-0`} />
            <TrendingDown className={`${isMobile ? 'h-3 w-3' : 'h-4 w-4'} text-red-600 flex-shrink-0`} />
          </div>
        </div>
      </CardHeader>
      <CardContent className={isMobile ? "px-4 pr-6 py-4" : "px-2 sm:px-6"}>
        {chartContent}
      </CardContent>
      
      <FullscreenChart 
        title="Compras vs Vendas por Mês (Diferença)" 
        icon={<DollarSign className="h-5 w-5" />}
      >
        <ResponsiveContainer width="100%" height="100%">
          <ComposedChart 
            data={chartData} 
            margin={isMobile 
              ? { top: 100, right: 20, left: 5, bottom: 10 }
              : { top: 80, right: 30, left: 0, bottom: 5 }
            }
          >
            <CartesianGrid strokeDasharray="3 3" />
            <XAxis 
              dataKey="month" 
              tick={{ fontSize: isMobile ? 11 : 12, fill: '#374151', fontWeight: 600 }}
            />
            <YAxis 
              yAxisId="left" 
              tick={{ fontSize: isMobile ? 10 : 12, fill: '#374151', fontWeight: 600 }}
            />
            <YAxis 
              yAxisId="right" 
              orientation="right" 
              tick={{ fontSize: isMobile ? 10 : 12, fill: '#374151', fontWeight: 600 }}
            />
            <Tooltip 
              formatter={(value: number, name: string) => {
                if (name === 'comprasValor' || name === 'vendasValor' || name === 'diferencaValor') {
                  return [formatarMoeda(value), name === 'comprasValor' ? 'Compras (R$)' : name === 'vendasValor' ? 'Vendas (R$)' : 'Diferença (R$)'];
                }
                return [`${value} unidades`, name === 'compras' ? 'Compras (un)' : name === 'vendas' ? 'Vendas (un)' : 'Diferença (un)'];
              }}
            />
            <Legend 
              wrapperStyle={{ fontSize: isMobile ? '12px' : '12px', paddingTop: '10px' }}
              iconSize={isMobile ? 12 : 12}
            />
            <Bar yAxisId="left" dataKey="comprasValor" name="Compras (R$)" fill="#10b981" radius={[4, 4, 0, 0]}>
              <LabelList 
                dataKey="comprasValor" 
                position="top"
                offset={isMobile ? 3 : 5}
                formatter={(value: number) => {
                  if (isMobile && value >= 1000) {
                    return `R$ ${(value / 1000).toFixed(1)}k`;
                  }
                  return formatarMoeda(value);
                }}
                style={{ 
                  fill: '#059669', 
                  fontSize: isMobile ? '10px' : '10px', 
                  fontWeight: '700' 
                }}
              />
            </Bar>
            <Bar yAxisId="left" dataKey="vendasValor" name="Vendas (R$)" fill="#ef4444" radius={[4, 4, 0, 0]}>
              <LabelList 
                dataKey="vendasValor" 
                position="top"
                offset={isMobile ? 3 : 5}
                formatter={(value: number) => {
                  if (isMobile && value >= 1000) {
                    return `R$ ${(value / 1000).toFixed(1)}k`;
                  }
                  return formatarMoeda(value);
                }}
                style={{ 
                  fill: '#dc2626', 
                  fontSize: isMobile ? '10px' : '10px', 
                  fontWeight: '700' 
                }}
              />
            </Bar>
            <Line 
              yAxisId="right"
              type="monotone" 
              dataKey="diferencaValor" 
              name="Diferença (R$)" 
              stroke="#3b82f6" 
              strokeWidth={isMobile ? 2 : 3}
              dot={{ fill: '#3b82f6', r: isMobile ? 3 : 4 }}
            >
              <LabelList 
                dataKey="diferencaValor" 
                position="top"
                offset={isMobile ? 12 : 10}
                formatter={(value: number) => {
                  if (isMobile && Math.abs(value) >= 1000) {
                    return `${value >= 0 ? '+' : ''}R$ ${Math.abs(value / 1000).toFixed(1)}k`;
                  }
                  if (isMobile) {
                    return `${value >= 0 ? '+' : ''}R$ ${Math.abs(value).toFixed(0)}`;
                  }
                  return formatarMoeda(value);
                }}
                style={{ 
                  fill: '#2563eb', 
                  fontSize: isMobile ? '11px' : '12px', 
                  fontWeight: '700', 
                  backgroundColor: 'white', 
                  padding: isMobile ? '2px 3px' : '2px 4px', 
                  borderRadius: '3px' 
                }}
              />
            </Line>
          </ComposedChart>
        </ResponsiveContainer>
      </FullscreenChart>

      {/* Dialog com Detalhes Mensais e Total */}
      <Dialog open={showDetails} onOpenChange={setShowDetails}>
        <DialogContent className={`${isMobile ? 'max-w-[95vw]' : 'max-w-3xl'} max-h-[90vh] flex flex-col p-0 overflow-hidden !md:overflow-hidden`}>
          <div className="overflow-y-auto flex-1 px-6 pt-6 pb-6 min-h-0">
            <DialogHeader className="pb-4 border-b">
              <div className="flex items-center gap-4">
                <DialogTitle className="flex items-center gap-2 flex-1">
                  <Calculator className="h-5 w-5 text-indigo-600" />
                  Detalhes de Compras vs Vendas
                </DialogTitle>
                <Button
                  variant="outline"
                  size={isMobile ? "sm" : "default"}
                  onClick={exportToCSV}
                  className={`${isMobile ? 'h-8 px-2 text-xs' : 'h-9 px-3'} flex items-center gap-1.5 ml-auto mr-2`}
                >
                  <Download className={`${isMobile ? 'h-3 w-3' : 'h-4 w-4'}`} />
                  {!isMobile && <span>Exportar CSV</span>}
                </Button>
              </div>
            </DialogHeader>

            <div className="mt-6 space-y-4">
              {/* Tabela de Detalhes Mensais */}
              <div className="overflow-x-auto">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead className={`${isMobile ? 'text-xs' : 'text-sm'} font-semibold`}>Mês</TableHead>
                      <TableHead className={`${isMobile ? 'text-xs' : 'text-sm'} font-semibold text-right`}>Compras (R$)</TableHead>
                      <TableHead className={`${isMobile ? 'text-xs' : 'text-sm'} font-semibold text-right`}>Vendas (R$)</TableHead>
                      <TableHead className={`${isMobile ? 'text-xs' : 'text-sm'} font-semibold text-right`}>Diferença (R$)</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {allMonthsData.length > 0 ? (
                      <>
                        {allMonthsData.map((month, index) => (
                          <TableRow key={index}>
                            <TableCell className={`${isMobile ? 'text-xs' : 'text-sm'} font-medium`}>
                              {month.month}
                            </TableCell>
                            <TableCell className={`${isMobile ? 'text-xs' : 'text-sm'} text-right text-green-600`}>
                              {formatarMoeda(month.comprasValor)}
                            </TableCell>
                            <TableCell className={`${isMobile ? 'text-xs' : 'text-sm'} text-right text-red-600`}>
                              {formatarMoeda(month.vendasValor)}
                            </TableCell>
                            <TableCell className={`${isMobile ? 'text-xs' : 'text-sm'} text-right font-semibold ${
                              month.diferencaValor >= 0 ? 'text-blue-600' : 'text-orange-600'
                            }`}>
                              {month.diferencaValor >= 0 ? '+' : ''}{formatarMoeda(month.diferencaValor)}
                            </TableCell>
                          </TableRow>
                        ))}
                        {/* Linha de Total */}
                        <TableRow className="bg-gray-50 font-bold">
                          <TableCell className={`${isMobile ? 'text-xs' : 'text-sm'} font-bold`}>
                            TOTAL GERAL
                          </TableCell>
                          <TableCell className={`${isMobile ? 'text-xs' : 'text-sm'} text-right font-bold text-green-700`}>
                            {formatarMoeda(totalGeral.compras)}
                          </TableCell>
                          <TableCell className={`${isMobile ? 'text-xs' : 'text-sm'} text-right font-bold text-red-700`}>
                            {formatarMoeda(totalGeral.vendas)}
                          </TableCell>
                          <TableCell className={`${isMobile ? 'text-xs' : 'text-sm'} text-right font-bold ${
                            totalGeral.diferenca >= 0 ? 'text-blue-700' : 'text-orange-700'
                          }`}>
                            {totalGeral.diferenca >= 0 ? '+' : ''}{formatarMoeda(totalGeral.diferenca)}
                          </TableCell>
                        </TableRow>
                      </>
                    ) : (
                      <TableRow>
                        <TableCell colSpan={4} className="text-center text-muted-foreground py-8">
                          Nenhuma movimentação registrada ainda
                        </TableCell>
                      </TableRow>
                    )}
                  </TableBody>
                </Table>
              </div>

              {/* Resumo */}
              <div className={`${isMobile ? 'p-3' : 'p-4'} bg-gradient-to-r from-indigo-50 to-purple-50 rounded-lg border border-indigo-200`}>
                <h4 className={`${isMobile ? 'text-sm' : 'text-base'} font-semibold mb-2 text-gray-900`}>
                  📊 Resumo Geral
                </h4>
                <div className="grid grid-cols-3 gap-3">
                  <div>
                    <p className={`${isMobile ? 'text-xs' : 'text-sm'} text-gray-600 mb-1`}>Total Compras</p>
                    <p className={`${isMobile ? 'text-sm' : 'text-base'} font-bold text-green-600`}>
                      {formatarMoeda(totalGeral.compras)}
                    </p>
                  </div>
                  <div>
                    <p className={`${isMobile ? 'text-xs' : 'text-sm'} text-gray-600 mb-1`}>Total Vendas</p>
                    <p className={`${isMobile ? 'text-sm' : 'text-base'} font-bold text-red-600`}>
                      {formatarMoeda(totalGeral.vendas)}
                    </p>
                  </div>
                  <div>
                    <p className={`${isMobile ? 'text-xs' : 'text-sm'} text-gray-600 mb-1`}>Diferença Total</p>
                    <p className={`${isMobile ? 'text-sm' : 'text-base'} font-bold ${
                      totalGeral.diferenca >= 0 ? 'text-blue-600' : 'text-orange-600'
                    }`}>
                      {totalGeral.diferenca >= 0 ? '+' : ''}{formatarMoeda(totalGeral.diferenca)}
                    </p>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </Card>
  );
}

