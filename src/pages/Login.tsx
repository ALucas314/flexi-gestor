// 🔧 Login Corrigido - Versão que funciona
import React, { useState } from "react";
import { Eye, EyeOff, LogIn, UserPlus, Package, Lock, Mail, User, Sparkles, Shield, Zap, Heart } from "lucide-react";
import { useNavigate } from "react-router-dom";
import img2 from "@/assets/img 2.jpg";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Badge } from "@/components/ui/badge";
import { useToast } from "@/hooks/use-toast";
import { useAuth } from "@/contexts/AuthContext";

const Login = () => {
  const navigate = useNavigate();
  const { toast } = useToast();
  const { login, register, isLoading } = useAuth();

  // Estados do formulário de login
  const [loginData, setLoginData] = useState({
    email: "",
    password: ""
  });

  // Estados do formulário de registro
  const [registerData, setRegisterData] = useState({
    username: "",
    email: "",
    name: "",
    password: "",
    confirmPassword: ""
  });

  const [showPassword, setShowPassword] = useState(false);
  const [showRegisterPassword, setShowRegisterPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);

  // Função de login
  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!loginData.email || !loginData.password) {
      toast({
        title: "❌ Campos Obrigatórios",
        description: "Por favor, preencha todos os campos.",
        variant: "destructive",
      });
      return;
    }
    
    try {
      const success = await login(loginData.email, loginData.password);
      
      if (success) {
        // Aguardar um pouco para garantir que o Supabase Auth atualize
        setTimeout(() => {
          navigate("/");
        }, 1000);
      }
    } catch (error) {
      console.error('❌ Erro no login:', error);
    }
  };

  // Função de registro
  const handleRegister = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!registerData.email || !registerData.password || !registerData.name) {
      toast({
        title: "❌ Campos Obrigatórios",
        description: "Por favor, preencha todos os campos obrigatórios.",
        variant: "destructive",
      });
      return;
    }

    if (registerData.password !== registerData.confirmPassword) {
      toast({
        title: "❌ Senhas Não Conferem",
        description: "As senhas digitadas não são iguais.",
        variant: "destructive",
      });
      return;
    }

    if (registerData.password.length < 6) {
      toast({
        title: "❌ Senha Muito Fraca",
        description: "A senha deve ter pelo menos 6 caracteres.",
        variant: "destructive",
      });
      return;
    }
    
    try {
      const success = await register(
        registerData.email,
        registerData.password,
        registerData.name
      );
      
      if (success) {
        // Aguardar um pouco para garantir que o Supabase Auth atualize
        setTimeout(() => {
          navigate("/");
        }, 1000);
      }
    } catch (error) {
      // Erro já tratado pelo contexto
    }
  };

  return (
    <div className="min-h-screen flex flex-col lg:flex-row">
      {/* Imagem - 60% em lg, 70% em 3xl+, oculta em mobile */}
      <div className="hidden lg:flex lg:w-[60%] 3xl:w-[70%] relative overflow-hidden">
        <img 
          src={img2} 
          alt="Flexi Gestor" 
          className="w-full h-full object-cover"
        />
        {/* Overlay gradiente escuro */}
        <div className="absolute inset-0 bg-gradient-to-br from-slate-900/80 via-purple-900/70 to-slate-900/80"></div>
        {/* Conteúdo na imagem - canto superior esquerdo */}
        <div className="absolute top-12 left-12">
          <div className="text-white">
            <div className="flex items-center gap-4 mb-4">
              <div className="w-14 h-14 bg-gradient-to-br from-purple-600 to-blue-600 rounded-xl flex items-center justify-center shadow-2xl">
                <Package className="w-7 h-7 text-white" />
              </div>
              <h1 className="text-3xl font-bold text-white drop-shadow-lg">
                Flexi Gestor
              </h1>
            </div>
            <p className="text-base text-gray-200 font-medium">
              Gestão Empresarial
            </p>
            <p className="text-sm text-gray-300 mt-1">
              Sistema completo de gestão
            </p>
          </div>
        </div>
      </div>

      {/* Formulário - 40% em lg, 30% em 3xl+, 100% em mobile */}
      <div className="flex-1 lg:w-[40%] 3xl:w-[30%] flex items-center justify-center p-4 md:p-6 lg:p-4 overflow-y-auto relative min-h-screen bg-gradient-to-br from-gray-50 via-purple-50/30 to-blue-50/30">
        {/* Pattern decorativo sutil */}
        <div className="absolute inset-0 opacity-[0.03] pointer-events-none">
          <div className="absolute inset-0" style={{
            backgroundImage: `radial-gradient(circle at 2px 2px, purple 1px, transparent 0)`,
            backgroundSize: '50px 50px'
          }}></div>
        </div>
        
        {/* Gradientes decorativos */}
        <div className="absolute top-20 right-20 w-64 h-64 bg-purple-200/20 rounded-full blur-3xl hidden md:block"></div>
        <div className="absolute bottom-20 left-20 w-64 h-64 bg-blue-200/20 rounded-full blur-3xl hidden md:block"></div>
        <div className="w-full max-w-md mx-auto relative z-10">
        {/* Logo e Título */}
        <div className="mb-8 text-center animate-fade-in">
          <div className="flex items-center justify-center mb-6">
            <div className="w-20 h-20 bg-gradient-to-br from-purple-600 to-blue-600 rounded-2xl flex items-center justify-center shadow-2xl hover:shadow-purple-500/50 transform hover:scale-105 transition-all duration-300 animate-fade-in">
              <Package className="w-10 h-10 text-white" />
            </div>
          </div>
          
          {/* Título em Mobile - só aparece quando a imagem está oculta */}
          <div className="text-center mb-4 lg:hidden">
            <h1 className="text-3xl font-extrabold text-gray-900 mb-2 bg-gradient-to-r from-purple-600 to-blue-600 bg-clip-text text-transparent">
              Flexi Gestor
            </h1>
            <p className="text-sm text-gray-600 font-medium">
              Gestão empresarial completa
            </p>
          </div>
          
          {/* Badges */}
          <div className="flex flex-wrap justify-center gap-2 w-full ml-[7px]">
            <Badge variant="secondary" className="bg-gradient-to-r from-green-50 to-emerald-50 text-green-700 border border-green-200 text-xs font-medium hover:shadow-md transition-all duration-200 hover:scale-105 cursor-default">
              <Shield className="w-3 h-3 mr-1" />
              Seguro
            </Badge>
            <Badge variant="secondary" className="bg-gradient-to-r from-blue-50 to-cyan-50 text-blue-700 border border-blue-200 text-xs font-medium hover:shadow-md transition-all duration-200 hover:scale-105 cursor-default">
              <Zap className="w-3 h-3 mr-1" />
              Rápido
            </Badge>
            <Badge variant="secondary" className="bg-gradient-to-r from-purple-50 to-violet-50 text-purple-700 border border-purple-200 text-xs font-medium hover:shadow-md transition-all duration-200 hover:scale-105 cursor-default">
              <Heart className="w-3 h-3 mr-1" />
              Confiável
            </Badge>
          </div>
        </div>

        {/* Card Principal */}
        <Card className="w-full max-w-full mx-auto shadow-xl border border-gray-200/50 bg-white/95 backdrop-blur-sm hover:shadow-2xl hover:border-purple-200/50 transition-all duration-300 overflow-hidden relative">
          {/* Borda decorativa superior */}
          <div className="absolute top-0 left-0 right-0 h-1 bg-gradient-to-r from-purple-600 via-blue-600 to-purple-600"></div>
          <CardHeader className="text-center pb-4 sm:pb-6 px-4 sm:px-6 pt-8">
            <CardTitle className="text-xl sm:text-2xl font-bold text-gray-900 flex items-center justify-center gap-2">
              <div className="w-10 h-10 bg-gradient-to-br from-purple-600 to-blue-600 rounded-lg flex items-center justify-center shadow-md">
                <Lock className="w-5 h-5 text-white" />
              </div>
              Acesso ao Sistema
            </CardTitle>
            <p className="text-sm text-gray-600 mt-2 font-medium">
              Entre com suas credenciais para continuar
            </p>
          </CardHeader>
          
          <CardContent className="px-4 sm:px-6">
            <Tabs defaultValue="login" className="w-full">
              <TabsList className="grid w-full grid-cols-2 mb-6 bg-gray-100 p-1 rounded-xl">
                <TabsTrigger value="login" className="flex items-center justify-center gap-2 text-sm font-medium data-[state=active]:bg-white data-[state=active]:shadow-md data-[state=active]:text-purple-600 text-gray-600 rounded-lg transition-all duration-300 px-4 py-2">
                  <LogIn className="w-4 h-4" />
                  <span className="hidden xs:inline">Login</span>
                  <span className="xs:hidden">Entrar</span>
                </TabsTrigger>
                <TabsTrigger value="register" className="flex items-center justify-center gap-2 text-sm font-medium data-[state=active]:bg-white data-[state=active]:shadow-md data-[state=active]:text-purple-600 text-gray-600 rounded-lg transition-all duration-300 px-4 py-2">
                  <UserPlus className="w-4 h-4" />
                  <span className="hidden xs:inline">Registrar</span>
                  <span className="xs:hidden">Criar</span>
                </TabsTrigger>
              </TabsList>

              {/* Aba de Login */}
              <TabsContent value="login" className="space-y-3">
                <form onSubmit={handleLogin} className="space-y-3">
                  <div className="space-y-2">
                    <label className="text-sm font-semibold text-gray-800 flex items-center gap-2">
                      <div className="w-6 h-6 bg-gradient-to-br from-purple-500 to-blue-500 rounded-lg flex items-center justify-center shadow-md">
                        <Mail className="w-3 h-3 text-white" />
                      </div>
                      E-mail
                    </label>
                    <Input
                      type="email"
                      placeholder="Digite seu e-mail"
                      value={loginData.email}
                      onChange={(e) => setLoginData({ ...loginData, email: e.target.value })}
                      className="h-12 border-2 border-gray-200 rounded-xl focus:ring-4 focus:ring-purple-500/20 focus:border-purple-500 focus:outline-none focus-visible:ring-0 focus-visible:ring-offset-0 bg-white text-gray-900 placeholder:text-gray-400 shadow-sm hover:border-purple-300 hover:shadow-md transition-all duration-200 text-sm"
                      disabled={isLoading}
                    />
                  </div>

                  <div className="space-y-2">
                    <label className="text-sm font-semibold text-gray-800 flex items-center gap-2">
                      <div className="w-6 h-6 bg-gradient-to-br from-blue-500 to-indigo-500 rounded-lg flex items-center justify-center shadow-md">
                        <Lock className="w-3 h-3 text-white" />
                      </div>
                      Senha
                    </label>
                    <div className="relative">
                      <Input
                        type={showPassword ? "text" : "password"}
                        placeholder="Digite sua senha"
                        value={loginData.password}
                        onChange={(e) => setLoginData({ ...loginData, password: e.target.value })}
                        className="h-12 border-2 border-gray-200 rounded-xl focus:ring-4 focus:ring-purple-500/20 focus:border-purple-500 focus:outline-none focus-visible:ring-0 focus-visible:ring-offset-0 bg-white text-gray-900 placeholder:text-gray-400 shadow-sm hover:border-purple-300 hover:shadow-md transition-all duration-200 pr-12 text-sm"
                        disabled={isLoading}
                      />
                      <button
                        type="button"
                        onClick={() => setShowPassword(!showPassword)}
                        className="absolute right-4 top-1/2 transform -translate-y-1/2 text-gray-400 hover:text-purple-600 transition-colors rounded-full p-1 hover:bg-purple-50"
                      >
                        {showPassword ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
                      </button>
                    </div>
                  </div>

                  <Button
                    type="submit"
                    className="w-full h-12 bg-gradient-to-r from-purple-600 to-blue-600 hover:from-purple-700 hover:to-blue-700 text-white font-bold rounded-xl shadow-lg hover:shadow-xl transition-all duration-300 transform hover:scale-[1.02] active:scale-[0.98] mt-4 text-base"
                    disabled={isLoading}
                  >
                    {isLoading ? (
                      <div className="flex items-center gap-2">
                        <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin" />
                        <span className="text-sm">Entrando...</span>
                      </div>
                    ) : (
                      <div className="flex items-center gap-2">
                        <LogIn className="w-5 h-5" />
                        <span className="text-base">Entrar</span>
                      </div>
                    )}
                  </Button>
                  
                  {/* Esqueci minha senha */}
                  <div className="text-center mt-4">
                    <button
                      type="button"
                      onClick={() => navigate('/forgot-password')}
                      className="text-sm text-purple-600 hover:text-purple-700 hover:underline font-medium transition-all"
                    >
                      Esqueceu sua senha?
                    </button>
                  </div>
                </form>
              </TabsContent>

              {/* Aba de Registro */}
              <TabsContent value="register" className="space-y-3">
                <form onSubmit={handleRegister} className="space-y-3">
                  <div className="space-y-2">
                    <label className="text-sm font-semibold text-gray-800 flex items-center gap-2">
                      <div className="w-6 h-6 bg-gradient-to-br from-green-500 to-emerald-500 rounded-lg flex items-center justify-center shadow-md">
                        <User className="w-3 h-3 text-white" />
                      </div>
                      Nome Completo
                    </label>
                    <Input
                      type="text"
                      placeholder="Ex: João Silva"
                      value={registerData.name}
                      onChange={(e) => setRegisterData({ ...registerData, name: e.target.value })}
                      className="h-12 border-2 border-gray-200 rounded-xl focus:ring-2 focus:ring-purple-500 focus:border-purple-500 focus:outline-none focus-visible:ring-0 focus-visible:ring-offset-0 bg-white text-gray-900 placeholder:text-gray-400 shadow-sm hover:border-purple-300 transition-all duration-200 text-sm"
                      disabled={isLoading}
                    />
                  </div>

                  <div className="grid grid-cols-2 gap-3">
                    <div className="space-y-2">
                      <label className="text-sm font-semibold text-gray-800 flex items-center gap-2">
                        <div className="w-6 h-6 bg-gradient-to-br from-purple-500 to-blue-500 rounded-lg flex items-center justify-center shadow-md">
                          <Mail className="w-3 h-3 text-white" />
                        </div>
                        E-mail
                      </label>
                      <Input
                        type="email"
                        placeholder="Digite seu e-mail"
                        value={registerData.email}
                        onChange={(e) => setRegisterData({ ...registerData, email: e.target.value })}
                        className="h-12 border-2 border-gray-200 rounded-xl focus:ring-2 focus:ring-purple-500 focus:border-purple-500 focus:outline-none focus-visible:ring-0 focus-visible:ring-offset-0 bg-white text-gray-900 placeholder:text-gray-400 shadow-sm hover:border-purple-300 transition-all duration-200 text-sm"
                        disabled={isLoading}
                      />
                    </div>

                    <div className="space-y-2">
                      <label className="text-sm font-semibold text-gray-800 flex items-center gap-2">
                        <div className="w-6 h-6 bg-gradient-to-br from-orange-500 to-red-500 rounded-lg flex items-center justify-center shadow-md">
                          <User className="w-3 h-3 text-white" />
                        </div>
                        Nome de Usuário
                      </label>
                      <Input
                        type="text"
                        placeholder="Ex: joaosilva"
                        value={registerData.username}
                        onChange={(e) => setRegisterData({ ...registerData, username: e.target.value })}
                        className="h-12 border-2 border-gray-200 rounded-xl focus:ring-2 focus:ring-purple-500 focus:border-purple-500 focus:outline-none focus-visible:ring-0 focus-visible:ring-offset-0 bg-white text-gray-900 placeholder:text-gray-400 shadow-sm hover:border-purple-300 transition-all duration-200 text-sm"
                        disabled={isLoading}
                      />
                    </div>
                  </div>

                  <div className="grid grid-cols-2 gap-3">
                    <div className="space-y-2">
                      <label className="text-sm font-semibold text-gray-800 flex items-center gap-2">
                        <div className="w-6 h-6 bg-gradient-to-br from-blue-500 to-indigo-500 rounded-lg flex items-center justify-center shadow-md">
                          <Lock className="w-3 h-3 text-white" />
                        </div>
                        Escolha uma Senha
                      </label>
                      <div className="relative">
                        <Input
                          type={showRegisterPassword ? "text" : "password"}
                          placeholder="Mínimo 6 caracteres"
                          value={registerData.password}
                          onChange={(e) => setRegisterData({ ...registerData, password: e.target.value })}
                          className="h-12 border-2 border-gray-200 rounded-xl focus:ring-2 focus:ring-purple-500 focus:border-purple-500 focus:outline-none focus-visible:ring-0 focus-visible:ring-offset-0 bg-white text-gray-900 placeholder:text-gray-400 shadow-sm hover:border-purple-300 transition-all duration-200 pr-12 text-sm"
                          disabled={isLoading}
                        />
                        <button
                          type="button"
                          onClick={() => setShowRegisterPassword(!showRegisterPassword)}
                          className="absolute right-4 top-1/2 transform -translate-y-1/2 text-gray-400 hover:text-purple-600 transition-colors rounded-full p-1 hover:bg-purple-50"
                        >
                          {showRegisterPassword ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
                        </button>
                      </div>
                    </div>

                    <div className="space-y-2">
                      <label className="text-sm font-semibold text-gray-800 flex items-center gap-2">
                        <div className="w-6 h-6 bg-gradient-to-br from-indigo-500 to-purple-500 rounded-lg flex items-center justify-center shadow-md">
                          <Lock className="w-3 h-3 text-white" />
                        </div>
                        Confirmar Senha
                      </label>
                      <div className="relative">
                        <Input
                          type={showConfirmPassword ? "text" : "password"}
                          placeholder="Digite novamente"
                          value={registerData.confirmPassword}
                          onChange={(e) => setRegisterData({ ...registerData, confirmPassword: e.target.value })}
                          className="h-12 border-2 border-gray-200 rounded-xl focus:ring-2 focus:ring-purple-500 focus:border-purple-500 focus:outline-none focus-visible:ring-0 focus-visible:ring-offset-0 bg-white text-gray-900 placeholder:text-gray-400 shadow-sm hover:border-purple-300 transition-all duration-200 pr-12 text-sm"
                          disabled={isLoading}
                        />
                        <button
                          type="button"
                          onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                          className="absolute right-4 top-1/2 transform -translate-y-1/2 text-gray-400 hover:text-purple-600 transition-colors rounded-full p-1 hover:bg-purple-50"
                        >
                          {showConfirmPassword ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
                        </button>
                      </div>
                    </div>
                  </div>

                  <Button
                    type="submit"
                    className="w-full h-12 bg-gradient-to-r from-purple-600 to-blue-600 hover:from-purple-700 hover:to-blue-700 text-white font-bold rounded-xl shadow-lg hover:shadow-xl transition-all duration-300 transform hover:scale-[1.02] active:scale-[0.98] mt-4 text-base"
                    disabled={isLoading}
                  >
                    {isLoading ? (
                      <div className="flex items-center gap-2">
                        <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin" />
                        <span className="text-sm">Criando sua conta...</span>
                      </div>
                    ) : (
                      <div className="flex items-center gap-2">
                        <UserPlus className="w-5 h-5" />
                        <span className="text-base">Criar Conta</span>
                      </div>
                    )}
                  </Button>
                </form>
              </TabsContent>
            </Tabs>
          </CardContent>
        </Card>

        {/* Footer */}
        <div className="text-center mt-8">
          <div className="flex flex-wrap justify-center gap-3 sm:gap-5 text-xs font-medium mb-2">
            <div className="flex items-center gap-1 px-3 py-1.5 bg-gradient-to-r from-green-50 to-emerald-50 border border-green-200 rounded-full text-green-700 shadow-sm">
              <Shield className="w-3 h-3" />
              <span>Sessão permanente</span>
            </div>
            <div className="flex items-center gap-1 px-3 py-1.5 bg-gradient-to-r from-blue-50 to-cyan-50 border border-blue-200 rounded-full text-blue-700 shadow-sm">
              <Zap className="w-3 h-3" />
              <span>Nunca expira</span>
            </div>
            <div className="flex items-center gap-1 px-3 py-1.5 bg-gradient-to-r from-purple-50 to-violet-50 border border-purple-200 rounded-full text-purple-700 shadow-sm">
              <Heart className="w-3 h-3" />
              <span>100% Gratuito</span>
            </div>
          </div>
          <p className="text-xs text-gray-500 mt-3">
            Seus dados protegidos com criptografia de ponta a ponta
          </p>
        </div>
        </div>
      </div>
    </div>
  );
};

export default Login;
