// 🔧 Login Corrigido - Versão que funciona
import React, { useState } from "react";
import { Eye, EyeOff, LogIn, UserPlus, Package, Lock, Mail, User, Sparkles, Shield, Zap, Heart } from "lucide-react";
import { useNavigate } from "react-router-dom";

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
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-indigo-50 to-purple-50 flex items-center justify-center p-4 overflow-y-auto">
      <div className="w-full max-w-md my-8">
        {/* Logo e Título */}
        <div className="text-center mb-4">
          <div className="flex items-center justify-center mb-2">
            <div className="w-12 h-12 bg-gradient-to-br from-purple-600 to-blue-600 rounded-xl flex items-center justify-center shadow-lg">
              <Package className="w-6 h-6 text-white" />
            </div>
          </div>
          <h1 className="text-2xl font-bold text-gray-900 mb-1">🍇 Flexi Gestor</h1>
          <p className="text-sm text-gray-600">Sistema de Gestão Empresarial</p>
          
          {/* Badges */}
          <div className="flex flex-wrap justify-center gap-2 mt-3">
            <Badge variant="secondary" className="bg-green-100 text-green-800 text-xs">
              <Shield className="w-3 h-3 mr-1" />
              Seguro
            </Badge>
            <Badge variant="secondary" className="bg-blue-100 text-blue-800 text-xs">
              <Zap className="w-3 h-3 mr-1" />
              Rápido
            </Badge>
            <Badge variant="secondary" className="bg-purple-100 text-purple-800 text-xs">
              <Heart className="w-3 h-3 mr-1" />
              Confiável
            </Badge>
          </div>
        </div>

        {/* Card Principal */}
        <Card className="shadow-2xl border-0 bg-white/80 backdrop-blur-sm">
          <CardHeader className="text-center pb-3 sm:pb-4 px-4 sm:px-6">
            <CardTitle className="text-lg sm:text-xl font-semibold text-gray-800">
              🔐 Acesso ao Sistema
            </CardTitle>
            <p className="text-xs sm:text-sm text-gray-600 mt-1 sm:mt-2">
              Faça login ou crie uma nova conta
            </p>
          </CardHeader>
          
          <CardContent className="px-4 sm:px-6">
            <Tabs defaultValue="login" className="w-full">
              <TabsList className="grid w-full grid-cols-2 mb-4 sm:mb-6">
                <TabsTrigger value="login" className="flex items-center gap-1 sm:gap-2 text-xs sm:text-sm">
                  <LogIn className="w-3 h-3 sm:w-4 sm:h-4" />
                  <span className="hidden xs:inline">Login</span>
                  <span className="xs:hidden">Entrar</span>
                </TabsTrigger>
                <TabsTrigger value="register" className="flex items-center gap-1 sm:gap-2 text-xs sm:text-sm">
                  <UserPlus className="w-3 h-3 sm:w-4 sm:h-4" />
                  <span className="hidden xs:inline">Registrar</span>
                  <span className="xs:hidden">Criar</span>
                </TabsTrigger>
              </TabsList>

              {/* Aba de Login */}
              <TabsContent value="login" className="space-y-3">
                <form onSubmit={handleLogin} className="space-y-3">
                  <div className="space-y-1 sm:space-y-2">
                    <label className="text-xs sm:text-sm font-semibold text-gray-700 flex items-center gap-1 sm:gap-2">
                      <div className="w-4 h-4 sm:w-5 sm:h-5 bg-gradient-to-br from-purple-500 to-blue-500 rounded-full flex items-center justify-center">
                        <Mail className="w-2 h-2 sm:w-3 sm:h-3 text-white" />
                      </div>
                      E-mail
                    </label>
                    <Input
                      type="email"
                      placeholder="Digite seu e-mail"
                      value={loginData.email}
                      onChange={(e) => setLoginData({ ...loginData, email: e.target.value })}
                      className="h-10 border-2 border-gray-200 rounded-xl focus:ring-2 focus:ring-purple-500 focus:border-purple-500 bg-gray-50/50 transition-all duration-200 hover:bg-gray-50 text-sm sm:text-base"
                      disabled={isLoading}
                    />
                  </div>

                  <div className="space-y-1 sm:space-y-2">
                    <label className="text-xs sm:text-sm font-semibold text-gray-700 flex items-center gap-1 sm:gap-2">
                      <div className="w-4 h-4 sm:w-5 sm:h-5 bg-gradient-to-br from-blue-500 to-indigo-500 rounded-full flex items-center justify-center">
                        <Lock className="w-2 h-2 sm:w-3 sm:h-3 text-white" />
                      </div>
                      Senha
                    </label>
                    <div className="relative">
                      <Input
                        type={showPassword ? "text" : "password"}
                        placeholder="Digite sua senha"
                        value={loginData.password}
                        onChange={(e) => setLoginData({ ...loginData, password: e.target.value })}
                        className="h-10 border-2 border-gray-200 rounded-xl focus:ring-2 focus:ring-purple-500 focus:border-purple-500 bg-gray-50/50 transition-all duration-200 hover:bg-gray-50 pr-10 sm:pr-12 text-sm sm:text-base"
                        disabled={isLoading}
                      />
                      <button
                        type="button"
                        onClick={() => setShowPassword(!showPassword)}
                        className="absolute right-3 sm:right-4 top-1/2 transform -translate-y-1/2 text-gray-400 hover:text-gray-600 transition-colors"
                      >
                        {showPassword ? <EyeOff className="w-4 h-4 sm:w-5 sm:h-5" /> : <Eye className="w-4 h-4 sm:w-5 sm:h-5" />}
                      </button>
                    </div>
                  </div>

                  <Button
                    type="submit"
                    className="w-full h-10 sm:h-12 md:h-14 bg-gradient-to-r from-purple-600 to-blue-600 hover:from-purple-700 hover:to-blue-700 text-white font-semibold rounded-xl sm:rounded-2xl shadow-lg transition-all duration-200 transform hover:scale-105 text-sm sm:text-base"
                    disabled={isLoading}
                  >
                    {isLoading ? (
                      <div className="flex items-center gap-1 sm:gap-2">
                        <div className="w-3 h-3 sm:w-4 sm:h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                        <span className="text-xs sm:text-sm">Entrando...</span>
                      </div>
                    ) : (
                      <div className="flex items-center gap-1 sm:gap-2">
                        <LogIn className="w-3 h-3 sm:w-4 sm:h-4" />
                        <span className="text-xs sm:text-sm">Entrar</span>
                      </div>
                    )}
                  </Button>
                  
                  {/* Esqueci minha senha */}
                  <div className="text-center mt-3 sm:mt-4">
                    <button
                      type="button"
                      onClick={() => navigate('/forgot-password')}
                      className="text-xs sm:text-sm text-blue-600 hover:text-blue-800 underline"
                    >
                      Esqueci minha senha
                    </button>
                  </div>
                </form>
              </TabsContent>

              {/* Aba de Registro */}
              <TabsContent value="register" className="space-y-2">
                <form onSubmit={handleRegister} className="space-y-2">
                  <div className="space-y-1">
                    <label className="text-xs font-semibold text-gray-700 flex items-center gap-1">
                      <div className="w-4 h-4 bg-gradient-to-br from-green-500 to-emerald-500 rounded-full flex items-center justify-center">
                        <User className="w-2 h-2 text-white" />
                      </div>
                      Nome Completo
                    </label>
                    <Input
                      type="text"
                      placeholder="Digite seu nome completo"
                      value={registerData.name}
                      onChange={(e) => setRegisterData({ ...registerData, name: e.target.value })}
                      className="h-10 border-2 border-gray-200 rounded-xl focus:ring-2 focus:ring-purple-500 focus:border-purple-500 bg-gray-50/50 transition-all duration-200 hover:bg-gray-50 text-sm"
                      disabled={isLoading}
                    />
                  </div>

                  <div className="grid grid-cols-2 gap-2">
                    <div className="space-y-1">
                      <label className="text-xs font-semibold text-gray-700 flex items-center gap-1">
                        <div className="w-4 h-4 bg-gradient-to-br from-purple-500 to-blue-500 rounded-full flex items-center justify-center">
                          <Mail className="w-2 h-2 text-white" />
                        </div>
                        Email
                      </label>
                      <Input
                        type="email"
                        placeholder="seu@email.com"
                        value={registerData.email}
                        onChange={(e) => setRegisterData({ ...registerData, email: e.target.value })}
                        className="h-10 border-2 border-gray-200 rounded-xl focus:ring-2 focus:ring-purple-500 focus:border-purple-500 bg-gray-50/50 transition-all duration-200 hover:bg-gray-50 text-sm"
                        disabled={isLoading}
                      />
                    </div>

                    <div className="space-y-1">
                      <label className="text-xs font-semibold text-gray-700 flex items-center gap-1">
                        <div className="w-4 h-4 bg-gradient-to-br from-orange-500 to-red-500 rounded-full flex items-center justify-center">
                          <User className="w-2 h-2 text-white" />
                        </div>
                        Usuário
                      </label>
                      <Input
                        type="text"
                        placeholder="usuario123"
                        value={registerData.username}
                        onChange={(e) => setRegisterData({ ...registerData, username: e.target.value })}
                        className="h-10 border-2 border-gray-200 rounded-xl focus:ring-2 focus:ring-purple-500 focus:border-purple-500 bg-gray-50/50 transition-all duration-200 hover:bg-gray-50 text-sm"
                        disabled={isLoading}
                      />
                    </div>
                  </div>

                  <div className="grid grid-cols-2 gap-2">
                    <div className="space-y-1">
                      <label className="text-xs font-semibold text-gray-700 flex items-center gap-1">
                        <div className="w-4 h-4 bg-gradient-to-br from-blue-500 to-indigo-500 rounded-full flex items-center justify-center">
                          <Lock className="w-2 h-2 text-white" />
                        </div>
                        Senha
                      </label>
                      <div className="relative">
                        <Input
                          type={showRegisterPassword ? "text" : "password"}
                          placeholder="Sua senha"
                          value={registerData.password}
                          onChange={(e) => setRegisterData({ ...registerData, password: e.target.value })}
                          className="h-10 border-2 border-gray-200 rounded-xl focus:ring-2 focus:ring-purple-500 focus:border-purple-500 bg-gray-50/50 transition-all duration-200 hover:bg-gray-50 pr-10 text-sm"
                          disabled={isLoading}
                        />
                        <button
                          type="button"
                          onClick={() => setShowRegisterPassword(!showRegisterPassword)}
                          className="absolute right-2 top-1/2 transform -translate-y-1/2 text-gray-400 hover:text-gray-600 transition-colors"
                        >
                          {showRegisterPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                        </button>
                      </div>
                    </div>

                    <div className="space-y-1">
                      <label className="text-xs font-semibold text-gray-700 flex items-center gap-1">
                        <div className="w-4 h-4 bg-gradient-to-br from-indigo-500 to-purple-500 rounded-full flex items-center justify-center">
                          <Lock className="w-2 h-2 text-white" />
                        </div>
                        Confirmar
                      </label>
                      <div className="relative">
                        <Input
                          type={showConfirmPassword ? "text" : "password"}
                          placeholder="Confirme"
                          value={registerData.confirmPassword}
                          onChange={(e) => setRegisterData({ ...registerData, confirmPassword: e.target.value })}
                          className="h-10 border-2 border-gray-200 rounded-xl focus:ring-2 focus:ring-purple-500 focus:border-purple-500 bg-gray-50/50 transition-all duration-200 hover:bg-gray-50 pr-10 text-sm"
                          disabled={isLoading}
                        />
                        <button
                          type="button"
                          onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                          className="absolute right-2 top-1/2 transform -translate-y-1/2 text-gray-400 hover:text-gray-600 transition-colors"
                        >
                          {showConfirmPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                        </button>
                      </div>
                    </div>
                  </div>

                  <Button
                    type="submit"
                    className="w-full h-10 bg-gradient-to-r from-green-600 to-emerald-600 hover:from-green-700 hover:to-emerald-700 text-white font-semibold rounded-xl shadow-lg transition-all duration-200 transform hover:scale-105 text-sm mt-3"
                    disabled={isLoading}
                  >
                    {isLoading ? (
                      <div className="flex items-center gap-1 sm:gap-2">
                        <div className="w-3 h-3 sm:w-4 sm:h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                        <span className="text-xs sm:text-sm">Criando...</span>
                      </div>
                    ) : (
                      <div className="flex items-center gap-1 sm:gap-2">
                        <UserPlus className="w-3 h-3 sm:w-4 sm:h-4" />
                        <span className="text-xs sm:text-sm">Criar Nova Conta</span>
                      </div>
                    )}
                  </Button>
                </form>
              </TabsContent>
            </Tabs>
          </CardContent>
        </Card>

        {/* Footer */}
        <div className="text-center mt-6 sm:mt-8">
          <div className="flex items-center justify-center gap-1 sm:gap-2 text-xs sm:text-sm text-gray-600 mb-2">
            <Sparkles className="w-3 h-3 sm:w-4 sm:h-4" />
            <span className="font-medium hidden xs:inline">📦 Flexi Gestor - Sistema de Gestão Empresarial</span>
            <span className="font-medium xs:hidden">📦 Flexi Gestor</span>
          </div>
          <div className="flex flex-wrap justify-center gap-2 sm:gap-4 text-xs text-gray-500">
            <span>✅ Sessão permanente</span>
            <span>🔄 Nunca expira</span>
            <span>🆓 100% Gratuito</span>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Login;
