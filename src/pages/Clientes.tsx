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
import { Plus, Trash2, Edit, Phone, User2, Hash, UserCircle, Search } from 'lucide-react';
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
  code: z.string().min(1, 'Código é obrigatório'),
  name: z.string().min(1, 'Nome é obrigatório').max(200),
  cpf: z.string().optional(),
  phone: z.string().optional(),
});

type ClientFormData = z.infer<typeof clientSchema>;

interface Client {
  id: string;
  code: string;
  name: string;
  cpf?: string | null;
  phone?: string | null;
  created_at?: string;
}

// Gera próximo código numérico simples: 1, 2, 3, ...
function generateNextClientCode(existing: Client[]): string {
  const numbers = existing
    .map(c => parseInt(String(c.code || '').replace(/\D/g, ''), 10))
    .filter(n => !isNaN(n));
  const next = (numbers.length > 0 ? Math.max(...numbers) + 1 : 1);
  return String(next);
}

const Clientes = () => {
  const { toast } = useToast();
  const { workspaceAtivo } = useWorkspace();
  const { user } = useAuth();

  const [clients, setClients] = useState<Client[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [isAddOpen, setIsAddOpen] = useState(false);
  const [editing, setEditing] = useState<Client | null>(null);
  const [isDeleteOpen, setIsDeleteOpen] = useState(false);
  const [clientToDelete, setClientToDelete] = useState<Client | null>(null);
  const [searchTerm, setSearchTerm] = useState('');

  const form = useForm<ClientFormData>({
    resolver: zodResolver(clientSchema),
    defaultValues: { code: '', name: '', cpf: '', phone: '' }
  });

  const nextCode = useMemo(() => generateNextClientCode(clients), [clients]);

  // Filtrar clientes baseado no termo de busca (código e nome)
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
      
      // Busca por código
      const code = c.code;
      if (code !== null && code !== undefined && code !== '') {
        const codeStr = String(code).trim().toLowerCase();
        // Compara diretamente ou se começa com o termo
        if (codeStr === term || codeStr.startsWith(term)) {
          return true;
        }
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
    try {
      setIsLoading(true);
      const { data, error } = await supabase
        .from('clientes')
        .select('*')
        .order('id', { ascending: false });
      if (error) throw error;
      const mapped: Client[] = (data || []).map((c: any) => ({
        id: c.id,
        code: String(c.codigo ?? c.code ?? ''),
        name: c.nome ?? c.name,
        cpf: c.cpf,
        phone: c.telefone ?? c.phone,
        created_at: c.criado_em ?? c.created_at,
      }));
      setClients(mapped);
    } catch (error: any) {
      toast({
        title: 'Erro ao carregar clientes',
        description: error.message || 'Verifique nomes de colunas: id, codigo (ou code), nome (ou name), cpf, telefone (ou phone).',
        variant: 'destructive'
      });
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    loadClients();
  }, [workspaceAtivo?.id]);

  const onOpenAdd = () => {
    setEditing(null);
    form.reset({ code: nextCode, name: '', cpf: '', phone: '' });
    setIsAddOpen(true);
  };

  const handleSave = async (data: ClientFormData) => {
    if (!user?.id) return;
    try {
      if (!editing) {
        const { error } = await supabase
          .from('clientes')
          .insert({
            codigo: data.code,
            nome: data.name,
            cpf: data.cpf || null,
            telefone: data.phone || null,
            usuario_id: user.id,
          } as any);
        if (error) throw error;
        toast({ title: '✅ Cliente cadastrado' });
      } else {
        const { error } = await supabase
          .from('clientes')
          .update({
            codigo: data.code,
            nome: data.name,
            cpf: data.cpf || null,
            telefone: data.phone || null,
          })
          .eq('id', editing.id);
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
    form.reset({ code: c.code, name: c.name, cpf: c.cpf || '', phone: c.phone || '' });
    setIsAddOpen(true);
  };

  const requestDelete = (c: Client) => {
    setClientToDelete(c);
    setIsDeleteOpen(true);
  };

  const confirmDelete = async () => {
    if (!clientToDelete) return;
    try {
      const { error } = await supabase.from('clientes').delete().eq('id', clientToDelete.id);
      if (error) throw error;
      toast({ title: '🗑️ Cliente removido' });
      setIsDeleteOpen(false);
      setClientToDelete(null);
      await loadClients();
    } catch (error: any) {
      toast({ title: 'Erro ao remover', description: error.message, variant: 'destructive' });
    }
  };

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
          <CardTitle>Lista de Clientes</CardTitle>
          <CardDescription>Gerencie seus clientes cadastrados</CardDescription>
        </CardHeader>
        <CardContent className="p-0">
          <div className="overflow-x-auto">
            <Table>
              <TableHeader className="bg-neutral-50">
                <TableRow className="border-neutral-200">
                  <TableHead className="px-4 py-3">Código</TableHead>
                  <TableHead className="px-4 py-3">Nome</TableHead>
                  <TableHead className="px-4 py-3">CPF</TableHead>
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
                      <TableCell className="px-4 py-3 font-mono text-sm">{c.code}</TableCell>
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
                name="code"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Código</FormLabel>
                    <FormControl>
                      <div className="relative">
                        <Hash className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-neutral-400" />
                        <Input {...field} value={field.value || nextCode} onChange={(e) => field.onChange(e.target.value)} className="pl-9" />
                      </div>
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
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
                name="cpf"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>CPF</FormLabel>
                    <FormControl>
                      <Input
                        placeholder="000.000.000-00"
                        value={field.value || ''}
                        onChange={(e) => field.onChange(formatCPF(e.target.value))}
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

