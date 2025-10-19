// 👤 Página de Perfil do Usuário
import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '../components/ui/card';
import { Button } from '../components/ui/button';
import { Input } from '../components/ui/input';
import { Label } from '../components/ui/label';
import { Alert, AlertDescription } from '../components/ui/alert';
import { Badge } from '../components/ui/badge';
import { Separator } from '../components/ui/separator';
import { 
  User, 
  Mail, 
  Shield, 
  Calendar, 
  CheckCircle, 
  AlertCircle,
  Save,
  Edit,
  Eye,
  EyeOff
} from 'lucide-react';
import { useAuth } from '../contexts/AuthContext';
import { useToast } from '../hooks/use-toast';

const Perfil = () => {
  const { user, updateProfile, isLoading, changePassword } = useAuth();
  const { toast } = useToast();
  
  const [isEditing, setIsEditing] = useState(false);
  const [showPasswords, setShowPasswords] = useState({
    current: false,
    new: false,
    confirm: false
  });
  const [formData, setFormData] = useState({
    name: user?.name || '',
    email: user?.email || '',
    username: user?.username || '',
    currentPassword: '',
    newPassword: '',
    confirmPassword: ''
  });
  const [isChangingPassword, setIsChangingPassword] = useState(false);

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

  const handleSaveProfile = async () => {
    try {
      await updateProfile({
        name: formData.name,
        username: formData.username
      });
      
      toast({
        title: "✅ Perfil Atualizado!",
        description: "Suas informações foram salvas com sucesso.",
        variant: "default",
      });
      
      setIsEditing(false);
    } catch (error) {
      toast({
        title: "❌ Erro ao Atualizar",
        description: "Não foi possível salvar as alterações.",
        variant: "destructive",
      });
    }
  };

  const handleChangePassword = async () => {
    if (formData.newPassword !== formData.confirmPassword) {
      toast({
        title: "❌ Senhas Não Conferem",
        description: "As senhas digitadas não são iguais.",
        variant: "destructive",
      });
      return;
    }

    if (formData.newPassword.length < 6) {
      toast({
        title: "❌ Senha Muito Fraca",
        description: "A senha deve ter pelo menos 6 caracteres.",
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
        
        setIsChangingPassword(false);
        setFormData(prev => ({
          ...prev,
          currentPassword: '',
          newPassword: '',
          confirmPassword: ''
        }));
        
        // Aguardar um pouco e redirecionar para login
        setTimeout(() => {
          window.location.href = '/login';
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
        description: "Não foi possível alterar a senha.",
        variant: "destructive",
      });
    }
  };

  if (!user) {
    return (
      <div className="container mx-auto p-6">
        <Alert className="border-red-200 bg-red-50">
          <AlertCircle className="h-4 w-4 text-red-600" />
          <AlertDescription>
            <strong>Usuário não encontrado</strong>
            <p className="text-sm mt-1">Faça login para acessar seu perfil.</p>
          </AlertDescription>
        </Alert>
      </div>
    );
  }

  return (
    <div className="container mx-auto p-2 sm:p-4 md:p-6 space-y-4 sm:space-y-6">
      {/* 🎯 Cabeçalho */}
      <div className="text-center space-y-2 sm:space-y-4">
        <div className="flex items-center justify-center space-x-1 sm:space-x-2">
          <User className="h-6 w-6 sm:h-8 sm:w-8 text-blue-600" />
          <h1 className="text-2xl sm:text-3xl font-bold">Meu Perfil</h1>
        </div>
        <p className="text-sm sm:text-base text-muted-foreground max-w-2xl mx-auto px-2">
          Gerencie suas informações pessoais e configurações de conta.
        </p>
      </div>

      {/* 📊 Informações do Usuário */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 sm:gap-6">
        {/* Card Principal - Informações */}
        <Card className="md:col-span-2">
          <CardHeader className="px-3 sm:px-6">
            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2 sm:gap-0">
              <CardTitle className="flex items-center space-x-1 sm:space-x-2 text-base sm:text-lg">
                <User className="h-4 w-4 sm:h-5 sm:w-5" />
                <span>Informações Pessoais</span>
              </CardTitle>
              <Button
                variant={isEditing ? "default" : "outline"}
                size="sm"
                onClick={() => setIsEditing(!isEditing)}
                disabled={isLoading}
                className={`text-xs sm:text-sm ${isEditing ? 'bg-gradient-to-r from-indigo-600 to-indigo-700 hover:from-indigo-700 hover:to-indigo-800 text-white shadow-xl hover:shadow-2xl transition-all duration-200' : ''}`}
              >
                {isEditing ? <Save className="h-3 w-3 sm:h-4 sm:w-4 mr-1 sm:mr-2" /> : <Edit className="h-3 w-3 sm:h-4 sm:w-4 mr-1 sm:mr-2" />}
                {isEditing ? 'Salvar' : 'Editar'}
              </Button>
            </div>
          </CardHeader>
          <CardContent className="space-y-3 sm:space-y-4 px-3 sm:px-6">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-3 sm:gap-4">
              <div className="space-y-1 sm:space-y-2">
                <Label htmlFor="name" className="text-sm">Nome Completo</Label>
                <Input
                  id="name"
                  value={formData.name}
                  onChange={(e) => handleInputChange('name', e.target.value)}
                  disabled={!isEditing}
                  placeholder="Seu nome completo"
                  className="h-10 sm:h-12 text-sm sm:text-base"
                />
              </div>
              
              <div className="space-y-1 sm:space-y-2">
                <Label htmlFor="username" className="text-sm">Nome de Usuário</Label>
                <Input
                  id="username"
                  value={formData.username}
                  onChange={(e) => handleInputChange('username', e.target.value)}
                  disabled={!isEditing}
                  placeholder="Seu nome de usuário"
                  className="h-10 sm:h-12 text-sm sm:text-base"
                />
              </div>
              
              <div className="space-y-1 sm:space-y-2 md:col-span-2">
                <Label htmlFor="email" className="text-sm">E-mail</Label>
                <Input
                  id="email"
                  type="email"
                  value={formData.email}
                  disabled
                  className="bg-gray-50 h-10 sm:h-12 text-sm sm:text-base"
                  placeholder="Seu e-mail"
                />
                <p className="text-xs text-muted-foreground">
                  O e-mail não pode ser alterado por questões de segurança.
                </p>
              </div>
            </div>

            {isEditing && (
              <div className="flex flex-col sm:flex-row gap-2 sm:gap-4 pt-3 sm:pt-4">
                <Button 
                  onClick={handleSaveProfile} 
                  disabled={isLoading} 
                  className="text-sm bg-gradient-to-r from-indigo-600 to-indigo-700 hover:from-indigo-700 hover:to-indigo-800 text-white shadow-xl hover:shadow-2xl transition-all duration-200"
                >
                  {isLoading ? 'Salvando...' : 'Salvar Alterações'}
                </Button>
                <Button variant="outline" onClick={() => setIsEditing(false)} className="text-sm">
                  Cancelar
                </Button>
              </div>
            )}
          </CardContent>
        </Card>

        {/* Card Lateral - Informações da Conta */}
        <Card>
          <CardHeader className="px-3 sm:px-6">
            <CardTitle className="flex items-center space-x-1 sm:space-x-2 text-base sm:text-lg">
              <Shield className="h-4 w-4 sm:h-5 sm:w-5" />
              <span>Informações da Conta</span>
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-3 sm:space-y-4 px-3 sm:px-6">
            <div className="space-y-2 sm:space-y-3">
              <div className="flex items-center justify-between">
                <span className="text-xs sm:text-sm text-muted-foreground">Status</span>
                <Badge variant="secondary" className="bg-green-100 text-green-800 text-xs">
                  <CheckCircle className="w-2 h-2 sm:w-3 sm:h-3 mr-1" />
                  Ativo
                </Badge>
              </div>
              
              <div className="flex items-center justify-between">
                <span className="text-xs sm:text-sm text-muted-foreground">Tipo de Conta</span>
                <Badge variant="outline" className="text-xs">
                  {user.role === 'admin' ? 'Administrador' : 'Usuário'}
                </Badge>
              </div>
              
              <div className="flex items-center justify-between">
                <span className="text-xs sm:text-sm text-muted-foreground">Membro desde</span>
                <span className="text-xs sm:text-sm font-medium">
                  {user.createdAt ? new Date(user.createdAt).toLocaleDateString('pt-BR') : 'N/A'}
                </span>
              </div>
              
              <div className="flex items-center justify-between">
                <span className="text-xs sm:text-sm text-muted-foreground">Último login</span>
                <span className="text-xs sm:text-sm font-medium">
                  {user.lastLogin ? new Date(user.lastLogin).toLocaleDateString('pt-BR') : 'N/A'}
                </span>
              </div>
            </div>

            <Separator />

            <div className="space-y-2">
              <Button
                className="w-full text-sm bg-gradient-to-r from-indigo-600 to-indigo-700 hover:from-indigo-700 hover:to-indigo-800 text-white shadow-xl hover:shadow-2xl transition-all duration-200"
                onClick={() => setIsChangingPassword(true)}
              >
                <Shield className="h-3 w-3 sm:h-4 sm:w-4 mr-1 sm:mr-2" />
                Alterar Senha
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* 🔐 Alteração de Senha */}
      {isChangingPassword && (
        <Card>
          <CardHeader className="px-3 sm:px-6">
            <CardTitle className="flex items-center space-x-1 sm:space-x-2 text-base sm:text-lg">
              <Shield className="h-4 w-4 sm:h-5 sm:w-5" />
              <span>Alterar Senha</span>
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-3 sm:space-y-4 px-3 sm:px-6">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-3 sm:gap-4">
              <div className="space-y-1 sm:space-y-2">
                <Label htmlFor="currentPassword" className="text-sm">Senha Atual</Label>
                <div className="relative">
                  <Input
                    id="currentPassword"
                    type={showPasswords.current ? "text" : "password"}
                    value={formData.currentPassword}
                    onChange={(e) => handleInputChange('currentPassword', e.target.value)}
                    placeholder="Digite sua senha atual"
                    className="h-10 sm:h-12 text-sm sm:text-base pr-10"
                  />
                  <button
                    type="button"
                    onClick={() => togglePasswordVisibility('current')}
                    className="absolute right-2 sm:right-3 top-1/2 transform -translate-y-1/2 text-gray-400 hover:text-gray-600"
                  >
                    {showPasswords.current ? <EyeOff className="w-3 h-3 sm:w-4 sm:h-4" /> : <Eye className="w-3 h-3 sm:w-4 sm:h-4" />}
                  </button>
                </div>
              </div>
              
              <div className="space-y-1 sm:space-y-2">
                <Label htmlFor="newPassword" className="text-sm">Nova Senha</Label>
                <div className="relative">
                  <Input
                    id="newPassword"
                    type={showPasswords.new ? "text" : "password"}
                    value={formData.newPassword}
                    onChange={(e) => handleInputChange('newPassword', e.target.value)}
                    placeholder="Digite a nova senha"
                    className="h-10 sm:h-12 text-sm sm:text-base pr-10"
                  />
                  <button
                    type="button"
                    onClick={() => togglePasswordVisibility('new')}
                    className="absolute right-2 sm:right-3 top-1/2 transform -translate-y-1/2 text-gray-400 hover:text-gray-600"
                  >
                    {showPasswords.new ? <EyeOff className="w-3 h-3 sm:w-4 sm:h-4" /> : <Eye className="w-3 h-3 sm:w-4 sm:h-4" />}
                  </button>
                </div>
              </div>
              
              <div className="space-y-1 sm:space-y-2">
                <Label htmlFor="confirmPassword" className="text-sm">Confirmar Nova Senha</Label>
                <div className="relative">
                  <Input
                    id="confirmPassword"
                    type={showPasswords.confirm ? "text" : "password"}
                    value={formData.confirmPassword}
                    onChange={(e) => handleInputChange('confirmPassword', e.target.value)}
                    placeholder="Confirme a nova senha"
                    className="h-10 sm:h-12 text-sm sm:text-base pr-10"
                  />
                  <button
                    type="button"
                    onClick={() => togglePasswordVisibility('confirm')}
                    className="absolute right-2 sm:right-3 top-1/2 transform -translate-y-1/2 text-gray-400 hover:text-gray-600"
                  >
                    {showPasswords.confirm ? <EyeOff className="w-3 h-3 sm:w-4 sm:h-4" /> : <Eye className="w-3 h-3 sm:w-4 sm:h-4" />}
                  </button>
                </div>
              </div>
            </div>

            <div className="flex flex-col sm:flex-row gap-2 sm:gap-4 pt-3 sm:pt-4">
              <Button onClick={handleChangePassword} disabled={isLoading} className="text-sm">
                {isLoading ? 'Alterando...' : 'Alterar Senha'}
              </Button>
              <Button variant="outline" onClick={() => setIsChangingPassword(false)} className="text-sm">
                Cancelar
              </Button>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
};

export default Perfil;
