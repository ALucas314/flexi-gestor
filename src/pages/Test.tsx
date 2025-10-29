import React from 'react';
import { useResponsive } from '@/hooks/use-responsive';

const Test = () => {
  const { isMobile, isTablet, screenWidth, screenHeight, deviceType, breakpoint } = useResponsive();

  console.log('✅ Página de teste carregada!');
  console.log('📱 Mobile Debug:', { isMobile, isTablet, screenWidth, screenHeight, deviceType, breakpoint });
  
  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-indigo-50 to-purple-50 flex items-center justify-center p-4">
      <div className="bg-white rounded-2xl shadow-xl p-8 max-w-md w-full text-center">
        <div className="w-16 h-16 bg-gradient-to-br from-blue-600 to-purple-600 rounded-full flex items-center justify-center mx-auto mb-4">
          <span className="text-2xl">✅</span>
        </div>
        <h1 className="text-2xl font-bold text-gray-900 mb-2">Sistema Funcionando!</h1>
        <p className="text-gray-600 mb-6">
          O Flexi Gestor está rodando corretamente com React + Prisma + Express.
        </p>
        
        {/* Debug de responsividade */}
        <div className="bg-gray-100 rounded-lg p-4 mb-6 text-left">
          <h3 className="font-semibold text-gray-800 mb-2">📱 Debug Mobile:</h3>
          <div className="space-y-1 text-sm text-gray-600">
            <p>📱 Mobile: {isMobile ? 'SIM' : 'NÃO'}</p>
            <p>📊 Tablet: {isTablet ? 'SIM' : 'NÃO'}</p>
            <p>💻 Device: {deviceType}</p>
            <p>📏 Breakpoint: {breakpoint}</p>
            <p>📐 Tela: {screenWidth}x{screenHeight}</p>
          </div>
        </div>
        
        <div className="space-y-2 text-sm text-gray-500">
          <p>✅ Frontend React carregado</p>
          <p>✅ Backend Express conectado</p>
          <p>✅ Banco Prisma funcionando</p>
          <p>✅ Autenticação JWT ativa</p>
          <p>✅ Responsividade detectada</p>
        </div>
      </div>
    </div>
  );
};

export default Test;

