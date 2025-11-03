import React, { useEffect, useMemo, useState, useCallback } from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from '@/components/ui/form';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
// Usando Lucide React
import { 
  Plus,
  Trash2,
  Edit,
  Phone,
  User as User2,
  Truck,
  Search,
  Download
} from 'lucide-react';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { toast } from 'sonner';
import { supabase } from '@/lib/supabase';
import { useWorkspace } from '@/contexts/WorkspaceContext';
import { useAuth } from '@/contexts/AuthContext';

// Helpers de formatação
function formatCPF(value: string): string {
  const digits = (value || '').replace(/\D/g, '').slice(0, 11);
  const part1 = digits.slice(0, 3);
  const part2 = digits.slice(3, 6);
  const part3 = digits.slice(6, 9);
  const part4 = digits.slice(9, 11);
  let out = part1;
  if (part2) out += `.${part2}`;
  if (part3) out += `.${part3}`;
  if (part4) out += `-${part4}`;
  return out;
}

function formatCNPJ(value: string): string {
  const digits = (value || '').replace(/\D/g, '').slice(0, 14);
  const part1 = digits.slice(0, 2);
  const part2 = digits.slice(2, 5);
  const part3 = digits.slice(5, 8);
  const part4 = digits.slice(8, 12);
  const part5 = digits.slice(12, 14);
  let out = part1;
  if (part2) out += `.${part2}`;
  if (part3) out += `.${part3}`;
  if (part4) out += `/${part4}`;
  if (part5) out += `-${part5}`;
  return out;
}

function formatPhoneBR(value: string): string {
  const digits = (value || '').replace(/\D/g, '').slice(0, 11);
  const ddd = digits.slice(0, 2);
  const rest = digits.slice(2);
  if (!ddd) return '';
  // Decide 9 dígitos (celular) ou 8 (fixo) pela quantidade
  if (rest.length > 6) {
    const p1 = rest.length === 9 ? rest.slice(0, 5) : rest.slice(0, 4);
    const p2 = rest.slice(p1.length);
    return `(${ddd}) ${p1}${p2 ? '-' + p2 : ''}`;
  }
  if (rest.length > 0) {
    return `(${ddd}) ${rest}`;
  }
  return `(${ddd})`;
}

// Schema de validação do fornecedor
const supplierSchema = z.object({
  name: z.string().min(1, 'Nome é obrigatório').max(200),
  documentType: z.enum(['cpf', 'cnpj']).optional(),
  cpf: z.string().optional(),
  phone: z.string().optional(),
});

type SupplierFormData = z.infer<typeof supplierSchema>;

interface Supplier {
  id: string;
  codigo?: string;
  name: string;
  cpf?: string | null;
  phone?: string | null;
  created_at?: string;
}

const Fornecedores = () => {
  // toast importado diretamente do sonner
  const { workspaceAtivo } = useWorkspace();
  const { user } = useAuth();

  const [suppliers, setSuppliers] = useState<Supplier[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isAddOpen, setIsAddOpen] = useState(false);
  const [editing, setEditing] = useState<Supplier | null>(null);
  const [isDeleteOpen, setIsDeleteOpen] = useState(false);
  const [supplierToDelete, setSupplierToDelete] = useState<Supplier | null>(null);
  const [searchTerm, setSearchTerm] = useState('');

  const [documentType, setDocumentType] = useState<'cpf' | 'cnpj' | undefined>('cpf');

  const form = useForm<SupplierFormData>({
    resolver: zodResolver(supplierSchema),
    defaultValues: { name: '', documentType: 'cpf', cpf: '', phone: '' }
  });

  // Controlar carregamento inicial com timeout (igual às outras páginas)
  useEffect(() => {
    const timer = setTimeout(() => {
      setIsLoading(false);
    }, 500);
    
    return () => clearTimeout(timer);
  }, []);

  // Filtrar fornecedores baseado no termo de busca (nome e código)
  const filteredSuppliers = useMemo(() => {
    // Se não há termo de busca, retorna todos os fornecedores
    const search = searchTerm?.trim() || '';
    if (search === '') {
      return suppliers;
    }
    
    const term = search.toLowerCase().trim();
    
    if (!suppliers || suppliers.length === 0) {
      return [];
    }
    
    return suppliers.filter((s, index) => {
      if (!s) return false;
      
      // Busca por código (do banco de dados) - case-insensitive para consistência
      if (s.codigo && String(s.codigo).toLowerCase().includes(term)) {
        return true;
      }
      
      // Busca por nome - busca parcial case-insensitive
      if (s.name) {
        const name = String(s.name).toLowerCase().trim();
        if (name.includes(term)) {
          return true;
        }
      }
      
      return false;
    });
  }, [suppliers, searchTerm]);

  // 🔄 Função para recarregar fornecedores (useCallback para evitar re-criar referência)
  const loadSuppliers = useCallback(async () => {
    if (!user?.id || !workspaceAtivo?.id) {
      console.log('⚠️ [Fornecedores] Não carregando: user.id =', user?.id, 'workspaceAtivo.id =', workspaceAtivo?.id);
      return;
    }
    
    try {
      console.log('🔄 [Fornecedores] Carregando fornecedores para workspace:', workspaceAtivo.id);
      
      // Filtrar fornecedores APENAS do workspace ativo
      const { data, error } = await supabase
        .from('fornecedores')
        .select('*')
        .eq('usuario_id', workspaceAtivo.id) // Filtro explícito por workspace
        .order('codigo', { ascending: true });

      if (error) {
        console.error('❌ [Fornecedores] Erro ao buscar fornecedores:', error);
        toast.error('Erro ao carregar fornecedores', { description: error.message });
        throw error;
      }

      console.log('✅ [Fornecedores] Fornecedores encontrados:', data?.length || 0, 'registros');

      // Mapear dados do Supabase para o formato esperado
      const mapped: Supplier[] = (data || []).map((s: any) => ({
        id: s.id,
        codigo: s.codigo,
        name: s.nome ?? s.name,
        cpf: s.cpf,
        phone: s.telefone ?? s.phone,
        created_at: s.criado_em ?? s.created_at,
      }));

      setSuppliers(mapped);
    } catch (error: any) {
      console.error('❌ [Fornecedores] Erro ao carregar fornecedores:', error);
      // NÃO limpar dados em caso de erro - pode ser apenas desconexão temporária
      // Os dados já carregados devem permanecer visíveis
      // setSuppliers([]); // REMOVIDO - mantém dados mesmo com erro de conexão
    }
  }, [user?.id, workspaceAtivo?.id]);

  // 🔄 Escutar mudanças de workspace para recarregar dados
  useEffect(() => {
    const handleWorkspaceChanged = async () => {
      console.log('🔄 Workspace mudou, recarregando dados...');
      await loadSuppliers();
    };

    window.addEventListener('workspace-changed', handleWorkspaceChanged);

    return () => {
      window.removeEventListener('workspace-changed', handleWorkspaceChanged);
    };
  }, [loadSuppliers]);

  // 🔄 Escutar logout para limpar dados (mas NÃO limpar durante desconexões)
  useEffect(() => {
    const handleSignOut = async () => {
      console.log('🚪 [Fornecedores] Logout detectado - limpando dados');
      setSuppliers([]);
    };

    // Listener para eventos de logout do Supabase
    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      async (event, session) => {
        if (event === 'SIGNED_OUT') {
          handleSignOut();
        }
      }
    );

    return () => {
      subscription.unsubscribe();
    };
  }, []);

  // 🔄 Carregar dados do Supabase quando o usuário estiver autenticado OU mudar workspace
  useEffect(() => {
    if (user && workspaceAtivo?.id) {
      // Carregar dados
      const loadData = async () => {
        try {
          setIsLoading(true);
          await loadSuppliers();
        } catch (error) {
          // Erro silencioso - não quebrar a aplicação
          console.error('⚠️ [Fornecedores] Erro ao carregar dados iniciais:', error);
        } finally {
          setIsLoading(false);
        }
      };
      loadData().catch(error => {
        // Catch adicional para garantir que nenhuma promessa não tratada quebre a aplicação
        console.error('⚠️ [Fornecedores] Erro não tratado no loadData:', error);
      });

      let fornecedoresSubscription: any = null;
      let lastSuccessfulConnection = Date.now();

      // Função para reconfigurar subscriptions quando desconectam
      const reconfigureSubscriptions = () => {
        if (fornecedoresSubscription) {
          supabase.removeChannel(fornecedoresSubscription);
        }

        try {
          fornecedoresSubscription = supabase
            .channel(`fornecedores-changes-${workspaceAtivo.id}-${Date.now()}`)
            .on('postgres_changes', 
              { 
                event: '*', 
                schema: 'public', 
                table: 'fornecedores',
                filter: `usuario_id=eq.${workspaceAtivo.id}`
              }, 
              async (payload) => {
                // loadSuppliers já verifica user e workspace internamente
                try {
                  await loadSuppliers();
                } catch (error) {
                  // Erro silencioso - não quebrar a subscription
                  console.error('⚠️ [Fornecedores] Erro ao atualizar via subscription:', error);
                }
              }
            )
            .subscribe((status) => {
              if (status === 'SUBSCRIBED') {
                lastSuccessfulConnection = Date.now();
              }
            });
        } catch (error) {
          // Silencioso
        }
      };

      // Configurar subscriptions inicial
      reconfigureSubscriptions();

      // 🔄 Health check que detecta desconexão e reconecta
      // Verifica a cada 30 segundos se a última conexão foi há mais de 2 minutos
      const healthCheckInterval = setInterval(async () => {
        // loadSuppliers já verifica user e workspace internamente, então não precisa verificar aqui
        const timeSinceLastConnection = Date.now() - lastSuccessfulConnection;
        // Se não houve conexão bem-sucedida nos últimos 2 minutos, tentar reconectar
        if (timeSinceLastConnection > 120000) {
          try {
            // Tentar reconectar silenciosamente, sem recarregar a página
            reconfigureSubscriptions();
            // loadSuppliers retorna early se não há user/workspace, então seguro chamar
            await loadSuppliers();
            lastSuccessfulConnection = Date.now();
          } catch (e) {
            // Erro silencioso - não quebrar o intervalo
            console.error('⚠️ [Fornecedores] Erro no health check:', e);
          }
        }
      }, 30000); // Verifica a cada 30 segundos

      // 🔄 Refresh periódico silencioso dos dados (a cada 60 segundos)
      // loadSuppliers já verifica user e workspace internamente, então seguro chamar
      const refreshInterval = setInterval(async () => {
        try {
          await loadSuppliers();
        } catch (error) {
          // Erro silencioso - não quebrar o intervalo
          console.error('⚠️ [Fornecedores] Erro no refresh periódico:', error);
        }
      }, 60000); // 60 segundos

      // 🧹 Cleanup ao sair
      return () => {
        if (healthCheckInterval) {
          clearInterval(healthCheckInterval);
        }
        if (refreshInterval) {
          clearInterval(refreshInterval);
        }
        if (fornecedoresSubscription) {
          supabase.removeChannel(fornecedoresSubscription);
        }
      };
    } else if (!user || !workspaceAtivo?.id) {
      // Não limpar dados imediatamente - pode ser apenas desconexão temporária
      // Só limpar se realmente não há usuário (logout)
      // Durante desconexão, manter os dados visíveis para o usuário
      console.log('⚠️ [Fornecedores] User ou workspace não disponível - mantendo dados em cache');
      // NÃO limpar: setSuppliers([]);
    }
  }, [user?.id, workspaceAtivo?.id, loadSuppliers]); // Recarregar quando mudar workspace ou usuário

  const onOpenAdd = () => {
    setEditing(null);
    setDocumentType('cpf');
    form.reset({ name: '', documentType: 'cpf', cpf: '', phone: '' });
    setIsAddOpen(true);
  };

  const handleSave = async (data: SupplierFormData) => {
    if (!user?.id) return;
    try {
      if (!editing) {
        // Gerar próximo código disponível
        const maxCodigo = suppliers.length > 0 
          ? Math.max(...suppliers.map(s => parseInt(s.codigo || '0')))
          : 0;
        const nextCodigo = String(maxCodigo + 1);
        
        const { error } = await supabase
          .from('fornecedores')
          .insert({
            codigo: nextCodigo,
            nome: data.name,
            cpf: data.cpf || null,
            telefone: data.phone || null,
            usuario_id: workspaceAtivo.id,
          } as any);
        if (error) throw error;
        toast.success('Fornecedor cadastrado');
      } else {
        const { error } = await supabase
          .from('fornecedores')
          .update({
            nome: data.name,
            cpf: data.cpf || null,
            telefone: data.phone || null,
          })
          .eq('id', editing.id)
          .eq('usuario_id', workspaceAtivo.id); // Garantir que só atualiza do workspace correto
        if (error) throw error;
        toast.success('Fornecedor atualizado');
      }
      setIsAddOpen(false);
      await loadSuppliers();
    } catch (error: any) {
      toast.error('Erro ao salvar', { description: error.message });
    }
  };

  const handleEdit = (s: Supplier) => {
    setEditing(s);
    // Detectar tipo de documento baseado no tamanho (CPF tem 14 chars com formatação, CNPJ tem 18)
    const docValue = s.cpf || '';
    const detectedType = docValue.replace(/\D/g, '').length <= 11 ? 'cpf' : 'cnpj';
    setDocumentType(detectedType);
    form.reset({ 
      name: s.name, 
      documentType: detectedType,
      cpf: s.cpf || '', 
      phone: s.phone || '' 
    });
    setIsAddOpen(true);
  };

  const requestDelete = (s: Supplier) => {
    setSupplierToDelete(s);
    setIsDeleteOpen(true);
  };

  const confirmDelete = async () => {
    if (!supplierToDelete || !workspaceAtivo?.id) return;
    try {
      const { error } = await supabase
        .from('fornecedores')
        .delete()
        .eq('id', supplierToDelete.id)
        .eq('usuario_id', workspaceAtivo.id); // Garantir que só deleta do workspace correto
      if (error) throw error;
      toast.success('Fornecedor removido');
      setIsDeleteOpen(false);
      setSupplierToDelete(null);
      await loadSuppliers();
    } catch (error: any) {
      toast.error('Erro ao remover', { description: error.message });
    }
  };

  // Função para exportar fornecedores em CSV
  const exportToCSV = () => {
    // Cabeçalho do CSV
    const headers = ['Código', 'Nome', 'CPF/CNPJ', 'Telefone', 'Data de Cadastro'];
    
    // Dados dos fornecedores (se há termo de busca, usar filtrados, senão usar todos)
    const dataToExport = searchTerm && searchTerm.trim() ? filteredSuppliers : suppliers;
    
    // Função helper para formatar data
    const formatDateForExcel = (dateString?: string) => {
      if (!dateString) return '';
      const date = new Date(dateString);
      const day = String(date.getDate()).padStart(2, '0');
      const month = String(date.getMonth() + 1).padStart(2, '0');
      const year = date.getFullYear();
      return `${day}/${month}/${year}`;
    };
    
    // Dados dos fornecedores
    const data = dataToExport.map(s => [
      s.codigo || '',
      s.name || '',
      s.cpf || '',
      s.phone || '',
      formatDateForExcel(s.created_at)
    ]);
    
    // Adicionar informações do relatório
    data.push([]);
    data.push(['RELATÓRIO DE FORNECEDORES']);
    data.push([]);
    data.push(['Total de Fornecedores', '', '', '', dataToExport.length.toString()]);
    data.push(['Data do Relatório', '', '', '', formatDateForExcel(new Date().toISOString())]);
    
    // Criar CSV
    const csvContent = [
      headers.join(';'),
      ...data.map(row => row.map(field => {
        // Envolver campos em aspas se contiverem ponto e vírgula ou aspas
        if (typeof field === 'string' && (field.includes(';') || field.includes('"') || field.includes('\n'))) {
          return `"${field.replace(/"/g, '""')}"`;
        }
        return field;
      }).join(';'))
    ].join('\n');
    
    // Adicionar BOM para UTF-8 (suporte a caracteres especiais)
    const BOM = '\uFEFF';
    const blob = new Blob([BOM + csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = window.URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `Fornecedores_${new Date().toISOString().split('T')[0]}.csv`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    window.URL.revokeObjectURL(url);
    
    toast.success('Arquivo CSV exportado', {
      description: `Arquivo com ${dataToExport.length} fornecedor(es) foi baixado.`
    });
  };

  if (isLoading) {
    return (
      <main className="flex-1 p-3 sm:p-6 space-y-4 sm:space-y-6">
        <div className="flex items-center justify-center min-h-[400px]">
          <div className="text-center">
            <div className="w-16 h-16 bg-gradient-to-br from-purple-500 to-blue-500 rounded-full flex items-center justify-center mx-auto mb-4 animate-pulse">
              <Truck className="w-8 h-8 text-white" />
            </div>
            <h3 className="text-lg font-semibold text-gray-900 mb-2">🚚 Carregando Fornecedores...</h3>
            <p className="text-gray-600">Preparando sua lista de fornecedores</p>
          </div>
        </div>
      </main>
    );
  }

  return (
    <main className="flex-1 p-2 sm:p-6 space-y-3 sm:space-y-6">
      {/* Header */}
      <div className="flex flex-col items-center sm:flex-row sm:items-center sm:justify-between gap-2 sm:gap-4 mt-4 sm:mt-0">
        <div className="text-center sm:text-left w-full sm:w-auto">
          <h1 className="text-3xl font-bold bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent flex items-center gap-2 justify-center sm:justify-start">
            <Truck className="w-8 h-8 text-blue-600" />
            Fornecedores
          </h1>
          <p className="text-xs sm:text-base text-muted-foreground">Gerencie seus fornecedores cadastrados</p>
        </div>
        <div className="w-full sm:w-auto">
          <Button onClick={onOpenAdd} className="w-full sm:w-auto bg-gradient-to-r from-indigo-600 to-indigo-700 hover:from-indigo-700 hover:to-indigo-800 text-white px-6 sm:px-8 py-3 sm:py-4 rounded-xl sm:rounded-2xl shadow-xl hover:shadow-2xl transition-all duration-200 transform hover:scale-105">
            <Plus className="h-4 w-4 sm:h-5 sm:w-5 mr-2" /> Novo Fornecedor
          </Button>
        </div>
      </div>

      {/* Campo de Busca */}
      <Card className="shadow-lg">
        <CardContent className="p-4">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-slate-500 w-5 h-5" />
            <Input
              type="text"
              placeholder="Buscar por código ou nome..."
              value={searchTerm || ''}
              onChange={(e) => {
                setSearchTerm(e.target.value);
              }}
              className="pl-10 bg-white border-slate-300"
            />
          </div>
        </CardContent>
      </Card>

      {/* Tabela */}
      <Card className="shadow-lg">
        <CardHeader className="bg-gradient-to-r from-indigo-50 to-purple-50">
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2">
            <div>
              <CardTitle>Lista de Fornecedores</CardTitle>
              <CardDescription>Gerencie seus fornecedores cadastrados</CardDescription>
            </div>
            <Button
              onClick={exportToCSV}
              variant="outline"
              className="w-full sm:w-auto bg-white hover:bg-gray-50 border-gray-300 text-gray-700 px-4 py-2 rounded-lg shadow-sm hover:shadow-md transition-all duration-200"
            >
              <Download className="w-4 h-4 mr-2" />
              Exportar CSV
            </Button>
          </div>
        </CardHeader>
        <CardContent className="p-0">
          <div className="overflow-x-auto">
            <Table>
              <TableHeader className="bg-neutral-50">
                <TableRow className="border-neutral-200">
                  <TableHead className="px-4 py-3">Código</TableHead>
                  <TableHead className="px-4 py-3">Nome</TableHead>
                  <TableHead className="px-4 py-3">CPF/CNPJ</TableHead>
                  <TableHead className="px-4 py-3">Telefone</TableHead>
                  <TableHead className="px-4 py-3 text-right">Ações</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredSuppliers.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={5} className="text-center py-10 text-neutral-500">
                      {suppliers.length === 0 ? 'Nenhum fornecedor cadastrado' : 'Nenhum fornecedor encontrado'}
                    </TableCell>
                  </TableRow>
                ) : (
                  filteredSuppliers.map((s, index) => (
                    <TableRow key={s.id} className="border-neutral-100 hover:bg-neutral-50 transition-colors duration-150">
                      <TableCell className="px-4 py-3 font-medium">{s.codigo || index + 1}</TableCell>
                      <TableCell className="px-4 py-3">{s.name}</TableCell>
                      <TableCell className="px-4 py-3">{s.cpf || '—'}</TableCell>
                      <TableCell className="px-4 py-3">{s.phone || '—'}</TableCell>
                      <TableCell className="px-4 py-3 text-right space-x-2">
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => handleEdit(s)}
                          className="inline-flex items-center justify-center gap-2 whitespace-nowrap text-sm font-medium ring-offset-background transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:pointer-events-none disabled:opacity-50 [&_svg]:pointer-events-none [&_svg]:size-4 [&_svg]:shrink-0 hover:bg-accent hover:text-accent-foreground rounded-md h-8 w-8 sm:h-9 sm:w-9 p-0"
                          title="Editar"
                        >
                          <Edit className="w-4 h-4" />
                        </Button>
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => requestDelete(s)}
                          className="inline-flex items-center justify-center gap-2 whitespace-nowrap text-sm font-medium ring-offset-background transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:pointer-events-none disabled:opacity-50 [&_svg]:pointer-events-none [&_svg]:size-4 [&_svg]:shrink-0 hover:bg-red-50 hover:text-red-700 rounded-md h-8 w-8 sm:h-9 sm:w-9 p-0 text-red-600"
                          title="Excluir"
                        >
                          <Trash2 className="w-4 h-4" />
                        </Button>
                      </TableCell>
                    </TableRow>
                  ))
                )}
              </TableBody>
            </Table>
          </div>
        </CardContent>
      </Card>

      {/* Modal Add/Edit */}
      <Dialog open={isAddOpen} onOpenChange={setIsAddOpen}>
        <DialogContent className="max-w-md sm:max-w-lg rounded-2xl">
          <DialogHeader>
            <DialogTitle>{editing ? 'Editar Fornecedor' : 'Novo Fornecedor'}</DialogTitle>
            <DialogDescription>Preencha os dados do fornecedor</DialogDescription>
          </DialogHeader>
          <Form {...form}>
            <form onSubmit={form.handleSubmit(handleSave)} className="space-y-4">
              <FormField
                control={form.control}
                name="name"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Nome do Fornecedor</FormLabel>
                    <FormControl>
                      <div className="relative">
                        <User2 className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-neutral-400" />
                        <Input placeholder="Ex: Paulo da Silva" {...field} className="pl-9" />
                      </div>
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={form.control}
                name="documentType"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Tipo de Documento</FormLabel>
                    <Select 
                      onValueChange={(value) => {
                        field.onChange(value);
                        setDocumentType(value as 'cpf' | 'cnpj');
                        form.setValue('cpf', ''); // Limpar campo ao trocar tipo
                      }} 
                      value={field.value || 'cpf'}
                    >
                      <FormControl>
                        <SelectTrigger>
                          <SelectValue placeholder="Selecione o tipo" />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        <SelectItem value="cpf">CPF</SelectItem>
                        <SelectItem value="cnpj">CNPJ</SelectItem>
                      </SelectContent>
                    </Select>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={form.control}
                name="cpf"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>{documentType === 'cnpj' ? 'CNPJ' : 'CPF'}</FormLabel>
                    <FormControl>
                      <Input
                        placeholder={documentType === 'cnpj' ? '00.000.000/0000-00' : '000.000.000-00'}
                        value={field.value || ''}
                        onChange={(e) => {
                          const formatted = documentType === 'cnpj' 
                            ? formatCNPJ(e.target.value) 
                            : formatCPF(e.target.value);
                          field.onChange(formatted);
                        }}
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={form.control}
                name="phone"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Telefone</FormLabel>
                    <FormControl>
                      <div className="relative">
                        <Phone className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-neutral-400" />
                        <Input
                          placeholder="(00) 00000-0000"
                          value={field.value || ''}
                          onChange={(e) => field.onChange(formatPhoneBR(e.target.value))}
                          className="pl-9"
                        />
                      </div>
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <DialogFooter>
                <Button type="button" variant="outline" onClick={() => setIsAddOpen(false)}>Cancelar</Button>
                <Button type="submit" className="bg-gradient-to-r from-indigo-600 to-indigo-700 hover:from-indigo-700 hover:to-indigo-800 text-white px-6 sm:px-8 py-3 sm:py-4 rounded-xl sm:rounded-2xl shadow-xl hover:shadow-2xl transition-all duration-200 transform hover:scale-105">
                  Salvar
                </Button>
              </DialogFooter>
            </form>
          </Form>
        </DialogContent>
      </Dialog>

      {/* Modal Confirmar Exclusão */}
      <Dialog open={isDeleteOpen} onOpenChange={setIsDeleteOpen}>
        <DialogContent className="max-w-sm">
          <DialogHeader>
            <DialogTitle>Confirmar exclusão</DialogTitle>
            <DialogDescription>
              Deseja excluir o fornecedor {supplierToDelete?.name}? Esta ação não pode ser desfeita.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button variant="outline" onClick={() => setIsDeleteOpen(false)}>Cancelar</Button>
            <Button
              variant="destructive"
              onClick={confirmDelete}
              className="inline-flex items-center justify-center gap-2 whitespace-nowrap rounded-md text-sm font-medium ring-offset-background transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-red-600 focus-visible:ring-offset-2 disabled:pointer-events-none disabled:opacity-50 [&_svg]:pointer-events-none [&_svg]:size-4 [&_svg]:shrink-0 bg-red-600 hover:bg-red-700 text-white h-10 px-4 py-2"
            >
              Excluir
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </main>
  );
};

export default Fornecedores;



