// 🏢 Contexto de Workspace - Gerencia workspaces próprios e compartilhados

import React, { createContext, useContext, useState, useEffect, useCallback, ReactNode } from 'react';
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
  recarregarWorkspaces: () => Promise<void>;
  isLoading: boolean;
}

const WorkspaceContext = createContext<WorkspaceContextType | undefined>(undefined);

export const WorkspaceProvider = ({ children }: { children: ReactNode }) => {
  const { user } = useAuth();
  const [workspaceAtivo, setWorkspaceAtivo] = useState<Workspace | null>(null);
  const [workspacesDisponiveis, setWorkspacesDisponiveis] = useState<Workspace[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  // Função para carregar workspaces
  const carregarWorkspaces = useCallback(async () => {
    if (!user) {
      setIsLoading(false);
      return;
    }

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

      // Restaurar workspace ativo do localStorage, mas validar se ainda existe
      const savedId = localStorage.getItem('flexi_workspace_ativo');
      const workspace = workspaces.find(w => w.id === savedId);
      
      // Se o workspace salvo não existe mais (foi removido) ou não foi encontrado,
      // voltar para o próprio workspace (sempre será o primeiro da lista)
      if (!workspace || (workspace.tipo === 'compartilhado' && !workspace.compartilhamentoId)) {
        const meuWorkspace = workspaces[0]; // Sempre será o próprio workspace
        if (meuWorkspace) {
          setWorkspaceAtivo(meuWorkspace);
          localStorage.setItem('flexi_workspace_ativo', meuWorkspace.id);
          console.log('🔄 Workspace inválido detectado, voltando para workspace próprio');
        } else {
          console.error('❌ Nenhum workspace disponível');
        }
      } else {
        setWorkspaceAtivo(workspace);
        localStorage.setItem('flexi_workspace_ativo', workspace.id);
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
  }, [user]);

  // Carregar workspaces na primeira vez
  useEffect(() => {
    carregarWorkspaces();
  }, [carregarWorkspaces]);

  // Atualizar workspaces a cada 30 segundos para verificar novos compartilhamentos
  useEffect(() => {
    if (!user) return;

    const interval = setInterval(() => {
      console.log('🔄 Atualizando workspaces...');
      carregarWorkspaces();
    }, 30000); // 30 segundos

    return () => clearInterval(interval);
  }, [user]); // eslint-disable-line react-hooks/exhaustive-deps

  // Trocar workspace sem reload - versão otimizada
  const trocarWorkspace = useCallback((workspaceId: string) => {
    const workspace = workspacesDisponiveis.find(w => w.id === workspaceId);
    if (workspace) {
      setWorkspaceAtivo(workspace);
      localStorage.setItem('flexi_workspace_ativo', workspaceId);
      
      // Disparar evento customizado para atualizar outros componentes
      // Usar setTimeout para garantir que o evento é disparado após o state update
      setTimeout(() => {
        window.dispatchEvent(new CustomEvent('workspace-changed', { detail: workspace }));
      }, 0);
    }
  }, [workspacesDisponiveis]);

  // Função para recarregar workspaces manualmente
  const recarregarWorkspaces = useCallback(async () => {
    await carregarWorkspaces();
  }, [carregarWorkspaces]);

  // Memoizar o value do provider para evitar re-renders desnecessários
  const value = React.useMemo(() => ({
    workspaceAtivo,
    workspacesDisponiveis,
    trocarWorkspace,
    recarregarWorkspaces,
    isLoading
  }), [workspaceAtivo, workspacesDisponiveis, trocarWorkspace, recarregarWorkspaces, isLoading]);

  return (
    <WorkspaceContext.Provider value={value}>
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
      recarregarWorkspaces: async () => {},
      isLoading: true
    };
  }
  
  return context;
};
