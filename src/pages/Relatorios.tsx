import React, { useState } from "react";
import { BarChart3, TrendingUp, TrendingDown, Package, Download, Calendar } from "lucide-react";


import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useData } from "@/contexts/DataContext";

const Relatorios = () => {
  const { products, movements } = useData();
  const [period, setPeriod] = useState<string>("todos");

  // Cálculos de relatórios
  const totalProducts = products.length;
  const totalStockValue = products.reduce((sum, p) => sum + (p.price * p.stock), 0);
  const lowStockProducts = products.filter(p => p.stock <= p.minStock);
  
  // Movimentações por período
  const getMovementsByPeriod = () => {
    const now = new Date();
    const currentMonth = now.getMonth();
    const currentYear = now.getFullYear();
    
    if (period === "todos") {
      // Retornar todas as movimentações
      return movements;
    }
    
    return movements.filter(m => {
      const movementDate = new Date(m.date);
      if (period === "mes") {
        return movementDate.getMonth() === currentMonth && movementDate.getFullYear() === currentYear;
      } else if (period === "trimestre") {
        const quarter = Math.floor(currentMonth / 3);
        const movementQuarter = Math.floor(movementDate.getMonth() / 3);
        return movementQuarter === quarter && movementDate.getFullYear() === currentYear;
      } else if (period === "ano") {
        return movementDate.getFullYear() === currentYear;
      }
      return true; // Padrão: todos os períodos
    });
  };

  const periodMovements = getMovementsByPeriod();
  const totalMovements = periodMovements.length;
  const totalValue = periodMovements.reduce((sum, m) => sum + m.total, 0);
  const entradaMovements = periodMovements.filter(m => m.type === 'entrada');
  const saidaMovements = periodMovements.filter(m => m.type === 'saida');

  // Função para exportar relatórios em CSV com formatação profissional
  const exportReportsToCSV = () => {
    console.log('📊 Gerando relatório CSV...');
    console.log('  - Período selecionado:', period);
    console.log('  - Total de movimentações:', movements.length);
    console.log('  - Movimentações filtradas:', periodMovements.length);
    console.log('  - Produtos:', products.length);
    
    // Cabeçalho do relatório com formatação profissional
    const reportHeader = [
      ['FLEXI GESTOR - SISTEMA DE GESTÃO EMPRESARIAL'],
      ['RELATÓRIO GERAL DE ESTOQUE E MOVIMENTAÇÕES'],
      [''],
      ['INFORMAÇÕES DO RELATÓRIO'],
      ['Período Analisado:', period === 'todos' ? 'Todos os Períodos' : period === 'mes' ? 'Este Mês' : period === 'trimestre' ? 'Este Trimestre' : 'Este Ano'],
      ['Data de Geração:', new Date().toLocaleDateString('pt-BR', { 
        day: '2-digit', 
        month: '2-digit', 
        year: 'numeric',
        hour: '2-digit',
        minute: '2-digit'
      })],
      ['Hora de Geração:', new Date().toLocaleTimeString('pt-BR', { 
        hour: '2-digit', 
        minute: '2-digit' 
      })],
      [''],
      ['RESUMO EXECUTIVO'],
      ['Total de Produtos Cadastrados', totalProducts.toString()],
      ['Valor Total do Estoque', `R$ ${totalStockValue.toFixed(2).replace('.', ',')}`],
      ['Produtos com Estoque Baixo', lowStockProducts.length.toString()],
      ['Total de Movimentações', totalMovements.toString()],
      ['Valor Total das Movimentações', `R$ ${totalValue.toFixed(2).replace('.', ',')}`],
      [''],
      ['ANÁLISE DE ENTRADAS'],
      ['Quantidade de Entradas', entradaMovements.length.toString()],
      ['Valor Total das Entradas', `R$ ${entradaMovements.reduce((sum, m) => sum + m.total, 0).toFixed(2).replace('.', ',')}`],
      ['Quantidade Total de Produtos', `${entradaMovements.reduce((sum, m) => sum + m.quantity, 0)} unidades`],
      [''],
      ['ANÁLISE DE SAÍDAS'],
      ['Quantidade de Saídas', saidaMovements.length.toString()],
      ['Valor Total das Saídas', `R$ ${saidaMovements.reduce((sum, m) => sum + m.total, 0).toFixed(2).replace('.', ',')}`],
      ['Quantidade Total de Produtos', `${saidaMovements.reduce((sum, m) => sum + m.quantity, 0)} unidades`],
      [''],
      ['DETALHAMENTO COMPLETO DAS MOVIMENTAÇÕES'],
      ['Tipo de Movimento', 'Data da Movimentação', 'Nome do Produto', 'Quantidade Movimentada', 'Preço Unitário (R$)', 'Valor Total (R$)', 'Observações/Notas']
    ];

    // Adicionar detalhes das movimentações com formatação melhorada
    console.log('📝 Adicionando detalhes das movimentações...');
    periodMovements.forEach((movement, index) => {
      const product = products.find(p => p.id === movement.productId);
      const movementDate = new Date(movement.date);
      const formattedDate = movementDate.toLocaleDateString('pt-BR', {
        day: '2-digit',
        month: '2-digit', 
        year: 'numeric'
      });
      
      console.log(`  - Movimentação ${index + 1}:`, {
        type: movement.type,
        date: formattedDate,
        product: product?.name || 'NÃO ENCONTRADO',
        quantity: movement.quantity,
        unitPrice: movement.unitPrice,
        total: movement.total
      });
      
      reportHeader.push([
        movement.type === 'entrada' ? 'ENTRADA' : 'SAÍDA',
        formattedDate,
        product ? product.name : 'PRODUTO NÃO ENCONTRADO',
        movement.quantity.toString(),
        movement.unitPrice.toFixed(2).replace('.', ','),
        movement.total.toFixed(2).replace('.', ','),
        movement.description || 'Sem observações'
      ]);
    });

    // Adicionar rodapé do relatório
    reportHeader.push([
      '',
      '',
      '',
      '',
      '',
      '',
      ''
    ]);
    reportHeader.push([
      'RELATÓRIO GERADO AUTOMATICAMENTE PELO SISTEMA FLEXI GESTOR',
      '',
      '',
      '',
      '',
      '',
      ''
    ]);

    // Converter para string CSV com formatação profissional
    const csvContent = reportHeader.map(row => 
      row.map(field => {
        // Tratar campos especiais e formatação
        if (typeof field === 'string') {
          // Se o campo contém caracteres especiais, envolver em aspas
          if (field.includes(',') || field.includes(';') || field.includes('\n') || field.includes('"') || field.includes('R$')) {
            return `"${field.replace(/"/g, '""')}"`; // Escapar aspas duplas
          }
          // Se o campo está vazio, retornar espaço
          if (field === '') {
            return ' ';
          }
        }
        return field;
      }).join(';') // Usar ponto e vírgula como separador (padrão Excel)
    ).join('\n');

    console.log('💾 CSV gerado com sucesso!');
    console.log('  - Linhas:', reportHeader.length);
    console.log('  - Tamanho:', csvContent.length, 'caracteres');

    // Criar e baixar o arquivo com nome profissional
    const currentDate = new Date().toISOString().split('T')[0];
    const periodText = period === 'todos' ? 'TODOS' : period === 'mes' ? 'MENSAL' : period === 'trimestre' ? 'TRIMESTRAL' : 'ANUAL';
    const fileName = `RELATORIO_FLEXI_GESTOR_${periodText}_${currentDate}.csv`;
    
    const blob = new Blob(['\ufeff' + csvContent], { 
      type: 'text/csv;charset=utf-8;' 
    });
    
    const link = document.createElement('a');
    const url = URL.createObjectURL(blob);
    
    link.setAttribute('href', url);
    link.setAttribute('download', fileName);
    link.style.visibility = 'hidden';
    
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    
    // Limpar URL para evitar vazamentos de memória
    URL.revokeObjectURL(url);
    
    console.log('✅ Arquivo CSV baixado:', fileName);
  };

  return (
    <main className="flex-1 p-4 sm:p-6 space-y-4 sm:space-y-6">
            <div>
              <h1 className="text-2xl sm:text-3xl font-bold">Relatórios</h1>
              <p className="text-sm sm:text-base text-muted-foreground">Análises e relatórios do sistema</p>
            </div>
            
            {/* Filtros e Exportação */}
            <Card className="bg-gradient-to-r from-slate-50 to-gray-50 border-slate-200">
              <CardHeader className="pb-4">
                <CardTitle className="flex items-center gap-2 text-slate-800">
                  <Calendar className="w-5 h-5 text-slate-600" />
                  📅 Filtros e Exportação
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="flex flex-col sm:flex-row items-start sm:items-center gap-4">
                  {/* Seletor de Período */}
                  <div className="flex flex-col sm:flex-row items-start sm:items-center gap-3 w-full sm:w-auto">
                    <div className="flex items-center gap-2">
                      <div className="w-2 h-2 bg-blue-500 rounded-full"></div>
                      <span className="text-sm font-medium text-slate-700">Período de Análise:</span>
                    </div>
                    <Select value={period} onValueChange={setPeriod}>
                      <SelectTrigger className="w-full sm:w-48 bg-white border-slate-300 hover:border-slate-400 transition-colors">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="todos">📊 Todos os Períodos</SelectItem>
                        <SelectItem value="mes">📅 Este Mês</SelectItem>
                        <SelectItem value="trimestre">📈 Este Trimestre</SelectItem>
                        <SelectItem value="ano">📊 Este Ano</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  
                  {/* Botão de Exportação */}
                  <Button 
                    variant="outline" 
                    size="sm" 
                    onClick={exportReportsToCSV}
                    className="w-full sm:w-auto bg-white border-slate-300 hover:bg-slate-50 hover:border-slate-400 transition-all duration-200 shadow-sm hover:shadow-md"
                  >
                    <Download className="w-4 h-4 mr-2" />
                    📥 Exportar CSV
                  </Button>
                </div>
                
                {/* Informação do Período Selecionado */}
                <div className="mt-4 p-3 bg-blue-50 rounded-lg border border-blue-200">
                  <div className="flex items-center gap-2">
                    <div className="w-2 h-2 bg-blue-500 rounded-full"></div>
                    <span className="text-sm font-medium text-blue-800">
                      Período Atual: {
                        period === 'todos' ? '📊 Todos os Períodos' : 
                        period === 'mes' ? '📅 Este Mês' : 
                        period === 'trimestre' ? '📈 Este Trimestre' : 
                        '📊 Este Ano'
                      }
                    </span>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Cards de Estatísticas */}
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 sm:gap-6">
              {/* Card Total de Produtos */}
              <Card className="bg-gradient-to-br from-blue-50 to-blue-100 border-blue-200 hover:shadow-lg transition-all duration-300">
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                  <CardTitle className="text-sm font-medium text-blue-800">📦 Total de Produtos</CardTitle>
                  <Package className="h-5 w-5 text-blue-600" />
                </CardHeader>
                <CardContent>
                  <div className="text-3xl font-bold text-blue-700 mb-1">{totalProducts}</div>
                  <p className="text-xs text-blue-600">Produtos cadastrados</p>
                </CardContent>
              </Card>

              {/* Card Valor do Estoque */}
              <Card className="bg-gradient-to-br from-green-50 to-green-100 border-green-200 hover:shadow-lg transition-all duration-300">
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                  <CardTitle className="text-sm font-medium text-green-800">💰 Valor do Estoque</CardTitle>
                  <TrendingUp className="h-5 w-5 text-green-600" />
                </CardHeader>
                <CardContent>
                  <div className="text-3xl font-bold text-green-700 mb-1">R$ {totalStockValue.toFixed(2).replace('.', ',')}</div>
                  <p className="text-xs text-green-600">Valor total em estoque</p>
                </CardContent>
              </Card>

              {/* Card Estoque Baixo */}
              <Card className="bg-gradient-to-br from-red-50 to-red-100 border-red-200 hover:shadow-lg transition-all duration-300">
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                  <CardTitle className="text-sm font-medium text-red-800">⚠️ Estoque Baixo</CardTitle>
                  <TrendingDown className="h-5 w-5 text-red-600" />
                </CardHeader>
                <CardContent>
                  <div className="text-3xl font-bold text-red-700 mb-1">{lowStockProducts.length}</div>
                  <p className="text-xs text-red-600">Produtos com estoque baixo</p>
                </CardContent>
              </Card>

              {/* Card Movimentações */}
              <Card className="bg-gradient-to-br from-purple-50 to-purple-100 border-purple-200 hover:shadow-lg transition-all duration-300">
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                  <CardTitle className="text-sm font-medium text-purple-800">📊 Movimentações</CardTitle>
                  <BarChart3 className="h-5 w-5 text-purple-600" />
                </CardHeader>
                <CardContent>
                  <div className="text-3xl font-bold text-purple-700 mb-1">{totalMovements}</div>
                  <p className="text-xs text-purple-600">Total de movimentações</p>
                </CardContent>
              </Card>
            </div>

            {/* Relatórios Detalhados */}
            <div className="grid grid-cols-1 xl:grid-cols-2 gap-4 sm:gap-6">
              {/* Relatório de Entradas */}
              <Card className="bg-gradient-to-br from-blue-50 to-blue-100 border-blue-200 hover:shadow-lg transition-all duration-300">
                <CardHeader className="pb-4">
                  <CardTitle className="flex items-center gap-3 text-blue-800">
                    <div className="p-2 bg-blue-200 rounded-lg">
                      <TrendingUp className="w-6 h-6 text-blue-700" />
                    </div>
                    <div>
                      <div className="text-lg font-bold">📥 Relatório de Entradas</div>
                      <div className="text-sm font-normal text-blue-600">Análise de produtos recebidos</div>
                    </div>
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-6">
                  {/* Total de Entradas */}
                  <div className="flex items-center justify-between p-3 bg-white/50 rounded-lg border border-blue-200">
                    <div className="flex items-center gap-2">
                      <div className="w-3 h-3 bg-blue-500 rounded-full"></div>
                      <span className="text-sm font-medium text-blue-800">Total de Entradas:</span>
                    </div>
                    <span className="text-2xl font-bold text-blue-700">{entradaMovements.length}</span>
                  </div>
                  
                  {/* Valor Total */}
                  <div className="flex items-center justify-between p-3 bg-white/50 rounded-lg border border-blue-200">
                    <div className="flex items-center gap-2">
                      <div className="w-3 h-3 bg-green-500 rounded-full"></div>
                      <span className="text-sm font-medium text-blue-800">Valor Total:</span>
                    </div>
                    <span className="text-2xl font-bold text-green-600">
                      R$ {entradaMovements.reduce((sum, m) => sum + m.total, 0).toFixed(2).replace('.', ',')}
                    </span>
                  </div>
                  
                  {/* Quantidade Total */}
                  <div className="flex items-center justify-between p-3 bg-white/50 rounded-lg border border-blue-200">
                    <div className="flex items-center gap-2">
                      <div className="w-3 h-3 bg-purple-500 rounded-full"></div>
                      <span className="text-sm font-medium text-blue-800">Quantidade Total:</span>
                    </div>
                    <span className="text-2xl font-bold text-purple-600">
                      {entradaMovements.reduce((sum, m) => sum + m.quantity, 0)} unidades
                    </span>
                  </div>
                </CardContent>
              </Card>

              {/* Relatório de Saídas */}
              <Card className="bg-gradient-to-br from-red-50 to-red-100 border-red-200 hover:shadow-lg transition-all duration-300">
                <CardHeader className="pb-4">
                  <CardTitle className="flex items-center gap-3 text-red-800">
                    <div className="p-2 bg-red-200 rounded-lg">
                      <TrendingDown className="w-6 h-6 text-red-700" />
                    </div>
                    <div>
                      <div className="text-lg font-bold">📤 Relatório de Saídas</div>
                      <div className="text-sm font-normal text-red-600">Análise de produtos vendidos</div>
                    </div>
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-6">
                  {/* Total de Saídas */}
                  <div className="flex items-center justify-between p-3 bg-white/50 rounded-lg border border-red-200">
                    <div className="flex items-center gap-2">
                      <div className="w-3 h-3 bg-red-500 rounded-full"></div>
                      <span className="text-sm font-medium text-red-800">Total de Saídas:</span>
                    </div>
                    <span className="text-2xl font-bold text-red-700">{saidaMovements.length}</span>
                  </div>
                  
                  {/* Valor Total */}
                  <div className="flex items-center justify-between p-3 bg-white/50 rounded-lg border border-red-200">
                    <div className="flex items-center gap-2">
                      <div className="w-3 h-3 bg-orange-500 rounded-full"></div>
                      <span className="text-sm font-medium text-red-800">Valor Total:</span>
                    </div>
                    <span className="text-2xl font-bold text-orange-600">
                      R$ {saidaMovements.reduce((sum, m) => sum + m.total, 0).toFixed(2).replace('.', ',')}
                    </span>
                  </div>
                  
                  {/* Quantidade Total */}
                  <div className="flex items-center justify-between p-3 bg-white/50 rounded-lg border border-red-200">
                    <div className="flex items-center gap-2">
                      <div className="w-3 h-3 bg-pink-500 rounded-full"></div>
                      <span className="text-sm font-medium text-red-800">Quantidade Total:</span>
                    </div>
                    <span className="text-2xl font-bold text-pink-600">
                      {saidaMovements.reduce((sum, m) => sum + m.quantity, 0)} unidades
                    </span>
                  </div>
                </CardContent>
              </Card>
            </div>
          </main>
        );
};

export default Relatorios;
