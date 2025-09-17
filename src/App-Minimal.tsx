import { BrowserRouter, Routes, Route } from "react-router-dom";
import Index from "./pages/Index";
import Produtos from "./pages/Produtos";
import Entradas from "./pages/Entradas";
import Saidas from "./pages/Saidas";
import Movimentacoes from "./pages/Movimentacoes";
import Relatorios from "./pages/Relatorios";
import Configuracoes from "./pages/Configuracoes";
import Login from "./pages/Login";
import NotFound from "./pages/NotFound";

const App = () => (
  <BrowserRouter>
    <Routes>
      {/* Rota de Login */}
      <Route path="/login" element={<Login />} />
      
      {/* Rotas principais */}
      <Route path="/" element={<Index />} />
      <Route path="/produtos" element={<Produtos />} />
      <Route path="/entradas" element={<Entradas />} />
      <Route path="/saidas" element={<Saidas />} />
      <Route path="/movimentacoes" element={<Movimentacoes />} />
      <Route path="/relatorios" element={<Relatorios />} />
      <Route path="/configuracoes" element={<Configuracoes />} />
      <Route path="*" element={<NotFound />} />
    </Routes>
  </BrowserRouter>
);

export default App;
