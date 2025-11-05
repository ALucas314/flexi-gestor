/**
 * 📄 Utilitário para Gerar Receitas em PDF
 * 
 * Gera receitas formatadas que podem ser impressas ou salvas como PDF
 * usando a função de impressão do navegador
 */

export interface ReceiptData {
  type: 'saida' | 'entrada';
  receiptNumber?: string;
  date: Date;
  customer?: string;
  supplier?: string;
  productName: string;
  quantity: number;
  unitPrice: number;
  totalPrice: number;
  paymentMethod?: string;
  notes?: string;
}

/**
 * Gera o HTML da receita
 */
const generateReceiptHTML = (data: ReceiptData): string => {
  const {
    type,
    receiptNumber,
    date,
    customer,
    supplier,
    productName,
    quantity,
    unitPrice,
    totalPrice,
    paymentMethod,
    notes
  } = data;

  const isSaida = type === 'saida';
  const title = isSaida ? 'RECEITA DE VENDA' : 'COMPROVANTE DE COMPRA';
  const clientLabel = isSaida ? 'Cliente' : 'Fornecedor';
  const clientName = isSaida ? customer : supplier;

  return `
<!DOCTYPE html>
<html lang="pt-BR">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>${title} - ${receiptNumber || 'S/N'}</title>
  <style>
    * {
      margin: 0;
      padding: 0;
      box-sizing: border-box;
    }

    body {
      font-family: 'Courier New', Courier, monospace;
      padding: 20mm;
      background: white;
      color: #000;
      font-size: 12pt;
    }

    .receipt {
      max-width: 80mm;
      margin: 0 auto;
      border: 2px solid #000;
      padding: 15px;
    }

    .header {
      text-align: center;
      margin-bottom: 20px;
      padding-bottom: 15px;
      border-bottom: 2px dashed #000;
    }

    .logo {
      font-size: 24pt;
      font-weight: bold;
      margin-bottom: 5px;
    }

    .company-name {
      font-size: 14pt;
      font-weight: bold;
      margin-bottom: 3px;
    }

    .title {
      font-size: 16pt;
      font-weight: bold;
      margin: 10px 0;
      text-align: center;
      padding: 10px;
      background: #000;
      color: #fff;
    }

    .info-section {
      margin: 15px 0;
      padding: 10px 0;
      border-bottom: 1px dashed #000;
    }

    .info-row {
      display: flex;
      justify-content: space-between;
      margin: 8px 0;
      line-height: 1.5;
    }

    .label {
      font-weight: bold;
      text-transform: uppercase;
    }

    .value {
      text-align: right;
    }

    .product-section {
      margin: 20px 0;
      padding: 15px;
      background: #f5f5f5;
      border: 2px solid #000;
    }

    .product-name {
      font-size: 14pt;
      font-weight: bold;
      margin-bottom: 10px;
      text-align: center;
    }

    .calculation {
      margin: 10px 0;
      font-size: 11pt;
    }

    .total {
      margin-top: 15px;
      padding-top: 15px;
      border-top: 2px solid #000;
      font-size: 16pt;
      font-weight: bold;
      text-align: center;
    }

    .notes {
      margin: 15px 0;
      padding: 10px;
      background: #fffacd;
      border: 1px solid #000;
    }

    .notes-title {
      font-weight: bold;
      margin-bottom: 5px;
    }

    .footer {
      text-align: center;
      margin-top: 20px;
      padding-top: 15px;
      border-top: 2px dashed #000;
    }

    .thank-you {
      font-size: 12pt;
      margin: 10px 0;
    }

    .branding {
      font-size: 10pt;
      color: #666;
      margin-top: 10px;
    }

    @media print {
      body {
        padding: 0;
      }

      .receipt {
        border: none;
        max-width: none;
      }

      @page {
        size: 80mm auto;
        margin: 0;
      }
    }
  </style>
</head>
<body>
  <div class="receipt">
    <!-- Cabeçalho -->
    <div class="header">
      <div class="logo">🛍️ FG</div>
      <div class="company-name">Flexi Gestor</div>
      <div>Sistema de Gestão</div>
    </div>

    <!-- Título -->
    <div class="title">${title}</div>

    <!-- Informações da Receita -->
    <div class="info-section">
      ${receiptNumber ? `
      <div class="info-row">
        <span class="label">Nº ${isSaida ? 'Receita' : 'Compra'}:</span>
        <span class="value">${receiptNumber}</span>
      </div>
      ` : ''}
      
      <div class="info-row">
        <span class="label">Data:</span>
        <span class="value">${new Date(date).toLocaleString('pt-BR', {
          day: '2-digit',
          month: '2-digit',
          year: 'numeric',
          hour: '2-digit',
          minute: '2-digit'
        })}</span>
      </div>

      ${clientName ? `
      <div class="info-row">
        <span class="label">${clientLabel}:</span>
        <span class="value">${clientName}</span>
      </div>
      ` : ''}

      ${paymentMethod ? `
      <div class="info-row">
        <span class="label">Pagamento:</span>
        <span class="value">${paymentMethod}</span>
      </div>
      ` : ''}
    </div>

    <!-- Produto -->
    <div class="product-section">
      <div class="product-name">${productName}</div>
      
      <div class="calculation">
        <div class="info-row">
          <span>Quantidade:</span>
          <span>${quantity} un.</span>
        </div>
        <div class="info-row">
          <span>Preço Unit.:</span>
          <span>R$ ${unitPrice.toFixed(2)}</span>
        </div>
        <div class="info-row">
          <span>Cálculo:</span>
          <span>${quantity} × R$ ${unitPrice.toFixed(2)}</span>
        </div>
      </div>

      <div class="total">
        TOTAL: R$ ${totalPrice.toFixed(2)}
      </div>
    </div>

    <!-- Observações -->
    ${notes ? `
    <div class="notes">
      <div class="notes-title">📝 Observações:</div>
      <div>${notes}</div>
    </div>
    ` : ''}

    <!-- Rodapé -->
    <div class="footer">
      <div class="thank-you">
        ${isSaida ? 'Obrigado pela preferência!' : 'Compra registrada com sucesso!'}
      </div>
      <div class="branding">
        ${isSaida ? '💚' : '📦'} Flexi Gestor - ${isSaida ? 'Gestão Inteligente' : 'Controle de Estoque'}
      </div>
      <div style="margin-top: 15px; font-size: 8pt; color: #999;">
        Este documento é uma via informativa
      </div>
    </div>
  </div>

  <script>
    // Auto-abrir diálogo de impressão
    window.onload = function() {
      window.print();
    };

    // Fechar janela após impressão (opcional)
    window.onafterprint = function() {
      window.close();
    };
  </script>
</body>
</html>
  `.trim();
};

/**
 * Gera e abre uma janela de impressão com a receita formatada
 */
export const printReceipt = (data: ReceiptData, onError?: (message: string) => void) => {
  const html = generateReceiptHTML(data);

  // Tentar abrir janela de impressão
  const printWindow = window.open('', '', 'width=800,height=600');
  
  if (printWindow) {
    printWindow.document.write(html);
    printWindow.document.close();
  } else {
    if (onError) {
      onError('Por favor, permita pop-ups para imprimir a receita');
    }
  }
};

/**
 * Baixa a receita como arquivo HTML (pode ser salvo como PDF pelo navegador)
 */
export const downloadReceipt = (data: ReceiptData) => {
  // Primeiro tenta imprimir (usuário pode escolher "Salvar como PDF")
  printReceipt(data);
};

