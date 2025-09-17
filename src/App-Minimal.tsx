import { BrowserRouter, Routes, Route } from "react-router-dom";
import { Header } from "@/components/layout/Header";
import Index from "./pages/Index";
import Produtos from "./pages/Produtos";
import Entradas from "./pages/Entradas";
import Saidas from "./pages/Saidas";
import Movimentacoes from "./pages/Movimentacoes";
import Relatorios from "./pages/Relatorios";
import Configuracoes from "./pages/Configuracoes";
import LoginSimple from "./pages/Login-Simple";
import NotFound from "./pages/NotFound";

const App = () => (
  <BrowserRouter>
    <Routes>
      {/* Rota de Login */}
      <Route path="/login" element={<LoginSimple />} />
      
      {/* Rotas principais com layout */}
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
                <Route path="*" element={<NotFound />} />
              </Routes>
            </div>
          </div>
        </div>
      } />
    </Routes>
  </BrowserRouter>
);

export default App;
