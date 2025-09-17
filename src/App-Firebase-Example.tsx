// 🔥 Exemplo de integração do Firebase no App.tsx
// Este arquivo mostra como integrar os contextos Firebase no aplicativo

import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import { Header } from "@/components/layout/Header";
import AuthGuard from "@/components/AuthGuard";
import Index from "./pages/Index";
import Produtos from "./pages/Produtos";
import Entradas from "./pages/Entradas";
import Saidas from "./pages/Saidas";
import Movimentacoes from "./pages/Movimentacoes";
import Relatorios from "./pages/Relatorios";
import Configuracoes from "./pages/Configuracoes";
import FirebaseConfig from "./pages/FirebaseConfig"; // Nova página
import Login from "./pages/Login";
import NotFound from "./pages/NotFound";

// 🔥 Importar contextos Firebase
import { FirebaseAuthProvider } from "./contexts/FirebaseAuthContext";
import { FirebaseDataProvider } from "./contexts/FirebaseDataContext";

const queryClient = new QueryClient();

const App = () => (
  <QueryClientProvider client={queryClient}>
    <TooltipProvider>
      {/* 🔥 Firebase Auth Provider - Gerencia autenticação persistente */}
      <FirebaseAuthProvider>
        {/* 🔥 Firebase Data Provider - Gerencia dados do Firestore */}
        <FirebaseDataProvider>
          <Toaster />
          <Sonner />
          <BrowserRouter>
            <Routes>
              {/* Rota de Login (sem proteção) */}
              <Route path="/login" element={<Login />} />
              
              {/* 🔥 Nova rota para configuração do Firebase */}
              <Route path="/firebase-config" element={<FirebaseConfig />} />
              
              {/* Rotas Protegidas */}
              <Route path="/*" element={
                <AuthGuard>
                  <div className="min-h-screen bg-background">
                    <Header />
                    <div className="pt-20">
                      <div className="flex-1">
                        <Routes>
                          <Route path="/" element={<Index />} />
                          <Route path="/produtos" element={<Produtos />} />
                          <Route path="/entradas" element={<Entradas />} />
                          <Route path="/saidas" element={<Saidas />} />
                          <Route path="/movimentacoes" element={<Movimentacoes />} />
                          <Route path="/relatorios" element={<Relatorios />} />
                          <Route path="/configuracoes" element={<Configuracoes />} />
                          <Route path="*" element={<NotFound />} />
                        </Routes>
                      </div>
                    </div>
                  </div>
                </AuthGuard>
              } />
            </Routes>
          </BrowserRouter>
        </FirebaseDataProvider>
      </FirebaseAuthProvider>
    </TooltipProvider>
  </QueryClientProvider>
);

export default App;

/* 
📝 INSTRUÇÕES PARA INTEGRAÇÃO:

1. 🔄 Substitua o conteúdo do App.tsx pelo código acima

2. 🔧 Atualize os imports nas páginas que usam dados:
   - Troque `useData` por `useFirebaseData`
   - Troque `useAuth` por `useFirebaseAuth`

3. 📱 Adicione link para configuração do Firebase no menu:
   - Em Header.tsx ou Sidebar.tsx
   - Adicione: <Link to="/firebase-config">Configurar Firebase</Link>

4. 🚀 Configure o Firebase:
   - Acesse /firebase-config no navegador
   - Siga as instruções da página
   - Ou configure manualmente em src/lib/firebaseConfig.ts

5. ✅ Teste a funcionalidade:
   - Faça login/cadastro
   - Verifique se os dados são salvos no Firestore
   - Teste a persistência da sessão

🎯 BENEFÍCIOS:
- Sessão que nunca expira
- Dados sincronizados em tempo real
- Backup automático na nuvem
- Acesso multi-dispositivo
- Funciona offline com sincronização
*/
