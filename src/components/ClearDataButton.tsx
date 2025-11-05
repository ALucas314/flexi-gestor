import React from 'react';
import { Button } from '@/components/ui/button';
import { Trash2 } from 'lucide-react';
import { toast } from 'sonner';

const ClearDataButton = () => {
  const clearAllData = () => {
    if (confirm('⚠️ ATENÇÃO: Isso vai apagar TODOS os dados do localStorage. Continuar?')) {
      // Limpar localStorage
      localStorage.removeItem('flexi-products');
      localStorage.removeItem('flexi-moviments');
      localStorage.removeItem('flexi-notifications');
      localStorage.removeItem('flexi-gestor-user');
      localStorage.removeItem('flexi-gestor-auth');
      
      toast.success('Dados limpos! A página será recarregada.');
      
      // Recarregar página após um pequeno delay para mostrar o toast
      setTimeout(() => {
        window.location.reload();
      }, 500);
    }
  };

  return (
    <Button 
      onClick={clearAllData}
      variant="destructive"
      size="sm"
      className="fixed bottom-4 right-4 z-50"
    >
      <Trash2 className="w-4 h-4 mr-2" />
      Limpar Dados Antigos
    </Button>
  );
};

export default ClearDataButton;
