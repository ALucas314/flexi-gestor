import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { BatchInfo } from "@/lib/batches";

interface BatchSelectionDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  product: any;
  batches: BatchInfo[];
  selectedBatchId: string;
  onBatchSelect: (batchId: string) => void;
  onConfirm: () => void;
}

export const BatchSelectionDialog = ({
  open,
  onOpenChange,
  product,
  batches,
  selectedBatchId,
  onBatchSelect,
  onConfirm,
}: BatchSelectionDialogProps) => {
  if (!product) return null;

  const availableBatches = batches.filter((b) => b.quantity > 0);

  const calculateDaysUntilExpiry = (expiryDate: string | null): number | null => {
    if (!expiryDate) return null;
    const expiry = new Date(expiryDate);
    return Math.ceil((expiry.getTime() - new Date().getTime()) / (1000 * 60 * 60 * 24));
  };

  const getBatchStatus = (batch: BatchInfo) => {
    const daysUntilExpiry = calculateDaysUntilExpiry(batch.expiryDate);
    if (daysUntilExpiry === null) return "⚪ Sem validade";
    if (daysUntilExpiry < 0) return "🔴 Vencido";
    if (daysUntilExpiry <= 30) return "🟡 Vence em breve";
    return "🟢 OK";
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle>📦 Selecionar Lote</DialogTitle>
        </DialogHeader>

        <div className="space-y-4">
          <div className="p-3 bg-indigo-50 rounded-lg">
            <p className="font-semibold text-gray-900">{product.name}</p>
            <p className="text-sm text-gray-600">SKU: {product.sku}</p>
          </div>

          <div className="space-y-2">
            <label className="text-sm font-medium">Selecione o lote:</label>
            <Select value={selectedBatchId} onValueChange={onBatchSelect}>
              <SelectTrigger>
                <SelectValue placeholder="Escolha um lote disponível" />
              </SelectTrigger>
              <SelectContent>
                {availableBatches.length === 0 ? (
                  <SelectItem value="" disabled>
                    Nenhum lote disponível
                  </SelectItem>
                ) : (
                  availableBatches.map((batch) => {
                    const expiryDate = batch.expiryDate ? new Date(batch.expiryDate) : null;
                    const status = getBatchStatus(batch);

                    return (
                      <SelectItem key={batch.id} value={batch.id}>
                        <div>
                          <div className="font-medium">
                            {status} Lote {batch.batchNumber}
                          </div>
                          <div className="text-xs text-muted-foreground">
                            {batch.quantity} unidades disponíveis
                            {expiryDate && ` • Validade: ${expiryDate.toLocaleDateString("pt-BR")}`}
                          </div>
                        </div>
                      </SelectItem>
                    );
                  })
                )}
              </SelectContent>
            </Select>
          </div>

          <div className="flex gap-2 justify-end pt-4 border-t">
            <Button
              variant="outline"
              onClick={() => {
                onOpenChange(false);
              }}
            >
              Cancelar
            </Button>
            <Button
              onClick={onConfirm}
              disabled={!selectedBatchId}
              className="bg-gradient-to-r from-indigo-600 to-purple-600 hover:from-indigo-700 hover:to-purple-700"
            >
              Adicionar ao Carrinho
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
};

