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

  const movimentacoesEntrada = movimentacoesPeriodo.filter(m => m.type === 'entrada');
  const movimentacoesSaida = movimentacoesPeriodo.filter(m => m.type === 'saida');
  const movimentacoesEntradaIds = new Set(movimentacoesEntrada.map(m => m.id));
  const movimentacoesSaidaIds = new Set(movimentacoesSaida.map(m => m.id));

  const getValorContaPagar = (conta: ContaPagar) => {
    if (typeof conta.valor_total === 'number') return conta.valor_total;
    if (typeof conta.valor === 'number') return conta.valor;
    if (typeof conta.valor_pago === 'number' && conta.valor_pago > 0) return conta.valor_pago;
    return 0;
  };

  const getValorContaReceber = (conta: ContaReceber) => {
    if (typeof conta.valor_total === 'number') return conta.valor_total;
    if (typeof conta.valor === 'number') return conta.valor;
    if (typeof conta.valor_recebido === 'number' && conta.valor_recebido > 0) return conta.valor_recebido;
    return 0;
  };

  const isContaPagarLiquidada = (conta: ContaPagar) => {
    const status = conta.status || conta.status_pagamento;
    return status === 'pago' || status === 'finalizado';
  };

  const isContaReceberLiquidada = (conta: ContaReceber) => {
    const status = conta.status || conta.status_recebimento;
    return status === 'pago' || status === 'recebido' || status === 'finalizado';
  };

  const contasReceberLiquidada = contasReceberPeriodo.filter(isContaReceberLiquidada);
  const contasReceberSemMovimentacao = contasReceberLiquidada.filter(conta => {
    if (!conta.movimento_id) return true;
    return !movimentacoesSaidaIds.has(conta.movimento_id);
  });

  const contasPagarLiquidadas = contasPagarPeriodo.filter(isContaPagarLiquidada);
  const contasPagarSemMovimentacaoEntrada = contasPagarLiquidadas.filter(conta => {
    if (!conta.movimento_id) return true;
    return !movimentacoesEntradaIds.has(conta.movimento_id);
  });

  const normalizarTexto = (texto?: string | null) => (texto || '').trim().toLowerCase();
  const valoresAproximadamenteIguais = (a: number, b: number) => Math.abs(a - b) < 0.01;

  const movimentoCorrespondeContaReceber = (conta: ContaReceber, mov: typeof movimentacoesSaida[number]) => {
    if (conta.movimento_id && conta.movimento_id === mov.id) return true;
    const valorConta = getValorContaReceber(conta);
    if (!valoresAproximadamenteIguais(valorConta, mov.total)) {
      return false;
    }

    const descricaoConta = normalizarTexto(conta.descricao || conta.observacoes);
    const descricaoMov = normalizarTexto(mov.description);
    if (descricaoConta && descricaoMov && descricaoConta === descricaoMov) {
      return true;
    }

    const clienteConta = normalizarTexto((conta as any).cliente);
    if (clienteConta && descricaoMov.includes(clienteConta)) {
      return true;
    }

    return false;
  };

  const movimentoCorrespondeContaPagar = (conta: ContaPagar, mov: typeof movimentacoesEntrada[number]) => {
    if (conta.movimento_id && conta.movimento_id === mov.id) return true;
    const valorConta = getValorContaPagar(conta);
    if (!valoresAproximadamenteIguais(valorConta, mov.total)) {
      return false;
    }

    const descricaoConta = normalizarTexto(conta.descricao || conta.observacoes);
    const descricaoMov = normalizarTexto(mov.description);
    if (descricaoConta && descricaoMov && descricaoConta === descricaoMov) {
      return true;
    }

    const fornecedorConta = normalizarTexto((conta as any).fornecedor);
    if (fornecedorConta && descricaoMov.includes(fornecedorConta)) {
      return true;
    }

    return false;
  };

  const contasReceberUnicas = contasReceberSemMovimentacao.filter(conta => {
    return !movimentacoesSaida.some(mov => movimentoCorrespondeContaReceber(conta, mov));
  });

  const contasPagarUnicas = contasPagarSemMovimentacaoEntrada.filter(conta => {
    return !movimentacoesEntrada.some(mov => movimentoCorrespondeContaPagar(conta, mov));
  });

  // RECEITAS OPERACIONAIS
  // Receitas de vendas (saídas) + Contas a Receber pagas
  const receitasVendas = movimentacoesSaida
    .reduce((sum, m) => sum + m.total, 0);

  const receitasContasReceber = contasReceberUnicas
    .reduce((sum, c) => sum + getValorContaReceber(c), 0);

  const receitaOperacionalBruta = receitasVendas + receitasContasReceber;
  const deducoesVendas = 0; // Pode ser expandido para incluir devoluções, descontos, etc.
  const receitaOperacionalLiquida = receitaOperacionalBruta - deducoesVendas;

  // CUSTOS
  // Custos de compras (entradas) + Contas a Pagar pagas relacionadas a custos
  const custosCompras = movimentacoesEntrada
    .reduce((sum, m) => sum + m.total, 0);

  const custosContasPagar = contasPagarUnicas
    .filter(c => c.categoria_dre === 'custo_produto_vendido')
    .reduce((sum, c) => sum + getValorContaPagar(c), 0);

  const custoProdutoVendido = custosCompras + custosContasPagar;
  const lucroBruto = receitaOperacionalLiquida - custoProdutoVendido;

  // DESPESAS OPERACIONAIS
  const despesasAdministrativas = contasPagarLiquidadas
    .filter(c => c.categoria_dre === 'despesa_administrativa')
    .reduce((sum, c) => sum + getValorContaPagar(c), 0);

  const despesasComerciais = contasPagarLiquidadas
    .filter(c => c.categoria_dre === 'despesa_comercial')
    .reduce((sum, c) => sum + getValorContaPagar(c), 0);

  const despesasFinanceiras = contasPagarLiquidadas
    .filter(c => c.categoria_dre === 'despesa_financeira')
    .reduce((sum, c) => sum + getValorContaPagar(c), 0);

  const outrasDespesasOperacionais = contasPagarLiquidadas
    .filter(c => c.categoria_dre === 'despesa_operacional')
    .reduce((sum, c) => sum + getValorContaPagar(c), 0);

  const totalDespesasOperacionais = 
    despesasAdministrativas + 
    despesasComerciais + 
    despesasFinanceiras + 
    outrasDespesasOperacionais;

  // RESULTADO OPERACIONAL
  const resultadoOperacional = lucroBruto - totalDespesasOperacionais;

  // RESULTADO FINANCEIRO
  const contasReceberFinanceiras = contasReceberUnicas
    .filter(c => c.categoria_dre === 'receita_financeira');

  const receitasFinanceiras = contasReceberFinanceiras
    .reduce((sum, c) => sum + getValorContaReceber(c), 0);

  const despesasFinanceirasTotal = despesasFinanceiras; // Já calculado acima
  const resultadoFinanceiro = receitasFinanceiras - despesasFinanceirasTotal;

  // OUTRAS RECEITAS E DESPESAS
  const outrasReceitas = contasReceberUnicas
    .filter(c => c.categoria_dre === 'outras_receitas')
    .reduce((sum, c) => sum + getValorContaReceber(c), 0);

  const outrasDespesas = contasPagarLiquidadas
    .filter(c => c.categoria_dre === 'outras_despesas')
    .reduce((sum, c) => sum + getValorContaPagar(c), 0);

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
  const contasReceberOperacionais = contasReceberUnicas
    .filter(c => !c.categoria_dre || c.categoria_dre === 'receita_operacional');

  const detalhamentoReceitas = [
    {
      categoria: 'Receitas Operacionais',
      valor: receitaOperacionalLiquida,
      contas: contasReceberOperacionais
        .map(c => ({ id: c.id, descricao: c.descricao, valor: getValorContaReceber(c) }))
        .concat(
          movimentacoesSaida
            .map(m => ({ id: m.id, descricao: m.description, valor: m.total }))
        )
    },
    {
      categoria: 'Receitas Financeiras',
      valor: receitasFinanceiras,
      contas: contasReceberFinanceiras
        .map(c => ({ id: c.id, descricao: c.descricao, valor: getValorContaReceber(c) }))
    },
    {
      categoria: 'Outras Receitas',
      valor: outrasReceitas,
      contas: contasReceberUnicas
        .filter(c => c.categoria_dre === 'outras_receitas')
        .map(c => ({ id: c.id, descricao: c.descricao, valor: getValorContaReceber(c) }))
    }
  ].filter(item => item.valor > 0);

  const detalhamentoCustos = [
    {
      categoria: 'Custo do Produto Vendido',
      valor: custoProdutoVendido,
      contas: contasPagarUnicas
        .filter(c => c.categoria_dre === 'custo_produto_vendido')
        .map(c => ({ id: c.id, descricao: c.descricao, valor: getValorContaPagar(c) }))
        .concat(
          movimentacoesEntrada
            .map(m => ({ id: m.id, descricao: m.description, valor: m.total }))
        )
    }
  ].filter(item => item.valor > 0);

  const detalhamentoDespesas = [
    {
      categoria: 'Despesas Administrativas',
      valor: despesasAdministrativas,
      contas: contasPagarLiquidadas
        .filter(c => c.categoria_dre === 'despesa_administrativa')
        .map(c => ({ id: c.id, descricao: c.descricao, valor: getValorContaPagar(c) }))
    },
    {
      categoria: 'Despesas Comerciais',
      valor: despesasComerciais,
      contas: contasPagarLiquidadas
        .filter(c => c.categoria_dre === 'despesa_comercial')
        .map(c => ({ id: c.id, descricao: c.descricao, valor: getValorContaPagar(c) }))
    },
    {
      categoria: 'Despesas Financeiras',
      valor: despesasFinanceiras,
      contas: contasPagarLiquidadas
        .filter(c => c.categoria_dre === 'despesa_financeira')
        .map(c => ({ id: c.id, descricao: c.descricao, valor: getValorContaPagar(c) }))
    },
    {
      categoria: 'Outras Despesas',
      valor: outrasDespesasOperacionais + outrasDespesas,
      contas: contasPagarLiquidadas
        .filter(c => c.categoria_dre === 'despesa_operacional' || c.categoria_dre === 'outras_despesas')
        .map(c => ({ id: c.id, descricao: c.descricao, valor: getValorContaPagar(c) }))
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

