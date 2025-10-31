import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { ShoppingCart, Trash2, CreditCard, Receipt } from "lucide-react";
import { CartItemComponent } from "./CartItem";
import { PaymentSection } from "./PaymentSection";
import { BatchWithProduct } from "@/lib/batches";

interface CartItem {
  id: string;
  name: string;
  price: number;
  quantity: number;
  sku: string;
  selectedBatchId?: string;
  selectedBatchNumber?: string;
}

interface CartProps {
  cart: CartItem[];
  total: number;
  products: any[];
  availableBatches: BatchWithProduct[];
  paymentMethod: string;
  installments: number;
  isProcessingSale: boolean;
  onUpdateQuantity: (id: string, delta: number) => void;
  onRemove: (id: string, batchId?: string) => void;
  onBatchChange: (itemId: string, currentBatchId: string | undefined, newBatchId: string, batchNumber: string) => void;
  onPaymentMethodChange: (method: string) => void;
  onInstallmentsChange: (installments: number) => void;
  onClearCart: () => void;
  onFinalizeSale: () => void;
}

export const Cart = ({
  cart,
  total,
  products,
  availableBatches,
  paymentMethod,
  installments,
  isProcessingSale,
  onUpdateQuantity,
  onRemove,
  onBatchChange,
  onPaymentMethodChange,
  onInstallmentsChange,
  onClearCart,
  onFinalizeSale,
}: CartProps) => {
  return (
    <Card className="sticky top-24">
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <ShoppingCart className="h-5 w-5" />
          Carrinho ({cart.length})
        </CardTitle>
      </CardHeader>
      <CardContent>
        {cart.length === 0 ? (
          <div className="text-center py-8">
            <ShoppingCart className="h-12 w-12 mx-auto text-gray-300 mb-3" />
            <p className="text-gray-500 text-sm">Carrinho vazio</p>
          </div>
        ) : (
          <>
            <div className="space-y-3 max-h-[400px] overflow-y-auto mb-4">
              {cart.map((item) => {
                const product = products.find((p) => p.id === item.id);
                return (
                  <CartItemComponent
                    key={`${item.id}-${item.selectedBatchId || ""}`}
                    item={item}
                    product={product}
                    availableBatches={availableBatches}
                    onUpdateQuantity={onUpdateQuantity}
                    onRemove={onRemove}
                    onBatchChange={onBatchChange}
                  />
                );
              })}
            </div>

            {/* Total */}
            <div className="border-t pt-4 mb-4">
              <div className="flex justify-between items-center mb-2">
                <span className="text-gray-600">Subtotal:</span>
                <span className="font-semibold">R$ {total.toFixed(2)}</span>
              </div>
              <div className="flex justify-between items-center text-lg font-bold">
                <span>Total:</span>
                <span className="text-indigo-600">R$ {total.toFixed(2)}</span>
              </div>
            </div>

            {/* Pagamento */}
            <PaymentSection
              paymentMethod={paymentMethod}
              installments={installments}
              onPaymentMethodChange={onPaymentMethodChange}
              onInstallmentsChange={onInstallmentsChange}
            />

            {/* Botões de Ação */}
            <div className="space-y-2">
              <Button
                className="w-full bg-gradient-to-r from-indigo-600 to-indigo-700 hover:from-indigo-700 hover:to-indigo-800 text-white px-6 py-3 rounded-xl shadow-xl hover:shadow-2xl transition-all duration-200 transform hover:scale-105"
                onClick={onFinalizeSale}
                disabled={isProcessingSale}
              >
                {isProcessingSale ? (
                  <>
                    <Receipt className="w-5 h-5 mr-2 animate-pulse" />
                    Processando...
                  </>
                ) : (
                  <>
                    <CreditCard className="w-5 h-5 mr-2" />
                    Finalizar Venda
                  </>
                )}
              </Button>
              <Button variant="outline" className="w-full" onClick={onClearCart} disabled={isProcessingSale}>
                <Trash2 className="mr-2 h-4 w-4" />
                Limpar Carrinho
              </Button>
            </div>
          </>
        )}
      </CardContent>
    </Card>
  );
};

