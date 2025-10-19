# 🐛 Debug - Página Branca

## Passo a Passo para Debug:

### 1️⃣ Abra o DevTools do Navegador

Pressione **F12** ou **Ctrl+Shift+I** no navegador

### 2️⃣ Vá para a aba "Console"

Procure por erros em vermelho

### 3️⃣ Erros Comuns:

**Se aparecer erro de importação:**
```
Failed to resolve module
```
→ Recarregue a página (Ctrl+R)

**Se aparecer erro de CORS:**
```
Access-Control-Allow-Origin
```
→ O backend não está rodando

**Se aparecer erro de fetch:**
```
Failed to fetch
```
→ O backend não iniciou ainda

### 4️⃣ Soluções Rápidas:

**Solução 1: Recarregar com Cache Limpo**
```
Ctrl + Shift + R
```

**Solução 2: Verificar se Backend está rodando**
Você deve ver no terminal:
```
[1] 🚀 Servidor rodando em http://localhost:3001
```

**Solução 3: Testar Backend Diretamente**
Abra em outra aba:
```
http://localhost:3001
```
Deve aparecer: `🚀 API Flexi Gestor está rodando!`

### 5️⃣ Se Nada Funcionar:

Pare tudo (Ctrl+C) e rode novamente:
```bash
npm run dev:all
```

Aguarde até ver as duas mensagens:
- Frontend ready
- Servidor rodando

---

## 🔍 Me diga o que você vê no Console!

Cole aqui os erros que aparecem em vermelho no Console do navegador.

