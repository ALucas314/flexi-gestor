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

  if (isLoading || !workspaceAtivo) {
    return null;
  }

  // Se só tem um workspace (o próprio), não mostrar seletor
  if (workspacesDisponiveis.length <= 1) {
    return null;
  }

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
            onClick={() => {
              if (workspace.id !== workspaceAtivo.id) {
                trocarWorkspace(workspace.id);
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

