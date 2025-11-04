import React from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Trash2, ShoppingCart, Plus, Minus, Sparkles } from "lucide-react";

interface CartBatchItem { batchNumber?: string; quantity: number; unitCost?: number; manufactureDate?: Date; expiryDate?: Date }
interface CartItem { 
  productId: string; 
  productName: string; 
  productSku: string; 
  managedByBatch: boolean; 
  quantity: number; 
  unitCost: number; // Preço final com markup (para exibição)
  originalUnitCost?: number; // Custo original sem markup (para processamento)
  batches?: CartBatchItem[]
}

interface StockEntryCartProps {
  items: CartItem[];
  total: number;
  onRemove: (index: number) => void;
  onQuantityChange: (index: number, newQuantity: number) => void;
  onClear: () => void;
  onFinalize: () => void;
  compact?: boolean;
}

export function StockEntryCart({ 
  items, 
  total,
  onRemove, 
  onQuantityChange, 
  onClear, 
  onFinalize, 
  compact = false 
}: StockEntryCartProps) {
  // Layout compacto para dialog (igual ao de Saidas)
  if (compact) {
    return (
      <Card className="bg-white border border-neutral-200/70 rounded-2xl shadow-sm overflow-hidden">
        {/* Header */}
        <div className="px-3 py-2 border-b bg-neutral-50"> 
          <div className="flex items-center gap-2">
            <ShoppingCart className="h-4 w-4 text-neutral-700" />
            <div className="font-semibold text-neutral-800">Carrinho</div>
            <span className="ml-auto text-[10px] px-2 py-0.5 rounded-full bg-neutral-200 text-neutral-700">{items.length} item{items.length === 1 ? '' : 's'}</span>
          </div>
        </div>

        <CardContent className="p-0">
          {/* Empty state */}
          {items.length === 0 ? (
            <div className="p-4 text-center text-sm text-muted-foreground">Carrinho vazio</div>
          ) : (
            <>
              {/* Lista Mobile */}
              <div className="md:hidden divide-y divide-neutral-200 max-h-48 overflow-y-auto">
                {items.map((it, idx) => (
                  <div key={idx} className="p-4 flex items-start gap-3">
                    <div className="flex-1 min-w-0">
                      <div className="text-sm font-medium text-neutral-900 truncate">{it.productName}</div>
                      <div className="text-xs text-neutral-500 truncate">SKU: {it.productSku}{it.managedByBatch && it.batches ? ` • Lotes: ${it.batches.length}` : ""}</div>
                      <div className="mt-2 flex items-center gap-2">
                        <Button
                          type="button"
                          variant="outline"
                          size="icon"
                          className="h-8 w-8"
                          onClick={() => onQuantityChange(idx, Math.max(1, it.quantity - 1))}
                        >
                          <Minus className="h-4 w-4" />
                        </Button>
                        <div className="w-10 text-center text-sm font-semibold">{it.quantity}</div>
                        <Button
                          type="button"
                          variant="outline"
                          size="icon"
                          className="h-8 w-8"
                          onClick={() => onQuantityChange(idx, it.quantity + 1)}
                        >
                          <Plus className="h-4 w-4" />
                        </Button>
                      </div>
                    </div>
                    <div className="text-right whitespace-nowrap">
                      <div className="text-xs text-neutral-500">Unit.</div>
                      <div className="text-sm text-neutral-700">R$ {it.unitCost.toFixed(2).replace(".", ",")}</div>
                      <div className="text-xs text-neutral-500 mt-1">Total</div>
                      <div className="text-base font-bold text-green-700">R$ {(it.quantity * it.unitCost).toFixed(2).replace(".", ",")}</div>
                      <div className="mt-2">
                        <Button
                          type="button"
                          variant="ghost"
                          size="icon"
                          className="h-8 w-8 text-red-600 hover:text-red-700 hover:bg-red-50"
                          onClick={() => onRemove(idx)}
                          aria-label="Remover item"
                        >
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      </div>
                    </div>
                  </div>
                ))}
              </div>

              {/* Tabela Desktop */}
              <div className="hidden md:block">
                <div className="relative w-full overflow-y-auto max-h-56">
                  <Table>
                    <TableHeader>
                      <TableRow className="bg-neutral-50">
                        <TableHead className="text-neutral-700">Produto</TableHead>
                        <TableHead className="w-[140px] text-neutral-700">Qtd</TableHead>
                        <TableHead className="text-neutral-700">Unit.</TableHead>
                        <TableHead className="text-neutral-700">Total</TableHead>
                        <TableHead className="text-right text-neutral-700">Ações</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {items.map((it, idx) => (
                        <TableRow key={idx} className="hover:bg-neutral-50">
                          <TableCell>
                            <div className="font-medium text-neutral-900">{it.productName}</div>
                            <div className="text-xs text-neutral-500">SKU: {it.productSku}{it.managedByBatch && it.batches ? ` • Lotes: ${it.batches.length}` : ""}</div>
                          </TableCell>
                          <TableCell>
                            <div className="flex items-center gap-2">
                              <Button
                                type="button"
                                variant="outline"
                                size="icon"
                                className="h-8 w-8"
                                onClick={() => onQuantityChange(idx, Math.max(1, it.quantity - 1))}
                                aria-label="Diminuir quantidade"
                              >
                                <Minus className="h-4 w-4" />
                              </Button>
                              <div className="w-10 text-center text-sm font-semibold">{it.quantity}</div>
                              <Button
                                type="button"
                                variant="outline"
                                size="icon"
                                className="h-8 w-8"
                                onClick={() => onQuantityChange(idx, it.quantity + 1)}
                                aria-label="Aumentar quantidade"
                              >
                                <Plus className="h-4 w-4" />
                              </Button>
                            </div>
                          </TableCell>
                          <TableCell>R$ {it.unitCost.toFixed(2).replace(".", ",")}</TableCell>
                          <TableCell className="font-semibold text-green-700">R$ {(it.quantity * it.unitCost).toFixed(2).replace(".", ",")}</TableCell>
                          <TableCell className="text-right">
                            <Button
                              type="button"
                              variant="ghost"
                              size="icon"
                              className="h-8 w-8 text-red-600 hover:text-red-700 hover:bg-red-50"
                              onClick={() => onRemove(idx)}
                              aria-label="Remover item"
                            >
                              <Trash2 className="h-4 w-4" />
                            </Button>
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </div>
              </div>
            </>
          )}
        </CardContent>
      </Card>
    );
  }

  // Layout completo para sidebar (se necessário no futuro)
  return (
    <Card className="bg-white border border-neutral-200/70 rounded-lg shadow-sm overflow-hidden">
      <CardHeader className="pb-3">
        <CardTitle className="flex items-center gap-2 text-base">
          <ShoppingCart className="h-5 w-5" />
          Carrinho ({items.length})
        </CardTitle>
      </CardHeader>
      <CardContent className="p-0">
        {items.length === 0 ? (
          <div className="text-center py-8">
            <ShoppingCart className="h-12 w-12 mx-auto text-gray-300 mb-3" />
            <p className="text-gray-500 text-sm">Carrinho vazio</p>
          </div>
        ) : (
          <>
            <div className="space-y-3 max-h-[400px] overflow-y-auto mb-4 px-4">
              {items.map((it, idx) => (
                <div key={idx} className="border rounded-lg p-3">
                  <div className="flex justify-between items-start mb-2">
                    <div className="flex-1">
                      <h4 className="font-medium text-sm">{it.productName}</h4>
                      <p className="text-xs text-gray-500">SKU: {it.productSku}{it.managedByBatch && it.batches ? ` • Lotes: ${it.batches.length}` : ""}</p>
                      <p className="text-xs text-gray-500 mt-1">R$ {it.unitCost.toFixed(2).replace(".", ",")}</p>
                    </div>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => onRemove(idx)}
                      className="text-red-600 hover:text-red-700 hover:bg-red-50 h-10 w-10 p-0"
                    >
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  </div>
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => onQuantityChange(idx, Math.max(1, it.quantity - 1))}
                        className="h-9 w-9 p-0"
                      >
                        <Minus className="h-3 w-3" />
                      </Button>
                      <span className="w-8 text-center font-semibold">{it.quantity}</span>
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => onQuantityChange(idx, it.quantity + 1)}
                        className="h-9 w-9 p-0"
                      >
                        <Plus className="h-3 w-3" />
                      </Button>
                    </div>
                    <span className="font-bold text-indigo-600">
                      R$ {(it.quantity * it.unitCost).toFixed(2).replace(".", ",")}
                    </span>
                  </div>
                </div>
              ))}
            </div>

            {/* Total */}
            <div className="border-t pt-4 mb-4 px-4">
              <div className="flex justify-between items-center text-lg font-bold">
                <span>Total:</span>
                <span className="text-indigo-600">R$ {total.toFixed(2).replace(".", ",")}</span>
              </div>
            </div>

            {/* Botões de Ação */}
            <div className="space-y-2 px-4 pb-4">
              <Button
                className="w-full bg-gradient-to-r from-indigo-600 to-indigo-700 hover:from-indigo-700 hover:to-indigo-800 text-white px-6 py-3 rounded-xl shadow-xl hover:shadow-2xl transition-all duration-200 transform hover:scale-105"
                onClick={onFinalize}
                disabled={items.length === 0}
              >
                <Sparkles className="w-5 h-5 mr-2" />
                Finalizar Compra
              </Button>
              <Button 
                variant="outline" 
                className="w-full" 
                onClick={onClear} 
                disabled={items.length === 0}
              >
                <Trash2 className="mr-2 h-4 w-4" />
                Limpar Carrinho
              </Button>
            </div>
          </>
        )}
      </CardContent>
    </Card>
  );
}

