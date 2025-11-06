/**
 * 📄 Utilitário para Gerar Relatório DRE em PDF
 * 
 * Gera Demonstração do Resultado do Exercício completa em PDF
 */

import { DREPDFData } from '@/types/financial';
import { formatarMoeda, formatarPercentual } from '@/lib/dre';

/**
 * Gera o HTML do relatório DRE completo
 */
export const generateDREHTML = (data: DREPDFData): string => {
  const { dre, periodo_texto, data_geracao, contas_pagar, contas_receber } = data;

  // HTML do relatório completo
  return `
<!DOCTYPE html>
<html lang="pt-BR">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>DRE - Demonstração do Resultado do Exercício</title>
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
      text-align: center;
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

    .dre-table {
      width: 100%;
      border-collapse: collapse;
      margin: 20px 0;
      font-size: 10pt;
    }

    .dre-table th {
      background: #3b82f6;
      color: white;
      padding: 12px;
      text-align: left;
      font-weight: bold;
      border: 1px solid #2563eb;
    }

    .dre-table td {
      padding: 10px 12px;
      border: 1px solid #e5e7eb;
    }

    .dre-table tr:nth-child(even) {
      background: #f9fafb;
    }

    .dre-table tr:hover {
      background: #f3f4f6;
    }

    .dre-row-title {
      font-weight: bold;
      background: #e0e7ff !important;
      color: #1e40af;
    }

    .dre-row-subtitle {
      font-weight: 600;
      background: #f3f4f6 !important;
      padding-left: 30px !important;
    }

    .dre-row-total {
      font-weight: bold;
      background: #dbeafe !important;
      color: #1e40af;
      border-top: 2px solid #3b82f6;
      border-bottom: 2px solid #3b82f6;
    }

    .dre-row-result {
      font-weight: bold;
      font-size: 12pt;
      background: ${dre.resultado_liquido >= 0 ? '#d1fae5' : '#fee2e2'} !important;
      color: ${dre.resultado_liquido >= 0 ? '#065f46' : '#991b1b'};
      border-top: 3px solid ${dre.resultado_liquido >= 0 ? '#10b981' : '#ef4444'};
      border-bottom: 3px solid ${dre.resultado_liquido >= 0 ? '#10b981' : '#ef4444'};
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

    .detail-table {
      width: 100%;
      border-collapse: collapse;
      margin: 15px 0;
      font-size: 9pt;
    }

    .detail-table th {
      background: #6b7280;
      color: white;
      padding: 8px;
      text-align: left;
      font-weight: bold;
    }

    .detail-table td {
      padding: 6px 8px;
      border-bottom: 1px solid #e5e7eb;
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
  <h1 class="report-title">Demonstração do Resultado do Exercício (DRE)</h1>

  <!-- Informações do Relatório -->
  <div class="report-info">
    <div class="report-info-row">
      <span><strong>Período:</strong></span>
      <span>${periodo_texto}</span>
    </div>
    <div class="report-info-row">
      <span><strong>Data de Geração:</strong></span>
      <span>${data_geracao.toLocaleString('pt-BR')}</span>
    </div>
    <div class="report-info-row">
      <span><strong>Data Início:</strong></span>
      <span>${dre.periodo_inicio.toLocaleDateString('pt-BR')}</span>
    </div>
    <div class="report-info-row">
      <span><strong>Data Fim:</strong></span>
      <span>${dre.periodo_fim.toLocaleDateString('pt-BR')}</span>
    </div>
  </div>

  <!-- DRE Principal -->
  <div class="section">
    <h2 class="section-title">📊 Demonstração do Resultado do Exercício</h2>
    <table class="dre-table">
      <!-- RECEITAS OPERACIONAIS -->
      <tr class="dre-row-title">
        <td colspan="2">RECEITAS OPERACIONAIS</td>
      </tr>
      <tr class="dre-row-subtitle">
        <td>Receita Operacional Bruta</td>
        <td class="text-right">${formatarMoeda(dre.receita_operacional_bruta)}</td>
      </tr>
      <tr class="dre-row-subtitle">
        <td>(-) Deduções de Vendas</td>
        <td class="text-right">${formatarMoeda(dre.deducoes_vendas)}</td>
      </tr>
      <tr class="dre-row-total">
        <td><strong>Receita Operacional Líquida</strong></td>
        <td class="text-right"><strong>${formatarMoeda(dre.receita_operacional_liquida)}</strong></td>
      </tr>

      <!-- CUSTOS -->
      <tr class="dre-row-title">
        <td colspan="2">CUSTOS</td>
      </tr>
      <tr class="dre-row-subtitle">
        <td>(-) Custo do Produto Vendido</td>
        <td class="text-right">${formatarMoeda(dre.custo_produto_vendido)}</td>
      </tr>
      <tr class="dre-row-total">
        <td><strong>Lucro Bruto</strong></td>
        <td class="text-right ${dre.lucro_bruto >= 0 ? 'positive' : 'negative'}">
          <strong>${formatarMoeda(dre.lucro_bruto)}</strong>
        </td>
      </tr>

      <!-- DESPESAS OPERACIONAIS -->
      <tr class="dre-row-title">
        <td colspan="2">DESPESAS OPERACIONAIS</td>
      </tr>
      <tr class="dre-row-subtitle">
        <td>(-) Despesas Administrativas</td>
        <td class="text-right">${formatarMoeda(dre.despesas_operacionais.administrativas)}</td>
      </tr>
      <tr class="dre-row-subtitle">
        <td>(-) Despesas Comerciais</td>
        <td class="text-right">${formatarMoeda(dre.despesas_operacionais.comerciais)}</td>
      </tr>
      <tr class="dre-row-subtitle">
        <td>(-) Despesas Financeiras</td>
        <td class="text-right">${formatarMoeda(dre.despesas_operacionais.financeiras)}</td>
      </tr>
      <tr class="dre-row-subtitle">
        <td>(-) Outras Despesas Operacionais</td>
        <td class="text-right">${formatarMoeda(dre.despesas_operacionais.outras)}</td>
      </tr>
      <tr class="dre-row-total">
        <td><strong>Total de Despesas Operacionais</strong></td>
        <td class="text-right"><strong>${formatarMoeda(dre.despesas_operacionais.total)}</strong></td>
      </tr>
      <tr class="dre-row-total">
        <td><strong>Resultado Operacional</strong></td>
        <td class="text-right ${dre.resultado_operacional >= 0 ? 'positive' : 'negative'}">
          <strong>${formatarMoeda(dre.resultado_operacional)}</strong>
        </td>
      </tr>

      <!-- RESULTADO FINANCEIRO -->
      <tr class="dre-row-title">
        <td colspan="2">RESULTADO FINANCEIRO</td>
      </tr>
      <tr class="dre-row-subtitle">
        <td>(+) Receitas Financeiras</td>
        <td class="text-right">${formatarMoeda(dre.receitas_financeiras)}</td>
      </tr>
      <tr class="dre-row-subtitle">
        <td>(-) Despesas Financeiras</td>
        <td class="text-right">${formatarMoeda(dre.despesas_financeiras)}</td>
      </tr>
      <tr class="dre-row-total">
        <td><strong>Resultado Financeiro</strong></td>
        <td class="text-right ${dre.resultado_financeiro >= 0 ? 'positive' : 'negative'}">
          <strong>${formatarMoeda(dre.resultado_financeiro)}</strong>
        </td>
      </tr>

      <!-- OUTRAS RECEITAS E DESPESAS -->
      <tr class="dre-row-title">
        <td colspan="2">OUTRAS RECEITAS E DESPESAS</td>
      </tr>
      <tr class="dre-row-subtitle">
        <td>(+) Outras Receitas</td>
        <td class="text-right">${formatarMoeda(dre.outras_receitas)}</td>
      </tr>
      <tr class="dre-row-subtitle">
        <td>(-) Outras Despesas</td>
        <td class="text-right">${formatarMoeda(dre.outras_despesas)}</td>
      </tr>
      <tr class="dre-row-total">
        <td><strong>Resultado Antes do Imposto</strong></td>
        <td class="text-right ${dre.resultado_antes_imposto >= 0 ? 'positive' : 'negative'}">
          <strong>${formatarMoeda(dre.resultado_antes_imposto)}</strong>
        </td>
      </tr>

      <!-- IMPOSTOS -->
      <tr class="dre-row-subtitle">
        <td>(-) Impostos</td>
        <td class="text-right">${formatarMoeda(dre.impostos)}</td>
      </tr>

      <!-- RESULTADO LÍQUIDO -->
      <tr class="dre-row-result">
        <td><strong>RESULTADO LÍQUIDO DO EXERCÍCIO</strong></td>
        <td class="text-right">
          <strong>${formatarMoeda(dre.resultado_liquido)}</strong>
        </td>
      </tr>
    </table>
  </div>

  <!-- Detalhamento de Receitas -->
  ${dre.detalhamento.receitas.length > 0 ? `
    <div class="section">
      <h2 class="section-title">💰 Detalhamento de Receitas</h2>
      ${dre.detalhamento.receitas.map(cat => `
        <table class="detail-table">
          <thead>
            <tr>
              <th colspan="2">${cat.categoria} - ${formatarMoeda(cat.valor)}</th>
            </tr>
            <tr>
              <th>Descrição</th>
              <th class="text-right">Valor</th>
            </tr>
          </thead>
          <tbody>
            ${cat.contas.map(conta => `
              <tr>
                <td>${conta.descricao}</td>
                <td class="text-right">${formatarMoeda(conta.valor)}</td>
              </tr>
            `).join('')}
          </tbody>
        </table>
      `).join('')}
    </div>
  ` : ''}

  <!-- Detalhamento de Custos -->
  ${dre.detalhamento.custos.length > 0 ? `
    <div class="section">
      <h2 class="section-title">📉 Detalhamento de Custos</h2>
      ${dre.detalhamento.custos.map(cat => `
        <table class="detail-table">
          <thead>
            <tr>
              <th colspan="2">${cat.categoria} - ${formatarMoeda(cat.valor)}</th>
            </tr>
            <tr>
              <th>Descrição</th>
              <th class="text-right">Valor</th>
            </tr>
          </thead>
          <tbody>
            ${cat.contas.map(conta => `
              <tr>
                <td>${conta.descricao}</td>
                <td class="text-right">${formatarMoeda(conta.valor)}</td>
              </tr>
            `).join('')}
          </tbody>
        </table>
      `).join('')}
    </div>
  ` : ''}

  <!-- Detalhamento de Despesas -->
  ${dre.detalhamento.despesas.length > 0 ? `
    <div class="section">
      <h2 class="section-title">💸 Detalhamento de Despesas</h2>
      ${dre.detalhamento.despesas.map(cat => `
        <table class="detail-table">
          <thead>
            <tr>
              <th colspan="2">${cat.categoria} - ${formatarMoeda(cat.valor)}</th>
            </tr>
            <tr>
              <th>Descrição</th>
              <th class="text-right">Valor</th>
            </tr>
          </thead>
          <tbody>
            ${cat.contas.map(conta => `
              <tr>
                <td>${conta.descricao}</td>
                <td class="text-right">${formatarMoeda(conta.valor)}</td>
              </tr>
            `).join('')}
          </tbody>
        </table>
      `).join('')}
    </div>
  ` : ''}

  <!-- Rodapé -->
  <div class="footer">
    <p><strong>Demonstração do Resultado do Exercício gerada automaticamente pelo Sistema Flexi Gestor</strong></p>
    <p>Versão 1.1 - Sistema de Gestão Empresarial</p>
    <p>Exportado em ${data_geracao.toLocaleString('pt-BR')}</p>
  </div>
</body>
</html>
  `;
};

/**
 * Exporta o DRE como PDF
 */
export const exportDREToPDF = (data: DREPDFData, onError?: (message: string) => void) => {
  try {
    const html = generateDREHTML(data);
    
    // Criar iframe oculto para gerar o PDF
    const iframe = document.createElement('iframe');
    iframe.style.position = 'fixed';
    iframe.style.right = '0';
    iframe.style.bottom = '0';
    iframe.style.width = '0';
    iframe.style.height = '0';
    iframe.style.border = 'none';
    iframe.style.opacity = '0';
    iframe.style.pointerEvents = 'none';
    
    document.body.appendChild(iframe);
    
    const iframeDoc = iframe.contentDocument || iframe.contentWindow?.document;
    
    if (!iframeDoc) {
      document.body.removeChild(iframe);
      if (onError) {
        onError('Erro ao criar iframe para gerar PDF');
      }
      return;
    }
    
    iframeDoc.open();
    iframeDoc.write(html);
    iframeDoc.close();
    
    let hasPrinted = false;
    
    const printPDF = () => {
      if (hasPrinted) return;
      hasPrinted = true;
      
      try {
        iframe.contentWindow?.print();
        
        setTimeout(() => {
          if (iframe.parentNode) {
            document.body.removeChild(iframe);
          }
        }, 1000);
      } catch (error) {
        if (iframe.parentNode) {
          document.body.removeChild(iframe);
        }
        if (onError) {
          onError(`Erro ao imprimir: ${error instanceof Error ? error.message : 'Erro desconhecido'}`);
        }
      }
    };
    
    iframe.onload = () => {
      setTimeout(printPDF, 300);
    };
    
    setTimeout(printPDF, 500);
    
  } catch (error) {
    if (onError) {
      onError(`Erro ao gerar PDF: ${error instanceof Error ? error.message : 'Erro desconhecido'}`);
    }
  }
};

