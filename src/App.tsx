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
import FirebaseConfig from "./pages/FirebaseConfig"; // Nova página de configuração
import TestAuth from "./pages/TestAuth"; // Teste de autenticação
import LoginBackup from "./pages/LoginBackup"; // Login de backup
import Perfil from "./pages/Perfil"; // Página de perfil
import AlterarSenha from "./pages/AlterarSenha"; // Alterar senha
import Login from "./pages/Login"; // Página principal de login
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
              
              {/* 🔄 Login de Backup (funciona sem Firebase) */}
              <Route path="/login-backup" element={<LoginBackup />} />
              
              {/* 🔥 Nova rota para configuração do Firebase */}
              <Route path="/firebase-config" element={<FirebaseConfig />} />
              
              {/* 🧪 Rota para teste do Firebase */}
              
              {/* 🔐 Rota para teste de autenticação */}
              <Route path="/test-auth" element={<TestAuth />} />
              
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
                              <Route path="/perfil" element={<Perfil />} />
                              <Route path="/alterar-senha" element={<AlterarSenha />} />
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
