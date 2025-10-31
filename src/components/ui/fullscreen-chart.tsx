// 🖥️ Componente para exibir gráficos em tela cheia
import React from 'react';
import { X, Maximize2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Dialog, DialogHeader, DialogTitle, DialogPortal, DialogOverlay } from '@/components/ui/dialog';
import * as DialogPrimitive from "@radix-ui/react-dialog";
import { cn } from "@/lib/utils";
import { useResponsive } from '@/hooks/use-responsive';

interface FullscreenChartProps {
  title: string;
  children: React.ReactNode;
  icon?: React.ReactNode;
  className?: string;
}

// DialogContent customizado sem botão de fechar automático
const CustomDialogContent = React.forwardRef<
  React.ElementRef<typeof DialogPrimitive.Content>,
  React.ComponentPropsWithoutRef<typeof DialogPrimitive.Content>
>(({ className, children, ...props }, ref) => {
  const { isMobile } = useResponsive();
  
  return (
    <DialogPortal>
      <DialogOverlay />
      <DialogPrimitive.Content
        ref={ref}
        className={cn(
          "fixed z-50 grid gap-4 border bg-background shadow-lg duration-200 data-[state=open]:animate-in data-[state=closed]:animate-out data-[state=closed]:fade-out-0 data-[state=open]:fade-in-0 data-[state=closed]:zoom-out-95 data-[state=open]:zoom-in-95",
          // Mobile: margens iguais dos dois lados (1rem = 16px de cada lado) para centralização perfeita
          isMobile 
            ? "inset-x-4 top-[50%] translate-y-[-50%] rounded-lg"
            : "left-[50%] top-[50%] w-full max-w-lg translate-x-[-50%] translate-y-[-50%] data-[state=closed]:slide-out-to-left-1/2 data-[state=closed]:slide-out-to-top-[48%] data-[state=open]:slide-in-from-left-1/2 data-[state=open]:slide-in-from-top-[48%] sm:rounded-lg",
          className
        )}
        aria-describedby={undefined}
        {...props}
      >
        {children}
      </DialogPrimitive.Content>
    </DialogPortal>
  );
});
CustomDialogContent.displayName = "CustomDialogContent";

export function FullscreenChart({ title, children, icon, className = "" }: FullscreenChartProps) {
  const [isFullscreen, setIsFullscreen] = React.useState(false);
  const { isMobile } = useResponsive();

  return (
    <>
      {/* Botão de Fullscreen */}
      <Button
        variant="ghost"
        size="sm"
        onClick={() => setIsFullscreen(true)}
        className="absolute top-0 right-0 z-10 h-8 w-8 p-0 hover:bg-background/80"
        title="Expandir para tela cheia"
      >
        <Maximize2 className="h-4 w-4" />
      </Button>

      {/* Modal de Tela Cheia */}
      <Dialog open={isFullscreen} onOpenChange={setIsFullscreen}>
        <CustomDialogContent className={`max-h-[95vh] h-full p-0 ${isMobile ? '' : 'max-w-[95vw] w-full'}`}>
          <DialogHeader className={isMobile ? "px-4 pt-4 pb-3" : "px-6 pt-6 pb-0"}>
            <div className="flex items-center justify-between w-full">
              <div className="flex items-center space-x-2 flex-1 min-w-0">
                {icon && <div className="text-primary flex-shrink-0">{icon}</div>}
                <DialogTitle className={isMobile ? "text-base font-semibold truncate" : "text-xl font-semibold"}>
                  {title}
                </DialogTitle>
              </div>
              <Button
                variant="ghost"
                size="sm"
                onClick={() => setIsFullscreen(false)}
                className={isMobile ? "h-9 w-9 p-0 flex-shrink-0" : "h-8 w-8 p-0 flex-shrink-0"}
              >
                <X className={isMobile ? "h-5 w-5" : "h-4 w-4"} />
              </Button>
            </div>
          </DialogHeader>
          
          <div className={`flex-1 ${isMobile ? 'px-4 pt-2 pb-4' : 'px-6 pt-0 pb-6'} overflow-hidden`}>
            <div className={`w-full h-full ${className}`}>
              {children}
            </div>
          </div>
        </CustomDialogContent>
      </Dialog>
    </>
  );
}
