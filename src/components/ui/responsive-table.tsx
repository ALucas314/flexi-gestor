import React from 'react';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { useResponsive } from '@/hooks/use-responsive';
import { cn } from '@/lib/utils';

// Interface para colunas da tabela
export interface TableColumn<T> {
  key: string;
  label: string;
  render?: (item: T) => React.ReactNode;
  hideOnMobile?: boolean;
  priority?: 'high' | 'medium' | 'low'; // Prioridade para mobile
  className?: string;
}

// Interface para ações da tabela
export interface TableAction<T> {
  label: string;
  icon: React.ReactNode;
  onClick: (item: T) => void;
  variant?: 'default' | 'destructive' | 'outline' | 'secondary' | 'ghost' | 'link';
  className?: string;
}

// Props do componente
export interface ResponsiveTableProps<T> {
  data: T[];
  columns: TableColumn<T>[];
  actions?: TableAction<T>[];
  keyExtractor: (item: T) => string;
  emptyMessage?: string;
  className?: string;
  cardClassName?: string;
  showMobileCards?: boolean; // Se deve mostrar cards no mobile
  mobileCardTitle?: (item: T) => string;
  mobileCardSubtitle?: (item: T) => string;
}

export function ResponsiveTable<T>({
  data,
  columns,
  actions = [],
  keyExtractor,
  emptyMessage = "Nenhum item encontrado",
  className,
  cardClassName,
  showMobileCards = true,
  mobileCardTitle,
  mobileCardSubtitle
}: ResponsiveTableProps<T>) {
  const { isMobile, isTablet } = useResponsive();

  // Se não há dados, mostrar mensagem vazia
  if (data.length === 0) {
    return (
      <Card className={cn("bg-white border border-slate-200/50 shadow-lg", cardClassName)}>
        <CardContent className="p-8 text-center">
          <div className="text-neutral-500">
            <div className="w-16 h-16 bg-neutral-100 rounded-full flex items-center justify-center mx-auto mb-4">
              <div className="w-8 h-8 bg-neutral-300 rounded-full"></div>
            </div>
            <p className="text-lg font-medium">{emptyMessage}</p>
          </div>
        </CardContent>
      </Card>
    );
  }

  // Se é mobile e deve mostrar cards
  if (isMobile && showMobileCards) {
    return (
      <div className={cn("space-y-3", className)}>
        {data.map((item) => (
          <Card key={keyExtractor(item)} className={cn("bg-white border border-slate-200/50 shadow-lg hover:shadow-xl transition-all duration-300", cardClassName)}>
            <CardContent className="p-4">
              {/* Header do Card Mobile */}
              <div className="flex items-start justify-between mb-3">
                <div className="flex-1 min-w-0">
                  <h3 className="font-semibold text-neutral-900 text-sm truncate">
                    {mobileCardTitle ? mobileCardTitle(item) : keyExtractor(item)}
                  </h3>
                  {mobileCardSubtitle && (
                    <p className="text-xs text-neutral-500 mt-1 truncate">
                      {mobileCardSubtitle(item)}
                    </p>
                  )}
                </div>
                
                {/* Ações no Mobile */}
                {actions.length > 0 && (
                  <div className="flex items-center space-x-1 ml-2">
                    {actions.map((action, index) => (
                      <Button
                        key={index}
                        variant={action.variant || "ghost"}
                        size="sm"
                        onClick={() => action.onClick(item)}
                        className={cn("w-8 h-8 p-0", action.className)}
                      >
                        {action.icon}
                      </Button>
                    ))}
                  </div>
                )}
              </div>

              {/* Conteúdo do Card Mobile */}
              <div className="space-y-2">
                {columns
                  .filter(col => !col.hideOnMobile && col.priority !== 'low')
                  .map((column) => (
                    <div key={column.key} className="flex justify-between items-center">
                      <span className="text-xs font-medium text-neutral-600 min-w-0 flex-shrink-0">
                        {column.label}:
                      </span>
                      <div className="text-xs text-neutral-900 text-right min-w-0 flex-1 ml-2">
                        {column.render ? column.render(item) : (item as any)[column.key]}
                      </div>
                    </div>
                  ))}
              </div>
            </CardContent>
          </Card>
        ))}
      </div>
    );
  }

  // Tabela para desktop/tablet
  return (
    <Card className={cn("bg-white border border-slate-200/50 shadow-lg", cardClassName)}>
      <CardContent className="p-0">
        <div className="overflow-x-auto">
          <Table className={className}>
            <TableHeader>
              <TableRow>
                {columns.map((column) => (
                  <TableHead 
                    key={column.key}
                    className={cn(
                      "text-xs sm:text-sm",
                      isMobile && column.hideOnMobile && "hidden sm:table-cell",
                      column.className
                    )}
                  >
                    {column.label}
                  </TableHead>
                ))}
                {actions.length > 0 && (
                  <TableHead className="text-xs sm:text-sm">Ações</TableHead>
                )}
              </TableRow>
            </TableHeader>
            <TableBody>
              {data.map((item) => (
                <TableRow key={keyExtractor(item)}>
                  {columns.map((column) => (
                    <TableCell 
                      key={column.key}
                      className={cn(
                        "py-2 sm:py-4 text-xs sm:text-sm",
                        isMobile && column.hideOnMobile && "hidden sm:table-cell",
                        column.className
                      )}
                    >
                      {column.render ? column.render(item) : (item as any)[column.key]}
                    </TableCell>
                  ))}
                  {actions.length > 0 && (
                    <TableCell className="py-2 sm:py-4">
                      <div className="flex items-center space-x-1 sm:space-x-2">
                        {actions.map((action, index) => (
                          <Button
                            key={index}
                            variant={action.variant || "ghost"}
                            size="sm"
                            onClick={() => action.onClick(item)}
                            className={cn(
                              "h-8 w-8 sm:h-9 sm:w-9 p-0",
                              action.className
                            )}
                          >
                            {action.icon}
                          </Button>
                        ))}
                      </div>
                    </TableCell>
                  )}
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </div>
      </CardContent>
    </Card>
  );
}

// Hook para facilitar a criação de colunas
export function useTableColumns<T>() {
  const createColumn = (
    key: string,
    label: string,
    options: Partial<TableColumn<T>> = {}
  ): TableColumn<T> => ({
    key,
    label,
    ...options
  });

  return { createColumn };
}

// Componente para Badge responsivo
export function ResponsiveBadge({ 
  children, 
  variant = "default",
  className 
}: {
  children: React.ReactNode;
  variant?: "default" | "secondary" | "destructive" | "outline";
  className?: string;
}) {
  const { isMobile } = useResponsive();
  
  return (
    <Badge 
      variant={variant} 
      className={cn(
        isMobile ? "text-xs px-1.5 py-0.5" : "text-xs",
        className
      )}
    >
      {children}
    </Badge>
  );
}

// Componente para texto responsivo
export function ResponsiveText({ 
  children, 
  className = "",
  mobileClassName = "",
  desktopClassName = ""
}: {
  children: React.ReactNode;
  className?: string;
  mobileClassName?: string;
  desktopClassName?: string;
}) {
  const { isMobile } = useResponsive();
  
  return (
    <span className={cn(
      className,
      isMobile ? mobileClassName : desktopClassName
    )}>
      {children}
    </span>
  );
}
