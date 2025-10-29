# 📚 Documentação Flexi Gestor

Bem-vindo à documentação completa do **Flexi Gestor**! 

Este é um sistema de gestão empresarial moderno, construído com React, TypeScript, Supabase e implantado no Netlify.

---

## 🗂️ Organização da Documentação

### 📘 [Guias](./guias/)

Guias para começar a usar e entender o sistema:

- **[INICIO-RAPIDO.md](./guias/INICIO-RAPIDO.md)** - Como começar rapidamente com o projeto
- **[RODAR-SISTEMA.md](./guias/RODAR-SISTEMA.md)** - Como rodar o sistema localmente
- **[GUIA-FINAL-SUPABASE.md](./guias/GUIA-FINAL-SUPABASE.md)** - Guia completo de configuração do Supabase
- **[ESTRUTURA-PROJETO.md](./guias/ESTRUTURA-PROJETO.md)** - Entenda a estrutura do projeto

### 🚀 [Deploy](./deploy/)

Guias para colocar o sistema em produção:

- **[DEPLOY-NETLIFY.md](./deploy/DEPLOY-NETLIFY.md)** - Guia completo de deploy no Netlify
- **[CONFIGURAR-URLS-SUPABASE.md](./deploy/CONFIGURAR-URLS-SUPABASE.md)** - Configurar URLs para produção

### 📧 [Emails](./emails/)

Templates e configuração de emails de autenticação:

#### Guias:
- **[CONFIGURAR-EMAILS.md](./emails/CONFIGURAR-EMAILS.md)** - Como configurar os templates de email
- **[PASSO-A-PASSO-EMAILS.md](./emails/PASSO-A-PASSO-EMAILS.md)** - Guia visual passo a passo
- **[APLICAR-EMAILS-SUPABASE.txt](./emails/APLICAR-EMAILS-SUPABASE.txt)** - Instruções rápidas de aplicação

#### Templates HTML:
- **[email-reset-password.html](./emails/email-reset-password.html)** - Template de reset de senha
- **[email-confirm-signup.html](./emails/email-confirm-signup.html)** - Template de confirmação de cadastro
- **[email-magic-link.html](./emails/email-magic-link.html)** - Template de magic link
- **[email-change-email.html](./emails/email-change-email.html)** - Template de mudança de email

### 🗄️ [Database](./database/)

Schemas e scripts SQL do banco de dados:

- **[supabase-schema-completo.sql](./database/supabase-schema-completo.sql)** - Schema completo do banco
- **[resetar-banco-completo.sql](./database/resetar-banco-completo.sql)** - Script para resetar o banco
- **[RESETAR-BANCO.md](./database/RESETAR-BANCO.md)** - Guia de como resetar o banco

### 📝 [Histórico](./historico/)

Documentação histórica e changelog:

- **[CHANGELOG-ORGANIZACAO.md](./historico/CHANGELOG-ORGANIZACAO.md)** - Histórico de mudanças e organização

---

## 🚀 Começando Rapidamente

### Para Desenvolvedores:

1. **Primeiro passo:** Leia o [INICIO-RAPIDO.md](./guias/INICIO-RAPIDO.md)
2. **Configurar Supabase:** Siga o [GUIA-FINAL-SUPABASE.md](./guias/GUIA-FINAL-SUPABASE.md)
3. **Rodar localmente:** Veja [RODAR-SISTEMA.md](./guias/RODAR-SISTEMA.md)

### Para Deploy em Produção:

1. **Deploy no Netlify:** Siga o [DEPLOY-NETLIFY.md](./deploy/DEPLOY-NETLIFY.md)
2. **Configurar URLs:** Aplique [CONFIGURAR-URLS-SUPABASE.md](./deploy/CONFIGURAR-URLS-SUPABASE.md)
3. **Personalizar Emails:** Use os guias em [emails/](./emails/)

---

## 🎯 Arquitetura do Sistema

```
┌─────────────────────────────────────────────────────┐
│           Frontend (React + TypeScript)             │
│              Hospedado no Netlify                   │
├─────────────────────────────────────────────────────┤
│  • React Router (navegação)                         │
│  • Tailwind CSS (estilos)                          │
│  • Shadcn/ui (componentes)                         │
│  • Zustand/Context (estado global)                 │
└────────────────┬────────────────────────────────────┘
                 │
                 │ HTTPS
                 │
                 ▼
┌─────────────────────────────────────────────────────┐
│              Backend (Supabase)                     │
├─────────────────────────────────────────────────────┤
│  🔐 Authentication                                  │
│     • Email/Password                               │
│     • Password Recovery                            │
│     • Email Verification                           │
│                                                     │
│  🗄️ PostgreSQL Database                            │
│     • perfis (usuários)                            │
│     • produtos (products)                          │
│     • lotes (batches)                              │
│     • movimentacoes (stock movements)              │
│                                                     │
│  🔒 Row Level Security (RLS)                       │
│     • Isolamento de dados por usuário             │
│     • Políticas de segurança automáticas          │
│                                                     │
│  📊 API REST Automática                            │
│     • CRUD gerado automaticamente                  │
│     • Filtros e queries                            │
└─────────────────────────────────────────────────────┘
```

---

## 🛠️ Stack Tecnológica

### Frontend:
- **React 18** - Framework UI
- **TypeScript** - Tipagem estática
- **Vite** - Build tool
- **Tailwind CSS** - Estilos utilitários
- **Shadcn/ui** - Componentes UI
- **React Router** - Roteamento
- **React Hook Form** - Formulários
- **Lucide React** - Ícones

### Backend:
- **Supabase** - Backend as a Service
  - PostgreSQL (banco de dados)
  - Authentication (autenticação)
  - Row Level Security (segurança)
  - PostgREST (API automática)
  - Realtime (tempo real)

### Deploy:
- **Netlify** - Hospedagem frontend
- **GitHub** - Controle de versão

---

## 📖 Estrutura de Pastas

```
flexi-gestor/
├── docs/                    # 📚 Esta documentação
│   ├── guias/              # Guias de uso
│   ├── deploy/             # Deploy e produção
│   ├── emails/             # Templates de email
│   ├── database/           # Schemas SQL
│   └── historico/          # Changelog
│
├── src/
│   ├── components/         # Componentes React
│   ├── contexts/           # Context API (estado global)
│   ├── pages/              # Páginas da aplicação
│   ├── lib/                # Utilitários e configurações
│   └── hooks/              # Custom hooks
│
├── public/                 # Arquivos públicos
├── netlify.toml           # Configuração do Netlify
└── package.json           # Dependências
```

---

## 🔗 Links Úteis

### Serviços:
- [Supabase Dashboard](https://supabase.com/dashboard)
- [Netlify Dashboard](https://app.netlify.com)
- [GitHub Repository](https://github.com/ALucas314/flexi-gestor)

### Documentação Oficial:
- [React](https://react.dev)
- [TypeScript](https://www.typescriptlang.org/docs)
- [Supabase](https://supabase.com/docs)
- [Netlify](https://docs.netlify.com)
- [Tailwind CSS](https://tailwindcss.com/docs)
- [Shadcn/ui](https://ui.shadcn.com)

---

## 🤝 Contribuindo

Este é um projeto em desenvolvimento ativo. Sugestões e melhorias são bem-vindas!

---

## 📄 Licença

Este projeto é proprietário e todos os direitos são reservados.

© 2025 Flexi Gestor. Todos os direitos reservados.

---

## 📞 Suporte

Para dúvidas ou suporte, consulte os guias na pasta [guias/](./guias/) ou verifique o histórico de mudanças em [historico/](./historico/).

---

**Feito com ❤️ usando React, TypeScript e Supabase**

