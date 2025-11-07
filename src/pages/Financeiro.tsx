// Página de Controle Financeiro
// Gerenciamento de receitas, despesas, fluxo de caixa e movimentações de estoque

import { useState, useEffect, useRef, useMemo, useCallback } from "react";
import { useLocation } from "react-router-dom";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
// Usando Lucide React
import { 
  DollarSign,
  TrendingUp,
  TrendingDown,
  CreditCard as Wallet,
  CircleArrowUp as ArrowUpCircle,
  CircleArrowDown as ArrowDownCircle,
  Package,
  Search,
  Filter,
  RotateCcw,
  Download,
  Coins as PiggyBank,
  Receipt,
  CheckCircle,
  Printer,
  Share2,
  FileText as FileSpreadsheet,
  AlertTriangle,
  BarChart3,
  Settings,
  Tag,
  ShoppingCart,
  FileText,
  ArrowRightLeft
} from "lucide-react";
import { useData } from "@/contexts/DataContext";
import { useResponsive } from "@/hooks/use-responsive";
import { printReceipt, downloadReceipt } from "@/lib/receiptPDF";
import { exportFinancialReportToPDF, type FinancialReportData } from "@/lib/financialPDF";
import { toast } from "sonner";
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Legend } from 'recharts';
import { calcularDRE, formatarMoeda, formatarPercentual, getCategoriaDRETexto } from "@/lib/dre";
import { exportDREToPDF } from "@/lib/drePDF";
import type { ContaPagar, ContaReceber, DRECategory, AccountStatus, FormaPagamento, Parcela, ParcelaStatus, OrigemPagamento, StatusPagamento, StatusRecebimento } from "@/types/financial";
import { supabase } from "@/lib/supabase";
import { useAuth } from "@/contexts/AuthContext";
import { useWorkspace } from "@/contexts/WorkspaceContext";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Calendar as CalendarIcon } from "lucide-react";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Calendar as CalendarComponent } from "@/components/ui/calendar";
import { format } from "date-fns";
import { ptBR } from "date-fns/locale";

// Tipagem auxiliar para movimentações vindas do DataContext
type MovementRecord = {
  id: string;
  type: 'entrada' | 'saida' | 'ajuste';
  productId: string;
  productName?: string;
  quantity: number;
  unitPrice: number;
  description: string;
  date: Date | string;
  total: number;
  receiptNumber?: string;
  status?: 'pendente' | 'confirmado' | 'cancelado';
  paymentMethod?: string;
};

type FormContaPagarState = {
  lancamento: Date;
  observacoes: string;
  forma_pagamento: FormaPagamento | '';
  conta_origem: OrigemPagamento;
  centro_custo: string;
  fornecedor: string;
  valor_total: number;
  parcelas: number;
  data_vencimento: Date;
  descricao: string;
  valor: number;
  data_compra: Date;
  data_registro: Date;
  categoria_dre: DRECategory | '';
  numero_parcelas: number;
  movimento_id: string;
};

type FormContaReceberState = {
  lancamento: Date;
  observacoes: string;
  forma_recebimento: FormaPagamento | '';
  conta_destino: OrigemPagamento;
  centro_custo: string;
  cliente: string;
  valor_total: number;
  parcelas: number;
  data_vencimento: Date;
  descricao: string;
  valor: number;
  categoria_dre: DRECategory | '';
  movimento_id: string;
};

const Financeiro = () => {
  const { isMobile } = useResponsive();
  const { movements, products } = useData();
  const { user } = useAuth();
  const { workspaceAtivo } = useWorkspace();
  const location = useLocation();
  const [searchTerm, setSearchTerm] = useState("");
  const [filterType, setFilterType] = useState<string>("todos");
  const [filterProduct, setFilterProduct] = useState<string>("todos");
  const [period, setPeriod] = useState<string>("todos");
  const [isLoading, setIsLoading] = useState(true);
  const [showReceipt, setShowReceipt] = useState(false);
  const [showPurchase, setShowPurchase] = useState(false);
  const [selectedMovement, setSelectedMovement] = useState<any>(null);
  const [showAllMovements, setShowAllMovements] = useState(false);

  // Estados para Contas a Pagar e Contas a Receber
  const [contasPagarBase, setContasPagarBase] = useState<ContaPagar[]>([]); // Contas vindas do banco
  const [contasPagar, setContasPagar] = useState<ContaPagar[]>([]); // Contas exibidas (com banco + derivadas)
  const [contasReceberBase, setContasReceberBase] = useState<ContaReceber[]>([]); // Contas vindas do banco
  const [contasReceber, setContasReceber] = useState<ContaReceber[]>([]); // Contas exibidas (com banco + derivadas)
  const [loadingContas, setLoadingContas] = useState(false);
  const [showDialogContaPagar, setShowDialogContaPagar] = useState(false);
  const [showDialogContaReceber, setShowDialogContaReceber] = useState(false);
  const [contaPagarEditando, setContaPagarEditando] = useState<ContaPagar | null>(null);
  const [contaReceberEditando, setContaReceberEditando] = useState<ContaReceber | null>(null);

  // 👉 Referências para sincronizar rolagem horizontal das tabelas com barra superior
  const scrollContasPagarTopRef = useRef<HTMLDivElement | null>(null);
  const scrollContasPagarBodyRef = useRef<HTMLDivElement | null>(null);
  const sincronizandoContasPagar = useRef(false);

  const scrollContasReceberTopRef = useRef<HTMLDivElement | null>(null);
  const scrollContasReceberBodyRef = useRef<HTMLDivElement | null>(null);
  const sincronizandoContasReceber = useRef(false);
  
  const createInitialFormContaPagar = (): FormContaPagarState => ({
    lancamento: new Date(),
    observacoes: '',
    forma_pagamento: '' as FormaPagamento | '',
    conta_origem: 'caixa' as OrigemPagamento,
    centro_custo: '',
    fornecedor: '',
    valor_total: 0,
    parcelas: 1,
    data_vencimento: new Date(),
    // Campos legados para compatibilidade
    descricao: '',
    valor: 0,
    data_compra: new Date(),
    data_registro: new Date(),
    categoria_dre: '' as DRECategory | '',
    numero_parcelas: 1,
    movimento_id: ''
  });

  const createInitialFormContaReceber = (): FormContaReceberState => ({
    lancamento: new Date(),
    observacoes: '',
    forma_recebimento: '' as FormaPagamento | '',
    conta_destino: 'caixa' as OrigemPagamento,
    centro_custo: '',
    cliente: '',
    valor_total: 0,
    parcelas: 1,
    data_vencimento: new Date(),
    // Campos legados para compatibilidade
    descricao: '',
    valor: 0,
    categoria_dre: '' as DRECategory | '',
    movimento_id: ''
  });

  // Estados para formulários
  const [formContaPagar, setFormContaPagar] = useState<FormContaPagarState>(createInitialFormContaPagar());
  const [formContaReceber, setFormContaReceber] = useState<FormContaReceberState>(createInitialFormContaReceber());

  // Estados para DRE
  const [drePeriodoInicio, setDrePeriodoInicio] = useState<Date>(new Date(new Date().getFullYear(), new Date().getMonth(), 1));
  const [drePeriodoFim, setDrePeriodoFim] = useState<Date>(new Date());

  // Estado para controlar a aba ativa
  const [abaAtiva, setAbaAtiva] = useState<string>("movimentacoes");

  // Estados para busca de fornecedores e clientes
  const [fornecedorSearchTerm, setFornecedorSearchTerm] = useState("");
  const [showFornecedorDropdown, setShowFornecedorDropdown] = useState(false);
  const [clienteSearchTerm, setClienteSearchTerm] = useState("");
  const [showClienteDropdown, setShowClienteDropdown] = useState(false);
  const fornecedorInputRef = useRef<HTMLDivElement>(null);
  const clienteInputRef = useRef<HTMLDivElement>(null);
  
  // Estados para filtros de Contas a Pagar
  const [filtroFornecedor, setFiltroFornecedor] = useState<string>("todos");
  const [filtroFormaPagamento, setFiltroFormaPagamento] = useState<string>("todos");
  const [filtroStatus, setFiltroStatus] = useState<string>("todos");
  const [filtroPeriodo, setFiltroPeriodo] = useState<string>("todos");
  
  const limparFiltrosContasPagar = () => {
    setFiltroFornecedor('todos');
    setFiltroFormaPagamento('todos');
    setFiltroStatus('todos');
    setFiltroPeriodo('todos');
  };

  // Estados para gestão de parcelas
  const [showDialogParcelas, setShowDialogParcelas] = useState(false);
  const [contaSelecionadaParcelas, setContaSelecionadaParcelas] = useState<ContaPagar | null>(null);
  const [parcelas, setParcelas] = useState<Parcela[]>([]);
  
  // Estado para finalizar pagamento
  const [showDialogFinalizarPagamento, setShowDialogFinalizarPagamento] = useState(false);
  const [contaParaFinalizar, setContaParaFinalizar] = useState<ContaPagar | null>(null);
  const [dataPagamentoFinal, setDataPagamentoFinal] = useState<Date>(new Date());
  const [origemPagamentoFinal, setOrigemPagamentoFinal] = useState<OrigemPagamento>('caixa');

  // Função para abrir a receita de uma movimentação (saída)
  const openReceipt = (movement: any) => {
    setSelectedMovement(movement);
    setShowReceipt(true);
  };

  // Função para abrir o comprovante de compra (entrada)
  const openPurchase = (movement: any) => {
    setSelectedMovement(movement);
    setShowPurchase(true);
  };

  // Controlar estado de carregamento
  useEffect(() => {
    const timer = setTimeout(() => {
      setIsLoading(false);
    }, 500);
    
    return () => clearTimeout(timer);
  }, []);

  // Abrir modal automaticamente se houver um ID na navegação
  useEffect(() => {
    if (location.state?.openMovementId && movements.length > 0) {
      const movement = movements.find(m => m.id === location.state.openMovementId);
      if (movement) {
        if (movement.type === 'saida') {
          openReceipt(movement);
        } else if (movement.type === 'entrada') {
          openPurchase(movement);
        }
      }
      // Limpar o state após abrir
      window.history.replaceState({}, document.title);
    }
  }, [location.state, movements]);

  // Filtrar movimentações por período
  const getMovementsByPeriod = () => {
    const now = new Date();
    if (period === "todos") return movements;
    
    return movements.filter(m => {
      const movementDate = new Date(m.date);
      const currentMonth = now.getMonth();
      const currentYear = now.getFullYear();
      
      if (period === "mes") {
        return movementDate.getMonth() === currentMonth && movementDate.getFullYear() === currentYear;
      } else if (period === "trimestre") {
        const quarter = Math.floor(currentMonth / 3);
        const movementQuarter = Math.floor(movementDate.getMonth() / 3);
        return movementQuarter === quarter && movementDate.getFullYear() === currentYear;
      } else if (period === "ano") {
        return movementDate.getFullYear() === currentYear;
      }
      return true;
    });
  };

  // 🗓️ Função auxiliar que indica se uma data pertence ao período atualmente selecionado.
  const estaNoPeriodoAtual = useCallback((valor: Date | string | null | undefined) => {
    if (period === "todos") return true;
    if (!valor) return false;

    const data = valor instanceof Date ? valor : new Date(valor);
    if (Number.isNaN(data.getTime())) return false;

    const agora = new Date();

    if (period === "mes") {
      return data.getMonth() === agora.getMonth() && data.getFullYear() === agora.getFullYear();
    }

    if (period === "trimestre") {
      const trimestreAtual = Math.floor(agora.getMonth() / 3);
      const trimestreData = Math.floor(data.getMonth() / 3);
      return trimestreData === trimestreAtual && data.getFullYear() === agora.getFullYear();
    }

    if (period === "ano") {
      return data.getFullYear() === agora.getFullYear();
    }

    return true;
  }, [period]);

  const periodMovements = getMovementsByPeriod();

  // 💵 Soma quanto já foi pago em contas a pagar, agrupando por origem (caixa ou banco).
  const pagamentosPorOrigem = useMemo(() => {
    const totais = { caixa: 0, banco: 0 } as Record<OrigemPagamento, number>;

    contasPagar.forEach((conta) => {
      const origem = (conta.conta_origem || conta.origem_pagamento || (conta.forma_pagamento === 'dinheiro' ? 'caixa' : undefined)) as OrigemPagamento | undefined;
      if (origem !== 'caixa' && origem !== 'banco') return;

      const valorTotal = Number(conta.valor_total ?? conta.valor ?? 0);
      const restante = Number(conta.valor_restante ?? Math.max(valorTotal - Number(conta.valor_pago ?? 0), 0));
      const valorPago = Math.max(valorTotal - restante, 0);
      if (!valorPago || Number.isNaN(valorPago) || valorPago <= 0) return;

      const dataReferencia = conta.data_pagamento ?? conta.atualizado_em ?? conta.data_vencimento ?? conta.lancamento;
      if (!estaNoPeriodoAtual(dataReferencia)) return;

      totais[origem] += valorPago;
    });

    return totais;
  }, [contasPagar, estaNoPeriodoAtual]);

  // 💰 Soma quanto já foi recebido em contas a receber, agrupando por destino (caixa ou banco).
  const recebimentosPorOrigem = useMemo(() => {
    const totais = { caixa: 0, banco: 0 } as Record<OrigemPagamento, number>;

    contasReceber.forEach((conta) => {
      const origemLegada = (conta as Record<string, any>)?.origem_pagamento as OrigemPagamento | undefined;
      const origem = (conta.conta_destino || origemLegada || (conta.forma_recebimento === 'dinheiro' ? 'caixa' : undefined)) as OrigemPagamento | undefined;
      if (origem !== 'caixa' && origem !== 'banco') return;

      const valorTotal = Number(conta.valor_total ?? conta.valor ?? 0);
      const restante = Number(conta.valor_restante ?? Math.max(valorTotal - Number(conta.valor_recebido ?? 0), 0));
      const valorRecebido = Math.max(valorTotal - restante, 0);
      if (!valorRecebido || Number.isNaN(valorRecebido) || valorRecebido <= 0) return;

      const dataReferencia = conta.data_recebimento ?? conta.atualizado_em ?? conta.data_vencimento ?? conta.lancamento;
      if (!estaNoPeriodoAtual(dataReferencia)) return;

      totais[origem] += valorRecebido;
    });

    return totais;
  }, [contasReceber, estaNoPeriodoAtual]);

  // Calcular valores financeiros baseados nas movimentações filtradas por período
  const entradas = periodMovements.filter(m => m.type === 'entrada');
  const saidas = periodMovements.filter(m => m.type === 'saida');
  
  const totalEntradas = entradas.reduce((sum, m) => sum + m.total, 0); // Custos de compra
  const totalSaidas = saidas.reduce((sum, m) => sum + m.total, 0); // Receitas de venda
  const saldo = totalSaidas - totalEntradas; // Lucro = Receitas - Custos

  // 💳 Valores líquidos considerando os pagamentos efetivados em cada origem
  const pagamentosCaixa = pagamentosPorOrigem.caixa ?? 0;
  const pagamentosBanco = pagamentosPorOrigem.banco ?? 0;
  const recebimentosCaixa = recebimentosPorOrigem.caixa ?? 0;
  const recebimentosBanco = recebimentosPorOrigem.banco ?? 0;
  const saldoCaixa = totalSaidas + recebimentosCaixa - pagamentosCaixa;
  const saldoBanco = (saldo + recebimentosBanco) - pagamentosBanco;

  // Calcular lucro por produto (considerando apenas o custo das unidades vendidas)
  const profitByProduct = products.map(product => {
    const productEntradas = entradas.filter(m => m.productId === product.id);
    const productSaidas = saidas.filter(m => m.productId === product.id);
    
    const quantidadeVendida = productSaidas.reduce((sum, m) => sum + m.quantity, 0);
    const quantidadeComprada = productEntradas.reduce((sum, m) => sum + m.quantity, 0);
    const totalVenda = productSaidas.reduce((sum, m) => sum + m.total, 0); // Receita de venda
    
    // Calcular custo médio ponderado das compras
    let custoMedioPonderado = 0;
    let totalGastoCompras = 0;
    let totalQuantidadeCompras = 0;
    
    if (productEntradas.length > 0) {
      totalGastoCompras = productEntradas.reduce((sum, m) => sum + m.total, 0);
      totalQuantidadeCompras = productEntradas.reduce((sum, m) => sum + m.quantity, 0);
      custoMedioPonderado = totalQuantidadeCompras > 0 ? totalGastoCompras / totalQuantidadeCompras : 0;
    }
    
    // Custo apenas das unidades vendidas (não de todas as compras)
    const custoDasVendas = quantidadeVendida * custoMedioPonderado;
    const totalCompraVendas = custoDasVendas; // Custo apenas do que foi vendido
    
    // Lucro = Receita de Venda - Custo das unidades vendidas
    const lucro = totalVenda - custoDasVendas;
    
    return {
      productId: product.id,
      productName: product.name,
      productSku: product.sku,
      totalCompra: totalCompraVendas, // Custo apenas das vendas
      totalCompraTotal: totalGastoCompras, // Custo total de todas as compras (para referência)
      totalVenda,
      lucro,
      quantidadeVendida,
      quantidadeComprada,
      custoMedio: custoMedioPonderado,
    };
  }).filter(p => p.totalVenda > 0 || p.totalCompraTotal > 0); // Apenas produtos com movimentações

  // Função helper para calcular margem de contribuição em porcentagem
  // Margem = (Lucro / Total de Venda) × 100
  const calcularMargemContribuicao = (lucro: number, totalVenda: number): number => {
    if (!totalVenda || totalVenda === 0) return 0;
    const margem = (lucro / totalVenda) * 100;
    return Number(margem.toFixed(2)); // Arredondar para 2 casas decimais
  };

  // Função helper para formatar margem como percentual
  const formatarMargemPercentual = (margem: number): string => {
    const sinal = margem >= 0 ? '+' : '';
    return `${sinal}${margem.toLocaleString('pt-BR', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}%`;
  };

  // Lucro total de todos os produtos
  const lucroTotal = profitByProduct.reduce((sum, p) => sum + p.lucro, 0);
  
  // Ordenar por lucro (maior para menor)
  const profitByProductSorted = [...profitByProduct].sort((a, b) => b.lucro - a.lucro);

  // Movimentações do mês atual (usando periodMovements se período for "mes")
  const now = new Date();
  const thisMonthMovements = period === "mes" ? periodMovements : movements.filter(m => {
    const movementDate = new Date(m.date);
    return movementDate.getMonth() === now.getMonth() && movementDate.getFullYear() === now.getFullYear();
  });

  const thisMonthEntradas = thisMonthMovements.filter(m => m.type === 'entrada').reduce((sum, m) => sum + m.total, 0);
  const thisMonthSaidas = thisMonthMovements.filter(m => m.type === 'saida').reduce((sum, m) => sum + m.total, 0);
  const thisMonthSaldo = thisMonthSaidas - thisMonthEntradas; // Lucro do mês = Receitas - Custos

  // Filtros para movimentações (usando periodMovements)
  const filteredMovements = periodMovements.filter(movement => {
    const matchesSearch = movement.productName.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         movement.description.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesType = filterType === "todos" || movement.type === filterType;
    const matchesProduct = filterProduct === "todos" || movement.productId === filterProduct;
    
    return matchesSearch && matchesType && matchesProduct;
  });

  // Estatísticas
  const totalMovements = periodMovements.length;
  const productosMovimentados = new Set(periodMovements.map(m => m.productId)).size;
  const totalProducts = products.length;
  const totalStockValue = products.reduce((sum, p) => sum + (p.price * p.stock), 0);
  const lowStockProducts = products.filter(p => p.stock <= p.minStock && p.minStock > 0);

  // Função helper para formatar data compatível com Excel
  const formatDateForExcel = (date: Date) => {
    const d = new Date(date);
    const day = String(d.getDate()).padStart(2, '0');
    const month = String(d.getMonth() + 1).padStart(2, '0');
    const year = d.getFullYear();
    return `${day}/${month}/${year}`;
  };

  // Função para exportar relatório completo em PDF
  const exportToPDF = () => {
    try {
      // Preparar dados mensais para o gráfico
      const monthlyDataMap = movements.reduce((acc: any, movement) => {
        const date = new Date(movement.date);
        const monthKey = `${date.getMonth() + 1}/${date.getFullYear()}`;
        const monthLabel = date.toLocaleDateString('pt-BR', { month: 'short', year: 'numeric' });
        
        if (!acc[monthKey]) {
          acc[monthKey] = {
            month: monthLabel,
            entradas: 0,
            saidas: 0,
          };
        }
        
        if (movement.type === 'entrada') {
          acc[monthKey].entradas += movement.total;
        } else if (movement.type === 'saida') {
          acc[monthKey].saidas += movement.total;
        }
        
        return acc;
      }, {});

      const monthlyData = Object.entries(monthlyDataMap)
        .map(([key, value]: [string, any]) => ({
          ...value,
          sortKey: key
        }))
        .sort((a: any, b: any) => {
          const [monthA, yearA] = a.sortKey.split('/').map(Number);
          const [monthB, yearB] = b.sortKey.split('/').map(Number);
          if (yearA !== yearB) return yearA - yearB;
          return monthA - monthB;
        })
        .slice(-6)
        .map((item: any) => {
          const { sortKey, ...rest } = item;
          return rest;
        });

      // Preparar produtos com estoque baixo
      const lowStockProductsFormatted = products
        .filter(p => {
          const stock = typeof p.stock === 'number' ? p.stock : parseFloat(String(p.stock || 0));
          const minStock = p.minStock || 0;
          return stock <= minStock && minStock > 0;
        })
        .map(p => ({
          id: p.id,
          name: p.name,
          sku: p.sku || '',
          stock: typeof p.stock === 'number' ? p.stock : parseFloat(String(p.stock || 0)),
          minStock: p.minStock || 0
        }));

      // Preparar top produtos mais valiosos
      const topProductsFormatted = products.map(product => {
        const productEntries = entradas
          .filter(m => m.productId === product.id)
          .sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime());
        
        let unitValue = 0;
        
        if (productEntries.length > 0) {
          let totalCost = 0;
          let totalQuantity = 0;
          
          productEntries.forEach(entry => {
            totalCost += (entry.unitPrice * entry.quantity);
            totalQuantity += entry.quantity;
          });
          
          const averageCost = totalQuantity > 0 ? totalCost / totalQuantity : 0;
          unitValue = averageCost > 0 ? averageCost : (product.price || 0);
        } else {
          unitValue = product.price || 0;
        }
        
        const stock = typeof product.stock === 'number' ? product.stock : parseFloat(String(product.stock || 0));
        const totalValue = unitValue * stock;
        
        return {
          id: product.id,
          name: product.name,
          stock,
          totalValue,
          unitPrice: unitValue
        };
      })
      .filter(p => p.totalValue > 0)
      .sort((a, b) => b.totalValue - a.totalValue)
      .slice(0, 5);

      // Preparar movimentações formatadas
      const movementsFormatted: FinancialReportData['movements'] = filteredMovements.map(m => ({
        id: m.id,
        date: m.date instanceof Date ? m.date.toISOString() : (typeof m.date === 'string' ? m.date : new Date(m.date).toISOString()),
        type: m.type,
        productName: m.productName || '',
        description: m.description || '',
        quantity: m.quantity,
        unitPrice: m.unitPrice,
        total: m.total,
        paymentMethod: (m as any).paymentMethod || ''
      }));

      // Preparar lucro por produto formatado
      const profitByProductFormatted = profitByProductSorted.map(p => ({
        productName: p.productName,
        totalVenda: p.totalVenda,
        lucro: p.lucro,
        margem: calcularMargemContribuicao(p.lucro, p.totalVenda)
      }));

      const periodText = period === 'todos' ? 'Todos os Períodos' : 
                        period === 'mes' ? 'Este Mês' : 
                        period === 'trimestre' ? 'Este Trimestre' : 'Este Ano';

      const reportData: FinancialReportData = {
        period,
        periodText,
        totalProducts,
        totalStockValue,
        totalEntradas,
        totalSaidas,
        saldo,
        lucroTotal,
        totalMovements,
        productosMovimentados,
        thisMonthMovements: thisMonthMovements.length,
        lowStockProducts: lowStockProductsFormatted,
        topProducts: topProductsFormatted,
        movements: movementsFormatted,
        monthlyData,
        profitByProduct: profitByProductFormatted
      };

      exportFinancialReportToPDF(reportData, (error) => {
        toast.error("Erro ao Exportar PDF", {
          description: error,
          duration: 5000,
        });
      });

      toast.success("PDF gerado com sucesso!", {
        description: "Abra a janela de impressão para salvar como PDF",
        duration: 3000,
      });
    } catch (error) {
      toast.error("Erro ao Exportar PDF", {
        description: error instanceof Error ? error.message : "Erro desconhecido",
        duration: 5000,
      });
    }
  };

  // Função para exportar relatório em CSV (Excel) - Versão completa
  const exportToCSV = () => {
    const currentDate = new Date();
    const periodText = period === 'todos' ? 'TODOS OS PERIODOS' : 
                      period === 'mes' ? 'ESTE MES' : 
                      period === 'trimestre' ? 'ESTE TRIMESTRE' : 'ESTE ANO';
    
    const csvRows = [
      ['FLEXI GESTOR - SISTEMA DE GESTAO EMPRESARIAL'],
      ['RELATORIO EXECUTIVO DE ESTOQUE E MOVIMENTACOES'],
      [''],
      
      ['INFORMACOES DO RELATORIO'],
      ['Campo', 'Valor'],
      ['Periodo Analisado', periodText],
      ['Data de Geracao', formatDateForExcel(currentDate)],
      ['Hora de Geracao', `${String(currentDate.getHours()).padStart(2, '0')}:${String(currentDate.getMinutes()).padStart(2, '0')}`],
      [''],
      
      ['RESUMO EXECUTIVO'],
      ['Metrica', 'Valor', 'Unidade', 'Status'],
      ['Total de Produtos', totalProducts.toString(), 'unidades', totalProducts > 0 ? 'Ativo' : 'Vazio'],
      ['Valor Total do Estoque', totalStockValue.toFixed(2).replace('.', ','), 'reais', totalStockValue > 0 ? 'Positivo' : 'Zero'],
      ['Produtos Estoque Baixo', lowStockProducts.length.toString(), 'unidades', lowStockProducts.length === 0 ? 'OK' : 'Atencao'],
      ['Total de Movimentacoes', periodMovements.length.toString(), 'registros', periodMovements.length > 0 ? 'Ativo' : 'Vazio'],
      [''],
      
      ['ANALISE FINANCEIRA'],
      ['Tipo', 'Quantidade', 'Valor Total', 'Percentual', 'Status'],
      ['Entradas', entradas.length.toString(), totalEntradas.toFixed(2).replace('.', ','), entradas.length > 0 ? ((entradas.length / periodMovements.length) * 100).toFixed(1).replace('.', ',') + '%' : '0%', totalEntradas > 0 ? 'Positivo' : 'Zero'],
      ['Saidas', saidas.length.toString(), totalSaidas.toFixed(2).replace('.', ','), saidas.length > 0 ? ((saidas.length / periodMovements.length) * 100).toFixed(1).replace('.', ',') + '%' : '0%', totalSaidas > 0 ? 'Positivo' : 'Zero'],
      ['Lucro/Prejuizo', '1', saldo.toFixed(2).replace('.', ','), totalSaidas > 0 ? ((saldo / totalSaidas) * 100).toFixed(2).replace('.', ',') + '%' : '0%', saldo >= 0 ? 'Lucro' : 'Prejuizo'],
      [''],
      
      ['MOVIMENTACOES DETALHADAS'],
      ['ID', 'Tipo', 'Data', 'Produto', 'Quantidade', 'Preco Unit.', 'Valor Total', 'Descricao']
    ];

    // Adicionar detalhes das movimentações com formatação de tabela
    filteredMovements.forEach((movement, index) => {
      const product = products.find(p => p.id === movement.productId);
      const formattedDate = formatDateForExcel(movement.date);
      
      csvRows.push([
        (index + 1).toString(),
        movement.type === 'entrada' ? 'ENTRADA' : movement.type === 'saida' ? 'SAIDA' : 'AJUSTE',
        formattedDate,
        product ? product.name : 'PRODUTO NAO ENCONTRADO',
        movement.quantity.toString(),
        movement.unitPrice.toFixed(2).replace('.', ','),
        movement.total.toFixed(2).replace('.', ','),
        movement.description || 'Sem observacoes'
      ]);
    });

    // PRODUTOS COM ESTOQUE BAIXO EM TABELA
    csvRows.push(['']);
    csvRows.push(['PRODUTOS COM ESTOQUE BAIXO']);
    csvRows.push(['ID', 'Produto', 'Estoque Atual', 'Estoque Min.', 'Preco Unit.', 'Valor Total', 'Status']);
    
    lowStockProducts.forEach((p, index) => {
      csvRows.push([
        (index + 1).toString(),
        p.name,
        p.stock.toString(),
        p.minStock.toString(),
        p.price.toFixed(2).replace('.', ','),
        (p.price * p.stock).toFixed(2).replace('.', ','),
        p.stock === 0 ? 'SEM ESTOQUE' : 'ESTOQUE BAIXO'
      ]);
    });

    // TOP PRODUTOS MAIS VALIOSOS EM TABELA
    csvRows.push([''], ['TOP 5 PRODUTOS MAIS VALIOSOS', '', '', '', '', '', '']);
    csvRows.push(['Posição', 'Nome do Produto', 'Categoria', 'Estoque Atual', 'Preço Unit. (R$)', 'Valor Total (R$)', 'Participação', 'Status']);
    
    const sortedProducts = products.sort((a, b) => (b.price * b.stock) - (a.price * a.stock));
    const totalValue = sortedProducts.reduce((sum, p) => sum + (p.price * p.stock), 0);
    
    sortedProducts.slice(0, 5).forEach((p, idx) => {
      const productValue = p.price * p.stock;
      const participation = totalValue > 0 ? ((productValue / totalValue) * 100).toFixed(1) : '0,0';
      
      csvRows.push([
        `${idx + 1}º Lugar`,
        p.name,
        p.category || 'Sem categoria',
        `${p.stock} unidades`,
        `R$ ${p.price.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}`,
        `R$ ${productValue.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}`,
        `${participation}%`,
        p.stock > p.minStock ? 'OK' : 'Baixo'
      ]);
    });

    // ANÁLISE COMPARATIVA EM TABELA
    csvRows.push([''], ['ANÁLISE COMPARATIVA - ENTRADAS VS SAÍDAS', '', '', '', '', '', '']);
    csvRows.push(['Métrica', 'Entradas', 'Saídas', 'Diferença', 'Percentual Entradas', 'Percentual Saídas', 'Status']);
    csvRows.push([
      'Quantidade de Movimentações',
      entradas.length.toString(),
      saidas.length.toString(),
      (entradas.length - saidas.length).toString(),
      `${entradas.length > 0 ? ((entradas.length / (entradas.length + saidas.length)) * 100).toFixed(1) : '0,0'}%`,
      `${saidas.length > 0 ? ((saidas.length / (entradas.length + saidas.length)) * 100).toFixed(1) : '0,0'}%`,
      entradas.length > saidas.length ? 'Mais Entradas' : saidas.length > entradas.length ? 'Mais Saídas' : 'Equilibrado'
    ]);
    csvRows.push([
      'Valor Total (R$)',
      `R$ ${totalEntradas.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}`,
      `R$ ${totalSaidas.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}`,
      `R$ ${(totalEntradas - totalSaidas).toLocaleString('pt-BR', { minimumFractionDigits: 2 })}`,
      `${totalEntradas > 0 ? ((totalEntradas / (totalEntradas + totalSaidas)) * 100).toFixed(1) : '0,0'}%`,
      `${totalSaidas > 0 ? ((totalSaidas / (totalEntradas + totalSaidas)) * 100).toFixed(1) : '0,0'}%`,
      totalEntradas > totalSaidas ? 'Mais Investimento' : totalSaidas > totalEntradas ? 'Mais Vendas' : 'Equilibrado'
    ]);

    // RODAPÉ CORPORATIVO EM TABELA
    csvRows.push([''], ['INFORMAÇÕES DO SISTEMA', '', '', '', '', '', '']);
    csvRows.push(['Campo', 'Valor', '', '', '', '', '']);
    csvRows.push(['Sistema', 'Flexi Gestor v1.0 - Business Intelligence', '', '', '', '', '']);
    csvRows.push(['Tecnologia', 'React + Supabase', '', '', '', '', '']);
    csvRows.push(['Versão', '1.0.0', '', '', '', '', '']);
    csvRows.push(['Exportado em', currentDate.toLocaleString('pt-BR'), '', '', '', '', '']);
    csvRows.push(['Formato', 'CSV/Excel Compatível', '', '', '', '', '']);
    csvRows.push(['Codificação', 'UTF-8 com BOM', '', '', '', '', '']);
    csvRows.push([''], ['RELATÓRIO GERADO AUTOMATICAMENTE PELO SISTEMA FLEXI GESTOR', '', '', '', '', '', '']);

    // Formatação final com separadores visuais para tabelas
    const csvContent = '\ufeff' + csvRows.map((row, index) => {
      // Adicionar separadores visuais para seções importantes
      if (index === 0) {
        return '='.repeat(120) + '\n' + row.map(field => `"${field}"`).join(';') + '\n' + '='.repeat(120);
      }
      if (index === 1) {
        return row.map(field => `"${field}"`).join(';') + '\n' + '-'.repeat(120);
      }
      if (row[0] && row[0].includes('INFORMAÇÕES DO RELATÓRIO')) {
        return '\n' + row.map(field => `"${field}"`).join(';') + '\n' + '-'.repeat(60);
      }
      if (row[0] && row[0].includes('RESUMO EXECUTIVO')) {
        return '\n' + row.map(field => `"${field}"`).join(';') + '\n' + '-'.repeat(60);
      }
      if (row[0] && row[0].includes('ANÁLISE FINANCEIRA')) {
        return '\n' + row.map(field => `"${field}"`).join(';') + '\n' + '-'.repeat(60);
      }
      if (row[0] && row[0].includes('MOVIMENTAÇÕES DETALHADAS')) {
        return '\n' + row.map(field => `"${field}"`).join(';') + '\n' + '-'.repeat(120);
      }
      if (row[0] && row[0].includes('PRODUTOS COM ESTOQUE BAIXO')) {
        return '\n' + row.map(field => `"${field}"`).join(';') + '\n' + '-'.repeat(60);
      }
      if (row[0] && row[0].includes('TOP 5 PRODUTOS')) {
        return '\n' + row.map(field => `"${field}"`).join(';') + '\n' + '-'.repeat(60);
      }
      if (row[0] && row[0].includes('ANÁLISE COMPARATIVA')) {
        return '\n' + row.map(field => `"${field}"`).join(';') + '\n' + '-'.repeat(60);
      }
      if (row[0] && row[0].includes('INFORMAÇÕES DO SISTEMA')) {
        return '\n' + row.map(field => `"${field}"`).join(';') + '\n' + '-'.repeat(60);
      }
      
      return row.map(field => {
        // Tratar campos especiais e formatação
        if (typeof field === 'string') {
          // Sempre envolver em aspas para garantir formatação correta
          if (field.includes(',') || field.includes(';') || field.includes('\n') || field.includes('"') || field.includes('R$')) {
            return `"${field.replace(/"/g, '""')}"`; // Escapar aspas duplas
          }
          // Se o campo está vazio, retornar espaço
          if (field === '') {
            return ' ';
          }
          return `"${field}"`;
        }
        return `"${field}"`;
      }).join(';'); // Usar ponto e vírgula como separador (padrão Excel)
    }).join('\n');
    
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const link = document.createElement('a');
    link.href = URL.createObjectURL(blob);
    link.download = `Relatorio_FlexiGestor_${new Date().toISOString().split('T')[0]}.csv`;
    link.click();
    URL.revokeObjectURL(link.href);
  };

  // Função para baixar/compartilhar receita
  const downloadReceipt = (movement: any) => {
    const receiptText = `
━━━━━━━━━━━━━━━━━━━━━━━━━
RECEITA
Flexi Gestor - Sistema de Gestão
━━━━━━━━━━━━━━━━━━━━━━━━━
${movement.receiptNumber ? `\nNº Receita: ${movement.receiptNumber}\n` : ''}
Data/Hora: ${new Date(movement.date).toLocaleString('pt-BR')}
Tipo: Venda PDV

━━━━━━━━━━━━━━━━━━━━━━━━━
PRODUTO:
${movement.productName}
${movement.quantity} x R$ ${movement.unitPrice.toFixed(2)}

TOTAL: R$ ${movement.total.toFixed(2)}
━━━━━━━━━━━━━━━━━━━━━━━━━

Observações:
${movement.description}

━━━━━━━━━━━━━━━━━━━━━━━━━
Obrigado pela preferência!
💚 Flexi Gestor - Gestão Inteligente
━━━━━━━━━━━━━━━━━━━━━━━━━
    `.trim();

    // Tentar compartilhar no mobile (se suportado)
    if (navigator.share) {
      navigator.share({
        title: 'Receita - Flexi Gestor',
        text: receiptText,
      }).catch((error) => console.log('Erro ao compartilhar:', error));
    } else {
      // Fallback: baixar como arquivo de texto
      const blob = new Blob([receiptText], { type: 'text/plain' });
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `receita-${new Date(movement.date).toISOString().split('T')[0]}.txt`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      window.URL.revokeObjectURL(url);
    }
  };

  const downloadPurchase = (movement: any) => {
    const purchaseText = `
━━━━━━━━━━━━━━━━━━━━━━━━━
🛒 NOTA DE COMPRA
Flexi Gestor - Sistema de Gestão
━━━━━━━━━━━━━━━━━━━━━━━━━
${movement.receiptNumber ? `\nNº NF Compra: ${movement.receiptNumber}\n` : ''}
Data/Hora: ${new Date(movement.date).toLocaleString('pt-BR')}
Tipo: Compra de Estoque

━━━━━━━━━━━━━━━━━━━━━━━━━
PRODUTO ADQUIRIDO:
${movement.productName}
${movement.quantity} unidades x R$ ${movement.unitPrice.toFixed(2)}

TOTAL PAGO: R$ ${movement.total.toFixed(2)}
━━━━━━━━━━━━━━━━━━━━━━━━━

Observações:
${movement.description}

━━━━━━━━━━━━━━━━━━━━━━━━━
Compra registrada com sucesso!
Flexi Gestor - Controle de Estoque
━━━━━━━━━━━━━━━━━━━━━━━━━
    `.trim();

    // Tentar compartilhar no mobile (se suportado)
    if (navigator.share) {
      navigator.share({
        title: 'Nota de Compra - Flexi Gestor',
        text: purchaseText,
      }).catch((error) => console.log('Erro ao compartilhar:', error));
    } else {
      // Fallback: baixar como arquivo de texto
      const blob = new Blob([purchaseText], { type: 'text/plain' });
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `compra-${new Date(movement.date).toISOString().split('T')[0]}.txt`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      window.URL.revokeObjectURL(url);
    }
  };

  // ========== FUNÇÕES PARA CONTAS A PAGAR ==========
  
  // 👉 Função utilitária para identificar se a movimentação é parcelada e quantas parcelas possui
  const obterInfoParcelamento = (paymentMethod?: string) => {
    const metodo = paymentMethod || '';
    const parcelado = metodo.startsWith('parcelado');
    if (!parcelado) {
      return { parcelado: false, parcelas: 1 };
    }

    const match = metodo.match(/parcelado-(\d+)/i);
    const numeroParcelas = match && match[1] ? parseInt(match[1], 10) : 1;
    return {
      parcelado: true,
      parcelas: Number.isFinite(numeroParcelas) && numeroParcelas > 0 ? numeroParcelas : 1
    };
  };

  // 👉 Gera parcelas fictícias apenas para exibição quando os dados não existem no banco
  const gerarParcelasPlaceholder = (contaId: string, total: number, quantidade: number, dataBase: Date): Parcela[] => {
    const valorParcelaBruto = total / quantidade;
    const valorParcela = Number(valorParcelaBruto.toFixed(2));

    return Array.from({ length: quantidade }, (_, index) => {
      const vencimento = new Date(dataBase);
      vencimento.setMonth(vencimento.getMonth() + index);

      return {
        id: `${contaId}-parcela-${index + 1}`,
        conta_pagar_id: contaId,
        numero: index + 1,
        valor: valorParcela,
        data_vencimento: vencimento,
        status: 'pendente',
        criado_em: dataBase,
        atualizado_em: dataBase,
      } satisfies Parcela;
    });
  };

  // 👉 Determina se o erro retornado pelo Supabase indica a necessidade de tentar a tabela legada
  const erroIndicaTabelaLegada = (error: any) => {
    if (!error) return false;
    return error.code === '42P01' || error.code === 'PGRST116' || error?.message?.includes('404');
  };

  // 👉 Atualiza uma conta a pagar respeitando a coexistência das tabelas nova (contas_a_pagar) e legada (contas_pagar)
  const atualizarContaPagarRemoto = async (
    contaId: string,
    dadosTabelaNova: Record<string, any>,
    dadosTabelaLegada: Record<string, any>
  ) => {
    const { error } = await supabase
      .from('contas_a_pagar')
      .update(dadosTabelaNova)
      .eq('id', contaId);

    if (!error) {
      return;
    }

    if (!erroIndicaTabelaLegada(error)) {
      throw error;
    }

    const { error: erroLegado } = await supabase
      .from('contas_pagar')
      .update(dadosTabelaLegada)
      .eq('id', contaId);

    if (erroLegado) {
      throw erroLegado;
    }
  };

  // 👉 Remove uma conta a pagar considerando tabela nova e tabela legada
  const deletarContaPagarRemoto = async (contaId: string) => {
    const { error } = await supabase
      .from('contas_a_pagar')
      .delete()
      .eq('id', contaId);

    if (!error) {
      return;
    }

    if (!erroIndicaTabelaLegada(error)) {
      throw error;
    }

    const { error: erroLegado } = await supabase
      .from('contas_pagar')
      .delete()
      .eq('id', contaId);

    if (erroLegado) {
      throw erroLegado;
    }
  };

  // 👉 Identifica contas derivadas automaticamente das movimentações (não existem no banco)
  const isContaDerivada = (conta?: ContaPagar | null) => {
    if (!conta) return false;
    return conta.id?.startsWith('mov-');
  };

  // 👉 Cria uma conta real no banco a partir de uma conta derivada das movimentações
  const criarContaPagarReal = async (conta: ContaPagar): Promise<ContaPagar> => {
    if (!user?.id || !workspaceAtivo?.id) {
      throw new Error('Não foi possível identificar o usuário ou o workspace ativo para salvar a conta.');
    }

    const observacoes = conta.observacoes || conta.descricao || 'Conta gerada a partir das movimentações de estoque';
    const valorTotal = conta.valor_total ?? conta.valor ?? 0;
    const valorPago = conta.valor_pago ?? 0;
    const valorRestante = conta.valor_restante ?? Math.max(valorTotal - valorPago, 0);
    const numeroParcelas = conta.parcelas || conta.numero_parcelas || 1;

    const obterData = (valor: any, fallback: Date) => {
      if (valor instanceof Date) return valor;
      if (!valor) return fallback;
      const data = new Date(valor);
      return Number.isNaN(data.getTime()) ? fallback : data;
    };

    const dataLancamento = obterData(conta.lancamento, new Date());
    const dataRegistro = obterData(conta.data_registro, dataLancamento);
    const dataVencimento = obterData(conta.data_vencimento, dataLancamento);
    const dataPagamentoExistente = conta.data_pagamento ? obterData(conta.data_pagamento, dataVencimento) : null;

    const dadosContaNovo = {
      lancamento: dataLancamento.toISOString().split('T')[0],
      observacoes,
      forma_pagamento: conta.forma_pagamento || 'dinheiro',
      conta_origem: conta.conta_origem || 'caixa',
      centro_custo: conta.centro_custo || conta.categoria_dre || null,
      fornecedor: conta.fornecedor || '',
      valor_total: valorTotal,
      valor_pago: valorPago,
      valor_restante: valorRestante,
      parcelas: numeroParcelas,
      parcelas_pagas: conta.parcelas_pagas || 0,
      data_vencimento: dataVencimento.toISOString().split('T')[0],
      data_pagamento: dataPagamentoExistente ? dataPagamentoExistente.toISOString().split('T')[0] : null,
      status_pagamento: conta.status_pagamento || 'pendente',
      workspace_id: workspaceAtivo.id,
      usuario_id: user.id,
    };

    const dadosContaLegado = {
      descricao: observacoes,
      valor: valorTotal,
      valor_pago: valorPago,
      valor_restante: valorRestante,
      data_compra: dataLancamento.toISOString(),
      data_registro: dataRegistro.toISOString(),
      data_vencimento: dataVencimento.toISOString(),
      status: conta.status || 'pendente',
      categoria_dre: conta.categoria_dre || conta.centro_custo || null,
      fornecedor: conta.fornecedor || '',
      forma_pagamento: conta.forma_pagamento || null,
      numero_parcelas: numeroParcelas,
      observacoes,
      movimento_id: conta.movimento_id || null,
      usuario_id: workspaceAtivo.id,
      workspace_id: workspaceAtivo.id,
      origem_pagamento: conta.conta_origem || conta.origem_pagamento || 'caixa',
    };

    try {
      const { data, error } = await supabase
        .from('contas_a_pagar')
        .insert([dadosContaNovo])
        .select()
        .single();

      if (error) {
        if (!erroIndicaTabelaLegada(error)) {
          throw error;
        }
      } else if (data) {
        return {
          ...conta,
          id: data.id,
          valor_total: valorTotal,
          valor: valorTotal,
          valor_pago: valorPago,
          valor_restante: valorRestante,
          parcelas: numeroParcelas,
          parcelas_pagas: conta.parcelas_pagas || 0,
          data_vencimento: dataVencimento,
          data_pagamento: dataPagamentoExistente || undefined,
          status_pagamento: dadosContaNovo.status_pagamento,
          status: conta.status || 'pendente',
          conta_origem: dadosContaNovo.conta_origem,
          origem_pagamento: dadosContaLegado.origem_pagamento as OrigemPagamento,
        } satisfies ContaPagar;
      }
    } catch (error) {
      console.error('Erro ao inserir conta na tabela contas_a_pagar:', error);
      throw error;
    }

    const { data: dataLegado, error: erroLegado } = await supabase
      .from('contas_pagar')
      .insert([dadosContaLegado])
      .select()
      .single();

    if (erroLegado) {
      console.error('Erro ao inserir conta na tabela contas_pagar:', erroLegado);
      throw erroLegado;
    }

    return {
      ...conta,
      id: dataLegado.id,
      valor_total: valorTotal,
      valor: valorTotal,
      valor_pago: valorPago,
      valor_restante: valorRestante,
      parcelas: numeroParcelas,
      parcelas_pagas: conta.parcelas_pagas || 0,
      data_vencimento: dataVencimento,
      data_pagamento: dataPagamentoExistente || undefined,
      status: conta.status || 'pendente',
      conta_origem: dadosContaLegado.origem_pagamento as OrigemPagamento,
      origem_pagamento: dadosContaLegado.origem_pagamento as OrigemPagamento,
    } satisfies ContaPagar;
  };

  const criarChaveConta = (descricao: string | undefined, valorTotal: number, dataVencimento: Date) => {
    const descricaoNormalizada = (descricao || '').trim().toLowerCase();
    const valorNormalizado = Number((valorTotal || 0).toFixed(2));
    const dataNormalizada = dataVencimento ? new Date(dataVencimento).toISOString().split('T')[0] : '';
    return `${descricaoNormalizada}|${valorNormalizado}|${dataNormalizada}`;
  };

  const extrairTextoFinal = (texto: string | undefined) => {
    if (!texto) return '';
    const partes = texto.split(' - ');
    return partes.length > 1 ? partes[partes.length - 1].trim() : texto.trim();
  };

// 👉 Formata descrições longas vindas das movimentações para exibir nome do produto + quantidade
const formatarDescricaoCurta = (texto: string | undefined) => {
  if (!texto) return 'Sem descrição';

  // 👉 Tenta identificar o padrão "Entrada de <qtd> unidades de <produto>"
  const entradaComProduto = texto.match(/Entrada de\s+([\d.,]+)\s+unidades?\s+de\s+(.+?)(?:\s+em\s+\d+\s+lote\(s\))?(?:\s*[-|].*)?$/i);

  if (entradaComProduto) {
    const quantidade = entradaComProduto[1]?.trim() ?? '';
    const produtoBruto = entradaComProduto[2]?.trim() ?? '';

    // 👉 Coleta informações adicionais (lotes / datas) para exibir como detalhes opcionais
    const detalhes: string[] = [];
    const infoLotes = texto.match(/em\s+(\d+)\s+lote\(s\)/i);
    if (infoLotes) {
      detalhes.push(`${infoLotes[1]} lote(s)`);
    }

    const infoFab = texto.match(/FAB:([\d-]+)/i);
    if (infoFab) {
      detalhes.push(`FAB ${infoFab[1]}`);
    }

    const infoExp = texto.match(/EXP:([\d-]+)/i);
    if (infoExp) {
      detalhes.push(`EXP ${infoExp[1]}`);
    }

    const produtoFormatado = produtoBruto
      .replace(/\s*\|\s*/g, ' · ')
      .replace(/\s{2,}/g, ' ')
      .trim();

    return `${produtoFormatado} x ${quantidade}${detalhes.length ? ` · ${detalhes.join(' · ')}` : ''}`;
  }

  // 👉 Para demais padrões, mantemos a limpeza básica para exibir um texto curto
  return texto
    .replace(/\s*\|\s*/g, ' · ')
    .replace(/\s{2,}/g, ' ')
    .trim();
};

// 👉 Função utilitária para exibir apenas o nome do fornecedor na tabela e nos filtros
const formatarNomeFornecedor = (texto: string | undefined) => {
  if (!texto || !texto.trim()) {
    return '-';
  }

  const [nome] = texto.split('|');
  return nome.trim();
};

  const criarContaPagarDeMovimento = (mov: MovementRecord): ContaPagar | null => {
    const { parcelado, parcelas } = obterInfoParcelamento(mov.paymentMethod);
    if (!parcelado) {
      return null;
    }

    const baseDate = new Date(mov.date);
    const contaId = `mov-${mov.id}`;
    const valorTotal = Number((mov.total || mov.quantity * mov.unitPrice || 0).toFixed(2));
    const parcelasDetalhadas = gerarParcelasPlaceholder(contaId, valorTotal, parcelas, baseDate);
    const primeiroVencimento = parcelasDetalhadas.length > 0 ? parcelasDetalhadas[0].data_vencimento : baseDate;

    return {
      id: contaId,
      lancamento: baseDate,
      observacoes: mov.description || `Compra parcelada vinculada ao movimento ${mov.id}`,
      forma_pagamento: 'parcelado',
      conta_origem: 'caixa',
      centro_custo: '',
      fornecedor: extrairTextoFinal(mov.description) || 'Fornecedor não informado',
      valor_total: valorTotal,
      valor: valorTotal,
      valor_pago: 0,
      valor_restante: valorTotal,
      parcelas,
      parcelas_pagas: 0,
      data_vencimento: primeiroVencimento,
      data_pagamento: undefined,
      status_pagamento: 'pendente',
      workspace_id: workspaceAtivo?.id || user?.id || 'workspace-local',
      usuario_id: user?.id || 'usuario-local',
      criado_em: baseDate,
      atualizado_em: baseDate,
      descricao: mov.description || `Compra parcelada - ${mov.productName || 'Produto'}`,
      data_compra: baseDate,
      data_registro: baseDate,
      status: 'pendente',
      categoria_dre: undefined,
      origem_pagamento: 'caixa',
      numero_parcelas: parcelas,
      movimento_id: mov.id,
      parcelasDetalhes: parcelasDetalhadas,
    } satisfies ContaPagar;
  };

  const criarContaReceberDeMovimento = (mov: MovementRecord): ContaReceber | null => {
    const { parcelado, parcelas } = obterInfoParcelamento(mov.paymentMethod);
    if (!parcelado) {
      return null;
    }

    const baseDate = new Date(mov.date);
    const valorTotal = Number((mov.total || mov.quantity * mov.unitPrice || 0).toFixed(2));
    const primeiroVencimento = new Date(baseDate);
    primeiroVencimento.setMonth(primeiroVencimento.getMonth());

    return {
      id: `mov-${mov.id}`,
      lancamento: baseDate,
      observacoes: mov.description || `Venda parcelada vinculada ao movimento ${mov.id}`,
      forma_recebimento: 'parcelado',
      conta_destino: 'caixa',
      centro_custo: '',
      cliente: extrairTextoFinal(mov.description) || 'Cliente não informado',
      valor_total: valorTotal,
      valor: valorTotal,
      valor_recebido: 0,
      valor_restante: valorTotal,
      parcelas,
      parcelas_recebidas: 0,
      data_vencimento: primeiroVencimento,
      data_recebimento: undefined,
      status_recebimento: 'pendente',
      workspace_id: workspaceAtivo?.id || user?.id || 'workspace-local',
      usuario_id: user?.id || 'usuario-local',
      criado_em: baseDate,
      atualizado_em: baseDate,
      descricao: mov.description || `Venda parcelada - ${mov.productName || 'Produto'}`,
      status: 'pendente',
      categoria_dre: undefined,
      movimento_id: mov.id,
      parcelasDetalhes: gerarParcelasPlaceholder(`mov-${mov.id}`, valorTotal, parcelas, baseDate),
    } satisfies ContaReceber;
  };

  const mesclarContasPagarComMovimentacoes = (contasBanco: ContaPagar[]) => {
    const chavesExistentes = new Set<string>();
    contasBanco.forEach(conta => {
      if (conta.movimento_id) {
        chavesExistentes.add(`mov-${conta.movimento_id}`);
      }
      if (conta.descricao) {
        const chave = criarChaveConta(conta.descricao, conta.valor_total ?? conta.valor ?? 0, conta.data_vencimento);
        chavesExistentes.add(chave);
      }
    });

    const derivadas: ContaPagar[] = [];
    movements
      .filter(mov => mov.type === 'entrada')
      .forEach(mov => {
        const contaDerivada = criarContaPagarDeMovimento(mov as MovementRecord);
        if (!contaDerivada) {
          return;
        }

        const chaveMovimento = `mov-${contaDerivada.movimento_id}`;
        const chaveDescricao = criarChaveConta(contaDerivada.descricao, contaDerivada.valor_total, contaDerivada.data_vencimento);

        if (!chavesExistentes.has(chaveMovimento) && !chavesExistentes.has(chaveDescricao)) {
          chavesExistentes.add(chaveMovimento);
          chavesExistentes.add(chaveDescricao);
          derivadas.push(contaDerivada);
        }
      });

    if (derivadas.length === 0) {
      return contasBanco;
    }

    return [...contasBanco, ...derivadas].sort((a, b) => b.data_vencimento.getTime() - a.data_vencimento.getTime());
  };

  const mesclarContasReceberComMovimentacoes = (contasBanco: ContaReceber[]) => {
    const chavesExistentes = new Set<string>();
    contasBanco.forEach(conta => {
      if (conta.movimento_id) {
        chavesExistentes.add(`mov-${conta.movimento_id}`);
      }
      if (conta.descricao) {
        const chave = criarChaveConta(conta.descricao, conta.valor_total ?? conta.valor ?? 0, conta.data_vencimento);
        chavesExistentes.add(chave);
      }
    });

    const derivadas: ContaReceber[] = [];
    movements
      .filter(mov => mov.type === 'saida')
      .forEach(mov => {
        const contaDerivada = criarContaReceberDeMovimento(mov as MovementRecord);
        if (!contaDerivada) {
          return;
        }

        const chaveMovimento = `mov-${contaDerivada.movimento_id}`;
        const chaveDescricao = criarChaveConta(contaDerivada.descricao, contaDerivada.valor_total, contaDerivada.data_vencimento);

        if (!chavesExistentes.has(chaveMovimento) && !chavesExistentes.has(chaveDescricao)) {
          chavesExistentes.add(chaveMovimento);
          chavesExistentes.add(chaveDescricao);
          derivadas.push(contaDerivada);
        }
      });

    if (derivadas.length === 0) {
      return contasBanco;
    }

    return [...contasBanco, ...derivadas].sort((a, b) => b.data_vencimento.getTime() - a.data_vencimento.getTime());
  };

  // 🔁 Reprocessar contas derivadas sempre que movimentações mudarem
  useEffect(() => {
    setContasPagar(mesclarContasPagarComMovimentacoes(contasPagarBase));
  }, [movements, contasPagarBase]);

  useEffect(() => {
    setContasReceber(mesclarContasReceberComMovimentacoes(contasReceberBase));
  }, [movements, contasReceberBase]);

  // Carregar Contas a Pagar
  const carregarContasPagar = async () => {
    if (!user?.id || !workspaceAtivo?.id) {
      console.log('⚠️ Não foi possível carregar contas a pagar:', { userId: user?.id, workspaceId: workspaceAtivo?.id });
      return;
    }
    
    setLoadingContas(true);
    try {
      const workspaceId = workspaceAtivo.id;
      const userId = user.id;
      
      console.log('📥 Carregando contas a pagar:', { 
        workspaceId, 
        userId,
        workspaceNome: workspaceAtivo.nome,
        workspaceTipo: workspaceAtivo.tipo
      });
      
      // Tentar usar a nova tabela primeiro, se não existir usar a antiga
      const { data, error } = await supabase
        .from('contas_a_pagar')
        .select('*')
        .eq('workspace_id', workspaceId)
        .order('data_vencimento', { ascending: false });

      console.log('📊 Resultado da consulta contas_a_pagar:', { 
        quantidade: data?.length || 0, 
        error: error?.message || null,
        errorCode: error?.code || null,
        dados: data?.map(c => ({
          id: c.id,
          fornecedor: c.fornecedor,
          valor_total: c.valor_total,
          workspace_id: c.workspace_id,
          usuario_id: c.usuario_id,
          status: c.status_pagamento
        }))
      });

      if (error && error.code === '42P01') {
        // Tabela não existe, tentar tabela antiga
        console.log('⚠️ Tabela contas_a_pagar não existe, tentando contas_pagar');
        const { data: dataOld, error: errorOld } = await supabase
          .from('contas_pagar')
          .select('*')
          .eq('workspace_id', workspaceId)
          .order('data_vencimento', { ascending: false });
        
        console.log('📊 Resultado da consulta contas_pagar:', { 
          quantidade: dataOld?.length || 0, 
          error: errorOld?.message || null 
        });
        
        if (errorOld) throw errorOld;
        
        // Mapear dados antigos para novo formato
        const contasFormatadas: ContaPagar[] = (dataOld || []).map((c: any) => ({
          id: c.id,
          lancamento: c.data_registro ? new Date(c.data_registro) : new Date(c.criado_em),
          observacoes: c.observacoes || c.descricao || '',
          forma_pagamento: (c.forma_pagamento || 'dinheiro') as FormaPagamento,
          conta_origem: (c.origem_pagamento || 'caixa') as OrigemPagamento,
          centro_custo: c.categoria_dre || '',
          fornecedor: c.fornecedor || '',
          valor_total: parseFloat(c.valor) || 0,
          valor: parseFloat(c.valor) || 0,
          valor_pago: parseFloat(c.valor_pago) || 0,
          valor_restante: parseFloat(c.valor_restante) || (parseFloat(c.valor) || 0),
          parcelas: c.numero_parcelas || 1,
          parcelas_pagas: c.parcelas_pagas || 0,
          data_vencimento: new Date(c.data_vencimento),
          data_pagamento: c.data_pagamento ? new Date(c.data_pagamento) : undefined,
          status_pagamento: (c.status === 'finalizado' || c.status === 'pago' ? 'pago' : 
                            c.valor_pago > 0 ? 'parcial' : 'pendente') as StatusPagamento,
          workspace_id: c.workspace_id,
          usuario_id: c.usuario_id,
          criado_em: new Date(c.criado_em),
          atualizado_em: new Date(c.atualizado_em),
          // Campos legados
          descricao: c.descricao || '',
          data_compra: c.data_compra ? new Date(c.data_compra) : new Date(c.criado_em),
          data_registro: c.data_registro ? new Date(c.data_registro) : new Date(c.criado_em),
          status: c.status as AccountStatus,
          categoria_dre: c.categoria_dre as DRECategory | undefined,
          origem_pagamento: c.origem_pagamento as OrigemPagamento | undefined,
          numero_parcelas: c.numero_parcelas || 1,
          movimento_id: c.movimento_id || '',
          parcelasDetalhes: []
        }));
        
        const contasComMovimentos = mesclarContasPagarComMovimentacoes(contasFormatadas);
        setContasPagarBase(contasFormatadas);
        setContasPagar(contasComMovimentos);
        return;
      }
      
      if (error) throw error;

      // Mapear dados novos
      const contasFormatadas: ContaPagar[] = (data || []).map((c: any) => ({
        id: c.id,
        lancamento: c.lancamento ? new Date(c.lancamento) : new Date(c.criado_em),
        observacoes: c.observacoes || '',
        forma_pagamento: c.forma_pagamento as FormaPagamento,
        conta_origem: c.conta_origem as OrigemPagamento,
        centro_custo: c.centro_custo || '',
        fornecedor: c.fornecedor || '',
        valor_total: parseFloat(c.valor_total) || 0,
        valor: parseFloat(c.valor_total) || 0,
        valor_pago: parseFloat(c.valor_pago) || 0,
        valor_restante: parseFloat(c.valor_restante) || 0,
        parcelas: c.parcelas || 1,
        parcelas_pagas: c.parcelas_pagas || 0,
        data_vencimento: new Date(c.data_vencimento),
        data_pagamento: c.data_pagamento ? new Date(c.data_pagamento) : undefined,
        status_pagamento: c.status_pagamento as StatusPagamento,
        workspace_id: c.workspace_id,
        usuario_id: c.usuario_id,
        criado_em: new Date(c.criado_em),
        atualizado_em: new Date(c.atualizado_em),
        // Campos legados para compatibilidade
        descricao: c.observacoes || '',
        data_compra: c.lancamento ? new Date(c.lancamento) : new Date(c.criado_em),
        data_registro: c.lancamento ? new Date(c.lancamento) : new Date(c.criado_em),
        status: (c.status_pagamento === 'pago' ? 'pago' : 
                c.status_pagamento === 'parcial' ? 'pendente' : 'pendente') as AccountStatus,
        categoria_dre: c.centro_custo as DRECategory | undefined,
        origem_pagamento: c.conta_origem as OrigemPagamento | undefined,
        numero_parcelas: c.parcelas || 1,
        movimento_id: '',
        parcelasDetalhes: []
      }));

      console.log('✅ Contas formatadas:', contasFormatadas.length, 'contas');
      const contasComMovimentos = mesclarContasPagarComMovimentacoes(contasFormatadas);
      setContasPagarBase(contasFormatadas);
      setContasPagar(contasComMovimentos);
    } catch (error) {
      console.error('Erro ao carregar contas a pagar:', error);
      toast.error('Erro ao carregar contas a pagar');
    } finally {
      setLoadingContas(false);
    }
  };

  // Carregar Contas a Receber
  const carregarContasReceber = async () => {
    if (!user?.id || !workspaceAtivo?.id) {
      console.log('⚠️ Não foi possível carregar contas a receber:', { userId: user?.id, workspaceId: workspaceAtivo?.id });
      return;
    }
    
    setLoadingContas(true);
    try {
      const workspaceId = workspaceAtivo.id;
      const userId = user.id;
      
      console.log('📥 Carregando contas a receber:', { 
        workspaceId, 
        userId,
        workspaceNome: workspaceAtivo.nome,
        workspaceTipo: workspaceAtivo.tipo
      });
      
      // Tentar usar a nova tabela primeiro, se não existir usar a antiga
      const { data, error } = await supabase
        .from('contas_a_receber')
        .select('*')
        .eq('workspace_id', workspaceId)
        .order('data_vencimento', { ascending: false });

      console.log('📊 Resultado da consulta contas_a_receber:', { 
        quantidade: data?.length || 0, 
        error: error?.message || null,
        errorCode: error?.code || null,
        dados: data?.map(c => ({
          id: c.id,
          cliente: c.cliente,
          valor_total: c.valor_total,
          workspace_id: c.workspace_id,
          usuario_id: c.usuario_id,
          status: c.status_recebimento
        }))
      });

      if (error && error.code === '42P01') {
        // Tabela não existe, tentar tabela antiga
        console.log('⚠️ Tabela contas_a_receber não existe, tentando contas_receber');
        const { data: dataOld, error: errorOld } = await supabase
          .from('contas_receber')
          .select('*')
          .eq('workspace_id', workspaceId)
          .order('data_vencimento', { ascending: false });
        
        console.log('📊 Resultado da consulta contas_receber:', { 
          quantidade: dataOld?.length || 0, 
          error: errorOld?.message || null 
        });
        
        if (errorOld) throw errorOld;
        
        // Mapear dados antigos para novo formato
        const contasFormatadas: ContaReceber[] = (dataOld || []).map((c: any) => ({
          id: c.id,
          lancamento: new Date(c.criado_em),
          observacoes: c.observacoes || c.descricao || '',
          forma_recebimento: 'dinheiro' as FormaPagamento,
          conta_destino: 'caixa' as OrigemPagamento,
          centro_custo: c.categoria_dre || '',
          cliente: c.cliente || '',
          valor_total: parseFloat(c.valor) || 0,
          valor_recebido: 0,
          valor_restante: parseFloat(c.valor) || 0,
          parcelas: 1,
          parcelas_recebidas: 0,
          data_vencimento: new Date(c.data_vencimento),
          data_recebimento: c.data_recebimento ? new Date(c.data_recebimento) : undefined,
          status_recebimento: (c.status === 'pago' || c.status === 'finalizado' ? 'recebido' : 'pendente') as StatusRecebimento,
          workspace_id: c.workspace_id,
          usuario_id: c.usuario_id,
          criado_em: new Date(c.criado_em),
          atualizado_em: new Date(c.atualizado_em),
          // Campos legados
          descricao: c.descricao || '',
          valor: parseFloat(c.valor) || 0,
          status: c.status as AccountStatus,
          categoria_dre: c.categoria_dre as DRECategory | undefined,
          movimento_id: c.movimento_id || ''
        }));
        
        const contasComMovimentos = mesclarContasReceberComMovimentacoes(contasFormatadas);
        setContasReceberBase(contasFormatadas);
        setContasReceber(contasComMovimentos);
        return;
      }
      
      if (error) throw error;

      // Mapear dados novos
      const contasFormatadas: ContaReceber[] = (data || []).map((c: any) => ({
        id: c.id,
        lancamento: c.lancamento ? new Date(c.lancamento) : new Date(c.criado_em),
        observacoes: c.observacoes || '',
        forma_recebimento: c.forma_recebimento as FormaPagamento,
        conta_destino: c.conta_destino as OrigemPagamento,
        centro_custo: c.centro_custo || '',
        cliente: c.cliente || '',
        valor_total: parseFloat(c.valor_total) || 0,
        valor_recebido: parseFloat(c.valor_recebido) || 0,
        valor_restante: parseFloat(c.valor_restante) || 0,
        parcelas: c.parcelas || 1,
        parcelas_recebidas: c.parcelas_recebidas || 0,
        data_vencimento: new Date(c.data_vencimento),
        data_recebimento: c.data_recebimento ? new Date(c.data_recebimento) : undefined,
        status_recebimento: c.status_recebimento as StatusRecebimento,
        workspace_id: c.workspace_id,
        usuario_id: c.usuario_id,
        criado_em: new Date(c.criado_em),
        atualizado_em: new Date(c.atualizado_em),
        // Campos legados para compatibilidade
        descricao: c.observacoes || '',
        valor: parseFloat(c.valor_total) || 0,
        status: (c.status_recebimento === 'recebido' ? 'pago' : 'pendente') as AccountStatus,
        categoria_dre: c.centro_custo as DRECategory | undefined,
        movimento_id: ''
      }));

      console.log('✅ Contas formatadas:', contasFormatadas.length, 'contas');
      const contasComMovimentos = mesclarContasReceberComMovimentacoes(contasFormatadas);
      setContasReceberBase(contasFormatadas);
      setContasReceber(contasComMovimentos);
    } catch (error) {
      console.error('Erro ao carregar contas a receber:', error);
      toast.error('Erro ao carregar contas a receber');
    } finally {
      setLoadingContas(false);
    }
  };

  // Criar ou atualizar Conta a Pagar
  const salvarContaPagar = async () => {
    if (!user?.id || !workspaceAtivo?.id) {
      toast.error('Usuário ou workspace não encontrado');
      return;
    }

    // Validar campos obrigatórios (usar novos campos ou legados)
    const observacoes = formContaPagar.observacoes || formContaPagar.descricao || '';
    const valorTotal = formContaPagar.valor_total || formContaPagar.valor || 0;
    const fornecedor = formContaPagar.fornecedor || '';
    
    if (!observacoes || valorTotal <= 0 || !fornecedor) {
      toast.error('Preencha todos os campos obrigatórios');
      return;
    }

    try {
      const numeroParcelas = formContaPagar.parcelas || formContaPagar.numero_parcelas || 1;
      const lancamento = formContaPagar.lancamento || formContaPagar.data_registro || new Date();
      
      // Tentar usar nova tabela primeiro
      const dadosContaNovo = {
        lancamento: lancamento.toISOString().split('T')[0],
        observacoes: observacoes,
        forma_pagamento: formContaPagar.forma_pagamento || 'dinheiro',
        conta_origem: formContaPagar.conta_origem || 'caixa',
        centro_custo: formContaPagar.centro_custo || formContaPagar.categoria_dre || null,
        fornecedor: fornecedor,
        valor_total: valorTotal,
        valor_pago: contaPagarEditando?.valor_pago || 0,
        valor_restante: valorTotal - (contaPagarEditando?.valor_pago || 0),
        parcelas: numeroParcelas,
        parcelas_pagas: contaPagarEditando?.parcelas_pagas || 0,
        data_vencimento: formContaPagar.data_vencimento.toISOString().split('T')[0],
        data_pagamento: contaPagarEditando?.data_pagamento ? formContaPagar.data_vencimento.toISOString().split('T')[0] : null,
        status_pagamento: contaPagarEditando?.status_pagamento || 'pendente',
        workspace_id: workspaceAtivo.id,
        usuario_id: user.id
      };

      // Dados legados para fallback
      const dadosContaLegado = {
        descricao: observacoes,
        valor: valorTotal,
        valor_pago: contaPagarEditando?.valor_pago || 0,
        valor_restante: valorTotal - (contaPagarEditando?.valor_pago || 0),
        data_compra: lancamento.toISOString(),
        data_registro: lancamento.toISOString(),
        data_vencimento: formContaPagar.data_vencimento.toISOString(),
        status: 'pendente' as AccountStatus,
        categoria_dre: formContaPagar.categoria_dre || null,
        fornecedor: fornecedor,
        forma_pagamento: formContaPagar.forma_pagamento || null,
        numero_parcelas: numeroParcelas,
        observacoes: observacoes,
        movimento_id: formContaPagar.movimento_id || null,
        usuario_id: workspaceAtivo.id,
        workspace_id: workspaceAtivo.id
      };

      let contaId: string;
      let usarTabelaNova = true;

      if (contaPagarEditando) {
        // Tentar atualizar na nova tabela
        const { data, error } = await supabase
          .from('contas_a_pagar')
          .update(dadosContaNovo)
          .eq('id', contaPagarEditando.id)
          .select()
          .single();

        if (error && error.code === '42P01') {
          // Tabela não existe, usar legada
          usarTabelaNova = false;
          const { data: dataOld, error: errorOld } = await supabase
            .from('contas_pagar')
            .update(dadosContaLegado)
            .eq('id', contaPagarEditando.id)
            .select()
            .single();
          
          if (errorOld) throw errorOld;
          contaId = dataOld.id;
        } else if (error) {
          throw error;
        } else {
          contaId = data.id;
        }
        
        toast.success('Conta a pagar atualizada com sucesso!');
      } else {
        // Tentar criar na nova tabela
        const { data, error } = await supabase
          .from('contas_a_pagar')
          .insert([dadosContaNovo])
          .select()
          .single();

        if (error && error.code === '42P01') {
          // Tabela não existe, usar legada
          usarTabelaNova = false;
          const { data: dataOld, error: errorOld } = await supabase
            .from('contas_pagar')
            .insert([dadosContaLegado])
            .select()
            .single();
          
          if (errorOld) throw errorOld;
          contaId = dataOld.id;
        } else if (error) {
          throw error;
        } else {
          contaId = data.id;
        }
        
        toast.success('Conta a pagar criada com sucesso!');
      }

      await carregarContasPagar();
      setShowDialogContaPagar(false);
      setContaPagarEditando(null);
      setFornecedorSearchTerm('');
      setShowFornecedorDropdown(false);
      setFormContaPagar(createInitialFormContaPagar());
    } catch (error: any) {
      console.error('Erro ao salvar conta a pagar:', error);
      toast.error(error.message || 'Erro ao salvar conta a pagar');
    }
  };

  // Criar ou atualizar Conta a Receber
  const salvarContaReceber = async () => {
    if (!user?.id || !workspaceAtivo?.id) {
      toast.error('Usuário ou workspace não encontrado');
      return;
    }

    if (!formContaReceber.descricao || formContaReceber.valor <= 0) {
      toast.error('Preencha todos os campos obrigatórios');
      return;
    }

    try {
      const dadosConta = {
        descricao: formContaReceber.descricao,
        valor: formContaReceber.valor,
        data_vencimento: formContaReceber.data_vencimento.toISOString(),
        status: 'pendente' as AccountStatus,
        categoria_dre: formContaReceber.categoria_dre || null,
        cliente: formContaReceber.cliente || null,
        observacoes: formContaReceber.observacoes || null,
        movimento_id: formContaReceber.movimento_id || null,
        usuario_id: workspaceAtivo.id,
        workspace_id: workspaceAtivo.id
      };

      if (contaReceberEditando) {
        // Atualizar
        const { error } = await supabase
          .from('contas_receber')
          .update(dadosConta)
          .eq('id', contaReceberEditando.id);

        if (error) throw error;
        toast.success('Conta a receber atualizada com sucesso!');
      } else {
        // Criar
        const { error } = await supabase
          .from('contas_receber')
          .insert([dadosConta]);

        if (error) throw error;
        toast.success('Conta a receber criada com sucesso!');
      }

      await carregarContasReceber();
      setShowDialogContaReceber(false);
      setContaReceberEditando(null);
      setClienteSearchTerm('');
      setShowClienteDropdown(false);
      setFormContaReceber(createInitialFormContaReceber());
    } catch (error: any) {
      console.error('Erro ao salvar conta a receber:', error);
      toast.error(error.message || 'Erro ao salvar conta a receber');
    }
  };

  // Marcar conta como paga/recebida
  const marcarContaComoPaga = async (conta: ContaPagar) => {
    if (isContaDerivada(conta)) {
      toast.error('Esta conta foi criada automaticamente a partir de uma movimentação de estoque. Cadastre-a manualmente para poder marcá-la como paga.');
      return;
    }

    try {
      const dataPagamentoISO = new Date().toISOString();
      const valorConta = conta.valor_total ?? conta.valor ?? 0;
      const totalParcelasPagas = conta.parcelasDetalhes?.length
        ? conta.parcelasDetalhes.filter(p => p.status === 'pago').length
        : conta.parcelas || conta.numero_parcelas || 0;

      await atualizarContaPagarRemoto(
        conta.id,
        {
          status_pagamento: 'pago',
          data_pagamento: dataPagamentoISO,
          valor_pago: valorConta,
          valor_restante: 0,
          parcelas_pagas: totalParcelasPagas,
          conta_origem: conta.conta_origem || 'caixa'
        },
        {
          status: 'pago',
          data_pagamento: dataPagamentoISO,
          valor_pago: valorConta,
          valor_restante: 0,
          parcelas_pagas: totalParcelasPagas,
          origem_pagamento: conta.conta_origem || conta.origem_pagamento || 'caixa'
        }
      );

      toast.success('Conta marcada como paga!');
      await carregarContasPagar();
    } catch (error: any) {
      toast.error(error.message || 'Erro ao marcar conta como paga');
    }
  };

  const marcarContaComoRecebida = async (conta: ContaReceber) => {
    try {
      const { error } = await supabase
        .from('contas_receber')
        .update({ 
          status: 'pago',
          data_recebimento: new Date().toISOString()
        })
        .eq('id', conta.id);

      if (error) throw error;
      toast.success('Conta marcada como recebida!');
      await carregarContasReceber();
    } catch (error: any) {
      toast.error(error.message || 'Erro ao marcar conta como recebida');
    }
  };

  // Deletar conta
  const deletarContaPagar = async (id: string) => {
    if (!confirm('Tem certeza que deseja excluir esta conta?')) return;

    const conta = contasPagar.find(c => c.id === id);
    if (isContaDerivada(conta)) {
      toast.error('Esta conta vem de uma movimentação automática. Remova o movimento correspondente no estoque para deixá-la de aparecer.');
      return;
    }

    try {
      await deletarContaPagarRemoto(id);
      toast.success('Conta excluída com sucesso!');
      await carregarContasPagar();
    } catch (error: any) {
      toast.error(error.message || 'Erro ao excluir conta');
    }
  };

  const deletarContaReceber = async (id: string) => {
    if (!confirm('Tem certeza que deseja excluir esta conta?')) return;

    try {
      const { error } = await supabase
        .from('contas_receber')
        .delete()
        .eq('id', id);

      if (error) throw error;
      toast.success('Conta excluída com sucesso!');
      await carregarContasReceber();
    } catch (error: any) {
      toast.error(error.message || 'Erro ao excluir conta');
    }
  };

  // Carregar parcelas de uma conta
  const carregarParcelas = async (contaId: string) => {
    try {
      const { data, error } = await supabase
        .from('parcelas')
        .select('*')
        .eq('conta_pagar_id', contaId)
        .order('numero', { ascending: true });

      if (error) throw error;

      const parcelasFormatadas: Parcela[] = (data || []).map((p: any) => ({
        id: p.id,
        conta_pagar_id: p.conta_pagar_id,
        numero: p.numero,
        valor: parseFloat(p.valor) || 0,
        data_vencimento: new Date(p.data_vencimento),
        data_pagamento: p.data_pagamento ? new Date(p.data_pagamento) : undefined,
        status: p.status as ParcelaStatus,
        observacoes: p.observacoes || '',
        criado_em: new Date(p.criado_em),
        atualizado_em: new Date(p.atualizado_em)
      }));

      setParcelas(parcelasFormatadas);
      return parcelasFormatadas;
    } catch (error: any) {
      console.error('Erro ao carregar parcelas:', error);
      toast.error('Erro ao carregar parcelas');
      return [];
    }
  };

  // Marcar parcela como paga
  const marcarParcelaComoPaga = async (parcela: Parcela) => {
    const conta = contasPagar.find(c => c.id === parcela.conta_pagar_id);
    if (isContaDerivada(conta)) {
      toast.error('Esta conta é derivada de uma movimentação e não pode ter parcelas atualizadas automaticamente.');
      return;
    }

    try {
      const { error } = await supabase
        .from('parcelas')
        .update({
          status: 'pago',
          data_pagamento: new Date().toISOString()
        })
        .eq('id', parcela.id);

      if (error) throw error;

      // Atualizar valores da conta
      if (conta) {
        const parcelasAtualizadas = await carregarParcelas(conta.id);
        const valorPago = parcelasAtualizadas
          .filter(p => p.status === 'pago')
          .reduce((sum, p) => sum + p.valor, 0);
        const valorConta = conta.valor_total ?? conta.valor ?? 0;
        const valorRestante = Math.max(valorConta - valorPago, 0);
        const todasPagas = parcelasAtualizadas.every(p => p.status === 'pago');
        const statusPagamento = todasPagas ? 'pago' : valorPago > 0 ? 'parcial' : 'pendente';
        const parcelasPagas = parcelasAtualizadas.filter(p => p.status === 'pago').length;
        const dataPagamento = todasPagas ? new Date().toISOString() : null;

        await atualizarContaPagarRemoto(
          conta.id,
          {
            valor_pago: valorPago,
            valor_restante: valorRestante,
            status_pagamento: statusPagamento,
            data_pagamento: dataPagamento,
            parcelas_pagas: parcelasPagas
          },
          {
            valor_pago: valorPago,
            valor_restante: valorRestante,
            status: todasPagas ? 'finalizado' : 'pendente',
            data_pagamento: dataPagamento,
            parcelas_pagas: parcelasPagas
          }
        );
      }

      toast.success('Parcela marcada como paga!');
      await carregarContasPagar();
      if (contaSelecionadaParcelas) {
        await carregarParcelas(contaSelecionadaParcelas.id);
      }
    } catch (error: any) {
      toast.error(error.message || 'Erro ao marcar parcela como paga');
    }
  };

  // Finalizar pagamento completo
  const finalizarPagamento = async () => {
    if (!contaParaFinalizar) return;

    try {
      // ✅ Se a conta veio das movimentações, criamos uma versão persistida antes de finalizar
      const contaAlvo = isContaDerivada(contaParaFinalizar)
        ? await criarContaPagarReal(contaParaFinalizar)
        : contaParaFinalizar;

      // ✅ Permite finalizar contas manualmente ou derivadas apenas escolhendo data e origem
      const dataPagamentoISO = dataPagamentoFinal.toISOString();
      const valorTotalConta = Number(contaAlvo.valor_total ?? contaAlvo.valor ?? 0);
      const valorJaPago = Number(contaAlvo.valor_pago ?? 0);
      const valorAPagar = Math.max(valorTotalConta - valorJaPago, 0);
      const totalParcelas = contaAlvo.parcelasDetalhes?.length
        ? contaAlvo.parcelasDetalhes.length
        : contaAlvo.parcelas || contaAlvo.numero_parcelas || 1;

      const saldoDisponivel = origemPagamentoFinal === 'caixa' ? saldoCaixa : saldoBanco;

      if (valorAPagar > saldoDisponivel) {
        toast.error(`Saldo insuficiente no ${origemPagamentoFinal === 'caixa' ? 'Caixa' : 'Banco'} para finalizar este pagamento.`);
        return;
      }

      if (valorAPagar === 0) {
        toast.error('Esta conta já está quitada.');
        return;
      }

      await atualizarContaPagarRemoto(
        contaAlvo.id,
        {
          status_pagamento: 'pago',
          data_pagamento: dataPagamentoISO,
          valor_pago: valorTotalConta,
          valor_restante: 0,
          conta_origem: origemPagamentoFinal,
          parcelas_pagas: totalParcelas
        },
        {
          status: 'finalizado',
          data_pagamento: dataPagamentoISO,
          valor_pago: valorTotalConta,
          valor_restante: 0,
          origem_pagamento: origemPagamentoFinal,
          parcelas_pagas: totalParcelas
        }
      );

      // Marcar todas as parcelas como pagas
      if (contaAlvo.parcelasDetalhes && contaAlvo.parcelasDetalhes.length > 0) {
        await supabase
          .from('parcelas')
          .update({
            status: 'pago',
            data_pagamento: dataPagamentoFinal.toISOString()
          })
          .eq('conta_pagar_id', contaAlvo.id)
          .eq('status', 'pendente');
      }

      // ✅ Mantém o estado atualizado com a conta real criada
      setContaParaFinalizar(contaAlvo);

      toast.success(`Pagamento finalizado com sucesso! Debitado do ${origemPagamentoFinal === 'caixa' ? 'Caixa' : 'Banco'}.`);
      setShowDialogFinalizarPagamento(false);
      setContaParaFinalizar(null);
      setOrigemPagamentoFinal('caixa'); // Reset para padrão
      await carregarContasPagar();
    } catch (error: any) {
      toast.error(error.message || 'Erro ao finalizar pagamento');
    }
  };

  // Filtrar contas a pagar
  const contasPagarFiltradas = useMemo(() => {
    let filtradas = [...contasPagar];

    // Filtro por fornecedor
    if (filtroFornecedor !== 'todos') {
      filtradas = filtradas.filter(c => c.fornecedor === filtroFornecedor);
    }

    // Filtro por forma de pagamento
    if (filtroFormaPagamento !== 'todos') {
      filtradas = filtradas.filter(c => c.forma_pagamento === filtroFormaPagamento);
    }

    // Filtro por status
    if (filtroStatus !== 'todos') {
      filtradas = filtradas.filter(c => c.status === filtroStatus);
    }

    // Filtro por período
    if (filtroPeriodo !== 'todos') {
      const now = new Date();
      filtradas = filtradas.filter(c => {
        const dataVencimento = new Date(c.data_vencimento);
        if (filtroPeriodo === 'mes') {
          return dataVencimento.getMonth() === now.getMonth() && 
                 dataVencimento.getFullYear() === now.getFullYear();
        } else if (filtroPeriodo === 'ano') {
          return dataVencimento.getFullYear() === now.getFullYear();
        }
        return true;
      });
    }

    return filtradas;
  }, [contasPagar, filtroFornecedor, filtroFormaPagamento, filtroStatus, filtroPeriodo]);

  // Calcular totais
  const totaisContasPagar = useMemo(() => {
    const totalGeral = contasPagarFiltradas.reduce((sum, c) => sum + (c.valor_total ?? c.valor ?? 0), 0);
    const totalPago = contasPagarFiltradas
      .filter(c => c.status === 'pago' || c.status === 'finalizado')
      .reduce((sum, c) => sum + (c.valor_pago || 0), 0);
    const totalPendente = contasPagarFiltradas
      .filter(c => c.status === 'pendente' || c.status === 'vencido')
      .reduce((sum, c) => sum + (c.valor_restante || 0), 0);

    return { totalGeral, totalPago, totalPendente };
  }, [contasPagarFiltradas]);

  const proximaContaPagar = useMemo(() => {
    const proximas = contasPagarFiltradas
      .filter(c => c.status !== 'pago' && c.status !== 'finalizado')
      .map(conta => {
        const proximaParcela = conta.parcelasDetalhes?.find(parcela => parcela.status === 'pendente');
        const vencimento = proximaParcela?.data_vencimento ?? conta.data_vencimento;
        return {
          id: conta.id,
          descricao: conta.descricao,
          fornecedor: conta.fornecedor,
          vencimento
        };
      })
      .sort((a, b) => a.vencimento.getTime() - b.vencimento.getTime());

    return proximas[0] ?? null;
  }, [contasPagarFiltradas]);

  // Extrair lista única de fornecedores das contas a pagar
  const fornecedoresUnicos = useMemo(() => {
    const fornecedores = contasPagar
      .map(c => c.fornecedor)
      .filter((f): f is string => !!f && f.trim() !== '');
    return [...new Set(fornecedores)].sort();
  }, [contasPagar]);

  // Carregar contas ao montar componente e quando workspace mudar
  useEffect(() => {
    if (user?.id && workspaceAtivo?.id) {
      console.log('🔄 Recarregando contas devido a mudança de workspace/usuário:', {
        userId: user.id,
        workspaceId: workspaceAtivo.id,
        workspaceNome: workspaceAtivo.nome
      });
      carregarContasPagar();
      carregarContasReceber();
    }
  }, [user?.id, workspaceAtivo?.id]);

  // Listener para mudanças de workspace via evento customizado
  useEffect(() => {
    const handleWorkspaceChange = (event: CustomEvent) => {
      console.log('📡 Evento de mudança de workspace detectado:', event.detail);
      if (user?.id && workspaceAtivo?.id) {
        carregarContasPagar();
        carregarContasReceber();
      }
    };

    const handleContasPagarChanged = () => {
      console.log('📡 Evento contas-pagar-changed detectado, recarregando...');
      if (user?.id && workspaceAtivo?.id) {
        carregarContasPagar();
      }
    };

    const handleContasReceberChanged = () => {
      console.log('📡 Evento contas-receber-changed detectado, recarregando...');
      if (user?.id && workspaceAtivo?.id) {
        carregarContasReceber();
      }
    };

    window.addEventListener('workspace-changed', handleWorkspaceChange as EventListener);
    window.addEventListener('contas-pagar-changed', handleContasPagarChanged);
    window.addEventListener('contas-receber-changed', handleContasReceberChanged);
    
    return () => {
      window.removeEventListener('workspace-changed', handleWorkspaceChange as EventListener);
      window.removeEventListener('contas-pagar-changed', handleContasPagarChanged);
      window.removeEventListener('contas-receber-changed', handleContasReceberChanged);
    };
  }, [user?.id, workspaceAtivo?.id]);

  // Extrair lista única de clientes das contas a receber
  const clientesUnicos = useMemo(() => {
    const clientes = contasReceber
      .map(c => c.cliente)
      .filter((c): c is string => !!c && c.trim() !== '');
    return [...new Set(clientes)].sort();
  }, [contasReceber]);

  // Filtrar fornecedores baseado no termo de busca
  const fornecedoresFiltrados = useMemo(() => {
    const search = fornecedorSearchTerm.trim().toLowerCase();
    if (!search) {
      return fornecedoresUnicos.slice(0, 20); // Mostrar até 20 quando não há busca
    }
    return fornecedoresUnicos
      .filter(f => f.toLowerCase().includes(search))
      .slice(0, 20);
  }, [fornecedoresUnicos, fornecedorSearchTerm]);

  // Filtrar clientes baseado no termo de busca
  const clientesFiltrados = useMemo(() => {
    const search = clienteSearchTerm.trim().toLowerCase();
    if (!search) {
      return clientesUnicos.slice(0, 20); // Mostrar até 20 quando não há busca
    }
    return clientesUnicos
      .filter(c => c.toLowerCase().includes(search))
      .slice(0, 20);
  }, [clientesUnicos, clienteSearchTerm]);

  // Fechar dropdown quando clicar fora (fornecedores)
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (fornecedorInputRef.current && !fornecedorInputRef.current.contains(event.target as Node)) {
        setShowFornecedorDropdown(false);
      }
    };
    if (showFornecedorDropdown) {
      document.addEventListener('mousedown', handleClickOutside);
    }
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [showFornecedorDropdown]);

  // Fechar dropdown quando clicar fora (clientes)
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (clienteInputRef.current && !clienteInputRef.current.contains(event.target as Node)) {
        setShowClienteDropdown(false);
      }
    };
    if (showClienteDropdown) {
      document.addEventListener('mousedown', handleClickOutside);
    }
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [showClienteDropdown]);

  // Calcular DRE
  const calcularDREAtual = () => {
    return calcularDRE(
      contasPagar,
      contasReceber,
      movements
        .filter(m => m.type === 'entrada' || m.type === 'saida')
        .map(m => ({
          id: m.id,
          type: m.type as 'entrada' | 'saida',
          total: m.total,
          date: m.date instanceof Date ? m.date : new Date(m.date),
          description: m.description
        })),
      drePeriodoInicio,
      drePeriodoFim
    );
  };

  // Exportar DRE em PDF
  const exportarDREPDF = () => {
    try {
      const dre = calcularDREAtual();
      const periodoTexto = `${drePeriodoInicio.toLocaleDateString('pt-BR')} a ${drePeriodoFim.toLocaleDateString('pt-BR')}`;

      const dadosPDF = {
        dre,
        periodo_texto: periodoTexto,
        data_geracao: new Date(),
        contas_pagar: contasPagar,
        contas_receber: contasReceber,
        movimentacoes: movements
          .filter(m => m.type === 'entrada' || m.type === 'saida')
          .map(m => ({
            id: m.id,
            tipo: m.type as 'entrada' | 'saida',
            descricao: m.description,
            valor: m.total,
            data: m.date instanceof Date ? m.date : new Date(m.date)
          }))
      };

      exportDREToPDF(dadosPDF, (error) => {
        toast.error("Erro ao Exportar DRE em PDF", {
          description: error,
          duration: 5000,
        });
      });

      toast.success("DRE gerado com sucesso!", {
        description: "Abra a janela de impressão para salvar como PDF",
        duration: 3000,
      });
    } catch (error) {
      toast.error("Erro ao Exportar DRE", {
        description: error instanceof Error ? error.message : "Erro desconhecido",
        duration: 5000,
      });
    }
  };

  if (isLoading) {
    return (
      <main className="flex-1 p-3 sm:p-6 space-y-4 sm:space-y-6">
        <div className="flex items-center justify-center min-h-[400px]">
          <div className="text-center">
            <div className="w-16 h-16 bg-gradient-to-br from-green-500 to-green-600 rounded-full flex items-center justify-center mx-auto mb-4 animate-pulse">
              <DollarSign className="w-8 h-8 text-white" />
            </div>
            <h3 className="text-lg font-semibold text-gray-900 mb-2">Carregando Financeiro...</h3>
            <p className="text-gray-600">Preparando dados financeiros e movimentações</p>
          </div>
        </div>
      </main>
    );
  }

  return (
    <main className="flex-1 p-2 sm:p-6 space-y-3 sm:space-y-6">
      {/* Cabeçalho */}
      <div>
        <div className="flex flex-col items-center sm:flex-row sm:items-center sm:justify-between gap-4 mt-4 sm:mt-0">
          <div className="text-center sm:text-left">
            <h1 className="text-3xl font-bold bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent flex items-center gap-2 justify-center sm:justify-start">
              <DollarSign className="w-8 h-8 text-blue-600" />
              Financeiro
            </h1>
            <p className="text-gray-600 mt-1">
              Controle completo de receitas, despesas e movimentações
            </p>
          </div>
          
          <div className="flex flex-col sm:flex-row gap-2">
            <Select value={period} onValueChange={setPeriod}>
              <SelectTrigger className="w-full sm:w-48 bg-white border-slate-300">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="todos"><span className="flex items-center gap-2"><BarChart3 className="h-4 w-4" /> Todos</span></SelectItem>
                <SelectItem value="mes"><span className="flex items-center gap-2"><CalendarIcon className="h-4 w-4" /> Este Mês</span></SelectItem>
                <SelectItem value="trimestre"><span className="flex items-center gap-2"><TrendingUp className="h-4 w-4" /> Trimestre</span></SelectItem>
                <SelectItem value="ano"><span className="flex items-center gap-2"><BarChart3 className="h-4 w-4" /> Este Ano</span></SelectItem>
              </SelectContent>
            </Select>
            <Button 
              onClick={exportToPDF}
              className="w-full sm:w-auto bg-gradient-to-r from-red-600 to-red-700 hover:from-red-700 hover:to-red-800 text-white px-6 sm:px-8 py-3 sm:py-4 rounded-xl sm:rounded-2xl shadow-xl hover:shadow-2xl transition-all duration-200 transform hover:scale-105"
            >
              <FileText className="w-5 h-5 sm:w-6 sm:h-6 mr-2 sm:mr-3" />
              Exportar PDF
            </Button>
            <Button 
              onClick={exportToCSV}
              className="w-full sm:w-auto bg-gradient-to-r from-indigo-600 to-indigo-700 hover:from-indigo-700 hover:to-indigo-800 text-white px-6 sm:px-8 py-3 sm:py-4 rounded-xl sm:rounded-2xl shadow-xl hover:shadow-2xl transition-all duration-200 transform hover:scale-105"
            >
              <FileSpreadsheet className="w-5 h-5 sm:w-6 sm:h-6 mr-2 sm:mr-3" />
              Exportar Excel
            </Button>
          </div>
        </div>
      </div>

      {/* KPIs Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 sm:gap-6 lg:gap-8">
        {/* Total Produtos */}
        <div className="group bg-gradient-to-br from-blue-100 to-blue-200 rounded-2xl sm:rounded-3xl p-4 sm:p-6 text-blue-800 shadow-lg hover:shadow-xl transition-all duration-300 hover:scale-105 border border-blue-200/50">
          <div className="flex items-center justify-between mb-3 sm:mb-4">
            <div className="w-10 h-10 sm:w-12 sm:h-12 bg-blue-300/50 rounded-xl sm:rounded-2xl flex items-center justify-center backdrop-blur-sm">
              <Package className="w-5 h-5 sm:w-6 sm:h-6 text-blue-700" />
            </div>
            <div className="text-right">
              <div className="text-2xl sm:text-3xl font-black">{totalProducts}</div>
              <div className="text-xs sm:text-sm opacity-90">Total</div>
            </div>
          </div>
          <h3 className="text-base sm:text-lg font-semibold mb-2 flex items-center gap-2"><Package className="h-4 w-4" /> Total Produtos</h3>
          <p className="text-xs sm:text-sm opacity-80">Produtos cadastrados</p>
        </div>

        {/* Valor Estoque */}
        <div className="group bg-gradient-to-br from-green-100 to-green-200 rounded-2xl sm:rounded-3xl p-4 sm:p-6 text-green-800 shadow-lg hover:shadow-xl transition-all duration-300 hover:scale-105 border border-green-200/50">
          <div className="flex items-center justify-between mb-3 sm:mb-4">
            <div className="w-10 h-10 sm:w-12 sm:h-12 bg-green-300/50 rounded-xl sm:rounded-2xl flex items-center justify-center backdrop-blur-sm">
              <DollarSign className="w-5 h-5 sm:w-6 sm:h-6 text-green-700" />
            </div>
            <div className="text-right">
              <div className="text-lg sm:text-xl font-black">R$ {totalStockValue.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}</div>
              <div className="text-xs sm:text-sm opacity-90">Investido</div>
            </div>
          </div>
          <h3 className="text-base sm:text-lg font-semibold mb-2 flex items-center gap-2"><DollarSign className="h-4 w-4" /> Valor Estoque</h3>
          <p className="text-xs sm:text-sm opacity-80">Valor total investido</p>
        </div>

        {/* Total Entradas */}
        <div className="group bg-gradient-to-br from-emerald-100 to-emerald-200 rounded-2xl sm:rounded-3xl p-4 sm:p-6 text-emerald-800 shadow-lg hover:shadow-xl transition-all duration-300 hover:scale-105 border border-emerald-200/50">
          <div className="flex items-center justify-between mb-3 sm:mb-4">
            <div className="w-10 h-10 sm:w-12 sm:h-12 bg-emerald-300/50 rounded-xl sm:rounded-2xl flex items-center justify-center backdrop-blur-sm">
              <ArrowDownCircle className="w-5 h-5 sm:w-6 sm:h-6 text-emerald-700" />
            </div>
            <div className="text-right">
              <div className="text-lg sm:text-xl font-black">R$ {totalEntradas.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}</div>
              <div className="text-xs sm:text-sm opacity-90">Total</div>
            </div>
          </div>
          <h3 className="text-base sm:text-lg font-semibold mb-2 flex items-center gap-2"><ArrowDownCircle className="h-4 w-4" /> Entradas</h3>
          <p className="text-xs sm:text-sm opacity-80">{entradas.length} movimentações</p>
        </div>

        {/* Total Saídas */}
        <div className="group bg-gradient-to-br from-orange-100 to-orange-200 rounded-2xl sm:rounded-3xl p-4 sm:p-6 text-orange-800 shadow-lg hover:shadow-xl transition-all duration-300 hover:scale-105 border border-orange-200/50">
          <div className="flex items-center justify-between mb-3 sm:mb-4">
            <div className="w-10 h-10 sm:w-12 sm:h-12 bg-orange-300/50 rounded-xl sm:rounded-2xl flex items-center justify-center backdrop-blur-sm">
              <ArrowUpCircle className="w-5 h-5 sm:w-6 sm:h-6 text-orange-700" />
            </div>
            <div className="text-right">
              <div className="text-lg sm:text-xl font-black">R$ {totalSaidas.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}</div>
              <div className="text-xs sm:text-sm opacity-90">Total</div>
            </div>
          </div>
          <h3 className="text-base sm:text-lg font-semibold mb-2 flex items-center gap-2"><ArrowUpCircle className="h-4 w-4" /> Saídas</h3>
          <p className="text-xs sm:text-sm opacity-80">{saidas.length} movimentações</p>
        </div>
      </div>

      {/* Lucro/Prejuízo */}
      <Card className={`border-2 ${saldo >= 0 ? 'border-green-500 bg-green-50' : 'border-red-500 bg-red-50'}`}>
        <CardContent className="pt-6">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className={`p-3 rounded-full ${saldo >= 0 ? 'bg-green-100' : 'bg-red-100'}`}>
                <BarChart3 className={`w-6 h-6 ${saldo >= 0 ? 'text-green-600' : 'text-red-600'}`} />
              </div>
              <div>
                <p className="text-sm font-medium text-gray-600">
                  {saldo >= 0 ? <span className="flex items-center gap-2"><DollarSign className="h-4 w-4" /> Lucro Estimado</span> : <span className="flex items-center gap-2"><TrendingDown className="h-4 w-4" /> Prejuízo Estimado</span>}
                </p>
                <p className="text-xs text-gray-500">Saídas - Entradas</p>
              </div>
            </div>
            <div className={`text-xl sm:text-2xl font-bold ${saldo >= 0 ? 'text-green-600' : 'text-red-600'}`}>
              {saldo >= 0 ? '+' : ''}R$ {Math.abs(saldo).toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Cards de Navegação */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-4 mb-6">
        {/* Card Movimentações */}
        <Card 
          className={`cursor-pointer transition-colors ${
            abaAtiva === 'movimentacoes' 
              ? 'border-blue-500 bg-blue-50' 
              : 'border-gray-200 hover:border-blue-300 hover:bg-gray-50'
          }`}
          onClick={() => setAbaAtiva('movimentacoes')}
        >
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <div className={`p-2 rounded-md ${
                abaAtiva === 'movimentacoes' ? 'bg-blue-100' : 'bg-gray-100'
              }`}>
                <Receipt className={`h-5 w-5 ${
                  abaAtiva === 'movimentacoes' ? 'text-blue-600' : 'text-gray-600'
                }`} />
              </div>
              <div>
                <h3 className={`font-semibold text-sm ${
                  abaAtiva === 'movimentacoes' ? 'text-blue-900' : 'text-gray-900'
                }`}>
                  Movimentações
                </h3>
                <p className={`text-xs ${
                  abaAtiva === 'movimentacoes' ? 'text-blue-600' : 'text-gray-500'
                }`}>
                  Estoque
                </p>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Card Resumo */}
        <Card 
          className={`cursor-pointer transition-colors ${
            abaAtiva === 'resumo' 
              ? 'border-indigo-500 bg-indigo-50' 
              : 'border-gray-200 hover:border-indigo-300 hover:bg-gray-50'
          }`}
          onClick={() => setAbaAtiva('resumo')}
        >
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <div className={`p-2 rounded-md ${
                abaAtiva === 'resumo' ? 'bg-indigo-100' : 'bg-gray-100'
              }`}>
                <PiggyBank className={`h-5 w-5 ${
                  abaAtiva === 'resumo' ? 'text-indigo-600' : 'text-gray-600'
                }`} />
              </div>
              <div>
                <h3 className={`font-semibold text-sm ${
                  abaAtiva === 'resumo' ? 'text-indigo-900' : 'text-gray-900'
                }`}>
                  Resumo
                </h3>
                <p className={`text-xs ${
                  abaAtiva === 'resumo' ? 'text-indigo-600' : 'text-gray-500'
                }`}>
                  Financeiro
                </p>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Card Contas a Pagar */}
        <Card 
          className={`cursor-pointer transition-colors ${
            abaAtiva === 'contas-pagar' 
              ? 'border-red-500 bg-red-50' 
              : 'border-gray-200 hover:border-red-300 hover:bg-gray-50'
          }`}
          onClick={() => setAbaAtiva('contas-pagar')}
        >
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <div className={`p-2 rounded-md ${
                abaAtiva === 'contas-pagar' ? 'bg-red-100' : 'bg-gray-100'
              }`}>
                <ArrowDownCircle className={`h-5 w-5 ${
                  abaAtiva === 'contas-pagar' ? 'text-red-600' : 'text-gray-600'
                }`} />
              </div>
              <div>
                <h3 className={`font-semibold text-sm ${
                  abaAtiva === 'contas-pagar' ? 'text-red-900' : 'text-gray-900'
                }`}>
                  Contas a Pagar
                </h3>
                <p className={`text-xs ${
                  abaAtiva === 'contas-pagar' ? 'text-red-600' : 'text-gray-500'
                }`}>
                  Despesas
                </p>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Card Contas a Receber */}
        <Card 
          className={`cursor-pointer transition-colors ${
            abaAtiva === 'contas-receber' 
              ? 'border-green-500 bg-green-50' 
              : 'border-gray-200 hover:border-green-300 hover:bg-gray-50'
          }`}
          onClick={() => setAbaAtiva('contas-receber')}
        >
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <div className={`p-2 rounded-md ${
                abaAtiva === 'contas-receber' ? 'bg-green-100' : 'bg-gray-100'
              }`}>
                <ArrowUpCircle className={`h-5 w-5 ${
                  abaAtiva === 'contas-receber' ? 'text-green-600' : 'text-gray-600'
                }`} />
              </div>
              <div>
                <h3 className={`font-semibold text-sm ${
                  abaAtiva === 'contas-receber' ? 'text-green-900' : 'text-gray-900'
                }`}>
                  Contas a Receber
                </h3>
                <p className={`text-xs ${
                  abaAtiva === 'contas-receber' ? 'text-green-600' : 'text-gray-500'
                }`}>
                  Receitas
                </p>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Card DRE */}
        <Card 
          className={`cursor-pointer transition-colors ${
            abaAtiva === 'dre' 
              ? 'border-purple-500 bg-purple-50' 
              : 'border-gray-200 hover:border-purple-300 hover:bg-gray-50'
          }`}
          onClick={() => setAbaAtiva('dre')}
        >
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <div className={`p-2 rounded-md ${
                abaAtiva === 'dre' ? 'bg-purple-100' : 'bg-gray-100'
              }`}>
                <BarChart3 className={`h-5 w-5 ${
                  abaAtiva === 'dre' ? 'text-purple-600' : 'text-gray-600'
                }`} />
              </div>
              <div>
                <h3 className={`font-semibold text-sm ${
                  abaAtiva === 'dre' ? 'text-purple-900' : 'text-gray-900'
                }`}>
                  DRE
                </h3>
                <p className={`text-xs ${
                  abaAtiva === 'dre' ? 'text-purple-600' : 'text-gray-500'
                }`}>
                  Resultado
                </p>
              </div>
            </div>
          </CardContent>
        </Card>

      </div>

      {/* Conteúdo das Abas */}
      <Tabs value={abaAtiva} onValueChange={setAbaAtiva} className="space-y-6">

        {/* ABA 1: MOVIMENTAÇÕES */}
        <TabsContent value="movimentacoes" className="space-y-6">
          {/* Cards de Estatísticas de Movimentações */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 sm:gap-6 lg:gap-8">
            <div className="group bg-gradient-to-br from-blue-100 to-blue-200 rounded-2xl sm:rounded-3xl p-4 sm:p-6 text-blue-800 shadow-lg hover:shadow-xl transition-all duration-300 hover:scale-105 border border-blue-200/50">
              <div className="flex items-center justify-between mb-3 sm:mb-4">
                <div className="w-10 h-10 sm:w-12 sm:h-12 bg-blue-300/50 rounded-xl sm:rounded-2xl flex items-center justify-center backdrop-blur-sm">
                  <RotateCcw className="w-5 h-5 sm:w-6 sm:h-6 text-blue-700" />
                </div>
                <div className="text-right">
                  <div className="text-2xl sm:text-3xl font-black">{totalMovements}</div>
                  <div className="text-xs sm:text-sm opacity-90">Total</div>
                </div>
              </div>
              <h3 className="text-base sm:text-lg font-semibold mb-2 flex items-center gap-2"><BarChart3 className="h-4 w-4" /> Total Movimentações</h3>
              <p className="text-xs sm:text-sm opacity-80">Registros no sistema</p>
            </div>

            <div className={`group ${saldo >= 0 ? 'bg-gradient-to-br from-green-100 to-green-200' : 'bg-gradient-to-br from-red-100 to-red-200'} rounded-2xl sm:rounded-3xl p-4 sm:p-6 ${saldo >= 0 ? 'text-green-800' : 'text-red-800'} shadow-lg hover:shadow-xl transition-all duration-300 hover:scale-105 border ${saldo >= 0 ? 'border-green-200/50' : 'border-red-200/50'}`}>
              <div className="flex items-center justify-between mb-3 sm:mb-4">
                <div className={`w-10 h-10 sm:w-12 sm:h-12 ${saldo >= 0 ? 'bg-green-300/50' : 'bg-red-300/50'} rounded-xl sm:rounded-2xl flex items-center justify-center backdrop-blur-sm`}>
                  <Wallet className={`w-5 h-5 sm:w-6 sm:h-6 ${saldo >= 0 ? 'text-green-700' : 'text-red-700'}`} />
                </div>
                <div className="text-right">
                  <div className="text-lg sm:text-xl font-black">
                    R$ {Math.abs(saldo).toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
                  </div>
                  <div className="text-xs sm:text-sm opacity-90">{saldo >= 0 ? 'Lucro' : 'Prejuízo'}</div>
                </div>
              </div>
              <h3 className="text-base sm:text-lg font-semibold mb-2 flex items-center gap-2"><DollarSign className="h-4 w-4" /> Saldo</h3>
              <p className="text-xs sm:text-sm opacity-80">Posição financeira</p>
            </div>

            <div className="group bg-gradient-to-br from-purple-100 to-purple-200 rounded-2xl sm:rounded-3xl p-4 sm:p-6 text-purple-800 shadow-lg hover:shadow-xl transition-all duration-300 hover:scale-105 border border-purple-200/50">
              <div className="flex items-center justify-between mb-3 sm:mb-4">
                <div className="w-10 h-10 sm:w-12 sm:h-12 bg-purple-300/50 rounded-xl sm:rounded-2xl flex items-center justify-center backdrop-blur-sm">
                  <CalendarIcon className="w-5 h-5 sm:w-6 sm:h-6 text-purple-700" />
                </div>
                <div className="text-right">
                  <div className="text-2xl sm:text-3xl font-black">{thisMonthMovements.length}</div>
                  <div className="text-xs sm:text-sm opacity-90">Movimentações</div>
                </div>
              </div>
              <h3 className="text-base sm:text-lg font-semibold mb-2 flex items-center gap-2"><CalendarIcon className="h-4 w-4" /> Este Mês</h3>
              <p className="text-xs sm:text-sm opacity-80">Movimentações do período</p>
            </div>

            <div className="group bg-gradient-to-br from-orange-100 to-orange-200 rounded-2xl sm:rounded-3xl p-4 sm:p-6 text-orange-800 shadow-lg hover:shadow-xl transition-all duration-300 hover:scale-105 border border-orange-200/50">
              <div className="flex items-center justify-between mb-3 sm:mb-4">
                <div className="w-10 h-10 sm:w-12 sm:h-12 bg-orange-300/50 rounded-xl sm:rounded-2xl flex items-center justify-center backdrop-blur-sm">
                  <Package className="w-5 h-5 sm:w-6 sm:h-6 text-orange-700" />
                </div>
                <div className="text-right">
                  <div className="text-2xl sm:text-3xl font-black">{productosMovimentados}</div>
                  <div className="text-xs sm:text-sm opacity-90">Produtos</div>
                </div>
              </div>
              <h3 className="text-base sm:text-lg font-semibold mb-2 flex items-center gap-2"><RotateCcw className="h-4 w-4" /> Produtos</h3>
              <p className="text-xs sm:text-sm opacity-80">Produtos movimentados</p>
            </div>
          </div>

          {/* Resto do conteúdo de movimentações será mantido aqui */}
          {/* Componente: Estoque Baixo e Top 5 Mais Valiosos */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 sm:gap-6">
            {/* Estoque Baixo */}
            <Card className="shadow-lg flex flex-col h-full">
              <CardHeader className="bg-gradient-to-r from-red-50 to-orange-50 flex-shrink-0">
                <CardTitle className="flex items-center gap-2 text-red-900">
                  <AlertTriangle className="w-5 h-5 text-red-600" />
                  Estoque Baixo
                </CardTitle>
                <CardDescription>
                  Produtos com estoque abaixo do mínimo
                </CardDescription>
              </CardHeader>
              {(() => {
                const lowStockProducts = products
                  .filter(p => {
                    const stock = typeof p.stock === 'number' ? p.stock : parseFloat(String(p.stock || 0));
                    const minStock = p.minStock || 0;
                    return stock <= minStock && minStock > 0;
                  })
                  .sort((a, b) => {
                    const stockA = typeof a.stock === 'number' ? a.stock : parseFloat(String(a.stock || 0));
                    const stockB = typeof b.stock === 'number' ? b.stock : parseFloat(String(b.stock || 0));
                    const minStockA = a.minStock || 0;
                    const minStockB = b.minStock || 0;
                    return (stockA - minStockA) - (stockB - minStockB);
                  });
                
                const shouldScroll = lowStockProducts.length >= 5;
                
                return (
                  <CardContent className="p-0">
                    {lowStockProducts.length === 0 ? (
                      <div className="p-8 text-center">
                        <CheckCircle className="w-12 h-12 mx-auto mb-3 text-green-300" />
                        <p className="text-gray-500 text-sm">Nenhum produto com estoque baixo</p>
                        <p className="text-xs text-gray-400 mt-1">Todos os produtos estão acima do mínimo</p>
                      </div>
                    ) : (
                      <div 
                        className="divide-y"
                        style={shouldScroll ? { 
                          maxHeight: '350px',
                          overflowY: 'auto',
                          overflowX: 'hidden',
                          WebkitOverflowScrolling: 'touch'
                        } : {}}
                      >
                        {lowStockProducts.map((product) => {
                          const stock = typeof product.stock === 'number' ? product.stock : parseFloat(String(product.stock || 0));
                          const minStock = product.minStock || 0;
                          const isCritical = stock === 0;
                          
                          return (
                            <div key={product.id} className={`p-4 transition-colors ${isCritical ? 'bg-red-50 hover:bg-red-100' : 'hover:bg-orange-50'}`}>
                              <div className="flex items-center justify-between">
                                <div className="flex items-center gap-3 flex-1 min-w-0">
                                  <div className={`w-8 h-8 rounded-full flex items-center justify-center flex-shrink-0 ${
                                    isCritical ? 'bg-red-200 text-red-700' : 'bg-orange-200 text-orange-700'
                                  }`}>
                                    <AlertTriangle className={`w-4 h-4 ${isCritical ? 'text-red-700' : 'text-orange-700'}`} />
                                  </div>
                                  <div className="flex-1 min-w-0">
                                    <p className="font-semibold text-sm text-gray-900 truncate">{product.name}</p>
                                    <p className="text-xs text-gray-500">SKU: {product.sku}</p>
                                  </div>
                                </div>
                                <div className="text-right flex-shrink-0 ml-4">
                                  <p className={`font-bold text-sm ${isCritical ? 'text-red-600' : 'text-orange-600'}`}>
                                    {stock} / {minStock}
                                  </p>
                                  <p className="text-xs text-gray-500">
                                    {stock === 0 ? 'Esgotado' : `${minStock - stock} abaixo`}
                                  </p>
                                </div>
                              </div>
                            </div>
                          );
                        })}
                      </div>
                    )}
                  </CardContent>
                );
              })()}
            </Card>

            {/* Top 5 Mais Valiosos */}
            <Card className="shadow-lg">
              <CardHeader className="bg-gradient-to-r from-emerald-50 to-green-50">
                <CardTitle className="flex items-center gap-2 text-emerald-900">
                  <TrendingUp className="w-5 h-5 text-emerald-600" />
                  Top 5 Mais Valiosos
                </CardTitle>
                <CardDescription>
                  Produtos com maior valor total em estoque
                </CardDescription>
              </CardHeader>
              <CardContent className="p-0">
                <div className="divide-y max-h-[400px] overflow-y-auto">
                  {(() => {
                    const productsWithValue = products.map(product => {
                      const productEntries = entradas
                        .filter(m => m.productId === product.id)
                        .sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime());
                      
                      let unitValue = 0;
                      
                      if (productEntries.length > 0) {
                        let totalCost = 0;
                        let totalQuantity = 0;
                        
                        productEntries.forEach(entry => {
                          totalCost += (entry.unitPrice * entry.quantity);
                          totalQuantity += entry.quantity;
                        });
                        
                        const averageCost = totalQuantity > 0 ? totalCost / totalQuantity : 0;
                        unitValue = averageCost > 0 ? averageCost : (product.price || 0);
                      } else {
                        unitValue = product.price || 0;
                      }
                      
                      const stock = typeof product.stock === 'number' ? product.stock : parseFloat(String(product.stock || 0));
                      const totalValue = unitValue * stock;
                      
                      return {
                        ...product,
                        unitValue,
                        totalValue,
                        stock
                      };
                    })
                    .filter(p => p.totalValue > 0)
                    .sort((a, b) => b.totalValue - a.totalValue);
                    
                    if (productsWithValue.length === 0) {
                      return (
                        <div className="p-8 text-center">
                          <Package className="w-12 h-12 mx-auto mb-3 text-gray-300" />
                          <p className="text-gray-500 text-sm">Nenhum produto com estoque valorizado</p>
                        </div>
                      );
                    }
                    
                    return productsWithValue.map((product, index) => (
                      <div key={product.id} className="p-4 hover:bg-gray-50 transition-colors">
                        <div className="flex items-center justify-between">
                          <div className="flex items-center gap-3 flex-1 min-w-0">
                            <div className={`w-8 h-8 rounded-full flex items-center justify-center font-bold text-sm ${
                              index === 0 ? 'bg-yellow-100 text-yellow-700' :
                              index === 1 ? 'bg-gray-100 text-gray-700' :
                              index === 2 ? 'bg-orange-100 text-orange-700' :
                              'bg-blue-100 text-blue-700'
                            }`}>
                              {index + 1}
                            </div>
                            <div className="flex-1 min-w-0">
                              <p className="font-semibold text-sm text-gray-900 truncate">{product.name}</p>
                              <p className="text-xs text-gray-500">{product.stock} unidades</p>
                            </div>
                          </div>
                          <div className="text-right">
                            <p className="font-bold text-sm text-emerald-600">
                              R$ {product.totalValue.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
                            </p>
                            <p className="text-xs text-gray-500">
                              R$ {product.unitValue.toFixed(2)}/un
                            </p>
                          </div>
                        </div>
                      </div>
                    ));
                  })()}
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Análise Comparativa: Entradas vs Saídas */}
          <Card className="shadow-lg">
            <CardHeader className="bg-gradient-to-r from-blue-50 to-purple-50">
              <CardTitle className="flex items-center gap-2 text-blue-900">
                <BarChart3 className="w-5 h-5 text-blue-600" />
                Análise Comparativa: Entradas vs Saídas
              </CardTitle>
              <CardDescription>
                Comparação visual entre custos de compra (entradas) e receitas de venda (saídas)
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              {/* Gráfico Comparativo Mensal */}
              <div>
                <h3 className="text-lg font-semibold mb-4 flex items-center gap-2 text-gray-800">
                  <CalendarIcon className="h-4 w-4" />
                  Comparativo Mensal
                </h3>
                <div className="h-[300px] w-full">
                  {(() => {
                    const monthlyData = movements.reduce((acc: any, movement) => {
                      const date = new Date(movement.date);
                      const monthKey = `${date.getMonth() + 1}/${date.getFullYear()}`;
                      const monthLabel = date.toLocaleDateString('pt-BR', { month: 'short', year: 'numeric' });
                      
                      if (!acc[monthKey]) {
                        acc[monthKey] = {
                          month: monthLabel,
                          entradas: 0,
                          saidas: 0,
                          quantidadeEntradas: 0,
                          quantidadeSaidas: 0
                        };
                      }
                      
                      if (movement.type === 'entrada') {
                        acc[monthKey].entradas += movement.total;
                        acc[monthKey].quantidadeEntradas += movement.quantity;
                      } else if (movement.type === 'saida') {
                        acc[monthKey].saidas += movement.total;
                        acc[monthKey].quantidadeSaidas += movement.quantity;
                      }
                      
                      return acc;
                    }, {});
                    
                    const chartData = Object.entries(monthlyData)
                      .map(([key, value]: [string, any]) => ({
                        ...value,
                        sortKey: key
                      }))
                      .sort((a: any, b: any) => {
                        const [monthA, yearA] = a.sortKey.split('/').map(Number);
                        const [monthB, yearB] = b.sortKey.split('/').map(Number);
                        if (yearA !== yearB) return yearA - yearB;
                        return monthA - monthB;
                      })
                      .slice(-6)
                      .map((item: any) => {
                        const { sortKey, ...rest } = item;
                        return rest;
                      });
                    
                    if (chartData.length === 0) {
                      return (
                        <div className="flex items-center justify-center h-full text-gray-500">
                          <div className="text-center">
                            <BarChart3 className="w-12 h-12 mx-auto mb-3 text-gray-300" />
                            <p className="text-sm">Nenhuma movimentação registrada</p>
                          </div>
                        </div>
                      );
                    }
                    
                    return (
                      <ResponsiveContainer width="100%" height="100%">
                        <BarChart data={chartData} barCategoryGap="20%">
                          <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" />
                          <XAxis 
                            dataKey="month" 
                            tick={{ fontSize: 12 }}
                            stroke="#6b7280"
                          />
                          <YAxis 
                            tick={{ fontSize: 12 }}
                            stroke="#6b7280"
                            tickFormatter={(value) => `R$ ${(value / 1000).toFixed(0)}k`}
                          />
                          <Tooltip 
                            formatter={(value: number, name: string) => [
                              `R$ ${value.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}`,
                              name === 'entradas' ? 'Entradas (Custos)' : 'Saídas (Receitas)'
                            ]}
                            labelFormatter={(label) => `Mês: ${label}`}
                            contentStyle={{ 
                              backgroundColor: '#fff', 
                              border: '1px solid #e5e7eb',
                              borderRadius: '8px'
                            }}
                          />
                          <Legend 
                            formatter={(value) => value === 'entradas' ? 'Entradas (Custos)' : 'Saídas (Receitas)'}
                          />
                          <Bar 
                            dataKey="entradas" 
                            fill="#3b82f6" 
                            name="entradas"
                            radius={[4, 4, 0, 0]}
                          />
                          <Bar 
                            dataKey="saidas" 
                            fill="#10b981" 
                            name="saidas"
                            radius={[4, 4, 0, 0]}
                          />
                        </BarChart>
                      </ResponsiveContainer>
                    );
                  })()}
                </div>
              </div>

              {/* Cards Comparativos */}
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <Card className="border-2 border-blue-200 bg-gradient-to-br from-blue-50 to-blue-100">
                  <CardContent className="p-4">
                    <div className="flex items-center justify-between">
                      <div className="flex-1">
                        <p className="text-sm font-medium text-blue-800 mb-1 flex items-center gap-2">
                          <ArrowDownCircle className="h-4 w-4" />
                          Total Entradas
                        </p>
                        <p className="text-2xl font-bold text-blue-900">
                          R$ {totalEntradas.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
                        </p>
                        <p className="text-xs text-blue-700 mt-1">
                          {entradas.length} registros
                        </p>
                        <p className="text-xs text-blue-600 mt-1">
                          {entradas.reduce((sum, m) => sum + m.quantity, 0)} unidades compradas
                        </p>
                      </div>
                      <div className="w-12 h-12 bg-blue-200 rounded-full flex items-center justify-center">
                        <ArrowDownCircle className="w-6 h-6 text-blue-700" />
                      </div>
                    </div>
                  </CardContent>
                </Card>

                <Card className="border-2 border-green-200 bg-gradient-to-br from-green-50 to-green-100">
                  <CardContent className="p-4">
                    <div className="flex items-center justify-between">
                      <div className="flex-1">
                        <p className="text-sm font-medium text-green-800 mb-1 flex items-center gap-2">
                          <ArrowUpCircle className="h-4 w-4" />
                          Total Saídas
                        </p>
                        <p className="text-2xl font-bold text-green-900">
                          R$ {totalSaidas.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
                        </p>
                        <p className="text-xs text-green-700 mt-1">
                          {saidas.length} registros
                        </p>
                        <p className="text-xs text-green-600 mt-1">
                          {saidas.reduce((sum, m) => sum + m.quantity, 0)} unidades vendidas
                        </p>
                      </div>
                      <div className="w-12 h-12 bg-green-200 rounded-full flex items-center justify-center">
                        <ArrowUpCircle className="w-6 h-6 text-green-700" />
                      </div>
                    </div>
                  </CardContent>
                </Card>

                <Card className={`border-2 ${saldo >= 0 ? 'border-emerald-300 bg-gradient-to-br from-emerald-50 to-emerald-100' : 'border-red-300 bg-gradient-to-br from-red-50 to-red-100'}`}>
                  <CardContent className="p-4">
                    <div className="flex items-center justify-between">
                      <div className="flex-1">
                        <p className={`text-sm font-medium mb-1 flex items-center gap-2 ${saldo >= 0 ? 'text-emerald-800' : 'text-red-800'}`}>
                          <DollarSign className="h-4 w-4" />
                          Saldo Final
                        </p>
                        <p className={`text-2xl font-bold ${saldo >= 0 ? 'text-emerald-900' : 'text-red-900'}`}>
                          {saldo >= 0 ? '+' : ''}R$ {Math.abs(saldo).toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
                        </p>
                        <p className={`text-xs mt-1 font-semibold ${saldo >= 0 ? 'text-emerald-700' : 'text-red-700'}`}>
                          {saldo >= 0 ? (
                            <span className="flex items-center gap-1">
                              <CheckCircle className="h-3 w-3" />
                              Lucro
                            </span>
                          ) : (
                            <span className="flex items-center gap-1">
                              <AlertTriangle className="h-3 w-3" />
                              Prejuízo
                            </span>
                          )}
                        </p>
                        <p className={`text-xs mt-1 ${saldo >= 0 ? 'text-emerald-600' : 'text-red-600'}`}>
                          {saldo >= 0 
                            ? `${((saldo / totalSaidas) * 100).toFixed(1)}% de margem`
                            : `Prejuízo de ${((Math.abs(saldo) / totalEntradas) * 100).toFixed(1)}%`
                          }
                        </p>
                      </div>
                      <div className={`w-12 h-12 rounded-full flex items-center justify-center ${saldo >= 0 ? 'bg-emerald-200' : 'bg-red-200'}`}>
                        {saldo >= 0 ? (
                          <TrendingUp className={`w-6 h-6 ${saldo >= 0 ? 'text-emerald-700' : 'text-red-700'}`} />
                        ) : (
                          <TrendingDown className="w-6 h-6 text-red-700" />
                        )}
                      </div>
                    </div>
                  </CardContent>
                </Card>
              </div>
            </CardContent>
          </Card>

          {/* Filtros e Busca */}
          <Card className="bg-gradient-to-r from-slate-50 to-gray-50 border-slate-200">
            <CardHeader className="pb-4">
              <CardTitle className="flex items-center gap-2 text-slate-800">
                <Filter className="w-5 h-5 text-slate-600" />
                Filtros e Busca
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                <div className="relative">
                  <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-slate-500 w-5 h-5" />
                  <Input
                    placeholder="Buscar movimentações..."
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    className="pl-10 bg-white border-slate-300"
                  />
                </div>
                
                <Select value={filterType} onValueChange={setFilterType}>
                  <SelectTrigger className="bg-white border-slate-300">
                    <SelectValue placeholder="Tipo de movimentação" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="todos"><span className="flex items-center gap-2"><BarChart3 className="h-4 w-4" /> Todos os tipos</span></SelectItem>
                    <SelectItem value="entrada"><span className="flex items-center gap-2"><ArrowDownCircle className="h-4 w-4" /> Entradas</span></SelectItem>
                    <SelectItem value="saida"><span className="flex items-center gap-2"><ArrowUpCircle className="h-4 w-4" /> Saídas</span></SelectItem>
                    <SelectItem value="ajuste"><span className="flex items-center gap-2"><Settings className="h-4 w-4" /> Ajustes</span></SelectItem>
                  </SelectContent>
                </Select>
                
                <Select value={filterProduct} onValueChange={setFilterProduct}>
                  <SelectTrigger className="bg-white border-slate-300">
                    <SelectValue placeholder="Produto" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="todos"><span className="flex items-center gap-2"><Package className="h-4 w-4" /> Todos os produtos</span></SelectItem>
                    {products.map(product => (
                      <SelectItem key={product.id} value={product.id}>
                        {product.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </CardContent>
          </Card>

          {/* Tabela de Movimentações */}
          <Card className="shadow-lg">
            <CardHeader className="bg-gradient-to-r from-indigo-50 to-purple-50">
              <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2">
                <div>
                  <CardTitle className="flex items-center gap-2">
                    <FileText className="w-5 h-5 text-blue-600" />
                    Histórico de Movimentações
                  </CardTitle>
                  <CardDescription>Visualize todas as movimentações do período</CardDescription>
                </div>
              </div>
            </CardHeader>
            <CardContent className="p-0">
              <div className="overflow-x-auto">
                <div className="rounded-md border border-slate-200 overflow-hidden">
                <Table>
                  <TableHeader>
                    <TableRow className="bg-slate-50 hover:bg-slate-100">
                      <TableHead className="font-semibold text-slate-700"><div className="flex items-center gap-2"><CalendarIcon className="h-4 w-4" /> Data</div></TableHead>
                      <TableHead className="font-semibold text-slate-700 hidden sm:table-cell"><div className="flex items-center gap-2"><Tag className="h-4 w-4" /> Tipo</div></TableHead>
                      <TableHead className="font-semibold text-slate-700">Produto</TableHead>
                      <TableHead className="font-semibold text-slate-700 hidden lg:table-cell"><div className="flex items-center gap-2"><FileText className="h-4 w-4" /> Descrição</div></TableHead>
                      <TableHead className="font-semibold text-slate-700 hidden md:table-cell"><div className="flex items-center gap-2"><Wallet className="h-4 w-4" /> Pagamento</div></TableHead>
                      <TableHead className="font-semibold text-slate-700 hidden sm:table-cell"><div className="flex items-center gap-2"><Package className="h-4 w-4" /> Qtd</div></TableHead>
                      <TableHead className="font-semibold text-slate-700"><div className="flex items-center gap-2"><DollarSign className="h-4 w-4" /> Valor</div></TableHead>
                      <TableHead className="font-semibold text-slate-700"><div className="flex items-center gap-2"><FileText className="h-4 w-4" /> Doc</div></TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {filteredMovements.length === 0 ? (
                      <TableRow>
                        <TableCell colSpan={7} className="text-center py-12">
                          <div className="flex flex-col items-center gap-3">
                            <RotateCcw className="w-12 h-12 text-slate-300" />
                            <div className="text-slate-500">
                              <p className="font-medium">Nenhuma movimentação encontrada</p>
                              <p className="text-sm">Comece registrando entradas ou saídas de produtos</p>
                            </div>
                          </div>
                        </TableCell>
                      </TableRow>
                    ) : (
                      (showAllMovements ? filteredMovements : filteredMovements.slice(0, 4)).map((movement) => (
                        <TableRow key={movement.id} className="hover:bg-slate-50 transition-colors">
                          <TableCell>
                            <div className="flex items-center gap-2">
                              <CalendarIcon className="w-4 h-4 text-slate-400" />
                              <span className="text-sm text-slate-600">
                                {new Date(movement.date).toLocaleDateString('pt-BR')}
                              </span>
                            </div>
                          </TableCell>
                          
                          <TableCell className="hidden sm:table-cell">
                            <Badge className={`
                              capitalize
                              ${movement.type === "entrada" ? "bg-green-100 text-green-800 border-green-300" : 
                                movement.type === "saida" ? "bg-orange-100 text-orange-800 border-orange-300" : 
                                "bg-slate-100 text-slate-800 border-slate-300"}
                            `}>
                              {movement.type === "entrada" ? <span className="flex items-center gap-1"><ArrowDownCircle className="h-4 w-4" /> Entrada</span> : 
                               movement.type === "saida" ? <span className="flex items-center gap-1"><ArrowUpCircle className="h-4 w-4" /> Saída</span> : <span className="flex items-center gap-1"><Settings className="h-4 w-4" /> Ajuste</span>}
                            </Badge>
                          </TableCell>
                          
                          <TableCell>
                            <div className="font-medium text-slate-900 text-sm">{movement.productName}</div>
                          </TableCell>
                          
                          <TableCell className="hidden lg:table-cell">
                            <span className="text-sm text-slate-600">{movement.description}</span>
                          </TableCell>
                          <TableCell className="hidden md:table-cell">
                            {movement.paymentMethod ? (
                              <Badge className="bg-violet-100 text-violet-800 border-violet-300 text-xs">
                                {movement.paymentMethod.startsWith('parcelado-') ? movement.paymentMethod.replace('parcelado-', '') : movement.paymentMethod}
                              </Badge>
                            ) : (
                              <span className="text-slate-400 text-sm">—</span>
                            )}
                          </TableCell>
                          
                          <TableCell className="hidden sm:table-cell">
                            <span className="font-semibold text-slate-900">{movement.quantity}</span>
                          </TableCell>
                          
                          <TableCell>
                            <span className={`font-bold text-sm ${
                              movement.type === 'entrada' ? 'text-green-600' : 'text-red-600'
                            }`}>
                              R$ {movement.total.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
                            </span>
                          </TableCell>
                          
                          <TableCell>
                            {movement.type === 'saida' ? (
                              <Badge 
                                className="bg-blue-100 text-blue-800 hover:bg-blue-200 border-blue-300 cursor-pointer transition-all hover:scale-105 text-xs"
                                onClick={() => openReceipt(movement)}
                              >
                                <Receipt className="w-3 h-3 mr-1 hidden sm:inline" />
                                <span className="hidden sm:inline">Receita</span>
                                <FileText className="w-3 h-3 sm:hidden" />
                              </Badge>
                            ) : movement.type === 'entrada' ? (
                              <Badge 
                                className="bg-green-100 text-green-800 hover:bg-green-200 border-green-300 cursor-pointer transition-all hover:scale-105 text-xs"
                                onClick={() => openPurchase(movement)}
                              >
                                <Receipt className="w-3 h-3 mr-1 hidden sm:inline" />
                                <span className="hidden sm:inline">Compra</span>
                                <ShoppingCart className="w-3 h-3 sm:hidden" />
                              </Badge>
                            ) : (
                              <span className="text-slate-400 text-sm">—</span>
                            )}
                          </TableCell>
                        </TableRow>
                      ))
                    )}
                  </TableBody>
                </Table>
                </div>
              </div>
              
              {/* Botão para mostrar todas as movimentações */}
              {filteredMovements.length > 4 && (
                <div className="mt-6 p-4 flex justify-center">
                  <Button
                    onClick={() => setShowAllMovements(!showAllMovements)}
                    variant="outline"
                    className="bg-gradient-to-r from-indigo-600 to-indigo-700 text-white hover:from-indigo-700 hover:to-indigo-800 hover:text-white border-0 shadow-lg"
                  >
                    {showAllMovements ? (
                      <>
                        <TrendingUp className="mr-2 h-4 w-4" />
                        Mostrar Menos
                      </>
                    ) : (
                      <>
                        <TrendingDown className="mr-2 h-4 w-4" />
                        Mostrar Todas ({filteredMovements.length} movimentações)
                      </>
                    )}
                  </Button>
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        {/* ABA 2: RESUMO FINANCEIRO */}
        <TabsContent value="resumo" className="space-y-6">
          {/* Resumo Executivo - Card Único */}
          <Card className="bg-gradient-to-br from-indigo-50 to-purple-50 border-indigo-200 shadow-xl">
            <CardHeader>
              <CardTitle className="text-xl font-bold text-indigo-900 flex items-center gap-2">
                <PiggyBank className="h-6 w-6 text-indigo-600" />
                Resumo Executivo Geral
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div className="flex items-center justify-between p-4 bg-white/60 rounded-xl border border-blue-200">
                  <div>
                    <p className="text-sm text-gray-600 mb-1 flex items-center gap-2"><DollarSign className="h-4 w-4" /> Entradas (Custos)</p>
                    <p className="text-2xl font-bold text-blue-600">R$ {totalEntradas.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}</p>
                    <p className="text-xs text-gray-500 mt-1">{entradas.length} registros</p>
                  </div>
                </div>
                
                <div className="flex items-center justify-between p-4 bg-white/60 rounded-xl border border-orange-200">
                  <div>
                    <p className="text-sm text-gray-600 mb-1 flex items-center gap-2"><TrendingDown className="h-4 w-4" /> Saídas (Receitas)</p>
                    <p className="text-2xl font-bold text-orange-600">R$ {totalSaidas.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}</p>
                    <p className="text-xs text-gray-500 mt-1">{saidas.length} registros</p>
                  </div>
                </div>
                
                <div className={`flex items-center justify-between p-4 bg-white/60 rounded-xl border-2 ${saldo >= 0 ? 'border-green-500' : 'border-red-500'}`}>
                  <div className="flex-1">
                    <p className="text-sm text-gray-600 mb-1 flex items-center gap-2"><DollarSign className="h-4 w-4" /> Saldo Final</p>
                    <p className={`text-2xl font-bold ${saldo >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                      {saldo >= 0 ? '+' : ''}R$ {saldo.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
                    </p>
                    <p className={`text-xs ${saldo >= 0 ? 'text-green-600' : 'text-red-600'} mt-1 font-semibold`}>
                      <span className="flex items-center gap-2">{saldo >= 0 ? <><CheckCircle className="h-4 w-4 text-green-600" /> LUCRO</> : <><AlertTriangle className="h-4 w-4 text-red-600" /> PREJUÍZO</>}</span>
                    </p>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Card de Lucro Total */}
          <Card className={`bg-gradient-to-br ${lucroTotal >= 0 ? 'from-green-50 to-emerald-50 border-green-200' : 'from-red-50 to-rose-50 border-red-200'} shadow-xl`}>
            <CardHeader>
              <CardTitle className={`text-xl font-bold flex items-center gap-2 ${lucroTotal >= 0 ? 'text-green-900' : 'text-red-900'}`}>
                <TrendingUp className={`h-6 w-6 ${lucroTotal >= 0 ? 'text-green-600' : 'text-red-600'}`} />
                Lucro Total por Produtos
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="flex items-center justify-between p-6 bg-white/60 rounded-xl border-2 border-green-300">
                <div>
                  <p className="text-sm text-gray-600 mb-2 flex items-center gap-2"><DollarSign className="h-4 w-4" /> Lucro Total de Todos os Produtos</p>
                  <p className={`text-4xl font-bold ${lucroTotal >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                    {lucroTotal >= 0 ? '+' : ''}R$ {lucroTotal.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
                  </p>
                  <p className={`text-xs ${lucroTotal >= 0 ? 'text-green-600' : 'text-red-600'} mt-2 font-semibold`}>
                    <span className="flex items-center gap-2">{lucroTotal >= 0 ? <><CheckCircle className="h-4 w-4 text-green-600" /> Lucro positivo</> : <><AlertTriangle className="h-4 w-4 text-red-600" /> Prejuízo</>}</span>
                  </p>
                </div>
                <div className={`w-20 h-20 ${lucroTotal >= 0 ? 'bg-green-300/50' : 'bg-red-300/50'} rounded-full flex items-center justify-center backdrop-blur-sm`}>
                  <TrendingUp className={`w-10 h-10 ${lucroTotal >= 0 ? 'text-green-700' : 'text-red-700'}`} />
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Lucro por Produto */}
          <Card className="shadow-lg">
            <CardHeader className="bg-gradient-to-r from-indigo-50 to-purple-50">
              <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2">
                <div>
                  <CardTitle className="flex items-center gap-2">
                    <FileText className="w-5 h-5 text-blue-600" />
                    Lucro por Produto
                  </CardTitle>
                  <CardDescription>
                    Margem de contribuição em porcentagem (%) = (Lucro / Total de Venda) × 100
                  </CardDescription>
                </div>
              </div>
            </CardHeader>
            <CardContent className="p-0">
              <div className="overflow-x-auto">
                <div className="rounded-md border border-slate-200 overflow-hidden">
                <Table>
                  <TableHeader>
                    <TableRow className="bg-slate-50 hover:bg-slate-100">
                      <TableHead className="font-semibold text-slate-700"><div className="flex items-center gap-2"><Package className="h-4 w-4" /> Produto</div></TableHead>
                      <TableHead className="font-semibold text-slate-700 hidden md:table-cell">SKU</TableHead>
                      <TableHead className="font-semibold text-slate-700"><div className="flex items-center gap-2"><DollarSign className="h-4 w-4" /> Total Compra</div></TableHead>
                      <TableHead className="font-semibold text-slate-700"><div className="flex items-center gap-2"><TrendingDown className="h-4 w-4" /> Total Venda</div></TableHead>
                      <TableHead className="font-semibold text-slate-700"><div className="flex items-center gap-2"><DollarSign className="h-4 w-4" /> Lucro</div></TableHead>
                      <TableHead className="font-semibold text-slate-700"><div className="flex items-center gap-2"><BarChart3 className="h-4 w-4" /> Margem</div></TableHead>
                      <TableHead className="font-semibold text-slate-700 hidden lg:table-cell"><div className="flex items-center gap-2"><ShoppingCart className="h-4 w-4" /> Qtd Vendida</div></TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {profitByProductSorted.length === 0 ? (
                      <TableRow>
                        <TableCell colSpan={7} className="text-center py-12">
                          <div className="flex flex-col items-center gap-3">
                            <Package className="w-12 h-12 text-slate-300" />
                            <div className="text-slate-500">
                              <p className="font-medium">Nenhum produto com movimentações encontrado</p>
                              <p className="text-sm">Registre compras e vendas para ver o lucro por produto</p>
                            </div>
                          </div>
                        </TableCell>
                      </TableRow>
                    ) : (
                      profitByProductSorted.map((item) => {
                        // Calcular margem de contribuição em porcentagem
                        // Fórmula: (Lucro / Total de Venda) × 100
                        // Exemplo: Se Lucro = 77,671 e Total Venda = 360,00
                        // Margem = (77,671 / 360,00) × 100 = 21,57%
                        const margemContribuicao = calcularMargemContribuicao(item.lucro, item.totalVenda);
                        const margemFormatada = formatarMargemPercentual(margemContribuicao);
                        
                        return (
                          <TableRow key={item.productId} className="hover:bg-slate-50 transition-colors">
                            <TableCell>
                              <div className="font-medium text-slate-900 text-sm">{item.productName}</div>
                            </TableCell>
                            <TableCell className="hidden md:table-cell">
                              <span className="text-sm text-slate-600">{item.productSku || '—'}</span>
                            </TableCell>
                            <TableCell>
                              <span className="font-semibold text-blue-600 text-sm">
                                R$ {item.totalCompra.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
                              </span>
                            </TableCell>
                            <TableCell>
                              <span className="font-semibold text-orange-600 text-sm">
                                R$ {item.totalVenda.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
                              </span>
                            </TableCell>
                            <TableCell>
                              <span className={`font-bold text-sm ${item.lucro >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                                {item.lucro >= 0 ? '+' : ''}R$ {item.lucro.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
                              </span>
                            </TableCell>
                            <TableCell>
                              <span className={`font-bold text-sm ${margemContribuicao >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                                {margemFormatada}
                              </span>
                            </TableCell>
                            <TableCell className="hidden lg:table-cell">
                              <span className="font-semibold text-slate-900">{item.quantidadeVendida}</span>
                            </TableCell>
                          </TableRow>
                        );
                      })
                    )}
                  </TableBody>
                </Table>
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* ABA 3: CONTAS A PAGAR */}
        <TabsContent value="contas-pagar" className="space-y-6">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between">
              <CardTitle className="flex items-center gap-2">
                <ArrowDownCircle className="h-5 w-5 text-red-600" />
                Contas a Pagar
              </CardTitle>
              <Button onClick={() => {
                setContaPagarEditando(null);
                setFornecedorSearchTerm('');
                setShowFornecedorDropdown(false);
                setFormContaPagar(createInitialFormContaPagar());
                setShowDialogContaPagar(true);
              }}>
                <ArrowDownCircle className="h-4 w-4 mr-2" />
                Nova Conta
              </Button>
            </CardHeader>
            <CardContent className="space-y-6">
              {/* Resumo rápido */}
              <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-4">
                <Card className="border border-slate-200 shadow-sm bg-gradient-to-br from-slate-50 to-white">
                  <CardContent className="p-4 flex items-start gap-3">
                    <div className="p-2 rounded-lg bg-slate-200/80 text-slate-700">
                      <DollarSign className="h-5 w-5" />
                    </div>
                    <div>
                      <p className="text-xs font-semibold uppercase text-slate-500">Total geral</p>
                      <p className="text-xl font-bold text-slate-900">{formatarMoeda(totaisContasPagar.totalGeral)}</p>
                      <p className="text-xs text-slate-500 mt-1">Somatório das despesas</p>
                    </div>
                  </CardContent>
                </Card>

                <Card className="border border-green-200 shadow-sm bg-gradient-to-br from-green-50 to-white">
                  <CardContent className="p-4 flex items-start gap-3">
                    <div className="p-2 rounded-lg bg-green-100 text-green-600">
                      <CheckCircle className="h-5 w-5" />
                    </div>
                    <div>
                      <p className="text-xs font-semibold uppercase text-green-600">Total pago</p>
                      <p className="text-xl font-bold text-green-700">{formatarMoeda(totaisContasPagar.totalPago)}</p>
                      <p className="text-xs text-green-600/80 mt-1">Quitado até o momento</p>
                    </div>
                  </CardContent>
                </Card>

                <Card className="border border-amber-200 shadow-sm bg-gradient-to-br from-amber-50 to-white">
                  <CardContent className="p-4 flex items-start gap-3">
                    <div className="p-2 rounded-lg bg-amber-100 text-amber-600">
                      <AlertTriangle className="h-5 w-5" />
                    </div>
                    <div>
                      <p className="text-xs font-semibold uppercase text-amber-600">Total pendente</p>
                      <p className="text-xl font-bold text-amber-700">{formatarMoeda(totaisContasPagar.totalPendente)}</p>
                      <p className="text-xs text-amber-600/80 mt-1">A pagar nos próximos períodos</p>
                    </div>
                  </CardContent>
                </Card>

                <Card className="border border-blue-200 shadow-sm bg-gradient-to-br from-blue-50 to-white">
                  <CardContent className="p-4 flex items-start gap-3">
                    <div className="p-2 rounded-lg bg-blue-100 text-blue-600">
                      <CalendarIcon className="h-5 w-5" />
                    </div>
                    <div className="space-y-1">
                      <p className="text-xs font-semibold uppercase text-blue-600">Próximo vencimento</p>
                      {proximaContaPagar ? (
                        <>
                          <p className="text-sm font-semibold text-blue-800 leading-tight">
                            {proximaContaPagar.descricao || 'Conta sem descrição'}
                          </p>
                          <p className="text-xs text-blue-600/80">
                            {proximaContaPagar.vencimento.toLocaleDateString('pt-BR')}
                            {proximaContaPagar.fornecedor ? ` • ${proximaContaPagar.fornecedor}` : ''}
                          </p>
                        </>
                      ) : (
                        <p className="text-sm text-blue-700">Nenhum vencimento pendente</p>
                      )}
                    </div>
                  </CardContent>
                </Card>
              </div>

              {/* Filtros */}
              <Card className="border border-slate-200 shadow-sm">
                <CardContent className="space-y-4 p-4">
                  <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
                    <div>
                      <h3 className="flex items-center gap-2 text-base font-semibold text-slate-800">
                        <Filter className="w-5 h-5 text-slate-600" />
                        Refinar resultados
                      </h3>
                      <p className="text-xs text-slate-500">Selecione os filtros para encontrar uma conta específica</p>
                    </div>
                    <Button variant="outline" size="sm" onClick={limparFiltrosContasPagar}>
                      <RotateCcw className="mr-2 h-4 w-4" />
                      Limpar filtros
                    </Button>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-4 gap-4">
                    <div className="flex flex-col gap-2">
                      <Label className="text-xs font-medium text-slate-600 uppercase tracking-wide">Fornecedor</Label>
                      <Select value={filtroFornecedor} onValueChange={setFiltroFornecedor}>
                        <SelectTrigger className="bg-white border-slate-300">
                          <SelectValue placeholder="Selecione o fornecedor" />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="todos">Todos os fornecedores</SelectItem>
                          {fornecedoresUnicos.map(fornecedor => (
                            <SelectItem key={fornecedor} value={fornecedor}>
                              {formatarNomeFornecedor(fornecedor)}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>

                    <div className="flex flex-col gap-2">
                      <Label className="text-xs font-medium text-slate-600 uppercase tracking-wide">Forma de pagamento</Label>
                      <Select value={filtroFormaPagamento} onValueChange={setFiltroFormaPagamento}>
                        <SelectTrigger className="bg-white border-slate-300">
                          <SelectValue placeholder="Selecione a forma de pagamento" />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="todos">Todas as formas</SelectItem>
                          <SelectItem value="cartao">Cartão</SelectItem>
                          <SelectItem value="boleto">Boleto</SelectItem>
                          <SelectItem value="transferencia">Transferência</SelectItem>
                          <SelectItem value="pix">PIX</SelectItem>
                          <SelectItem value="parcelado">Parcelado</SelectItem>
                          <SelectItem value="dinheiro">Dinheiro</SelectItem>
                          <SelectItem value="cheque">Cheque</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>

                    <div className="flex flex-col gap-2">
                      <Label className="text-xs font-medium text-slate-600 uppercase tracking-wide">Status</Label>
                      <Select value={filtroStatus} onValueChange={setFiltroStatus}>
                        <SelectTrigger className="bg-white border-slate-300">
                          <SelectValue placeholder="Selecione o status" />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="todos">Todos os status</SelectItem>
                          <SelectItem value="pendente">Pendente</SelectItem>
                          <SelectItem value="pago">Pago</SelectItem>
                          <SelectItem value="vencido">Vencido</SelectItem>
                          <SelectItem value="finalizado">Finalizado</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>

                    <div className="flex flex-col gap-2">
                      <Label className="text-xs font-medium text-slate-600 uppercase tracking-wide">Período</Label>
                      <Select value={filtroPeriodo} onValueChange={setFiltroPeriodo}>
                        <SelectTrigger className="bg-white border-slate-300">
                          <SelectValue placeholder="Selecione o período" />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="todos">Todos os períodos</SelectItem>
                          <SelectItem value="mes">Este mês</SelectItem>
                          <SelectItem value="ano">Este ano</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                  </div>
                </CardContent>
              </Card>

              {/* Tabela de Contas a Pagar */}
              {loadingContas ? (
                <div className="text-center py-8">Carregando...</div>
              ) : contasPagarFiltradas.length === 0 ? (
                <div className="text-center py-8 text-gray-500">
                  <ArrowDownCircle className="h-12 w-12 mx-auto mb-3 text-gray-300" />
                  <p>Nenhuma conta a pagar encontrada</p>
                </div>
              ) : (
                <>
                  <div className="flex items-center gap-2 text-xs text-slate-500 mb-2">
                    <ArrowRightLeft className="h-4 w-4" />
                    <span>Os detalhes extras aparecem na coluna "Detalhes" em telas menores.</span>
                  </div>
                  {/* 👉 Container principal da tabela; agora priorizamos o ajuste fluido ao invés da rolagem horizontal */}
                  <div className="overflow-x-auto">
                    {/* 👉 Tabela adaptativa: usamos largura total e regras responsivas nas colunas para evitar scroll horizontal */}
                    <Table className="w-full">
                      <TableHeader>
                        <TableRow className="bg-slate-50">
                          <TableHead className="font-semibold">Data de Registro</TableHead>
                          <TableHead className="font-semibold">Descrição</TableHead>
                          <TableHead className="font-semibold hidden lg:table-cell">Fornecedor</TableHead>
                          <TableHead className="font-semibold hidden xl:table-cell">Forma de Pagamento</TableHead>
                          <TableHead className="font-semibold text-right">Valor Total</TableHead>
                          <TableHead className="font-semibold hidden md:table-cell">Vencimento</TableHead>
                          <TableHead className="font-semibold hidden xl:table-cell">Pagamento / Parcelas</TableHead>
                          <TableHead className="font-semibold lg:hidden">Detalhes</TableHead>
                          <TableHead className="font-semibold">Status</TableHead>
                          <TableHead className="font-semibold text-right">Ações</TableHead>
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        {contasPagarFiltradas.map(conta => {
                          const parcelasDetalhes = conta.parcelasDetalhes || [];
                          const proximaParcela = parcelasDetalhes.length > 0
                            ? parcelasDetalhes.find(p => p.status === 'pendente')
                            : null;
                          const vencimento = proximaParcela ? proximaParcela.data_vencimento : conta.data_vencimento;
                          const parcelasPendentes = parcelasDetalhes.filter(p => p.status === 'pendente').length;
                          const parcelasPagas = parcelasDetalhes.filter(p => p.status === 'pago').length;

                          const valorTotal = Number(conta.valor_total ?? conta.valor ?? 0);
                          const valorPago = Number(conta.valor_pago ?? 0);
                          const valorRestanteCalculado = valorTotal - valorPago;
                          const valorRestante = Math.max(conta.valor_restante ?? valorRestanteCalculado, 0);
                          const exibindoRestante = valorRestante >= 0 && valorRestante < valorTotal;

                          
                          return (
                            <TableRow key={conta.id} className="hover:bg-slate-50">
                              <TableCell className="text-sm">
                                {conta.data_registro.toLocaleDateString('pt-BR')}
                              </TableCell>
                              <TableCell className="align-top">
                                <div className="flex flex-col gap-1 max-w-[260px]">
                                  <span className="font-medium text-sm text-slate-800 leading-snug line-clamp-2 break-words">
                                    {formatarDescricaoCurta(conta.descricao)}
                                  </span>
                                  {conta.observacoes && (
                                    <span className="text-xs text-slate-500 leading-tight line-clamp-2 break-words">
                                      {conta.observacoes}
                                    </span>
                                  )}
                                </div>
                              </TableCell>
                              <TableCell className="hidden lg:table-cell">{formatarNomeFornecedor(conta.fornecedor)}</TableCell>
                              <TableCell className="hidden xl:table-cell">
                                <Badge variant="outline" className="text-xs">
                                  {conta.forma_pagamento === 'cartao' ? 'Cartão' :
                                   conta.forma_pagamento === 'boleto' ? 'Boleto' :
                                   conta.forma_pagamento === 'transferencia' ? 'Transferência' :
                                   conta.forma_pagamento === 'pix' ? 'PIX' :
                                   conta.forma_pagamento === 'parcelado' ? 'Parcelado' :
                                   conta.forma_pagamento === 'dinheiro' ? 'Dinheiro' :
                                   conta.forma_pagamento === 'cheque' ? 'Cheque' : '-'}
                                </Badge>
                              </TableCell>
                              <TableCell className="text-right font-semibold">
                                <div className="flex flex-col items-end gap-1">
                                  <span className={`text-base ${valorRestante > 0 ? 'text-slate-800' : 'text-emerald-700'}`}>
                                    R$ {valorRestante.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
                                  </span>
                                  <span className="text-[11px] uppercase tracking-wide text-slate-400">Restante</span>
                                  {exibindoRestante && (
                                    <div className="flex flex-col items-end gap-0.5 text-xs text-slate-500">
                                      <span>Total: R$ {valorTotal.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}</span>
                                      <span className="text-emerald-600 font-medium">Pago: R$ {valorPago.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}</span>
                                    </div>
                                  )}
                                </div>
                              </TableCell>
                              <TableCell className="text-sm hidden md:table-cell">
                                {vencimento.toLocaleDateString('pt-BR')}
                              </TableCell>
                              <TableCell className="hidden xl:table-cell">
                                {conta.numero_parcelas && conta.numero_parcelas > 1 ? (
                                  <div className="flex flex-col gap-1">
                                    <Badge 
                                      variant="outline" 
                                      className="cursor-pointer hover:bg-blue-50"
                                      onClick={() => {
                                        if (isContaDerivada(conta)) {
                                          toast.error('Esta conta veio automaticamente das movimentações. Cadastre-a manualmente para gerenciar as parcelas.');
                                          return;
                                        }
                                        setContaSelecionadaParcelas(conta);
                                        carregarParcelas(conta.id);
                                        setShowDialogParcelas(true);
                                      }}
                                    >
                                      {parcelasPagas}/{conta.numero_parcelas} parcelas
                                    </Badge>
                                    <span className="text-xs text-gray-500">
                                      {parcelasPendentes} pendente{parcelasPendentes !== 1 ? 's' : ''}
                                    </span>
                                  </div>
                                ) : (
                                  <Badge variant="outline">À vista</Badge>
                                )}
                              </TableCell>
                              {/* 👉 Bloco auxiliar exibido apenas em telas menores para mostrar detalhes ocultos nas colunas escondidas */}
                              <TableCell className="lg:hidden align-top">
                                <div className="flex flex-col gap-2 text-xs text-slate-600">
                                  <div className="flex items-center gap-2">
                                    <span className="font-semibold">Fornecedor:</span>
                                    <span>{formatarNomeFornecedor(conta.fornecedor)}</span>
                                  </div>
                                  <div className="flex items-center gap-2">
                                    <span className="font-semibold">Forma:</span>
                                    <span>
                                      {conta.forma_pagamento === 'cartao' ? 'Cartão' :
                                       conta.forma_pagamento === 'boleto' ? 'Boleto' :
                                       conta.forma_pagamento === 'transferencia' ? 'Transferência' :
                                       conta.forma_pagamento === 'pix' ? 'PIX' :
                                       conta.forma_pagamento === 'parcelado' ? 'Parcelado' :
                                       conta.forma_pagamento === 'dinheiro' ? 'Dinheiro' :
                                       conta.forma_pagamento === 'cheque' ? 'Cheque' : '-'}
                                    </span>
                                  </div>
                                  <div className="flex items-center gap-2">
                                    <span className="font-semibold">Vencimento:</span>
                                    <span>{vencimento.toLocaleDateString('pt-BR')}</span>
                                  </div>
                                  {conta.numero_parcelas && conta.numero_parcelas > 1 ? (
                                    <div className="flex flex-col gap-1">
                                      <div className="flex items-center gap-2">
                                        <span className="font-semibold">Parcelas:</span>
                                        <Badge 
                                          variant="outline" 
                                          className="text-xs"
                                          onClick={() => {
                                            if (isContaDerivada(conta)) {
                                              toast.error('Esta conta veio automaticamente das movimentações. Cadastre-a manualmente para gerenciar as parcelas.');
                                              return;
                                            }
                                            setContaSelecionadaParcelas(conta);
                                            carregarParcelas(conta.id);
                                            setShowDialogParcelas(true);
                                          }}
                                        >
                                          {parcelasPagas}/{conta.numero_parcelas}
                                        </Badge>
                                      </div>
                                      <span className="text-gray-500">{parcelasPendentes} pendente{parcelasPendentes !== 1 ? 's' : ''}</span>
                                    </div>
                                  ) : (
                                    <span className="font-semibold">Pagamento: À vista</span>
                                  )}
                                </div>
                              </TableCell>
                              <TableCell>
                                <Badge className={
                                  conta.status === 'finalizado' || conta.status === 'pago' ? 'bg-green-100 text-green-800' :
                                  conta.status === 'vencido' ? 'bg-red-100 text-red-800' :
                                  'bg-yellow-100 text-yellow-800'
                                }>
                                  {conta.status === 'finalizado' ? 'Finalizado' :
                                   conta.status === 'pago' ? 'Pago' :
                                   conta.status === 'vencido' ? 'Vencido' : 'Pendente'}
                                </Badge>
                              </TableCell>
                              <TableCell className="text-right">
                                <div className="flex gap-2 justify-end">
                                  {conta.status !== 'finalizado' && conta.status !== 'pago' && (
                                    <Button
                                      size="sm"
                                      variant="outline"
                                      className="bg-green-50 hover:bg-green-100 text-green-700 border-green-300"
                                      onClick={() => {
                                        setContaParaFinalizar(conta);
                                        setDataPagamentoFinal(new Date());
                                        setOrigemPagamentoFinal('caixa'); // Reset para padrão
                                        setShowDialogFinalizarPagamento(true);
                                      }}
                                    >
                                      <CheckCircle className="h-4 w-4 mr-1" />
                                      Finalizar
                                    </Button>
                                  )}
                                  <Button
                                    size="sm"
                                    variant="destructive"
                                    onClick={() => deletarContaPagar(conta.id)}
                                  >
                                    Excluir
                                  </Button>
                                </div>
                              </TableCell>
                            </TableRow>
                          );
                        })}
                      </TableBody>
                    </Table>
                  </div>

                  {/* Totais no Rodapé */}
                </>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        {/* ABA 4: CONTAS A RECEBER */}
        <TabsContent value="contas-receber" className="space-y-6">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between">
              <CardTitle className="flex items-center gap-2">
                <ArrowUpCircle className="h-5 w-5 text-green-600" />
                Contas a Receber
              </CardTitle>
              <Button onClick={() => {
                setContaReceberEditando(null);
                setClienteSearchTerm('');
                setShowClienteDropdown(false);
                setFormContaReceber(createInitialFormContaReceber());
                setShowDialogContaReceber(true);
              }}>
                <ArrowUpCircle className="h-4 w-4 mr-2" />
                Nova Conta
              </Button>
            </CardHeader>
            <CardContent>
              {loadingContas ? (
                <div className="text-center py-8">Carregando...</div>
              ) : contasReceber.length === 0 ? (
                <div className="text-center py-8 text-gray-500">
                  <ArrowUpCircle className="h-12 w-12 mx-auto mb-3 text-gray-300" />
                  <p>Nenhuma conta a receber cadastrada</p>
                </div>
              ) : (
                <>
                  <div className="flex items-center gap-2 text-xs text-slate-500 mb-2">
                    <ArrowRightLeft className="h-4 w-4" />
                    <span>Arraste para o lado para visualizar todas as colunas</span>
                  </div>
                  <div className="overflow-x-auto">
                    {/* Tabela de contas a receber com rolagem horizontal para evitar corte das colunas */}
                    <Table className="min-w-[720px]">
                    <TableHeader>
                      <TableRow>
                        <TableHead>Descrição</TableHead>
                        <TableHead>Cliente</TableHead>
                        <TableHead>Vencimento</TableHead>
                        <TableHead className="text-right">Valor</TableHead>
                        <TableHead>Status</TableHead>
                        <TableHead className="text-right">Ações</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {contasReceber.map(conta => (
                        <TableRow key={conta.id}>
                          <TableCell className="align-top">
                            <div className="flex flex-col gap-1 max-w-[260px]">
                              <span className="font-medium text-sm text-slate-800 leading-snug line-clamp-2 break-words">
                                {formatarDescricaoCurta(conta.descricao)}
                              </span>
                              {conta.observacoes && (
                                <span className="text-xs text-slate-500 leading-tight line-clamp-2 break-words">
                                  {conta.observacoes}
                                </span>
                              )}
                            </div>
                          </TableCell>
                          <TableCell>{conta.cliente || '-'}</TableCell>
                          <TableCell>{conta.data_vencimento.toLocaleDateString('pt-BR')}</TableCell>
                          <TableCell className="text-right font-semibold">
                            R$ {(conta.valor_total ?? conta.valor ?? 0).toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
                          </TableCell>
                          <TableCell>
                            <Badge className={
                              conta.status === 'pago' ? 'bg-green-100 text-green-800' :
                              conta.status === 'vencido' ? 'bg-red-100 text-red-800' :
                              'bg-yellow-100 text-yellow-800'
                            }>
                              {conta.status === 'pago' ? 'Recebido' : conta.status === 'vencido' ? 'Vencido' : 'Pendente'}
                            </Badge>
                          </TableCell>
                          <TableCell className="text-right">
                            <div className="flex gap-2 justify-end">
                              {conta.status !== 'pago' && (
                                <Button
                                  size="sm"
                                  variant="outline"
                                  onClick={() => marcarContaComoRecebida(conta)}
                                >
                                  Marcar como Recebida
                                </Button>
                              )}
                              <Button
                                size="sm"
                                variant="outline"
                                onClick={() => {
                                  setContaReceberEditando(conta);
                                  setClienteSearchTerm(conta.cliente || '');
                                  setShowClienteDropdown(false);
                                  setFormContaReceber(prev => ({
                                    ...prev,
                                    lancamento: conta.lancamento,
                                    observacoes: conta.observacoes || conta.descricao || '',
                                    forma_recebimento: conta.forma_recebimento || '' as FormaPagamento | '',
                                    conta_destino: conta.conta_destino || 'caixa',
                                    centro_custo: conta.centro_custo || conta.categoria_dre || '',
                                    cliente: conta.cliente || '',
                                    valor_total: conta.valor_total ?? conta.valor ?? 0,
                                    parcelas: conta.parcelas || conta.numero_parcelas || 1,
                                    data_vencimento: conta.data_vencimento,
                                    descricao: conta.descricao || '',
                                    valor: conta.valor_total ?? conta.valor ?? 0,
                                    categoria_dre: (conta.centro_custo || conta.categoria_dre || '') as DRECategory | '',
                                    movimento_id: conta.movimento_id || ''
                                  }));
                                  setShowDialogContaReceber(true);
                                }}
                              >
                                Editar
                              </Button>
                              <Button
                                size="sm"
                                variant="destructive"
                                onClick={() => deletarContaReceber(conta.id)}
                              >
                                Excluir
                              </Button>
                            </div>
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                    </Table>
                  </div>
                </>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        {/* ABA 5: DRE */}
        <TabsContent value="dre" className="space-y-6">
          <Card>
            <CardHeader>
              <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
                <CardTitle className="flex items-center gap-2">
                  <BarChart3 className="h-5 w-5 text-blue-600" />
                  Demonstração do Resultado do Exercício (DRE)
                </CardTitle>
                <Button onClick={exportarDREPDF} className="bg-red-600 hover:bg-red-700 text-white">
                  <FileText className="h-4 w-4 mr-2" />
                  Exportar DRE em PDF
                </Button>
              </div>
            </CardHeader>
            <CardContent className="space-y-6">
              {/* Seleção de Período */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <Label>Data Início</Label>
                  <Popover>
                    <PopoverTrigger asChild>
                      <Button variant="outline" className="w-full justify-start text-left font-normal">
                        <CalendarIcon className="mr-2 h-4 w-4" />
                        {drePeriodoInicio ? format(drePeriodoInicio, "PPP", { locale: ptBR }) : "Selecione"}
                      </Button>
                    </PopoverTrigger>
                    <PopoverContent className="w-auto p-0">
                      <CalendarComponent
                        mode="single"
                        selected={drePeriodoInicio}
                        onSelect={(date) => date && setDrePeriodoInicio(date)}
                        initialFocus
                      />
                    </PopoverContent>
                  </Popover>
                </div>
                <div>
                  <Label>Data Fim</Label>
                  <Popover>
                    <PopoverTrigger asChild>
                      <Button variant="outline" className="w-full justify-start text-left font-normal">
                        <CalendarIcon className="mr-2 h-4 w-4" />
                        {drePeriodoFim ? format(drePeriodoFim, "PPP", { locale: ptBR }) : "Selecione"}
                      </Button>
                    </PopoverTrigger>
                    <PopoverContent className="w-auto p-0">
                      <CalendarComponent
                        mode="single"
                        selected={drePeriodoFim}
                        onSelect={(date) => date && setDrePeriodoFim(date)}
                        initialFocus
                      />
                    </PopoverContent>
                  </Popover>
                </div>
              </div>

              {/* DRE Calculado */}
              {(() => {
                const dre = calcularDREAtual();
                return (
                  <div className="space-y-4">
                    <Table>
                      <TableHeader>
                        <TableRow>
                          <TableHead className="w-[70%]">Descrição</TableHead>
                          <TableHead className="text-right">Valor</TableHead>
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        <TableRow className="bg-blue-50 font-bold">
                          <TableCell>RECEITAS OPERACIONAIS</TableCell>
                          <TableCell></TableCell>
                        </TableRow>
                        <TableRow>
                          <TableCell className="pl-8">Receita Operacional Bruta</TableCell>
                          <TableCell className="text-right">{formatarMoeda(dre.receita_operacional_bruta)}</TableCell>
                        </TableRow>
                        <TableRow>
                          <TableCell className="pl-8">(-) Deduções de Vendas</TableCell>
                          <TableCell className="text-right">{formatarMoeda(dre.deducoes_vendas)}</TableCell>
                        </TableRow>
                        <TableRow className="bg-blue-100 font-bold">
                          <TableCell>Receita Operacional Líquida</TableCell>
                          <TableCell className="text-right">{formatarMoeda(dre.receita_operacional_liquida)}</TableCell>
                        </TableRow>
                        <TableRow className="bg-red-50 font-bold">
                          <TableCell>CUSTOS</TableCell>
                          <TableCell></TableCell>
                        </TableRow>
                        <TableRow>
                          <TableCell className="pl-8">(-) Custo do Produto Vendido</TableCell>
                          <TableCell className="text-right">{formatarMoeda(dre.custo_produto_vendido)}</TableCell>
                        </TableRow>
                        <TableRow className="bg-green-100 font-bold">
                          <TableCell>Lucro Bruto</TableCell>
                          <TableCell className={`text-right ${dre.lucro_bruto >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                            {formatarMoeda(dre.lucro_bruto)}
                          </TableCell>
                        </TableRow>
                        <TableRow className="bg-orange-50 font-bold">
                          <TableCell>DESPESAS OPERACIONAIS</TableCell>
                          <TableCell></TableCell>
                        </TableRow>
                        <TableRow>
                          <TableCell className="pl-8">(-) Despesas Administrativas</TableCell>
                          <TableCell className="text-right">{formatarMoeda(dre.despesas_operacionais.administrativas)}</TableCell>
                        </TableRow>
                        <TableRow>
                          <TableCell className="pl-8">(-) Despesas Comerciais</TableCell>
                          <TableCell className="text-right">{formatarMoeda(dre.despesas_operacionais.comerciais)}</TableCell>
                        </TableRow>
                        <TableRow>
                          <TableCell className="pl-8">(-) Despesas Financeiras</TableCell>
                          <TableCell className="text-right">{formatarMoeda(dre.despesas_operacionais.financeiras)}</TableCell>
                        </TableRow>
                        <TableRow>
                          <TableCell className="pl-8">(-) Outras Despesas Operacionais</TableCell>
                          <TableCell className="text-right">{formatarMoeda(dre.despesas_operacionais.outras)}</TableCell>
                        </TableRow>
                        <TableRow className="bg-orange-100 font-bold">
                          <TableCell>Total de Despesas Operacionais</TableCell>
                          <TableCell className="text-right">{formatarMoeda(dre.despesas_operacionais.total)}</TableCell>
                        </TableRow>
                        <TableRow className="bg-purple-100 font-bold">
                          <TableCell>Resultado Operacional</TableCell>
                          <TableCell className={`text-right ${dre.resultado_operacional >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                            {formatarMoeda(dre.resultado_operacional)}
                          </TableCell>
                        </TableRow>
                        <TableRow className="bg-yellow-50 font-bold">
                          <TableCell>RESULTADO FINANCEIRO</TableCell>
                          <TableCell></TableCell>
                        </TableRow>
                        <TableRow>
                          <TableCell className="pl-8">(+) Receitas Financeiras</TableCell>
                          <TableCell className="text-right">{formatarMoeda(dre.receitas_financeiras)}</TableCell>
                        </TableRow>
                        <TableRow>
                          <TableCell className="pl-8">(-) Despesas Financeiras</TableCell>
                          <TableCell className="text-right">{formatarMoeda(dre.despesas_financeiras)}</TableCell>
                        </TableRow>
                        <TableRow className="bg-yellow-100 font-bold">
                          <TableCell>Resultado Financeiro</TableCell>
                          <TableCell className={`text-right ${dre.resultado_financeiro >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                            {formatarMoeda(dre.resultado_financeiro)}
                          </TableCell>
                        </TableRow>
                        <TableRow className="bg-gray-50 font-bold">
                          <TableCell>OUTRAS RECEITAS E DESPESAS</TableCell>
                          <TableCell></TableCell>
                        </TableRow>
                        <TableRow>
                          <TableCell className="pl-8">(+) Outras Receitas</TableCell>
                          <TableCell className="text-right">{formatarMoeda(dre.outras_receitas)}</TableCell>
                        </TableRow>
                        <TableRow>
                          <TableCell className="pl-8">(-) Outras Despesas</TableCell>
                          <TableCell className="text-right">{formatarMoeda(dre.outras_despesas)}</TableCell>
                        </TableRow>
                        <TableRow className="bg-gray-100 font-bold">
                          <TableCell>Resultado Antes do Imposto</TableCell>
                          <TableCell className={`text-right ${dre.resultado_antes_imposto >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                            {formatarMoeda(dre.resultado_antes_imposto)}
                          </TableCell>
                        </TableRow>
                        <TableRow>
                          <TableCell className="pl-8">(-) Impostos</TableCell>
                          <TableCell className="text-right">{formatarMoeda(dre.impostos)}</TableCell>
                        </TableRow>
                        <TableRow className={`font-bold text-lg ${dre.resultado_liquido >= 0 ? 'bg-green-100 text-green-700' : 'bg-red-100 text-red-700'}`}>
                          <TableCell>RESULTADO LÍQUIDO DO EXERCÍCIO</TableCell>
                          <TableCell className="text-right">
                            {formatarMoeda(dre.resultado_liquido)}
                          </TableCell>
                        </TableRow>
                      </TableBody>
                    </Table>
                  </div>
                );
              })()}
            </CardContent>
          </Card>
        </TabsContent>

        {/* ABA 6: MOVIMENTAÇÕES */}
        <TabsContent value="caixa-banco" className="space-y-6">
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
                        Total Caixa
                      </CardTitle>
                      <CardDescription className={saldoCaixa >= 0 ? 'text-blue-700' : 'text-red-700'}>
                        Saldo do período
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
                        <div className={`text-xs mt-3 space-y-1 ${
                          saldoCaixa >= 0 ? 'text-blue-600' : 'text-red-600'
                        }`}>
                          <p className="font-semibold">
                            Receitas registradas: R$ {totalSaidas.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
                          </p>
                          <p className="font-semibold">
                            Recebimentos de contas: R$ {recebimentosCaixa.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
                          </p>
                          <p className="font-semibold text-red-600 dark:text-red-400">
                            Pagamentos do Caixa: R$ {pagamentosCaixa.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
                          </p>
                          <p className="font-medium">
                            {saldoCaixa >= 0 ? 'Entradas superam saídas/pagamentos' : 'Saídas e pagamentos superam entradas'}
                          </p>
                          <p className="opacity-75">
                            {saldoCaixa >= 0 
                              ? 'Fluxo de caixa positivo' 
                              : 'Atenção: fluxo negativo'}
                          </p>
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
                  saldo >= 0 
                    ? 'from-emerald-50 to-green-50 border-emerald-200' 
                    : 'from-red-50 to-rose-50 border-red-200'
                } shadow-xl border-2`}>
                  <CardHeader className="pb-4">
                    <CardTitle className={`flex items-center gap-2 text-2xl ${
                      saldo >= 0 ? 'text-emerald-900' : 'text-red-900'
                    }`}>
                      {saldo >= 0 ? (
                        <CheckCircle className="h-7 w-7 text-emerald-600" />
                      ) : (
                        <AlertTriangle className="h-7 w-7 text-red-600" />
                      )}
                      Lucro Líquido
                    </CardTitle>
                    <CardDescription className={saldo >= 0 ? 'text-emerald-700' : 'text-red-700'}>
                      Fluxo líquido: (Receitas - Custos) + Recebimentos - Pagamentos
                    </CardDescription>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-6">
                      {/* Valor Principal */}
                      <div className="text-center py-6 bg-white/60 rounded-xl border-2 border-dashed border-emerald-300">
                        <div className={`text-5xl font-black mb-2 ${
                          saldo >= 0 ? 'text-emerald-600' : 'text-red-600'
                        }`}>
                          {saldo >= 0 ? '+' : ''}R$ {Math.abs(saldo).toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
                        </div>
                        <Badge className={`text-lg px-4 py-2 ${
                          saldo >= 0 
                            ? 'bg-emerald-100 text-emerald-800 border-emerald-300' 
                            : 'bg-red-100 text-red-800 border-red-300'
                        }`}>
                          {saldo >= 0 ? 'Lucro' : 'Prejuízo'}
                        </Badge>
                      </div>

                      {/* Detalhamento */}
                      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                        <div className="bg-white/60 rounded-lg p-4 border border-emerald-200">
                          <div className="flex items-center justify-between mb-2">
                            <span className="text-sm font-medium text-emerald-700">Receitas (Vendas)</span>
                            <TrendingDown className="h-4 w-4 text-emerald-600" />
                          </div>
                          <div className="text-2xl font-bold text-emerald-700">
                            R$ {totalSaidas.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
                          </div>
                        </div>

                        <div className="bg-white/60 rounded-lg p-4 border border-red-200">
                          <div className="flex items-center justify-between mb-2">
                            <span className="text-sm font-medium text-red-700">Custos (Compras)</span>
                            <TrendingUp className="h-4 w-4 text-red-600" />
                          </div>
                          <div className="text-2xl font-bold text-red-700">
                            R$ {totalEntradas.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
                          </div>
                        </div>

                        <div className="bg-white/60 rounded-lg p-4 border border-cyan-200">
                          <div className="flex items-center justify-between mb-2">
                            <span className="text-sm font-medium text-cyan-700">Recebimentos (Contas)</span>
                            <TrendingUp className="h-4 w-4 text-cyan-600 rotate-180" />
                          </div>
                          <div className="text-2xl font-bold text-cyan-700">
                            R$ {recebimentosBanco.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
                          </div>
                        </div>
                      </div>

                      {/* Pagamentos realizados pelo banco e saldo final */}
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div className="bg-white/60 rounded-lg p-4 border border-cyan-200">
                          <div className="flex items-center justify-between mb-2">
                            <span className="text-sm font-medium text-cyan-700">Pagamentos do Banco</span>
                            <ArrowRightLeft className="h-4 w-4 text-cyan-600" />
                          </div>
                          <div className="text-2xl font-bold text-cyan-700">
                            R$ {pagamentosBanco.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
                          </div>
                          <p className="text-xs text-cyan-600 mt-1 opacity-75">
                            Contas quitadas pela conta bancária
                          </p>
                        </div>

                        <div className="bg-white/60 rounded-lg p-4 border border-cyan-200">
                          <div className="flex items-center justify-between mb-2">
                            <span className="text-sm font-medium text-cyan-700">Saldo Banco</span>
                            <DollarSign className="h-4 w-4 text-cyan-600" />
                          </div>
                          <div className={`text-2xl font-bold ${
                            saldoBanco >= 0 ? 'text-emerald-700' : 'text-red-700'
                          }`}>
                            {saldoBanco >= 0 ? '+' : ''}R$ {Math.abs(saldoBanco).toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
                          </div>
                          <p className="text-xs text-cyan-600 mt-1 opacity-75">
                            Lucro Líquido - Pagamentos do Banco
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
                            saldo >= 0 ? 'text-emerald-700' : 'text-red-700'
                          }`}>
                            {((saldo / totalSaidas) * 100).toFixed(2)}%
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
                      saldo >= 0 ? 'border-emerald-300' : 'border-red-300'
                    }`}>
                      <p className="text-sm text-gray-600 mb-1">Resultado Final</p>
                      <p className={`text-2xl font-bold ${
                        saldo >= 0 ? 'text-emerald-700' : 'text-red-700'
                      }`}>
                        {saldo >= 0 ? 'Lucro' : 'Prejuízo'}
                      </p>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>

      {/* Modal de Receita (Saída) */}
      <Dialog open={showReceipt} onOpenChange={setShowReceipt}>
        <DialogContent className="max-w-md sm:max-w-lg max-h-[90vh] flex flex-col p-0 overflow-hidden !md:overflow-hidden">
          <div className="overflow-y-auto flex-1 px-6 pt-6 pb-6 min-h-0">
            <DialogHeader className="pb-4 border-b">
              <DialogTitle className="flex items-center gap-2 text-green-600">
                <CheckCircle className="h-6 w-6" />
                Detalhes da Receita
              </DialogTitle>
            </DialogHeader>
            
            {selectedMovement && (
              <div className="space-y-4 pt-4">
              {/* Cabeçalho da Receita */}
              <div className="border-b pb-4">
                <div className="text-center mb-3">
                  <h2 className="text-2xl font-bold text-gray-900">RECEITA</h2>
                  <p className="text-sm text-gray-600">Flexi Gestor - Sistema de Gestão</p>
                </div>
                
                <div className="space-y-1 text-sm">
                  {selectedMovement.receiptNumber && (
                    <div className="flex justify-between bg-indigo-50 p-2 rounded-lg border border-indigo-200">
                      <span className="text-indigo-700 font-semibold">Nº Receita:</span>
                      <span className="font-bold text-indigo-900">{selectedMovement.receiptNumber}</span>
                    </div>
                  )}
                  <div className="flex justify-between">
                    <span className="text-gray-600">Data/Hora:</span>
                    <span className="font-semibold">
                      {new Date(selectedMovement.date).toLocaleString('pt-BR')}
                    </span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-600">Tipo:</span>
                    <span className="font-semibold">Venda PDV</span>
                  </div>
                  {selectedMovement.paymentMethod && (
                    <div className="flex justify-between">
                      <span className="text-gray-600">Pagamento:</span>
                      <span className="font-semibold">
                        {selectedMovement.paymentMethod.startsWith('parcelado-') ? selectedMovement.paymentMethod.replace('parcelado-', '') : selectedMovement.paymentMethod}
                      </span>
                    </div>
                  )}
                </div>
              </div>

              {/* Produto */}
              <div className="space-y-2">
                <h3 className="font-semibold text-gray-900">Produto:</h3>
                <div className="border rounded-lg p-3">
                  <div className="flex justify-between items-start pb-2">
                    <div className="flex-1">
                      <p className="font-medium text-sm">{selectedMovement.productName}</p>
                      <p className="text-xs text-gray-500">
                        {selectedMovement.quantity} x R$ {selectedMovement.unitPrice.toFixed(2)}
                      </p>
                    </div>
                    <p className="font-semibold text-sm">
                      R$ {selectedMovement.total.toFixed(2)}
                    </p>
                  </div>
                </div>
              </div>

              {/* Descrição */}
              {selectedMovement.description && (
                <div className="space-y-2">
                  <h3 className="font-semibold text-gray-900">Observações:</h3>
                  <div className="border rounded-lg p-3 bg-gray-50">
                    <p className="text-sm text-gray-700">{selectedMovement.description}</p>
                  </div>
                </div>
              )}

              {/* Total */}
              <div className="border-t pt-4">
                <div className="flex justify-between items-center">
                  <span className="text-lg font-bold text-gray-900">TOTAL:</span>
                  <span className="text-2xl font-bold text-green-600">
                    R$ {selectedMovement.total.toFixed(2)}
                  </span>
                </div>
              </div>

              {/* Botões de Ação */}
              <div className="space-y-2 pt-2">
                <Button 
                  className="w-full bg-green-600 hover:bg-green-700 text-white"
                  onClick={() => downloadReceipt(selectedMovement)}
                >
                  <Share2 className="mr-2 h-4 w-4" />
                  Compartilhar Receita
                </Button>

                {!isMobile && (
                  <Button 
                    className="w-full bg-blue-600 hover:bg-blue-700 text-white"
                    onClick={() => window.print()}
                  >
                    <Printer className="mr-2 h-4 w-4" />
                    Imprimir Receita
                  </Button>
                )}
                
                <Button 
                  variant="outline" 
                  className="w-full"
                  onClick={() => setShowReceipt(false)}
                >
                  Fechar
                </Button>
              </div>

              {/* Rodapé */}
              <div className="text-center text-xs text-gray-500 pt-2 border-t">
                <p>Obrigado pela preferência!</p>
                <p className="mt-1">💚 Flexi Gestor - Gestão Inteligente</p>
              </div>
            </div>
            )}
          </div>
        </DialogContent>
      </Dialog>

      {/* Modal de Compra (Entrada) */}
      <Dialog open={showPurchase} onOpenChange={setShowPurchase}>
        <DialogContent className="max-w-md sm:max-w-lg max-h-[90vh] flex flex-col p-0 overflow-hidden !md:overflow-hidden">
          <div className="overflow-y-auto flex-1 px-6 pt-6 pb-6 min-h-0">
            <DialogHeader className="pb-4 border-b">
              <DialogTitle className="flex items-center gap-2 text-blue-600">
                <CheckCircle className="h-6 w-6" />
                Comprovante de Compra
              </DialogTitle>
            </DialogHeader>
            
            {selectedMovement && (
              <div className="space-y-4 pt-4">
              {/* Cabeçalho do Comprovante */}
              <div className="border-b pb-4">
                <div className="text-center mb-3">
                  <h2 className="text-2xl font-bold text-gray-900">🛒 NOTA DE COMPRA</h2>
                  <p className="text-sm text-gray-600">Flexi Gestor - Sistema de Gestão</p>
                </div>
                
                <div className="space-y-1 text-sm">
                  {selectedMovement.receiptNumber && (
                    <div className="flex justify-between bg-blue-50 p-2 rounded-lg border border-blue-200">
                      <span className="text-blue-700 font-semibold">Nº NF Compra:</span>
                      <span className="font-bold text-blue-900">{selectedMovement.receiptNumber}</span>
                    </div>
                  )}
                  <div className="flex justify-between">
                    <span className="text-gray-600">Data/Hora:</span>
                    <span className="font-semibold">
                      {new Date(selectedMovement.date).toLocaleString('pt-BR')}
                    </span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-600">Tipo:</span>
                    <span className="font-semibold">Compra de Estoque</span>
                  </div>
                </div>
              </div>

              {/* Produto */}
              <div className="space-y-2">
                <h3 className="font-semibold text-gray-900">Produto Adquirido:</h3>
                <div className="border rounded-lg p-3 bg-blue-50">
                  <div className="flex justify-between items-start pb-2">
                    <div className="flex-1">
                      <p className="font-medium text-sm">{selectedMovement.productName}</p>
                      <p className="text-xs text-gray-500">
                        {selectedMovement.quantity} unidades x R$ {selectedMovement.unitPrice.toFixed(2)}
                      </p>
                    </div>
                    <p className="font-semibold text-sm">
                      R$ {selectedMovement.total.toFixed(2)}
                    </p>
                  </div>
                </div>
              </div>

              {/* Descrição */}
              {selectedMovement.description && (
                <div className="space-y-2">
                  <h3 className="font-semibold text-gray-900">Observações:</h3>
                  <div className="border rounded-lg p-3 bg-gray-50">
                    <p className="text-sm text-gray-700">{selectedMovement.description}</p>
                  </div>
                </div>
              )}

              {/* Total Pago */}
              <div className="border-t pt-4">
                <div className="flex justify-between items-center">
                  <span className="text-lg font-bold text-gray-900">TOTAL PAGO:</span>
                  <span className="text-2xl font-bold text-blue-600">
                    R$ {selectedMovement.total.toFixed(2)}
                  </span>
                </div>
              </div>

              {/* Botões de Ação */}
              <div className="space-y-2 pt-2">
                <Button 
                  className="w-full bg-blue-600 hover:bg-blue-700 text-white"
                  onClick={() => downloadPurchase(selectedMovement)}
                >
                  <Share2 className="mr-2 h-4 w-4" />
                  Compartilhar Comprovante
                </Button>

                {!isMobile && (
                  <Button 
                    className="w-full bg-green-600 hover:bg-green-700 text-white"
                    onClick={() => window.print()}
                  >
                    <Printer className="mr-2 h-4 w-4" />
                    Imprimir Comprovante
                  </Button>
                )}
                
                <Button 
                  variant="outline" 
                  className="w-full"
                  onClick={() => setShowPurchase(false)}
                >
                  Fechar
                </Button>
              </div>

              {/* Rodapé */}
              <div className="text-center text-xs text-gray-500 pt-2 border-t">
                <p>Compra registrada com sucesso!</p>
                <p className="mt-1">Flexi Gestor - Controle de Estoque</p>
              </div>
            </div>
            )}
          </div>
        </DialogContent>
      </Dialog>

      {/* Modal de Conta a Pagar */}
      <Dialog open={showDialogContaPagar} onOpenChange={(open) => {
        setShowDialogContaPagar(open);
        if (!open) {
          setContaPagarEditando(null);
          setFornecedorSearchTerm('');
          setShowFornecedorDropdown(false);
        }
      }}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>
              {contaPagarEditando ? 'Editar Conta a Pagar' : 'Nova Conta a Pagar'}
            </DialogTitle>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div>
              <Label htmlFor="descricao-pagar">Descrição *</Label>
              <Input
                id="descricao-pagar"
                value={formContaPagar.descricao}
                onChange={(e) => setFormContaPagar({ ...formContaPagar, descricao: e.target.value })}
                placeholder="Ex: Pagamento de fornecedor"
              />
            </div>
            
            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label htmlFor="data-compra-pagar">Data da Compra *</Label>
                <Popover>
                  <PopoverTrigger asChild>
                    <Button variant="outline" className="w-full justify-start text-left font-normal">
                      <CalendarIcon className="mr-2 h-4 w-4" />
                      {formContaPagar.data_compra ? format(formContaPagar.data_compra, "PPP", { locale: ptBR }) : "Selecione"}
                    </Button>
                  </PopoverTrigger>
                  <PopoverContent className="w-auto p-0">
                    <CalendarComponent
                      mode="single"
                      selected={formContaPagar.data_compra}
                      onSelect={(date) => date && setFormContaPagar({ ...formContaPagar, data_compra: date })}
                      initialFocus
                    />
                  </PopoverContent>
                </Popover>
              </div>
              
              <div>
                <Label htmlFor="data-registro-pagar">Data de Registro *</Label>
                <Popover>
                  <PopoverTrigger asChild>
                    <Button variant="outline" className="w-full justify-start text-left font-normal">
                      <CalendarIcon className="mr-2 h-4 w-4" />
                      {formContaPagar.data_registro ? format(formContaPagar.data_registro, "PPP", { locale: ptBR }) : "Selecione"}
                    </Button>
                  </PopoverTrigger>
                  <PopoverContent className="w-auto p-0">
                    <CalendarComponent
                      mode="single"
                      selected={formContaPagar.data_registro}
                      onSelect={(date) => date && setFormContaPagar({ ...formContaPagar, data_registro: date })}
                      initialFocus
                    />
                  </PopoverContent>
                </Popover>
              </div>
            </div>
            
            <div>
              <Label htmlFor="valor-pagar">Valor Total *</Label>
              <Input
                id="valor-pagar"
                type="number"
                step="0.01"
                min="0"
                value={formContaPagar.valor}
                onChange={(e) => setFormContaPagar({ ...formContaPagar, valor: parseFloat(e.target.value) || 0 })}
                placeholder="0.00"
              />
            </div>
            
            <div>
              <Label htmlFor="forma-pagamento-pagar">Forma de Pagamento *</Label>
              <Select
                value={formContaPagar.forma_pagamento}
                onValueChange={(value) => {
                  setFormContaPagar({ 
                    ...formContaPagar, 
                    forma_pagamento: value as FormaPagamento,
                    numero_parcelas: value === 'parcelado' ? formContaPagar.numero_parcelas : 1
                  });
                }}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Selecione a forma de pagamento" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="cartao">Cartão</SelectItem>
                  <SelectItem value="boleto">Boleto</SelectItem>
                  <SelectItem value="transferencia">Transferência</SelectItem>
                  <SelectItem value="pix">PIX</SelectItem>
                  <SelectItem value="parcelado">Parcelado</SelectItem>
                  <SelectItem value="dinheiro">Dinheiro</SelectItem>
                  <SelectItem value="cheque">Cheque</SelectItem>
                </SelectContent>
              </Select>
            </div>
            
            {formContaPagar.forma_pagamento === 'parcelado' && (
              <div>
                <Label htmlFor="numero-parcelas-pagar">Número de Parcelas *</Label>
                <Input
                  id="numero-parcelas-pagar"
                  type="number"
                  min="1"
                  max="24"
                  value={formContaPagar.numero_parcelas}
                  onChange={(e) => setFormContaPagar({ ...formContaPagar, numero_parcelas: parseInt(e.target.value) || 1 })}
                  placeholder="Ex: 3"
                />
                {formContaPagar.valor > 0 && formContaPagar.numero_parcelas > 0 && (
                  <p className="text-xs text-gray-500 mt-1">
                    Valor por parcela: R$ {(formContaPagar.valor / formContaPagar.numero_parcelas).toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
                  </p>
                )}
              </div>
            )}
            
            <div>
              <Label htmlFor="vencimento-pagar">Data de Vencimento *</Label>
              <Popover>
                <PopoverTrigger asChild>
                  <Button variant="outline" className="w-full justify-start text-left font-normal">
                    <CalendarIcon className="mr-2 h-4 w-4" />
                    {formContaPagar.data_vencimento ? format(formContaPagar.data_vencimento, "PPP", { locale: ptBR }) : "Selecione a data"}
                  </Button>
                </PopoverTrigger>
                <PopoverContent className="w-auto p-0">
                  <CalendarComponent
                    mode="single"
                    selected={formContaPagar.data_vencimento}
                    onSelect={(date) => date && setFormContaPagar({ ...formContaPagar, data_vencimento: date })}
                    initialFocus
                  />
                </PopoverContent>
              </Popover>
            </div>
            
            <div>
              <Label htmlFor="categoria-pagar">Categoria DRE</Label>
              <Select
                value={formContaPagar.categoria_dre}
                onValueChange={(value) => setFormContaPagar({ ...formContaPagar, categoria_dre: value as DRECategory })}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Selecione a categoria" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="custo_produto_vendido">Custo do Produto Vendido</SelectItem>
                  <SelectItem value="despesa_administrativa">Despesa Administrativa</SelectItem>
                  <SelectItem value="despesa_comercial">Despesa Comercial</SelectItem>
                  <SelectItem value="despesa_financeira">Despesa Financeira</SelectItem>
                  <SelectItem value="despesa_operacional">Despesa Operacional</SelectItem>
                  <SelectItem value="outras_despesas">Outras Despesas</SelectItem>
                </SelectContent>
              </Select>
            </div>
            
            <div>
              <Label htmlFor="fornecedor-pagar">Fornecedor</Label>
              <div className="relative" ref={fornecedorInputRef}>
                <div className="relative">
                  <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-4 w-4" />
                  <Input
                    id="fornecedor-pagar"
                    value={formContaPagar.fornecedor}
                    onChange={(e) => {
                      setFormContaPagar({ ...formContaPagar, fornecedor: e.target.value });
                      setFornecedorSearchTerm(e.target.value);
                      setShowFornecedorDropdown(true);
                    }}
                    onFocus={() => {
                      setShowFornecedorDropdown(true);
                      setFornecedorSearchTerm(formContaPagar.fornecedor);
                    }}
                    placeholder="Buscar ou digitar fornecedor"
                    className="pl-10"
                  />
                </div>
                {showFornecedorDropdown && (
                  <div className="absolute z-[100] mt-1 w-full bg-white border border-gray-200 rounded-lg shadow-lg overflow-hidden max-h-60 overflow-y-auto">
                    {fornecedoresFiltrados.length === 0 ? (
                      <div className="p-4 text-center text-sm text-gray-500">
                        {fornecedoresUnicos.length === 0 
                          ? 'Nenhum fornecedor cadastrado' 
                          : 'Nenhum fornecedor encontrado'}
                      </div>
                    ) : (
                      fornecedoresFiltrados.map((fornecedor, index) => (
                        <button
                          key={index}
                          type="button"
                          className="w-full px-4 py-2 text-left hover:bg-gray-100 focus:bg-gray-100 focus:outline-none border-b last:border-b-0 transition-colors"
                          onMouseDown={(e) => {
                            e.preventDefault(); // Prevenir que o mousedown feche o dropdown antes do onClick
                            e.stopPropagation();
                          }}
                          onClick={(e) => {
                            e.preventDefault();
                            e.stopPropagation();
                            setFormContaPagar({ ...formContaPagar, fornecedor });
                            setFornecedorSearchTerm('');
                            setShowFornecedorDropdown(false);
                          }}
                        >
                          <div className="font-medium text-sm">{fornecedor}</div>
                        </button>
                      ))
                    )}
                  </div>
                )}
              </div>
            </div>
            
            <div>
              <Label htmlFor="observacoes-pagar">Observações</Label>
              <Textarea
                id="observacoes-pagar"
                value={formContaPagar.observacoes}
                onChange={(e) => setFormContaPagar({ ...formContaPagar, observacoes: e.target.value })}
                placeholder="Observações adicionais (ex: número da nota, descrição da compra)"
                rows={3}
              />
            </div>
          </div>
          <div className="flex justify-end gap-2">
            <Button variant="outline" onClick={() => {
              setShowDialogContaPagar(false);
              setContaPagarEditando(null);
              setFornecedorSearchTerm('');
              setShowFornecedorDropdown(false);
            }}>
              Cancelar
            </Button>
            <Button onClick={salvarContaPagar} className="bg-blue-600 hover:bg-blue-700 text-white">
              {contaPagarEditando ? 'Atualizar' : 'Salvar'}
            </Button>
          </div>
        </DialogContent>
      </Dialog>

      {/* Dialog de Gestão de Parcelas */}
      <Dialog open={showDialogParcelas} onOpenChange={setShowDialogParcelas}>
        <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Receipt className="h-5 w-5" />
              Gestão de Parcelas
            </DialogTitle>
            {contaSelecionadaParcelas && (
              <CardDescription>
                {contaSelecionadaParcelas.descricao} - Total: R$ {contaSelecionadaParcelas.valor.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
              </CardDescription>
            )}
          </DialogHeader>
          <div className="space-y-4 py-4">
            {parcelas.length === 0 ? (
              <div className="text-center py-8 text-gray-500">
                <Receipt className="h-12 w-12 mx-auto mb-3 text-gray-300" />
                <p>Nenhuma parcela encontrada</p>
              </div>
            ) : (
              <div className="space-y-2">
                {parcelas.map(parcela => (
                  <Card key={parcela.id} className={parcela.status === 'pago' ? 'bg-green-50 border-green-200' : ''}>
                    <CardContent className="p-4">
                      <div className="flex items-center justify-between">
                        <div className="flex-1">
                          <div className="flex items-center gap-3">
                            <Badge variant="outline" className="text-sm font-semibold">
                              Parcela {parcela.numero}
                            </Badge>
                            <div>
                              <p className="font-semibold text-sm">
                                R$ {parcela.valor.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
                              </p>
                              <p className="text-xs text-gray-500">
                                Vencimento: {parcela.data_vencimento.toLocaleDateString('pt-BR')}
                              </p>
                              {parcela.data_pagamento && (
                                <p className="text-xs text-green-600">
                                  Pago em: {parcela.data_pagamento.toLocaleDateString('pt-BR')}
                                </p>
                              )}
                            </div>
                          </div>
                        </div>
                        <div className="flex items-center gap-2">
                          <Badge className={
                            parcela.status === 'pago' ? 'bg-green-100 text-green-800' :
                            parcela.status === 'vencido' ? 'bg-red-100 text-red-800' :
                            'bg-yellow-100 text-yellow-800'
                          }>
                            {parcela.status === 'pago' ? 'Pago' : parcela.status === 'vencido' ? 'Vencido' : 'Pendente'}
                          </Badge>
                          {parcela.status !== 'pago' && (
                            <Button
                              size="sm"
                              variant="outline"
                              className="bg-green-50 hover:bg-green-100 text-green-700 border-green-300"
                              onClick={() => marcarParcelaComoPaga(parcela)}
                            >
                              <CheckCircle className="h-4 w-4 mr-1" />
                              Marcar como Paga
                            </Button>
                          )}
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>
            )}
          </div>
          <div className="flex justify-end gap-2">
            <Button variant="outline" onClick={() => {
              setShowDialogParcelas(false);
              setContaSelecionadaParcelas(null);
              setParcelas([]);
            }}>
              Fechar
            </Button>
          </div>
        </DialogContent>
      </Dialog>

      {/* Dialog de Finalizar Pagamento */}
      <Dialog open={showDialogFinalizarPagamento} onOpenChange={setShowDialogFinalizarPagamento}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <CheckCircle className="h-5 w-5 text-green-600" />
              Finalizar Pagamento
            </DialogTitle>
            {contaParaFinalizar && (
              <CardDescription>
                {contaParaFinalizar.descricao} - Valor: R$ {contaParaFinalizar.valor.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
              </CardDescription>
            )}
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div>
              <Label htmlFor="data-pagamento-final">Data de Pagamento *</Label>
              <Popover>
                <PopoverTrigger asChild>
                  <Button variant="outline" className="w-full justify-start text-left font-normal">
                    <CalendarIcon className="mr-2 h-4 w-4" />
                    {dataPagamentoFinal ? format(dataPagamentoFinal, "PPP", { locale: ptBR }) : "Selecione a data"}
                  </Button>
                </PopoverTrigger>
                <PopoverContent className="w-auto p-0">
                  <CalendarComponent
                    mode="single"
                    selected={dataPagamentoFinal}
                    onSelect={(date) => date && setDataPagamentoFinal(date)}
                    initialFocus
                  />
                </PopoverContent>
              </Popover>
            </div>
            <div>
              <Label htmlFor="origem-pagamento">Origem do Pagamento *</Label>
              <Select value={origemPagamentoFinal} onValueChange={(value) => setOrigemPagamentoFinal(value as OrigemPagamento)}>
                <SelectTrigger className="w-full">
                  <SelectValue placeholder="Selecione a origem" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="caixa">
                    <div className="flex items-center gap-2">
                      <DollarSign className="h-4 w-4 text-blue-600" />
                      <span>Caixa</span>
                    </div>
                  </SelectItem>
                  <SelectItem value="banco">
                    <div className="flex items-center gap-2">
                      <Wallet className="h-4 w-4 text-green-600" />
                      <span>Banco</span>
                    </div>
                  </SelectItem>
                </SelectContent>
              </Select>
              <p className="text-xs text-gray-500 mt-1">
                Selecione de onde o valor será debitado ao finalizar o pagamento
              </p>
            </div>
            {contaParaFinalizar && (
              <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
                <p className="text-sm text-blue-800 mb-2">
                  <strong>Atenção:</strong> Ao finalizar o pagamento:
                </p>
                <ul className="text-xs text-blue-700 space-y-1 list-disc list-inside">
                  <li>Todas as parcelas pendentes serão marcadas como pagas</li>
                  <li>A conta será atualizada para status "Finalizado"</li>
                  <li>O valor será debitado do {origemPagamentoFinal === 'caixa' ? 'Caixa' : 'Banco'}</li>
                  <li>Uma nota de quitação será gerada automaticamente</li>
                </ul>
              </div>
            )}
          </div>
          <div className="flex justify-end gap-2">
            <Button variant="outline" onClick={() => {
              setShowDialogFinalizarPagamento(false);
              setContaParaFinalizar(null);
              setOrigemPagamentoFinal('caixa'); // Reset para padrão
            }}>
              Cancelar
            </Button>
            <Button 
              onClick={finalizarPagamento} 
              className="bg-green-600 hover:bg-green-700 text-white"
            >
              <CheckCircle className="h-4 w-4 mr-2" />
              Finalizar Pagamento
            </Button>
          </div>
        </DialogContent>
      </Dialog>
      <Dialog open={showDialogContaReceber} onOpenChange={(open) => {
        setShowDialogContaReceber(open);
        if (!open) {
          setContaReceberEditando(null);
          setClienteSearchTerm('');
          setShowClienteDropdown(false);
        }
      }}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>
              {contaReceberEditando ? 'Editar Conta a Receber' : 'Nova Conta a Receber'}
            </DialogTitle>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div>
              <Label htmlFor="descricao-receber">Descrição *</Label>
              <Input
                id="descricao-receber"
                value={formContaReceber.descricao}
                onChange={(e) => setFormContaReceber({ ...formContaReceber, descricao: e.target.value })}
                placeholder="Ex: Recebimento de cliente"
              />
            </div>
            <div>
              <Label htmlFor="valor-receber">Valor *</Label>
              <Input
                id="valor-receber"
                type="number"
                step="0.01"
                min="0"
                value={formContaReceber.valor}
                onChange={(e) => setFormContaReceber({ ...formContaReceber, valor: parseFloat(e.target.value) || 0 })}
                placeholder="0.00"
              />
            </div>
            <div>
              <Label htmlFor="vencimento-receber">Data de Vencimento *</Label>
              <Popover>
                <PopoverTrigger asChild>
                  <Button variant="outline" className="w-full justify-start text-left font-normal">
                    <CalendarIcon className="mr-2 h-4 w-4" />
                    {formContaReceber.data_vencimento ? format(formContaReceber.data_vencimento, "PPP", { locale: ptBR }) : "Selecione a data"}
                  </Button>
                </PopoverTrigger>
                <PopoverContent className="w-auto p-0">
                  <CalendarComponent
                    mode="single"
                    selected={formContaReceber.data_vencimento}
                    onSelect={(date) => date && setFormContaReceber({ ...formContaReceber, data_vencimento: date })}
                    initialFocus
                  />
                </PopoverContent>
              </Popover>
            </div>
            <div>
              <Label htmlFor="categoria-receber">Categoria DRE</Label>
              <Select
                value={formContaReceber.categoria_dre}
                onValueChange={(value) => setFormContaReceber({ ...formContaReceber, categoria_dre: value as DRECategory })}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Selecione a categoria" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="receita_operacional">Receita Operacional</SelectItem>
                  <SelectItem value="receita_financeira">Receita Financeira</SelectItem>
                  <SelectItem value="outras_receitas">Outras Receitas</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div>
              <Label htmlFor="cliente-receber">Cliente</Label>
              <div className="relative" ref={clienteInputRef}>
                <div className="relative">
                  <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-4 w-4" />
                  <Input
                    id="cliente-receber"
                    value={formContaReceber.cliente}
                    onChange={(e) => {
                      setFormContaReceber({ ...formContaReceber, cliente: e.target.value });
                      setClienteSearchTerm(e.target.value);
                      setShowClienteDropdown(true);
                    }}
                    onFocus={() => {
                      setShowClienteDropdown(true);
                      setClienteSearchTerm(formContaReceber.cliente);
                    }}
                    placeholder="Buscar ou digitar cliente"
                    className="pl-10"
                  />
                </div>
                {showClienteDropdown && (
                  <div className="absolute z-[100] mt-1 w-full bg-white border border-gray-200 rounded-lg shadow-lg overflow-hidden max-h-60 overflow-y-auto">
                    {clientesFiltrados.length === 0 ? (
                      <div className="p-4 text-center text-sm text-gray-500">
                        {clientesUnicos.length === 0 
                          ? 'Nenhum cliente cadastrado' 
                          : 'Nenhum cliente encontrado'}
                      </div>
                    ) : (
                      clientesFiltrados.map((cliente, index) => (
                        <button
                          key={index}
                          type="button"
                          className="w-full px-4 py-2 text-left hover:bg-gray-100 focus:bg-gray-100 focus:outline-none border-b last:border-b-0 transition-colors"
                          onMouseDown={(e) => {
                            e.preventDefault(); // Prevenir que o mousedown feche o dropdown antes do onClick
                            e.stopPropagation();
                          }}
                          onClick={(e) => {
                            e.preventDefault();
                            e.stopPropagation();
                            setFormContaReceber({ ...formContaReceber, cliente });
                            setClienteSearchTerm('');
                            setShowClienteDropdown(false);
                          }}
                        >
                          <div className="font-medium text-sm">{cliente}</div>
                        </button>
                      ))
                    )}
                  </div>
                )}
              </div>
            </div>
            <div>
              <Label htmlFor="observacoes-receber">Observações</Label>
              <Textarea
                id="observacoes-receber"
                value={formContaReceber.observacoes}
                onChange={(e) => setFormContaReceber({ ...formContaReceber, observacoes: e.target.value })}
                placeholder="Observações adicionais"
                rows={3}
              />
            </div>
          </div>
          <div className="flex justify-end gap-2">
            <Button variant="outline" onClick={() => {
              setShowDialogContaReceber(false);
              setContaReceberEditando(null);
              setClienteSearchTerm('');
              setShowClienteDropdown(false);
            }}>
              Cancelar
            </Button>
            <Button onClick={salvarContaReceber} className="bg-green-600 hover:bg-green-700 text-white">
              {contaReceberEditando ? 'Atualizar' : 'Salvar'}
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </main>
  );
};

export default Financeiro;

