// Página de Controle Financeiro
// Gerenciamento de receitas, despesas, fluxo de caixa e movimentações de estoque

import { useState, useEffect } from "react";
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
  Calendar,
  RotateCcw,
  Download,
  Coins as PiggyBank,
  Receipt,
  CheckCircle,
  Printer,
  Share2,
  FileText as FileSpreadsheet,
  AlertTriangle,
  Hash,
  BarChart3,
  Settings,
  Tag,
  ShoppingCart,
  FileText
} from "lucide-react";
import { useData } from "@/contexts/DataContext";
import { useResponsive } from "@/hooks/use-responsive";
import { printReceipt, downloadReceipt } from "@/lib/receiptPDF";
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Legend } from 'recharts';

const Financeiro = () => {
  const { isMobile } = useResponsive();
  const { movements, products } = useData();
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

  const periodMovements = getMovementsByPeriod();

  // Calcular valores financeiros baseados nas movimentações filtradas por período
  const entradas = periodMovements.filter(m => m.type === 'entrada');
  const saidas = periodMovements.filter(m => m.type === 'saida');
  
  const totalEntradas = entradas.reduce((sum, m) => sum + m.total, 0); // Custos de compra
  const totalSaidas = saidas.reduce((sum, m) => sum + m.total, 0); // Receitas de venda
  const saldo = totalSaidas - totalEntradas; // Lucro = Receitas - Custos

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
                <SelectItem value="mes"><span className="flex items-center gap-2"><Calendar className="h-4 w-4" /> Este Mês</span></SelectItem>
                <SelectItem value="trimestre"><span className="flex items-center gap-2"><TrendingUp className="h-4 w-4" /> Trimestre</span></SelectItem>
                <SelectItem value="ano"><span className="flex items-center gap-2"><BarChart3 className="h-4 w-4" /> Este Ano</span></SelectItem>
              </SelectContent>
            </Select>
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

      {/* Tabs: Movimentações de Estoque e Resumo Financeiro */}
      <Tabs defaultValue="movimentacoes" className="space-y-6">
        <TabsList className="grid w-full grid-cols-2 lg:w-auto">
          <TabsTrigger value="movimentacoes" className="gap-2">
            <Receipt className="h-4 w-4" />
            Movimentações de Estoque
          </TabsTrigger>
          <TabsTrigger value="resumo" className="gap-2">
            <PiggyBank className="h-4 w-4" />
            Resumo Financeiro
          </TabsTrigger>
        </TabsList>

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
                      <TableHead className="font-semibold text-slate-700 hidden lg:table-cell"><div className="flex items-center gap-2"><Hash className="h-4 w-4" /> Qtd Vendida</div></TableHead>
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

        {/* ABA 1: MOVIMENTAÇÕES DE ESTOQUE (Padrão) */}
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
                  <Calendar className="w-5 h-5 sm:w-6 sm:h-6 text-purple-700" />
                </div>
                <div className="text-right">
                  <div className="text-2xl sm:text-3xl font-black">{thisMonthMovements.length}</div>
                  <div className="text-xs sm:text-sm opacity-90">Movimentações</div>
                </div>
              </div>
              <h3 className="text-base sm:text-lg font-semibold mb-2 flex items-center gap-2"><Calendar className="h-4 w-4" /> Este Mês</h3>
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
                    // Ordenar por diferença entre estoque e mínimo (mais crítico primeiro)
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
                    // Calcular valor total do estoque de cada produto
                    const productsWithValue = products.map(product => {
                      // Buscar todas as entradas deste produto para calcular custo médio
                      const productEntries = entradas
                        .filter(m => m.productId === product.id)
                        .sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime());
                      
                      let unitValue = 0;
                      
                      // Se há entradas, calcular custo médio ponderado
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
                        // Se não há entradas, usar preço de venda (ou 0 se não definido)
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
                    .filter(p => p.totalValue > 0) // Apenas produtos com valor
                    .sort((a, b) => b.totalValue - a.totalValue); // Ordenar por valor descendente
                    
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
                  <Calendar className="h-4 w-4" />
                  Comparativo Mensal
                </h3>
                <div className="h-[300px] w-full">
                  {(() => {
                    // Agrupar movimentações por mês
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
                        // Ordenar por chave (formato MM/YYYY)
                        const [monthA, yearA] = a.sortKey.split('/').map(Number);
                        const [monthB, yearB] = b.sortKey.split('/').map(Number);
                        if (yearA !== yearB) return yearA - yearB;
                        return monthA - monthB;
                      })
                      .slice(-6) // Últimos 6 meses
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
                {/* Card: Total Entradas */}
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

                {/* Card: Total Saídas */}
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

                {/* Card: Saldo/Lucro */}
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
                {/* Campo de Busca */}
                <div className="relative">
                  <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-slate-500 w-5 h-5" />
                  <Input
                    placeholder="Buscar movimentações..."
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    className="pl-10 bg-white border-slate-300"
                  />
                </div>
                
                {/* Filtro por Tipo */}
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
                
                {/* Filtro por Produto */}
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
                      <TableHead className="font-semibold text-slate-700"><div className="flex items-center gap-2"><Calendar className="h-4 w-4" /> Data</div></TableHead>
                      <TableHead className="font-semibold text-slate-700 hidden sm:table-cell"><div className="flex items-center gap-2"><Tag className="h-4 w-4" /> Tipo</div></TableHead>
                      <TableHead className="font-semibold text-slate-700">Produto</TableHead>
                      <TableHead className="font-semibold text-slate-700 hidden lg:table-cell"><div className="flex items-center gap-2"><FileText className="h-4 w-4" /> Descrição</div></TableHead>
                      <TableHead className="font-semibold text-slate-700 hidden md:table-cell"><div className="flex items-center gap-2"><Wallet className="h-4 w-4" /> Pagamento</div></TableHead>
                      <TableHead className="font-semibold text-slate-700 hidden sm:table-cell"><div className="flex items-center gap-2"><Hash className="h-4 w-4" /> Qtd</div></TableHead>
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
                              <Calendar className="w-4 h-4 text-slate-400" />
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
    </main>
  );
};

export default Financeiro;

