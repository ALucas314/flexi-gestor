# 🔴 Corrigir Tabelas "Unrestricted" no Supabase

## ⚠️ O que significa "unrestricted"?

Quando você vê um **símbolo vermelho** com "unrestricted" ao lado de uma tabela no Supabase, significa que:

1. ❌ O RLS (Row Level Security) **NÃO está habilitado** nessa tabela
2. ❌ A tabela está **completamente aberta** para qualquer pessoa acessar
3. ❌ **RISCO DE SEGURANÇA CRÍTICO**: qualquer usuário pode ver/modificar dados de outros usuários

## 🚨 Por que isso é perigoso?

Sem RLS habilitado:
- 👤 Um usuário pode ver os produtos de OUTRO usuário
- 💰 Um usuário pode ver as vendas de OUTRO usuário
- 🗑️ Um usuário pode DELETAR dados de OUTRO usuário
- 📊 Não há isolamento de dados entre contas

## ✅ Solução Rápida (2 minutos)

### Passo 1: Abrir o SQL Editor
1. Entre no [Supabase Dashboard](https://app.supabase.com)
2. Selecione seu projeto
3. Clique em **SQL Editor** no menu lateral esquerdo

### Passo 2: Executar o Script de Correção
1. Abra o arquivo `docs/corrigir-rls.sql`
2. **Copie TODO o conteúdo** do arquivo
3. **Cole no SQL Editor** do Supabase
4. Clique em **RUN** (ou pressione Ctrl+Enter)

### Passo 3: Verificar
1. Aguarde a mensagem de sucesso aparecer
2. Volte para **Table Editor**
3. Verifique se o símbolo vermelho "unrestricted" **desapareceu** das tabelas
4. Se ainda aparecer, **recarregue a página** (F5)

## 📋 O que o script faz?

O script `corrigir-rls.sql` vai:

1. ✅ Habilitar RLS em todas as tabelas (`perfis`, `produtos`, `lotes`, `movimentacoes`)
2. ✅ Criar políticas de segurança que garantem:
   - Cada usuário só vê seus próprios dados
   - Cada usuário só pode modificar seus próprios dados
   - Ninguém pode acessar dados de outros usuários
3. ✅ Verificar se tudo foi configurado corretamente

## 🔐 Políticas de Segurança Criadas

### Para todas as tabelas:
- ✅ **SELECT**: Usuário só vê seus próprios registros
- ✅ **INSERT**: Usuário só pode criar registros para ele mesmo
- ✅ **UPDATE**: Usuário só pode atualizar seus próprios registros
- ✅ **DELETE**: Usuário só pode deletar seus próprios registros

## 🎯 Após Executar o Script

Você deve ver:
- 🟢 **Todas as tabelas SEM o símbolo vermelho**
- 🟢 **Nenhum aviso de "unrestricted"**
- 🟢 **4 políticas criadas** para cada tabela

## ❓ Ainda aparece "unrestricted"?

Se após executar o script ainda aparecer o símbolo vermelho:

1. **Recarregue a página** do Supabase (F5)
2. Verifique se o script foi executado sem erros
3. Vá em **Authentication > Policies** e veja se as políticas foram criadas
4. Se persistir, execute novamente o script

## 📞 Suporte

Se tiver algum problema:
1. Verifique os logs no SQL Editor
2. Certifique-se de que copiou TODO o script
3. Confirme que está logado com permissões de administrador no Supabase

---

## 🔥 IMPORTANTE

**Execute este script ANTES de usar a aplicação em produção!**

Sem RLS habilitado, seus dados NÃO estão seguros! 🔒

