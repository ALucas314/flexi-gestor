/**
 * 📊 Tipos e Interfaces para Módulo Financeiro
 * 
 * Define as estruturas de dados para Contas a Pagar, Contas a Receber e DRE
 */

// Status de uma conta
export type AccountStatus = 'pendente' | 'pago' | 'vencido' | 'cancelado';

// Tipo de conta
export type AccountType = 'pagar' | 'receber';

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
  descricao: string;
  valor: number;
  data_vencimento: Date;
  data_pagamento?: Date;
  status: AccountStatus;
  categoria_dre?: DRECategory;
  fornecedor?: string;
  observacoes?: string;
  movimento_id?: string; // ID da movimentação relacionada (entrada)
  usuario_id: string;
  workspace_id: string;
  criado_em: Date;
  atualizado_em: Date;
}

/**
 * Interface para Conta a Receber
 */
export interface ContaReceber {
  id: string;
  descricao: string;
  valor: number;
  data_vencimento: Date;
  data_recebimento?: Date;
  status: AccountStatus;
  categoria_dre?: DRECategory;
  cliente?: string;
  observacoes?: string;
  movimento_id?: string; // ID da movimentação relacionada (saída)
  usuario_id: string;
  workspace_id: string;
  criado_em: Date;
  atualizado_em: Date;
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

