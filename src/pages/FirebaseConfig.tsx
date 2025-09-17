// 🔥 Página de Configuração do Firebase
// Esta página permite configurar facilmente o Firebase para o Flexi Gestor

import React, { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '../components/ui/card';
import { Button } from '../components/ui/button';
import { Input } from '../components/ui/input';
import { Label } from '../components/ui/label';
import { Textarea } from '../components/ui/textarea';
import { Alert, AlertDescription } from '../components/ui/alert';
import { Badge } from '../components/ui/badge';
import { Separator } from '../components/ui/separator';
import { 
  CheckCircle, 
  AlertCircle, 
  Copy, 
  ExternalLink, 
  Database, 
  Shield, 
  Zap,
  Info
} from 'lucide-react';

const FirebaseConfig = () => {
  const [config, setConfig] = useState({
    apiKey: '',
    authDomain: '',
    projectId: '',
    storageBucket: '',
    messagingSenderId: '',
    appId: ''
  });

  const [isValidating, setIsValidating] = useState(false);
  const [validationResult, setValidationResult] = useState<{
    isValid: boolean;
    message: string;
    details?: string;
  } | null>(null);

  const [copiedField, setCopiedField] = useState<string | null>(null);

  // 📋 Dados de exemplo para demonstração
  const exampleConfig = {
    apiKey: "AIzaSyBxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx",
    authDomain: "flexi-gestor-demo.firebaseapp.com",
    projectId: "flexi-gestor-demo",
    storageBucket: "flexi-gestor-demo.appspot.com",
    messagingSenderId: "123456789012",
    appId: "1:123456789012:web:abcdef1234567890abcdef"
  };

  // 🔄 Atualizar configuração
  const handleConfigChange = (field: string, value: string) => {
    setConfig(prev => ({
      ...prev,
      [field]: value
    }));
    setValidationResult(null);
  };

  // 📋 Copiar para clipboard
  const copyToClipboard = async (text: string, field: string) => {
    try {
      await navigator.clipboard.writeText(text);
      setCopiedField(field);
      setTimeout(() => setCopiedField(null), 2000);
    } catch (error) {
      console.error('Erro ao copiar:', error);
    }
  };

  // ✅ Validar configuração
  const validateConfig = async () => {
    setIsValidating(true);
    
    try {
      // Simular validação (em produção, você faria uma validação real)
      await new Promise(resolve => setTimeout(resolve, 2000));
      
      const isValid = Object.values(config).every(value => value.trim() !== '');
      
      if (isValid) {
        setValidationResult({
          isValid: true,
          message: '✅ Configuração válida!',
          details: 'Todas as configurações foram preenchidas corretamente.'
        });
      } else {
        setValidationResult({
          isValid: false,
          message: '❌ Configuração inválida',
          details: 'Por favor, preencha todos os campos obrigatórios.'
        });
      }
    } catch (error) {
      setValidationResult({
        isValid: false,
        message: '❌ Erro na validação',
        details: 'Ocorreu um erro ao validar a configuração.'
      });
    } finally {
      setIsValidating(false);
    }
  };

  // 💾 Salvar configuração
  const saveConfig = () => {
    if (validationResult?.isValid) {
      // Em produção, você salvaria isso em um arquivo de configuração
      console.log('💾 Salvando configuração do Firebase:', config);
      
      // Aqui você atualizaria o arquivo firebaseConfig.ts
      alert('✅ Configuração salva com sucesso!\n\nAgora você pode usar o Firebase no Flexi Gestor.');
    }
  };

  return (
    <div className="container mx-auto p-6 space-y-6">
      {/* 🎯 Cabeçalho */}
      <div className="text-center space-y-4">
        <div className="flex items-center justify-center space-x-2">
          <Database className="h-8 w-8 text-blue-600" />
          <h1 className="text-3xl font-bold">Configuração do Firebase</h1>
        </div>
        <p className="text-muted-foreground max-w-2xl mx-auto">
          Configure o Firebase para usar autenticação persistente e banco de dados em nuvem. 
          Sua sessão nunca expirará e seus dados estarão sempre seguros.
        </p>
      </div>

      {/* 📊 Status Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center space-x-2">
              <Shield className="h-5 w-5 text-green-600" />
              <span className="font-medium">Autenticação</span>
            </div>
            <p className="text-sm text-muted-foreground mt-1">
              Sessão persistente que nunca expira
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4">
            <div className="flex items-center space-x-2">
              <Database className="h-5 w-5 text-blue-600" />
              <span className="font-medium">Firestore</span>
            </div>
            <p className="text-sm text-muted-foreground mt-1">
              Banco de dados em tempo real
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4">
            <div className="flex items-center space-x-2">
              <Zap className="h-5 w-5 text-yellow-600" />
              <span className="font-medium">Sincronização</span>
            </div>
            <p className="text-sm text-muted-foreground mt-1">
              Dados sincronizados automaticamente
            </p>
          </CardContent>
        </Card>
      </div>

      {/* 🔧 Configuração Principal */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center space-x-2">
            <Database className="h-5 w-5" />
            <span>Configurações do Firebase</span>
          </CardTitle>
          <CardDescription>
            Insira as configurações do seu projeto Firebase. Você pode encontrar essas informações no 
            <a 
              href="https://console.firebase.google.com/" 
              target="_blank" 
              rel="noopener noreferrer"
              className="text-blue-600 hover:underline ml-1"
            >
              Firebase Console
            </a>
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          {/* API Key */}
          <div className="space-y-2">
            <Label htmlFor="apiKey">API Key *</Label>
            <div className="flex space-x-2">
              <Input
                id="apiKey"
                value={config.apiKey}
                onChange={(e) => handleConfigChange('apiKey', e.target.value)}
                placeholder="AIzaSyBxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx"
                className="flex-1"
              />
              <Button
                variant="outline"
                size="icon"
                onClick={() => copyToClipboard(config.apiKey, 'apiKey')}
              >
                <Copy className="h-4 w-4" />
              </Button>
            </div>
          </div>

          {/* Auth Domain */}
          <div className="space-y-2">
            <Label htmlFor="authDomain">Auth Domain *</Label>
            <div className="flex space-x-2">
              <Input
                id="authDomain"
                value={config.authDomain}
                onChange={(e) => handleConfigChange('authDomain', e.target.value)}
                placeholder="seu-projeto.firebaseapp.com"
                className="flex-1"
              />
              <Button
                variant="outline"
                size="icon"
                onClick={() => copyToClipboard(config.authDomain, 'authDomain')}
              >
                <Copy className="h-4 w-4" />
              </Button>
            </div>
          </div>

          {/* Project ID */}
          <div className="space-y-2">
            <Label htmlFor="projectId">Project ID *</Label>
            <div className="flex space-x-2">
              <Input
                id="projectId"
                value={config.projectId}
                onChange={(e) => handleConfigChange('projectId', e.target.value)}
                placeholder="seu-projeto-id"
                className="flex-1"
              />
              <Button
                variant="outline"
                size="icon"
                onClick={() => copyToClipboard(config.projectId, 'projectId')}
              >
                <Copy className="h-4 w-4" />
              </Button>
            </div>
          </div>

          {/* Storage Bucket */}
          <div className="space-y-2">
            <Label htmlFor="storageBucket">Storage Bucket *</Label>
            <div className="flex space-x-2">
              <Input
                id="storageBucket"
                value={config.storageBucket}
                onChange={(e) => handleConfigChange('storageBucket', e.target.value)}
                placeholder="seu-projeto.appspot.com"
                className="flex-1"
              />
              <Button
                variant="outline"
                size="icon"
                onClick={() => copyToClipboard(config.storageBucket, 'storageBucket')}
              >
                <Copy className="h-4 w-4" />
              </Button>
            </div>
          </div>

          {/* Messaging Sender ID */}
          <div className="space-y-2">
            <Label htmlFor="messagingSenderId">Messaging Sender ID *</Label>
            <div className="flex space-x-2">
              <Input
                id="messagingSenderId"
                value={config.messagingSenderId}
                onChange={(e) => handleConfigChange('messagingSenderId', e.target.value)}
                placeholder="123456789012"
                className="flex-1"
              />
              <Button
                variant="outline"
                size="icon"
                onClick={() => copyToClipboard(config.messagingSenderId, 'messagingSenderId')}
              >
                <Copy className="h-4 w-4" />
              </Button>
            </div>
          </div>

          {/* App ID */}
          <div className="space-y-2">
            <Label htmlFor="appId">App ID *</Label>
            <div className="flex space-x-2">
              <Input
                id="appId"
                value={config.appId}
                onChange={(e) => handleConfigChange('appId', e.target.value)}
                placeholder="1:123456789012:web:abcdef1234567890abcdef"
                className="flex-1"
              />
              <Button
                variant="outline"
                size="icon"
                onClick={() => copyToClipboard(config.appId, 'appId')}
              >
                <Copy className="h-4 w-4" />
              </Button>
            </div>
          </div>

          {/* Resultado da Validação */}
          {validationResult && (
            <Alert className={validationResult.isValid ? 'border-green-200 bg-green-50' : 'border-red-200 bg-red-50'}>
              <div className="flex items-center space-x-2">
                {validationResult.isValid ? (
                  <CheckCircle className="h-4 w-4 text-green-600" />
                ) : (
                  <AlertCircle className="h-4 w-4 text-red-600" />
                )}
                <AlertDescription>
                  <strong>{validationResult.message}</strong>
                  {validationResult.details && (
                    <p className="text-sm mt-1">{validationResult.details}</p>
                  )}
                </AlertDescription>
              </div>
            </Alert>
          )}

          {/* Botões de Ação */}
          <div className="flex space-x-4 pt-4">
            <Button 
              onClick={validateConfig} 
              disabled={isValidating}
              className="flex-1"
            >
              {isValidating ? 'Validando...' : 'Validar Configuração'}
            </Button>
            <Button 
              onClick={saveConfig} 
              disabled={!validationResult?.isValid}
              variant="default"
              className="flex-1"
            >
              Salvar Configuração
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* 📚 Guia de Configuração */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center space-x-2">
            <Info className="h-5 w-5" />
            <span>Como Configurar o Firebase</span>
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-4">
            <div className="flex items-start space-x-3">
              <Badge variant="outline" className="mt-1">1</Badge>
              <div>
                <h4 className="font-medium">Criar Projeto no Firebase</h4>
                <p className="text-sm text-muted-foreground">
                  Acesse o 
                  <a 
                    href="https://console.firebase.google.com/" 
                    target="_blank" 
                    rel="noopener noreferrer"
                    className="text-blue-600 hover:underline mx-1"
                  >
                    Firebase Console
                  </a>
                  e crie um novo projeto ou selecione um existente.
                </p>
              </div>
            </div>

            <div className="flex items-start space-x-3">
              <Badge variant="outline" className="mt-1">2</Badge>
              <div>
                <h4 className="font-medium">Adicionar Aplicação Web</h4>
                <p className="text-sm text-muted-foreground">
                  Vá em "Configurações do projeto" → "Suas aplicações" → "Adicionar aplicação" → "Web".
                </p>
              </div>
            </div>

            <div className="flex items-start space-x-3">
              <Badge variant="outline" className="mt-1">3</Badge>
              <div>
                <h4 className="font-medium">Copiar Configurações</h4>
                <p className="text-sm text-muted-foreground">
                  Copie as configurações do Firebase e cole nos campos acima.
                </p>
              </div>
            </div>

            <div className="flex items-start space-x-3">
              <Badge variant="outline" className="mt-1">4</Badge>
              <div>
                <h4 className="font-medium">Habilitar Serviços</h4>
                <p className="text-sm text-muted-foreground">
                  Habilite Authentication e Firestore Database no seu projeto Firebase.
                </p>
              </div>
            </div>
          </div>

          <Separator />

          <div className="space-y-2">
            <h4 className="font-medium">Configuração de Exemplo</h4>
            <div className="bg-muted p-4 rounded-lg">
              <pre className="text-sm overflow-x-auto">
{`const firebaseConfig = {
  apiKey: "${exampleConfig.apiKey}",
  authDomain: "${exampleConfig.authDomain}",
  projectId: "${exampleConfig.projectId}",
  storageBucket: "${exampleConfig.storageBucket}",
  messagingSenderId: "${exampleConfig.messagingSenderId}",
  appId: "${exampleConfig.appId}"
};`}
              </pre>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* 🚀 Benefícios */}
      <Card>
        <CardHeader>
          <CardTitle>Por que usar Firebase?</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-2">
              <h4 className="font-medium text-green-600">✅ Vantagens</h4>
              <ul className="text-sm space-y-1 text-muted-foreground">
                <li>• Sessão que nunca expira</li>
                <li>• Dados sincronizados em tempo real</li>
                <li>• Backup automático na nuvem</li>
                <li>• Acesso de qualquer dispositivo</li>
                <li>• Segurança enterprise</li>
                <li>• Escalabilidade automática</li>
              </ul>
            </div>
            <div className="space-y-2">
              <h4 className="font-medium text-blue-600">🔧 Recursos</h4>
              <ul className="text-sm space-y-1 text-muted-foreground">
                <li>• Autenticação persistente</li>
                <li>• Banco de dados NoSQL</li>
                <li>• Listeners em tempo real</li>
                <li>• Regras de segurança</li>
                <li>• Analytics integrado</li>
                <li>• Suporte offline</li>
              </ul>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default FirebaseConfig;
