# 🔧 Corrigir Deployment no Netlify

## ❌ Problema

O deployment "master - flexi-gestor-api" está dando erro porque o Netlify está configurado para fazer deploy da branch `master`, mas agora estamos usando a branch `main`.

## ✅ Solução

### 1. Atualizar Configuração no Netlify

1. **Acesse o painel do Netlify**: https://app.netlify.com
2. **Selecione seu site** (flexi-gestor-api ou similar)
3. Vá em **Site settings** → **Build & deploy** → **Continuous Deployment**
4. **Branch to deploy**: Mude de `master` para `main`
5. **Clique em "Save"**

### 2. Verificar Variáveis de Ambiente

Certifique-se de que as variáveis de ambiente estão configuradas:

1. **Site settings** → **Environment variables**
2. Verifique se existem:
   - `VITE_SUPABASE_URL`
   - `VITE_SUPABASE_ANON_KEY`

### 3. Forçar Novo Deploy

1. Vá em **Deploys**
2. Clique em **Trigger deploy** → **Deploy site**
3. Aguarde o build completar

## 🔄 Alternativa: Deletar e Reconectar

Se a opção acima não funcionar:

### 1. Deletar Site no Netlify
1. **Site settings** → **General** → **Delete site**
2. Confirme a exclusão

### 2. Reconectar
1. **Add new site** → **Import from Git**
2. Selecione **GitHub**
3. Escolha o repositório
4. **Configure**:
   - **Branch to deploy**: `main`
   - **Build command**: `npm run build`
   - **Publish directory**: `dist`
5. **Configure as variáveis de ambiente** novamente
6. **Deploy site**

## 📋 Checklist

- [ ] Netlify configurado para branch `main`
- [ ] Variáveis de ambiente configuradas
- [ ] Deploy automático ativado
- [ ] Build completando sem erros
- [ ] Site funcionando corretamente

## 🚀 Depois do Fix

O Netlify vai fazer deploy automaticamente sempre que você fizer `git push` na branch `main`:

```bash
git add .
git commit -m "✨ Nova feature"
git push origin main
```

O Netlify detecta automaticamente e faz o deploy! ✅

