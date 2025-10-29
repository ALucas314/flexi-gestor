// 🏢 Seletor de Workspace - Botão para trocar entre workspaces

import React from 'react';
import { Building2, Users } from 'lucide-react';
import { useWorkspace } from '@/contexts/WorkspaceContext';
import { Button } from '@/components/ui/button';

export const WorkspaceSelector = () => {
  const { workspaceAtivo, workspacesDisponiveis, trocarWorkspace, isLoading } = useWorkspace();

  if (isLoading || !workspaceAtivo || workspacesDisponiveis.length <= 1) {
    return null;
  }

  // Encontrar o OUTRO workspace (não o ativo)
  const outroWorkspace = workspacesDisponiveis.find(w => w.id !== workspaceAtivo.id);
  
  if (!outroWorkspace) {
    return null;
  }

  return (
    <Button
      onClick={() => trocarWorkspace(outroWorkspace.id)}
      className={`px-3 py-2 rounded-lg shadow-lg font-semibold text-xs sm:text-sm flex items-center gap-2 transition-all ${
        outroWorkspace.tipo === 'compartilhado'
          ? 'bg-purple-600 hover:bg-purple-700 text-white'
          : 'bg-indigo-600 hover:bg-indigo-700 text-white'
      }`}
    >
      {outroWorkspace.tipo === 'compartilhado' ? (
        <Users className="h-4 w-4" />
      ) : (
        <Building2 className="h-4 w-4" />
      )}
      <span className="hidden sm:inline">
        {outroWorkspace.tipo === 'compartilhado' 
          ? `Ver: ${outroWorkspace.nome}` 
          : 'Ver Meu Workspace'}
      </span>
      <span className="sm:hidden">
        {outroWorkspace.tipo === 'compartilhado' ? 'Compartilhado' : 'Meu'}
      </span>
    </Button>
  );
};
