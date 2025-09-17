import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';
import { Card, CardContent, CardHeader, CardTitle } from '../ui/card';
import { BarChart3 } from 'lucide-react';
import { FullscreenChart } from '../ui/fullscreen-chart';

interface StockChartProps {
  products: Array<{
    id: string;
    name: string;
    stock: number;
    unitPrice: number;
  }>;
}

export function StockChart({ products }: StockChartProps) {
  // Pegar top 8 produtos por estoque (para melhor visualização)
  const topStockProducts = products
    .filter(p => p.stock > 0) // Só produtos com estoque
    .sort((a, b) => b.stock - a.stock)
    .slice(0, 8)
    .map(product => ({
      name: product.name.length > 12 ? product.name.substring(0, 12) + '...' : product.name,
      estoque: product.stock,
      valor: product.stock * product.unitPrice
    }));

  const chartContent = topStockProducts.length > 0 ? (
    <ResponsiveContainer width="100%" height={300}>
      <BarChart data={topStockProducts} layout="horizontal">
        <CartesianGrid strokeDasharray="3 3" />
        <XAxis type="number" />
        <YAxis type="category" dataKey="name" width={80} />
        <Tooltip 
          formatter={(value, name) => [
            name === 'estoque' ? value : `R$ ${Number(value).toFixed(2)}`,
            name === 'estoque' ? 'Estoque' : 'Valor Total'
          ]}
          labelFormatter={(label) => `Produto: ${label}`}
        />
        <Bar dataKey="estoque" fill="#8884d8" name="Estoque" />
        <Bar dataKey="valor" fill="#82ca9d" name="Valor Total" />
      </BarChart>
    </ResponsiveContainer>
  ) : (
    <div className="flex items-center justify-center h-[300px] text-muted-foreground">
      Nenhum produto em estoque
    </div>
  );

  return (
    <Card className="col-span-4 relative">
      <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
        <CardTitle className="text-sm font-medium">Top Produtos em Estoque</CardTitle>
        <BarChart3 className="h-4 w-4 text-muted-foreground" />
      </CardHeader>
      <CardContent>
        {chartContent}
      </CardContent>
      
      {/* Botão de Fullscreen */}
      <FullscreenChart 
        title="Top Produtos em Estoque" 
        icon={<BarChart3 className="h-5 w-5" />}
      >
        <ResponsiveContainer width="100%" height="100%">
          <BarChart data={topStockProducts} layout="horizontal">
            <CartesianGrid strokeDasharray="3 3" />
            <XAxis type="number" />
            <YAxis type="category" dataKey="name" width={120} />
            <Tooltip 
              formatter={(value, name) => [
                name === 'estoque' ? value : `R$ ${Number(value).toFixed(2)}`,
                name === 'estoque' ? 'Estoque' : 'Valor Total'
              ]}
              labelFormatter={(label) => `Produto: ${label}`}
            />
            <Bar dataKey="estoque" fill="#8884d8" name="Estoque" />
            <Bar dataKey="valor" fill="#82ca9d" name="Valor Total" />
          </BarChart>
        </ResponsiveContainer>
      </FullscreenChart>
    </Card>
  );
}
