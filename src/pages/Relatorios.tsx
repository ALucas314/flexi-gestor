// BarChart3 Página de Relatórios e Business Intelligence
// BI completo com tabelas estilizadas, gráficos e análises

import React, { useState, useEffect } from "react";
// Usando Lucide React
import { 
  BarChart3,
  TrendingUp,
  TrendingDown,
  Package,
  Download,
  Calendar,
  ArrowUp,
  ArrowDown,
  DollarSign,
  AlertTriangle,
  FileText,
  PieChart,
  Activity,
  CheckCircle
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { useData } from "@/contexts/DataContext";

const Relatorios = () => {
  const { products, movements } = useData();
  const [period, setPeriod] = useState<string>("todos");
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const timer = setTimeout(() => setIsLoading(false), 500);
    return () => clearTimeout(timer);
  }, []);

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
  
  // Cálculos de KPIs
  const totalProducts = products.length;
  const totalStockValue = products.reduce((sum, p) => sum + (p.price * p.stock), 0);
  const lowStockProducts = products.filter(p => p.stock <= p.minStock);
  const entradaMovements = periodMovements.filter(m => m.type === 'entrada');
  const saidaMovements = periodMovements.filter(m => m.type === 'saida');
  const totalEntradas = entradaMovements.reduce((sum, m) => sum + m.total, 0);
  const totalSaidas = saidaMovements.reduce((sum, m) => sum + m.total, 0);
  const lucroEstimado = totalSaidas - totalEntradas;

  // Função helper para formatar data compatível com Excel
  const formatDateForExcel = (date: Date) => {
    const d = new Date(date);
    const day = String(d.getDate()).padStart(2, '0');
    const month = String(d.getMonth() + 1).padStart(2, '0');
    const year = d.getFullYear();
    return `${day}/${month}/${year}`;
  };

  // Exportar para CSV/Excel EM FORMATO DE TABELA PROFISSIONAL
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
      ['Entradas', entradaMovements.length.toString(), totalEntradas.toFixed(2).replace('.', ','), entradaMovements.length > 0 ? ((entradaMovements.length / periodMovements.length) * 100).toFixed(1).replace('.', ',') + '%' : '0%', totalEntradas > 0 ? 'Positivo' : 'Zero'],
      ['Saidas', saidaMovements.length.toString(), totalSaidas.toFixed(2).replace('.', ','), saidaMovements.length > 0 ? ((saidaMovements.length / periodMovements.length) * 100).toFixed(1).replace('.', ',') + '%' : '0%', totalSaidas > 0 ? 'Positivo' : 'Zero'],
      ['Lucro/Prejuizo', '1', lucroEstimado.toFixed(2).replace('.', ','), totalSaidas > 0 ? ((lucroEstimado / totalSaidas) * 100).toFixed(2).replace('.', ',') + '%' : '0%', lucroEstimado >= 0 ? 'Lucro' : 'Prejuizo'],
      [''],
      
      ['MOVIMENTACOES DETALHADAS'],
      ['ID', 'Tipo', 'Data', 'Produto', 'Quantidade', 'Preco Unit.', 'Valor Total', 'Descricao']
    ];

    // Adicionar detalhes das movimentações com formatação de tabela
    periodMovements.forEach((movement, index) => {
      const product = products.find(p => p.id === movement.productId);
      const formattedDate = formatDateForExcel(movement.date);
      
      csvRows.push([
        (index + 1).toString(),
        movement.type === 'entrada' ? 'ENTRADA' : 'SAIDA',
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
        p.category,
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
      entradaMovements.length.toString(),
      saidaMovements.length.toString(),
      (entradaMovements.length - saidaMovements.length).toString(),
      `${entradaMovements.length > 0 ? ((entradaMovements.length / (entradaMovements.length + saidaMovements.length)) * 100).toFixed(1) : '0,0'}%`,
      `${saidaMovements.length > 0 ? ((saidaMovements.length / (entradaMovements.length + saidaMovements.length)) * 100).toFixed(1) : '0,0'}%`,
      entradaMovements.length > saidaMovements.length ? 'Mais Entradas' : saidaMovements.length > entradaMovements.length ? 'Mais Saídas' : 'Equilibrado'
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
    csvRows.push(['Tecnologia', 'React + Prisma + SQLite + Express', '', '', '', '', '']);
    csvRows.push(['Versão', '1.0.0', '', '', '', '', '']);
    csvRows.push(['Exportado em', currentDate.toLocaleString('pt-BR'), '', '', '', '', '']);
    csvRows.push(['Formato', 'CSV/Excel Compatível', '', '', '', '', '']);
    csvRows.push(['Codificação', 'UTF-8 com BOM', '', '', '', '', '']);
    csvRows.push([''], ['RELATÓRIO GERADO AUTOMATICAMENTE PELO SISTEMA FLEXI GESTOR', '', '', '', '', '', '']);
    csvRows.push(['Para suporte técnico: contato@flexigestor.com', '', '', '', '', '', '']);
    csvRows.push(['Sistema desenvolvido com tecnologia React + Prisma', '', '', '', '', '', '']);

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

  if (isLoading) {
    return (
      <main className="flex-1 p-3 sm:p-6 space-y-4 sm:space-y-6">
        <div className="flex items-center justify-center min-h-[400px]">
          <div className="text-center">
            <div className="w-16 h-16 bg-gradient-to-br from-blue-500 to-purple-600 rounded-full flex items-center justify-center mx-auto mb-4 animate-pulse">
              <BarChart3 className="w-8 h-8 text-white" />
            </div>
            <h3 className="text-lg font-semibold text-gray-900 mb-2">Carregando Relatórios...</h3>
            <p className="text-gray-600">Preparando análises e relatórios</p>
          </div>
        </div>
      </main>
    );
  }

  return (
    <main className="flex-1 p-4 sm:p-6 space-y-6">
      {/* Header */}
      <div className="flex flex-col items-center sm:flex-row sm:justify-between sm:items-center gap-4 mt-4 sm:mt-0">
        <div className="text-center sm:text-left">
          <h1 className="text-3xl font-bold bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent flex items-center gap-2 justify-center sm:justify-start">
            <BarChart3 className="w-8 h-8 text-blue-600" />
            Relatórios
          </h1>
          <p className="text-gray-600">Análises e insights do seu negócio</p>
        </div>
        <Button 
          onClick={exportToCSV}
          className="w-full sm:w-auto bg-gradient-to-r from-indigo-600 to-indigo-700 hover:from-indigo-700 hover:to-indigo-800 text-white px-6 sm:px-8 py-3 sm:py-4 rounded-xl sm:rounded-2xl shadow-xl hover:shadow-2xl transition-all duration-200 transform hover:scale-105"
        >
          <Download className="w-5 h-5 sm:w-6 sm:h-6 mr-2 sm:mr-3" />
          Exportar Excel
        </Button>
      </div>

      {/* Filtro de Período */}
      <Card className="border-2">
        <CardContent className="pt-6">
          <div className="flex items-center gap-4">
            <Calendar className="w-5 h-5 text-blue-600" />
            <span className="font-medium">Período:</span>
            <Select value={period} onValueChange={setPeriod}>
              <SelectTrigger className="w-48">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="todos"><span className="flex items-center gap-2"><BarChart3 className="h-4 w-4" /> Todos</span></SelectItem>
                <SelectItem value="mes"><span className="flex items-center gap-2"><Calendar className="h-4 w-4" /> Este Mês</span></SelectItem>
                <SelectItem value="trimestre"><span className="flex items-center gap-2"><TrendingUp className="h-4 w-4" /> Trimestre</span></SelectItem>
                <SelectItem value="ano"><span className="flex items-center gap-2"><BarChart3 className="h-4 w-4" /> Este Ano</span></SelectItem>
              </SelectContent>
            </Select>
          </div>
        </CardContent>
      </Card>

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
              <ArrowDown className="w-5 h-5 sm:w-6 sm:h-6 text-emerald-700" />
            </div>
            <div className="text-right">
              <div className="text-lg sm:text-xl font-black">R$ {totalEntradas.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}</div>
              <div className="text-xs sm:text-sm opacity-90">Total</div>
            </div>
          </div>
          <h3 className="text-base sm:text-lg font-semibold mb-2 flex items-center gap-2"><ArrowDown className="h-4 w-4" /> Entradas</h3>
          <p className="text-xs sm:text-sm opacity-80">{entradaMovements.length} movimentações</p>
        </div>

        {/* Total Saídas */}
        <div className="group bg-gradient-to-br from-orange-100 to-orange-200 rounded-2xl sm:rounded-3xl p-4 sm:p-6 text-orange-800 shadow-lg hover:shadow-xl transition-all duration-300 hover:scale-105 border border-orange-200/50">
          <div className="flex items-center justify-between mb-3 sm:mb-4">
            <div className="w-10 h-10 sm:w-12 sm:h-12 bg-orange-300/50 rounded-xl sm:rounded-2xl flex items-center justify-center backdrop-blur-sm">
              <ArrowUp className="w-5 h-5 sm:w-6 sm:h-6 text-orange-700" />
            </div>
            <div className="text-right">
              <div className="text-lg sm:text-xl font-black">R$ {totalSaidas.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}</div>
              <div className="text-xs sm:text-sm opacity-90">Total</div>
            </div>
          </div>
          <h3 className="text-base sm:text-lg font-semibold mb-2 flex items-center gap-2"><ArrowUp className="h-4 w-4" /> Saídas</h3>
          <p className="text-xs sm:text-sm opacity-80">{saidaMovements.length} movimentações</p>
        </div>
      </div>

      {/* Lucro/Prejuízo */}
      <Card className={`border-2 ${lucroEstimado >= 0 ? 'border-green-500 bg-green-50' : 'border-red-500 bg-red-50'}`}>
        <CardContent className="pt-6">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className={`p-3 rounded-full ${lucroEstimado >= 0 ? 'bg-green-100' : 'bg-red-100'}`}>
                <Activity className={`w-6 h-6 ${lucroEstimado >= 0 ? 'text-green-600' : 'text-red-600'}`} />
              </div>
              <div>
                <p className="text-sm font-medium text-gray-600">
                  {lucroEstimado >= 0 ? <span className="flex items-center gap-2"><DollarSign className="h-4 w-4" /> Lucro Estimado</span> : <span className="flex items-center gap-2"><TrendingDown className="h-4 w-4" /> Prejuízo Estimado</span>}
                </p>
                <p className="text-xs text-gray-500">Saídas - Entradas</p>
              </div>
            </div>
            <div className={`text-xl sm:text-2xl font-bold ${lucroEstimado >= 0 ? 'text-green-600' : 'text-red-600'}`}>
              {lucroEstimado >= 0 ? '+' : ''}R$ {Math.abs(lucroEstimado).toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Tabela de Movimentações */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <FileText className="w-5 h-5 text-blue-600" />
            Movimentações Recentes
          </CardTitle>
        </CardHeader>
        <CardContent>
          {periodMovements.length === 0 ? (
            <div className="text-center py-12 text-gray-500">
              <Activity className="w-16 h-16 mx-auto mb-4 opacity-20" />
              <p>Nenhuma movimentação no período selecionado</p>
            </div>
          ) : (
            <div className="rounded-lg border overflow-hidden">
              <Table>
                <TableHeader className="bg-gradient-to-r from-blue-50 to-purple-50">
                  <TableRow>
                    <TableHead className="font-bold">Tipo</TableHead>
                    <TableHead className="font-bold">Data</TableHead>
                    <TableHead className="font-bold">Produto</TableHead>
                    <TableHead className="font-bold text-right">Qtd.</TableHead>
                    <TableHead className="font-bold text-right">Preço Unit.</TableHead>
                    <TableHead className="font-bold text-right">Total</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {periodMovements.slice(0, 10).map((m, idx) => {
                    const product = products.find(p => p.id === m.productId);
                    return (
                      <TableRow key={m.id} className={idx % 2 === 0 ? 'bg-white' : 'bg-gray-50'}>
                        <TableCell>
                          <Badge 
                            variant={m.type === 'entrada' ? 'default' : 'secondary'}
                            className={m.type === 'entrada' ? 'bg-green-100 text-green-800 border-green-300' : 'bg-orange-100 text-orange-800 border-orange-300'}
                          >
                            {m.type === 'entrada' ? <span className="flex items-center gap-1"><ArrowDown className="h-4 w-4" /> Entrada</span> : <span className="flex items-center gap-1"><ArrowUp className="h-4 w-4" /> Saída</span>}
                          </Badge>
                        </TableCell>
                        <TableCell className="text-sm">
                          {new Date(m.date).toLocaleDateString('pt-BR')}
                        </TableCell>
                        <TableCell className="font-medium">{product?.name || m.productName}</TableCell>
                        <TableCell className="text-right font-semibold">{m.quantity}</TableCell>
                        <TableCell className="text-right">
                          R$ {m.unitPrice.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
                        </TableCell>
                        <TableCell className="text-right font-bold text-blue-600">
                          R$ {m.total.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
                        </TableCell>
                      </TableRow>
                    );
                  })}
                </TableBody>
              </Table>
            </div>
          )}
          {periodMovements.length > 10 && (
            <p className="text-center text-sm text-gray-500 mt-4">
              Mostrando 10 de {periodMovements.length} movimentações. Exporte para ver todas.
            </p>
          )}
        </CardContent>
      </Card>

      {/* Grid de Análises */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Produtos com Estoque Baixo */}
        <Card className="border-2 border-orange-200">
          <CardHeader className="bg-gradient-to-r from-orange-50 to-red-50">
            <CardTitle className="flex items-center gap-2 text-orange-800">
              <AlertTriangle className="w-5 h-5" />
              Estoque Baixo ({lowStockProducts.length})
            </CardTitle>
          </CardHeader>
          <CardContent className="pt-6">
            {lowStockProducts.length === 0 ? (
              <div className="text-center py-8 text-gray-500">
                <Package className="w-12 h-12 mx-auto mb-3 opacity-20" />
                <p className="flex items-center gap-2"><CheckCircle className="h-4 w-4 text-green-600" /> Todos os produtos com estoque adequado!</p>
              </div>
            ) : (
              <div className="space-y-3">
                {lowStockProducts.slice(0, 5).map(p => (
                  <div key={p.id} className="flex items-center justify-between p-3 bg-orange-50 rounded-lg border border-orange-200">
                    <div>
                      <p className="font-medium text-gray-900">{p.name}</p>
                      <p className="text-xs text-gray-600">{p.category}</p>
                    </div>
                    <div className="text-right">
                      <Badge variant="destructive" className="bg-orange-500">
                        {p.stock} / {p.minStock}
                      </Badge>
                      <p className="text-xs text-gray-600 mt-1">R$ {p.price.toFixed(2)}</p>
                    </div>
                  </div>
                ))}
                {lowStockProducts.length > 5 && (
                  <p className="text-center text-sm text-gray-500">
                    +{lowStockProducts.length - 5} produtos a mais
                  </p>
                )}
              </div>
            )}
          </CardContent>
        </Card>

        {/* Top 5 Produtos Mais Valiosos */}
        <Card className="border-2 border-green-200">
          <CardHeader className="bg-gradient-to-r from-green-50 to-emerald-50">
            <CardTitle className="flex items-center gap-2 text-green-800">
              <TrendingUp className="w-5 h-5" />
              Top 5 Mais Valiosos
            </CardTitle>
          </CardHeader>
          <CardContent className="pt-6">
            {products.length === 0 ? (
              <div className="text-center py-8 text-gray-500">
                <Package className="w-12 h-12 mx-auto mb-3 opacity-20" />
                <p>Nenhum produto cadastrado</p>
              </div>
            ) : (
              <div className="space-y-3">
                {products
                  .sort((a, b) => (b.price * b.stock) - (a.price * a.stock))
                  .slice(0, 5)
                  .map((p, idx) => (
                    <div key={p.id} className="flex items-center justify-between p-3 bg-green-50 rounded-lg border border-green-200">
                      <div className="flex items-center gap-3">
                        <div className="w-8 h-8 bg-green-600 text-white rounded-full flex items-center justify-center font-bold text-sm">
                          {idx + 1}º
                        </div>
                        <div>
                          <p className="font-medium text-gray-900">{p.name}</p>
                          <p className="text-xs text-gray-600">{p.stock} unidades</p>
                        </div>
                      </div>
                      <div className="text-right">
                        <p className="font-bold text-green-600">
                          R$ {(p.price * p.stock).toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
                        </p>
                        <p className="text-xs text-gray-600">R$ {p.price.toFixed(2)} / un</p>
                      </div>
                    </div>
                  ))}
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Análise Comparativa */}
      <Card className="border-2">
        <CardHeader className="bg-gradient-to-r from-blue-50 to-purple-50">
          <CardTitle className="flex items-center gap-2">
            <PieChart className="w-5 h-5 text-blue-600" />
            Análise Comparativa - Entradas vs Saídas
          </CardTitle>
        </CardHeader>
        <CardContent className="pt-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {/* Entradas */}
            <div className="space-y-3">
              <div className="flex items-center gap-2 mb-4">
                <div className="w-4 h-4 bg-green-500 rounded"></div>
                <h3 className="font-bold text-lg flex items-center gap-2"><ArrowDown className="h-4 w-4" /> Entradas</h3>
              </div>
              <div className="space-y-2">
                <div className="flex justify-between p-2 bg-green-50 rounded">
                  <span className="text-sm">Quantidade:</span>
                  <span className="font-bold">{entradaMovements.length}</span>
                </div>
                <div className="flex justify-between p-2 bg-green-50 rounded">
                  <span className="text-sm">Unidades:</span>
                  <span className="font-bold">{entradaMovements.reduce((s, m) => s + m.quantity, 0)}</span>
                </div>
                <div className="flex justify-between p-2 bg-green-100 rounded">
                  <span className="text-sm font-medium">Valor Total:</span>
                  <span className="font-bold text-green-600">
                    R$ {totalEntradas.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
                  </span>
                </div>
              </div>
            </div>

            {/* Saídas */}
            <div className="space-y-3">
              <div className="flex items-center gap-2 mb-4">
                <div className="w-4 h-4 bg-orange-500 rounded"></div>
                <h3 className="font-bold text-lg flex items-center gap-2"><ArrowUp className="h-4 w-4" /> Saídas</h3>
              </div>
              <div className="space-y-2">
                <div className="flex justify-between p-2 bg-orange-50 rounded">
                  <span className="text-sm">Quantidade:</span>
                  <span className="font-bold">{saidaMovements.length}</span>
                </div>
                <div className="flex justify-between p-2 bg-orange-50 rounded">
                  <span className="text-sm">Unidades:</span>
                  <span className="font-bold">{saidaMovements.reduce((s, m) => s + m.quantity, 0)}</span>
                </div>
                <div className="flex justify-between p-2 bg-orange-100 rounded">
                  <span className="text-sm font-medium">Valor Total:</span>
                  <span className="font-bold text-orange-600">
                    R$ {totalSaidas.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
                  </span>
                </div>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>
    </main>
  );
};

export default Relatorios;
