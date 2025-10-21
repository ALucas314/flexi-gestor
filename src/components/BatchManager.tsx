// 📅 Componente para Gerenciar Lotes de Produtos
// Permite adicionar, editar e visualizar lotes com datas de fabricação e validade

import React, { useState, useEffect } from 'react';
import { Button } from './ui/button';
import { Input } from './ui/input';
import { Label } from './ui/label';
import { Card, CardContent, CardHeader, CardTitle } from './ui/card';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from './ui/dialog';
import { Badge } from './ui/badge';
import { 
  Plus, 
  Calendar, 
  Package, 
  AlertTriangle,
  CheckCircle,
  Trash2,
  Edit
} from 'lucide-react';
import { getBatchesByProduct, createBatch, deleteBatch } from '@/lib/batches';
import { useAuth } from '@/contexts/AuthContext';
import { useToast } from '@/hooks/use-toast';

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
  productStock: number; // Estoque total do produto
  onBatchesChange?: () => void; // Callback quando lotes mudarem
}

export const BatchManager: React.FC<BatchManagerProps> = ({ 
  productId, 
  productName,
  productStock,
  onBatchesChange 
}) => {
  const { toast } = useToast();
  const { user } = useAuth();
  const [batches, setBatches] = useState<Batch[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [formData, setFormData] = useState({
    batchNumber: '',
    quantity: '',
    manufactureDate: '',
    expiryDate: ''
  });

  // Carregar lotes do produto
  const loadBatches = async () => {
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
      
      // Gerar próximo número de lote automaticamente
      const nextBatchNumber = batchesData.length + 1;
      setFormData(prev => ({
        ...prev,
        batchNumber: nextBatchNumber.toString()
      }));
    } catch (error) {
      console.error('Erro ao carregar lotes:', error);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    if (user?.id && productId) {
      loadBatches();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [productId]);

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

      setIsLoading(true);

      await createBatch(
        productId,
        formData.batchNumber,
        quantity,
        0, // unitCost - pode ser zero aqui
        user.id,
        formData.manufactureDate ? new Date(formData.manufactureDate) : undefined,
        formData.expiryDate ? new Date(formData.expiryDate) : undefined
      );

      toast({
        title: '✅ Lote Adicionado!',
        description: `Lote ${formData.batchNumber} foi criado com sucesso`,
        variant: 'default'
      });

      // Recarregar lotes
      await loadBatches();
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
    
    if (!confirm(`Deseja realmente deletar o lote ${batchNumber}?`)) {
      return;
    }

    try {
      setIsLoading(true);
      await deleteBatch(batchId, user.id);

      toast({
        title: '✅ Lote Deletado!',
        description: `Lote ${batchNumber} foi removido com sucesso`,
        variant: 'default'
      });

      await loadBatches();
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
  };

  // Calcular status do lote (vencido, próximo do vencimento, ok)
  const getBatchStatus = (expiryDate: string | null) => {
    if (!expiryDate) return { label: 'Sem Validade', color: 'gray', icon: Package };

    const today = new Date();
    const expiry = new Date(expiryDate);
    const diffDays = Math.ceil((expiry.getTime() - today.getTime()) / (1000 * 60 * 60 * 24));

    if (diffDays < 0) {
      return { label: 'Vencido', color: 'red', icon: AlertTriangle };
    } else if (diffDays <= 30) {
      return { label: `Vence em ${diffDays} dias`, color: 'yellow', icon: AlertTriangle };
    } else {
      return { label: `Vence em ${diffDays} dias`, color: 'green', icon: CheckCircle };
    }
  };

  return (
    <div className="space-y-4">
      {/* Cabeçalho com botão de adicionar */}
      <div className="flex items-center justify-between">
        <div>
          <h3 className="text-lg font-semibold text-gray-900">📅 Lotes do Produto</h3>
          <p className="text-sm text-gray-600">{productName}</p>
        </div>
        
        <Dialog 
          open={isDialogOpen} 
          onOpenChange={(open) => {
            setIsDialogOpen(open);
            if (open) {
              // Gerar próximo número automaticamente ao abrir
              const nextBatchNumber = batches.length + 1;
              setFormData(prev => ({
                ...prev,
                batchNumber: nextBatchNumber.toString(),
                quantity: '',
                manufactureDate: '',
                expiryDate: ''
              }));
            }
          }}
        >
          <DialogTrigger asChild>
            <Button className="bg-gradient-to-r from-indigo-600 to-purple-600 hover:from-indigo-700 hover:to-purple-700 text-white">
              <Plus className="mr-2 h-4 w-4" />
              Novo Lote
            </Button>
          </DialogTrigger>
          <DialogContent className="sm:max-w-md">
            <DialogHeader>
              <DialogTitle className="flex items-center space-x-2">
                <Package className="h-5 w-5 text-indigo-600" />
                <span>Adicionar Novo Lote</span>
              </DialogTitle>
            </DialogHeader>
            
            <div className="space-y-4 py-4">
              <div className="space-y-2">
                <Label htmlFor="batchNumber" className="flex items-center justify-between">
                  <span>📦 Número do Lote *</span>
                  <span className="text-xs text-gray-500 font-normal">
                    Sugestão: {batches.length + 1}
                  </span>
                </Label>
                <Input
                  id="batchNumber"
                  placeholder="Gerado automaticamente"
                  value={formData.batchNumber}
                  onChange={(e) => setFormData(prev => ({ ...prev, batchNumber: e.target.value }))}
                  className="font-semibold"
                />
                <p className="text-xs text-gray-600">
                  💡 O número é gerado automaticamente, mas você pode alterá-lo
                </p>
              </div>

              <div className="space-y-2">
                <Label htmlFor="quantity">🔢 Quantidade *</Label>
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
                        placeholder={`Máximo: ${availableStock} unidades disponíveis`}
                        value={formData.quantity}
                        onChange={(e) => {
                          const value = parseInt(e.target.value) || 0;
                          if (value <= availableStock || e.target.value === '') {
                            setFormData(prev => ({ ...prev, quantity: e.target.value }));
                          }
                        }}
                        className={`text-lg font-semibold ${
                          parseInt(formData.quantity) > availableStock ? 'border-red-500 focus:ring-red-500' : ''
                        }`}
                      />
                      <div className="text-xs space-y-1">
                        <p className="text-gray-600">
                          📦 Estoque total: <span className="font-bold text-gray-900">{productStock} unidades</span>
                        </p>
                        <p className="text-gray-600">
                          ✅ Já alocado: <span className="font-bold text-orange-600">{totalAllocated} unidades</span>
                        </p>
                        <p className="text-gray-600">
                          🎯 Disponível para alocar: <span className="font-bold text-green-600">{availableStock} unidades</span>
                        </p>
                        {parseInt(formData.quantity) > availableStock && (
                          <span className="block text-red-600 font-semibold mt-1">
                            ⚠️ Quantidade excede o estoque disponível!
                          </span>
                        )}
                      </div>
                    </>
                  );
                })()}
              </div>

              <div className="space-y-2">
                <Label htmlFor="manufactureDate">🏭 Data de Fabricação (Opcional)</Label>
                <Input
                  id="manufactureDate"
                  type="date"
                  value={formData.manufactureDate}
                  onChange={(e) => setFormData(prev => ({ ...prev, manufactureDate: e.target.value }))}
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="expiryDate">⏰ Data de Validade (Opcional)</Label>
                <Input
                  id="expiryDate"
                  type="date"
                  value={formData.expiryDate}
                  onChange={(e) => setFormData(prev => ({ ...prev, expiryDate: e.target.value }))}
                />
                <p className="text-xs text-gray-600">
                  💡 Sistema alerta automaticamente quando estiver próximo do vencimento
                </p>
              </div>

              <div className="flex gap-2 pt-4">
                <Button 
                  onClick={handleAddBatch} 
                  disabled={isLoading}
                  className="flex-1 bg-gradient-to-r from-indigo-600 to-purple-600 hover:from-indigo-700 hover:to-purple-700 text-white"
                >
                  {isLoading ? 'Adicionando...' : 'Adicionar Lote'}
                </Button>
                <Button 
                  variant="outline" 
                  onClick={() => setIsDialogOpen(false)}
                  className="flex-1"
                >
                  Cancelar
                </Button>
              </div>
            </div>
          </DialogContent>
        </Dialog>
      </div>

      {/* Lista de lotes */}
      <div className="grid gap-3">
        {isLoading && batches.length === 0 ? (
          <div className="text-center py-8 text-gray-500">
            <div className="animate-spin h-8 w-8 border-2 border-indigo-600 border-t-transparent rounded-full mx-auto mb-2"></div>
            Carregando lotes...
          </div>
        ) : batches.length === 0 ? (
          <Card className="bg-gray-50 border-dashed">
            <CardContent className="pt-6 text-center">
              <Package className="h-12 w-12 mx-auto mb-3 text-gray-400" />
              <p className="text-gray-600">Nenhum lote cadastrado</p>
              <p className="text-sm text-gray-500 mt-1">Adicione um lote para começar</p>
            </CardContent>
          </Card>
        ) : (
          batches.map((batch) => {
            const status = getBatchStatus(batch.expiryDate);
            const StatusIcon = status.icon;

            return (
              <Card 
                key={batch.id} 
                className={`hover:shadow-md transition-all ${
                  status.color === 'red' ? 'border-red-300 bg-red-50/50' :
                  status.color === 'yellow' ? 'border-yellow-300 bg-yellow-50/50' :
                  'border-gray-200'
                }`}
              >
                <CardContent className="p-4">
                  <div className="flex items-start justify-between">
                    <div className="flex-1 space-y-2">
                      <div className="flex items-center space-x-2">
                        <Badge variant="outline" className="font-mono font-bold text-sm">
                          {batch.batchNumber}
                        </Badge>
                        <Badge 
                          className={`${
                            status.color === 'red' ? 'bg-red-500' :
                            status.color === 'yellow' ? 'bg-yellow-500' :
                            'bg-green-500'
                          } text-white`}
                        >
                          <StatusIcon className="h-3 w-3 mr-1" />
                          {status.label}
                        </Badge>
                      </div>

                      <div className="grid grid-cols-2 gap-3 text-sm">
                        <div>
                          <p className="text-gray-600">📦 Quantidade:</p>
                          <p className="font-semibold text-gray-900">{batch.quantity} unidades</p>
                        </div>

                        {batch.manufactureDate && (
                          <div>
                            <p className="text-gray-600">🏭 Fabricação:</p>
                            <p className="font-semibold text-gray-900">
                              {new Date(batch.manufactureDate).toLocaleDateString('pt-BR')}
                            </p>
                          </div>
                        )}

                        {batch.expiryDate && (
                          <div>
                            <p className="text-gray-600">⏰ Validade:</p>
                            <p className="font-semibold text-gray-900">
                              {new Date(batch.expiryDate).toLocaleDateString('pt-BR')}
                            </p>
                          </div>
                        )}
                      </div>
                    </div>

                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => handleDeleteBatch(batch.id, batch.batchNumber)}
                      className="text-red-600 hover:text-red-700 hover:bg-red-50"
                    >
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  </div>
                </CardContent>
              </Card>
            );
          })
        )}
      </div>

      {/* Resumo total */}
      <Card className="bg-gradient-to-r from-indigo-50 to-purple-50 border-indigo-200">
        <CardContent className="p-5">
          <div className="space-y-4">
            {/* Cabeçalho do Resumo */}
            <div className="flex items-center space-x-3 pb-3 border-b border-indigo-200">
              <div className="w-10 h-10 bg-gradient-to-br from-indigo-600 to-purple-600 rounded-lg flex items-center justify-center">
                <Package className="h-5 w-5 text-white" />
              </div>
              <div>
                <h4 className="font-semibold text-gray-900">📊 Resumo de Distribuição</h4>
                <p className="text-xs text-gray-600">Distribuição do estoque em lotes</p>
              </div>
            </div>

            {/* Grid de Informações */}
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              {/* Estoque Total */}
              <div className="bg-white rounded-lg p-3 border border-indigo-100">
                <p className="text-xs text-gray-600 mb-1">📦 Estoque Total</p>
                <p className="text-2xl font-bold text-gray-900">{productStock}</p>
                <p className="text-xs text-gray-500">unidades</p>
              </div>

              {/* Distribuídos em Lotes */}
              <div className="bg-white rounded-lg p-3 border border-green-100">
                <p className="text-xs text-gray-600 mb-1">✅ Em Lotes</p>
                <p className="text-2xl font-bold text-green-600">
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
              <div className="bg-white rounded-lg p-3 border border-orange-100">
                <p className="text-xs text-gray-600 mb-1">📋 Não Alocados</p>
                <p className="text-2xl font-bold text-orange-600">
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
              <div className="bg-white rounded-lg p-3 border border-indigo-100">
                <p className="text-xs text-gray-600 mb-1">🏷️ Total Lotes</p>
                <p className="text-2xl font-bold text-indigo-600">{batches.length}</p>
                <p className="text-xs text-gray-500">
                  {batches.length === 1 ? 'lote' : 'lotes'}
                </p>
              </div>
            </div>

            {/* Alerta se houver divergência */}
            {batches.reduce((sum, b) => sum + b.quantity, 0) > productStock && (
              <div className="flex items-center space-x-2 bg-red-100 border border-red-300 rounded-lg p-3">
                <AlertTriangle className="h-5 w-5 text-red-600 flex-shrink-0" />
                <div className="text-sm">
                  <p className="font-semibold text-red-900">⚠️ Atenção: Divergência Detectada!</p>
                  <p className="text-red-700">
                    A soma dos lotes ({batches.reduce((sum, b) => sum + b.quantity, 0)}) é maior que o estoque total ({productStock}). 
                    Verifique as quantidades dos lotes ou ajuste o estoque do produto.
                  </p>
                </div>
              </div>
            )}
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

