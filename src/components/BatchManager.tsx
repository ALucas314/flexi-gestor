// 📅 Componente para Gerenciar Lotes de Produtos
// Permite adicionar, editar e visualizar lotes com datas de fabricação e validade

import React, { useState, useEffect } from 'react';
import { Button } from './ui/button';
import { Input } from './ui/input';
import { Label } from './ui/label';
import { Card, CardContent, CardHeader, CardTitle } from './ui/card';
import { Badge } from './ui/badge';
// Usando Lucide React
import { 
  Plus,
  Calendar,
  Package,
  AlertTriangle,
  CheckCircle,
  Trash2,
  Edit
} from 'lucide-react';
import { getBatchesByProduct, createBatch, deleteBatch, checkBatchNumberExists, generateNextAvailableBatchNumber, findBatchByNumberAndProduct, findBatchByNumber, updateBatchQuantity, syncProductStockFromBatches } from '@/lib/batches';
import { useAuth } from '@/contexts/AuthContext';
import { useWorkspace } from '@/contexts/WorkspaceContext';
import { useData } from '@/contexts/DataContext';
import { useToast } from '@/hooks/use-toast';
import { daysBetween } from '@/lib/utils';
import { ConfirmDialog } from './ui/ConfirmDialog';
import { useConfirmDialog } from '@/hooks/use-confirm-dialog';
import { supabase } from '@/lib/supabase';

interface Batch {
  id: string;
  batchNumber: string;
  quantity: number;
  manufactureDate: string | null;
  expiryDate: string | null;
  createdAt: string;
  product?: {
    name: string;
    sku: string;
  };
}

interface BatchManagerProps {
  productId: string;
  productName: string;
  productSku: string; // SKU do produto - usado como base para número do lote
  productStock: number; // Estoque total do produto
  onBatchesChange?: () => void; // Callback quando lotes mudarem
}

export const BatchManager: React.FC<BatchManagerProps> = ({ 
  productId, 
  productName,
  productSku,
  productStock,
  onBatchesChange 
}) => {
  const { toast } = useToast();
  const { user } = useAuth();
  const { workspaceAtivo } = useWorkspace();
  const { updateProduct, refreshProducts } = useData();
  const { confirm, dialogState, closeDialog, handleConfirm } = useConfirmDialog();
  const [batches, setBatches] = useState<Batch[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [formData, setFormData] = useState({
    batchNumber: '',
    quantity: ''
  });

  // Carregar lotes do produto
  const loadBatches = async (syncStock = false) => {
    if (!user?.id) return;
    
    try {
      setIsLoading(true);
      const batchesData = await getBatchesByProduct(productId, user.id);
      setBatches(batchesData.map(b => ({
        id: b.id,
        batchNumber: b.batchNumber,
        quantity: b.quantity,
        manufactureDate: b.manufactureDate?.toISOString() || null,
        expiryDate: b.expiryDate?.toISOString() || null,
        createdAt: b.createdAt.toISOString()
      })));
      
      // Sincronizar estoque automaticamente após carregar lotes (sempre sincronizar para produtos gerenciados por lote)
      if (syncStock) {
        const totalBatches = batchesData.reduce((sum, b) => sum + b.quantity, 0);
        // Sempre sincronizar para garantir que o estoque está correto
        // O estoque deve sempre ser igual à soma dos lotes para produtos gerenciados por lote
        // Se não houver lotes, o estoque será 0
        if (totalBatches !== productStock) {
          await syncProductStockFromBatches(
            productId,
            user.id,
            async (productId: string, stock: number) => {
              await updateProduct(productId, { stock });
            }
          );
          await refreshProducts();
          // Notificar mudança para atualizar a prop productStock
          if (onBatchesChange) {
            onBatchesChange();
          }
        }
      }
      
      // Gerar número do lote usando apenas o SKU do produto
      setFormData(prev => ({
        ...prev,
        batchNumber: productSku
      }));
    } catch (error) {
      console.error('Erro ao carregar lotes:', error);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    if (user?.id && productId) {
      // Carregar lotes e sincronizar estoque automaticamente na primeira carga
      loadBatches(true);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [productId]);

  // 📡 Realtime para atualizar lotes quando são modificados em tempo real
  useEffect(() => {
    if (!user?.id || !productId) return;

    let lotesSubscription: any = null;
    let lastSuccessfulConnection = Date.now();
    let debounceTimer: NodeJS.Timeout | null = null;

    // Função para reconfigurar subscription quando desconecta
    const reconfigureSubscription = () => {
      if (lotesSubscription) {
        supabase.removeChannel(lotesSubscription);
      }
      
      // Limpar timer de debounce anterior
      if (debounceTimer) {
        clearTimeout(debounceTimer);
        debounceTimer = null;
      }

      try {
        lotesSubscription = supabase
          .channel(`lotes-changes-${productId}-${user.id}-${Date.now()}`)
          .on('postgres_changes', 
            { 
              event: '*', 
              schema: 'public', 
              table: 'lotes',
              filter: `produto_id=eq.${productId}`
            }, 
            async (payload) => {
              // Limpar timer anterior se existir
              if (debounceTimer) {
                clearTimeout(debounceTimer);
              }
              
              // Debounce para evitar muitas atualizações simultâneas
              debounceTimer = setTimeout(async () => {
                try {
                  await loadBatches();
                  
                  // Sincronizar estoque automaticamente quando lotes mudarem via realtime
                  await syncProductStockFromBatches(
                    productId,
                    user.id,
                    async (productId: string, stock: number) => {
                      await updateProduct(productId, { stock });
                    }
                  );
                  await refreshProducts();
                  
                  if (onBatchesChange) {
                    onBatchesChange();
                  }
                  lastSuccessfulConnection = Date.now();
                  debounceTimer = null;
                } catch (error) {
                  console.error('❌ [BatchManager] Erro ao atualizar via subscription:', error);
                  debounceTimer = null;
                }
              }, 300); // 300ms de debounce
            }
          )
          .subscribe((status) => {
            console.log(`📡 Realtime: Lotes (produto ${productId}) - Status: ${status}`);
            if (status === 'SUBSCRIBED') {
              lastSuccessfulConnection = Date.now();
              console.log('✅ Realtime: Lotes conectado com sucesso');
            } else if (status === 'CHANNEL_ERROR' || status === 'TIMED_OUT' || status === 'CLOSED') {
              console.warn('⚠️ Realtime: Lotes desconectado, tentando reconectar...');
              setTimeout(() => {
                reconfigureSubscription();
              }, 2000);
            }
          });

        console.log('📡 [BatchManager] Subscription de lotes criada para produto:', productId);
      } catch (error) {
        console.error('❌ [BatchManager] Erro ao criar subscription:', error);
      }
    };

    // Configurar subscription inicial
    reconfigureSubscription();

    // Health check que detecta desconexão e reconecta
    const healthCheckInterval = setInterval(async () => {
      const timeSinceLastConnection = Date.now() - lastSuccessfulConnection;
      if (timeSinceLastConnection > 120000) { // 2 minutos
        try {
          reconfigureSubscription();
          await loadBatches();
          lastSuccessfulConnection = Date.now();
        } catch (e) {
          console.error('❌ [BatchManager] Erro no health check:', e);
        }
      }
    }, 30000); // Verificar a cada 30 segundos

    return () => {
      clearInterval(healthCheckInterval);
      if (debounceTimer) {
        clearTimeout(debounceTimer);
      }
      if (lotesSubscription) {
        supabase.removeChannel(lotesSubscription);
      }
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [user?.id, productId]);

  // Adicionar novo lote
  const handleAddBatch = async () => {
    if (!user?.id) {
      toast({
        title: '❌ Erro',
        description: 'Usuário não autenticado',
        variant: 'destructive'
      });
      return;
    }

    try {
      if (!formData.batchNumber || !formData.quantity) {
        toast({
          title: '❌ Campos Obrigatórios',
          description: 'Número do lote e quantidade são obrigatórios',
          variant: 'destructive'
        });
        return;
      }

      // Validar quantidade mínima
      const quantity = parseInt(formData.quantity);
      if (quantity <= 0) {
        toast({
          title: '❌ Quantidade Inválida',
          description: 'A quantidade deve ser maior que zero',
          variant: 'destructive'
        });
        return;
      }

      // Calcular quantidade já alocada em lotes existentes
      const totalAllocated = batches.reduce((sum, b) => sum + b.quantity, 0);
      const availableStock = productStock - totalAllocated;

      // Validar se há estoque disponível para alocar
      if (availableStock <= 0) {
        toast({
          title: '⚠️ Sem Estoque Disponível',
          description: `Todo o estoque (${productStock} unidades) já está alocado em ${batches.length} lote(s). Exclua um lote ou aumente o estoque do produto.`,
          variant: 'destructive'
        });
        return;
      }

      // Validar se a quantidade não excede o estoque disponível
      if (quantity > availableStock) {
        toast({
          title: '⚠️ Estoque Insuficiente',
          description: `Você está tentando alocar ${quantity} unidades, mas só há ${availableStock} unidades disponíveis. (Total: ${productStock}, Já Alocado: ${totalAllocated})`,
          variant: 'destructive'
        });
        return;
      }

      // Verificar se o número do lote já existe GLOBALMENTE
      // Se existir para o mesmo produto, adicionar quantidade ao lote existente
      // Se não existir, criar um novo lote
      const existingBatch = await findBatchByNumber(formData.batchNumber, user.id);
      
      if (existingBatch && existingBatch.productId === productId) {
        // Lote já existe para este produto - adicionar quantidade ao lote existente
        const newQuantity = existingBatch.quantity + quantity;
        await updateBatchQuantity(existingBatch.id, newQuantity, user.id);
        
        toast({
          title: '✅ Quantidade Adicionada!',
          description: `Quantidade adicionada ao lote existente "${formData.batchNumber}". Nova quantidade: ${newQuantity}`,
          variant: 'default'
        });
        
        await loadBatches();
        
        // Sincronizar estoque automaticamente após atualizar lote
        await syncProductStockFromBatches(
          productId,
          user.id,
          async (productId: string, stock: number) => {
            await updateProduct(productId, { stock });
          }
        );
        await refreshProducts();
        
        setIsDialogOpen(false);
        onBatchesChange?.();
        return;
      }
      
      // Se o lote existe mas é de outro produto, permitir criar (números podem ser iguais em produtos diferentes)

      setIsLoading(true);

      const created = await createBatch(
        productId,
        formData.batchNumber,
        quantity,
        0, // unitCost - pode ser zero aqui
        workspaceAtivo?.id || user.id, // Usar workspace ativo!
        formData.manufactureDate ? new Date(formData.manufactureDate) : undefined,
        formData.expiryDate ? new Date(formData.expiryDate) : undefined
      );

      // Verificar se o lote foi criado com sucesso
      if (!created) {
        toast({
          title: '❌ Erro ao Criar Lote',
          description: `Não foi possível criar o lote "${formData.batchNumber}". Verifique se o número já existe.`,
          variant: 'destructive'
        });
        return;
      }

      toast({
        title: '✅ Lote Adicionado!',
        description: `Lote ${formData.batchNumber} foi criado com sucesso`,
        variant: 'default'
      });

      // Recarregar lotes
      await loadBatches();
      
      // Sincronizar estoque automaticamente após criar lote
      await syncProductStockFromBatches(
        productId,
        user.id,
        async (productId: string, stock: number) => {
          await updateProduct(productId, { stock });
        }
      );
      await refreshProducts();
      
      setIsDialogOpen(false);
      
      // Notificar mudança
      onBatchesChange?.();
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Não foi possível criar o lote';
      toast({
        title: '❌ Erro ao Adicionar Lote',
        description: errorMessage,
        variant: 'destructive'
      });
    } finally {
      setIsLoading(false);
    }
  };

  // Deletar lote
  const handleDeleteBatch = async (batchId: string, batchNumber: string) => {
    if (!user?.id) return;
    
    confirm(
      'Confirmar Exclusão',
      `Deseja realmente deletar o lote ${batchNumber}?`,
      async () => {
        try {
          setIsLoading(true);
          await deleteBatch(batchId, workspaceAtivo?.id || user.id);

          toast({
            title: '✅ Lote Deletado!',
            description: `Lote ${batchNumber} foi removido com sucesso`,
            variant: 'default'
          });

          await loadBatches();
          
          // Sincronizar estoque automaticamente após deletar lote
          await syncProductStockFromBatches(
            productId,
            user.id,
            async (productId: string, stock: number) => {
              await updateProduct(productId, { stock });
            }
          );
          await refreshProducts();
          
          onBatchesChange?.();
        } catch (error) {
          const errorMessage = error instanceof Error ? error.message : 'Não foi possível deletar o lote';
          toast({
            title: '❌ Erro ao Deletar Lote',
            description: errorMessage,
            variant: 'destructive'
          });
        } finally {
          setIsLoading(false);
        }
      },
      {
        variant: 'destructive',
        confirmText: 'Deletar',
        cancelText: 'Cancelar',
      }
    );
  };

  // Calcular status do lote (vencido, próximo do vencimento, ok)
  const getBatchStatus = (expiryDate: string | null) => {
    if (!expiryDate) return { label: 'Sem Validade', color: 'gray', icon: Package };

    const today = new Date();
    const expiry = new Date(expiryDate);
    const diffDays = expiry > today 
      ? daysBetween(today, expiry)  // Dias até vencer
      : -daysBetween(expiry, today); // Dias que já passou (negativo)

    if (diffDays < 0) {
      return { label: 'Vencido', color: 'red', icon: AlertTriangle };
    } else if (diffDays <= 30) {
      return { label: `Vence em ${diffDays} dias`, color: 'yellow', icon: AlertTriangle };
    } else {
      return { label: `Vence em ${diffDays} dias`, color: 'green', icon: CheckCircle };
    }
  };

  return (
    <div className="space-y-3 w-full max-w-full overflow-hidden">
      {/* Header com título e botão */}
      <div className="flex items-center justify-between gap-2">
        <div className="min-w-0 flex-1">
          <h3 className="font-semibold flex items-center gap-1.5 text-base text-gray-900">
            <Calendar className="h-4 w-4 text-indigo-600" />
            Gerenciar Lotes
          </h3>
        </div>
        <Button 
          onClick={async () => {
            // Recarregar lotes atualizados antes de gerar o próximo número
            if (user?.id && productId) {
              await loadBatches();
            }
            
            // Abrir diálogo
            setIsDialogOpen(!isDialogOpen);
            
            // Gerar automaticamente o próximo número de lote disponível
            if (user?.id && productId) {
              try {
                // A função generateNextAvailableBatchNumber busca TODOS os lotes de TODOS os produtos
                // para garantir numeração global (1, 2, 3...) independente do produto
                const nextBatchNumber = await generateNextAvailableBatchNumber(productId, user.id, []);
                
                console.log('Próximo número de lote gerado (global):', nextBatchNumber);
                
                setFormData({
                  batchNumber: nextBatchNumber,
                  quantity: ''
                });
              } catch (error) {
                console.error('Erro ao gerar número do lote:', error);
                // Fallback: contar lotes manualmente a partir dos batches atualizados
                const usedNumbers = new Set<number>();
                batches.forEach(b => {
                  if (b.batchNumber) {
                    const numberMatch = b.batchNumber.match(/\d+/);
                    if (numberMatch) {
                      const num = parseInt(numberMatch[0], 10);
                      if (!isNaN(num)) {
                        usedNumbers.add(num);
                      }
                    }
                  }
                });
                let nextNumber = 1;
                while (usedNumbers.has(nextNumber)) {
                  nextNumber++;
                }
                console.log('Fallback - Próximo número:', nextNumber, 'Números usados:', Array.from(usedNumbers));
                setFormData({
                  batchNumber: String(nextNumber),
                  quantity: ''
                });
              }
            } else {
              // Fallback: contar lotes manualmente
              const usedNumbers = new Set<number>();
              batches.forEach(b => {
                if (b.batchNumber) {
                  const numberMatch = b.batchNumber.match(/\d+/);
                  if (numberMatch) {
                    const num = parseInt(numberMatch[0], 10);
                    if (!isNaN(num)) {
                      usedNumbers.add(num);
                    }
                  }
                }
              });
              let nextNumber = 1;
              while (usedNumbers.has(nextNumber)) {
                nextNumber++;
              }
              setFormData({
                batchNumber: String(nextNumber),
                quantity: ''
              });
            }
          }}
          className="bg-gradient-to-r from-indigo-600 to-purple-600 hover:from-indigo-700 hover:to-purple-700 text-white shadow-sm hover:shadow-md transition-all text-xs h-8 px-2.5"
          size="sm"
        >
          <Plus className="mr-1 h-3 w-3" />
          Novo Lote
        </Button>
      </div>

      {/* Formulário para adicionar lote */}
      {isDialogOpen && (
        <Card className="bg-gradient-to-br from-indigo-50 via-purple-50 to-indigo-50 border-2 border-indigo-200 shadow-sm">
          <CardContent className="p-3 space-y-3">
            <div className="flex items-center justify-between pb-1.5 border-b border-indigo-200">
              <h4 className="text-xs font-semibold text-gray-900 flex items-center gap-1">
                <Package className="h-3.5 w-3.5 text-indigo-600" />
                Adicionar Novo Lote
              </h4>
              <span className="text-xs text-gray-500 bg-white px-1.5 py-0.5 rounded border border-indigo-100">
                SKU: {productSku}
              </span>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-2">
              <div className="space-y-1">
                <Label htmlFor="batchNumber" className="text-xs font-medium text-gray-700">
                  📦 Número do Lote <span className="text-red-500">*</span>
                </Label>
                <Input
                  id="batchNumber"
                  placeholder="Gerado automaticamente"
                  value={formData.batchNumber}
                  onChange={(e) => setFormData(prev => ({ ...prev, batchNumber: e.target.value }))}
                  className="font-semibold border-2 border-indigo-200 focus:border-indigo-500 focus:ring-indigo-500 h-8 text-xs"
                />
              </div>

              <div className="space-y-1">
                <Label htmlFor="quantity" className="text-xs font-medium text-gray-700">
                  🔢 Quantidade <span className="text-red-500">*</span>
                </Label>
                {(() => {
                  const totalAllocated = batches.reduce((sum, b) => sum + b.quantity, 0);
                  const availableStock = productStock - totalAllocated;
                  
                  return (
                    <>
                      <Input
                        id="quantity"
                        type="number"
                        min="1"
                        max={availableStock}
                        placeholder={`Máx: ${availableStock}`}
                        value={formData.quantity}
                        onChange={(e) => {
                          const value = parseInt(e.target.value) || 0;
                          if (value <= availableStock || e.target.value === '') {
                            setFormData(prev => ({ ...prev, quantity: e.target.value }));
                          }
                        }}
                        className={`text-xs font-semibold border-2 focus:ring-indigo-500 h-8 ${
                          parseInt(formData.quantity || '0') > availableStock 
                            ? 'border-red-500 focus:border-red-500 focus:ring-red-500' 
                            : 'border-indigo-200 focus:border-indigo-500'
                        }`}
                      />
                      <div className="flex items-center justify-between text-xs">
                        <span className="text-gray-600">
                          📦 Disponível: <span className="font-bold text-green-600">{availableStock}</span>
                        </span>
                        {parseInt(formData.quantity || '0') > availableStock && (
                          <span className="text-red-600 font-semibold flex items-center gap-0.5 text-xs">
                            <AlertTriangle className="h-2.5 w-2.5" />
                            Excede!
                          </span>
                        )}
                      </div>
                    </>
                  );
                })()}
              </div>
            </div>

            <div className="flex gap-2 pt-0.5">
              <Button 
                onClick={handleAddBatch} 
                disabled={isLoading || !formData.batchNumber || !formData.quantity}
                className="flex-1 bg-gradient-to-r from-indigo-600 to-purple-600 hover:from-indigo-700 hover:to-purple-700 text-white shadow-sm hover:shadow-md transition-all disabled:opacity-50 disabled:cursor-not-allowed h-8 text-xs"
                size="sm"
              >
                {isLoading ? (
                  <>
                    <div className="animate-spin h-3 w-3 border-2 border-white border-t-transparent rounded-full mr-1"></div>
                    Adicionando...
                  </>
                ) : (
                  <>
                    <Plus className="mr-1 h-3 w-3" />
                    Adicionar Lote
                  </>
                )}
              </Button>
              <Button 
                variant="outline" 
                onClick={() => {
                  setIsDialogOpen(false);
                  setFormData({ batchNumber: '', quantity: '' });
                }}
                className="border-2 border-gray-300 hover:bg-gray-50 h-8 text-xs"
                size="sm"
              >
                Cancelar
              </Button>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Lista de Lotes Cadastrados */}
      <div className="space-y-2">
        <div className="flex items-center justify-between gap-2">
          <div className="min-w-0 flex-1">
            <h3 className="text-xs font-semibold text-gray-900 flex items-center gap-1">
              <Package className="h-3.5 w-3.5 text-indigo-600" />
              Lotes Cadastrados
            </h3>
          </div>
          {batches.length > 0 && (
            <Badge variant="outline" className="bg-indigo-50 text-indigo-700 border-indigo-200 px-1.5 py-0.5 text-xs shrink-0">
              {batches.length} {batches.length === 1 ? 'lote' : 'lotes'}
            </Badge>
          )}
        </div>

        {isLoading && batches.length === 0 ? (
          <Card className="bg-gray-50 border-dashed">
            <CardContent className="py-12 text-center">
              <div className="animate-spin h-10 w-10 border-3 border-indigo-600 border-t-transparent rounded-full mx-auto mb-4"></div>
              <p className="text-gray-600 font-medium">Carregando lotes...</p>
            </CardContent>
          </Card>
        ) : batches.length === 0 ? (
          <Card className="bg-gradient-to-br from-gray-50 to-indigo-50 border-2 border-dashed border-gray-300">
            <CardContent className="py-8 text-center">
              <div className="w-12 h-12 bg-indigo-100 rounded-full flex items-center justify-center mx-auto mb-3">
                <Package className="h-6 w-6 text-indigo-600" />
              </div>
              <h4 className="text-sm font-semibold text-gray-900 mb-1">Nenhum lote cadastrado</h4>
              <p className="text-xs text-gray-600 mb-3">Adicione um lote para começar</p>
              <Button
                onClick={() => setIsDialogOpen(true)}
                className="bg-gradient-to-r from-indigo-600 to-purple-600 hover:from-indigo-700 hover:to-purple-700 text-white h-8 text-xs px-3"
                size="sm"
              >
                <Plus className="mr-1.5 h-3.5 w-3.5" />
                Criar Primeiro Lote
              </Button>
            </CardContent>
          </Card>
        ) : (
          <div className="grid gap-2 grid-cols-1">
            {batches.map((batch) => {
              const status = getBatchStatus(batch.expiryDate);
              return (
                <Card 
                  key={batch.id} 
                  className="hover:shadow-sm transition-all border-2 border-gray-200 hover:border-indigo-300 bg-white"
                >
                  <CardContent className="p-2.5">
                    <div className="flex items-start justify-between mb-2">
                      <div className="flex items-center gap-1.5 flex-1 min-w-0">
                        <div className="w-8 h-8 bg-gradient-to-br from-indigo-500 to-purple-600 rounded-lg flex items-center justify-center shadow-sm shrink-0">
                          <Package className="h-4 w-4 text-white" />
                        </div>
                        <div className="min-w-0">
                          <Badge variant="outline" className="font-mono font-bold text-xs border-2 border-indigo-200 bg-indigo-50 text-indigo-700">
                            📦 {batch.batchNumber}
                          </Badge>
                        </div>
                      </div>
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => handleDeleteBatch(batch.id, batch.batchNumber)}
                        className="text-red-600 hover:text-red-700 hover:bg-red-50 rounded-full h-6 w-6 p-0 shrink-0"
                        title="Deletar lote"
                      >
                        <Trash2 className="h-3 w-3" />
                      </Button>
                    </div>

                    <div className="space-y-1.5">
                      <div className="bg-gray-50 rounded-lg p-1.5 border border-gray-200">
                        <div className="flex items-center justify-between">
                          <span className="text-xs text-gray-600">📦 Quantidade</span>
                          <span className="text-sm font-bold text-gray-900">{batch.quantity}</span>
                        </div>
                        <p className="text-xs text-gray-500 mt-0.5">unidades</p>
                      </div>

                      {batch.expiryDate && (
                        <div className="bg-blue-50 rounded-lg p-1.5 border border-blue-200">
                          <div className="flex items-center justify-between mb-0.5">
                            <span className="text-xs text-blue-700">📅 Validade</span>
                            <Badge 
                              className={`text-xs px-1 py-0.5 ${
                                status.color === 'red' ? 'bg-red-100 text-red-700 border-red-300' :
                                status.color === 'yellow' ? 'bg-yellow-100 text-yellow-700 border-yellow-300' :
                                'bg-green-100 text-green-700 border-green-300'
                              }`}
                            >
                              {new Date(batch.expiryDate).toLocaleDateString('pt-BR')}
                            </Badge>
                          </div>
                          <p className="text-xs text-blue-600">{status.label}</p>
                        </div>
                      )}

                      <div className="pt-1 border-t border-gray-200">
                        <p className="text-xs text-gray-500">
                          Criado: {new Date(batch.createdAt).toLocaleDateString('pt-BR')}
                        </p>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              );
            })}
          </div>
        )}
      </div>

      {/* Resumo de Distribuição */}
      <Card className="bg-gradient-to-r from-indigo-50 to-purple-50 border-2 border-indigo-200 shadow-md w-full">
        <CardContent className="p-3">
          <div className="space-y-2">
            {/* Cabeçalho do Resumo */}
            <div className="flex items-center justify-between pb-1.5 border-b-2 border-indigo-200">
              <div className="flex items-center gap-2">
                <div className="w-7 h-7 bg-gradient-to-br from-indigo-600 to-purple-600 rounded-lg flex items-center justify-center shadow-sm">
                  <Package className="h-3.5 w-3.5 text-white" />
                </div>
                <div>
                  <h4 className="text-xs font-bold text-gray-900">📊 Resumo de Distribuição</h4>
                  <p className="text-xs text-gray-600">Distribuição do estoque</p>
                </div>
              </div>
            </div>

            {/* Grid de Informações */}
            <div className="grid grid-cols-2 gap-1.5">
              {/* Estoque Total */}
              <div className="bg-white rounded-lg p-2 border-2 border-indigo-200 shadow-sm">
                <div className="flex items-center gap-1 mb-0.5">
                  <div className="w-5 h-5 bg-indigo-100 rounded flex items-center justify-center">
                    <Package className="h-2.5 w-2.5 text-indigo-600" />
                  </div>
                  <p className="text-xs font-medium text-gray-600">Estoque Total</p>
                </div>
                <p className="text-lg font-bold text-gray-900">{productStock}</p>
                <p className="text-xs text-gray-500">unidades</p>
              </div>

              {/* Distribuídos em Lotes */}
              <div className="bg-white rounded-lg p-2 border-2 border-green-200 shadow-sm">
                <div className="flex items-center gap-1 mb-0.5">
                  <div className="w-5 h-5 bg-green-100 rounded flex items-center justify-center">
                    <CheckCircle className="h-2.5 w-2.5 text-green-600" />
                  </div>
                  <p className="text-xs font-medium text-gray-600">Em Lotes</p>
                </div>
                <p className="text-lg font-bold text-green-600">
                  {batches.reduce((sum, b) => sum + b.quantity, 0)}
                </p>
                <p className="text-xs text-gray-500">
                  {productStock > 0 
                    ? `${Math.round((batches.reduce((sum, b) => sum + b.quantity, 0) / productStock) * 100)}%`
                    : '0%'
                  }
                </p>
              </div>

              {/* Não Alocados */}
              <div className="bg-white rounded-lg p-2 border-2 border-orange-200 shadow-sm">
                <div className="flex items-center gap-1 mb-0.5">
                  <div className="w-5 h-5 bg-orange-100 rounded flex items-center justify-center">
                    <AlertTriangle className="h-2.5 w-2.5 text-orange-600" />
                  </div>
                  <p className="text-xs font-medium text-gray-600">Não Alocados</p>
                </div>
                <p className="text-lg font-bold text-orange-600">
                  {Math.max(0, productStock - batches.reduce((sum, b) => sum + b.quantity, 0))}
                </p>
                <p className="text-xs text-gray-500">
                  {productStock > 0 
                    ? `${Math.round((Math.max(0, productStock - batches.reduce((sum, b) => sum + b.quantity, 0)) / productStock) * 100)}%`
                    : '0%'
                  }
                </p>
              </div>

              {/* Total de Lotes */}
              <div className="bg-white rounded-lg p-2 border-2 border-purple-200 shadow-sm">
                <div className="flex items-center gap-1 mb-0.5">
                  <div className="w-5 h-5 bg-purple-100 rounded flex items-center justify-center">
                    <Package className="h-2.5 w-2.5 text-purple-600" />
                  </div>
                  <p className="text-xs font-medium text-gray-600">Total Lotes</p>
                </div>
                <p className="text-lg font-bold text-purple-600">{batches.length}</p>
                <p className="text-xs text-gray-500">
                  {batches.length === 1 ? 'lote' : 'lotes'}
                </p>
              </div>
            </div>

            {/* Alerta se houver divergência */}
            {batches.reduce((sum, b) => sum + b.quantity, 0) > productStock && (() => {
              const totalBatches = batches.reduce((sum, b) => sum + b.quantity, 0);
              const handleSyncStock = async () => {
                try {
                  // Usar a função de sincronização que já calcula a soma dos lotes
                  const syncedStock = await syncProductStockFromBatches(
                    productId,
                    user.id,
                    async (productId: string, stock: number) => {
                      await updateProduct(productId, { stock });
                    }
                  );
                  await refreshProducts();
                  if (onBatchesChange) onBatchesChange();
                  toast({
                    title: "✅ Estoque Sincronizado!",
                    description: `O estoque foi atualizado para ${syncedStock || totalBatches} unidades (soma dos lotes).`,
                    variant: "default",
                  });
                } catch (error: any) {
                  toast({
                    title: "❌ Erro ao Sincronizar",
                    description: error.message || "Não foi possível sincronizar o estoque.",
                    variant: "destructive",
                  });
                }
              };
              
              return (
                <div className="flex flex-col space-y-2 bg-red-100 border border-red-300 rounded-lg p-3">
                  <div className="flex items-start space-x-2">
                    <AlertTriangle className="h-5 w-5 text-red-600 flex-shrink-0 mt-0.5" />
                    <div className="flex-1 text-sm">
                      <p className="font-semibold text-red-900">⚠️ Atenção: Divergência Detectada!</p>
                      <p className="text-red-700 mt-1">
                        A soma dos lotes ({totalBatches}) é maior que o estoque total ({productStock}). 
                        Isso pode ocorrer após múltiplas entradas ou vendas que não foram sincronizadas corretamente.
                      </p>
                    </div>
                  </div>
                  <Button
                    onClick={handleSyncStock}
                    className="w-full bg-red-600 hover:bg-red-700 text-white text-xs h-8"
                    size="sm"
                  >
                    <CheckCircle className="h-3 w-3 mr-1.5" />
                    Sincronizar Estoque (Ajustar para {totalBatches} unidades)
                  </Button>
                </div>
              );
            })()}
          </div>
        </CardContent>
      </Card>
      
      {/* Diálogo de Confirmação */}
      <ConfirmDialog
        isOpen={dialogState.isOpen}
        onClose={closeDialog}
        onConfirm={handleConfirm}
        title={dialogState.title}
        description={dialogState.description}
        confirmText={dialogState.confirmText}
        cancelText={dialogState.cancelText}
        variant={dialogState.variant}
      />
    </div>
  );
};

