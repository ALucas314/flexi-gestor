import React, { useState } from "react";
import { useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

const LoginSimple = () => {
  const navigate = useNavigate();
  const [loginData, setLoginData] = useState({
    email: "",
    password: ""
  });

  const handleLogin = (e: React.FormEvent) => {
    e.preventDefault();
    
    // Login simples - sempre funciona
    console.log("Login realizado:", loginData.email);
    
    // Redirecionar para a página principal
    navigate("/");
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-indigo-50 to-purple-50 flex items-center justify-center p-4">
      <Card className="w-full max-w-md">
        <CardHeader className="text-center">
          <CardTitle className="text-2xl font-bold text-gray-900">
            🎯 Flexi Gestor
          </CardTitle>
          <p className="text-gray-600">Faça login para continuar</p>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleLogin} className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Email
              </label>
              <Input
                type="email"
                placeholder="seu@email.com"
                value={loginData.email}
                onChange={(e) => setLoginData({ ...loginData, email: e.target.value })}
                required
              />
            </div>
            
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Senha
              </label>
              <Input
                type="password"
                placeholder="Sua senha"
                value={loginData.password}
                onChange={(e) => setLoginData({ ...loginData, password: e.target.value })}
                required
              />
            </div>
            
            <Button type="submit" className="w-full">
              Entrar
            </Button>
          </form>
          
          <div className="mt-4 text-center text-sm text-gray-600">
            <p>Usuários de teste:</p>
            <p>admin@test.com / admin123</p>
            <p>user@test.com / user123</p>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default LoginSimple;
