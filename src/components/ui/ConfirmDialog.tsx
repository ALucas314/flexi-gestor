import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog';
import { AlertTriangle, HelpCircle } from 'lucide-react';

interface ConfirmDialogProps {
  isOpen: boolean;
  onClose: () => void;
  onConfirm: () => void | Promise<void>;
  title: string;
  description: string;
  confirmText?: string;
  cancelText?: string;
  variant?: 'default' | 'destructive';
}

export function ConfirmDialog({
  isOpen,
  onClose,
  onConfirm,
  title,
  description,
  confirmText = 'Confirmar',
  cancelText = 'Cancelar',
  variant = 'default',
}: ConfirmDialogProps) {
  const iconClass = variant === 'destructive' 
    ? 'w-10 h-10 p-2.5 bg-red-50 text-red-600 rounded-full md:w-12 md:h-12 md:p-3'
    : 'w-10 h-10 p-2.5 bg-blue-50 text-blue-600 rounded-full md:w-12 md:h-12 md:p-3';
  
  const Icon = variant === 'destructive' ? AlertTriangle : HelpCircle;

  return (
    <AlertDialog open={isOpen} onOpenChange={onClose}>
      <AlertDialogContent className="max-w-sm p-4 md:p-6">
        <AlertDialogHeader className="text-center space-y-2.5 md:space-y-4">
          <div className="flex justify-center">
            <div className={iconClass}>
              <Icon className="w-full h-full" />
            </div>
          </div>
          <AlertDialogTitle className="text-lg md:text-xl font-bold px-1">
            {title}
          </AlertDialogTitle>
          <AlertDialogDescription className="whitespace-pre-line text-sm md:text-base leading-relaxed">
            {description}
          </AlertDialogDescription>
        </AlertDialogHeader>
        <AlertDialogFooter className="flex-col md:flex-row gap-3 md:gap-0 md:justify-end md:space-x-2 px-0 mt-4 md:mt-0">
          <AlertDialogAction
            onClick={onConfirm}
            className={
              variant === 'destructive'
                ? 'w-full md:w-auto h-11 md:h-10 bg-red-600 hover:bg-red-700 text-white focus:ring-red-600 text-sm font-semibold shadow-lg shadow-red-500/30 md:shadow-none order-2 md:order-2'
                : 'w-full md:w-auto h-11 md:h-10 text-sm font-semibold shadow-sm md:shadow-none order-2 md:order-2'
            }
          >
            {confirmText}
          </AlertDialogAction>
          <AlertDialogCancel 
            onClick={onClose}
            className="w-full md:w-auto h-11 md:h-10 text-sm font-semibold shadow-sm md:shadow-none order-1 md:order-1"
          >
            {cancelText}
          </AlertDialogCancel>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  );
}

