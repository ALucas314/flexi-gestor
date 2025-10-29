// 🏢 Contexto de Workspace - Gerencia workspaces próprios e compartilhados

import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { useAuth } from './AuthContext';
import { supabase } from '@/lib/supabase';

interface Workspace {
  id: string;
  nome: string;
  email: string;
  tipo: 'proprio' | 'compartilhado';
  compartilhamentoId?: string;
  permissoes?: string[];
}

interface WorkspaceContextType {
  workspaceAtivo: Workspace | null;
  workspacesDisponiveis: Workspace[];
  trocarWorkspace: (workspaceId: string) => void;
  isLoading: boolean;
}

const WorkspaceContext = createContext<WorkspaceContextType | undefined>(undefined);

export const WorkspaceProvider = ({ children }: { children: ReactNode }) => {
  const { user } = useAuth();
  const [workspaceAtivo, setWorkspaceAtivo] = useState<Workspace | null>(null);
  const [workspacesDisponiveis, setWorkspacesDisponiveis] = useState<Workspace[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  // Carregar workspaces disponíveis
  useEffect(() => {
    if (!user) {
      setIsLoading(false);
      return;
    }

    const carregarWorkspaces = async () => {
      try {
        const workspaces: Workspace[] = [];

        // 1️⃣ MEU workspace
        workspaces.push({
          id: user.id,
          nome: user.name || 'Meus Dados',
          email: user.email,
          tipo: 'proprio'
        });

        // 2️⃣ Workspaces compartilhados COMIGO
        try {
          const { data: compartilhados, error: compartilhadosError } = await supabase
            .from('compartilhamentos')
            .select('id, dono_id, permissoes')
            .eq('usuario_compartilhado_id', user.id)
            .eq('status', 'ativo');

          if (compartilhadosError) {
            console.error('Erro ao carregar compartilhamentos:', compartilhadosError);
          } else if (compartilhados && compartilhados.length > 0) {
            const donosIds = compartilhados.map(c => c.dono_id);
            const { data: donos, error: donosError } = await supabase
              .from('perfis')
              .select('id, email, nome')
              .in('id', donosIds);

            if (donosError) {
              console.error('Erro ao carregar donos:', donosError);
            } else if (donos) {
              compartilhados.forEach((comp: any) => {
                const dono = donos.find((d: any) => d.id === comp.dono_id);
                if (dono) {
                  workspaces.push({
                    id: comp.dono_id,
                    nome: dono.nome || dono.email,
                    email: dono.email,
                    tipo: 'compartilhado',
                    compartilhamentoId: comp.id,
                    permissoes: comp.permissoes || []
                  });
                }
              });
            }
          }
        } catch (error) {
          console.error('Erro ao carregar compartilhamentos:', error);
          // Continuar mesmo com erro
        }

        setWorkspacesDisponiveis(workspaces);

        // Restaurar workspace ativo do localStorage
        const savedId = localStorage.getItem('flexi_workspace_ativo');
        const workspace = workspaces.find(w => w.id === savedId) || workspaces[0];
        
        if (workspace) {
          setWorkspaceAtivo(workspace);
          localStorage.setItem('flexi_workspace_ativo', workspace.id);
        } else {
          console.error('❌ Nenhum workspace disponível');
        }

      } catch (error) {
        console.error('❌ Erro crítico ao carregar workspaces:', error);
        // Garantir que sempre há um workspace padrão
        const defaultWorkspace: Workspace = {
          id: user.id,
          nome: user.name || 'Meus Dados',
          email: user.email,
          tipo: 'proprio'
        };
        setWorkspaceAtivo(defaultWorkspace);
        setWorkspacesDisponiveis([defaultWorkspace]);
        localStorage.setItem('flexi_workspace_ativo', defaultWorkspace.id);
      } finally {
        setIsLoading(false);
      }
    };

    carregarWorkspaces();
  }, [user]);

  // Trocar workspace
  const trocarWorkspace = (workspaceId: string) => {
    localStorage.setItem('flexi_workspace_ativo', workspaceId);
    window.location.reload();
  };

  return (
    <WorkspaceContext.Provider value={{
      workspaceAtivo,
      workspacesDisponiveis,
      trocarWorkspace,
      isLoading
    }}>
      {children}
    </WorkspaceContext.Provider>
  );
};

export const useWorkspace = () => {
  const context = useContext(WorkspaceContext);
  
  if (context === undefined) {
    return {
      workspaceAtivo: null,
      workspacesDisponiveis: [],
      trocarWorkspace: () => {},
      isLoading: true
    };
  }
  
  return context;
};
