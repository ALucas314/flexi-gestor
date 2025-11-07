# 🔄 Migrações de Banco de Dados

Este diretório contém scripts de migração SQL para atualizar o esquema do banco de dados.

## 📋 Migração 001: Adicionar workspace_id e campos de endereço

### Problema
As tabelas `fornecedores` e `clientes` não possuem a coluna `workspace_id` nem os campos de endereço (rua, numero, complemento, bairro, cidade, estado, cep).

### Solução
Execute o script de migração para adicionar essas colunas automaticamente.

## 🚀 Como Executar

1. **Acesse o Supabase Dashboard**
   - Vá para: https://supabase.com/dashboard/project/ujohzrebqzeochsozmac
   - Ou acesse seu projeto Supabase

2. **Abra o SQL Editor**
   - No menu lateral, clique em **"SQL Editor"**
   - Clique em **"+ New Query"**

3. **Execute o Script de Migração**
   - Abra o arquivo: `docs/database/migrations/001-add-workspace-id-fornecedores-clientes.sql`
   - Copie TODO o conteúdo
   - Cole no SQL Editor
   - Clique em **"Run"** (ou pressione `Ctrl + Enter`)

4. **Verifique o Resultado**
   - Você deve ver a mensagem: ✅ **"Success. No rows returned"**
   - O script mostra também uma verificação das colunas adicionadas

## ✅ O que o Script Faz

1. **Adiciona `workspace_id`** nas tabelas `fornecedores` e `clientes`
   - Usa o valor de `usuario_id` existente como valor padrão
   - Cria índices para melhor performance
   - Torna a coluna obrigatória (NOT NULL)

2. **Adiciona campos de endereço** nas tabelas `fornecedores` e `clientes`
   - `rua` (TEXT)
   - `numero` (TEXT)
   - `complemento` (TEXT)
   - `bairro` (TEXT)
   - `cidade` (TEXT)
   - `estado` (TEXT)
   - `cep` (TEXT)

## 🔒 Segurança

O script é **idempotente**, ou seja:
- ✅ Pode ser executado múltiplas vezes sem causar problemas
- ✅ Verifica se as colunas já existem antes de adicionar
- ✅ Não remove ou modifica dados existentes
- ✅ Apenas adiciona o que está faltando

## ⚠️ Importante

- O script **não** remove dados existentes
- Os registros existentes terão `workspace_id` = `usuario_id` (workspace padrão)
- Novos registros devem sempre incluir `workspace_id` no código

## 🐛 Problemas Comuns

### "column already exists"
**Causa**: A coluna já foi adicionada anteriormente  
**Solução**: Ignore este erro - o script é seguro para executar novamente

### "cannot add NOT NULL column to table that contains rows"
**Causa**: O script tenta tornar a coluna NOT NULL mas há registros sem valor  
**Solução**: Execute o script novamente - ele deve popular os valores primeiro

### Tabelas não encontradas
**Causa**: As tabelas `fornecedores` ou `clientes` não existem  
**Solução**: Execute primeiro o schema completo (`docs/database/setup/03-schema-financeiro.sql`)

