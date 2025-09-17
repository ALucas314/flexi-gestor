# 🚀 Guia para Commit no GitHub - Flexi Gestor

## 📋 **Passos para Fazer Commit do Projeto**

### **1. Instalar Git (se necessário)**
Se o Git não estiver instalado:
- Baixe em: https://git-scm.com/download/win
- Instale e reinicie o terminal

### **2. Configurar Git (primeira vez)**
```bash
git config --global user.name "Seu Nome"
git config --global user.email "seu.email@gmail.com"
```

### **3. Inicializar Repositório Git**
```bash
# Na pasta do projeto
git init
```

### **4. Adicionar Arquivos**
```bash
# Adicionar todos os arquivos
git add .

# Ou adicionar arquivos específicos
git add README.md
git add src/
git add package.json
```

### **5. Fazer Primeiro Commit**
```bash
git commit -m "feat: Implementação inicial do Flexi Gestor

- Sistema completo de gestão de produtos
- Interface responsiva com Tailwind CSS
- Integração com Firebase
- Dashboard com gráficos e estatísticas
- Sistema de autenticação
- Gestão de estoque e movimentações
- Relatórios e análises"
```

### **6. Conectar com Repositório Remoto**
```bash
# Adicionar o repositório remoto
git remote add origin https://github.com/ALucas314/flexi-gestor.git

# Verificar se foi adicionado
git remote -v
```

### **7. Fazer Push para GitHub**
```bash
# Primeiro push (criar branch main)
git branch -M main
git push -u origin main
```

### **8. Commits Futuros**
```bash
# Adicionar mudanças
git add .

# Commit com mensagem descritiva
git commit -m "feat: Adicionar funcionalidade X"

# Push para GitHub
git push origin main
```

## 📝 **Convenções de Commit**

### **Tipos de Commit:**
- `feat:` Nova funcionalidade
- `fix:` Correção de bug
- `docs:` Documentação
- `style:` Formatação, espaços, etc.
- `refactor:` Refatoração de código
- `test:` Adicionar testes
- `chore:` Tarefas de manutenção

### **Exemplos de Mensagens:**
```bash
git commit -m "feat: Adicionar sistema de notificações"
git commit -m "fix: Corrigir sincronização com Firebase"
git commit -m "docs: Atualizar README com instruções de instalação"
git commit -m "style: Melhorar responsividade da página de produtos"
git commit -m "refactor: Otimizar contexto de autenticação"
```

## 🔧 **Comandos Úteis**

### **Verificar Status**
```bash
git status
```

### **Ver Histórico**
```bash
git log --oneline
```

### **Desfazer Último Commit**
```bash
git reset --soft HEAD~1
```

### **Ver Diferenças**
```bash
git diff
```

### **Clonar Repositório**
```bash
git clone https://github.com/ALucas314/flexi-gestor.git
```

## 🚨 **Problemas Comuns e Soluções**

### **Erro: "fatal: not a git repository"**
```bash
git init
```

### **Erro: "remote origin already exists"**
```bash
git remote remove origin
git remote add origin https://github.com/ALucas314/flexi-gestor.git
```

### **Erro: "permission denied"**
- Verificar se está logado no GitHub
- Usar token de acesso pessoal

### **Conflitos de Merge**
```bash
git pull origin main
# Resolver conflitos manualmente
git add .
git commit -m "resolve: Conflitos de merge"
git push origin main
```

## 📊 **Estrutura do Repositório**

```
flexi-gestor/
├── .gitignore          # Arquivos ignorados
├── README.md           # Documentação principal
├── package.json        # Dependências
├── src/                # Código fonte
│   ├── components/     # Componentes React
│   ├── pages/          # Páginas da aplicação
│   ├── contexts/       # Contextos React
│   ├── hooks/          # Hooks customizados
│   └── lib/            # Utilitários
├── public/             # Arquivos públicos
└── docs/               # Documentação adicional
```

## 🎯 **Próximos Passos**

1. **Fazer commit inicial** com todas as funcionalidades
2. **Configurar GitHub Actions** para CI/CD
3. **Criar issues** para próximas funcionalidades
4. **Configurar branch de desenvolvimento**
5. **Adicionar badges** no README

## 📞 **Suporte**

Se encontrar problemas:
- Verificar se o Git está instalado
- Confirmar credenciais do GitHub
- Verificar conexão com internet
- Consultar documentação do Git

---

**🎉 Parabéns! Seu projeto Flexi Gestor estará no GitHub!**
