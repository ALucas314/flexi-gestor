// 🤝 Página de Compartilhamento de Acesso
// Permite compartilhar dados com outros usuários

import React, { useState, useEffect } from 'react';
import { Users, UserPlus, Trash2, Mail, Clock, CheckCircle, XCircle, Loader2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Badge } from '@/components/ui/badge';
import { useAuth } from '@/contexts/AuthContext';
import { supabase } from '@/lib/supabase';
import { toast } from 'sonner';

interface Compartilhamento {
  id: string;
  dono_id: string;
  usuario_compartilhado_id: string;
  status: string;
  criado_em: string;
  usuario: {
    id: string;
    email: string;
    nome: string;
  };
}

const Compartilhar = () => {
  const { user } = useAuth();
  const [emailCompartilhar, setEmailCompartilhar] = useState('');
  const [compartilhamentos, setCompartilhamentos] = useState<Compartilhamento[]>([]);
  const [compartilhadosComigo, setCompartilhadosComigo] = useState<Compartilhamento[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [isAdding, setIsAdding] = useState(false);

  // Carregar compartilhamentos
  useEffect(() => {
    if (user) {
      carregarCompartilhamentos();
    }
  }, [user]);

  const carregarCompartilhamentos = async () => {
    if (!user) return;

    console.log('🔍 [Compartilhar] Carregando compartilhamentos...');
    setIsLoading(true);
    try {
      // Compartilhamentos que EU criei (pessoas com acesso aos MEUS dados)
      const { data: meusCompartilhamentos, error: error1 } = await supabase
        .from('compartilhamentos')
        .select('*')
        .eq('dono_id', user.id)
        .eq('status', 'ativo')
        .order('criado_em', { ascending: false });

      console.log('🔍 [Compartilhar] Meus compartilhamentos:', { meusCompartilhamentos, error1 });

      if (error1) {
        console.error('❌ [Compartilhar] Erro ao carregar:', error1);
        
        // Verificar se é erro de tabela não existir
        if (error1.code === '42P01') {
          toast.error('⚠️ Tabela "compartilhamentos" não existe! Execute o SQL primeiro.');
        } else {
          toast.error(`Erro: ${error1.message}`);
        }
        
        setIsLoading(false);
        return;
      }

      // Buscar dados dos usuários compartilhados
      let compartilhamentosComUsuarios: Compartilhamento[] = [];
      if (meusCompartilhamentos && meusCompartilhamentos.length > 0) {
        const usuariosIds = meusCompartilhamentos.map((c: any) => c.usuario_compartilhado_id);
        const { data: usuarios } = await supabase
          .from('perfis')
          .select('id, email, nome')
          .in('id', usuariosIds);

        compartilhamentosComUsuarios = meusCompartilhamentos.map((comp: any) => {
          const usuario = usuarios?.find((u: any) => u.id === comp.usuario_compartilhado_id);
          return {
            ...comp,
            usuario: usuario || { id: comp.usuario_compartilhado_id, email: 'Usuário não encontrado', nome: '' }
          };
        });
      }

      // Compartilhamentos que outros criaram COMIGO (dados que eu posso acessar)
      const { data: compartilhadosComigo, error: error2 } = await supabase
        .from('compartilhamentos')
        .select('*')
        .eq('usuario_compartilhado_id', user.id)
        .eq('status', 'ativo')
        .order('criado_em', { ascending: false });

      if (error2) {
        console.error('Erro ao carregar compartilhados comigo:', error2);
        throw error2;
      }

      // Buscar dados dos donos
      let compartilhadosComUsuarios: Compartilhamento[] = [];
      if (compartilhadosComigo && compartilhadosComigo.length > 0) {
        const donosIds = compartilhadosComigo.map((c: any) => c.dono_id);
        const { data: donos } = await supabase
          .from('perfis')
          .select('id, email, nome')
          .in('id', donosIds);

        compartilhadosComUsuarios = compartilhadosComigo.map((comp: any) => {
          const dono = donos?.find((u: any) => u.id === comp.dono_id);
          return {
            ...comp,
            usuario: dono || { id: comp.dono_id, email: 'Usuário não encontrado', nome: '' }
          };
        });
      }

      setCompartilhamentos(compartilhamentosComUsuarios);
      setCompartilhadosComigo(compartilhadosComUsuarios);
    } catch (error) {
      console.error('Erro ao carregar compartilhamentos:', error);
      toast.error('Erro ao carregar compartilhamentos');
    } finally {
      setIsLoading(false);
    }
  };

  const adicionarCompartilhamento = async () => {
    console.log('🔍 [Compartilhar] Iniciando...', { user, emailCompartilhar });
    
    if (!user) {
      console.error('❌ [Compartilhar] Usuário não autenticado!');
      toast.error('Você precisa estar logado');
      return;
    }

    if (!emailCompartilhar.trim()) {
      toast.error('Digite um email válido');
      return;
    }

    if (emailCompartilhar === user.email) {
      toast.error('Você não pode compartilhar com você mesmo');
      return;
    }

    setIsAdding(true);
    try {
      console.log('🔍 [Compartilhar] Buscando usuário no banco...');
      
      // Buscar usuário pelo email
      const { data: usuarioData, error: usuarioError } = await supabase
        .from('perfis')
        .select('id, email')
        .eq('email', emailCompartilhar.trim())
        .maybeSingle();

      console.log('🔍 [Compartilhar] Resultado busca:', { usuarioData, usuarioError });

      if (usuarioError) {
        console.error('❌ [Compartilhar] Erro ao buscar usuário:', usuarioError);
        toast.error(`Erro ao buscar usuário: ${usuarioError.message}`);
        setIsAdding(false);
        return;
      }

      if (!usuarioData) {
        console.error('❌ [Compartilhar] Usuário não encontrado no banco');
        toast.error('Usuário não encontrado. Ele precisa estar registrado no sistema.');
        setIsAdding(false);
        return;
      }

      console.log('✅ [Compartilhar] Usuário encontrado:', usuarioData);

      console.log('🔍 [Compartilhar] Verificando se já existe compartilhamento...');
      
      // Verificar se já existe compartilhamento
      const { data: existente, error: checkError } = await supabase
        .from('compartilhamentos')
        .select('id')
        .eq('dono_id', user.id)
        .eq('usuario_compartilhado_id', usuarioData.id)
        .maybeSingle();

      console.log('🔍 [Compartilhar] Resultado verificação:', { existente, checkError });

      if (checkError) {
        console.error('❌ [Compartilhar] Erro ao verificar:', checkError);
        toast.error(`Erro: ${checkError.message}. A tabela 'compartilhamentos' existe?`);
        setIsAdding(false);
        return;
      }

      if (existente) {
        toast.error('Você já compartilhou acesso com este usuário');
        setIsAdding(false);
        return;
      }

      console.log('🔍 [Compartilhar] Criando compartilhamento...');
      
      // Criar compartilhamento
      const { data: insertData, error: insertError } = await supabase
        .from('compartilhamentos')
        .insert([{
          dono_id: user.id,
          usuario_compartilhado_id: usuarioData.id,
          status: 'ativo'
        }])
        .select();

      console.log('🔍 [Compartilhar] Resultado criação:', { insertData, insertError });

      if (insertError) {
        console.error('❌ [Compartilhar] Erro ao criar:', insertError);
        throw insertError;
      }

      console.log('✅ [Compartilhar] Sucesso!');
      toast.success(`Acesso compartilhado com ${emailCompartilhar}`);
      setEmailCompartilhar('');
      carregarCompartilhamentos();
    } catch (error) {
      console.error('Erro ao adicionar compartilhamento:', error);
      toast.error('Erro ao compartilhar acesso');
    } finally {
      setIsAdding(false);
    }
  };

  const removerCompartilhamento = async (compartilhamentoId: string, nomeUsuario: string) => {
    if (!confirm(`Deseja remover o acesso de ${nomeUsuario}?\n\nOs dados permanecerão, mas o usuário não poderá mais visualizar ou editar.`)) {
      return;
    }

    try {
      const { error } = await supabase
        .from('compartilhamentos')
        .update({ status: 'inativo' })
        .eq('id', compartilhamentoId);

      if (error) throw error;

      toast.success('Acesso removido com sucesso');
      carregarCompartilhamentos();
    } catch (error) {
      console.error('Erro ao remover compartilhamento:', error);
      toast.error('Erro ao remover acesso');
    }
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-96">
        <Loader2 className="h-8 w-8 animate-spin text-indigo-600" />
      </div>
    );
  }

  return (
    <div className="container mx-auto p-4 md:p-6 max-w-7xl space-y-6">
      {/* Header */}
      <div className="flex items-center gap-3 mb-6">
        <div className="p-3 bg-gradient-to-br from-indigo-500 to-purple-600 rounded-xl shadow-lg">
          <Users className="h-6 w-6 text-white" />
        </div>
        <div>
          <h1 className="text-2xl md:text-3xl font-bold text-gray-900">
            Compartilhar Acesso
          </h1>
          <p className="text-gray-600 text-sm md:text-base">
            Gerencie quem pode visualizar e editar seus dados
          </p>
        </div>
      </div>

      {/* Card de Adicionar Compartilhamento */}
      <Card className="border-2 border-indigo-100 shadow-lg">
        <CardHeader className="bg-gradient-to-r from-indigo-50 to-purple-50">
          <CardTitle className="flex items-center gap-2">
            <UserPlus className="h-5 w-5 text-indigo-600" />
            Adicionar Acesso
          </CardTitle>
          <CardDescription>
            Digite o email do usuário que terá acesso aos seus dados
          </CardDescription>
        </CardHeader>
        <CardContent className="pt-6 space-y-4">
          <div className="flex flex-col sm:flex-row gap-3">
            <div className="flex-1 relative">
              <Mail className="absolute left-3 top-1/2 -translate-y-1/2 h-5 w-5 text-gray-400" />
              <Input
                type="email"
                placeholder="email@exemplo.com"
                value={emailCompartilhar}
                onChange={(e) => setEmailCompartilhar(e.target.value)}
                onKeyDown={(e) => e.key === 'Enter' && adicionarCompartilhamento()}
                className="pl-10"
                disabled={isAdding}
              />
            </div>
            <Button
              onClick={adicionarCompartilhamento}
              disabled={isAdding || !emailCompartilhar.trim()}
              className="bg-gradient-to-r from-indigo-600 to-indigo-700 hover:from-indigo-700 hover:to-indigo-800 text-white px-6"
            >
              {isAdding ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Adicionando...
                </>
              ) : (
                <>
                  <UserPlus className="mr-2 h-4 w-4" />
                  Compartilhar
                </>
              )}
            </Button>
          </div>

          <Alert className="bg-blue-50 border-blue-200">
            <CheckCircle className="h-4 w-4 text-blue-600" />
            <AlertDescription className="text-sm text-blue-800">
              <strong>Atenção:</strong> O usuário poderá ver e editar todos os seus produtos, movimentos e lotes.
              Você pode remover o acesso a qualquer momento.
            </AlertDescription>
          </Alert>
        </CardContent>
      </Card>

      {/* Lista de Usuários com Acesso aos MEUS Dados */}
      <Card className="shadow-lg">
        <CardHeader className="bg-gradient-to-r from-green-50 to-emerald-50">
          <CardTitle className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Users className="h-5 w-5 text-green-600" />
              Usuários com Acesso aos Meus Dados
            </div>
            <Badge variant="secondary" className="bg-green-100 text-green-700">
              {compartilhamentos.length}
            </Badge>
          </CardTitle>
          <CardDescription>
            Estas pessoas podem visualizar e editar seus dados
          </CardDescription>
        </CardHeader>
        <CardContent className="pt-6">
          {compartilhamentos.length === 0 ? (
            <div className="text-center py-12">
              <Users className="h-16 w-16 text-gray-300 mx-auto mb-4" />
              <p className="text-gray-500 text-lg font-medium">
                Nenhum compartilhamento ativo
              </p>
              <p className="text-gray-400 text-sm mt-2">
                Adicione usuários acima para compartilhar seus dados
              </p>
            </div>
          ) : (
            <div className="space-y-3">
              {compartilhamentos.map((comp) => (
                <div
                  key={comp.id}
                  className="flex items-center justify-between p-4 border rounded-lg hover:bg-gray-50 transition-colors"
                >
                  <div className="flex items-center gap-3 flex-1">
                    <div className="p-2 bg-green-100 rounded-full">
                      <Users className="h-5 w-5 text-green-600" />
                    </div>
                    <div className="flex-1">
                      <p className="font-medium text-gray-900">
                        {comp.usuario.nome || comp.usuario.email}
                      </p>
                      <p className="text-sm text-gray-500 flex items-center gap-2">
                        <Mail className="h-3 w-3" />
                        {comp.usuario.email}
                      </p>
                      <p className="text-xs text-gray-400 flex items-center gap-1 mt-1">
                        <Clock className="h-3 w-3" />
                        Desde {new Date(comp.criado_em).toLocaleDateString('pt-BR')}
                      </p>
                    </div>
                  </div>
                  <Button
                    variant="destructive"
                    size="sm"
                    onClick={() => removerCompartilhamento(comp.id, comp.usuario.nome || comp.usuario.email)}
                  >
                    <Trash2 className="h-4 w-4" />
                  </Button>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>

      {/* Lista de Dados Compartilhados COMIGO */}
      {compartilhadosComigo.length > 0 && (
        <Card className="shadow-lg">
          <CardHeader className="bg-gradient-to-r from-purple-50 to-pink-50">
            <CardTitle className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Users className="h-5 w-5 text-purple-600" />
                Dados Compartilhados Comigo
              </div>
              <Badge variant="secondary" className="bg-purple-100 text-purple-700">
                {compartilhadosComigo.length}
              </Badge>
            </CardTitle>
            <CardDescription>
              Você tem acesso aos dados destes usuários
            </CardDescription>
          </CardHeader>
          <CardContent className="pt-6">
            <div className="space-y-3">
              {compartilhadosComigo.map((comp) => (
                <div
                  key={comp.id}
                  className="flex items-center gap-3 p-4 border rounded-lg bg-purple-50/50"
                >
                  <div className="p-2 bg-purple-100 rounded-full">
                    <Users className="h-5 w-5 text-purple-600" />
                  </div>
                  <div className="flex-1">
                    <p className="font-medium text-gray-900">
                      {comp.usuario.nome || comp.usuario.email}
                    </p>
                    <p className="text-sm text-gray-500 flex items-center gap-2">
                      <Mail className="h-3 w-3" />
                      {comp.usuario.email}
                    </p>
                    <p className="text-xs text-gray-400 flex items-center gap-1 mt-1">
                      <Clock className="h-3 w-3" />
                      Desde {new Date(comp.criado_em).toLocaleDateString('pt-BR')}
                    </p>
                  </div>
                  <Badge className="bg-purple-600 text-white">
                    Acesso Concedido
                  </Badge>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
};

export default Compartilhar;

