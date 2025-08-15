import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { TrendingUp, TrendingDown, RotateCcw } from "lucide-react";

const movements = [
  {
    id: 1,
    type: "entrada",
    description: "Compra de fornecedor - ABC Ltda",
    value: "R$ 2.450,00",
    date: "Hoje, 14:30",
    product: "Notebook Dell"
  },
  {
    id: 2,
    type: "saida",
    description: "Venda - Cliente João Silva",
    value: "R$ 890,00",
    date: "Hoje, 12:15",
    product: "Smartphone Samsung"
  },
  {
    id: 3,
    type: "ajuste",
    description: "Ajuste de estoque - Perda",
    value: "R$ 120,00",
    date: "Ontem, 16:45",
    product: "Fones de ouvido"
  },
  {
    id: 4,
    type: "saida",
    description: "Venda - Cliente Maria Santos",
    value: "R$ 1.200,00",
    date: "Ontem, 10:30",
    product: "Tablet Apple"
  }
];

const getMovementIcon = (type: string) => {
  switch (type) {
    case "entrada":
      return <TrendingUp className="w-4 h-4 text-green-600" />;
    case "saida":
      return <TrendingDown className="w-4 h-4 text-red-600" />;
    case "ajuste":
      return <RotateCcw className="w-4 h-4 text-yellow-600" />;
    default:
      return null;
  }
};

const getMovementBadge = (type: string) => {
  switch (type) {
    case "entrada":
      return <Badge variant="secondary" className="bg-green-100 text-green-700">Entrada</Badge>;
    case "saida":
      return <Badge variant="secondary" className="bg-red-100 text-red-700">Saída</Badge>;
    case "ajuste":
      return <Badge variant="secondary" className="bg-yellow-100 text-yellow-700">Ajuste</Badge>;
    default:
      return null;
  }
};

export const RecentMovements = () => {
  return (
    <Card className="bg-gradient-card shadow-card">
      <CardHeader>
        <CardTitle className="text-lg font-semibold">
          Movimentações Recentes
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        {movements.map((movement) => (
          <div
            key={movement.id}
            className="flex items-center justify-between p-3 rounded-lg border border-border hover:bg-accent transition-colors"
          >
            <div className="flex items-start gap-3">
              <div className="mt-1">
                {getMovementIcon(movement.type)}
              </div>
              <div className="space-y-1">
                <div className="flex items-center gap-2">
                  <p className="text-sm font-medium text-foreground">
                    {movement.product}
                  </p>
                  {getMovementBadge(movement.type)}
                </div>
                <p className="text-xs text-muted-foreground">
                  {movement.description}
                </p>
                <p className="text-xs text-muted-foreground">
                  {movement.date}
                </p>
              </div>
            </div>
            <div className="text-right">
              <p className="text-sm font-semibold text-foreground">
                {movement.value}
              </p>
            </div>
          </div>
        ))}
      </CardContent>
    </Card>
  );
};