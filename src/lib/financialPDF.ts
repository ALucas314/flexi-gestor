/**
 * 📄 Utilitário para Gerar Relatório Financeiro em PDF
 * 
 * Gera relatório completo com análises, tabelas e gráficos comparativos
 */

export interface FinancialReportData {
  period: string;
  periodText: string;
  totalProducts: number;
  totalStockValue: number;
  totalEntradas: number;
  totalSaidas: number;
  saldo: number;
  lucroTotal: number;
  totalMovements: number;
  productosMovimentados: number;
  thisMonthMovements: number;
  lowStockProducts: Array<{
    id: string;
    name: string;
    sku: string;
    stock: number;
    minStock: number;
  }>;
  topProducts: Array<{
    id: string;
    name: string;
    stock: number;
    totalValue: number;
    unitPrice: number;
  }>;
  movements: Array<{
    id: string;
    date: string;
    type: string;
    productName: string;
    description: string;
    quantity: number;
    unitPrice: number;
    total: number;
    paymentMethod: string;
  }>;
  monthlyData: Array<{
    month: string;
    entradas: number;
    saidas: number;
  }>;
  profitByProduct: Array<{
    productName: string;
    totalVenda: number;
    lucro: number;
    margem: number;
  }>;
}

/**
 * Gera o HTML do relatório financeiro completo
 */
export const generateFinancialReportHTML = (data: FinancialReportData): string => {
  const {
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
    thisMonthMovements,
    lowStockProducts,
    topProducts,
    movements,
    monthlyData,
    profitByProduct
  } = data;

  const formatCurrency = (value: number) => {
    return `R$ ${value.toLocaleString('pt-BR', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('pt-BR');
  };

  // Gerar HTML do gráfico mensal (tabela)
  const monthlyChartHTML = monthlyData.length > 0 ? `
    <div class="section">
      <h2 class="section-title">📊 Comparativo Mensal</h2>
      <table class="data-table">
        <thead>
          <tr>
            <th>Mês</th>
            <th class="text-right">Entradas (Custos)</th>
            <th class="text-right">Saídas (Receitas)</th>
            <th class="text-right">Saldo</th>
          </tr>
        </thead>
        <tbody>
          ${monthlyData.map(item => `
            <tr>
              <td>${item.month}</td>
              <td class="text-right">${formatCurrency(item.entradas)}</td>
              <td class="text-right">${formatCurrency(item.saidas)}</td>
              <td class="text-right ${item.saidas - item.entradas >= 0 ? 'positive' : 'negative'}">
                ${formatCurrency(item.saidas - item.entradas)}
              </td>
            </tr>
          `).join('')}
        </tbody>
      </table>
    </div>
  ` : '';

  // HTML do relatório completo
  return `
<!DOCTYPE html>
<html lang="pt-BR">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Relatório Financeiro - Flexi Gestor</title>
  <style>
    * {
      margin: 0;
      padding: 0;
      box-sizing: border-box;
    }

    body {
      font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif;
      padding: 20px;
      background: white;
      color: #333;
      font-size: 11pt;
      line-height: 1.6;
    }

    .header {
      text-align: center;
      margin-bottom: 30px;
      padding-bottom: 20px;
      border-bottom: 3px solid #3b82f6;
    }

    .logo {
      font-size: 32pt;
      font-weight: bold;
      color: #3b82f6;
      margin-bottom: 10px;
    }

    .company-name {
      font-size: 20pt;
      font-weight: bold;
      color: #1e40af;
      margin-bottom: 5px;
    }

    .report-title {
      font-size: 24pt;
      font-weight: bold;
      color: #1e40af;
      margin: 20px 0;
    }

    .report-info {
      background: #f3f4f6;
      padding: 15px;
      border-radius: 8px;
      margin-bottom: 20px;
    }

    .report-info-row {
      display: flex;
      justify-content: space-between;
      margin: 5px 0;
    }

    .kpi-grid {
      display: grid;
      grid-template-columns: repeat(2, 1fr);
      gap: 15px;
      margin: 20px 0;
    }

    .kpi-card {
      background: linear-gradient(135deg, #f3f4f6 0%, #e5e7eb 100%);
      padding: 15px;
      border-radius: 8px;
      border-left: 4px solid #3b82f6;
    }

    .kpi-label {
      font-size: 10pt;
      color: #6b7280;
      margin-bottom: 5px;
    }

    .kpi-value {
      font-size: 18pt;
      font-weight: bold;
      color: #1e40af;
    }

    .section {
      margin: 30px 0;
      page-break-inside: avoid;
    }

    .section-title {
      font-size: 16pt;
      font-weight: bold;
      color: #1e40af;
      margin-bottom: 15px;
      padding-bottom: 8px;
      border-bottom: 2px solid #3b82f6;
    }

    .data-table {
      width: 100%;
      border-collapse: collapse;
      margin: 15px 0;
      font-size: 10pt;
    }

    .data-table th {
      background: #3b82f6;
      color: white;
      padding: 10px;
      text-align: left;
      font-weight: bold;
    }

    .data-table td {
      padding: 8px 10px;
      border-bottom: 1px solid #e5e7eb;
    }

    .data-table tr:hover {
      background: #f9fafb;
    }

    .text-right {
      text-align: right;
    }

    .positive {
      color: #10b981;
      font-weight: bold;
    }

    .negative {
      color: #ef4444;
      font-weight: bold;
    }

    .badge {
      display: inline-block;
      padding: 4px 8px;
      border-radius: 4px;
      font-size: 9pt;
      font-weight: bold;
    }

    .badge-critical {
      background: #fee2e2;
      color: #991b1b;
    }

    .badge-low {
      background: #fef3c7;
      color: #92400e;
    }

    .footer {
      margin-top: 40px;
      padding-top: 20px;
      border-top: 2px solid #e5e7eb;
      text-align: center;
      color: #6b7280;
      font-size: 9pt;
    }

    @media print {
      body {
        padding: 10px;
      }

      .section {
        page-break-inside: avoid;
      }

      @page {
        size: A4;
        margin: 15mm;
      }
    }
  </style>
</head>
<body>
  <!-- Cabeçalho -->
  <div class="header">
    <div class="logo">FG</div>
    <div class="company-name">Flexi Gestor</div>
    <div>Sistema de Gestão Empresarial</div>
  </div>

  <!-- Título do Relatório -->
  <h1 class="report-title">Relatório Financeiro Completo</h1>

  <!-- Informações do Relatório -->
  <div class="report-info">
    <div class="report-info-row">
      <span><strong>Período Analisado:</strong></span>
      <span>${periodText}</span>
    </div>
    <div class="report-info-row">
      <span><strong>Data de Geração:</strong></span>
      <span>${new Date().toLocaleString('pt-BR')}</span>
    </div>
  </div>

  <!-- KPIs Principais -->
  <div class="section">
    <h2 class="section-title">📊 Indicadores Principais (KPIs)</h2>
    <div class="kpi-grid">
      <div class="kpi-card">
        <div class="kpi-label">Total de Produtos</div>
        <div class="kpi-value">${totalProducts}</div>
        <div style="font-size: 9pt; color: #6b7280; margin-top: 5px;">Produtos cadastrados</div>
      </div>
      <div class="kpi-card">
        <div class="kpi-label">Valor Total do Estoque</div>
        <div class="kpi-value">${formatCurrency(totalStockValue)}</div>
        <div style="font-size: 9pt; color: #6b7280; margin-top: 5px;">Valor investido</div>
      </div>
      <div class="kpi-card">
        <div class="kpi-label">Total Entradas</div>
        <div class="kpi-value">${formatCurrency(totalEntradas)}</div>
        <div style="font-size: 9pt; color: #6b7280; margin-top: 5px;">Custos de compra</div>
      </div>
      <div class="kpi-card">
        <div class="kpi-label">Total Saídas</div>
        <div class="kpi-value">${formatCurrency(totalSaidas)}</div>
        <div style="font-size: 9pt; color: #6b7280; margin-top: 5px;">Receitas de venda</div>
      </div>
      <div class="kpi-card">
        <div class="kpi-label">Saldo Final</div>
        <div class="kpi-value ${saldo >= 0 ? 'positive' : 'negative'}">
          ${saldo >= 0 ? '+' : ''}${formatCurrency(saldo)}
        </div>
        <div style="font-size: 9pt; color: #6b7280; margin-top: 5px;">
          ${saldo >= 0 ? 'Lucro' : 'Prejuízo'}
        </div>
      </div>
      <div class="kpi-card">
        <div class="kpi-label">Lucro Total</div>
        <div class="kpi-value ${lucroTotal >= 0 ? 'positive' : 'negative'}">
          ${lucroTotal >= 0 ? '+' : ''}${formatCurrency(lucroTotal)}
        </div>
        <div style="font-size: 9pt; color: #6b7280; margin-top: 5px;">Por produtos</div>
      </div>
    </div>
  </div>

  <!-- Análise Comparativa -->
  <div class="section">
    <h2 class="section-title">📈 Análise Comparativa: Entradas vs Saídas</h2>
    <div class="kpi-grid">
      <div class="kpi-card">
        <div class="kpi-label">Total Entradas</div>
        <div class="kpi-value">${formatCurrency(totalEntradas)}</div>
        <div style="font-size: 9pt; color: #6b7280; margin-top: 5px;">${movements.filter(m => m.type === 'entrada').length} registros</div>
      </div>
      <div class="kpi-card">
        <div class="kpi-label">Total Saídas</div>
        <div class="kpi-value">${formatCurrency(totalSaidas)}</div>
        <div style="font-size: 9pt; color: #6b7280; margin-top: 5px;">${movements.filter(m => m.type === 'saida').length} registros</div>
      </div>
      <div class="kpi-card">
        <div class="kpi-label">Saldo Final</div>
        <div class="kpi-value ${saldo >= 0 ? 'positive' : 'negative'}">
          ${saldo >= 0 ? '+' : ''}${formatCurrency(saldo)}
        </div>
        <div style="font-size: 9pt; color: #6b7280; margin-top: 5px;">
          ${saldo >= 0 ? 'Lucro' : 'Prejuízo'}
        </div>
      </div>
    </div>
    ${monthlyChartHTML}
  </div>

  <!-- Produtos com Estoque Baixo -->
  ${lowStockProducts.length > 0 ? `
    <div class="section">
      <h2 class="section-title">⚠️ Produtos com Estoque Baixo</h2>
      <table class="data-table">
        <thead>
          <tr>
            <th>Produto</th>
            <th>SKU</th>
            <th class="text-right">Estoque Atual</th>
            <th class="text-right">Estoque Mínimo</th>
            <th>Status</th>
          </tr>
        </thead>
        <tbody>
          ${lowStockProducts.map(product => `
            <tr>
              <td>${product.name}</td>
              <td>${product.sku}</td>
              <td class="text-right">${product.stock}</td>
              <td class="text-right">${product.minStock}</td>
              <td>
                <span class="badge ${product.stock === 0 ? 'badge-critical' : 'badge-low'}">
                  ${product.stock === 0 ? 'Esgotado' : 'Estoque Baixo'}
                </span>
              </td>
            </tr>
          `).join('')}
        </tbody>
      </table>
    </div>
  ` : ''}

  <!-- Top 5 Mais Valiosos -->
  ${topProducts.length > 0 ? `
    <div class="section">
      <h2 class="section-title">🏆 Top ${topProducts.length} Produtos Mais Valiosos</h2>
      <table class="data-table">
        <thead>
          <tr>
            <th>Posição</th>
            <th>Produto</th>
            <th class="text-right">Estoque</th>
            <th class="text-right">Valor Unit.</th>
            <th class="text-right">Valor Total</th>
          </tr>
        </thead>
        <tbody>
          ${topProducts.map((product, index) => `
            <tr>
              <td><strong>${index + 1}º</strong></td>
              <td>${product.name}</td>
              <td class="text-right">${product.stock} unidades</td>
              <td class="text-right">${formatCurrency(product.unitPrice)}</td>
              <td class="text-right"><strong>${formatCurrency(product.totalValue)}</strong></td>
            </tr>
          `).join('')}
        </tbody>
      </table>
    </div>
  ` : ''}

  <!-- Lucro por Produto -->
  ${profitByProduct.length > 0 ? `
    <div class="section">
      <h2 class="section-title">💰 Lucro por Produto</h2>
      <table class="data-table">
        <thead>
          <tr>
            <th>Produto</th>
            <th class="text-right">Total Venda</th>
            <th class="text-right">Lucro</th>
            <th class="text-right">Margem (%)</th>
          </tr>
        </thead>
        <tbody>
          ${profitByProduct.slice(0, 20).map(product => `
            <tr>
              <td>${product.productName}</td>
              <td class="text-right">${formatCurrency(product.totalVenda)}</td>
              <td class="text-right ${product.lucro >= 0 ? 'positive' : 'negative'}">
                ${product.lucro >= 0 ? '+' : ''}${formatCurrency(product.lucro)}
              </td>
              <td class="text-right ${product.margem >= 0 ? 'positive' : 'negative'}">
                ${product.margem >= 0 ? '+' : ''}${product.margem.toFixed(2)}%
              </td>
            </tr>
          `).join('')}
        </tbody>
      </table>
      ${profitByProduct.length > 20 ? `<p style="margin-top: 10px; font-size: 9pt; color: #6b7280;">Mostrando 20 de ${profitByProduct.length} produtos</p>` : ''}
    </div>
  ` : ''}

  <!-- Movimentações Detalhadas -->
  <div class="section">
    <h2 class="section-title">📋 Histórico de Movimentações</h2>
    <table class="data-table">
      <thead>
        <tr>
          <th>Data</th>
          <th>Tipo</th>
          <th>Produto</th>
          <th class="text-right">Quantidade</th>
          <th class="text-right">Valor Unit.</th>
          <th class="text-right">Total</th>
          <th>Pagamento</th>
        </tr>
      </thead>
      <tbody>
        ${movements.slice(0, 50).map(movement => `
          <tr>
            <td>${formatDate(movement.date)}</td>
            <td>
              <span class="badge ${movement.type === 'entrada' ? 'badge-low' : 'badge-critical'}">
                ${movement.type === 'entrada' ? 'Entrada' : 'Saída'}
              </span>
            </td>
            <td>${movement.productName}</td>
            <td class="text-right">${movement.quantity}</td>
            <td class="text-right">${formatCurrency(movement.unitPrice)}</td>
            <td class="text-right"><strong>${formatCurrency(movement.total)}</strong></td>
            <td>${movement.paymentMethod || '-'}</td>
          </tr>
        `).join('')}
      </tbody>
    </table>
    ${movements.length > 50 ? `<p style="margin-top: 10px; font-size: 9pt; color: #6b7280;">Mostrando 50 de ${movements.length} movimentações</p>` : ''}
  </div>

  <!-- Estatísticas Adicionais -->
  <div class="section">
    <h2 class="section-title">📊 Estatísticas Adicionais</h2>
    <div class="report-info">
      <div class="report-info-row">
        <span><strong>Total de Movimentações:</strong></span>
        <span>${totalMovements}</span>
      </div>
      <div class="report-info-row">
        <span><strong>Produtos Movimentados:</strong></span>
        <span>${productosMovimentados}</span>
      </div>
      <div class="report-info-row">
        <span><strong>Movimentações Este Mês:</strong></span>
        <span>${thisMonthMovements}</span>
      </div>
      ${totalSaidas > 0 ? `
        <div class="report-info-row">
          <span><strong>Margem de Lucro:</strong></span>
          <span class="${saldo >= 0 ? 'positive' : 'negative'}">
            ${((saldo / totalSaidas) * 100).toFixed(2)}%
          </span>
        </div>
      ` : ''}
    </div>
  </div>

  <!-- Rodapé -->
  <div class="footer">
    <p><strong>Relatório gerado automaticamente pelo Sistema Flexi Gestor</strong></p>
    <p>Versão 1.1 - Sistema de Gestão Empresarial</p>
    <p>Exportado em ${new Date().toLocaleString('pt-BR')}</p>
  </div>
</body>
</html>
  `;
};

/**
 * Exporta o relatório financeiro como PDF
 */
export const exportFinancialReportToPDF = (data: FinancialReportData, onError?: (message: string) => void) => {
  try {
    const html = generateFinancialReportHTML(data);
    const printWindow = window.open('', '_blank', 'width=800,height=600');
    
    if (printWindow) {
      printWindow.document.write(html);
      printWindow.document.close();
      
      // Aguardar um pouco para garantir que o conteúdo foi carregado
      setTimeout(() => {
        printWindow.print();
      }, 250);
    } else {
      if (onError) {
        onError('Por favor, permita pop-ups para gerar o PDF');
      }
    }
  } catch (error) {
    if (onError) {
      onError(`Erro ao gerar PDF: ${error instanceof Error ? error.message : 'Erro desconhecido'}`);
    }
  }
};

