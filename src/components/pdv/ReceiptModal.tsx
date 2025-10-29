import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { CheckCircle, Printer } from "lucide-react";

interface CartItem {
  id: string;
  name: string;
  price: number;
  quantity: number;
  sku: string;
}

interface ReceiptData {
  receiptNumber: string;
  date: string;
  items: CartItem[];
  total: number;
}

interface ReceiptModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  receiptData: ReceiptData | null;
}

export const ReceiptModal = ({ open, onOpenChange, receiptData }: ReceiptModalProps) => {
  if (!receiptData) return null;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-md sm:max-w-lg">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2 text-green-600">
            <CheckCircle className="h-6 w-6" />
            Venda Finalizada com Sucesso!
          </DialogTitle>
        </DialogHeader>

        <div className="space-y-4">
          {/* Cabeçalho da Receita */}
          <div className="border-b pb-4">
            <div className="text-center mb-3">
              <h2 className="text-2xl font-bold text-gray-900">📄 RECEITA</h2>
              <p className="text-sm text-gray-600">Flexi Gestor - Sistema de Gestão</p>
            </div>

            <div className="space-y-1 text-sm">
              <div className="flex justify-between">
                <span className="text-gray-600">Número:</span>
                <span className="font-semibold">{receiptData.receiptNumber}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-600">Data/Hora:</span>
                <span className="font-semibold">{receiptData.date}</span>
              </div>
            </div>
          </div>

          {/* Itens da Venda */}
          <div className="space-y-2">
            <h3 className="font-semibold text-gray-900">Itens:</h3>
            <div className="border rounded-lg p-3 space-y-2 max-h-64 overflow-y-auto">
              {receiptData.items.map((item, index) => (
                <div key={index} className="flex justify-between items-start pb-2 border-b last:border-0">
                  <div className="flex-1">
                    <p className="font-medium text-sm">{item.name}</p>
                    <p className="text-xs text-gray-500">
                      {item.quantity} x R$ {item.price.toFixed(2)}
                    </p>
                  </div>
                  <p className="font-semibold text-sm">R$ {(item.quantity * item.price).toFixed(2)}</p>
                </div>
              ))}
            </div>
          </div>

          {/* Total */}
          <div className="border-t pt-4">
            <div className="flex justify-between items-center">
              <span className="text-lg font-bold text-gray-900">TOTAL:</span>
              <span className="text-2xl font-bold text-green-600">R$ {receiptData.total.toFixed(2)}</span>
            </div>
          </div>

          {/* Botões de Ação */}
          <div className="space-y-2 pt-2">
            <Button
              className="w-full bg-blue-600 hover:bg-blue-700 text-white"
              onClick={() => window.print()}
            >
              <Printer className="mr-2 h-4 w-4" />
              Imprimir Receita
            </Button>

            <Button variant="outline" className="w-full" onClick={() => onOpenChange(false)}>
              Fechar
            </Button>
          </div>

          {/* Rodapé */}
          <div className="text-center text-xs text-gray-500 pt-2 border-t">
            <p>Obrigado pela preferência!</p>
            <p className="mt-1">💚 Flexi Gestor - Gestão Inteligente</p>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
};

