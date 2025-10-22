// 🏢 Workspace Context - Gerencia qual "ambiente de dados" está ativo
// Permite trocar entre seus dados e dados compartilhados

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
  recarregarWorkspaces: () => Promise<void>;
  isLoading: boolean;
}

const WorkspaceContext = createContext<WorkspaceContextType | undefined>(undefined);

export const WorkspaceProvider = ({ children }: { children: ReactNode }) => {
  const { user } = useAuth();
  const [workspaceAtivo, setWorkspaceAtivo] = useState<Workspace | null>(null);
  const [workspacesDisponiveis, setWorkspacesDisponiveis] = useState<Workspace[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  // Carregar workspaces disponíveis
  const recarregarWorkspaces = async () => {
    console.log('🏢 [WorkspaceContext] Recarregando workspaces...', { user });
    
    if (!user) {
      setWorkspacesDisponiveis([]);
      setWorkspaceAtivo(null);
      setIsLoading(false);
      return;
    }

    try {
      const workspaces: Workspace[] = [];

      // 1️⃣ Adicionar MEU workspace (sempre disponível)
      workspaces.push({
        id: user.id,
        nome: user.name || 'Meus Dados',
        email: user.email,
        tipo: 'proprio'
      });

      console.log('🏢 [WorkspaceContext] Workspace próprio adicionado:', workspaces[0]);

      // 2️⃣ Buscar compartilhamentos ATIVOS que outros fizeram COMIGO
      console.log('🏢 [WorkspaceContext] Buscando compartilhamentos para usuário:', user.id);
      
      const { data: compartilhados, error } = await supabase
        .from('compartilhamentos')
        .select('id, dono_id, status, permissoes')
        .eq('usuario_compartilhado_id', user.id)
        .eq('status', 'ativo');

      console.log('🏢 [WorkspaceContext] Compartilhamentos encontrados:', { compartilhados, error });

      if (error) {
        console.error('❌ [WorkspaceContext] Erro ao carregar compartilhamentos:', error);
      } else if (compartilhados && compartilhados.length > 0) {
        console.log('✅ [WorkspaceContext] Encontrados', compartilhados.length, 'compartilhamentos');
        // Buscar dados dos donos
        const donosIds = compartilhados.map((c: any) => c.dono_id);
        const { data: donos } = await supabase
          .from('perfis')
          .select('id, email, nome')
          .in('id', donosIds);

        // Adicionar workspaces compartilhados
        compartilhados.forEach((comp: any) => {
          const dono = donos?.find((d: any) => d.id === comp.dono_id);
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

      setWorkspacesDisponiveis(workspaces);

      // Se não tem workspace ativo ou o ativo não está mais disponível
      const workspaceAtivoValido = workspaceAtivo && 
        workspaces.some(w => w.id === workspaceAtivo.id);

      if (!workspaceAtivoValido) {
        // Definir MEU workspace como padrão
        const meuWorkspace = workspaces.find(w => w.tipo === 'proprio');
        if (meuWorkspace) {
          setWorkspaceAtivo(meuWorkspace);
          
          // Salvar no localStorage
          localStorage.setItem('flexi_workspace_ativo', meuWorkspace.id);
        }
      }
    } catch (error) {
      console.error('Erro ao carregar workspaces:', error);
    } finally {
      setIsLoading(false);
    }
  };

  // Trocar workspace
  const trocarWorkspace = (workspaceId: string) => {
    console.log('🔄 [WorkspaceContext] Tentando trocar workspace para:', workspaceId);
    console.log('🔄 [WorkspaceContext] Workspaces disponíveis:', workspacesDisponiveis);
    
    const workspace = workspacesDisponiveis.find(w => w.id === workspaceId);
    
    console.log('🔄 [WorkspaceContext] Workspace encontrado:', workspace);
    
    if (workspace) {
      console.log('✅ [WorkspaceContext] Trocando para workspace:', workspace.nome);
      setWorkspaceAtivo(workspace);
      
      // Salvar no localStorage
      localStorage.setItem('flexi_workspace_ativo', workspaceId);
      
      // Verificar se foi salvo
      const verificar = localStorage.getItem('flexi_workspace_ativo');
      console.log('💾 [WorkspaceContext] Verificando localStorage após salvar:', verificar);
      
      // Aguardar um pouco para garantir que o localStorage foi persistido
      console.log('🔄 [WorkspaceContext] Aguardando 100ms antes de recarregar...');
      setTimeout(() => {
        console.log('🔄 [WorkspaceContext] Recarregando página AGORA!');
        window.location.reload();
      }, 100);
    } else {
      console.error('❌ [WorkspaceContext] Workspace não encontrado!');
    }
  };

  // Carregar workspaces ao montar
  useEffect(() => {
    if (user) {
      recarregarWorkspaces();
    }
  }, [user]);

  // Restaurar workspace do localStorage
  useEffect(() => {
    const savedWorkspaceId = localStorage.getItem('flexi_workspace_ativo');
    console.log('💾 [WorkspaceContext] localStorage workspace_ativo:', savedWorkspaceId);
    console.log('💾 [WorkspaceContext] Workspaces disponíveis:', workspacesDisponiveis.length);
    
    if (savedWorkspaceId && workspacesDisponiveis.length > 0) {
      const workspace = workspacesDisponiveis.find(w => w.id === savedWorkspaceId);
      console.log('💾 [WorkspaceContext] Workspace encontrado no localStorage:', workspace);
      
      if (workspace) {
        console.log('✅ [WorkspaceContext] Restaurando workspace:', workspace.nome);
        setWorkspaceAtivo(workspace);
      } else {
        console.log('⚠️ [WorkspaceContext] Workspace salvo não encontrado na lista');
      }
    } else {
      console.log('ℹ️ [WorkspaceContext] Sem workspace salvo ou lista vazia');
    }
  }, [workspacesDisponiveis]);

  return (
    <WorkspaceContext.Provider 
      value={{
        workspaceAtivo,
        workspacesDisponiveis,
        trocarWorkspace,
        recarregarWorkspaces,
        isLoading
      }}
    >
      {children}
    </WorkspaceContext.Provider>
  );
};

export const useWorkspace = () => {
  const context = useContext(WorkspaceContext);
  
  // Retornar valores padrão se context não estiver disponível ainda
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

