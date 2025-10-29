// 📧 Página de Recuperação de Senha com Supabase
// Permite que o usuário solicite um link de reset por email

import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { ArrowLeft, Mail, Send, CheckCircle, AlertCircle, Package, Lock, Shield, Zap, Heart } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Badge } from '@/components/ui/badge';
import { supabase } from '@/lib/supabase';
import img2 from "@/assets/img 2.jpg";

const ForgotPassword = () => {
  const navigate = useNavigate();
  const [email, setEmail] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [message, setMessage] = useState<{ type: 'success' | 'error', text: string } | null>(null);

  // Desabilitar scroll do body
  useEffect(() => {
    document.body.classList.add('no-scroll');
    return () => {
      document.body.classList.remove('no-scroll');
    };
  }, []);

  // Validação de email
  const isValidEmail = (email: string) => {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return emailRegex.test(email);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setMessage(null);
    
    // Validação
    if (!email.trim()) {
      setMessage({ type: 'error', text: 'Por favor, digite seu email' });
      return;
    }

    if (!isValidEmail(email)) {
      setMessage({ type: 'error', text: 'Por favor, digite um email válido' });
      return;
    }

    setIsLoading(true);

    try {
      // Enviar email de recuperação
      const { error } = await supabase.auth.resetPasswordForEmail(email, {
        redirectTo: `${window.location.origin}/reset-password`,
      });

      if (error) {
        // Mensagens de erro traduzidas
        let errorMessage = 'Não foi possível enviar o email. Tente novamente.';
        
        if (error.message.includes('not found') || error.message.includes('does not exist')) {
          errorMessage = 'Usuário não encontrado. Verifique se o email está correto.';
        } else if (error.message.includes('Invalid email')) {
          errorMessage = 'Email inválido. Verifique o formato do email.';
        } else if (error.message.includes('rate limit') || error.message.includes('too many')) {
          errorMessage = 'Muitas tentativas. Aguarde alguns minutos e tente novamente.';
        } else if (error.message.includes('email not confirmed')) {
          errorMessage = 'Por favor, confirme seu email primeiro.';
        }

        setMessage({ type: 'error', text: errorMessage });
        setIsLoading(false);
        return;
      }

      // Sucesso
      setMessage({ 
        type: 'success', 
        text: 'Email enviado! Verifique sua caixa de entrada e spam.' 
      });
      setEmail('');
      
    } catch (error: any) {
      setMessage({ 
        type: 'error', 
        text: 'Ocorreu um erro inesperado. Tente novamente em alguns instantes.' 
      });
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="h-screen w-screen overflow-hidden flex flex-col lg:flex-row">
      {/* Imagem - 60% em lg, 70% em 3xl+, oculta em mobile */}
      <div className="hidden lg:flex lg:w-[60%] 3xl:w-[70%] relative overflow-hidden h-full">
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
      <div className="flex-1 lg:w-[40%] 3xl:w-[30%] flex items-center justify-center p-2 sm:p-3 md:p-4 overflow-hidden relative h-full bg-gradient-to-br from-gray-50 via-purple-50/30 to-blue-50/30">
        {/* Pattern decorativo sutil */}
        <div className="absolute inset-0 opacity-[0.03] pointer-events-none">
          <div className="absolute inset-0" style={{
            backgroundImage: `radial-gradient(circle at 2px 2px, purple 1px, transparent 0)`,
            backgroundSize: '50px 50px'
          }}></div>
        </div>
        
        {/* Gradientes decorativos - ocultos em telas menores */}
        <div className="absolute top-20 right-20 w-64 h-64 bg-purple-200/20 rounded-full blur-3xl hidden xl:block"></div>
        <div className="absolute bottom-20 left-20 w-64 h-64 bg-blue-200/20 rounded-full blur-3xl hidden xl:block"></div>
        
        <div className="w-full max-w-md mx-auto relative z-10 h-full flex flex-col justify-center max-h-full overflow-y-auto">
          {/* Logo e Título */}
          <div className="mb-2 sm:mb-3 md:mb-4 text-center animate-fade-in flex-shrink-0">
            <div className="flex items-center justify-center mb-2 sm:mb-3">
              <div className="w-12 h-12 sm:w-16 sm:h-16 md:w-20 md:h-20 bg-gradient-to-br from-purple-600 to-blue-600 rounded-2xl flex items-center justify-center shadow-2xl hover:shadow-purple-500/50 transform hover:scale-105 transition-all duration-300 animate-fade-in">
                <Package className="w-6 h-6 sm:w-8 sm:h-8 md:w-10 md:h-10 text-white" />
              </div>
            </div>
            
            {/* Título em Mobile - só aparece quando a imagem está oculta */}
            <div className="text-center mb-2 lg:hidden">
              <h1 className="text-3xl font-extrabold text-gray-900 mb-2 bg-gradient-to-r from-purple-600 to-blue-600 bg-clip-text text-transparent">
                Flexi Gestor
              </h1>
              <p className="text-sm text-gray-600 font-medium">
                Recuperação de Senha
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

          <Card className="shadow-xl border border-gray-200/50 bg-white/95 backdrop-blur-sm hover:shadow-2xl hover:border-purple-200/50 transition-all duration-300 overflow-hidden relative flex-shrink-0 max-h-[calc(100vh-150px)] flex flex-col w-full">
            {/* Borda decorativa superior */}
            <div className="absolute top-0 left-0 right-0 h-1 bg-gradient-to-r from-purple-600 via-blue-600 to-purple-600"></div>
            
            <CardHeader className="text-center pb-2 sm:pb-3 md:pb-4 px-3 sm:px-4 md:px-6 pt-3 sm:pt-4 md:pt-6 flex-shrink-0">
              <CardTitle className="text-lg sm:text-xl md:text-2xl font-bold text-gray-900 flex items-center justify-center gap-2">
                <div className="w-8 h-8 sm:w-10 sm:h-10 bg-gradient-to-br from-purple-600 to-blue-600 rounded-lg flex items-center justify-center shadow-md">
                  <Mail className="w-4 h-4 sm:w-5 sm:h-5 text-white" />
                </div>
                Esqueceu sua Senha?
              </CardTitle>
              <CardDescription className="text-xs sm:text-sm text-gray-600 mt-1 sm:mt-2 font-medium">
                Digite seu email e enviaremos um link para redefinir sua senha
              </CardDescription>
            </CardHeader>

            <CardContent className="px-3 sm:px-4 md:px-6 pb-3 sm:pb-4 md:pb-6 space-y-2 sm:space-y-3 overflow-y-auto flex-1 min-h-0">
              {/* Mensagens */}
              {message && (
                <Alert variant={message.type === 'error' ? 'destructive' : 'default'}
                  className={message.type === 'success' ? 'bg-green-50 border-green-200' : ''}>
                  {message.type === 'success' ? (
                    <CheckCircle className="h-4 w-4 text-green-600" />
                  ) : (
                    <AlertCircle className="h-4 w-4" />
                  )}
                  <AlertDescription className={message.type === 'success' ? 'text-green-800' : ''}>
                    {message.text}
                  </AlertDescription>
                </Alert>
              )}

              <form onSubmit={handleSubmit} className="space-y-4">
                {/* Campo Email */}
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
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    className="h-12 border-2 border-gray-200 rounded-xl focus:ring-4 focus:ring-purple-500/20 focus:border-purple-500 focus:outline-none focus-visible:ring-0 focus-visible:ring-offset-0 bg-white text-gray-900 placeholder:text-gray-400 shadow-sm hover:border-purple-300 hover:shadow-md transition-all duration-200 text-sm"
                    disabled={isLoading}
                  />
                </div>

                {/* Botão Enviar */}
                <Button
                  type="submit"
                  className="w-full h-12 bg-gradient-to-r from-purple-600 to-blue-600 hover:from-purple-700 hover:to-blue-700 text-white font-bold rounded-xl shadow-lg hover:shadow-xl transition-all duration-300 transform hover:scale-[1.02] active:scale-[0.98] mt-4 text-base"
                  disabled={isLoading}
                >
                  {isLoading ? (
                    <div className="flex items-center gap-2">
                      <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin" />
                      <span className="text-sm">Enviando...</span>
                    </div>
                  ) : (
                    <div className="flex items-center gap-2">
                      <Send className="w-5 h-5" />
                      <span className="text-base">Enviar Link de Recuperação</span>
                    </div>
                  )}
                </Button>
              </form>

              {/* Informações Adicionais */}
              <div className="pt-4 border-t border-gray-200 space-y-2 text-sm text-gray-600">
                <p className="flex items-start gap-2">
                  <span className="text-purple-600 font-bold">•</span>
                  O link de recuperação expira após um período determinado
                </p>
                <p className="flex items-start gap-2">
                  <span className="text-purple-600 font-bold">•</span>
                  Verifique também sua caixa de <strong>SPAM</strong>
                </p>
                <p className="flex items-start gap-2">
                  <span className="text-purple-600 font-bold">•</span>
                  Não recebeu? Aguarde alguns minutos antes de solicitar novamente
                </p>
              </div>
            </CardContent>
          </Card>

          {/* Link para Login */}
          <div className="mt-4 text-center text-sm text-gray-600">
            Lembrou sua senha?{' '}
            <button
              onClick={() => navigate('/login')}
              className="text-purple-600 hover:text-purple-700 hover:underline font-medium transition-all"
            >
              Fazer Login
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ForgotPassword;

