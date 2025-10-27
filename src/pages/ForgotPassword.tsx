// 📧 Página de Recuperação de Senha com Supabase
// Permite que o usuário solicite um link de reset por email

import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { ArrowLeft, Mail, Send, CheckCircle, AlertCircle } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { supabase } from '@/lib/supabase';

const ForgotPassword = () => {
  const navigate = useNavigate();
  const [email, setEmail] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [message, setMessage] = useState<{ type: 'success' | 'error', text: string } | null>(null);

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
      setMessage({ type: 'error', text: '❌ Por favor, digite seu email' });
      return;
    }

    if (!isValidEmail(email)) {
      setMessage({ type: 'error', text: '❌ Por favor, digite um email válido' });
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

        setMessage({ type: 'error', text: `❌ ${errorMessage}` });
        setIsLoading(false);
        return;
      }

      // Sucesso
      setMessage({ 
        type: 'success', 
        text: '✅ Email enviado! Verifique sua caixa de entrada e spam.' 
      });
      setEmail('');
      
    } catch (error: any) {
      setMessage({ 
        type: 'error', 
        text: '❌ Ocorreu um erro inesperado. Tente novamente em alguns instantes.' 
      });
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-indigo-50 to-purple-50 flex items-center justify-center p-4">
      <div className="w-full max-w-md">
        {/* Botão Voltar */}
        <Button
          variant="ghost"
          className="mb-4"
          onClick={() => navigate('/login')}
        >
          <ArrowLeft className="mr-2 h-4 w-4" />
          Voltar para Login
        </Button>

        <Card className="shadow-2xl border-0">
          <CardHeader className="space-y-3 text-center bg-gradient-to-r from-blue-600 to-purple-600 text-white rounded-t-lg">
            <div className="mx-auto w-16 h-16 bg-white/20 rounded-full flex items-center justify-center">
              <Mail className="h-8 w-8 text-white" />
            </div>
            <CardTitle className="text-2xl font-bold text-white">
              Esqueceu sua Senha?
            </CardTitle>
            <CardDescription className="text-white">
              Sem problemas! Digite seu email e enviaremos um link para redefinir sua senha.
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
              {/* Campo Email */}
              <div className="space-y-2">
                <label className="text-sm font-medium text-gray-700">
                  Email
                </label>
                <div className="relative">
                  <Mail className="absolute left-3 top-1/2 -translate-y-1/2 h-5 w-5 text-gray-400" />
                  <Input
                    type="email"
                    placeholder="seu-email@exemplo.com"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    className="pl-10"
                    disabled={isLoading}
                  />
                </div>
              </div>

              {/* Botão Enviar */}
              <Button
                type="submit"
                className="w-full bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700 text-white"
                disabled={isLoading}
              >
                {isLoading ? (
                  <span className="text-white flex items-center">
                    <div className="mr-2 h-4 w-4 animate-spin rounded-full border-2 border-white border-t-transparent"></div>
                    Enviando...
                  </span>
                ) : (
                  <span className="text-white flex items-center">
                    <Send className="mr-2 h-4 w-4" />
                    Enviar Link de Recuperação
                  </span>
                )}
              </Button>
            </form>

            {/* Informações Adicionais */}
            <div className="pt-4 border-t border-gray-200 space-y-2 text-sm text-gray-600">
              <p className="flex items-start gap-2">
                <span className="text-blue-600 font-bold">•</span>
                O link de recuperação é válido por <strong>1 hora</strong>
              </p>
              <p className="flex items-start gap-2">
                <span className="text-blue-600 font-bold">•</span>
                Verifique também sua caixa de <strong>SPAM</strong>
              </p>
              <p className="flex items-start gap-2">
                <span className="text-blue-600 font-bold">•</span>
                Não recebeu? Tente novamente em alguns minutos
              </p>
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

export default ForgotPassword;

