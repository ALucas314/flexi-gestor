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
import { useFirebaseAuth } from "@/contexts/FirebaseAuthContext";

const Login = () => {
  const navigate = useNavigate();
  const { toast } = useToast();
  const { login, register, isLoading, resetPassword } = useFirebaseAuth();

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
  const [showForgotPassword, setShowForgotPassword] = useState(false);
  const [forgotPasswordEmail, setForgotPasswordEmail] = useState("");

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

    console.log('🔐 Tentando login com:', loginData.email);
    
    try {
      const success = await login(loginData.email, loginData.password);
      
      if (success) {
        toast({
          title: "✅ Login Realizado!",
          description: `Bem-vindo ao Flexi Gestor!`,
          variant: "default",
        });
        
        // Aguardar um pouco para garantir que o Firebase Auth atualize
        setTimeout(() => {
          navigate("/");
        }, 1000);
      } else {
        toast({
          title: "❌ Login Falhou",
          description: "Usuário ou senha incorretos. Tente novamente.",
          variant: "destructive",
        });
      }
    } catch (error) {
      console.error('❌ Erro no login:', error);
      toast({
        title: "❌ Erro no Login",
        description: "Ocorreu um erro inesperado. Tente novamente.",
        variant: "destructive",
      });
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

    console.log('📝 Tentando criar conta:', registerData.email);
    
    try {
      const success = await register({
        username: registerData.username,
        email: registerData.email,
        name: registerData.name,
        password: registerData.password,
        role: 'user'
      });
      
      if (success) {
        toast({
          title: "✅ Registro Realizado!",
          description: `Bem-vindo ao Flexi Gestor, ${registerData.name}!`,
          variant: "default",
        });
        
        // Aguardar um pouco para garantir que o Firebase Auth atualize
        setTimeout(() => {
          navigate("/");
        }, 1000);
      } else {
        toast({
          title: "❌ Registro Falhou",
          description: "Erro ao criar conta. Tente novamente.",
          variant: "destructive",
        });
      }
    } catch (error) {
      console.error('❌ Erro no registro:', error);
      toast({
        title: "❌ Erro no Registro",
        description: "Ocorreu um erro inesperado. Tente novamente.",
        variant: "destructive",
      });
    }
  };

  // Função de recuperação de senha
  const handleForgotPassword = async () => {
    if (!forgotPasswordEmail) {
      toast({
        title: "❌ Campo Obrigatório",
        description: "Digite seu e-mail para recuperar a senha.",
        variant: "destructive",
      });
      return;
    }

    // Validação básica de email
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(forgotPasswordEmail)) {
      toast({
        title: "❌ E-mail Inválido",
        description: "Digite um e-mail válido.",
        variant: "destructive",
      });
      return;
    }

    try {
      console.log('🔄 Enviando email de recuperação para:', forgotPasswordEmail);
      
      const success = await resetPassword(forgotPasswordEmail);
      
      if (success) {
        toast({
          title: "✅ E-mail Enviado!",
          description: `Enviamos um link de recuperação para ${forgotPasswordEmail}. Verifique sua caixa de entrada e spam.`,
          variant: "default",
        });
        
        setShowForgotPassword(false);
        setForgotPasswordEmail("");
      } else {
        toast({
          title: "❌ Erro ao Enviar",
          description: "Não foi possível enviar o e-mail de recuperação. Verifique se o e-mail está correto.",
          variant: "destructive",
        });
      }
    } catch (error: any) {
      console.error('❌ Erro ao enviar e-mail:', error);
      
      let errorMessage = "Erro ao enviar e-mail de recuperação.";
      if (error.code === 'auth/user-not-found') {
        errorMessage = "E-mail não encontrado em nossa base de dados.";
      } else if (error.code === 'auth/invalid-email') {
        errorMessage = "E-mail inválido.";
      } else if (error.code === 'auth/too-many-requests') {
        errorMessage = "Muitas tentativas. Tente novamente mais tarde.";
      }
      
      toast({
        title: "❌ Erro",
        description: errorMessage,
        variant: "destructive",
      });
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-indigo-50 to-purple-50 flex items-center justify-center p-2 sm:p-4 md:p-6 lg:p-8">
      <div className="w-full max-w-xs sm:max-w-sm md:max-w-md lg:max-w-lg xl:max-w-xl">
        {/* Logo e Título */}
        <div className="text-center mb-6 sm:mb-8">
          <div className="flex items-center justify-center mb-3 sm:mb-4">
            <div className="w-12 h-12 sm:w-16 sm:h-16 bg-gradient-to-br from-purple-600 to-blue-600 rounded-xl sm:rounded-2xl flex items-center justify-center shadow-lg">
              <Package className="w-6 h-6 sm:w-8 sm:h-8 text-white" />
            </div>
          </div>
          <h1 className="text-2xl sm:text-3xl lg:text-4xl font-bold text-gray-900 mb-2">🍇 Flexi Gestor</h1>
          <p className="text-sm sm:text-base text-gray-600">Sistema de Gestão de Açaí</p>
          
          {/* Badges */}
          <div className="flex flex-wrap justify-center gap-1 sm:gap-2 mt-3 sm:mt-4">
            <Badge variant="secondary" className="bg-green-100 text-green-800 text-xs sm:text-sm">
              <Shield className="w-2 h-2 sm:w-3 sm:h-3 mr-1" />
              Seguro
            </Badge>
            <Badge variant="secondary" className="bg-blue-100 text-blue-800 text-xs sm:text-sm">
              <Zap className="w-2 h-2 sm:w-3 sm:h-3 mr-1" />
              Rápido
            </Badge>
            <Badge variant="secondary" className="bg-purple-100 text-purple-800 text-xs sm:text-sm">
              <Heart className="w-2 h-2 sm:w-3 sm:h-3 mr-1" />
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
              <TabsContent value="login" className="space-y-3 sm:space-y-4">
                <form onSubmit={handleLogin} className="space-y-3 sm:space-y-4">
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
                      className="h-10 sm:h-12 md:h-14 border-2 border-gray-200 rounded-xl sm:rounded-2xl focus:ring-2 focus:ring-purple-500 focus:border-purple-500 bg-gray-50/50 transition-all duration-200 hover:bg-gray-50 text-sm sm:text-base"
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
                        className="h-10 sm:h-12 md:h-14 border-2 border-gray-200 rounded-xl sm:rounded-2xl focus:ring-2 focus:ring-purple-500 focus:border-purple-500 bg-gray-50/50 transition-all duration-200 hover:bg-gray-50 pr-10 sm:pr-12 text-sm sm:text-base"
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
                      onClick={() => setShowForgotPassword(true)}
                      className="text-xs sm:text-sm text-blue-600 hover:text-blue-800 underline"
                    >
                      Esqueci minha senha
                    </button>
                  </div>
                </form>
              </TabsContent>

              {/* Aba de Registro */}
              <TabsContent value="register" className="space-y-3 sm:space-y-4">
                <form onSubmit={handleRegister} className="space-y-3 sm:space-y-4">
                  <div className="space-y-1 sm:space-y-2">
                    <label className="text-xs sm:text-sm font-semibold text-gray-700 flex items-center gap-1 sm:gap-2">
                      <div className="w-4 h-4 sm:w-5 sm:h-5 bg-gradient-to-br from-green-500 to-emerald-500 rounded-full flex items-center justify-center">
                        <User className="w-2 h-2 sm:w-3 sm:h-3 text-white" />
                      </div>
                      Nome Completo
                    </label>
                    <Input
                      type="text"
                      placeholder="Digite seu nome completo"
                      value={registerData.name}
                      onChange={(e) => setRegisterData({ ...registerData, name: e.target.value })}
                      className="h-10 sm:h-12 md:h-14 border-2 border-gray-200 rounded-xl sm:rounded-2xl focus:ring-2 focus:ring-purple-500 focus:border-purple-500 bg-gray-50/50 transition-all duration-200 hover:bg-gray-50 text-sm sm:text-base"
                      disabled={isLoading}
                    />
                  </div>

                  <div className="space-y-1 sm:space-y-2">
                    <label className="text-xs sm:text-sm font-semibold text-gray-700 flex items-center gap-1 sm:gap-2">
                      <div className="w-4 h-4 sm:w-5 sm:h-5 bg-gradient-to-br from-purple-500 to-blue-500 rounded-full flex items-center justify-center">
                        <Mail className="w-2 h-2 sm:w-3 sm:h-3 text-white" />
                      </div>
                      Email
                    </label>
                    <Input
                      type="email"
                      placeholder="Digite seu e-mail"
                      value={registerData.email}
                      onChange={(e) => setRegisterData({ ...registerData, email: e.target.value })}
                      className="h-10 sm:h-12 md:h-14 border-2 border-gray-200 rounded-xl sm:rounded-2xl focus:ring-2 focus:ring-purple-500 focus:border-purple-500 bg-gray-50/50 transition-all duration-200 hover:bg-gray-50 text-sm sm:text-base"
                      disabled={isLoading}
                    />
                  </div>

                  <div className="space-y-1 sm:space-y-2">
                    <label className="text-xs sm:text-sm font-semibold text-gray-700 flex items-center gap-1 sm:gap-2">
                      <div className="w-4 h-4 sm:w-5 sm:h-5 bg-gradient-to-br from-orange-500 to-red-500 rounded-full flex items-center justify-center">
                        <User className="w-2 h-2 sm:w-3 sm:h-3 text-white" />
                      </div>
                      Usuário
                    </label>
                    <Input
                      type="text"
                      placeholder="Digite seu usuário"
                      value={registerData.username}
                      onChange={(e) => setRegisterData({ ...registerData, username: e.target.value })}
                      className="h-10 sm:h-12 md:h-14 border-2 border-gray-200 rounded-xl sm:rounded-2xl focus:ring-2 focus:ring-purple-500 focus:border-purple-500 bg-gray-50/50 transition-all duration-200 hover:bg-gray-50 text-sm sm:text-base"
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
                        type={showRegisterPassword ? "text" : "password"}
                        placeholder="Digite sua senha"
                        value={registerData.password}
                        onChange={(e) => setRegisterData({ ...registerData, password: e.target.value })}
                        className="h-10 sm:h-12 md:h-14 border-2 border-gray-200 rounded-xl sm:rounded-2xl focus:ring-2 focus:ring-purple-500 focus:border-purple-500 bg-gray-50/50 transition-all duration-200 hover:bg-gray-50 pr-10 sm:pr-12 text-sm sm:text-base"
                        disabled={isLoading}
                      />
                      <button
                        type="button"
                        onClick={() => setShowRegisterPassword(!showRegisterPassword)}
                        className="absolute right-3 sm:right-4 top-1/2 transform -translate-y-1/2 text-gray-400 hover:text-gray-600 transition-colors"
                      >
                        {showRegisterPassword ? <EyeOff className="w-4 h-4 sm:w-5 sm:h-5" /> : <Eye className="w-4 h-4 sm:w-5 sm:h-5" />}
                      </button>
                    </div>
                  </div>

                  <div className="space-y-1 sm:space-y-2">
                    <label className="text-xs sm:text-sm font-semibold text-gray-700 flex items-center gap-1 sm:gap-2">
                      <div className="w-4 h-4 sm:w-5 sm:h-5 bg-gradient-to-br from-indigo-500 to-purple-500 rounded-full flex items-center justify-center">
                        <Lock className="w-2 h-2 sm:w-3 sm:h-3 text-white" />
                      </div>
                      Confirmar Senha
                    </label>
                    <div className="relative">
                      <Input
                        type={showConfirmPassword ? "text" : "password"}
                        placeholder="Confirme sua senha"
                        value={registerData.confirmPassword}
                        onChange={(e) => setRegisterData({ ...registerData, confirmPassword: e.target.value })}
                        className="h-10 sm:h-12 md:h-14 border-2 border-gray-200 rounded-xl sm:rounded-2xl focus:ring-2 focus:ring-purple-500 focus:border-purple-500 bg-gray-50/50 transition-all duration-200 hover:bg-gray-50 pr-10 sm:pr-12 text-sm sm:text-base"
                        disabled={isLoading}
                      />
                      <button
                        type="button"
                        onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                        className="absolute right-3 sm:right-4 top-1/2 transform -translate-y-1/2 text-gray-400 hover:text-gray-600 transition-colors"
                      >
                        {showConfirmPassword ? <EyeOff className="w-4 h-4 sm:w-5 sm:h-5" /> : <Eye className="w-4 h-4 sm:w-5 sm:h-5" />}
                      </button>
                    </div>
                  </div>

                  <Button
                    type="submit"
                    className="w-full h-10 sm:h-12 md:h-14 bg-gradient-to-r from-green-600 to-emerald-600 hover:from-green-700 hover:to-emerald-700 text-white font-semibold rounded-xl sm:rounded-2xl shadow-lg transition-all duration-200 transform hover:scale-105 text-sm sm:text-base"
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
            <span className="font-medium hidden xs:inline">🍇 Flexi Gestor - Sistema de Gestão de Açaí</span>
            <span className="font-medium xs:hidden">🍇 Flexi Gestor</span>
          </div>
          <div className="flex flex-wrap justify-center gap-2 sm:gap-4 text-xs text-gray-500">
            <span>✅ Sessão permanente</span>
            <span>🔄 Nunca expira</span>
            <span>🆓 100% Gratuito</span>
          </div>
        </div>
      </div>

      {/* Modal de Recuperação de Senha */}
      {showForgotPassword && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-2 sm:p-4 z-50">
          <Card className="w-full max-w-xs sm:max-w-sm md:max-w-md shadow-2xl">
            <CardHeader className="px-4 sm:px-6 pb-3">
              <CardTitle className="flex items-center space-x-1 sm:space-x-2 text-base sm:text-lg">
                <div className="w-8 h-8 sm:w-10 sm:h-10 bg-gradient-to-br from-blue-500 to-purple-500 rounded-full flex items-center justify-center">
                  <Shield className="h-4 w-4 sm:h-5 sm:w-5 text-white" />
                </div>
                <span>🔐 Recuperar Senha</span>
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4 sm:space-y-5 px-4 sm:px-6">
              <div className="text-center space-y-2">
                <p className="text-sm sm:text-base text-gray-700 font-medium">
                  Esqueceu sua senha?
                </p>
                <p className="text-xs sm:text-sm text-gray-600">
                  Digite seu e-mail e enviaremos um link seguro para redefinir sua senha.
                </p>
              </div>
              
              <div className="space-y-2 sm:space-y-3">
                <label className="text-xs sm:text-sm font-semibold text-gray-700 flex items-center gap-1 sm:gap-2">
                  <div className="w-4 h-4 sm:w-5 sm:h-5 bg-gradient-to-br from-purple-500 to-blue-500 rounded-full flex items-center justify-center">
                    <Mail className="w-2 h-2 sm:w-3 sm:h-3 text-white" />
                  </div>
                  E-mail
                </label>
                <Input
                  id="forgotEmail"
                  type="email"
                  placeholder="Digite seu e-mail cadastrado"
                  value={forgotPasswordEmail}
                  onChange={(e) => setForgotPasswordEmail(e.target.value)}
                  className="h-10 sm:h-12 text-sm sm:text-base border-2 border-gray-200 rounded-xl focus:ring-2 focus:ring-purple-500 focus:border-purple-500"
                  autoFocus
                />
              </div>
              
              <div className="flex flex-col sm:flex-row gap-2 sm:gap-3">
                <Button 
                  onClick={handleForgotPassword} 
                  disabled={isLoading || !forgotPasswordEmail}
                  className="flex-1 h-10 sm:h-12 text-xs sm:text-sm bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700 text-white"
                >
                  {isLoading ? (
                    <div className="flex items-center gap-2">
                      <div className="w-3 h-3 sm:w-4 sm:h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                      <span>Enviando...</span>
                    </div>
                  ) : (
                    <div className="flex items-center gap-1 sm:gap-2">
                      <Mail className="w-3 h-3 sm:w-4 sm:h-4" />
                      <span>Enviar Link</span>
                    </div>
                  )}
                </Button>
                <Button 
                  variant="outline" 
                  onClick={() => {
                    setShowForgotPassword(false);
                    setForgotPasswordEmail("");
                  }}
                  className="flex-1 h-10 sm:h-12 text-xs sm:text-sm"
                >
                  Cancelar
                </Button>
              </div>
              
              <div className="text-center">
                <p className="text-xs text-gray-500">
                  💡 Verifique também sua caixa de spam
                </p>
              </div>
            </CardContent>
          </Card>
        </div>
      )}
    </div>
  );
};

export default Login;
