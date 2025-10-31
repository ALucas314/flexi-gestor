import React, { useEffect, useMemo, useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from '@/components/ui/form';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import { Plus, Trash2, Edit, Phone, User2, UserCircle, Search, Download } from 'lucide-react';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { useToast } from '@/hooks/use-toast';
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

// Schema de validação do cliente
const clientSchema = z.object({
  name: z.string().min(1, 'Nome é obrigatório').max(200),
  documentType: z.enum(['cpf', 'cnpj']).optional(),
  cpf: z.string().optional(),
  phone: z.string().optional(),
});

type ClientFormData = z.infer<typeof clientSchema>;

interface Client {
  id: string;
  codigo?: string;
  name: string;
  cpf?: string | null;
  phone?: string | null;
  created_at?: string;
}

const Clientes = () => {
  const { toast } = useToast();
  const { workspaceAtivo } = useWorkspace();
  const { user } = useAuth();

  const [clients, setClients] = useState<Client[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isAddOpen, setIsAddOpen] = useState(false);
  const [editing, setEditing] = useState<Client | null>(null);
  const [isDeleteOpen, setIsDeleteOpen] = useState(false);
  const [clientToDelete, setClientToDelete] = useState<Client | null>(null);
  const [searchTerm, setSearchTerm] = useState('');

  const [documentType, setDocumentType] = useState<'cpf' | 'cnpj' | undefined>('cpf');

  const form = useForm<ClientFormData>({
    resolver: zodResolver(clientSchema),
    defaultValues: { name: '', documentType: 'cpf', cpf: '', phone: '' }
  });

  // Filtrar clientes baseado no termo de busca (nome e código)
  const filteredClients = useMemo(() => {
    // Se não há termo de busca, retorna todos os clientes
    const search = searchTerm?.trim() || '';
    if (search === '') {
      return clients;
    }
    
    const term = search.toLowerCase().trim();
    
    if (!clients || clients.length === 0) {
      return [];
    }
    
    return clients.filter((c) => {
      if (!c) return false;
      
      // Busca por código (do banco de dados)
      if (c.codigo && String(c.codigo).includes(search)) {
        return true;
      }
      
      // Busca por nome - busca parcial
      if (c.name) {
        const name = String(c.name).toLowerCase().trim();
        if (name.includes(term)) {
          return true;
        }
      }
      
      return false;
    });
  }, [clients, searchTerm]);

  // Carrega clientes do Supabase
  const loadClients = async () => {
    // Não limpar a lista se não houver workspace - manter dados existentes
    if (!workspaceAtivo?.id) {
      // Apenas retornar sem limpar a lista, mantendo os dados existentes
      return;
    }
    
    try {
      setIsLoading(true);
      const { data, error } = await supabase
        .from('clientes')
        .select('*')
        .eq('usuario_id', workspaceAtivo.id) // Sempre usar workspaceAtivo.id
        .order('codigo', { ascending: true });
      
      if (error) {
        // Tratar erros específicos
        if (error.code === '42501') {
          console.warn('Erro de permissão RLS ao carregar clientes. Verifique as políticas.');
          // Não limpar lista em caso de erro de permissão, manter dados existentes
          setIsLoading(false);
          return;
        }
        if (error.code === '42P01') {
          toast({
            title: 'Tabela não encontrada',
            description: 'A tabela de clientes não existe. Execute o script SQL de criação.',
            variant: 'destructive'
          });
          setIsLoading(false);
          return;
        }
        throw error;
      }
      
      // Mapear dados recebidos
      const mapped: Client[] = (data || []).map((c: any) => ({
        id: c.id,
        codigo: c.codigo,
        name: c.nome ?? c.name,
        cpf: c.cpf,
        phone: c.telefone ?? c.phone,
        created_at: c.criado_em ?? c.created_at,
      }));
      
      // Sempre atualizar com os dados recebidos do banco
      // Se não houver dados, ainda assim atualizar para mostrar lista vazia (não manter dados antigos)
      setClients(mapped);
      console.log(`[CLIENTES] Carregados ${mapped.length} clientes do workspace ${workspaceAtivo.id}`);
    } catch (error: any) {
      console.error('Erro ao carregar clientes:', error);
      // Não limpar a lista em caso de erro - manter dados existentes
      // Apenas mostrar toast se for um erro crítico
      if (error.code !== '42501') {
        toast({
          title: 'Erro ao carregar clientes',
          description: error.message || 'Verifique nomes de colunas: id, nome (ou name), cpf, telefone (ou phone).',
          variant: 'destructive'
        });
      }
      // Não limpar clients[] em caso de erro
    } finally {
      setIsLoading(false);
    }
  };

  // Recarregar quando workspace mudar (mas não limpar se workspace for null temporariamente)
  useEffect(() => {
    if (workspaceAtivo?.id) {
      loadClients();
    } else {
      // Se não houver workspace, não mostrar loading indefinidamente
      setIsLoading(false);
    }
    // Não limpar lista quando workspace mudar para null - manter dados em memória
  }, [workspaceAtivo?.id]);

  // Escutar mudanças de autenticação para recarregar após reconexão
  useEffect(() => {
    const { data: { subscription } } = supabase.auth.onAuthStateChange((event, session) => {
      // Recarregar apenas quando houver sessão ativa e workspace definido
      if ((event === 'SIGNED_IN' || event === 'TOKEN_REFRESHED') && session && workspaceAtivo?.id) {
        // Pequeno delay para garantir que o workspace está disponível
        setTimeout(() => {
          if (workspaceAtivo?.id) {
            loadClients();
          }
        }, 500);
      }
    });

    return () => {
      subscription.unsubscribe();
    };
  }, [workspaceAtivo?.id]);

  const onOpenAdd = () => {
    setEditing(null);
    setDocumentType('cpf');
    form.reset({ name: '', documentType: 'cpf', cpf: '', phone: '' });
    setIsAddOpen(true);
  };

  const handleSave = async (data: ClientFormData) => {
    if (!user?.id) return;
    try {
      if (!editing) {
        // Gerar próximo código disponível
        const maxCodigo = clients.length > 0 
          ? Math.max(...clients.map(c => parseInt(c.codigo || '0')))
          : 0;
        const nextCodigo = String(maxCodigo + 1);
        
        const { error } = await supabase
          .from('clientes')
          .insert({
            codigo: nextCodigo,
            nome: data.name,
            cpf: data.cpf || null,
            telefone: data.phone || null,
            usuario_id: workspaceAtivo.id,
          } as any);
        if (error) throw error;
        toast({ title: '✅ Cliente cadastrado' });
      } else {
        const { error } = await supabase
          .from('clientes')
          .update({
            nome: data.name,
            cpf: data.cpf || null,
            telefone: data.phone || null,
          })
          .eq('id', editing.id)
          .eq('usuario_id', workspaceAtivo.id); // Garantir que só atualiza do workspace correto
        if (error) throw error;
        toast({ title: '🔄 Cliente atualizado' });
      }
      setIsAddOpen(false);
      await loadClients();
    } catch (error: any) {
      toast({ title: 'Erro ao salvar', description: error.message, variant: 'destructive' });
    }
  };

  const handleEdit = (c: Client) => {
    setEditing(c);
    // Detectar tipo de documento baseado no tamanho (CPF tem 14 chars com formatação, CNPJ tem 18)
    const docValue = c.cpf || '';
    const detectedType = docValue.replace(/\D/g, '').length <= 11 ? 'cpf' : 'cnpj';
    setDocumentType(detectedType);
    form.reset({ 
      name: c.name, 
      documentType: detectedType,
      cpf: c.cpf || '', 
      phone: c.phone || '' 
    });
    setIsAddOpen(true);
  };

  const requestDelete = (c: Client) => {
    setClientToDelete(c);
    setIsDeleteOpen(true);
  };

  const confirmDelete = async () => {
    if (!clientToDelete || !workspaceAtivo?.id) return;
    try {
      const { error } = await supabase
        .from('clientes')
        .delete()
        .eq('id', clientToDelete.id)
        .eq('usuario_id', workspaceAtivo.id); // Garantir que só deleta do workspace correto
      if (error) throw error;
      toast({ title: '🗑️ Cliente removido' });
      setIsDeleteOpen(false);
      setClientToDelete(null);
      await loadClients();
    } catch (error: any) {
      toast({ title: 'Erro ao remover', description: error.message, variant: 'destructive' });
    }
  };

  // Função para exportar clientes em CSV
  const exportToCSV = () => {
    // Cabeçalho do CSV
    const headers = ['Código', 'Nome', 'CPF/CNPJ', 'Telefone', 'Data de Cadastro'];
    
    // Dados dos clientes (se há termo de busca, usar filtrados, senão usar todos)
    const dataToExport = searchTerm && searchTerm.trim() ? filteredClients : clients;
    
    // Função helper para formatar data
    const formatDateForExcel = (dateString?: string) => {
      if (!dateString) return '';
      const date = new Date(dateString);
      const day = String(date.getDate()).padStart(2, '0');
      const month = String(date.getMonth() + 1).padStart(2, '0');
      const year = date.getFullYear();
      return `${day}/${month}/${year}`;
    };
    
    // Dados dos clientes
    const data = dataToExport.map(c => [
      c.codigo || '',
      c.name || '',
      c.cpf || '',
      c.phone || '',
      formatDateForExcel(c.created_at)
    ]);
    
    // Adicionar informações do relatório
    data.push([]);
    data.push(['RELATÓRIO DE CLIENTES']);
    data.push([]);
    data.push(['Total de Clientes', '', '', '', dataToExport.length.toString()]);
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
    link.download = `Clientes_${new Date().toISOString().split('T')[0]}.csv`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    window.URL.revokeObjectURL(url);
    
    toast({ 
      title: '✅ Arquivo CSV exportado', 
      description: `Arquivo com ${dataToExport.length} cliente(s) foi baixado.` 
    });
  };

  if (isLoading) {
    return (
      <main className="flex-1 p-3 sm:p-6 space-y-4 sm:space-y-6">
        <div className="flex items-center justify-center min-h-[400px]">
          <div className="text-center">
            <div className="w-16 h-16 bg-gradient-to-br from-purple-500 to-blue-500 rounded-full flex items-center justify-center mx-auto mb-4 animate-pulse">
              <UserCircle className="w-8 h-8 text-white" />
            </div>
            <h3 className="text-lg font-semibold text-gray-900 mb-2">👥 Carregando Clientes...</h3>
            <p className="text-gray-600">Preparando sua lista de clientes</p>
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
            <UserCircle className="w-8 h-8 text-blue-600" />
            Clientes
          </h1>
          <p className="text-xs sm:text-base text-muted-foreground">Gerencie seus clientes cadastrados</p>
        </div>
        <div className="w-full sm:w-auto">
          <Button onClick={onOpenAdd} className="w-full sm:w-auto bg-gradient-to-r from-indigo-600 to-indigo-700 hover:from-indigo-700 hover:to-indigo-800 text-white px-6 sm:px-8 py-3 sm:py-4 rounded-xl sm:rounded-2xl shadow-xl hover:shadow-2xl transition-all duration-200 transform hover:scale-105">
            <Plus className="h-4 w-4 sm:h-5 sm:w-5 mr-2" /> Novo Cliente
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
              <CardTitle>Lista de Clientes</CardTitle>
              <CardDescription>Gerencie seus clientes cadastrados</CardDescription>
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
                {filteredClients.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={5} className="text-center py-10 text-neutral-500">
                      {clients.length === 0 ? 'Nenhum cliente cadastrado' : 'Nenhum cliente encontrado'}
                    </TableCell>
                  </TableRow>
                ) : (
                  filteredClients.map((c) => (
                    <TableRow key={c.id} className="border-neutral-100 hover:bg-neutral-50 transition-colors duration-150">
                      <TableCell className="px-4 py-3 font-medium">{c.codigo || '—'}</TableCell>
                      <TableCell className="px-4 py-3">{c.name}</TableCell>
                      <TableCell className="px-4 py-3">{c.cpf || '—'}</TableCell>
                      <TableCell className="px-4 py-3">{c.phone || '—'}</TableCell>
                      <TableCell className="px-4 py-3 text-right space-x-2">
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => handleEdit(c)}
                          className="inline-flex items-center justify-center gap-2 whitespace-nowrap text-sm font-medium ring-offset-background transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:pointer-events-none disabled:opacity-50 [&_svg]:pointer-events-none [&_svg]:size-4 [&_svg]:shrink-0 hover:bg-accent hover:text-accent-foreground rounded-md h-8 w-8 sm:h-9 sm:w-9 p-0"
                          title="Editar"
                        >
                          <Edit className="w-4 h-4" />
                        </Button>
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => requestDelete(c)}
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
            <DialogTitle>{editing ? 'Editar Cliente' : 'Novo Cliente'}</DialogTitle>
            <DialogDescription>Preencha os dados do cliente</DialogDescription>
          </DialogHeader>
          <Form {...form}>
            <form onSubmit={form.handleSubmit(handleSave)} className="space-y-4">
              <FormField
                control={form.control}
                name="name"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Nome do Cliente</FormLabel>
                    <FormControl>
                      <div className="relative">
                        <User2 className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-neutral-400" />
                        <Input placeholder="Ex: João da Silva" {...field} className="pl-9" />
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
              Deseja excluir o cliente {clientToDelete?.name}? Esta ação não pode ser desfeita.
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

export default Clientes;

