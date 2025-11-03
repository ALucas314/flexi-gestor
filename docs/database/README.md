# 📁 Scripts SQL - Flexi Gestor

Esta pasta contém todos os scripts SQL organizados por categoria para facilitar o uso e manutenção.

## 📂 Estrutura de Pastas

### 📦 `setup/` - Scripts de Configuração Inicial
Scripts para configurar o banco de dados pela primeira vez ou recriar do zero.

- **01-schema-completo-inicial.sql** - Schema completo do banco (tabelas, RLS, triggers, views)
- **02-schema-completo-com-compartilhamento.sql** - Schema completo incluindo sistema de compartilhamento

### 🗄️ `tabelas/` - Scripts para Criar Tabelas Específicas
Scripts para criar tabelas individuais ou grupos de tabelas.

- **01-criar-tabela-fornecedores.sql** - Criar tabela de fornecedores com RLS
- **02-criar-tabela-clientes.sql** - Criar tabela de clientes com RLS
- **03-criar-tabelas-categorias-unidades.sql** - Criar tabelas de categorias e unidades de medida

### 🔧 `ajustes/` - Scripts de Correção e Ajustes
Scripts para corrigir problemas, adicionar colunas ou ajustar configurações.

- **01-adicionar-coluna-gerenciado-por-lote.sql** - Adicionar coluna `gerenciado_por_lote` em produtos
- **02-adicionar-status-movimentacoes.sql** - Adicionar coluna `status` em movimentações
- **03-corrigir-constraint-fornecedores.sql** - Corrigir constraint única de fornecedores (código por usuário)
- **04-corrigir-rls-lotes-movimentacoes.sql** - Corrigir políticas RLS de lotes e movimentações para compartilhamento
- **05-corrigir-workspaces-separados.sql** - Corrigir workspaces separados (cada usuário tem seu workspace)

### 🤝 `compartilhamento/` - Scripts de Compartilhamento
Scripts relacionados ao sistema de compartilhamento entre usuários.

- **01-instalar-compartilhamento-completo.sql** - Instalar sistema completo de compartilhamento
- **02-corrigir-compartilhamento-unidirecional.sql** - Corrigir compartilhamento unidirecional
- **03-corrigir-funcao-compartilhamento.sql** - Corrigir função de compartilhamento
- **04-corrigir-funcao-acesso-bidirecional.sql** - Corrigir função de acesso bidirecional
- **05-corrigir-funcao-acesso-unidirecional.sql** - Corrigir função de acesso unidirecional
- **06-testar-compartilhamento-bidirecional.sql** - Script de teste para compartilhamento bidirecional

### 🧹 `manutencao/` - Scripts de Limpeza e Reset
Scripts para limpar dados ou resetar o banco completamente.

- **01-limpar-todos-dados.sql** - Limpar todos os dados das tabelas (mantém estrutura)
- **02-limpar-tudo-incluindo-usuarios.sql** - Limpar tudo incluindo usuários (⚠️ DESTRUTIVO)
- **03-resetar-banco-completo.sql** - Resetar banco completo (deleta e recria tudo)
- **04-resetar-banco-completo-com-todas-tabelas.sql** - Resetar banco com todas as tabelas
- **05-remover-politicas-antigas.sql** - Remover políticas RLS antigas

### 🔍 `verificacao/` - Scripts de Verificação e Diagnóstico
Scripts para verificar dados, políticas e diagnosticar problemas.

- **01-verificar-dados-completo.sql** - Verificar todos os dados do banco
- **02-verificar-compartilhamentos.sql** - Verificar compartilhamentos ativos
- **03-verificar-rls-compartilhamento.sql** - Verificar políticas RLS de compartilhamento
- **04-verificar-todas-politicas.sql** - Verificar todas as políticas RLS
- **05-listar-usuarios.sql** - Listar todos os usuários
- **06-debug-compartilhamento.sql** - Script de debug para compartilhamento
- **07-diagnostico-compartilhamento.sql** - Diagnóstico completo de compartilhamento

### ⚙️ `configuracao/` - Scripts de Configuração do Sistema
Scripts para configurar funcionalidades do sistema (Realtime, timeouts, etc).

- **01-configurar-auto-refresh-permanente.sql** - Configurar auto-refresh permanente (evita F5)
- **02-habilitar-realtime-replication.sql** - Habilitar replicação Realtime para subscriptions

## 🚀 Como Usar

### Para Configuração Inicial (Primeira Vez)
1. Execute `setup/01-schema-completo-inicial.sql` primeiro
2. Execute `configuracao/01-configurar-auto-refresh-permanente.sql` depois
3. Execute `configuracao/02-habilitar-realtime-replication.sql` para habilitar Realtime

### Para Criar Tabelas Específicas
Execute os scripts em `tabelas/` conforme necessário.

### Para Corrigir Problemas
Execute os scripts em `ajustes/` conforme o problema específico.

### Para Verificar o Banco
Execute os scripts em `verificacao/` para diagnosticar problemas.

### Para Limpar/Resetar
⚠️ **CUIDADO**: Scripts em `manutencao/` podem deletar dados!
Execute apenas se realmente necessário.

## 📝 Convenção de Nomes

- Arquivos numerados (01-, 02-, etc.) indicam ordem de execução
- Nomes descritivos indicam a função do script
- Todos os scripts têm comentários explicativos no início

## ⚠️ Importante

- Sempre faça backup antes de executar scripts de manutenção
- Leia os comentários no início de cada script antes de executar
- Execute scripts no SQL Editor do Supabase
- Verifique o resultado após executar cada script

