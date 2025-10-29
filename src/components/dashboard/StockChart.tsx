import { Card, CardContent, CardHeader, CardTitle } from '../ui/card';
import { Package, TrendingUp } from 'lucide-react';
import { Badge } from '../ui/badge';

interface StockChartProps {
  products: Array<{
    id: string;
    name: string;
    stock: number;
    price: number;
  }>;
}

export function StockChart({ products }: StockChartProps) {
  // Pegar top 5 produtos por estoque
  const topStockProducts = products
    .filter(p => p.stock > 0)
    .sort((a, b) => b.stock - a.stock)
    .slice(0, 5);

  return (
    <Card className="col-span-1">
      <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
        <CardTitle className="text-sm sm:text-base font-medium">🏆 Top 5 Produtos em Estoque</CardTitle>
        <Package className="h-4 w-4 text-muted-foreground" />
      </CardHeader>
      <CardContent className="px-4 sm:px-6">
        {topStockProducts.length > 0 ? (
          <div className="space-y-3">
            {topStockProducts.map((product, index) => {
              const totalValue = product.stock * product.price;
              return (
                <div 
                  key={product.id} 
                  className="flex items-center justify-between p-3 bg-gradient-to-r from-blue-50 to-indigo-50 rounded-lg border border-blue-200 hover:shadow-md transition-all"
                >
                  <div className="flex items-center gap-3 flex-1">
                    <div className="flex items-center justify-center w-8 h-8 bg-gradient-to-br from-indigo-600 to-indigo-700 rounded-lg text-white font-bold text-sm">
                      {index + 1}º
                    </div>
                    <div className="flex-1">
                      <p className="font-semibold text-gray-900 text-sm">{product.name}</p>
                      <div className="flex items-center gap-2 mt-1">
                        <Badge variant="outline" className="text-xs">
                          {product.stock} unidades
                        </Badge>
                        <span className="text-xs text-gray-600">
                          R$ {product.price.toFixed(2)} / un
                        </span>
                      </div>
                    </div>
                  </div>
                  <div className="text-right">
                    <p className="font-bold text-green-600">
                      R$ {totalValue.toFixed(2)}
                    </p>
                    <p className="text-xs text-gray-500">Total</p>
                  </div>
                </div>
              );
            })}
          </div>
        ) : (
          <div className="flex flex-col items-center justify-center py-12 text-muted-foreground">
            <Package className="h-12 w-12 text-gray-300 mb-3" />
            <p className="text-sm">Nenhum produto em estoque</p>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
