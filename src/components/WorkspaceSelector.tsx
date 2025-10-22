// 🏢 Seletor de Workspace - Permite trocar entre seus dados e dados compartilhados

import React from 'react';
import { Building2, Check, ChevronDown } from 'lucide-react';
import { useWorkspace } from '@/contexts/WorkspaceContext';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';

export const WorkspaceSelector = () => {
  const { workspaceAtivo, workspacesDisponiveis, trocarWorkspace, isLoading } = useWorkspace();

  console.log('🏢 [WorkspaceSelector]', {
    isLoading,
    workspaceAtivo,
    workspacesDisponiveis,
    total: workspacesDisponiveis.length
  });

  if (isLoading || !workspaceAtivo) {
    console.log('⏳ [WorkspaceSelector] Aguardando carregar...');
    return null;
  }

  // Se só tem um workspace (o próprio), não mostrar seletor
  if (workspacesDisponiveis.length <= 1) {
    console.log('ℹ️ [WorkspaceSelector] Apenas 1 workspace, não mostrando seletor');
    return null;
  }

  console.log('✅ [WorkspaceSelector] Mostrando seletor com', workspacesDisponiveis.length, 'workspaces');

  // Encontrar workspace compartilhado (para teste)
  const workspaceCompartilhado = workspacesDisponiveis.find(w => w.tipo === 'compartilhado');

  console.log('🔍 [WorkspaceSelector] Workspace compartilhado:', workspaceCompartilhado);
  console.log('🔍 [WorkspaceSelector] Workspace ativo tipo:', workspaceAtivo.tipo);
  console.log('🔍 [WorkspaceSelector] Vai mostrar botão teste?', !!workspaceCompartilhado && workspaceAtivo.tipo === 'proprio');

  // BOTÃO DE TESTE - remover depois
  if (workspaceCompartilhado && workspaceAtivo.tipo === 'proprio') {
    console.log('✅ [WorkspaceSelector] RENDERIZANDO BOTÃO ROXO DE TESTE');
    return (
      <div className="flex gap-2">
        <Button
          onClick={() => {
            console.log('🧪 [TESTE] CLICOU NO BOTÃO ROXO!');
            console.log('🧪 [TESTE] Trocando diretamente para workspace compartilhado:', workspaceCompartilhado);
            trocarWorkspace(workspaceCompartilhado.id);
          }}
          className="bg-purple-600 hover:bg-purple-700 text-white text-xs sm:text-sm px-3 py-2"
        >
          🧪 Testar: Trocar para {workspaceCompartilhado.nome}
        </Button>
      </div>
    );
  }
  
  console.log('⚠️ [WorkspaceSelector] NÃO vai mostrar botão de teste');

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button 
          variant="outline" 
          className="gap-2 border-indigo-200 hover:bg-indigo-50"
        >
          <Building2 className="h-4 w-4 text-indigo-600" />
          <span className="hidden sm:inline font-medium">
            {workspaceAtivo.nome}
          </span>
          {workspaceAtivo.tipo === 'compartilhado' && (
            <Badge variant="secondary" className="ml-1 bg-purple-100 text-purple-700">
              Compartilhado
            </Badge>
          )}
          <ChevronDown className="h-4 w-4 text-gray-500" />
        </Button>
      </DropdownMenuTrigger>
      
      <DropdownMenuContent align="end" className="w-64">
        <DropdownMenuLabel className="text-xs text-gray-500 uppercase">
          Workspaces Disponíveis
        </DropdownMenuLabel>
        <DropdownMenuSeparator />
        
        {workspacesDisponiveis.map((workspace) => (
          <DropdownMenuItem
            key={workspace.id}
            onSelect={(e) => {
              console.log('🖱️ [WorkspaceSelector] Clicou em workspace:', workspace);
              console.log('🖱️ [WorkspaceSelector] Workspace ativo:', workspaceAtivo);
              
              if (workspace.id !== workspaceAtivo.id) {
                console.log('✅ [WorkspaceSelector] Workspace diferente, trocando...');
                e.preventDefault(); // Prevenir fechamento imediato
                trocarWorkspace(workspace.id);
              } else {
                console.log('ℹ️ [WorkspaceSelector] Já está neste workspace');
              }
            }}
            className="cursor-pointer"
          >
            <div className="flex items-center justify-between w-full">
              <div className="flex items-center gap-2">
                <Building2 className={`h-4 w-4 ${
                  workspace.tipo === 'proprio' 
                    ? 'text-indigo-600' 
                    : 'text-purple-600'
                }`} />
                <div>
                  <p className="font-medium text-sm">
                    {workspace.nome}
                  </p>
                  <p className="text-xs text-gray-500">
                    {workspace.email}
                  </p>
                </div>
              </div>
              
              <div className="flex items-center gap-2">
                {workspace.tipo === 'compartilhado' && (
                  <Badge variant="secondary" className="text-xs bg-purple-100 text-purple-700">
                    Compartilhado
                  </Badge>
                )}
                {workspace.id === workspaceAtivo.id && (
                  <Check className="h-4 w-4 text-green-600" />
                )}
              </div>
            </div>
          </DropdownMenuItem>
        ))}
      </DropdownMenuContent>
    </DropdownMenu>
  );
};

