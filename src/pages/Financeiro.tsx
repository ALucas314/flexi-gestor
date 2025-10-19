// 💰 Página de Controle Financeiro
// Gerenciamento de receitas, despesas, fluxo de caixa e movimentações de estoque

import { useState, useEffect } from "react";
import { useLocation } from "react-router-dom";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@/components/ui/dropdown-menu";
import { 
  DollarSign, 
  TrendingUp, 
  TrendingDown, 
  Wallet,
  ArrowUpCircle,
  ArrowDownCircle,
  Package,
  Search,
  Filter,
  Calendar,
  RotateCcw,
  Download,
  PiggyBank,
  Receipt,
  CheckCircle,
  Printer,
  Share2,
  FileSpreadsheet,
  FileCode,
  ChevronDown
} from "lucide-react";
import { useData } from "@/contexts/DataContext";
import { useResponsive } from "@/hooks/use-responsive";

const Financeiro = () => {
  const { isMobile } = useResponsive();
  const { movements, products } = useData();
  const location = useLocation();
  const [searchTerm, setSearchTerm] = useState("");
  const [filterType, setFilterType] = useState<string>("todos");
  const [filterProduct, setFilterProduct] = useState<string>("todos");
  const [isLoading, setIsLoading] = useState(true);
  const [showReceipt, setShowReceipt] = useState(false);
  const [showPurchase, setShowPurchase] = useState(false);
  const [selectedMovement, setSelectedMovement] = useState<any>(null);

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

  // Calcular valores financeiros baseados nas movimentações
  const entradas = movements.filter(m => m.type === 'entrada');
  const saidas = movements.filter(m => m.type === 'saida');
  
  const totalEntradas = entradas.reduce((sum, m) => sum + m.total, 0);
  const totalSaidas = saidas.reduce((sum, m) => sum + m.total, 0);
  const saldo = totalEntradas - totalSaidas;

  // Movimentações do mês atual
  const now = new Date();
  const thisMonthMovements = movements.filter(m => {
    const movementDate = new Date(m.date);
    return movementDate.getMonth() === now.getMonth() && movementDate.getFullYear() === now.getFullYear();
  });

  const thisMonthEntradas = thisMonthMovements.filter(m => m.type === 'entrada').reduce((sum, m) => sum + m.total, 0);
  const thisMonthSaidas = thisMonthMovements.filter(m => m.type === 'saida').reduce((sum, m) => sum + m.total, 0);
  const thisMonthSaldo = thisMonthEntradas - thisMonthSaidas;

  // Filtros para movimentações
  const filteredMovements = movements.filter(movement => {
    const matchesSearch = movement.productName.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         movement.description.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesType = filterType === "todos" || movement.type === filterType;
    const matchesProduct = filterProduct === "todos" || movement.productId === filterProduct;
    
    return matchesSearch && matchesType && matchesProduct;
  });

  // Estatísticas
  const totalMovements = movements.length;
  const productosMovimentados = new Set(movements.map(m => m.productId)).size;

  // Função para exportar relatório em CSV (Excel)
  const exportToCSV = () => {
    // Cabeçalho do CSV
    const headers = ['Data', 'Tipo', 'Produto', 'Descrição', 'Quantidade', 'Valor Unitário', 'Total'];
    
    // Dados das movimentações
    const data = filteredMovements.map(m => [
      new Date(m.date).toLocaleDateString('pt-BR'),
      m.type === 'entrada' ? 'Entrada' : m.type === 'saida' ? 'Saída' : 'Ajuste',
      m.productName,
      m.description,
      m.quantity,
      `R$ ${m.unitPrice.toFixed(2)}`,
      `R$ ${m.total.toFixed(2)}`
    ]);
    
    // Adicionar totais
    data.push([]);
    data.push(['RESUMO']);
    data.push(['Total de Entradas', '', '', '', '', '', `R$ ${totalEntradas.toFixed(2)}`]);
    data.push(['Total de Saídas', '', '', '', '', '', `R$ ${totalSaidas.toFixed(2)}`]);
    data.push(['Saldo', '', '', '', '', '', `R$ ${saldo.toFixed(2)}`]);
    
    // Criar CSV
    const csvContent = [
      headers.join(';'),
      ...data.map(row => row.join(';'))
    ].join('\n');
    
    // Adicionar BOM para UTF-8
    const BOM = '\uFEFF';
    const blob = new Blob([BOM + csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = window.URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `financeiro-${new Date().toISOString().split('T')[0]}.csv`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    window.URL.revokeObjectURL(url);
  };

  // Função para exportar relatório em XML
  const exportToXML = () => {
    const xmlContent = `<?xml version="1.0" encoding="UTF-8"?>
<RelatorioFinanceiro>
  <DataGeracao>${new Date().toISOString()}</DataGeracao>
  <Resumo>
    <TotalEntradas>${totalEntradas.toFixed(2)}</TotalEntradas>
    <TotalSaidas>${totalSaidas.toFixed(2)}</TotalSaidas>
    <Saldo>${saldo.toFixed(2)}</Saldo>
    <TotalMovimentacoes>${filteredMovements.length}</TotalMovimentacoes>
  </Resumo>
  <Movimentacoes>
${filteredMovements.map(m => `    <Movimentacao>
      <Data>${new Date(m.date).toISOString()}</Data>
      <Tipo>${m.type}</Tipo>
      <Produto>${m.productName}</Produto>
      <Descricao>${m.description}</Descricao>
      <Quantidade>${m.quantity}</Quantidade>
      <ValorUnitario>${m.unitPrice.toFixed(2)}</ValorUnitario>
      <Total>${m.total.toFixed(2)}</Total>
    </Movimentacao>`).join('\n')}
  </Movimentacoes>
</RelatorioFinanceiro>`;
    
    const blob = new Blob([xmlContent], { type: 'application/xml' });
    const url = window.URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `financeiro-${new Date().toISOString().split('T')[0]}.xml`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    window.URL.revokeObjectURL(url);
  };

  // Função para baixar/compartilhar receita
  const downloadReceipt = (movement: any) => {
    const receiptText = `
━━━━━━━━━━━━━━━━━━━━━━━━━
📄 RECEITA
Flexi Gestor - Sistema de Gestão
━━━━━━━━━━━━━━━━━━━━━━━━━

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
📦 Flexi Gestor - Controle de Estoque
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
            <h3 className="text-lg font-semibold text-gray-900 mb-2">💰 Carregando Financeiro...</h3>
            <p className="text-gray-600">Preparando dados financeiros e movimentações</p>
          </div>
        </div>
      </main>
    );
  }

  return (
    <div className="container mx-auto p-4 sm:p-6 max-w-7xl">
      {/* Cabeçalho */}
      <div className="mb-6">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <div>
            <h1 className="text-3xl font-bold bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent flex items-center gap-2">
              <DollarSign className="w-8 h-8 text-blue-600" />
              Financeiro
            </h1>
            <p className="text-gray-600 mt-1">
              Controle completo de receitas, despesas e movimentações
            </p>
          </div>
          
          <div className="flex gap-2">
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button className="w-full sm:w-auto bg-gradient-to-r from-indigo-600 to-indigo-700 hover:from-indigo-700 hover:to-indigo-800 text-white px-6 sm:px-8 py-3 sm:py-4 rounded-xl sm:rounded-2xl shadow-xl hover:shadow-2xl transition-all duration-200 transform hover:scale-105">
                  <Download className="w-5 h-5 sm:w-6 sm:h-6 mr-2 sm:mr-3" />
                  Exportar
                  <ChevronDown className="w-4 h-4 ml-2" />
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end" className="w-48">
                <DropdownMenuItem onClick={exportToCSV} className="cursor-pointer">
                  <FileSpreadsheet className="mr-2 h-4 w-4 text-green-600" />
                  Exportar Excel (CSV)
                </DropdownMenuItem>
                <DropdownMenuItem onClick={exportToXML} className="cursor-pointer">
                  <FileCode className="mr-2 h-4 w-4 text-blue-600" />
                  Exportar XML
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          </div>
        </div>
      </div>

      {/* Tabs: Resumo Financeiro e Movimentações */}
      <Tabs defaultValue="resumo" className="space-y-6">
        <TabsList className="grid w-full grid-cols-2 lg:w-auto">
          <TabsTrigger value="resumo" className="gap-2">
            <PiggyBank className="h-4 w-4" />
            Resumo Financeiro
          </TabsTrigger>
          <TabsTrigger value="movimentacoes" className="gap-2">
            <Receipt className="h-4 w-4" />
            Movimentações de Estoque
          </TabsTrigger>
        </TabsList>

        {/* ABA 1: RESUMO FINANCEIRO */}
        <TabsContent value="resumo" className="space-y-6">
          {/* Cards de Resumo do Mês */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            {/* Receitas do Mês */}
            <Card className="border-green-200 bg-gradient-to-br from-green-50 to-white hover:shadow-lg transition-shadow">
              <CardHeader className="pb-2">
                <CardTitle className="text-sm font-medium text-gray-600 flex items-center gap-2">
                  <TrendingUp className="h-4 w-4 text-green-600" />
                  Receitas do Mês
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-3xl font-bold text-green-600">
                  R$ {thisMonthEntradas.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
                </div>
                <p className="text-xs text-gray-500 mt-1">
                  {entradas.length} entradas registradas
                </p>
              </CardContent>
            </Card>

            {/* Despesas do Mês */}
            <Card className="border-red-200 bg-gradient-to-br from-red-50 to-white hover:shadow-lg transition-shadow">
              <CardHeader className="pb-2">
                <CardTitle className="text-sm font-medium text-gray-600 flex items-center gap-2">
                  <TrendingDown className="h-4 w-4 text-red-600" />
                  Saídas do Mês
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-3xl font-bold text-red-600">
                  R$ {thisMonthSaidas.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
                </div>
                <p className="text-xs text-gray-500 mt-1">
                  {saidas.length} saídas registradas
                </p>
              </CardContent>
            </Card>

            {/* Saldo do Mês */}
            <Card className={`border-${thisMonthSaldo >= 0 ? 'indigo' : 'red'}-200 bg-gradient-to-br from-${thisMonthSaldo >= 0 ? 'indigo' : 'red'}-50 to-white hover:shadow-lg transition-shadow`}>
              <CardHeader className="pb-2">
                <CardTitle className="text-sm font-medium text-gray-600 flex items-center gap-2">
                  <Wallet className="h-4 w-4 text-indigo-600" />
                  Saldo do Mês
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className={`text-3xl font-bold ${thisMonthSaldo >= 0 ? 'text-indigo-600' : 'text-red-600'}`}>
                  R$ {thisMonthSaldo.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
                </div>
                <p className="text-xs text-gray-500 mt-1">
                  {thisMonthMovements.length} movimentações no mês
                </p>
              </CardContent>
            </Card>
          </div>

          {/* Cards de Totais Gerais */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <Card className="border-blue-200 bg-gradient-to-br from-blue-50 to-white">
              <CardHeader className="pb-2">
                <CardTitle className="text-sm font-medium text-blue-800">
                  💵 Total de Receitas (Geral)
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold text-blue-600">
                  R$ {totalEntradas.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
                </div>
                <p className="text-xs text-blue-500 mt-1">Todas as entradas registradas</p>
              </CardContent>
            </Card>

            <Card className="border-orange-200 bg-gradient-to-br from-orange-50 to-white">
              <CardHeader className="pb-2">
                <CardTitle className="text-sm font-medium text-orange-800">
                  💸 Total de Saídas (Geral)
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold text-orange-600">
                  R$ {totalSaidas.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
                </div>
                <p className="text-xs text-orange-500 mt-1">Todas as saídas registradas</p>
              </CardContent>
            </Card>

            <Card className={`border-${saldo >= 0 ? 'green' : 'red'}-200 bg-gradient-to-br from-${saldo >= 0 ? 'green' : 'red'}-50 to-white`}>
              <CardHeader className="pb-2">
                <CardTitle className={`text-sm font-medium text-${saldo >= 0 ? 'green' : 'red'}-800`}>
                  💰 Saldo Total (Geral)
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className={`text-2xl font-bold ${saldo >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                  R$ {saldo.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
                </div>
                <p className={`text-xs ${saldo >= 0 ? 'text-green-500' : 'text-red-500'} mt-1`}>
                  {saldo >= 0 ? 'Lucro acumulado' : 'Prejuízo acumulado'}
                </p>
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        {/* ABA 2: MOVIMENTAÇÕES DE ESTOQUE */}
        <TabsContent value="movimentacoes" className="space-y-6">
          {/* Cards de Estatísticas de Movimentações */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            <Card className="bg-gradient-to-br from-blue-50 to-blue-100 border-blue-200 hover:shadow-lg transition-all">
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium text-blue-800">📊 Total</CardTitle>
                <RotateCcw className="h-5 w-5 text-blue-600" />
              </CardHeader>
              <CardContent>
                <div className="text-3xl font-bold text-blue-700">{totalMovements}</div>
                <p className="text-xs text-blue-600">Movimentações</p>
              </CardContent>
            </Card>

            <Card className="bg-gradient-to-br from-green-50 to-green-100 border-green-200 hover:shadow-lg transition-all">
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium text-green-800">💰 Valor Total</CardTitle>
                <Package className="h-5 w-5 text-green-600" />
              </CardHeader>
              <CardContent>
                <div className="text-3xl font-bold text-green-700">
                  R$ {(totalEntradas + totalSaidas).toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
                </div>
                <p className="text-xs text-green-600">Movimentado</p>
              </CardContent>
            </Card>

            <Card className="bg-gradient-to-br from-purple-50 to-purple-100 border-purple-200 hover:shadow-lg transition-all">
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium text-purple-800">📅 Este Mês</CardTitle>
                <Calendar className="h-5 w-5 text-purple-600" />
              </CardHeader>
              <CardContent>
                <div className="text-3xl font-bold text-purple-700">{thisMonthMovements.length}</div>
                <p className="text-xs text-purple-600">Movimentações</p>
              </CardContent>
            </Card>

            <Card className="bg-gradient-to-br from-orange-50 to-orange-100 border-orange-200 hover:shadow-lg transition-all">
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium text-orange-800">🔄 Produtos</CardTitle>
                <Package className="h-5 w-5 text-orange-600" />
              </CardHeader>
              <CardContent>
                <div className="text-3xl font-bold text-orange-700">{productosMovimentados}</div>
                <p className="text-xs text-orange-600">Movimentados</p>
              </CardContent>
            </Card>
          </div>

          {/* Filtros e Busca */}
          <Card className="bg-gradient-to-r from-slate-50 to-gray-50 border-slate-200">
            <CardHeader className="pb-4">
              <CardTitle className="flex items-center gap-2 text-slate-800">
                <Filter className="w-5 h-5 text-slate-600" />
                🔍 Filtros e Busca
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                {/* Campo de Busca */}
                <div className="relative">
                  <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-slate-500 w-5 h-5" />
                  <Input
                    placeholder="🔍 Buscar movimentações..."
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
                    <SelectItem value="todos">📊 Todos os tipos</SelectItem>
                    <SelectItem value="entrada">📥 Entradas</SelectItem>
                    <SelectItem value="saida">📤 Saídas</SelectItem>
                    <SelectItem value="ajuste">⚙️ Ajustes</SelectItem>
                  </SelectContent>
                </Select>
                
                {/* Filtro por Produto */}
                <Select value={filterProduct} onValueChange={setFilterProduct}>
                  <SelectTrigger className="bg-white border-slate-300">
                    <SelectValue placeholder="Produto" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="todos">📦 Todos os produtos</SelectItem>
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
          <Card className="bg-white border-slate-200 shadow-sm">
            <CardHeader className="pb-4">
              <CardTitle className="flex items-center gap-2 text-slate-800">
                <Package className="w-5 w-5 text-slate-600" />
                📋 Histórico de Movimentações
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="rounded-md border border-slate-200 overflow-hidden">
                <Table>
                  <TableHeader>
                    <TableRow className="bg-slate-50 hover:bg-slate-100">
                      <TableHead className="font-semibold text-slate-700">📅 Data</TableHead>
                      <TableHead className="font-semibold text-slate-700 hidden sm:table-cell">🏷️ Tipo</TableHead>
                      <TableHead className="font-semibold text-slate-700">📦 Produto</TableHead>
                      <TableHead className="font-semibold text-slate-700 hidden lg:table-cell">📝 Descrição</TableHead>
                      <TableHead className="font-semibold text-slate-700 hidden sm:table-cell">🔢 Qtd</TableHead>
                      <TableHead className="font-semibold text-slate-700">💰 Valor</TableHead>
                      <TableHead className="font-semibold text-slate-700">📄 Doc</TableHead>
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
                      filteredMovements.map((movement) => (
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
                            <Badge variant={
                              movement.type === "entrada" ? "default" : 
                              movement.type === "saida" ? "destructive" : "secondary"
                            } className="capitalize">
                              {movement.type === "entrada" ? "📥 Entrada" : 
                               movement.type === "saida" ? "📤 Saída" : "⚙️ Ajuste"}
                            </Badge>
                          </TableCell>
                          
                          <TableCell>
                            <div className="font-medium text-slate-900 text-sm">{movement.productName}</div>
                          </TableCell>
                          
                          <TableCell className="hidden lg:table-cell">
                            <span className="text-sm text-slate-600">{movement.description}</span>
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
                                <Receipt className="w-3 h-3 mr-1" />
                                <span className="hidden sm:inline">Receita</span>
                                <span className="sm:hidden">📄</span>
                              </Badge>
                            ) : movement.type === 'entrada' ? (
                              <Badge 
                                className="bg-green-100 text-green-800 hover:bg-green-200 border-green-300 cursor-pointer transition-all hover:scale-105 text-xs"
                                onClick={() => openPurchase(movement)}
                              >
                                <Receipt className="w-3 h-3 mr-1" />
                                <span className="hidden sm:inline">Compra</span>
                                <span className="sm:hidden">🛒</span>
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
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>

      {/* Modal de Receita (Saída) */}
      <Dialog open={showReceipt} onOpenChange={setShowReceipt}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2 text-green-600">
              <CheckCircle className="h-6 w-6" />
              Detalhes da Receita
            </DialogTitle>
          </DialogHeader>
          
          {selectedMovement && (
            <div className="space-y-4">
              {/* Cabeçalho da Receita */}
              <div className="border-b pb-4">
                <div className="text-center mb-3">
                  <h2 className="text-2xl font-bold text-gray-900">📄 RECEITA</h2>
                  <p className="text-sm text-gray-600">Flexi Gestor - Sistema de Gestão</p>
                </div>
                
                <div className="space-y-1 text-sm">
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
                  className="w-full bg-green-600 hover:bg-green-700"
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
        </DialogContent>
      </Dialog>

      {/* Modal de Compra (Entrada) */}
      <Dialog open={showPurchase} onOpenChange={setShowPurchase}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2 text-blue-600">
              <CheckCircle className="h-6 w-6" />
              Comprovante de Compra
            </DialogTitle>
          </DialogHeader>
          
          {selectedMovement && (
            <div className="space-y-4">
              {/* Cabeçalho do Comprovante */}
              <div className="border-b pb-4">
                <div className="text-center mb-3">
                  <h2 className="text-2xl font-bold text-gray-900">🛒 NOTA DE COMPRA</h2>
                  <p className="text-sm text-gray-600">Flexi Gestor - Sistema de Gestão</p>
                </div>
                
                <div className="space-y-1 text-sm">
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
                  className="w-full bg-blue-600 hover:bg-blue-700"
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
                <p className="mt-1">📦 Flexi Gestor - Controle de Estoque</p>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default Financeiro;

