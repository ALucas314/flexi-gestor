# 📋 Adicionar Coluna `gerenciado_por_lote`

Este script adiciona a coluna `gerenciado_por_lote` na tabela `produtos` do banco de dados Supabase.

## 🎯 O que faz

A coluna `gerenciado_por_lote` controla se um produto é gerenciado por lote (controle de validade e custo por lote). Quando habilitado, o sistema permite gerenciar lotes específicos do produto.

## 📝 Como aplicar

### Opção 1: Pelo Dashboard do Supabase (Recomendado)

1. Acesse o [Dashboard do Supabase](https://supabase.com/dashboard)
2. Selecione seu projeto
3. Vá em **SQL Editor** (no menu lateral)
4. Cole o conteúdo do arquivo `adicionar-coluna-gerenciado-por-lote.sql`
5. Clique em **Run** ou pressione `Ctrl+Enter`

### Opção 2: Via linha de comando (psql)

```bash
psql -h <SEU_HOST> -U postgres -d postgres -f adicionar-coluna-gerenciado-por-lote.sql
```

## ✅ Verificação

Para verificar se a coluna foi criada corretamente, execute:

```sql
SELECT column_name, data_type, column_default 
FROM information_schema.columns 
WHERE table_name = 'produtos' 
  AND column_name = 'gerenciado_por_lote';
```

Você deve ver:
- `column_name`: `gerenciado_por_lote`
- `data_type`: `boolean`
- `column_default`: `false`

## 🔄 Após aplicar

Após executar o script SQL:
- ✅ Produtos novos terão `gerenciado_por_lote = false` por padrão
- ✅ Produtos existentes terão `gerenciado_por_lote = false` automaticamente
- ✅ O campo "Gerenciamento por Lote" no formulário de produtos será persistido no banco
- ✅ Ao editar um produto, o valor do checkbox será preservado corretamente

## ⚠️ Importante

- Este script é **seguro** e pode ser executado múltiplas vezes (usa `IF NOT EXISTS`)
- Não afeta produtos existentes (usa valor padrão `false`)
- Não requer downtime ou reinicialização do aplicativo

