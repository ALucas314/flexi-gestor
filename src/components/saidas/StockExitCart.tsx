import React, { useRef, useLayoutEffect } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Trash2, ShoppingCart, Plus, Minus } from "lucide-react";

interface CartBatchItem { batchId?: string; batchNumber?: string; quantity: number }
interface CartItem { productId: string; productName: string; productSku: string; managedByBatch: boolean; quantity: number; unitPrice: number; batches?: CartBatchItem[] }

interface StockExitCartProps {
  items: CartItem[];
  total: number;
  onRemove: (index: number) => void;
  onQuantityChange: (index: number, newQuantity: number) => void;
  onClear: () => void;
  onFinalize: () => void;
  compact?: boolean;
}

export function StockExitCart({ items, total, onRemove, onQuantityChange, onClear, onFinalize, compact = false }: StockExitCartProps) {
  // Refs para preservar a posição do scroll
  const mobileScrollRef = useRef<HTMLDivElement>(null);
  const desktopScrollRef = useRef<HTMLDivElement>(null);
  
  // Preservar posição do scroll após atualizações (useLayoutEffect executa antes do paint)
  useLayoutEffect(() => {
    if (mobileScrollRef.current) {
      const savedScroll = sessionStorage.getItem('cartMobileScroll');
      if (savedScroll) {
        mobileScrollRef.current.scrollTop = parseInt(savedScroll, 10);
      }
    }
    if (desktopScrollRef.current) {
      const savedScroll = sessionStorage.getItem('cartDesktopScroll');
      if (savedScroll) {
        desktopScrollRef.current.scrollTop = parseInt(savedScroll, 10);
      }
    }
  }, [items]);

  // Salvar posição do scroll antes de atualizar
  const handleQuantityChange = (index: number, newQuantity: number) => {
    if (mobileScrollRef.current) {
      sessionStorage.setItem('cartMobileScroll', String(mobileScrollRef.current.scrollTop));
    }
    if (desktopScrollRef.current) {
      sessionStorage.setItem('cartDesktopScroll', String(desktopScrollRef.current.scrollTop));
    }
    onQuantityChange(index, newQuantity);
  };

  return (
    <Card
      className={`bg-white border border-neutral-200/70 ${compact ? "" : "md:sticky md:top-2"} rounded-2xl shadow-sm md:shadow-lg overflow-hidden`}
    >
      {/* Header */}
      <div className={`${compact ? "px-3 py-2" : "px-4 py-3"} border-b bg-neutral-50`}> 
        <div className="flex items-center gap-2">
          <ShoppingCart className="h-4 w-4 text-neutral-700" />
          <div className="font-semibold text-neutral-800">Carrinho</div>
          <span className="ml-auto text-[10px] px-2 py-0.5 rounded-full bg-neutral-200 text-neutral-700">{items.length} item{items.length === 1 ? '' : 's'}</span>
        </div>
      </div>

      <CardContent className="p-0">
        {/* Empty state */}
        {items.length === 0 ? (
          <div className={`${compact ? "p-4" : "p-8"} text-center text-sm text-muted-foreground`}>Carrinho vazio</div>
        ) : (
          <>
            {/* Lista Mobile */}
            <div 
              ref={mobileScrollRef}
              className={`md:hidden divide-y divide-neutral-200 ${compact ? "max-h-48 overflow-y-auto" : ""}`}
              onScroll={(e) => {
                if (mobileScrollRef.current) {
                  sessionStorage.setItem('cartMobileScroll', String(e.currentTarget.scrollTop));
                }
              }}
            >
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
                        onClick={() => { handleQuantityChange(idx, Math.max(1, it.quantity - 1)); }}
                      >
                        <Minus className="h-4 w-4" />
                      </Button>
                      <div className="w-10 text-center text-sm font-semibold">{it.quantity}</div>
                      <Button
                        type="button"
                        variant="outline"
                        size="icon"
                        className="h-8 w-8"
                        onClick={() => { handleQuantityChange(idx, it.quantity + 1); }}
                      >
                        <Plus className="h-4 w-4" />
                      </Button>
                    </div>
                  </div>
                  <div className="text-right whitespace-nowrap">
                    <div className="text-xs text-neutral-500">Unit.</div>
                    <div className="text-sm text-neutral-700">R$ {it.unitPrice.toFixed(2).replace(".", ",")}</div>
                    <div className="text-xs text-neutral-500 mt-1">Total</div>
                    <div className="text-base font-bold text-green-700">R$ {(it.quantity * it.unitPrice).toFixed(2).replace(".", ",")}</div>
                    <div className="mt-2">
                      <Button
                        type="button"
                        variant="ghost"
                        size="icon"
                        className="h-8 w-8 text-red-600 hover:text-red-700 hover:bg-red-50"
                        onClick={() => { onRemove(idx); }}
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
              <div 
                ref={desktopScrollRef}
                className={`relative w-full overflow-y-auto ${compact ? "max-h-56" : items.length >= 6 ? "max-h-[420px]" : "max-h-[420px]"}`}
                onScroll={(e) => {
                  if (desktopScrollRef.current) {
                    sessionStorage.setItem('cartDesktopScroll', String(e.currentTarget.scrollTop));
                  }
                }}
              >
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
                              onClick={() => { handleQuantityChange(idx, Math.max(1, it.quantity - 1)); }}
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
                              onClick={() => { handleQuantityChange(idx, it.quantity + 1); }}
                              aria-label="Aumentar quantidade"
                            >
                              <Plus className="h-4 w-4" />
                            </Button>
                          </div>
                        </TableCell>
                        <TableCell>R$ {it.unitPrice.toFixed(2).replace(".", ",")}</TableCell>
                        <TableCell className="font-semibold text-green-700">R$ {(it.quantity * it.unitPrice).toFixed(2).replace(".", ",")}</TableCell>
                        <TableCell className="text-right">
                          <Button
                            type="button"
                            variant="ghost"
                            size="icon"
                            className="h-8 w-8 text-red-600 hover:text-red-700 hover:bg-red-50"
                            onClick={() => { onRemove(idx); }}
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

        {/* Footer compactável: ocultar dentro do modal para não cobrir botões principais */}
        {!compact && (
          <div className="sticky bottom-0 bg-white border-t p-4 space-y-3">
            <div className="flex items-center justify-between">
              <span className="text-sm font-medium text-neutral-700">Total</span>
              <span className="text-xl font-extrabold text-green-700">R$ {total.toFixed(2).replace(".", ",")}</span>
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
              <Button
                type="button"
                variant="outline"
                onClick={() => { onClear(); }}
                disabled={items.length === 0}
                className="w-full border-red-300 text-red-700 hover:bg-red-50 rounded-xl"
                data-testid="cart-clear-button"
              >
                🗑️ Esvaziar
              </Button>
              <Button
                type="button"
                onClick={() => { onFinalize(); }}
                disabled={items.length === 0}
                className="w-full bg-gradient-to-r from-red-600 to-red-700 hover:from-red-700 hover:to-red-800 text-white shadow-lg hover:shadow-xl transition-all duration-200 h-10 text-sm rounded-xl"
              >
                📤 Registrar Saída
              </Button>
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );
}


