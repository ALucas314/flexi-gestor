# 🔄 Como Resetar o Banco Completamente

## ⚠️ ATENÇÃO

Este script vai **DELETAR TODOS OS DADOS** do banco! Use apenas se quiser começar do zero.

## 🎯 O que o script faz?

✅ **Deleta TUDO:**
- Todas as tabelas (perfis, produtos, lotes, movimentacoes)
- Todas as views
- Todas as funções
- Todos os triggers
- Todas as políticas RLS
- **TODOS OS DADOS**

✅ **Recria TUDO do zero:**
- Tabelas com estrutura correta
- RLS habilitado em todas as tabelas
- Políticas de segurança corretas
- Views SEM SECURITY DEFINER (correto)
- Funções com validação de segurança
- Triggers automáticos

✅ **Resolve problemas:**
- ❌ Remove erros do Security Advisor
- ❌ Remove avisos de segurança
- ✅ Deixa tudo limpo e correto

## 📋 Como executar

### 1. Backup (Opcional)
Se você tem dados importantes, faça backup antes!

### 2. Abrir SQL Editor
1. Entre no [Supabase Dashboard](https://app.supabase.com)
2. Selecione seu projeto **Flexi Gestor**
3. Clique em **SQL Editor** no menu lateral

### 3. Executar o Script
1. Abra o arquivo `docs/resetar-banco-completo.sql`
2. **Copie TODO o conteúdo** (Ctrl+A, Ctrl+C)
3. **Cole no SQL Editor** do Supabase
4. Clique em **RUN** ou pressione **Ctrl+Enter**
5. Aguarde a mensagem de sucesso

### 4. Verificar
1. Recarregue a página do Supabase (F5)
2. Vá em **Table Editor** - deve ver 4 tabelas:
   - ✅ perfis
   - ✅ produtos
   - ✅ lotes
   - ✅ movimentacoes
3. **NENHUMA** deve ter símbolo vermelho "unrestricted"
4. Vá em **Security Advisor**
5. Clique em **"Rerun linter"**
6. Os erros devem ter desaparecido ou diminuído muito

## ✅ Após executar

Você terá:
- 🟢 Banco limpo e zerado
- 🟢 Estrutura correta
- 🟢 RLS habilitado em todas as tabelas
- 🟢 Políticas de segurança configuradas
- 🟢 Sem erros do Security Advisor
- 🟢 Sistema pronto para usar

## 📱 Testar a Aplicação

Depois de executar o script:

1. Abra sua aplicação Flexi Gestor
2. Faça login (ou crie uma conta nova)
3. Teste:
   - ✅ Criar produtos
   - ✅ Registrar entradas
   - ✅ Registrar saídas
   - ✅ Ver relatórios

## 🔒 Segurança

Este script garante que:
- ✅ Cada usuário só vê seus próprios dados
- ✅ Ninguém pode ver dados de outros usuários
- ✅ Ninguém pode modificar dados de outros usuários
- ✅ RLS está corretamente configurado
- ✅ Sem vulnerabilidades de segurança

## ⏱️ Tempo de execução

O script leva cerca de **5-10 segundos** para executar completamente.

## 🆘 Problemas?

Se algo der errado:
1. Leia a mensagem de erro no SQL Editor
2. Certifique-se de copiar TODO o script
3. Verifique se você tem permissões de administrador
4. Tente executar novamente

---

**Pronto para começar do zero? Execute o script agora!** 🚀

