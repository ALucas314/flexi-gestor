/**
 * 📊 Tipos e Interfaces para Módulo Financeiro
 * 
 * Define as estruturas de dados para Contas a Pagar, Contas a Receber e DRE
 */

// Status de pagamento
export type StatusPagamento = 'pendente' | 'parcial' | 'pago';

// Status de recebimento
export type StatusRecebimento = 'pendente' | 'parcial' | 'recebido';

// Status de uma conta (legado - manter para compatibilidade)
export type AccountStatus = 'pendente' | 'pago' | 'vencido' | 'cancelado' | 'finalizado';

// Tipo de conta
export type AccountType = 'pagar' | 'receber';

// Forma de pagamento
export type FormaPagamento = 'cartao' | 'boleto' | 'transferencia' | 'pix' | 'parcelado' | 'dinheiro' | 'cheque';

// Origem do pagamento (de onde será debitado)
export type OrigemPagamento = 'caixa' | 'banco';

// Status de uma parcela
export type ParcelaStatus = 'pendente' | 'pago' | 'vencido';

/**
 * Interface para Parcela de uma Conta a Pagar
 */
export interface Parcela {
  id: string;
  conta_pagar_id: string;
  numero: number; // Número da parcela (1, 2, 3, etc.)
  valor: number;
  data_vencimento: Date;
  data_pagamento?: Date;
  status: ParcelaStatus;
  observacoes?: string;
  criado_em: Date;
  atualizado_em: Date;
}

// Categoria de despesa/receita para DRE
export type DRECategory = 
  | 'receita_operacional'
  | 'custo_produto_vendido'
  | 'despesa_operacional'
  | 'despesa_administrativa'
  | 'despesa_comercial'
  | 'despesa_financeira'
  | 'receita_financeira'
  | 'outras_receitas'
  | 'outras_despesas';

/**
 * Interface para Conta a Pagar
 */
export interface ContaPagar {
  id: string;
  lancamento: Date; // Data do lançamento
  observacoes?: string; // Texto livre
  forma_pagamento: FormaPagamento; // dinheiro, cartão, pix, boleto, etc
  conta_origem: OrigemPagamento; // caixa ou banco
  centro_custo?: string; // Categoria do produto ou despesa
  fornecedor: string; // Nome do fornecedor
  valor_total: number; // Valor total da despesa
  valor_pago: number; // Valor já pago
  valor_restante: number; // Valor ainda pendente
  parcelas: number; // Quantidade de parcelas
  parcelas_pagas: number; // Parcelas já pagas
  data_vencimento: Date; // Data limite para pagamento
  data_pagamento?: Date; // Data efetiva do pagamento
  status_pagamento: StatusPagamento; // pendente, parcial ou pago
  workspace_id: string;
  usuario_id: string;
  criado_em: Date;
  atualizado_em: Date;
  
  // Campos legados para compatibilidade
  descricao?: string; // Mapeado de observacoes
  data_compra?: Date; // Mapeado de lancamento
  data_registro?: Date; // Mapeado de lancamento
  status?: AccountStatus; // Mapeado de status_pagamento
  categoria_dre?: DRECategory; // Mapeado de centro_custo
  origem_pagamento?: OrigemPagamento; // Mapeado de conta_origem
  numero_parcelas?: number; // Mapeado de parcelas
  movimento_id?: string;
  parcelas?: Parcela[]; // Array de parcelas detalhadas (quando necessário)
}

/**
 * Interface para Conta a Receber
 */
export interface ContaReceber {
  id: string;
  lancamento: Date; // Data do lançamento
  observacoes?: string; // Texto livre
  forma_recebimento: FormaPagamento; // dinheiro, cartão, pix, boleto, etc
  conta_destino: OrigemPagamento; // caixa ou banco
  centro_custo?: string; // Categoria do produto ou serviço
  cliente: string; // Nome do cliente
  valor_total: number; // Valor da venda ou serviço
  valor_recebido: number; // Valor já recebido
  valor_restante: number; // Valor ainda pendente
  parcelas: number; // Número de parcelas
  parcelas_recebidas: number; // Parcelas já recebidas
  data_vencimento: Date; // Data esperada de recebimento
  data_recebimento?: Date; // Data efetiva do recebimento
  status_recebimento: StatusRecebimento; // pendente, parcial ou recebido
  workspace_id: string;
  usuario_id: string;
  criado_em: Date;
  atualizado_em: Date;
  
  // Campos legados para compatibilidade
  descricao?: string; // Mapeado de observacoes
  valor?: number; // Mapeado de valor_total
  status?: AccountStatus; // Mapeado de status_recebimento
  categoria_dre?: DRECategory; // Mapeado de centro_custo
  movimento_id?: string;
}

/**
 * Interface para DRE (Demonstração do Resultado do Exercício)
 */
export interface DRE {
  periodo_inicio: Date;
  periodo_fim: Date;
  
  // RECEITAS OPERACIONAIS
  receita_operacional_bruta: number;
  deducoes_vendas: number;
  receita_operacional_liquida: number;
  
  // CUSTOS
  custo_produto_vendido: number;
  lucro_bruto: number;
  
  // DESPESAS OPERACIONAIS
  despesas_operacionais: {
    administrativas: number;
    comerciais: number;
    financeiras: number;
    outras: number;
    total: number;
  };
  
  // RESULTADO OPERACIONAL
  resultado_operacional: number;
  
  // RESULTADO FINANCEIRO
  receitas_financeiras: number;
  despesas_financeiras: number;
  resultado_financeiro: number;
  
  // OUTRAS RECEITAS E DESPESAS
  outras_receitas: number;
  outras_despesas: number;
  
  // RESULTADO ANTES DO IMPOSTO
  resultado_antes_imposto: number;
  
  // IMPOSTOS (se aplicável)
  impostos: number;
  
  // RESULTADO LÍQUIDO
  resultado_liquido: number;
  
  // DETALHAMENTO POR CATEGORIA
  detalhamento: {
    receitas: Array<{
      categoria: string;
      valor: number;
      contas: Array<{ id: string; descricao: string; valor: number }>;
    }>;
    custos: Array<{
      categoria: string;
      valor: number;
      contas: Array<{ id: string; descricao: string; valor: number }>;
    }>;
    despesas: Array<{
      categoria: string;
      valor: number;
      contas: Array<{ id: string; descricao: string; valor: number }>;
    }>;
  };
}

/**
 * Dados para exportação do DRE em PDF
 */
export interface DREPDFData {
  dre: DRE;
  periodo_texto: string;
  data_geracao: Date;
  contas_pagar: ContaPagar[];
  contas_receber: ContaReceber[];
  movimentacoes: Array<{
    id: string;
    tipo: 'entrada' | 'saida';
    descricao: string;
    valor: number;
    data: Date;
  }>;
}

