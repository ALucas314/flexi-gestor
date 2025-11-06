/**
 * 📊 Utilitários para Cálculo de DRE e Gestão Financeira
 * 
 * Funções para calcular DRE automaticamente com base nas contas e movimentações
 */

import { DRE, DRECategory, ContaPagar, ContaReceber } from '@/types/financial';

/**
 * Calcula o DRE completo com base nas contas e movimentações
 */
export function calcularDRE(
  contasPagar: ContaPagar[],
  contasReceber: ContaReceber[],
  movimentacoes: Array<{
    id: string;
    type: 'entrada' | 'saida';
    total: number;
    date: Date;
    description: string;
  }>,
  periodoInicio: Date,
  periodoFim: Date
): DRE {
  // Filtrar contas e movimentações do período
  const contasPagarPeriodo = contasPagar.filter(c => {
    const dataVenc = new Date(c.data_vencimento);
    return dataVenc >= periodoInicio && dataVenc <= periodoFim;
  });

  const contasReceberPeriodo = contasReceber.filter(c => {
    const dataVenc = new Date(c.data_vencimento);
    return dataVenc >= periodoInicio && dataVenc <= periodoFim;
  });

  const movimentacoesPeriodo = movimentacoes.filter(m => {
    const dataMov = new Date(m.date);
    return dataMov >= periodoInicio && dataMov <= periodoFim;
  });

  // RECEITAS OPERACIONAIS
  // Receitas de vendas (saídas) + Contas a Receber pagas
  const receitasVendas = movimentacoesPeriodo
    .filter(m => m.type === 'saida')
    .reduce((sum, m) => sum + m.total, 0);

  const receitasContasReceber = contasReceberPeriodo
    .filter(c => c.status === 'pago')
    .reduce((sum, c) => sum + c.valor, 0);

  const receitaOperacionalBruta = receitasVendas + receitasContasReceber;
  const deducoesVendas = 0; // Pode ser expandido para incluir devoluções, descontos, etc.
  const receitaOperacionalLiquida = receitaOperacionalBruta - deducoesVendas;

  // CUSTOS
  // Custos de compras (entradas) + Contas a Pagar pagas relacionadas a custos
  const custosCompras = movimentacoesPeriodo
    .filter(m => m.type === 'entrada')
    .reduce((sum, m) => sum + m.total, 0);

  const custosContasPagar = contasPagarPeriodo
    .filter(c => c.status === 'pago' && c.categoria_dre === 'custo_produto_vendido')
    .reduce((sum, c) => sum + c.valor, 0);

  const custoProdutoVendido = custosCompras + custosContasPagar;
  const lucroBruto = receitaOperacionalLiquida - custoProdutoVendido;

  // DESPESAS OPERACIONAIS
  const despesasAdministrativas = contasPagarPeriodo
    .filter(c => c.status === 'pago' && c.categoria_dre === 'despesa_administrativa')
    .reduce((sum, c) => sum + c.valor, 0);

  const despesasComerciais = contasPagarPeriodo
    .filter(c => c.status === 'pago' && c.categoria_dre === 'despesa_comercial')
    .reduce((sum, c) => sum + c.valor, 0);

  const despesasFinanceiras = contasPagarPeriodo
    .filter(c => c.status === 'pago' && c.categoria_dre === 'despesa_financeira')
    .reduce((sum, c) => sum + c.valor, 0);

  const outrasDespesasOperacionais = contasPagarPeriodo
    .filter(c => c.status === 'pago' && c.categoria_dre === 'despesa_operacional')
    .reduce((sum, c) => sum + c.valor, 0);

  const totalDespesasOperacionais = 
    despesasAdministrativas + 
    despesasComerciais + 
    despesasFinanceiras + 
    outrasDespesasOperacionais;

  // RESULTADO OPERACIONAL
  const resultadoOperacional = lucroBruto - totalDespesasOperacionais;

  // RESULTADO FINANCEIRO
  const receitasFinanceiras = contasReceberPeriodo
    .filter(c => c.status === 'pago' && c.categoria_dre === 'receita_financeira')
    .reduce((sum, c) => sum + c.valor, 0);

  const despesasFinanceirasTotal = despesasFinanceiras; // Já calculado acima
  const resultadoFinanceiro = receitasFinanceiras - despesasFinanceirasTotal;

  // OUTRAS RECEITAS E DESPESAS
  const outrasReceitas = contasReceberPeriodo
    .filter(c => c.status === 'pago' && c.categoria_dre === 'outras_receitas')
    .reduce((sum, c) => sum + c.valor, 0);

  const outrasDespesas = contasPagarPeriodo
    .filter(c => c.status === 'pago' && c.categoria_dre === 'outras_despesas')
    .reduce((sum, c) => sum + c.valor, 0);

  // RESULTADO ANTES DO IMPOSTO
  const resultadoAntesImposto = 
    resultadoOperacional + 
    resultadoFinanceiro + 
    outrasReceitas - 
    outrasDespesas;

  // IMPOSTOS (simplificado - pode ser expandido)
  const impostos = 0; // Pode ser calculado com base em alíquotas específicas

  // RESULTADO LÍQUIDO
  const resultadoLiquido = resultadoAntesImposto - impostos;

  // DETALHAMENTO POR CATEGORIA
  const detalhamentoReceitas = [
    {
      categoria: 'Receitas Operacionais',
      valor: receitaOperacionalLiquida,
      contas: contasReceberPeriodo
        .filter(c => c.status === 'pago' && !c.categoria_dre)
        .map(c => ({ id: c.id, descricao: c.descricao, valor: c.valor }))
        .concat(
          movimentacoesPeriodo
            .filter(m => m.type === 'saida')
            .map(m => ({ id: m.id, descricao: m.description, valor: m.total }))
        )
    },
    {
      categoria: 'Receitas Financeiras',
      valor: receitasFinanceiras,
      contas: contasReceberPeriodo
        .filter(c => c.status === 'pago' && c.categoria_dre === 'receita_financeira')
        .map(c => ({ id: c.id, descricao: c.descricao, valor: c.valor }))
    },
    {
      categoria: 'Outras Receitas',
      valor: outrasReceitas,
      contas: contasReceberPeriodo
        .filter(c => c.status === 'pago' && c.categoria_dre === 'outras_receitas')
        .map(c => ({ id: c.id, descricao: c.descricao, valor: c.valor }))
    }
  ].filter(item => item.valor > 0);

  const detalhamentoCustos = [
    {
      categoria: 'Custo do Produto Vendido',
      valor: custoProdutoVendido,
      contas: contasPagarPeriodo
        .filter(c => c.status === 'pago' && c.categoria_dre === 'custo_produto_vendido')
        .map(c => ({ id: c.id, descricao: c.descricao, valor: c.valor }))
        .concat(
          movimentacoesPeriodo
            .filter(m => m.type === 'entrada')
            .map(m => ({ id: m.id, descricao: m.description, valor: m.total }))
        )
    }
  ].filter(item => item.valor > 0);

  const detalhamentoDespesas = [
    {
      categoria: 'Despesas Administrativas',
      valor: despesasAdministrativas,
      contas: contasPagarPeriodo
        .filter(c => c.status === 'pago' && c.categoria_dre === 'despesa_administrativa')
        .map(c => ({ id: c.id, descricao: c.descricao, valor: c.valor }))
    },
    {
      categoria: 'Despesas Comerciais',
      valor: despesasComerciais,
      contas: contasPagarPeriodo
        .filter(c => c.status === 'pago' && c.categoria_dre === 'despesa_comercial')
        .map(c => ({ id: c.id, descricao: c.descricao, valor: c.valor }))
    },
    {
      categoria: 'Despesas Financeiras',
      valor: despesasFinanceiras,
      contas: contasPagarPeriodo
        .filter(c => c.status === 'pago' && c.categoria_dre === 'despesa_financeira')
        .map(c => ({ id: c.id, descricao: c.descricao, valor: c.valor }))
    },
    {
      categoria: 'Outras Despesas',
      valor: outrasDespesasOperacionais + outrasDespesas,
      contas: contasPagarPeriodo
        .filter(c => c.status === 'pago' && (c.categoria_dre === 'despesa_operacional' || c.categoria_dre === 'outras_despesas'))
        .map(c => ({ id: c.id, descricao: c.descricao, valor: c.valor }))
    }
  ].filter(item => item.valor > 0);

  return {
    periodo_inicio: periodoInicio,
    periodo_fim: periodoFim,
    receita_operacional_bruta: receitaOperacionalBruta,
    deducoes_vendas: deducoesVendas,
    receita_operacional_liquida: receitaOperacionalLiquida,
    custo_produto_vendido: custoProdutoVendido,
    lucro_bruto: lucroBruto,
    despesas_operacionais: {
      administrativas: despesasAdministrativas,
      comerciais: despesasComerciais,
      financeiras: despesasFinanceiras,
      outras: outrasDespesasOperacionais,
      total: totalDespesasOperacionais
    },
    resultado_operacional: resultadoOperacional,
    receitas_financeiras: receitasFinanceiras,
    despesas_financeiras: despesasFinanceirasTotal,
    resultado_financeiro: resultadoFinanceiro,
    outras_receitas: outrasReceitas,
    outras_despesas: outrasDespesas,
    resultado_antes_imposto: resultadoAntesImposto,
    impostos: impostos,
    resultado_liquido: resultadoLiquido,
    detalhamento: {
      receitas: detalhamentoReceitas,
      custos: detalhamentoCustos,
      despesas: detalhamentoDespesas
    }
  };
}

/**
 * Formata valor monetário para exibição
 */
export function formatarMoeda(valor: number): string {
  return new Intl.NumberFormat('pt-BR', {
    style: 'currency',
    currency: 'BRL',
    minimumFractionDigits: 2,
    maximumFractionDigits: 2
  }).format(valor);
}

/**
 * Formata percentual para exibição
 */
export function formatarPercentual(valor: number, total: number): string {
  if (total === 0) return '0,00%';
  const percentual = (valor / total) * 100;
  return `${percentual.toFixed(2).replace('.', ',')}%`;
}

/**
 * Obtém o texto da categoria DRE
 */
export function getCategoriaDRETexto(categoria?: DRECategory): string {
  const map: Record<DRECategory, string> = {
    receita_operacional: 'Receita Operacional',
    custo_produto_vendido: 'Custo do Produto Vendido',
    despesa_operacional: 'Despesa Operacional',
    despesa_administrativa: 'Despesa Administrativa',
    despesa_comercial: 'Despesa Comercial',
    despesa_financeira: 'Despesa Financeira',
    receita_financeira: 'Receita Financeira',
    outras_receitas: 'Outras Receitas',
    outras_despesas: 'Outras Despesas'
  };
  return categoria ? map[categoria] : 'Não categorizada';
}

