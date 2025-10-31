import { Input } from "@/components/ui/input";
import { Barcode, Plus, Search } from "lucide-react";
import { BatchWithProduct } from "@/lib/batches";

interface Movement {
  type: 'entrada' | 'saida' | 'ajuste';
  productId: string;
  unitPrice: number;
  date: Date;
}

interface Product {
  id: string;
  price: number;
}

interface BatchSearchProps {
  batchSearchTerm: string;
  productSearchTerm: string;
  results: BatchWithProduct[];
  movements?: Movement[];
  products?: Product[];
  onBatchSearchChange: (value: string) => void;
  onProductSearchChange: (value: string) => void;
  onBatchSelect: (batch: BatchWithProduct) => void;
}

export const BatchSearch = ({ 
  batchSearchTerm, 
  productSearchTerm, 
  results, 
  movements = [], 
  products = [], 
  onBatchSearchChange, 
  onProductSearchChange, 
  onBatchSelect 
}: BatchSearchProps) => {
  const calculateDaysUntilExpiry = (expiryDate: Date | string | null | undefined): number | null => {
    if (!expiryDate) return null;
    const expiry = expiryDate instanceof Date ? expiryDate : new Date(expiryDate);
    if (isNaN(expiry.getTime())) return null;
    return Math.ceil((expiry.getTime() - new Date().getTime()) / (1000 * 60 * 60 * 24));
  };

  // Função para obter o preço baseado na entrada (última entrada do produto)
  const getPriceFromEntry = (productId: string): number => {
    // Buscar a última entrada do produto
    const productEntries = movements
      .filter(m => m.type === 'entrada' && m.productId === productId)
      .sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());
    
    if (productEntries.length > 0) {
      // Retornar o preço unitário da última entrada
      return productEntries[0].unitPrice;
    }
    
    // Se não houver entrada, buscar do produto
    const product = products.find(p => p.id === productId);
    return product?.price || 0;
  };

  return (
    <div className="space-y-3">
      <label className="text-sm font-medium text-gray-700">📋 Buscar por Lote</label>
      
      {/* Campo para número do lote - OBRIGATÓRIO */}
      <div className="space-y-2">
        <label className="text-xs font-medium text-gray-600">
          Número do Lote <span className="text-red-500">*</span>
        </label>
        <div className="relative">
          <Barcode className="absolute left-3 top-1/2 transform -translate-y-1/2 h-5 w-5 text-gray-400" />
          <Input
            placeholder="Digite o número do lote..."
            value={batchSearchTerm}
            onChange={(e) => onBatchSearchChange(e.target.value)}
            className="pl-10 h-11 text-base border-2 focus:border-indigo-500"
            autoFocus
            onKeyDown={(e) => {
              if (e.key === "Enter" && results.length > 0) {
                onBatchSelect(results[0]);
                onBatchSearchChange("");
                onProductSearchChange("");
              }
            }}
          />
        </div>
        <p className="text-xs text-gray-500">Digite o número do lote (obrigatório)</p>
      </div>

      {/* Campo para produto (SKU ou nome) - OBRIGATÓRIO */}
      <div className="space-y-2">
        <label className="text-xs font-medium text-gray-600">
          Produto (SKU ou Nome) <span className="text-red-500">*</span>
        </label>
        <div className="relative">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-5 w-5 text-gray-400" />
          <Input
            placeholder="Digite o SKU ou nome do produto..."
            value={productSearchTerm}
            onChange={(e) => onProductSearchChange(e.target.value)}
            className="pl-10 h-11 text-base border-2 focus:border-indigo-500"
            onKeyDown={(e) => {
              if (e.key === "Enter" && results.length > 0) {
                onBatchSelect(results[0]);
                onBatchSearchChange("");
                onProductSearchChange("");
              }
            }}
          />
        </div>
        <p className="text-xs text-gray-500">Digite o código ou nome do produto (obrigatório)</p>
      </div>

      {/* Resultados de busca por lote - só mostrar se ambos os campos estiverem preenchidos */}
      {batchSearchTerm && productSearchTerm && results.length > 0 && (
        <div className="mt-3 space-y-2 max-h-[200px] overflow-y-auto">
          {results.map((batch) => {
            const expiryDate = batch.expiryDate 
              ? (batch.expiryDate instanceof Date ? batch.expiryDate : new Date(batch.expiryDate))
              : null;
            const daysUntilExpiry = calculateDaysUntilExpiry(batch.expiryDate);

            const handleSelect = () => {
              onBatchSelect(batch);
              onBatchSearchChange("");
              onProductSearchChange("");
            };

            return (
              <div
                key={batch.id}
                role="button"
                tabIndex={0}
                className="flex items-center justify-between p-3 border rounded-lg hover:bg-gray-50 cursor-pointer transition-colors active:bg-gray-100 focus:outline-none focus:ring-2 focus:ring-indigo-500"
                onClick={handleSelect}
                onKeyDown={(e) => {
                  if (e.key === "Enter" || e.key === " ") {
                    e.preventDefault();
                    handleSelect();
                  }
                }}
              >
                <div className="flex-1">
                  <div className="font-semibold text-gray-900">{batch.product.name}</div>
                  <div className="text-sm text-gray-600">
                    Lote: {batch.batchNumber} • SKU: {batch.product.sku} • Qtd: {batch.quantity}
                  </div>
                  {expiryDate && (
                    <div className="text-xs text-gray-500 mt-1">
                      Validade: {expiryDate.toLocaleDateString("pt-BR")}
                      {daysUntilExpiry !== null && daysUntilExpiry <= 30 && (
                        <span className={`ml-2 ${daysUntilExpiry < 0 ? "text-red-600" : "text-yellow-600"}`}>
                          {daysUntilExpiry < 0 ? "(Vencido)" : `(${daysUntilExpiry} dias)`}
                        </span>
                      )}
                    </div>
                  )}
                </div>
                <div className="text-right ml-4">
                  <div className="font-bold text-lg text-indigo-600">
                    R$ {getPriceFromEntry(batch.product.id).toFixed(2)}
                  </div>
                  <Plus className="h-5 w-5 text-indigo-600 mx-auto mt-1" />
                </div>
              </div>
            );
          })}
        </div>
      )}

      {batchSearchTerm && productSearchTerm && results.length === 0 && (
        <p className="text-sm text-gray-500 mt-2">
          Nenhum lote encontrado com esses critérios. Verifique o número do lote e o código/nome do produto.
        </p>
      )}
      {(!batchSearchTerm || !productSearchTerm) && (
        <p className="text-sm text-yellow-600 mt-2">
          ⚠️ Digite o número do lote E o código/nome do produto para buscar
        </p>
      )}
    </div>
  );
};
