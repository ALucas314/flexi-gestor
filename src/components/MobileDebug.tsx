import React from 'react';
import { useResponsive } from '@/hooks/use-responsive';

// Componente para debug de problemas mobile
export const MobileDebug = () => {
  const { isMobile, isTablet, screenWidth, screenHeight, deviceType, breakpoint } = useResponsive();

  // Só mostrar em desenvolvimento
  if (process.env.NODE_ENV === 'production') {
    return null;
  }

  return (
    <div className="fixed bottom-4 right-4 bg-black/80 text-white p-2 rounded-lg text-xs z-50">
      <div>📱 Mobile: {isMobile ? 'SIM' : 'NÃO'}</div>
      <div>📊 Tablet: {isTablet ? 'SIM' : 'NÃO'}</div>
      <div>💻 Device: {deviceType}</div>
      <div>📏 Breakpoint: {breakpoint}</div>
      <div>📐 Tela: {screenWidth}x{screenHeight}</div>
    </div>
  );
};
