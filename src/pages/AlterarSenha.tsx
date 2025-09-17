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
import { useFirebaseAuth } from '../contexts/FirebaseAuthContext';
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
  const { user, isLoading, changePassword } = useFirebaseAuth();
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
    <div className="container mx-auto p-2 sm:p-4 md:p-6 max-w-2xl space-y-4 sm:space-y-6">
      {/* 🎯 Cabeçalho */}
      <div className="text-center space-y-2 sm:space-y-4 mb-6 sm:mb-8">
        <div className="flex items-center justify-center space-x-1 sm:space-x-2">
          <Shield className="h-6 w-6 sm:h-8 sm:w-8 text-blue-600" />
          <h1 className="text-2xl sm:text-3xl font-bold">Alterar Senha</h1>
        </div>
        <p className="text-sm sm:text-base text-muted-foreground px-2">
          Mantenha sua conta segura com uma senha forte e única.
        </p>
      </div>

      {/* 🔐 Card Principal */}
      <Card>
        <CardHeader className="px-3 sm:px-6">
          <div className="flex items-center space-x-1 sm:space-x-2">
            <Button
              variant="ghost"
              size="sm"
              onClick={() => navigate('/perfil')}
              className="p-1 sm:p-2"
            >
              <ArrowLeft className="h-3 w-3 sm:h-4 sm:w-4" />
            </Button>
            <CardTitle className="flex items-center space-x-1 sm:space-x-2 text-base sm:text-lg">
              <Shield className="h-4 w-4 sm:h-5 sm:w-5" />
              <span>Nova Senha</span>
            </CardTitle>
          </div>
        </CardHeader>
        <CardContent className="space-y-4 sm:space-y-6 px-3 sm:px-6">
          {/* Informações do Usuário */}
          {user && (
            <Alert className="border-blue-200 bg-blue-50">
              <CheckCircle className="h-4 w-4 text-blue-600" />
              <AlertDescription>
                <strong>Alterando senha para:</strong>
                <p className="text-sm mt-1">{user.name} ({user.email})</p>
              </AlertDescription>
            </Alert>
          )}

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
              
              {/* Validação da Senha */}
              {formData.newPassword && (
                <div className="space-y-2 p-3 bg-gray-50 rounded-lg">
                  <p className="text-sm font-medium text-gray-700">Requisitos da senha:</p>
                  <div className="space-y-1">
                    <div className={`flex items-center space-x-2 text-sm ${passwordValidation.minLength ? 'text-green-600' : 'text-red-600'}`}>
                      <CheckCircle className="w-3 h-3" />
                      <span>Pelo menos 6 caracteres</span>
                    </div>
                    <div className={`flex items-center space-x-2 text-sm ${passwordValidation.hasUpperCase ? 'text-green-600' : 'text-red-600'}`}>
                      <CheckCircle className="w-3 h-3" />
                      <span>Uma letra maiúscula</span>
                    </div>
                    <div className={`flex items-center space-x-2 text-sm ${passwordValidation.hasLowerCase ? 'text-green-600' : 'text-red-600'}`}>
                      <CheckCircle className="w-3 h-3" />
                      <span>Uma letra minúscula</span>
                    </div>
                    <div className={`flex items-center space-x-2 text-sm ${passwordValidation.hasNumbers ? 'text-green-600' : 'text-red-600'}`}>
                      <CheckCircle className="w-3 h-3" />
                      <span>Um número</span>
                    </div>
                  </div>
                </div>
              )}
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
          <div className="flex space-x-4 pt-4">
            <Button 
              onClick={handleChangePassword} 
              disabled={isLoading || !passwordValidation.isValid || formData.newPassword !== formData.confirmPassword}
              className="flex-1"
            >
              {isLoading ? 'Alterando...' : 'Alterar Senha'}
            </Button>
            <Button 
              variant="outline" 
              onClick={() => navigate('/perfil')}
              className="flex-1"
            >
              Cancelar
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* 💡 Dicas de Segurança */}
      <Card className="mt-6">
        <CardHeader>
          <CardTitle className="flex items-center space-x-2">
            <AlertCircle className="h-5 w-5 text-yellow-600" />
            <span>Dicas de Segurança</span>
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-2 text-sm text-muted-foreground">
            <p>• Use uma senha única que não seja usada em outros sites</p>
            <p>• Evite informações pessoais como nome, data de nascimento ou endereço</p>
            <p>• Considere usar um gerenciador de senhas</p>
            <p>• Altere sua senha regularmente</p>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default AlterarSenha;
