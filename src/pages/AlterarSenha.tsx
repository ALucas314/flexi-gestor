// 🔐 Página de Alteração de Senha
import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '../components/ui/card';
import { Button } from '../components/ui/button';
import { Input } from '../components/ui/input';
import { Label } from '../components/ui/label';
import { Alert, AlertDescription } from '../components/ui/alert';
import { 
  Shield, 
  CheckCircle, 
  AlertCircle,
  ArrowLeft
} from 'lucide-react';
import { useAuth } from '../contexts/AuthContext';
import { useToast } from '../hooks/use-toast';
import { useNavigate } from 'react-router-dom';

// Componente SVG personalizado para o ícone de olho
const EyeIcon = ({ className = "w-4 h-4" }: { className?: string }) => (
  <svg
    className={className}
    fill="none"
    stroke="currentColor"
    viewBox="0 0 24 24"
    xmlns="http://www.w3.org/2000/svg"
  >
    <path d="M2.062 12.348a1 1 0 0 1 0-.696 10.75 10.75 0 0 1 19.876 0 1 1 0 0 1 0 .696 10.75 10.75 0 0 1-19.876 0"></path>
  </svg>
);

const EyeOffIcon = ({ className = "w-4 h-4" }: { className?: string }) => (
  <svg
    className={className}
    fill="none"
    stroke="currentColor"
    viewBox="0 0 24 24"
    xmlns="http://www.w3.org/2000/svg"
  >
    <path d="M3.98 8.223A10.477 10.477 0 0 0 1.934 12C3.226 16.338 7.244 19.5 12 19.5c.993 0 1.953-.138 2.863-.395M6.228 6.228A10.45 10.45 0 0 1 12 4.5c4.756 0 8.773 3.162 10.065 7.498a10.523 10.523 0 0 1-4.293 5.774M6.228 6.228L3 3m3.228 3.228l3.65 3.65m7.894 7.894L21 21m-3.228-3.228l-3.65-3.65m0 0a3 3 0 1 1-4.243-4.243m4.242 4.242L9.88 9.88"></path>
  </svg>
);

const AlterarSenha = () => {
  const { user, isLoading, changePassword } = useAuth();
  const { toast } = useToast();
  const navigate = useNavigate();
  
  const [showPasswords, setShowPasswords] = useState({
    current: false,
    new: false,
    confirm: false
  });
  
  const [formData, setFormData] = useState({
    currentPassword: '',
    newPassword: '',
    confirmPassword: ''
  });

  const handleInputChange = (field: string, value: string) => {
    setFormData(prev => ({
      ...prev,
      [field]: value
    }));
  };

  const togglePasswordVisibility = (field: 'current' | 'new' | 'confirm') => {
    setShowPasswords(prev => ({
      ...prev,
      [field]: !prev[field]
    }));
  };

  const validatePassword = (password: string) => {
    const minLength = password.length >= 6;
    const hasUpperCase = /[A-Z]/.test(password);
    const hasLowerCase = /[a-z]/.test(password);
    const hasNumbers = /\d/.test(password);
    const hasSpecialChar = /[!@#$%^&*(),.?":{}|<>]/.test(password);

    return {
      minLength,
      hasUpperCase,
      hasLowerCase,
      hasNumbers,
      hasSpecialChar,
      isValid: minLength && hasUpperCase && hasLowerCase && hasNumbers
    };
  };

  const handleChangePassword = async () => {
    // Validações
    if (!formData.currentPassword) {
      toast({
        title: "❌ Campo Obrigatório",
        description: "Digite sua senha atual.",
        variant: "destructive",
      });
      return;
    }

    if (!formData.newPassword) {
      toast({
        title: "❌ Campo Obrigatório",
        description: "Digite a nova senha.",
        variant: "destructive",
      });
      return;
    }

    if (formData.newPassword !== formData.confirmPassword) {
      toast({
        title: "❌ Senhas Não Conferem",
        description: "As senhas digitadas não são iguais.",
        variant: "destructive",
      });
      return;
    }

    const passwordValidation = validatePassword(formData.newPassword);
    if (!passwordValidation.isValid) {
      toast({
        title: "❌ Senha Muito Fraca",
        description: "A senha deve ter pelo menos 6 caracteres, incluindo maiúsculas, minúsculas e números.",
        variant: "destructive",
      });
      return;
    }

    if (formData.currentPassword === formData.newPassword) {
      toast({
        title: "❌ Senha Igual",
        description: "A nova senha deve ser diferente da senha atual.",
        variant: "destructive",
      });
      return;
    }

    try {
      // Usar a função real do Firebase
      const success = await changePassword(formData.currentPassword, formData.newPassword);
      
      if (success) {
        toast({
          title: "✅ Senha Alterada!",
          description: "Sua senha foi alterada com sucesso. Você será redirecionado para fazer login novamente.",
          variant: "default",
        });
        
        // Limpar formulário
        setFormData({
          currentPassword: '',
          newPassword: '',
          confirmPassword: ''
        });
        
        // Aguardar um pouco e redirecionar para login
        setTimeout(() => {
          navigate('/login');
        }, 2000);
      } else {
        toast({
          title: "❌ Erro ao Alterar Senha",
          description: "Não foi possível alterar a senha. Verifique se a senha atual está correta.",
          variant: "destructive",
        });
      }
    } catch (error) {
      toast({
        title: "❌ Erro ao Alterar Senha",
        description: "Não foi possível alterar a senha. Verifique sua senha atual.",
        variant: "destructive",
      });
    }
  };

  const passwordValidation = validatePassword(formData.newPassword);

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50 to-indigo-50 p-4 md:p-6 lg:p-8">
      <div className="container mx-auto max-w-5xl space-y-6">
        {/* 🎯 Cabeçalho Moderno */}
        <div className="bg-white/80 backdrop-blur-lg rounded-3xl shadow-xl border border-gray-200/50 p-6 md:p-8">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-4">
              <div className="w-16 h-16 bg-gradient-to-br from-indigo-600 via-indigo-600 to-purple-600 rounded-2xl flex items-center justify-center shadow-lg">
                <Shield className="h-8 w-8 text-white" />
              </div>
              <div>
                <h1 className="text-3xl font-bold bg-gradient-to-r from-indigo-600 to-purple-600 bg-clip-text text-transparent">
                  Alterar Senha
                </h1>
                <p className="text-gray-600 mt-1">
                  Mantenha sua conta segura com uma senha forte e única
                </p>
              </div>
            </div>
            <Button
              variant="ghost"
              size="sm"
              onClick={() => navigate('/perfil')}
              className="hover:bg-gray-100"
            >
              <ArrowLeft className="h-5 w-5 mr-2" />
              Voltar
            </Button>
          </div>
        </div>

        {/* Grid com Card de Formulário e Dicas */}
        <div className="grid lg:grid-cols-3 gap-6">
          {/* Card Principal de Formulário */}
          <div className="lg:col-span-2">
            <Card className="shadow-xl border-0 bg-white/80 backdrop-blur-lg">
              <CardHeader className="bg-gradient-to-r from-indigo-50 to-purple-50 border-b border-gray-200/50">
                {/* Informações do Usuário */}
                {user && (
                  <div className="flex items-center space-x-4 p-4 bg-white/50 rounded-xl">
                    <div className="w-14 h-14 bg-gradient-to-br from-indigo-600 to-purple-600 rounded-full flex items-center justify-center text-white text-xl font-bold shadow-lg">
                      {user.avatar || user.name?.charAt(0) || '👤'}
                    </div>
                    <div className="flex-1">
                      <p className="text-sm text-gray-600 font-medium">Alterando senha para:</p>
                      <p className="text-lg font-semibold text-gray-900">{user.name}</p>
                      <p className="text-sm text-gray-600">{user.email}</p>
                    </div>
                  </div>
                )}
              </CardHeader>
              <CardContent className="space-y-6 p-6 md:p-8">

          {/* Formulário */}
          <div className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="currentPassword">Senha Atual</Label>
              <div className="relative">
                <Input
                  id="currentPassword"
                  type={showPasswords.current ? "text" : "password"}
                  value={formData.currentPassword}
                  onChange={(e) => handleInputChange('currentPassword', e.target.value)}
                  placeholder="Digite sua senha atual"
                  className="pr-10"
                />
                <button
                  type="button"
                  onClick={() => togglePasswordVisibility('current')}
                  className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400 hover:text-gray-600"
                >
                  {showPasswords.current ? <EyeOffIcon className="w-4 h-4" /> : <EyeIcon className="w-4 h-4" />}
                </button>
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="newPassword">Nova Senha</Label>
              <div className="relative">
                <Input
                  id="newPassword"
                  type={showPasswords.new ? "text" : "password"}
                  value={formData.newPassword}
                  onChange={(e) => handleInputChange('newPassword', e.target.value)}
                  placeholder="Digite a nova senha"
                  className="pr-10"
                />
                <button
                  type="button"
                  onClick={() => togglePasswordVisibility('new')}
                  className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400 hover:text-gray-600"
                >
                  {showPasswords.new ? <EyeOffIcon className="w-4 h-4" /> : <EyeIcon className="w-4 h-4" />}
                </button>
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="confirmPassword">Confirmar Nova Senha</Label>
              <div className="relative">
                <Input
                  id="confirmPassword"
                  type={showPasswords.confirm ? "text" : "password"}
                  value={formData.confirmPassword}
                  onChange={(e) => handleInputChange('confirmPassword', e.target.value)}
                  placeholder="Confirme a nova senha"
                  className="pr-10"
                />
                <button
                  type="button"
                  onClick={() => togglePasswordVisibility('confirm')}
                  className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400 hover:text-gray-600"
                >
                  {showPasswords.confirm ? <EyeOffIcon className="w-4 h-4" /> : <EyeIcon className="w-4 h-4" />}
                </button>
              </div>
              
              {/* Confirmação */}
              {formData.confirmPassword && (
                <div className={`flex items-center space-x-2 text-sm ${formData.newPassword === formData.confirmPassword ? 'text-green-600' : 'text-red-600'}`}>
                  <CheckCircle className="w-3 h-3" />
                  <span>
                    {formData.newPassword === formData.confirmPassword ? 'Senhas conferem' : 'Senhas não conferem'}
                  </span>
                </div>
              )}
            </div>
          </div>

                {/* Botões */}
                <div className="flex flex-col sm:flex-row gap-3 pt-6">
                  <Button 
                    onClick={handleChangePassword} 
                    disabled={isLoading || !passwordValidation.isValid || formData.newPassword !== formData.confirmPassword}
                    className="flex-1 h-12 bg-gradient-to-r from-indigo-600 to-purple-600 hover:from-indigo-700 hover:to-purple-700 text-white font-semibold shadow-lg hover:shadow-xl transition-all"
                  >
                    {isLoading ? (
                      <span className="flex items-center">
                        <div className="mr-2 h-4 w-4 animate-spin rounded-full border-2 border-white border-t-transparent"></div>
                        Alterando...
                      </span>
                    ) : (
                      <span className="flex items-center">
                        <Shield className="mr-2 h-5 w-5" />
                        Alterar Senha
                      </span>
                    )}
                  </Button>
                  <Button 
                    variant="outline" 
                    onClick={() => navigate('/perfil')}
                    className="flex-1 h-12 border-2 hover:bg-gray-50 font-semibold"
                  >
                    Cancelar
                  </Button>
                </div>
              </CardContent>
            </Card>
          </div>

          {/* 💡 Sidebar com Dicas de Segurança */}
          <div className="lg:col-span-1 space-y-6">
            <Card className="shadow-xl border-0 bg-gradient-to-br from-yellow-50 to-orange-50">
              <CardHeader className="pb-4">
                <CardTitle className="flex items-center space-x-2 text-lg">
                  <div className="w-10 h-10 bg-gradient-to-br from-yellow-500 to-orange-500 rounded-xl flex items-center justify-center">
                    <AlertCircle className="h-5 w-5 text-white" />
                  </div>
                  <span className="text-gray-900">Dicas de Segurança</span>
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="flex items-start space-x-3 p-3 bg-white/60 rounded-xl">
                  <div className="w-6 h-6 bg-green-500 rounded-full flex items-center justify-center text-white text-xs font-bold flex-shrink-0 mt-0.5">
                    1
                  </div>
                  <p className="text-sm text-gray-700">
                    <strong className="text-gray-900">Senha Única:</strong> Use uma senha diferente para cada serviço
                  </p>
                </div>
                
                <div className="flex items-start space-x-3 p-3 bg-white/60 rounded-xl">
                  <div className="w-6 h-6 bg-blue-500 rounded-full flex items-center justify-center text-white text-xs font-bold flex-shrink-0 mt-0.5">
                    2
                  </div>
                  <p className="text-sm text-gray-700">
                    <strong className="text-gray-900">Evite Dados Pessoais:</strong> Não use nome, data de nascimento ou endereço
                  </p>
                </div>
                
                <div className="flex items-start space-x-3 p-3 bg-white/60 rounded-xl">
                  <div className="w-6 h-6 bg-purple-500 rounded-full flex items-center justify-center text-white text-xs font-bold flex-shrink-0 mt-0.5">
                    3
                  </div>
                  <p className="text-sm text-gray-700">
                    <strong className="text-gray-900">Gerenciador:</strong> Considere usar um gerenciador de senhas
                  </p>
                </div>
                
                <div className="flex items-start space-x-3 p-3 bg-white/60 rounded-xl">
                  <div className="w-6 h-6 bg-orange-500 rounded-full flex items-center justify-center text-white text-xs font-bold flex-shrink-0 mt-0.5">
                    4
                  </div>
                  <p className="text-sm text-gray-700">
                    <strong className="text-gray-900">Atualize Regularmente:</strong> Troque sua senha periodicamente
                  </p>
                </div>
              </CardContent>
            </Card>

            {/* Card de Força da Senha */}
            {formData.newPassword && (
              <Card className="shadow-xl border-0 bg-gradient-to-br from-indigo-50 to-purple-50">
                <CardHeader className="pb-4">
                  <CardTitle className="flex items-center space-x-2 text-lg">
                    <div className="w-10 h-10 bg-gradient-to-br from-indigo-600 to-purple-600 rounded-xl flex items-center justify-center">
                      <Shield className="h-5 w-5 text-white" />
                    </div>
                    <span className="text-gray-900">Força da Senha</span>
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-3">
                    {['minLength', 'hasUpperCase', 'hasLowerCase', 'hasNumbers'].map((key, index) => (
                      <div
                        key={key}
                        className={`flex items-center space-x-3 p-3 rounded-xl transition-all ${
                          passwordValidation[key as keyof typeof passwordValidation]
                            ? 'bg-green-100 border-2 border-green-300'
                            : 'bg-white/60 border-2 border-gray-200'
                        }`}
                      >
                        <CheckCircle
                          className={`w-5 h-5 ${
                            passwordValidation[key as keyof typeof passwordValidation]
                              ? 'text-green-600'
                              : 'text-gray-400'
                          }`}
                        />
                        <span
                          className={`text-sm font-medium ${
                            passwordValidation[key as keyof typeof passwordValidation]
                              ? 'text-green-900'
                              : 'text-gray-600'
                          }`}
                        >
                          {key === 'minLength' && 'Mínimo 6 caracteres'}
                          {key === 'hasUpperCase' && 'Letra maiúscula'}
                          {key === 'hasLowerCase' && 'Letra minúscula'}
                          {key === 'hasNumbers' && 'Número'}
                        </span>
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default AlterarSenha;
