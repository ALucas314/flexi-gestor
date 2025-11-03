# 🔄 Configurar Supabase para Conexão Permanente

Este documento explica como configurar o Supabase para manter a conexão viva e evitar que a aplicação "morra" do nada.

## 📋 Configurações no Supabase Dashboard

### ✅ PASSO 1: Na tela atual (Settings > API)

1. **Enable Data API**: ✅ Deve estar habilitado (marcado)
2. **Exposed schemas**: ✅ Deve incluir `public`
3. **Max rows**: ✅ Já está em 1000 (OK)
4. **Pool size**: ✅ Está configurado automaticamente (OK)
5. **Clique em "Save"** se fez alguma alteração

### ✅ PASSO 2: Executar Script SQL para Auto-Refresh Permanente (IMPORTANTE!)

**Execute este script UMA VEZ para configurar tudo automaticamente:**

1. No menu lateral esquerdo, clique em **SQL Editor**
2. Clique em **"+ New Query"**
3. Abra o arquivo **`docs/database/configurar-auto-refresh-permanente.sql`**
4. Copie TODO o conteúdo do arquivo
5. Cole no SQL Editor
6. Clique em **"Run"** (ou pressione `Ctrl + Enter`)
7. Aguarde ver: ✅ **"Success"**

**O que este script faz:**
- ✅ Garante que TODAS as tabelas estão na publicação `supabase_realtime`
- ✅ Configura timeouts para manter conexões vivas (300 segundos)
- ✅ Configura keepalive TCP para manter conexões ativas
- ✅ Verifica automaticamente se tudo está configurado

**Após executar o script:**
- A aplicação vai atualizar automaticamente sem precisar de F5
- As subscriptions vão funcionar corretamente
- A conexão vai se manter viva mesmo sem atividade
- Os dados vão sincronizar automaticamente

**Verificar se funcionou:**
- O script já mostra as tabelas na publicação ao final
- Você deve ver todas as suas tabelas listadas
- Se alguma tabela estiver faltando, o script tenta adicionar automaticamente

**✅ Este é o script PRINCIPAL - execute uma vez e está tudo configurado!**

### ✅ PASSO 3: Verificar Database Settings

1. No menu lateral, vá em **Database > Settings**
2. Verifique as configurações de timeout:
   - **Statement timeout**: Deve ser pelo menos 60 segundos (recomendado: 300 segundos)
   - **Idle timeout**: Deve ser pelo menos 60 segundos (recomendado: 300 segundos)

### 2. Configurações de Timeout

No Supabase Dashboard, você pode ajustar:

1. **Database > Connection Pooling**:
   - Use connection pooling para melhor gerenciamento de conexões
   - Configure timeouts adequados (recomendado: 60 segundos ou mais)

2. **Database > Settings**:
   - Verifique se não há restrições muito agressivas de timeout
   - Certifique-se de que o banco permite conexões de longa duração

### 3. Configurações de RLS (Row Level Security)

Certifique-se de que as políticas RLS estão configuradas corretamente:

```sql
-- Exemplo de política que permite conexões persistentes
-- (já deve estar configurado no seu projeto)
```

### 4. Configurações de Webhook/Functions (se aplicável)

Se você usa Edge Functions ou Webhooks:

- Configure timeouts adequados (mínimo 60 segundos)
- Certifique-se de que não há restrições que causem desconexão

## 🔧 Configurações Já Implementadas no Código

O código já está configurado com:

1. **Heartbeat a cada 15 segundos**: Mantém a conexão viva enviando sinais periódicos
2. **Reconexão automática**: Detecta desconexões e reconecta automaticamente
3. **Health check a cada 30 segundos**: Verifica se a conexão está ativa
4. **Refresh de dados a cada 45 segundos**: Mantém os dados sincronizados
5. **Listeners de visibilidade**: Reconecta quando a página volta a ficar visível
6. **Auto-refresh de token**: Renova o token automaticamente antes de expirar

## 🚀 Melhorias Implementadas

### Heartbeat mais Agressivo
- **Antes**: 30 segundos
- **Agora**: 15 segundos

### Reconexão mais Rápida
- **Antes**: Máximo 10 segundos
- **Agora**: Máximo 5 segundos

### Health Check mais Frequente
- **Antes**: A cada 60 segundos
- **Agora**: A cada 30 segundos

### Refresh de Dados mais Frequente
- **Antes**: A cada 60 segundos
- **Agora**: A cada 45 segundos

### Detecção Automática de Desconexão
- Detecta quando subscriptions desconectam (CHANNEL_ERROR, TIMED_OUT, CLOSED)
- Reconecta automaticamente após 2 segundos

### Reconexão ao Voltar
- Reconecta quando a página volta a ficar visível
- Reconecta quando a janela ganha foco

## 📝 Notas Importantes

1. **Não há necessidade de F5**: A aplicação agora reconecta automaticamente
2. **Conexão sempre viva**: O heartbeat mantém a conexão ativa mesmo sem atividade
3. **Sincronização automática**: Os dados são atualizados automaticamente
4. **Silencioso**: Tudo acontece em background sem interromper o usuário

## 🔍 Verificação

Para verificar se está funcionando:

1. Abra o console do navegador (F12)
2. Procure por mensagens de conexão (se `enableLogs: true`)
3. Deixe a aplicação aberta por alguns minutos sem interação
4. Verifique se os dados continuam atualizando automaticamente

## ⚠️ Troubleshooting

Se a aplicação ainda "morrer":

1. Verifique se há erros no console
2. Verifique se o Supabase está acessível
3. Verifique se há problemas de rede/firewall
4. Verifique se as configurações de RLS estão corretas
5. Verifique se o token de autenticação não está expirando

## 🎯 Próximos Passos

Se ainda houver problemas, considere:

1. Aumentar ainda mais a frequência do heartbeat (10 segundos)
2. Adicionar mais verificações de conexão
3. Implementar um sistema de retry mais agressivo
4. Configurar um service worker para manter a conexão mesmo quando a aba está em background

