// 🧪 Teste Simples de Autenticação Firebase
import React, { useState } from 'react';
import { Button } from '../components/ui/button';
import { Input } from '../components/ui/input';
import { Card, CardContent, CardHeader, CardTitle } from '../components/ui/card';
import { Alert, AlertDescription } from '../components/ui/alert';
import { CheckCircle, AlertCircle } from 'lucide-react';
import { useFirebaseAuth } from '../contexts/FirebaseAuthContext';

const TestAuth = () => {
  const [email, setEmail] = useState('antoniolucas9014@gmail.com');
  const [password, setPassword] = useState('@Lucas@07112003');
  const [message, setMessage] = useState('');
  const [isSuccess, setIsSuccess] = useState(false);

  const { register, login, user, isAuthenticated } = useFirebaseAuth();

  const handleRegister = async () => {
    try {
      setMessage('🔄 Criando conta...');
      const success = await register({
        username: 'AdminLucas',
        email: email,
        name: 'Antônio Lucas Costa Araújo',
        password: password,
        role: 'admin'
      });
      
      if (success) {
        setMessage('✅ Conta criada com sucesso!');
        setIsSuccess(true);
      } else {
        setMessage('❌ Erro ao criar conta');
        setIsSuccess(false);
      }
    } catch (error: any) {
      setMessage(`❌ Erro: ${error.message}`);
      setIsSuccess(false);
    }
  };

  const handleLogin = async () => {
    try {
      setMessage('🔄 Fazendo login...');
      const success = await login(email, password);
      
      if (success) {
        setMessage('✅ Login realizado com sucesso!');
        setIsSuccess(true);
      } else {
        setMessage('❌ Erro no login');
        setIsSuccess(false);
      }
    } catch (error: any) {
      setMessage(`❌ Erro: ${error.message}`);
      setIsSuccess(false);
    }
  };

  return (
    <div className="container mx-auto p-6 max-w-md">
      <Card>
        <CardHeader>
          <CardTitle className="text-center">🧪 Teste de Autenticação</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          {isAuthenticated ? (
            <Alert className="border-green-200 bg-green-50">
              <CheckCircle className="h-4 w-4 text-green-600" />
              <AlertDescription>
                <strong>✅ Logado!</strong>
                <p className="text-sm mt-1">
                  Usuário: {user?.name}<br/>
                  E-mail: {user?.email}
                </p>
              </AlertDescription>
            </Alert>
          ) : (
            <Alert className="border-blue-200 bg-blue-50">
              <AlertCircle className="h-4 w-4 text-blue-600" />
              <AlertDescription>
                <strong>ℹ️ Não logado</strong>
                <p className="text-sm mt-1">
                  Teste criar conta ou fazer login
                </p>
              </AlertDescription>
            </Alert>
          )}

          <div className="space-y-2">
            <label className="text-sm font-medium">E-mail</label>
            <Input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="seu@email.com"
            />
          </div>

          <div className="space-y-2">
            <label className="text-sm font-medium">Senha</label>
            <Input
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="sua senha"
            />
          </div>

          <div className="space-y-2">
            <Button onClick={handleRegister} className="w-full">
              📝 Criar Conta
            </Button>
            <Button onClick={handleLogin} variant="outline" className="w-full">
              🔐 Fazer Login
            </Button>
          </div>

          {message && (
            <Alert className={isSuccess ? 'border-green-200 bg-green-50' : 'border-red-200 bg-red-50'}>
              <AlertDescription>
                {message}
              </AlertDescription>
            </Alert>
          )}
        </CardContent>
      </Card>
    </div>
  );
};

export default TestAuth;
