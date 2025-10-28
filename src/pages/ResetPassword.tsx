// 🔐 Página de Reset de Senha com Supabase
// O usuário acessa esta página clicando no link recebido por email

import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Lock, Eye, EyeOff, CheckCircle, AlertCircle, Loader2, Package } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Alert, AlertDescription } from '@/components/ui/alert';
import img2 from "@/assets/img 2.jpg";

const ResetPassword = () => {
  const navigate = useNavigate();

  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [isValidating, setIsValidating] = useState(true);
  const [tokenValid, setTokenValid] = useState(false);
  const [userEmail, setUserEmail] = useState('');
  const [accessToken, setAccessToken] = useState<string>('');
  const [message, setMessage] = useState<{ type: 'success' | 'error', text: string } | null>(null);

  // Validar token ao carregar a página
  useEffect(() => {
    const validateToken = async () => {
      try {
        // O Supabase redireciona com #access_token=...&type=recovery
        const hashParams = new URLSearchParams(window.location.hash.substring(1));
        const accessToken = hashParams.get('access_token');
        const refreshToken = hashParams.get('refresh_token');
        const type = hashParams.get('type');

        if (type === 'recovery' && accessToken && refreshToken) {
          // Importar supabase client
          const { supabase } = await import('@/lib/supabase');
          
          // Restaurar sessão automaticamente
          const { data: sessionData, error: sessionError } = await supabase.auth.setSession({
            access_token: accessToken,
            refresh_token: refreshToken,
          });

          if (sessionError) {
            setMessage({ type: 'error', text: 'Link expirado ou inválido' });
            setTokenValid(false);
            setIsValidating(false);
            return;
          }
          
          // Obter email do usuário
          const email = sessionData.user?.email || '';
          
          // 🔑 IMPORTANTE: Salvar token em memória!
          setAccessToken(accessToken);
          setTokenValid(true);
          setUserEmail(email);
        } else {
          // Se chegou na página sem os parâmetros necessários
          if (!accessToken && !refreshToken && !type) {
            setMessage({ type: 'error', text: 'Acesse o link de recuperação enviado por email' });
            // Opcional: redirecionar para /forgot-password após alguns segundos
            setTimeout(() => {
              window.location.href = '/forgot-password';
            }, 3000);
          } else {
            setMessage({ type: 'error', text: 'Link de recuperação inválido ou expirado' });
          }
          setTokenValid(false);
        }
      } catch (error) {
        setMessage({ type: 'error', text: 'Erro ao validar link de recuperação' });
        setTokenValid(false);
      } finally {
        setIsValidating(false);
      }
    };

    // Aguardar um pouco para garantir que o hash foi carregado
    const timer = setTimeout(validateToken, 100);
    
    return () => clearTimeout(timer);
  }, []);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    // Validações
    if (!newPassword || !confirmPassword) {
      setMessage({ type: 'error', text: 'Preencha todos os campos' });
      return;
    }

    if (newPassword.length < 6) {
      setMessage({ type: 'error', text: 'A senha deve ter pelo menos 6 caracteres' });
      return;
    }

    if (newPassword !== confirmPassword) {
      setMessage({ type: 'error', text: 'As senhas não coincidem' });
      return;
    }

    setIsLoading(true);
    setMessage(null);

    try {
      console.log('🔐 Iniciando redefinição de senha...');

      // Importar supabase client
      const { supabase } = await import('@/lib/supabase');

      // A sessão já foi restaurada no useEffect, apenas atualizar a senha
      console.log('🔄 Atualizando senha do usuário...');
      
      const { data, error } = await supabase.auth.updateUser({
        password: newPassword
      });

      if (error) {
        console.error('❌ Erro ao atualizar senha:', error);
        
        if (error.message.includes('expired') || error.message.includes('invalid') || error.message.includes('session')) {
          setMessage({ 
            type: 'error', 
            text: 'Sessão expirada. Por favor, solicite um novo link de recuperação.' 
          });
        } else {
          setMessage({ 
            type: 'error', 
            text: `Erro ao alterar senha: ${error.message}` 
          });
        }
        setIsLoading(false);
        return;
      }

      console.log('✅ Senha alterada com sucesso!', data);

      // Fazer logout para forçar novo login
      await supabase.auth.signOut();

      setMessage({ 
        type: 'success', 
        text: 'Senha alterada com sucesso! Redirecionando para login...' 
      });
      
      // Redirecionar para login após 2 segundos
      setTimeout(() => {
        navigate('/login');
      }, 2000);

    } catch (error) {
      console.error('❌ Erro ao redefinir senha:', error);
      setMessage({ 
        type: 'error', 
        text: 'Erro ao alterar senha. Verifique sua conexão e tente novamente.' 
      });
      setIsLoading(false);
    }
  };

  // Tela de carregamento enquanto valida token
  if (isValidating) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-gray-50 via-purple-50/30 to-blue-50/30 flex items-center justify-center p-4">
        <Card className="w-full max-w-md shadow-xl border border-gray-200/50 bg-white/95 backdrop-blur-sm">
          <CardContent className="pt-6 text-center">
            <Loader2 className="h-12 w-12 animate-spin mx-auto text-purple-600 mb-4" />
            <p className="text-gray-600 font-medium">Validando link de recuperação...</p>
          </CardContent>
        </Card>
      </div>
    );
  }

  // Tela de erro se token inválido
  if (!tokenValid) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-gray-50 via-purple-50/30 to-blue-50/30 flex items-center justify-center p-4">
        <Card className="w-full max-w-md shadow-xl border border-gray-200/50 bg-white/95 backdrop-blur-sm">
          <CardHeader className="text-center pb-4 sm:pb-6 px-4 sm:px-6 pt-8">
            <div className="mx-auto w-16 h-16 bg-red-50 rounded-full flex items-center justify-center mb-4">
              <AlertCircle className="h-8 w-8 text-red-600" />
            </div>
            <CardTitle className="text-2xl font-bold text-gray-900">Link Inválido</CardTitle>
          </CardHeader>
          <CardContent className="pt-6 space-y-4 px-4 sm:px-6">
            <Alert variant="destructive">
              <AlertCircle className="h-4 w-4" />
              <AlertDescription>
                {message?.text || 'Este link de recuperação é inválido ou expirou.'}
              </AlertDescription>
            </Alert>

            <div className="space-y-2 text-sm text-gray-600">
              <p>Possíveis motivos:</p>
              <ul className="list-disc list-inside space-y-1">
                <li>O link expirou</li>
                <li>O link já foi usado</li>
                <li>O link está incorreto</li>
              </ul>
            </div>

            <Button
              onClick={() => navigate('/forgot-password')}
              className="w-full h-12 bg-gradient-to-r from-purple-600 to-blue-600 hover:from-purple-700 hover:to-blue-700 text-white font-bold rounded-xl shadow-lg hover:shadow-xl transition-all duration-300"
            >
              Solicitar Novo Link
            </Button>

            <Button
              variant="outline"
              onClick={() => navigate('/login')}
              className="w-full"
            >
              Voltar para Login
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  // Formulário de redefinição de senha
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
          <Card className="shadow-xl border border-gray-200/50 bg-white/95 backdrop-blur-sm hover:shadow-2xl hover:border-purple-200/50 transition-all duration-300 overflow-hidden relative">
            {/* Borda decorativa superior */}
            <div className="absolute top-0 left-0 right-0 h-1 bg-gradient-to-r from-purple-600 via-blue-600 to-purple-600"></div>
            
            <CardHeader className="text-center pb-4 sm:pb-6 px-4 sm:px-6 pt-8">
              <CardTitle className="text-xl sm:text-2xl font-bold text-gray-900 flex items-center justify-center gap-2">
                <div className="w-10 h-10 bg-gradient-to-br from-purple-600 to-blue-600 rounded-lg flex items-center justify-center shadow-md">
                  <Lock className="w-5 h-5 text-white" />
                </div>
                Redefinir Senha
              </CardTitle>
              <CardDescription className="text-sm text-gray-600 mt-2 font-medium">
                Olá, <strong>{userEmail}</strong><br />
                Defina sua nova senha abaixo
              </CardDescription>
            </CardHeader>

            <CardContent className="px-4 sm:px-6 space-y-4">
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
                {/* Nova Senha */}
                <div className="space-y-2">
                <label className="text-sm font-semibold text-gray-800 flex items-center gap-2">
                  <div className="w-6 h-6 bg-gradient-to-br from-blue-500 to-indigo-500 rounded-lg flex items-center justify-center shadow-md">
                    <Lock className="w-3 h-3 text-white" />
                  </div>
                  Nova Senha
                </label>
                <div className="relative">
                  <Input
                    type={showPassword ? 'text' : 'password'}
                    placeholder="Mínimo 6 caracteres"
                    value={newPassword}
                    onChange={(e) => setNewPassword(e.target.value)}
                    className="h-12 border-2 border-gray-200 rounded-xl focus:ring-2 focus:ring-purple-500 focus:border-purple-500 focus:outline-none focus-visible:ring-0 focus-visible:ring-offset-0 bg-white text-gray-900 placeholder:text-gray-400 shadow-sm hover:border-purple-300 hover:shadow-md transition-all duration-200 pr-12 text-sm"
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

              {/* Confirmar Senha */}
              <div className="space-y-2">
                <label className="text-sm font-semibold text-gray-800 flex items-center gap-2">
                  <div className="w-6 h-6 bg-gradient-to-br from-indigo-500 to-purple-500 rounded-lg flex items-center justify-center shadow-md">
                    <Lock className="w-3 h-3 text-white" />
                  </div>
                  Confirmar Senha
                </label>
                <div className="relative">
                  <Input
                    type={showConfirmPassword ? 'text' : 'password'}
                    placeholder="Digite novamente"
                    value={confirmPassword}
                    onChange={(e) => setConfirmPassword(e.target.value)}
                    className="h-12 border-2 border-gray-200 rounded-xl focus:ring-2 focus:ring-purple-500 focus:border-purple-500 focus:outline-none focus-visible:ring-0 focus-visible:ring-offset-0 bg-white text-gray-900 placeholder:text-gray-400 shadow-sm hover:border-purple-300 hover:shadow-md transition-all duration-200 pr-12 text-sm"
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

              {/* Botão Redefinir */}
              <Button
                type="submit"
                className="w-full h-12 bg-gradient-to-r from-purple-600 to-blue-600 hover:from-purple-700 hover:to-blue-700 text-white font-bold rounded-xl shadow-lg hover:shadow-xl transition-all duration-300 transform hover:scale-[1.02] active:scale-[0.98] mt-4 text-base"
                disabled={isLoading}
              >
                {isLoading ? (
                  <div className="flex items-center gap-2">
                    <Loader2 className="w-5 h-5 animate-spin" />
                    <span className="text-sm">Redefinindo...</span>
                  </div>
                ) : (
                  <div className="flex items-center gap-2">
                    <Lock className="w-5 h-5" />
                    <span className="text-base">Redefinir Senha</span>
                  </div>
                )}
              </Button>
            </form>

              {/* Requisitos de Senha */}
              <div className="pt-4 border-t border-gray-200 space-y-2 text-sm text-gray-600">
                <p className="font-medium">Requisitos da senha:</p>
                <ul className="list-disc list-inside space-y-1">
                  <li className={newPassword.length >= 6 ? 'text-green-600' : ''}>
                    Mínimo de 6 caracteres
                  </li>
                  <li className={newPassword === confirmPassword && newPassword ? 'text-green-600' : ''}>
                    As senhas devem coincidir
                  </li>
                </ul>
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

export default ResetPassword;
