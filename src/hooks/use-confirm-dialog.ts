import { useState, useCallback } from 'react';

interface ConfirmDialogState {
  isOpen: boolean;
  title: string;
  description: string;
  onConfirm: () => void | Promise<void>;
  confirmText?: string;
  cancelText?: string;
  variant?: 'default' | 'destructive';
}

export function useConfirmDialog() {
  const [dialogState, setDialogState] = useState<ConfirmDialogState>({
    isOpen: false,
    title: '',
    description: '',
    onConfirm: () => {},
  });

  const confirm = useCallback((
    title: string,
    description: string,
    onConfirm: () => void | Promise<void>,
    options?: {
      confirmText?: string;
      cancelText?: string;
      variant?: 'default' | 'destructive';
    }
  ) => {
    setDialogState({
      isOpen: true,
      title,
      description,
      onConfirm,
      confirmText: options?.confirmText || 'Confirmar',
      cancelText: options?.cancelText || 'Cancelar',
      variant: options?.variant || 'default',
    });
  }, []);

  const closeDialog = useCallback(() => {
    setDialogState(prev => ({ ...prev, isOpen: false }));
  }, []);

  const handleConfirm = useCallback(async () => {
    await dialogState.onConfirm();
    closeDialog();
  }, [dialogState.onConfirm, closeDialog]);

  return {
    dialogState,
    confirm,
    closeDialog,
    handleConfirm,
  };
}

