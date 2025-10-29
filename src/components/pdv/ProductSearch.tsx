import { Input } from "@/components/ui/input";
import { Search, Plus } from "lucide-react";

interface Product {
  id: string;
  name: string;
  sku: string;
  price: number;
  stock: number;
}

interface Movement {
  type: 'entrada' | 'saida' | 'ajuste';
  productId: string;
  unitPrice: number;
  date: Date;
}

interface ProductSearchProps {
  searchTerm: string;
  results: Product[];
  movements?: Movement[];
  products?: Product[];
  onSearchChange: (value: string) => void;
  onProductSelect: (product: Product) => void;
}

export const ProductSearch = ({ searchTerm, results, movements = [], products = [], onSearchChange, onProductSelect }: ProductSearchProps) => {
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
    <div className="space-y-2">
      <label className="text-sm font-medium text-gray-700">📦 Buscar por Código ou Nome do Produto</label>
      <div className="relative">
        <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-5 w-5 text-gray-400" />
        <Input
          placeholder="Digite o código (SKU) ou nome do produto..."
          value={searchTerm}
          onChange={(e) => onSearchChange(e.target.value)}
          className="pl-10 h-12 text-base"
          onKeyDown={(e) => {
            if (e.key === "Enter" && results.length > 0) {
              onProductSelect(results[0]);
              onSearchChange("");
            }
          }}
        />
      </div>

      {/* Resultados de busca por produto */}
      {searchTerm && results.length > 0 && (
        <div className="mt-3 space-y-2 max-h-[200px] overflow-y-auto">
          {results.map((product) => (
            <div
              key={product.id}
              className="flex items-center justify-between p-3 border rounded-lg hover:bg-gray-50 cursor-pointer transition-colors"
              onClick={() => {
                onProductSelect(product);
                onSearchChange("");
              }}
            >
              <div className="flex-1">
                <div className="font-semibold text-gray-900">{product.name}</div>
                <div className="text-sm text-gray-600">
                  SKU: {product.sku} • Estoque: {product.stock}
                </div>
              </div>
              <div className="text-right ml-4">
                <div className="font-bold text-lg text-blue-600">R$ {getPriceFromEntry(product.id).toFixed(2)}</div>
                <Plus className="h-5 w-5 text-blue-600 mx-auto mt-1" />
              </div>
            </div>
          ))}
        </div>
      )}

      {searchTerm && results.length === 0 && (
        <p className="text-sm text-gray-500 mt-2">Nenhum produto encontrado</p>
      )}
    </div>
  );
};

