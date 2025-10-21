// 🔐 Página de Reset de Senha com Supabase
// O usuário acessa esta página clicando no link recebido por email

import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Lock, Eye, EyeOff, CheckCircle, AlertCircle, Loader2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { useAuth } from '@/contexts/AuthContext';
import { supabase } from '@/lib/supabase';

const ResetPassword = () => {
  const navigate = useNavigate();
  const { changePassword } = useAuth();

  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [isValidating, setIsValidating] = useState(true);
  const [tokenValid, setTokenValid] = useState(false);
  const [userEmail, setUserEmail] = useState('');
  const [message, setMessage] = useState<{ type: 'success' | 'error', text: string } | null>(null);

  // Validar token ao carregar a página
  useEffect(() => {
    const validateSession = async () => {
      try {
        // O Supabase redireciona com #access_token=...&type=recovery
        const hashParams = new URLSearchParams(window.location.hash.substring(1));
        const accessToken = hashParams.get('access_token');
        const type = hashParams.get('type');

        if (type === 'recovery' && accessToken) {
          // Definir a sessão com o token de recuperação
          const { data, error } = await supabase.auth.setSession({
            access_token: accessToken,
            refresh_token: hashParams.get('refresh_token') || ''
          });

          if (error) {
            setMessage({ type: 'error', text: 'Link inválido ou expirado' });
            setTokenValid(false);
          } else if (data.user) {
            // Verificar se o perfil existe, senão criar
            const { data: profile, error: profileError } = await supabase
              .from('perfis')
              .select('*')
              .eq('id', data.user.id)
              .single();

            if (profileError && profileError.code === 'PGRST116') {
              // Perfil não existe, criar
              await supabase.from('perfis').insert([{
                id: data.user.id,
                email: data.user.email,
                nome: data.user.user_metadata?.name || null,
                criado_em: new Date().toISOString(),
                atualizado_em: new Date().toISOString()
              }]);
            }
            
            setTokenValid(true);
            setUserEmail(data.user.email || '');
          } else {
            setMessage({ type: 'error', text: 'Token inválido' });
            setTokenValid(false);
          }
        } else {
          setMessage({ type: 'error', text: 'Link de recuperação inválido' });
          setTokenValid(false);
        }
      } catch (error) {
        setMessage({ type: 'error', text: 'Erro ao validar link de recuperação' });
        setTokenValid(false);
      } finally {
        setIsValidating(false);
      }
    };

    validateSession();
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
      const success = await changePassword(newPassword);

      if (success) {
        setMessage({ 
          type: 'success', 
          text: 'Senha alterada com sucesso! Redirecionando para login...' 
        });
        
        // Fazer logout para limpar a sessão de recuperação
        await supabase.auth.signOut();
        
        // Redirecionar para login após 3 segundos
        setTimeout(() => {
          navigate('/login');
        }, 3000);
      }
    } catch (error) {
      console.error('Erro:', error);
      setMessage({ 
        type: 'error', 
        text: 'Erro ao alterar senha. Tente novamente.' 
      });
    } finally {
      setIsLoading(false);
    }
  };

  // Tela de carregamento enquanto valida token
  if (isValidating) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-50 via-indigo-50 to-purple-50 flex items-center justify-center p-4">
        <Card className="w-full max-w-md shadow-2xl">
          <CardContent className="pt-6 text-center">
            <Loader2 className="h-12 w-12 animate-spin mx-auto text-blue-600 mb-4" />
            <p className="text-gray-600">Validando link de recuperação...</p>
          </CardContent>
        </Card>
      </div>
    );
  }

  // Tela de erro se token inválido
  if (!tokenValid) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-50 via-indigo-50 to-purple-50 flex items-center justify-center p-4">
        <Card className="w-full max-w-md shadow-2xl">
          <CardHeader className="text-center bg-red-50">
            <AlertCircle className="h-16 w-16 text-red-600 mx-auto mb-4" />
            <CardTitle className="text-2xl text-red-800">Link Inválido</CardTitle>
          </CardHeader>
          <CardContent className="pt-6 space-y-4">
            <Alert variant="destructive">
              <AlertCircle className="h-4 w-4" />
              <AlertDescription>
                {message?.text || 'Este link de recuperação é inválido ou expirou.'}
              </AlertDescription>
            </Alert>

            <div className="space-y-2 text-sm text-gray-600">
              <p>Possíveis motivos:</p>
              <ul className="list-disc list-inside space-y-1">
                <li>O link expirou (válido por 1 hora)</li>
                <li>O link já foi usado</li>
                <li>O link está incorreto</li>
              </ul>
            </div>

            <Button
              onClick={() => navigate('/forgot-password')}
              className="w-full bg-gradient-to-r from-blue-600 to-purple-600 text-white"
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
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-indigo-50 to-purple-50 flex items-center justify-center p-4">
      <div className="w-full max-w-md">
        <Card className="shadow-2xl border-0">
          <CardHeader className="space-y-3 text-center bg-gradient-to-r from-blue-600 to-purple-600 text-white rounded-t-lg">
            <div className="mx-auto w-16 h-16 bg-white/20 rounded-full flex items-center justify-center">
              <Lock className="h-8 w-8" />
            </div>
            <CardTitle className="text-2xl font-bold">
              Redefinir Senha
            </CardTitle>
            <CardDescription className="text-white/90">
              Olá, <strong>{userEmail}</strong>!<br />
              Defina sua nova senha abaixo.
            </CardDescription>
          </CardHeader>

          <CardContent className="pt-6 space-y-4">
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
                <label className="text-sm font-medium text-gray-700">
                  Nova Senha
                </label>
                <div className="relative">
                  <Lock className="absolute left-3 top-1/2 -translate-y-1/2 h-5 w-5 text-gray-400" />
                  <Input
                    type={showPassword ? 'text' : 'password'}
                    placeholder="Mínimo 6 caracteres"
                    value={newPassword}
                    onChange={(e) => setNewPassword(e.target.value)}
                    className="pl-10 pr-10"
                    disabled={isLoading}
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600"
                  >
                    {showPassword ? <EyeOff className="h-5 w-5" /> : <Eye className="h-5 w-5" />}
                  </button>
                </div>
              </div>

              {/* Confirmar Senha */}
              <div className="space-y-2">
                <label className="text-sm font-medium text-gray-700">
                  Confirmar Nova Senha
                </label>
                <div className="relative">
                  <Lock className="absolute left-3 top-1/2 -translate-y-1/2 h-5 w-5 text-gray-400" />
                  <Input
                    type={showConfirmPassword ? 'text' : 'password'}
                    placeholder="Digite a senha novamente"
                    value={confirmPassword}
                    onChange={(e) => setConfirmPassword(e.target.value)}
                    className="pl-10 pr-10"
                    disabled={isLoading}
                  />
                  <button
                    type="button"
                    onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600"
                  >
                    {showConfirmPassword ? <EyeOff className="h-5 w-5" /> : <Eye className="h-5 w-5" />}
                  </button>
                </div>
              </div>

              {/* Botão Redefinir */}
              <Button
                type="submit"
                className="w-full bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700 text-white"
                disabled={isLoading}
              >
                {isLoading ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Redefinindo...
                  </>
                ) : (
                  <>
                    <Lock className="mr-2 h-4 w-4" />
                    Redefinir Senha
                  </>
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
            className="text-blue-600 hover:text-blue-700 font-medium"
          >
            Fazer Login
          </button>
        </div>
      </div>
    </div>
  );
};

export default ResetPassword;
