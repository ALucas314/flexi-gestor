import React, { useState, useEffect } from "react";
import { RotateCcw, Package, Search, Filter, Download, Calendar } from "lucide-react";


import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useFirebaseData } from "@/contexts/FirebaseDataContext";

const Movimentacoes = () => {
  const { movements, products } = useFirebaseData();
  const [searchTerm, setSearchTerm] = useState("");
  const [filterType, setFilterType] = useState<string>("todos");
  const [filterProduct, setFilterProduct] = useState<string>("todos");
  const [isLoading, setIsLoading] = useState(true);

  // Controlar estado de carregamento
  useEffect(() => {
    const timer = setTimeout(() => {
      setIsLoading(false);
    }, 500);
    
    return () => clearTimeout(timer);
  }, []);

  // Filtros
  const filteredMovements = movements.filter(movement => {
    const matchesSearch = movement.productName.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         movement.description.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesType = filterType === "todos" || movement.type === filterType;
    const matchesProduct = filterProduct === "todos" || movement.productId === filterProduct;
    
    return matchesSearch && matchesType && matchesProduct;
  });

  // Estatísticas
  const totalMovements = movements.length;
  const totalValue = movements.reduce((sum, m) => sum + m.total, 0);
  const thisMonthMovements = movements.filter(m => {
    const movementDate = new Date(m.date);
    const now = new Date();
    return movementDate.getMonth() === now.getMonth() && movementDate.getFullYear() === now.getFullYear();
  }).length;

  // Tela de carregamento
  if (isLoading) {
    return (
      <main className="flex-1 p-3 sm:p-6 space-y-4 sm:space-y-6">
        <div className="flex items-center justify-center min-h-[400px]">
          <div className="text-center">
            <div className="w-16 h-16 bg-gradient-to-br from-blue-500 to-blue-600 rounded-full flex items-center justify-center mx-auto mb-4 animate-pulse">
              <RotateCcw className="w-8 h-8 text-white" />
            </div>
            <h3 className="text-lg font-semibold text-gray-900 mb-2">📊 Carregando Movimentações...</h3>
            <p className="text-gray-600">Preparando histórico de movimentações</p>
          </div>
        </div>
      </main>
    );
  }

  return (
    <main className="flex-1 p-6 space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-3xl font-bold">📊 Movimentações</h1>
        <p className="text-muted-foreground">Histórico completo de entradas e saídas do sistema</p>
      </div>
            
            {/* Cards de Estatísticas */}
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 sm:gap-6">
              {/* Card Total de Movimentações */}
              <Card className="bg-gradient-to-br from-blue-50 to-blue-100 border-blue-200 hover:shadow-lg transition-all duration-300">
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                  <CardTitle className="text-sm font-medium text-blue-800">📊 Total de Movimentações</CardTitle>
                  <RotateCcw className="h-5 w-5 text-blue-600" />
                </CardHeader>
                <CardContent>
                  <div className="text-3xl font-bold text-blue-700 mb-1">{totalMovements}</div>
                  <p className="text-xs text-blue-600">Movimentações registradas</p>
                </CardContent>
              </Card>

              {/* Card Valor Total */}
              <Card className="bg-gradient-to-br from-green-50 to-green-100 border-green-200 hover:shadow-lg transition-all duration-300">
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                  <CardTitle className="text-sm font-medium text-green-800">💰 Valor Total</CardTitle>
                  <Package className="h-5 w-5 text-green-600" />
                </CardHeader>
                <CardContent>
                  <div className="text-3xl font-bold text-green-700 mb-1">R$ {totalValue.toFixed(2).replace('.', ',')}</div>
                  <p className="text-xs text-green-600">Valor total movimentado</p>
                </CardContent>
              </Card>

              {/* Card Este Mês */}
              <Card className="bg-gradient-to-br from-purple-50 to-purple-100 border-purple-200 hover:shadow-lg transition-all duration-300">
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                  <CardTitle className="text-sm font-medium text-purple-800">📅 Este Mês</CardTitle>
                  <RotateCcw className="h-5 w-5 text-purple-600" />
                </CardHeader>
                <CardContent>
                  <div className="text-3xl font-bold text-purple-700 mb-1">{thisMonthMovements}</div>
                  <p className="text-xs text-purple-600">Movimentações do mês</p>
                </CardContent>
              </Card>

              {/* Card Produtos Movimentados */}
              <Card className="bg-gradient-to-br from-orange-50 to-orange-100 border-orange-200 hover:shadow-lg transition-all duration-300">
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                  <CardTitle className="text-sm font-medium text-orange-800">🔄 Produtos Movimentados</CardTitle>
                  <Package className="h-5 w-5 text-orange-600" />
                </CardHeader>
                <CardContent>
                  <div className="text-3xl font-bold text-orange-700 mb-1">
                    {new Set(movements.map(m => m.productId)).size}
                  </div>
                  <p className="text-xs text-orange-600">Produtos diferentes</p>
                </CardContent>
              </Card>
            </div>

            {/* Filtros e Busca */}
            <Card className="bg-gradient-to-r from-slate-50 to-gray-50 border-slate-200">
              <CardHeader className="pb-4">
                <CardTitle className="flex items-center gap-2 text-slate-800">
                  <Filter className="w-5 h-5 text-slate-600" />
                  🔍 Filtros e Busca
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                  {/* Campo de Busca */}
                  <div className="relative">
                    <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-slate-500 w-5 h-5" />
                    <Input
                      placeholder="🔍 Buscar movimentações..."
                      value={searchTerm}
                      onChange={(e) => setSearchTerm(e.target.value)}
                      className="pl-10 bg-white border-slate-300 hover:border-slate-400 focus:border-blue-500 transition-colors"
                    />
                  </div>
                  
                  {/* Filtro por Tipo */}
                  <Select value={filterType} onValueChange={setFilterType}>
                    <SelectTrigger className="bg-white border-slate-300 hover:border-slate-400 transition-colors">
                      <SelectValue placeholder="Tipo de movimentação" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="todos">📊 Todos os tipos</SelectItem>
                      <SelectItem value="entrada">📥 Entradas</SelectItem>
                      <SelectItem value="saida">📤 Saídas</SelectItem>
                      <SelectItem value="ajuste">⚙️ Ajustes</SelectItem>
                    </SelectContent>
                  </Select>
                  
                  {/* Filtro por Produto */}
                  <Select value={filterProduct} onValueChange={setFilterProduct}>
                    <SelectTrigger className="bg-white border-slate-300 hover:border-slate-400 transition-colors">
                      <SelectValue placeholder="Produto" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="todos">📦 Todos os produtos</SelectItem>
                      {products.map(product => (
                        <SelectItem key={product.id} value={product.id}>
                          {product.name}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                
                {/* Informação dos Filtros Ativos */}
                <div className="mt-4 p-3 bg-blue-50 rounded-lg border border-blue-200">
                  <div className="flex items-center gap-2">
                    <div className="w-2 h-2 bg-blue-500 rounded-full"></div>
                    <span className="text-sm font-medium text-blue-800">
                      Filtros Ativos: {
                        filterType === 'todos' ? 'Todos os tipos' : 
                        filterType === 'entrada' ? 'Apenas Entradas' : 
                        filterType === 'saida' ? 'Apenas Saídas' : 'Apenas Ajustes'
                      } • {
                        filterProduct === 'todos' ? 'Todos os produtos' : 
                        products.find(p => p.id === filterProduct)?.name || 'Produto específico'
                      }
                    </span>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Tabela de Movimentações */}
            <Card className="bg-white border-slate-200 shadow-sm">
              <CardHeader className="pb-4">
                <CardTitle className="flex items-center gap-2 text-slate-800">
                  <Package className="w-5 h-5 text-slate-600" />
                  📋 Lista de Movimentações
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="rounded-md border border-slate-200 overflow-hidden">
                  <Table>
                    <TableHeader>
                      <TableRow className="bg-slate-50 hover:bg-slate-100">
                        <TableHead className="font-semibold text-slate-700">📅 Data</TableHead>
                        <TableHead className="font-semibold text-slate-700">🏷️ Tipo</TableHead>
                        <TableHead className="font-semibold text-slate-700">📦 Produto</TableHead>
                        <TableHead className="font-semibold text-slate-700 hidden md:table-cell">📝 Descrição</TableHead>
                        <TableHead className="font-semibold text-slate-700">🔢 Qtd</TableHead>
                        <TableHead className="font-semibold text-slate-700">💰 Valor</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {filteredMovements.length === 0 ? (
                        <TableRow>
                          <TableCell colSpan={6} className="text-center py-12">
                            <div className="flex flex-col items-center gap-3">
                              <RotateCcw className="w-12 h-12 text-slate-300" />
                              <div className="text-slate-500">
                                <p className="font-medium">Nenhuma movimentação encontrada</p>
                                <p className="text-sm">Comece registrando entradas ou saídas de produtos</p>
                              </div>
                            </div>
                          </TableCell>
                        </TableRow>
                      ) : (
                        filteredMovements.map((movement) => (
                          <TableRow key={movement.id} className="hover:bg-slate-50 transition-colors">
                            {/* Data */}
                            <TableCell>
                              <div className="flex items-center gap-2">
                                <Calendar className="w-4 h-4 text-slate-400" />
                                <span className="text-sm text-slate-600">
                                  {new Date(movement.date).toLocaleDateString('pt-BR')}
                                </span>
                              </div>
                            </TableCell>
                            
                            {/* Tipo */}
                            <TableCell>
                              <Badge variant={
                                movement.type === "entrada" ? "default" : 
                                movement.type === "saida" ? "destructive" : "secondary"
                              } className="capitalize">
                                {movement.type === "entrada" ? "📥 Entrada" : 
                                 movement.type === "saida" ? "📤 Saída" : "⚙️ Ajuste"}
                              </Badge>
                            </TableCell>
                            
                            {/* Produto */}
                            <TableCell>
                              <div className="flex items-center gap-3">
                                <div className={`w-8 h-8 rounded-lg flex items-center justify-center ${
                                  movement.type === "entrada" ? "bg-green-100" : 
                                  movement.type === "saida" ? "bg-red-100" : "bg-blue-100"
                                }`}>
                                  <Package className={`w-4 h-4 ${
                                    movement.type === "entrada" ? "text-green-600" : 
                                    movement.type === "saida" ? "text-red-600" : "text-blue-600"
                                  }`} />
                                </div>
                                <div>
                                  <div className="font-medium text-slate-900">{movement.productName}</div>
                                </div>
                              </div>
                            </TableCell>
                            
                            {/* Descrição */}
                            <TableCell className="hidden md:table-cell">
                              <span className="text-sm text-slate-600">{movement.description}</span>
                            </TableCell>
                            
                            {/* Quantidade */}
                            <TableCell>
                              <Badge variant="outline" className={`${
                                movement.type === "entrada" ? "bg-green-50 text-green-700 border-green-200" : 
                                movement.type === "saida" ? "bg-red-50 text-red-700 border-red-200" : 
                                "bg-blue-50 text-blue-700 border-blue-200"
                              }`}>
                                {movement.quantity} un
                              </Badge>
                            </TableCell>
                            
                            {/* Valor */}
                            <TableCell>
                              <span className={`font-bold ${
                                movement.type === "entrada" ? "text-green-600" : 
                                movement.type === "saida" ? "text-red-600" : "text-blue-600"
                              }`}>
                                R$ {movement.total.toFixed(2).replace('.', ',')}
                              </span>
                            </TableCell>
                          </TableRow>
                        ))
                      )}
                    </TableBody>
                  </Table>
                </div>
              </CardContent>
            </Card>
          </main>
        );
};

export default Movimentacoes;
