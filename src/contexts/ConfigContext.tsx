import React, { createContext, useContext, useState, useEffect, useCallback, useMemo, ReactNode } from 'react';

// Taxas de câmbio atualizadas (baseadas em BRL) - Taxas de 29/10/2025
const MOEDA_TAXAS: Record<string, number> = {
  BRL: 1.0,      // Real Brasileiro (base)
  USD: 0.1866,   // Dólar Americano - 1 BRL = 0.1866 USD (1 USD = 5.3587 BRL)
  EUR: 0.1723,   // Euro - 1 BRL = 0.1723 EUR (1 EUR = 5.8042 BRL)
  GBP: 0.1429,   // Libra Esterlina - 1 BRL = 0.1429 GBP (1 GBP = 7.0000 BRL)
  JPY: 28.08,    // Iene Japonês - 1 BRL = 28.08 JPY (1 JPY = 0.0356 BRL)
  CAD: 0.2557,   // Dólar Canadense - 1 BRL = 0.2557 CAD (1 CAD = 3.9116 BRL)
  AUD: 0.2870,   // Dólar Australiano - 1 BRL = 0.2870 AUD (1 AUD = 3.4843 BRL)
  CHF: 0.1628,   // Franco Suíço - 1 BRL = 0.1628 CHF (1 CHF = 6.1429 BRL)
};

const MOEDA_SIMBOLOS: Record<string, string> = {
  BRL: 'R$',
  USD: '$',
  EUR: '€',
  GBP: '£',
  JPY: '¥',
  CAD: 'C$',
  AUD: 'A$',
  CHF: 'CHF',
};

// Traduções
const TRADUCOES: Record<string, Record<string, string>> = {
  'pt-BR': {
    // Mantém todas as chaves em português como estão
    'Produtos': 'Produtos',
    'Entradas': 'Entradas',
    'Saídas': 'Saídas',
    'Financeiro': 'Relatórios',
    'Compartilhar': 'Compartilhar',
    'Configurações': 'Configurações',
    'Dashboard': 'Dashboard',
    'Total de Produtos': 'Total de Produtos',
    'Valor do Estoque': 'Valor do Estoque',
    'Vendas Hoje': 'Vendas Hoje',
    'Estoque Baixo': 'Estoque Baixo',
    'Total Movimentações': 'Total Movimentações',
    'Última Atividade': 'Última Atividade',
    'Última Notificação': 'Última Notificação',
    'Ações Rápidas': 'Ações Rápidas',
    'Resumo do Sistema': 'Resumo do Sistema',
    'Produtos Ativos': 'Produtos Ativos',
    'Movimentações': 'Movimentações',
    'Valor Total': 'Valor Total',
    'Top 5 Produtos': 'Top 5 Produtos',
    'Total': 'Total',
    'Valor': 'Valor',
    'Hoje': 'Hoje',
    'Baixo': 'Baixo',
    'entradas': 'entradas',
    'saídas': 'saídas',
    'Produtos cadastrados': 'Produtos cadastrados',
    'registros': 'registros',
    'Nenhuma movimentação registrada': 'Nenhuma movimentação registrada',
    'Nenhuma notificação': 'Nenhuma notificação',
    'Sistema completo de gestão empresarial para controlar estoque, vendas e finanças com precisão e eficiência': 'Sistema completo de gestão empresarial para controlar estoque, vendas e finanças com precisão e eficiência',
    'Vendas realizadas': 'vendas realizadas',
    'Produtos com estoque mínimo': 'Produtos com estoque mínimo',
  },
  'en-US': {
    'Produtos': 'Products',
    'Entradas': 'Entries',
    'Saídas': 'Outputs',
    'Financeiro': 'Reports',
    'Compartilhar': 'Share',
    'Configurações': 'Settings',
    'Dashboard': 'Dashboard',
    'Total de Produtos': 'Total Products',
    'Valor do Estoque': 'Stock Value',
    'Vendas Hoje': 'Today Sales',
    'Estoque Baixo': 'Low Stock',
    'Total Movimentações': 'Total Movements',
    'Última Atividade': 'Last Activity',
    'Última Notificação': 'Last Notification',
    'Ações Rápidas': 'Quick Actions',
    'Resumo do Sistema': 'System Summary',
    'Produtos Ativos': 'Active Products',
    'Movimentações': 'Movements',
    'Valor Total': 'Total Value',
    'Top 5 Produtos': 'Top 5 Products',
    'Produtos': 'Products',
    'Entradas': 'Entries',
    'Saídas': 'Outputs',
    'Financeiro': 'Reports',
    'Compartilhar': 'Share',
    'Dashboard': 'Dashboard',
    'Total': 'Total',
    'Valor': 'Value',
    'Hoje': 'Today',
    'Baixo': 'Low',
    'entradas': 'entries',
    'saídas': 'outputs',
    'Produtos Ativos': 'Active Products',
    'Movimentações': 'Movements',
    'Valor Total': 'Total Value',
    'Produtos cadastrados': 'Registered products',
    'registros': 'records',
    'Nenhuma movimentação registrada': 'No recorded movements',
    'Nenhuma notificação': 'No notifications',
    // Mensagens gerais
    'Sistema completo de gestão empresarial': 'Complete business management system',
    'Vendas realizadas': 'Sales made',
    'Produtos com estoque mínimo': 'Products with minimum stock',
    '+0 este mês': '+0 this month',
    '+0% este mês': '+0% this month',
    'Unidade de medida': 'Unit of measure',
    'É obrigatório': 'Is required',
    'Deve ter no máximo': 'Must have at most',
    'caracteres': 'characters',
    'Produto cadastrado': 'Registered product',
    'Adicionado com sucesso': 'Added successfully',
    'Erro ao adicionar produto': 'Error adding product',
    'Produto atualizado': 'Product updated',
    'Atualizado com sucesso': 'Updated successfully',
    'Produto excluído': 'Product deleted',
    'Excluído com sucesso': 'Deleted successfully',
    'Erro ao excluir produto': 'Error deleting product',
    // Mais traduções
    'este mês': 'this month',
    'vendas realizadas': 'sales made',
    'Gestão de produtos': 'Product management',
    'Controle de entradas': 'Entry control',
    'Controle de saídas': 'Output control',
    'Análises e dados': 'Analysis and data',
    'Controle financeiro': 'Reports and analysis',
    'Gerenciar acesso': 'Manage access',
    'Configurações do sistema': 'System settings',
    'Visão geral do sistema': 'System overview',
    'Ocultar': 'Hide',
    'Mostrar': 'Show',
    'Editar': 'Edit',
    'Total de ações configuradas': 'Total configured actions',
    'Mostrando as últimas': 'Showing the last',
    'movimentações': 'movements',
    'Ver todas': 'See all',
    'un': 'un',
  },
  'es-ES': {
    'Produtos': 'Productos',
    'Entradas': 'Entradas',
    'Saídas': 'Salidas',
    'Financeiro': 'Informes',
    'Compartilhar': 'Compartir',
    'Configurações': 'Configuraciones',
    'Dashboard': 'Panel',
    'Total de Produtos': 'Total de Productos',
    'Valor do Estoque': 'Valor del Stock',
    'Vendas Hoje': 'Ventas Hoy',
    'Estoque Baixo': 'Stock Bajo',
    'Total Movimentações': 'Total Movimientos',
    'Última Atividade': 'Última Actividad',
    'Última Notificação': 'Última Notificación',
    'Ações Rápidas': 'Acciones Rápidas',
    'Resumo do Sistema': 'Resumen del Sistema',
    'Produtos Ativos': 'Productos Activos',
    'Movimentações': 'Movimientos',
    'Valor Total': 'Valor Total',
    'Top 5 Produtos': 'Top 5 Productos',
    'Produtos': 'Productos',
    'Entradas': 'Entradas',
    'Saídas': 'Salidas',
    'Financeiro': 'Informes',
    'Compartilhar': 'Compartir',
    'Dashboard': 'Panel',
    'Total': 'Total',
    'Valor': 'Valor',
    'Hoje': 'Hoy',
    'Baixo': 'Bajo',
    'entradas': 'entradas',
    'saídas': 'salidas',
    'Produtos Ativos': 'Productos Activos',
    'Movimentações': 'Movimientos',
    'Valor Total': 'Valor Total',
    'Produtos cadastrados': 'Productos registrados',
    'registros': 'registros',
    'Nenhuma movimentação registrada': 'No hay movimientos registrados',
    'Nenhuma notificação': 'Sin notificaciones',
    'Sistema completo de gestão empresarial para controlar estoque, vendas e finanças com precisão e eficiência': 'Sistema completo de gestión empresarial para controlar inventario, ventas y finanzas con precisión y eficiencia',
    'Vendas realizadas': 'Ventas realizadas',
    'Produtos com estoque mínimo': 'Productos con stock mínimo',
  },
  'fr-FR': {
    'Produtos': 'Produits',
    'Entradas': 'Entrées',
    'Saídas': 'Sorties',
    'Financeiro': 'Rapports',
    'Compartilhar': 'Partager',
    'Configurações': 'Paramètres',
    'Dashboard': 'Tableau de bord',
    'Total de Produtos': 'Total des Produits',
    'Valor do Estoque': 'Valeur du Stock',
    'Vendas Hoje': 'Ventes Aujourd\'hui',
    'Estoque Baixo': 'Stock Faible',
    'Total Movimentações': 'Total des Mouvements',
    'Última Atividade': 'Dernière Activité',
    'Última Notificação': 'Dernière Notification',
    'Ações Rápidas': 'Actions Rapides',
    'Resumo do Sistema': 'Résumé du Système',
    'Produtos Ativos': 'Produits Actifs',
    'Movimentações': 'Mouvements',
    'Valor Total': 'Valeur Totale',
    'Top 5 Produtos': 'Top 5 Produits',
    'Produtos': 'Produits',
    'Entradas': 'Entrées',
    'Saídas': 'Sorties',
    'Financeiro': 'Rapports',
    'Compartilhar': 'Partager',
    'Dashboard': 'Tableau de bord',
    'Total': 'Total',
    'Valor': 'Valeur',
    'Hoje': 'Aujourd\'hui',
    'Baixo': 'Faible',
    'entradas': 'entrées',
    'saídas': 'sorties',
    'Produtos Ativos': 'Produits Actifs',
    'Movimentações': 'Mouvements',
    'Valor Total': 'Valeur Totale',
    'Produtos cadastrados': 'Produits enregistrés',
    'registros': 'enregistrements',
    'Nenhuma movimentação registrada': 'Aucun mouvement enregistré',
    'Nenhuma notificação': 'Aucune notification',
    'Sistema completo de gestão empresarial para controlar estoque, vendas e finanças com precisão e eficiência': 'Système complet de gestion d\'entreprise pour contrôler les stocks, les ventes et les finances avec précision et efficacité',
    'Vendas realizadas': 'Ventes réalisées',
    'Produtos com estoque mínimo': 'Produits avec stock minimum',
  },
};

interface ConfigContextType {
  moeda: string;
  setMoeda: (moeda: string) => void;
  idioma: string;
  setIdioma: (idioma: string) => void;
  converterMoeda: (valor: number) => number;
  formatarMoeda: (valor: number) => string;
  traduzir: (texto: string) => string;
}

const ConfigContext = createContext<ConfigContextType | undefined>(undefined);

export const ConfigProvider = ({ children }: { children: ReactNode }) => {
  const [moeda, setMoedaState] = useState(() => localStorage.getItem('flexi-gestor-moeda') || 'BRL');
  const [idioma, setIdiomaState] = useState(() => localStorage.getItem('flexi-gestor-idioma') || 'pt-BR');

  // Atualizar localStorage quando muda
  useEffect(() => {
    localStorage.setItem('flexi-gestor-moeda', moeda);
    // Disparar evento customizado para atualizar outros componentes
    window.dispatchEvent(new CustomEvent('moeda-changed', { detail: moeda }));
  }, [moeda]);

  useEffect(() => {
    localStorage.setItem('flexi-gestor-idioma', idioma);
    // Disparar evento customizado para atualizar outros componentes
    window.dispatchEvent(new CustomEvent('idioma-changed', { detail: idioma }));
  }, [idioma]);

  // Escutar mudanças no localStorage (para sincronizar entre abas)
  useEffect(() => {
    const handleStorageChange = (e: StorageEvent) => {
      if (e.key === 'flexi-gestor-moeda' && e.newValue) {
        setMoedaState(e.newValue);
      }
      if (e.key === 'flexi-gestor-idioma' && e.newValue) {
        setIdiomaState(e.newValue);
      }
    };

    // Escutar eventos customizados para atualização na mesma aba
    const handleMoedaChanged = (e: CustomEvent) => {
      setMoedaState(e.detail);
    };

    const handleIdiomaChanged = (e: CustomEvent) => {
      setIdiomaState(e.detail);
    };

    window.addEventListener('storage', handleStorageChange);
    window.addEventListener('moeda-changed', handleMoedaChanged as EventListener);
    window.addEventListener('idioma-changed', handleIdiomaChanged as EventListener);

    return () => {
      window.removeEventListener('storage', handleStorageChange);
      window.removeEventListener('moeda-changed', handleMoedaChanged as EventListener);
      window.removeEventListener('idioma-changed', handleIdiomaChanged as EventListener);
    };
  }, []);

  const setMoeda = useCallback((novaMoeda: string) => {
    setMoedaState(novaMoeda);
  }, []);

  const setIdioma = useCallback((novoIdioma: string) => {
    setIdiomaState(novoIdioma);
  }, []);

  // Converter valor de BRL para moeda selecionada
  const converterMoeda = useCallback((valor: number): number => {
    if (moeda === 'BRL') return valor;
    const taxa = MOEDA_TAXAS[moeda] || 1;
    // Usar toFixed para evitar erros de precisão de ponto flutuante
    const resultado = Number((valor * taxa).toFixed(2));
    return resultado;
  }, [moeda]);

  // Formatar valor com símbolo da moeda
  const formatarMoeda = useCallback((valor: number): string => {
    const valorConvertido = converterMoeda(valor);
    const simbolo = MOEDA_SIMBOLOS[moeda] || moeda;
    return `${simbolo} ${valorConvertido.toFixed(2)}`;
  }, [moeda, converterMoeda]);

  // Traduzir texto baseado no idioma
  const traduzir = useCallback((texto: string): string => {
    return TRADUCOES[idioma]?.[texto] || texto;
  }, [idioma]);

  // Usar useMemo para evitar recriar o value a cada render
  const value = useMemo(() => ({
    moeda,
    setMoeda,
    idioma,
    setIdioma,
    converterMoeda,
    formatarMoeda,
    traduzir,
  }), [moeda, idioma, setMoeda, setIdioma, converterMoeda, formatarMoeda, traduzir]);

  return (
    <ConfigContext.Provider value={value}>
      {children}
    </ConfigContext.Provider>
  );
};

export const useConfig = () => {
  const context = useContext(ConfigContext);
  if (!context) {
    throw new Error('useConfig deve ser usado dentro de ConfigProvider');
  }
  return context;
};

