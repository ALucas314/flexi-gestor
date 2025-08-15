import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Plus, ShoppingCart, TrendingUp, TrendingDown, Package } from "lucide-react";

const quickActions = [
  {
    title: "Novo Produto",
    description: "Cadastrar produto no estoque",
    icon: <Package className="w-5 h-5" />,
    color: "bg-blue-500 hover:bg-blue-600"
  },
  {
    title: "Registrar Venda",
    description: "Nova venda de produtos",
    icon: <ShoppingCart className="w-5 h-5" />,
    color: "bg-green-500 hover:bg-green-600"
  },
  {
    title: "Entrada Estoque",
    description: "Compra de fornecedor",
    icon: <TrendingUp className="w-5 h-5" />,
    color: "bg-purple-500 hover:bg-purple-600"
  },
  {
    title: "Ajuste Estoque",
    description: "Corrigir quantidade",
    icon: <TrendingDown className="w-5 h-5" />,
    color: "bg-orange-500 hover:bg-orange-600"
  }
];

export const QuickActions = () => {
  return (
    <Card className="bg-gradient-card shadow-card">
      <CardHeader>
        <CardTitle className="text-lg font-semibold">
          Ações Rápidas
        </CardTitle>
      </CardHeader>
      <CardContent className="grid grid-cols-1 sm:grid-cols-2 gap-3">
        {quickActions.map((action, index) => (
          <Button
            key={index}
            variant="outline"
            className="h-auto p-4 flex flex-col items-start gap-2 hover:shadow-card-hover transition-all duration-200"
          >
            <div className={`p-2 rounded-lg text-white ${action.color}`}>
              {action.icon}
            </div>
            <div className="text-left">
              <p className="font-medium text-sm text-foreground">
                {action.title}
              </p>
              <p className="text-xs text-muted-foreground">
                {action.description}
              </p>
            </div>
          </Button>
        ))}
      </CardContent>
    </Card>
  );
};