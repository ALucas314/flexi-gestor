# 📁 ESTRUTURA DO PROJETO FLEXI GESTOR

## 📂 Organização de Pastas

```
flexi-gestor/
├── 📁 docs/                          # Documentação do projeto
│   ├── GUIA-FINAL-SUPABASE.md       # Guia completo de configuração
│   ├── INICIO-SUPABASE.md           # Guia rápido de início
│   ├── SUPABASE-SETUP.md            # Setup detalhado do Supabase
│   ├── supabase-schema.sql          # Schema SQL do banco
│   ├── INICIO-RAPIDO.md             # Guia de início rápido
│   └── RODAR-SISTEMA.md             # Como rodar o sistema
│
├── 📁 public/                        # Arquivos públicos estáticos
│   ├── favicon.svg                  # Ícone do site
│   └── manifest.json                # Manifest PWA
│
├── 📁 src/                           # Código fonte principal
│   │
│   ├── 📁 assets/                    # Imagens e recursos
│   │   └── dashboard-hero.jpg
│   │
│   ├── 📁 components/                # Componentes React
│   │   │
│   │   ├── 📁 dashboard/            # Componentes do Dashboard
│   │   │   ├── ProductsChart.tsx    # Gráfico de produtos
│   │   │   ├── QuickActions.tsx     # Ações rápidas
│   │   │   ├── RecentMovements.tsx  # Movimentações recentes
│   │   │   ├── SalesChart.tsx       # Gráfico de vendas
│   │   │   ├── StatsCard.tsx        # Card de estatísticas
│   │   │   └── StockChart.tsx       # Gráfico de estoque
│   │   │
│   │   ├── 📁 layout/               # Componentes de Layout
│   │   │   ├── Header.tsx           # Cabeçalho
│   │   │   ├── Sidebar.tsx          # Barra lateral
│   │   │   ├── MobileNav.tsx        # Navegação mobile
│   │   │   ├── LayoutWithSidebar.tsx # Layout com sidebar
│   │   │   ├── PageLayout.tsx       # Layout de página
│   │   │   └── index.ts             # Exports
│   │   │
│   │   ├── 📁 ui/                   # Componentes UI (Shadcn)
│   │   │   ├── button.tsx
│   │   │   ├── card.tsx
│   │   │   ├── dialog.tsx
│   │   │   ├── input.tsx
│   │   │   ├── table.tsx
│   │   │   └── ... (40+ componentes)
│   │   │
│   │   ├── AuthGuard.tsx            # Proteção de rotas
│   │   ├── BatchManager.tsx         # Gerenciador de lotes
│   │   └── ClearDataButton.tsx      # Botão de limpar dados
│   │
│   ├── 📁 contexts/                  # Contextos React
│   │   ├── AuthContext.tsx          # Contexto de autenticação
│   │   ├── DataContext.tsx          # Contexto de dados
│   │   └── SidebarContext.tsx       # Contexto da sidebar
│   │
│   ├── 📁 hooks/                     # Hooks customizados
│   │   ├── use-mobile.tsx           # Hook para detectar mobile
│   │   ├── use-responsive.tsx       # Hook de responsividade
│   │   └── use-toast.ts             # Hook de toast
│   │
│   ├── 📁 lib/                       # Bibliotecas e utilitários
│   │   ├── supabase.ts              # Cliente Supabase
│   │   ├── batches.ts               # Helper de lotes
│   │   └── utils.ts                 # Utilitários gerais
│   │
│   ├── 📁 pages/                     # Páginas da aplicação
│   │   ├── Index.tsx                # Dashboard (home)
│   │   ├── Login.tsx                # Login/Registro
│   │   ├── ForgotPassword.tsx       # Recuperar senha
│   │   ├── ResetPassword.tsx        # Redefinir senha
│   │   ├── AlterarSenha.tsx         # Alterar senha
│   │   ├── Perfil.tsx               # Perfil do usuário
│   │   ├── Produtos.tsx             # Gestão de produtos
│   │   ├── Entradas.tsx             # Entrada de estoque
│   │   ├── Saidas.tsx               # Saída de estoque
│   │   ├── PDV.tsx                  # Ponto de Venda
│   │   ├── Financeiro.tsx           # Módulo financeiro
│   │   ├── Relatorios.tsx           # Relatórios
│   │   ├── NotFound.tsx             # Página 404
│   │   └── Test.tsx                 # Página de testes
│   │
│   ├── App.tsx                       # Componente principal
│   ├── App.css                       # Estilos do App
│   ├── main.tsx                      # Entry point
│   ├── index.css                     # Estilos globais
│   ├── fonts.css                     # Fontes customizadas
│   └── vite-env.d.ts                # Tipos do Vite
│
├── 📄 .env                           # Variáveis de ambiente (NÃO versionar!)
├── 📄 .gitignore                     # Arquivos ignorados pelo Git
├── 📄 README.md                      # README principal
├── 📄 package.json                   # Dependências do projeto
├── 📄 package-lock.json              # Lock de dependências
├── 📄 vite.config.ts                 # Configuração do Vite
├── 📄 tsconfig.json                  # Configuração TypeScript
├── 📄 tsconfig.app.json              # Config TS da aplicação
├── 📄 tsconfig.node.json             # Config TS do Node
├── 📄 tailwind.config.ts             # Configuração Tailwind
├── 📄 postcss.config.js              # Configuração PostCSS
├── 📄 eslint.config.js               # Configuração ESLint
├── 📄 components.json                # Configuração Shadcn
└── 📄 index.html                     # HTML principal

```

---

## 📋 Descrição dos Principais Diretórios

### 📁 `src/components/`
Componentes React reutilizáveis, organizados por função:
- **dashboard/**: Componentes específicos do dashboard
- **layout/**: Estrutura e navegação
- **ui/**: Componentes base do Shadcn UI

### 📁 `src/contexts/`
Gerenciamento de estado global:
- **AuthContext**: Autenticação com Supabase Auth
- **DataContext**: Produtos, movimentações e notificações
- **SidebarContext**: Estado da sidebar

### 📁 `src/pages/`
Páginas da aplicação (rotas):
- Cada arquivo representa uma rota
- Utilizam componentes e contextos
- Layouts consistentes

### 📁 `src/lib/`
Bibliotecas e helpers:
- **supabase.ts**: Cliente configurado do Supabase
- **batches.ts**: Funções para gerenciar lotes
- **utils.ts**: Funções utilitárias

### 📁 `docs/`
Toda a documentação do projeto:
- Guias de configuração
- Scripts SQL
- Instruções de uso

---

## 🔧 Arquivos de Configuração

| Arquivo | Descrição |
|---------|-----------|
| `vite.config.ts` | Configuração do build tool Vite |
| `tsconfig.json` | Configuração TypeScript |
| `tailwind.config.ts` | Configuração do Tailwind CSS |
| `eslint.config.js` | Regras de linting |
| `components.json` | Configuração do Shadcn UI |
| `.env` | Variáveis de ambiente (credenciais) |

---

## 🚀 Scripts Disponíveis

```bash
# Desenvolvimento
npm run dev          # Rodar em modo desenvolvimento

# Build
npm run build        # Build para produção

# Preview
npm run preview      # Visualizar build de produção

# Linting
npm run lint         # Verificar código
```

---

## 📦 Principais Dependências

### Core
- **React 18** - Framework UI
- **TypeScript** - Type safety
- **Vite** - Build tool

### UI
- **Tailwind CSS** - Estilização
- **Shadcn UI** - Componentes base
- **Lucide React** - Ícones

### Backend
- **Supabase** - Backend completo
  - PostgreSQL
  - Auth
  - API automática
  - Row Level Security

### Ferramentas
- **React Hook Form** - Formulários
- **Recharts** - Gráficos
- **React Router** - Roteamento
- **Zod** - Validação

---

## 🔐 Variáveis de Ambiente

Arquivo `.env`:
```env
VITE_SUPABASE_URL=sua_url_aqui
VITE_SUPABASE_ANON_KEY=sua_chave_aqui
```

---

## 🎯 Fluxo de Desenvolvimento

1. **Desenvolvimento Local**: `npm run dev`
2. **Teste Visual**: Verificar em http://localhost:5173
3. **Linting**: `npm run lint`
4. **Build**: `npm run build`
5. **Preview Build**: `npm run preview`
6. **Deploy**: Upload da pasta `dist/`

---

## ✨ Características da Arquitetura

- ✅ **Separação de Concerns**: Components, Pages, Contexts
- ✅ **Type Safety**: TypeScript em todo o código
- ✅ **Code Splitting**: Lazy loading automático
- ✅ **Responsive**: Mobile-first design
- ✅ **Modular**: Componentes reutilizáveis
- ✅ **Escalável**: Fácil adicionar novas features
- ✅ **Maintainable**: Código organizado e documentado

---

## 📝 Convenções de Código

### Nomenclatura
- **Componentes**: PascalCase (ex: `ProductCard.tsx`)
- **Hooks**: camelCase com "use" prefix (ex: `useAuth.tsx`)
- **Utilitários**: camelCase (ex: `formatDate.ts`)
- **Constantes**: UPPER_SNAKE_CASE

### Estrutura de Componentes
```tsx
// Imports
import { ... } from '...'

// Types/Interfaces
interface Props { ... }

// Component
export const Component = ({ props }: Props) => {
  // Hooks
  // States
  // Effects
  // Functions
  // Render
}
```

---

**📌 Esta estrutura está otimizada para o Supabase e não requer servidor Express!**

