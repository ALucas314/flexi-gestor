import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Minus, Plus, Trash2 } from "lucide-react";
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

interface CartItemProps {
  item: CartItem;
  product: any;
  availableBatches: BatchWithProduct[];
  onUpdateQuantity: (id: string, delta: number) => void;
  onRemove: (id: string, batchId?: string) => void;
  onBatchChange?: (itemId: string, currentBatchId: string | undefined, newBatchId: string, batchNumber: string) => void;
}

export const CartItemComponent = ({
  item,
  product,
  availableBatches,
  onUpdateQuantity,
  onRemove,
  onBatchChange,
}: CartItemProps) => {
  const batchesForProduct = availableBatches.filter((b) => b.product.id === item.id);

  return (
    <div key={`${item.id}-${item.selectedBatchId || ""}`} className="border rounded-lg p-3">
      <div className="flex justify-between items-start mb-2">
        <div className="flex-1">
          <h4 className="font-medium text-sm">{item.name}</h4>
          <p className="text-xs text-gray-500">R$ {item.price.toFixed(2)}</p>
        </div>
        <Button
          variant="ghost"
          size="sm"
          onClick={() => onRemove(item.id, item.selectedBatchId)}
          className="text-red-600 hover:text-red-700 hover:bg-red-50 h-10 w-10 p-0"
        >
          <Trash2 className="h-4 w-4" />
        </Button>
      </div>

      {/* Exibir/Editar Lote (se gerenciado por lote) */}
      {product?.managedByBatch && item.selectedBatchId && (
        <div className="mb-3">
          <div className="text-xs text-gray-600 mb-1">
            📋 Lote: {item.selectedBatchNumber || batchesForProduct.find((b) => b.id === item.selectedBatchId)?.batchNumber || "N/A"}
          </div>
          {batchesForProduct.length > 1 && onBatchChange && (
            <Select
              onValueChange={(val) => {
                const selected = batchesForProduct.find((b) => b.id === val);
                if (selected) {
                  onBatchChange(item.id, item.selectedBatchId, val, selected.batchNumber);
                }
              }}
              value={item.selectedBatchId || undefined}
            >
              <SelectTrigger className="h-9 text-xs">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {batchesForProduct.map((b) => (
                  <SelectItem key={b.id} value={b.id}>
                    {b.batchNumber} · qtd {b.quantity}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          )}
        </div>
      )}

      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <Button
            variant="outline"
            size="sm"
            onClick={() => onUpdateQuantity(item.id, -1)}
            className="h-9 w-9 p-0"
          >
            <Minus className="h-3 w-3" />
          </Button>
          <span className="w-8 text-center font-semibold">{item.quantity}</span>
          <Button
            variant="outline"
            size="sm"
            onClick={() => onUpdateQuantity(item.id, 1)}
            className="h-9 w-9 p-0"
          >
            <Plus className="h-3 w-3" />
          </Button>
        </div>
        <span className="font-bold text-indigo-600">
          R$ {(item.price * item.quantity).toFixed(2)}
        </span>
      </div>
    </div>
  );
};

