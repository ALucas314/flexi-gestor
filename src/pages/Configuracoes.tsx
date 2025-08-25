import React from "react";
import { Settings } from "lucide-react";

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

const Configuracoes = () => {
  return (
    <main className="flex-1 p-6 space-y-6">
      <div>
        <h1 className="text-3xl font-bold">⚙️ Configurações</h1>
        <p className="text-muted-foreground">Configure as opções do sistema Flexi Gestor</p>
      </div>
      
      {/* Configurações Gerais */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Settings className="w-5 h-5" />
            Configurações do Sistema
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-6">
          <div className="text-center py-8">
            <Settings className="w-16 h-16 mx-auto text-gray-400 mb-4" />
            <h3 className="text-lg font-medium text-gray-600 mb-2">
              Configurações em Desenvolvimento
            </h3>
            <p className="text-sm text-gray-500">
              As configurações de tipografia foram removidas conforme solicitado.
              <br />
              Novas funcionalidades de configuração serão adicionadas em breve.
            </p>
          </div>
        </CardContent>
      </Card>

      {/* Informações do Sistema */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            📊 Informações do Sistema
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="p-4 bg-blue-50 rounded-lg">
              <h4 className="font-medium text-blue-800 mb-2">Versão do Sistema</h4>
              <p className="text-blue-600">Flexi Gestor v1.0.0</p>
            </div>
            <div className="p-4 bg-green-50 rounded-lg">
              <h4 className="font-medium text-green-800 mb-2">Status</h4>
              <p className="text-green-600">✅ Sistema Operacional</p>
            </div>
          </div>
        </CardContent>
      </Card>
    </main>
  );
};

export default Configuracoes;
