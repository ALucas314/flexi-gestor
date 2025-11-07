// Página de Movimentações
// Visão consolidada do fluxo de caixa e lucro

import { useState, useMemo, useEffect } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { 
  Wallet,
  TrendingUp,
  TrendingDown,
  DollarSign,
  CheckCircle,
  AlertTriangle,
  BarChart3,
  CalendarIcon
} from "lucide-react";
import { useData } from "@/contexts/DataContext";
import { supabase } from "@/lib/supabase";
import { useAuth } from "@/contexts/AuthContext";
import { useWorkspace } from "@/contexts/WorkspaceContext";
import type { ContaPagar, OrigemPagamento } from "@/types/financial";

const Movimentacoes = () => {
  const { movements } = useData();
  const { user } = useAuth();
  const { workspaceAtivo } = useWorkspace();
  const [period, setPeriod] = useState<string>("todos");
  const [contasPagar, setContasPagar] = useState<ContaPagar[]>([]);
  const [loadingContas, setLoadingContas] = useState(false);

  // Carregar contas a pagar para calcular saldos
  useEffect(() => {
    const carregarContasPagar = async () => {
      if (!user?.id || !workspaceAtivo?.id) return;
      
      setLoadingContas(true);
      try {
        const { data, error } = await supabase
          .from('contas_pagar')
          .select('*')
          .eq('workspace_id', workspaceAtivo.id)
          .in('status', ['pago', 'finalizado'])
          .order('data_pagamento', { ascending: false });

        if (error) throw error;

        const contasFormatadas: ContaPagar[] = (data || []).map((c: any) => ({
          id: c.id,
          descricao: c.descricao,
          valor: parseFloat(c.valor) || 0,
          valor_pago: parseFloat(c.valor_pago) || 0,
          valor_restante: parseFloat(c.valor_restante) || 0,
          data_compra: c.data_compra ? new Date(c.data_compra) : new Date(c.criado_em),
          data_registro: c.data_registro ? new Date(c.data_registro) : new Date(c.criado_em),
          data_vencimento: new Date(c.data_vencimento),
          data_pagamento: c.data_pagamento ? new Date(c.data_pagamento) : undefined,
          status: c.status,
          categoria_dre: c.categoria_dre,
          fornecedor: c.fornecedor || '',
          forma_pagamento: c.forma_pagamento,
          origem_pagamento: c.origem_pagamento as OrigemPagamento | undefined,
          numero_parcelas: c.numero_parcelas || 1,
          observacoes: c.observacoes || '',
          movimento_id: c.movimento_id || '',
          usuario_id: c.usuario_id,
          workspace_id: c.workspace_id,
          criado_em: new Date(c.criado_em),
          atualizado_em: new Date(c.atualizado_em)
        }));

        setContasPagar(contasFormatadas);
      } catch (error) {
        console.error('Erro ao carregar contas a pagar:', error);
      } finally {
        setLoadingContas(false);
      }
    };

    carregarContasPagar();
  }, [user?.id, workspaceAtivo?.id]);

  // Função para filtrar movimentações por período
  const getMovementsByPeriod = () => {
    const now = new Date();
    
    if (period === "mes") {
      return movements.filter(m => {
        const movementDate = new Date(m.date);
        return movementDate.getMonth() === now.getMonth() && 
               movementDate.getFullYear() === now.getFullYear();
      });
    } else if (period === "ano") {
      return movements.filter(m => {
        const movementDate = new Date(m.date);
        return movementDate.getFullYear() === now.getFullYear();
      });
    }
    
    return movements;
  };

  const periodMovements = getMovementsByPeriod();

  // Calcular valores financeiros baseados nas movimentações filtradas por período
  const entradas = periodMovements.filter(m => m.type === 'entrada');
  const saidas = periodMovements.filter(m => m.type === 'saida');
  
  const totalEntradas = entradas.reduce((sum, m) => sum + m.total, 0); // Custos de compra
  const totalSaidas = saidas.reduce((sum, m) => sum + m.total, 0); // Receitas de venda
  const lucroBruto = totalSaidas - totalEntradas; // Lucro = Receitas - Custos

  // Filtrar contas pagas pelo período
  const contasPagasPeriodo = useMemo(() => {
    if (period === "todos") return contasPagar;
    
    const now = new Date();
    return contasPagar.filter(c => {
      if (!c.data_pagamento) return false;
      const dataPagamento = new Date(c.data_pagamento);
      
      if (period === "mes") {
        return dataPagamento.getMonth() === now.getMonth() && 
               dataPagamento.getFullYear() === now.getFullYear();
      } else if (period === "ano") {
        return dataPagamento.getFullYear() === now.getFullYear();
      }
      return true;
    });
  }, [contasPagar, period]);

  // Calcular valores debitados do caixa e banco
  const totalDebitadoCaixa = useMemo(() => {
    return contasPagasPeriodo
      .filter(c => c.origem_pagamento === 'caixa')
      .reduce((sum, c) => sum + c.valor_pago, 0);
  }, [contasPagasPeriodo]);

  const totalDebitadoBanco = useMemo(() => {
    return contasPagasPeriodo
      .filter(c => c.origem_pagamento === 'banco')
      .reduce((sum, c) => sum + c.valor_pago, 0);
  }, [contasPagasPeriodo]);

  // Calcular saldos reais
  // Caixa: Receitas de vendas - Contas pagas do caixa
  const saldoCaixa = totalSaidas - totalDebitadoCaixa;
  
  // Banco: Lucro líquido - Contas pagas do banco
  const saldoBanco = lucroBruto - totalDebitadoBanco;

  // Estatísticas
  const totalMovements = periodMovements.length;
  const productosMovimentados = new Set(periodMovements.map(m => m.productId)).size;

  return (
    <div className="space-y-6 p-4 sm:p-6">
      {/* Cabeçalho */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl sm:text-3xl font-bold text-gray-900 flex items-center gap-2">
            <Wallet className="h-7 w-7 sm:h-8 sm:w-8 text-cyan-600" />
            Movimentações
          </h1>
          <p className="text-sm text-gray-600 mt-1">
            Fluxo de Caixa - Visão consolidada do período
          </p>
        </div>

        {/* Filtro de Período */}
        <Select value={period} onValueChange={setPeriod}>
          <SelectTrigger className="w-full sm:w-[200px]">
            <SelectValue placeholder="Período" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="todos">Todos os períodos</SelectItem>
            <SelectItem value="mes">Este mês</SelectItem>
            <SelectItem value="ano">Este ano</SelectItem>
          </SelectContent>
        </Select>
      </div>

      {/* Card Principal */}
      <Card className="bg-gradient-to-br from-cyan-50 to-blue-50 border-cyan-200 shadow-lg">
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-cyan-900">
            <Wallet className="h-6 w-6 text-cyan-600" />
            Movimentações
          </CardTitle>
          <CardDescription className="text-cyan-700">
            Visão consolidada do fluxo de caixa e lucro do período
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          {/* Seção CAIXA */}
          <div className="space-y-4">
            <div className="flex items-center gap-2 mb-4">
              <div className="w-1 h-8 bg-blue-500 rounded-full"></div>
              <h2 className="text-2xl font-bold text-blue-900">Caixa</h2>
              <Badge variant="outline" className="ml-2 text-blue-700 border-blue-300">
                Movimentações
              </Badge>
            </div>
            
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              {/* Card Entradas */}
              <Card className="bg-gradient-to-br from-green-50 to-emerald-50 border-green-200 shadow-md hover:shadow-lg transition-shadow">
                <CardHeader className="pb-3">
                  <CardTitle className="flex items-center gap-2 text-green-900 text-lg">
                    <TrendingUp className="h-5 w-5 text-green-600" />
                    Entradas
                  </CardTitle>
                  <CardDescription className="text-green-700">
                    Total de compras realizadas
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="space-y-2">
                    <div className="text-3xl font-bold text-green-700">
                      R$ {totalEntradas.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
                    </div>
                    <div className="flex items-center gap-2 text-sm text-green-600">
                      <Badge variant="outline" className="bg-green-100 text-green-800 border-green-300">
                        {entradas.length} registro{entradas.length !== 1 ? 's' : ''}
                      </Badge>
                    </div>
                    <div className="text-xs text-green-600 mt-2">
                      <p className="font-medium">Custos de compra</p>
                      <p className="opacity-75">Valor total investido em produtos</p>
                    </div>
                  </div>
                </CardContent>
              </Card>

              {/* Card Saídas */}
              <Card className="bg-gradient-to-br from-orange-50 to-amber-50 border-orange-200 shadow-md hover:shadow-lg transition-shadow">
                <CardHeader className="pb-3">
                  <CardTitle className="flex items-center gap-2 text-orange-900 text-lg">
                    <TrendingDown className="h-5 w-5 text-orange-600" />
                    Saídas
                  </CardTitle>
                  <CardDescription className="text-orange-700">
                    Total de vendas realizadas
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="space-y-2">
                    <div className="text-3xl font-bold text-orange-700">
                      R$ {totalSaidas.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
                    </div>
                    <div className="flex items-center gap-2 text-sm text-orange-600">
                      <Badge variant="outline" className="bg-orange-100 text-orange-800 border-orange-300">
                        {saidas.length} registro{saidas.length !== 1 ? 's' : ''}
                      </Badge>
                    </div>
                    <div className="text-xs text-orange-600 mt-2">
                      <p className="font-medium">Receitas de venda</p>
                      <p className="opacity-75">Valor total recebido com vendas</p>
                    </div>
                  </div>
                </CardContent>
              </Card>

              {/* Card Total Caixa */}
              <Card className={`bg-gradient-to-br ${
                saldoCaixa >= 0 
                  ? 'from-blue-50 to-indigo-50 border-blue-200' 
                  : 'from-red-50 to-rose-50 border-red-200'
              } shadow-md hover:shadow-lg transition-shadow border-2`}>
                <CardHeader className="pb-3">
                  <CardTitle className={`flex items-center gap-2 text-lg ${
                    saldoCaixa >= 0 ? 'text-blue-900' : 'text-red-900'
                  }`}>
                    <DollarSign className={`h-5 w-5 ${
                      saldoCaixa >= 0 ? 'text-blue-600' : 'text-red-600'
                    }`} />
                    Saldo Caixa
                  </CardTitle>
                  <CardDescription className={saldoCaixa >= 0 ? 'text-blue-700' : 'text-red-700'}>
                    Receitas - Pagamentos do Caixa
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="space-y-2">
                    <div className={`text-3xl font-bold ${
                      saldoCaixa >= 0 ? 'text-blue-700' : 'text-red-700'
                    }`}>
                      {saldoCaixa >= 0 ? '+' : ''}R$ {Math.abs(saldoCaixa).toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
                    </div>
                    <div className="flex items-center gap-2 text-sm">
                      <Badge className={
                        saldoCaixa >= 0 
                          ? 'bg-green-100 text-green-800 border-green-300' 
                          : 'bg-red-100 text-red-800 border-red-300'
                      }>
                        {saldoCaixa >= 0 ? 'Positivo' : 'Negativo'}
                      </Badge>
                    </div>
                    <div className="text-xs text-gray-600 mt-2 space-y-1">
                      <p className="font-medium">Receitas: R$ {totalSaidas.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}</p>
                      <p className="opacity-75">Pagamentos do Caixa: R$ {totalDebitadoCaixa.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}</p>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </div>
          </div>

          {/* Divisor */}
          <div className="border-t border-cyan-200 my-6"></div>

          {/* Seção BANCO */}
          <div className="space-y-4">
            <div className="flex items-center gap-2 mb-4">
              <div className="w-1 h-8 bg-cyan-500 rounded-full"></div>
              <h2 className="text-2xl font-bold text-cyan-900">Banco</h2>
              <Badge variant="outline" className="ml-2 text-cyan-700 border-cyan-300">
                Lucro Líquido
              </Badge>
            </div>

            <Card className={`bg-gradient-to-br ${
              saldoBanco >= 0 
                ? 'from-emerald-50 to-green-50 border-emerald-200' 
                : 'from-red-50 to-rose-50 border-red-200'
            } shadow-xl border-2`}>
              <CardHeader className="pb-4">
                <CardTitle className={`flex items-center gap-2 text-2xl ${
                  saldoBanco >= 0 ? 'text-emerald-900' : 'text-red-900'
                }`}>
                  {saldoBanco >= 0 ? (
                    <CheckCircle className="h-7 w-7 text-emerald-600" />
                  ) : (
                    <AlertTriangle className="h-7 w-7 text-red-600" />
                  )}
                  Saldo Banco
                </CardTitle>
                <CardDescription className={saldoBanco >= 0 ? 'text-emerald-700' : 'text-red-700'}>
                  Lucro Líquido - Pagamentos do Banco
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-6">
                  {/* Valor Principal */}
                  <div className="text-center py-6 bg-white/60 rounded-xl border-2 border-dashed border-emerald-300">
                    <div className={`text-5xl font-black mb-2 ${
                      saldoBanco >= 0 ? 'text-emerald-600' : 'text-red-600'
                    }`}>
                      {saldoBanco >= 0 ? '+' : ''}R$ {Math.abs(saldoBanco).toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
                    </div>
                    <Badge className={`text-lg px-4 py-2 ${
                      saldoBanco >= 0 
                        ? 'bg-emerald-100 text-emerald-800 border-emerald-300' 
                        : 'bg-red-100 text-red-800 border-red-300'
                    }`}>
                      {saldoBanco >= 0 ? 'Positivo' : 'Negativo'}
                    </Badge>
                  </div>

                  {/* Detalhamento */}
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div className="bg-white/60 rounded-lg p-4 border border-emerald-200">
                      <div className="flex items-center justify-between mb-2">
                        <span className="text-sm font-medium text-emerald-700">Lucro Líquido</span>
                        <BarChart3 className="h-4 w-4 text-emerald-600" />
                      </div>
                      <div className="text-2xl font-bold text-emerald-700">
                        R$ {lucroBruto.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
                      </div>
                      <p className="text-xs text-gray-600 mt-1">
                        Receitas - Custos
                      </p>
                    </div>

                    <div className="bg-white/60 rounded-lg p-4 border border-red-200">
                      <div className="flex items-center justify-between mb-2">
                        <span className="text-sm font-medium text-red-700">Pagamentos do Banco</span>
                        <TrendingUp className="h-4 w-4 text-red-600" />
                      </div>
                      <div className="text-2xl font-bold text-red-700">
                        R$ {totalDebitadoBanco.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
                      </div>
                      <p className="text-xs text-gray-600 mt-1">
                        Contas pagas do banco
                      </p>
                    </div>
                  </div>

                  {/* Margem de Lucro */}
                  {totalSaidas > 0 && (
                    <div className="bg-white/60 rounded-lg p-4 border border-cyan-200">
                      <div className="flex items-center justify-between">
                        <span className="text-sm font-medium text-cyan-700">Margem de Lucro</span>
                        <BarChart3 className="h-4 w-4 text-cyan-600" />
                      </div>
                      <div className={`text-2xl font-bold mt-2 ${
                        lucroBruto >= 0 ? 'text-emerald-700' : 'text-red-700'
                      }`}>
                        {((lucroBruto / totalSaidas) * 100).toFixed(2)}%
                      </div>
                      <p className="text-xs text-cyan-600 mt-1 opacity-75">
                        Percentual de lucro sobre as receitas
                      </p>
                    </div>
                  )}
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Resumo Visual */}
          <Card className="bg-gradient-to-r from-slate-50 to-gray-50 border-slate-200">
            <CardHeader>
              <CardTitle className="text-slate-800 text-lg">Resumo do Período</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div className="text-center p-4 bg-white rounded-lg border border-green-200">
                  <p className="text-sm text-gray-600 mb-1">Total de Movimentações</p>
                  <p className="text-2xl font-bold text-gray-900">{totalMovements}</p>
                </div>
                <div className="text-center p-4 bg-white rounded-lg border border-blue-200">
                  <p className="text-sm text-gray-600 mb-1">Produtos Movimentados</p>
                  <p className="text-2xl font-bold text-gray-900">{productosMovimentados}</p>
                </div>
                <div className={`text-center p-4 bg-white rounded-lg border-2 ${
                  lucroBruto >= 0 ? 'border-emerald-300' : 'border-red-300'
                }`}>
                  <p className="text-sm text-gray-600 mb-1">Resultado Final</p>
                  <p className={`text-2xl font-bold ${
                    lucroBruto >= 0 ? 'text-emerald-700' : 'text-red-700'
                  }`}>
                    {lucroBruto >= 0 ? 'Lucro' : 'Prejuízo'}
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>
        </CardContent>
      </Card>
    </div>
  );
};

export default Movimentacoes;

