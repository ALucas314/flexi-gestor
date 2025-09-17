import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import { Header } from "@/components/layout/Header";
import Index from "./pages/Index";
import Produtos from "./pages/Produtos";
import Entradas from "./pages/Entradas";
import Saidas from "./pages/Saidas";
import Movimentacoes from "./pages/Movimentacoes";
import Relatorios from "./pages/Relatorios";
import Configuracoes from "./pages/Configuracoes";
import Perfil from "./pages/Perfil";
import AlterarSenha from "./pages/AlterarSenha";
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
              
              {/* Rotas Protegidas */}
              <Route path="/*" element={
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
              } />
            </Routes>
          </BrowserRouter>
        </FirebaseDataProvider>
      </FirebaseAuthProvider>
    </TooltipProvider>
  </QueryClientProvider>
);

export default App;
