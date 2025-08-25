# 📊 DADOS DE TESTE - FLEXI GESTOR

Este diretório contém dados de teste para popular a aplicação Flexi Gestor com informações realistas.

## 🚀 **ARQUIVOS CRIADOS:**

### 1. `test-data.ts` - Dados de Teste
- **20 produtos** com categorias variadas (Eletrônicos, Informática, Acessórios, Redes)
- **5 entradas** de estoque com fornecedores e custos
- **5 vendas** com clientes e valores
- Dados realistas com preços em Reais (R$)

### 2. `insert-test-data.ts` - Integrador
- Conecta os dados de teste com a aplicação
- Simula inserção assíncrona
- Verifica se a aplicação está pronta

### 3. `README-TEST-DATA.md` - Este arquivo
- Instruções de uso
- Documentação dos dados

## 📦 **PRODUTOS INCLUÍDOS:**

| Categoria | Quantidade | Exemplos |
|-----------|------------|----------|
| **Eletrônicos** | 4 | Smartphone Samsung, Smart TV LG |
| **Informática** | 12 | Notebook Dell, Processador AMD, Placa de Vídeo |
| **Acessórios** | 3 | Fone Sony, Mouse Gamer, Teclado Mecânico |
| **Redes** | 2 | Roteador TP-Link, Switch Cisco |

## 💰 **VALORES E ESTOQUES:**

- **Produtos Premium**: R$ 1.899,99 - R$ 3.899,99
- **Produtos Médios**: R$ 299,99 - R$ 1.299,99
- **Produtos Básicos**: R$ 199,99 - R$ 899,99
- **Estoques Variados**: 16 - 89 unidades por produto

## 🔧 **COMO USAR:**

### **Opção 1: Importar e Usar**
```typescript
import { testProducts, testEntries, testSales } from './test-data';

// Usar os dados diretamente
console.log(testProducts.length); // 20 produtos
console.log(testEntries.length);  // 5 entradas
console.log(testSales.length);    // 5 vendas
```

### **Opção 2: Executar Inserção Simulada**
```typescript
import { runTestDataInsertion } from './insert-test-data';

// Executar inserção completa
runTestDataInsertion();
```

### **Opção 3: Usar Funções Individuais**
```typescript
import { insertTestData, clearTestData } from './test-data';

// Inserir dados
insertTestData();

// Limpar dados (se necessário)
clearTestData();
```

## 📊 **ESTRUTURA DOS DADOS:**

### **Produtos:**
```typescript
{
  id: 'prod-001',
  name: 'Smartphone Samsung Galaxy S23',
  sku: 'SAMS-GS23-128',
  category: 'Eletrônicos',
  stock: 45,
  unitPrice: 2499.99,
  minStock: 10,
  description: 'Smartphone premium com câmera de 108MP'
}
```

### **Entradas:**
```typescript
{
  id: 'ent-001',
  productId: 'prod-001',
  productName: 'Smartphone Samsung Galaxy S23',
  supplier: 'Samsung Electronics',
  quantity: 50,
  unitCost: 1899.99,
  totalCost: 94999.50,
  entryDate: '2024-01-15',
  status: 'aprovado'
}
```

### **Vendas:**
```typescript
{
  id: 'sai-001',
  productId: 'prod-001',
  productName: 'Smartphone Samsung Galaxy S23',
  customer: 'João Silva',
  quantity: 2,
  unitPrice: 2499.99,
  total: 4999.98,
  saleDate: '2024-01-20',
  type: 'saida'
}
```

## ⚠️ **IMPORTANTE:**

- ✅ **COMPLETAMENTE INDEPENDENTE** - Pode ser deletado sem afetar a aplicação
- ✅ **DADOS REALISTAS** - Preços, categorias e descrições realistas
- ✅ **FORMATO BRASILEIRO** - Valores em Reais (R$) com vírgula decimal
- ✅ **SKUs ÚNICOS** - Cada produto tem identificador único
- ✅ **CATEGORIAS ORGANIZADAS** - Fácil de filtrar e organizar

## 🗑️ **COMO REMOVER:**

Para remover todos os dados de teste, simplesmente delete os arquivos:
```bash
rm test-data.ts
rm insert-test-data.ts
rm README-TEST-DATA.md
```

A aplicação continuará funcionando normalmente sem esses arquivos.

## 🎯 **CASOS DE USO:**

1. **🧪 Testes de Desenvolvimento**
2. **📊 Demonstrações para Clientes**
3. **🎓 Aprendizado e Estudos**
4. **🔍 Validação de Funcionalidades**
5. **📈 Testes de Performance**

---

**🎉 Agora você tem dados realistas para testar todas as funcionalidades do Flexi Gestor!**
