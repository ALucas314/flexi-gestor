import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { TrendingUp, TrendingDown, RotateCcw, Clock, ArrowRight, Package } from "lucide-react";

interface Movement {
  id: string;
  type: 'entrada' | 'saida' | 'ajuste';
  productName: string;
  description: string;
  total: number;
  date: Date;
}

interface RecentMovementsProps {
  movements: Movement[];
}

const getMovementIcon = (type: string) => {
  switch (type) {
    case 'entrada':
      return <TrendingUp className="w-4 h-4 text-blue-600" />;
    case 'saida':
      return <TrendingDown className="w-4 h-4 text-red-600" />;
    case 'ajuste':
      return <Package className="w-4 h-4 text-purple-600" />;
    default:
      return <Package className="w-4 h-4 text-neutral-600" />;
  }
};

const getMovementBadge = (type: string) => {
  switch (type) {
    case 'entrada':
      return <Badge variant="secondary" className="bg-blue-100 text-blue-700 border-blue-200 px-2 py-1 rounded-full text-xs font-medium">📥 Entrada</Badge>;
    case 'saida':
      return <Badge variant="secondary" className="bg-red-100 text-red-700 border-red-200 px-2 py-1 rounded-full text-xs font-medium">📤 Saída</Badge>;
    case 'ajuste':
      return <Badge variant="secondary" className="bg-purple-100 text-purple-700 border-purple-200 px-2 py-1 rounded-full text-xs font-medium">⚙️ Ajuste</Badge>;
    default:
      return <Badge variant="secondary" className="bg-neutral-100 text-neutral-700 border-neutral-200 px-2 py-1 rounded-full text-xs font-medium">❓ Desconhecido</Badge>;
  }
};

const getMovementStyles = (type: string) => {
  switch (type) {
    case 'entrada':
      return "border-l-blue-500 bg-blue-50 hover:bg-blue-100";
    case 'saida':
      return "border-l-red-500 bg-red-50 hover:bg-red-100";
    case 'ajuste':
      return "border-l-purple-500 bg-purple-50 hover:bg-purple-100";
    default:
      return "border-l-neutral-500 bg-neutral-50 hover:bg-neutral-100";
  }
};

export const RecentMovements = ({ movements }: RecentMovementsProps) => {
  // Pegar apenas as últimas 4 movimentações
  const recentMovements = movements.slice(0, 4);

  return (
    <Card className="bg-white border-0 shadow-lg rounded-2xl overflow-hidden">
      <CardHeader className="bg-gradient-to-r from-neutral-50 to-neutral-100 border-b border-neutral-200">
        <CardTitle className="text-xl font-bold text-neutral-900 flex items-center space-x-2">
          <div className="w-8 h-8 bg-purple-100 rounded-lg flex items-center justify-center">
            <Clock className="w-4 h-4 text-purple-600" />
          </div>
          <span>Movimentações Recentes</span>
        </CardTitle>
      </CardHeader>
      <CardContent className="p-6">
        {recentMovements.length === 0 ? (
          <div className="text-center py-12 text-neutral-500">
            <div className="w-16 h-16 bg-neutral-100 rounded-full flex items-center justify-center mx-auto mb-4">
              <Clock className="w-8 h-8 text-neutral-300" />
            </div>
            <p className="text-lg font-medium mb-2">Nenhuma movimentação</p>
            <p className="text-sm">As movimentações aparecerão aqui quando você começar a usar o sistema</p>
          </div>
        ) : (
          <div className="space-y-4">
            {recentMovements.map((movement) => (
              <div
                key={movement.id}
                className={`flex items-center justify-between p-4 rounded-xl border-l-4 transition-all duration-200 cursor-pointer ${getMovementStyles(movement.type)}`}
              >
                <div className="flex items-start space-x-4 flex-1">
                  {/* Ícone */}
                  <div className="w-10 h-10 bg-white rounded-lg flex items-center justify-center shadow-sm">
                    {getMovementIcon(movement.type)}
                  </div>
                  
                  {/* Informações */}
                  <div className="space-y-2 flex-1">
                    <div className="flex items-center space-x-3">
                      <h4 className="font-semibold text-neutral-900 text-sm">
                        {movement.productName}
                      </h4>
                      {getMovementBadge(movement.type)}
                    </div>
                    <p className="text-sm text-neutral-600 leading-relaxed">
                      {movement.description}
                    </p>
                    <div className="flex items-center space-x-2 text-xs text-neutral-500">
                      <Clock className="w-3 h-3" />
                      <span>{new Date(movement.date).toLocaleDateString('pt-BR', {
                        day: '2-digit',
                        month: '2-digit',
                        year: 'numeric',
                        hour: '2-digit',
                        minute: '2-digit'
                      })}</span>
                    </div>
                  </div>
                </div>
                
                {/* Valor */}
                <div className="text-right ml-4">
                  <p className="text-lg font-bold text-neutral-900">
                    R$ {movement.total.toFixed(2).replace('.', ',')}
                  </p>
                  <div className="w-8 h-8 bg-neutral-100 rounded-lg flex items-center justify-center mt-2">
                    <ArrowRight className="w-4 h-4 text-neutral-500" />
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
        
        {/* Footer com Estatísticas */}
        {recentMovements.length > 0 && (
          <div className="mt-6 pt-6 border-t border-neutral-200">
            <div className="flex items-center justify-between">
              <div className="text-sm text-neutral-500">
                <span>Mostrando as últimas {recentMovements.length} movimentações</span>
              </div>
              <button className="text-sm font-medium text-blue-600 hover:text-blue-700 transition-colors duration-200">
                Ver todas →
              </button>
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );
};