import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import { LayoutWithSidebar } from "@/components/layout/LayoutWithSidebar";
import AuthGuard from "@/components/AuthGuard";
import Index from "./pages/Index";
import Produtos from "./pages/Produtos";
import Entradas from "./pages/Entradas";
import Saidas from "./pages/Saidas";
import Relatorios from "./pages/Relatorios";
import Financeiro from "./pages/Financeiro";
import PDV from "./pages/PDV";
import Perfil from "./pages/Perfil";
import AlterarSenha from "./pages/AlterarSenha";
import Compartilhar from "./pages/Compartilhar";
import Login from "./pages/Login";
import ForgotPassword from "./pages/ForgotPassword";
import ResetPassword from "./pages/ResetPassword";
import Test from "./pages/Test";
import NotFound from "./pages/NotFound";

// 📊 Importar contextos com Prisma
import { AuthProvider } from "./contexts/AuthContext";
import { WorkspaceProvider } from "./contexts/WorkspaceContext";
import { DataProvider } from "./contexts/DataContext";
import { SidebarProvider } from "./contexts/SidebarContext";

// 🔄 Auto-reload quando HMR falha
import { HMRReloader } from "./components/HMRReloader";

const queryClient = new QueryClient();

const App = () => (
  <QueryClientProvider client={queryClient}>
    <TooltipProvider>
      {/* 🔐 Auth Provider - Gerencia autenticação com JWT */}
      <AuthProvider>
        {/* 🏢 Workspace Provider - Gerencia qual workspace está ativo */}
        <WorkspaceProvider>
          {/* 🗄️ Data Provider - Gerencia dados com Prisma API */}
          <DataProvider>
            {/* 📌 Sidebar Provider - Gerencia estado da sidebar (pinada/overlay) */}
            <SidebarProvider>
            {/* 🔄 Auto-reload quando HMR desconecta */}
            <HMRReloader />
            <Toaster />
            <Sonner />
            <BrowserRouter
              future={{
                v7_startTransition: true,
                v7_relativeSplatPath: true,
              }}
            >
            <Routes>
              {/* 🧪 Rota de Teste (TEMPORÁRIA) */}
              <Route path="/test" element={<Test />} />
              
              {/* 🔐 Rota de Login (sem proteção) */}
              <Route path="/login" element={<Login />} />
              
              {/* 📧 Rota de Recuperação de Senha (sem proteção) */}
              <Route path="/forgot-password" element={<ForgotPassword />} />
              
              {/* 🔐 Rota de Reset de Senha com Token (sem proteção) */}
              <Route path="/reset-password" element={<ResetPassword />} />
              
              {/* 🛡️ Rotas Protegidas */}
              <Route path="/*" element={
                <AuthGuard>
                  <LayoutWithSidebar>
                        <Routes>
                          <Route path="/" element={<Index />} />
                          <Route path="/produtos" element={<Produtos />} />
                          <Route path="/entradas" element={<Entradas />} />
                          <Route path="/saidas" element={<Saidas />} />
                          <Route path="/relatorios" element={<Relatorios />} />
                          <Route path="/financeiro" element={<Financeiro />} />
                          <Route path="/pdv" element={<PDV />} />
                          <Route path="/perfil" element={<Perfil />} />
                          <Route path="/alterar-senha" element={<AlterarSenha />} />
                          <Route path="/compartilhar" element={<Compartilhar />} />
                          <Route path="*" element={<NotFound />} />
                        </Routes>
                  </LayoutWithSidebar>
                </AuthGuard>
              } />
            </Routes>
          </BrowserRouter>
            </SidebarProvider>
          </DataProvider>
        </WorkspaceProvider>
      </AuthProvider>
    </TooltipProvider>
  </QueryClientProvider>
);

export default App;
