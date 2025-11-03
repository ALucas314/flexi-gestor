import React, { useState } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger } from "@/components/ui/alert-dialog";
// Usando Lucide React
import { 
  Settings,
  DollarSign,
  Trash2,
  AlertTriangle,
  CheckCircle
} from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { useResponsive } from "@/hooks/use-responsive";
import { supabase } from "@/lib/supabase";
import { useWorkspace } from "@/contexts/WorkspaceContext";
import { useConfig } from "@/contexts/ConfigContext";
import { useData } from "@/contexts/DataContext";

const Configuracoes = () => {
  const { toast } = useToast();
  const { isMobile } = useResponsive();
  const { workspaceAtivo } = useWorkspace();
  const { moeda, setMoeda } = useConfig();
  const { refreshData } = useData();
  
  // Estados
  const [isDeletando, setIsDeletando] = useState(false);

  // Salvando configurações
  const handleMoedaChange = (value: string) => {
    setMoeda(value);
    toast({
      title: "✅ Moeda alterada",
      description: `A moeda foi alterada para ${getMoedaNome(value)}. Os valores serão convertidos automaticamente.`,
    });
  };

  // Função para limpar todos os dados do workspace
  // NOTA: A tabela 'perfis' NÃO será deletada - ela contém informações essenciais do usuário
  const handleLimparWorkspace = async () => {
    if (!workspaceAtivo) {
      toast({
        title: "❌ Erro",
        description: "Nenhum workspace ativo encontrado",
        variant: "destructive",
      });
      return;
    }

    setIsDeletando(true);
    
    try {
      // IMPORTANTE: A tabela 'perfis' NÃO é deletada aqui
      // Ela contém informações essenciais do usuário e deve ser preservada
      // Deletar todas as movimentações
      const { error: movError } = await supabase
        .from('movimentacoes')
        .delete()
        .eq('usuario_id', workspaceAtivo.id);

      if (movError) throw movError;

      // Deletar todos os lotes
      const { error: lotesError } = await supabase
        .from('lotes')
        .delete()
        .eq('usuario_id', workspaceAtivo.id);

      if (lotesError) throw lotesError;

      // Deletar todos os produtos
      const { error: produtosError } = await supabase
        .from('produtos')
        .delete()
        .eq('usuario_id', workspaceAtivo.id);

      if (produtosError) throw produtosError;

      // Deletar todos os fornecedores
      const { error: fornecedoresError } = await supabase
        .from('fornecedores')
        .delete()
        .eq('usuario_id', workspaceAtivo.id);

      if (fornecedoresError) {
        console.error('Erro ao deletar fornecedores:', fornecedoresError);
        // Se a coluna usuario_id não existir, tentar deletar todos os fornecedores do usuário atual
        if (fornecedoresError.message?.includes('does not exist')) {
          console.warn('Coluna usuario_id não existe na tabela fornecedores. Tentando deletar sem filtro...');
          // Tenta deletar sem filtro de usuario_id (apenas se o RLS permitir)
          const { error: fornecedoresError2 } = await supabase
            .from('fornecedores')
            .delete();
          if (fornecedoresError2) {
            throw fornecedoresError2;
          }
        } else {
          throw fornecedoresError;
        }
      }

      // Deletar todos os clientes
      const { error: clientesError } = await supabase
        .from('clientes')
        .delete()
        .eq('usuario_id', workspaceAtivo.id);

      if (clientesError) throw clientesError;

      // Deletar todas as categorias
      const { error: categoriasError } = await supabase
        .from('categorias')
        .delete()
        .eq('usuario_id', workspaceAtivo.id);

      if (categoriasError) {
        console.error('Erro ao deletar categorias:', categoriasError);
        // Não lançar erro se a tabela não existir ainda
        if (!categoriasError.message?.includes('does not exist')) {
          throw categoriasError;
        }
      }

      // Deletar todas as unidades de medida
      const { error: unidadesError } = await supabase
        .from('unidades_medida')
        .delete()
        .eq('usuario_id', workspaceAtivo.id);

      if (unidadesError) {
        console.error('Erro ao deletar unidades de medida:', unidadesError);
        // Não lançar erro se a tabela não existir ainda
        if (!unidadesError.message?.includes('does not exist')) {
          throw unidadesError;
        }
      }

      // Limpar localStorage do workspace e dados em cache PRIMEIRO (para atualização imediata na UI)
      localStorage.removeItem(`flexi-gestor-workspace-${workspaceAtivo.id}`);
      localStorage.removeItem(`flexi-products-${workspaceAtivo.id}`);
      localStorage.removeItem(`flexi-movements-${workspaceAtivo.id}`);

      // Aguardar um pequeno delay para permitir que o Supabase processe todas as deleções
      // e as subscriptions do real-time processem os eventos de DELETE
      await new Promise(resolve => setTimeout(resolve, 500));

      // Atualizar dados em tempo real após limpar
      await refreshData();

      // Aguardar mais um pouco para garantir que o refresh foi processado
      await new Promise(resolve => setTimeout(resolve, 300));

      // Disparar evento customizado para forçar atualização em toda a aplicação
      window.dispatchEvent(new CustomEvent('force-reload-data'));

      toast({
        title: "✅ Workspace limpo",
        description: "Todos os dados do workspace foram deletados com sucesso! (Perfil preservado)",
      });
    } catch (error: any) {
      toast({
        title: "❌ Erro ao limpar",
        description: error.message || "Ocorreu um erro ao limpar o workspace",
        variant: "destructive",
      });
    } finally {
      setIsDeletando(false);
    }
  };

  const getMoedaNome = (codigo: string) => {
    const moedas: Record<string, { nome: string; simbolo: string }> = {
      'BRL': { nome: 'Real Brasileiro', simbolo: 'R$' },
      'USD': { nome: 'Dólar Americano', simbolo: '$' },
      'EUR': { nome: 'Euro', simbolo: '€' },
    };
    return moedas[codigo]?.nome || codigo;
  };

  const getMoedaSimbolo = (codigo: string) => {
    const moedas: Record<string, { nome: string; simbolo: string }> = {
      'BRL': { nome: 'Real Brasileiro', simbolo: 'R$' },
      'USD': { nome: 'Dólar Americano', simbolo: '$' },
      'EUR': { nome: 'Euro', simbolo: '€' },
    };
    return moedas[codigo]?.simbolo || codigo;
  };

  return (
    <main className={`flex-1 ${isMobile ? 'p-3' : 'p-6'} space-y-6 bg-gradient-to-br from-slate-50 via-blue-50 to-indigo-50 min-h-screen`}>
      {/* Header */}
      <div>
        <h1 className={`${isMobile ? 'text-2xl' : 'text-3xl'} font-black text-slate-800 flex items-center gap-3`}>
          <div className={`${isMobile ? 'w-8 h-8' : 'w-10 h-10'} bg-gradient-to-br from-blue-600 to-purple-600 rounded-xl flex items-center justify-center`}>
            <Settings className={`${isMobile ? 'w-4 h-4' : 'w-5 h-5'} text-white`} />
          </div>
          Configurações
        </h1>
        <p className={`${isMobile ? 'text-sm' : 'text-base'} text-slate-600 mt-2`}>
          Gerencie as configurações do sistema, moeda e armazenamento
        </p>
      </div>

      {/* Tabs */}
      <Tabs defaultValue="moeda" className="space-y-6">
        <TabsList className={`${isMobile ? 'w-full grid grid-cols-2' : ''}`}>
          <TabsTrigger value="moeda" className="flex items-center gap-2">
            <DollarSign className="w-4 h-4" />
            {!isMobile && 'Moeda'}
          </TabsTrigger>
          <TabsTrigger value="armazenamento" className="flex items-center gap-2">
            <Trash2 className="w-4 h-4" />
            {!isMobile && 'Armazenamento'}
          </TabsTrigger>
        </TabsList>

        {/* Tab: Moeda */}
        <TabsContent value="moeda" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <DollarSign className="w-5 h-5 text-emerald-600" />
                Moeda
              </CardTitle>
              <CardDescription>
                Escolha a moeda para exibição de valores
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="moeda">Selecione a moeda</Label>
                <Select value={moeda} onValueChange={handleMoedaChange}>
                  <SelectTrigger id="moeda">
                    <SelectValue placeholder="Selecione uma moeda" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="BRL">
                      🇧🇷 Real Brasileiro (R$)
                    </SelectItem>
                    <SelectItem value="USD">
                      🇺🇸 Dólar Americano ($)
                    </SelectItem>
                    <SelectItem value="EUR">
                      🇪🇺 Euro (€)
                    </SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="p-4 bg-emerald-50 border border-emerald-200 rounded-lg">
                <div className="flex items-start gap-3">
                  <DollarSign className="w-5 h-5 text-emerald-600 flex-shrink-0 mt-0.5" />
                  <div>
                    <p className="text-sm font-semibold text-emerald-900 mb-1">
                      Moeda atual: {getMoedaNome(moeda)}
                    </p>
                    <p className="text-sm text-emerald-700">
                      Símbolo: <strong>{getMoedaSimbolo(moeda)}</strong>
                    </p>
                  </div>
                </div>
              </div>
              <div className="p-4 bg-blue-50 border border-blue-200 rounded-lg">
                <p className="text-sm text-blue-800">
                  💡 <strong>Importante:</strong> Os valores existentes não serão convertidos automaticamente. Apenas novos valores serão exibidos na moeda selecionada.
                </p>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Tab: Armazenamento */}
        <TabsContent value="armazenamento" className="space-y-4">
          <Card className="border-red-200">
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-red-700">
                <Trash2 className="w-5 h-5" />
                Limpar Armazenamento
              </CardTitle>
              <CardDescription>
                Zera todos os dados do workspace atual
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="space-y-4">
                <AlertDialog>
                  <AlertDialogTrigger asChild>
                    <Button variant="destructive" size="lg" className="w-full bg-red-600 hover:bg-red-700 text-white">
                      <Trash2 className="mr-2 h-5 w-5" />
                      Limpar Todos os Dados
                    </Button>
                  </AlertDialogTrigger>
                  <AlertDialogContent>
                    <AlertDialogHeader>
                      <div className="flex items-center gap-3">
                        <div className="w-12 h-12 bg-red-100 rounded-full flex items-center justify-center">
                          <AlertTriangle className="w-6 h-6 text-red-600" />
                        </div>
                        <div>
                          <AlertDialogTitle className="text-left">⚠️ Atenção!</AlertDialogTitle>
                        </div>
                      </div>
                      <AlertDialogDescription className="pt-3 text-left">
                        Esta ação não pode ser desfeita!
                      </AlertDialogDescription>
                    </AlertDialogHeader>
                    <div className="pt-3 text-left space-y-3">
                      <p className="text-slate-700">
                        Você está prestes a deletar permanentemente:
                      </p>
                      <ul className="list-disc list-inside space-y-1 text-slate-700 ml-4">
                        <li>✅ Todos os produtos</li>
                        <li>✅ Todas as movimentações (entradas e saídas)</li>
                        <li>✅ Todos os lotes</li>
                        <li>✅ Todos os fornecedores</li>
                        <li>✅ Todos os clientes</li>
                        <li>✅ Todas as categorias personalizadas</li>
                        <li>✅ Todas as unidades de medida personalizadas</li>
                        <li>✅ Todos os dados do workspace "{workspaceAtivo?.nome || 'Atual'}"</li>
                      </ul>
                      <div className="p-3 bg-red-50 border border-red-200 rounded-lg mt-3">
                        <p className="text-sm text-red-800 font-medium">
                          ⚠️ Os dados serão permanentemente removidos e não poderão ser recuperados!
                        </p>
                      </div>
                    </div>
                    <AlertDialogFooter className="flex-col sm:flex-row gap-2">
                      <AlertDialogCancel>Cancelar</AlertDialogCancel>
                      <AlertDialogAction
                        onClick={handleLimparWorkspace}
                        disabled={isDeletando}
                        className="bg-red-600 hover:bg-red-700 text-white"
                      >
                        {isDeletando ? (
                          <>
                            <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin mr-2" />
                            Limpando...
                          </>
                        ) : (
                          <>
                            <Trash2 className="mr-2 h-4 w-4" />
                            Sim, limpar tudo
                          </>
                        )}
                      </AlertDialogAction>
                    </AlertDialogFooter>
                  </AlertDialogContent>
                </AlertDialog>
              </div>

              <div className="space-y-3">
                <div className="flex items-start gap-3 p-4 bg-amber-50 border border-amber-200 rounded-lg">
                  <AlertTriangle className="w-5 h-5 text-amber-600 flex-shrink-0 mt-0.5" />
                  <div className="space-y-1">
                      <p className="text-sm font-semibold text-amber-900">
                        O que será deletado:
                      </p>
                      <ul className="text-sm text-amber-800 space-y-1 ml-4 list-disc">
                        <li>Todos os produtos</li>
                        <li>Todo histórico de movimentações</li>
                        <li>Todos os lotes e informações de estoque</li>
                        <li>Todos os fornecedores</li>
                        <li>Todos os clientes</li>
                        <li>Todas as categorias personalizadas</li>
                        <li>Todas as unidades de medida personalizadas</li>
                        <li>Todas as configurações do workspace</li>
                      </ul>
                  </div>
                </div>

                <div className="flex items-start gap-3 p-4 bg-blue-50 border border-blue-200 rounded-lg">
                  <CheckCircle className="w-5 h-5 text-blue-600 flex-shrink-0 mt-0.5" />
                  <div className="space-y-1">
                    <p className="text-sm font-semibold text-blue-900">
                      O que será mantido:
                    </p>
                    <ul className="text-sm text-blue-800 space-y-1 ml-4 list-disc">
                      <li>Seu perfil de usuário</li>
                      <li>Outros workspaces que você tem acesso</li>
                      <li>Configurações de idioma e moeda</li>
                      <li>Histórico de login</li>
                    </ul>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </main>
  );
};

export default Configuracoes;

