import { useState, useEffect } from 'react';

// Tipos para diferentes dispositivos
export type DeviceType = 'mobile' | 'tablet' | 'desktop';
export type Orientation = 'portrait' | 'landscape';

// Interface para informações de responsividade
export interface ResponsiveInfo {
  deviceType: DeviceType;
  orientation: Orientation;
  screenWidth: number;
  screenHeight: number;
  isMobile: boolean;
  isTablet: boolean;
  isDesktop: boolean;
  isPortrait: boolean;
  isLandscape: boolean;
  breakpoint: string;
}

// Hook personalizado para detectar responsividade
export const useResponsive = (): ResponsiveInfo => {
  const [responsiveInfo, setResponsiveInfo] = useState<ResponsiveInfo>({
    deviceType: 'desktop',
    orientation: 'landscape',
    screenWidth: 0,
    screenHeight: 0,
    isMobile: false,
    isTablet: false,
    isDesktop: true,
    isPortrait: false,
    isLandscape: true,
    breakpoint: 'desktop'
  });

  useEffect(() => {
    // Função para atualizar informações de responsividade
    const updateResponsiveInfo = () => {
      const width = window.innerWidth;
      const height = window.innerHeight;
      
      // Determinar tipo de dispositivo
      let deviceType: DeviceType = 'desktop';
      let breakpoint = 'desktop';
      
      if (width < 768) {
        deviceType = 'mobile';
        breakpoint = 'mobile';
      } else if (width >= 768 && width < 1024) {
        deviceType = 'tablet';
        breakpoint = 'tablet';
      } else {
        deviceType = 'desktop';
        breakpoint = 'desktop';
      }
      
      // Determinar orientação
      const orientation: Orientation = width > height ? 'landscape' : 'portrait';
      
      // Determinar breakpoint específico
      if (width < 475) {
        breakpoint = 'xs';
      } else if (width < 640) {
        breakpoint = 'sm';
      } else if (width < 768) {
        breakpoint = 'md';
      } else if (width < 1024) {
        breakpoint = 'lg';
      } else if (width < 1280) {
        breakpoint = 'xl';
      } else if (width < 1536) {
        breakpoint = '2xl';
      } else {
        breakpoint = '3xl';
      }
      
      setResponsiveInfo({
        deviceType,
        orientation,
        screenWidth: width,
        screenHeight: height,
        isMobile: deviceType === 'mobile',
        isTablet: deviceType === 'tablet',
        isDesktop: deviceType === 'desktop',
        isPortrait: orientation === 'portrait',
        isLandscape: orientation === 'landscape',
        breakpoint
      });
    };

    // Atualizar informações iniciais
    updateResponsiveInfo();

    // Adicionar listener para mudanças de tamanho
    window.addEventListener('resize', updateResponsiveInfo);
    window.addEventListener('orientationchange', updateResponsiveInfo);

    // Cleanup
    return () => {
      window.removeEventListener('resize', updateResponsiveInfo);
      window.removeEventListener('orientationchange', updateResponsiveInfo);
    };
  }, []);

  return responsiveInfo;
};

// Hook simplificado para detectar apenas se é mobile
export const useIsMobile = (): boolean => {
  const { isMobile } = useResponsive();
  return isMobile;
};

// Hook para detectar orientação
export const useOrientation = (): Orientation => {
  const { orientation } = useResponsive();
  return orientation;
};

// Hook para detectar breakpoint atual
export const useBreakpoint = (): string => {
  const { breakpoint } = useResponsive();
  return breakpoint;
};

// Hook para detectar se está em modo paisagem
export const useIsLandscape = (): boolean => {
  const { isLandscape } = useResponsive();
  return isLandscape;
};

// Hook para detectar se está em modo retrato
export const useIsPortrait = (): boolean => {
  const { isPortrait } = useResponsive();
  return isPortrait;
};

// Hook para detectar tamanho da tela
export const useScreenSize = (): { width: number; height: number } => {
  const { screenWidth, screenHeight } = useResponsive();
  return { width: screenWidth, height: screenHeight };
};

// Hook para detectar se a tela é pequena (menor que 640px)
export const useIsSmallScreen = (): boolean => {
  const { screenWidth } = useResponsive();
  return screenWidth < 640;
};

// Hook para detectar se a tela é média (640px - 1024px)
export const useIsMediumScreen = (): boolean => {
  const { screenWidth } = useResponsive();
  return screenWidth >= 640 && screenWidth < 1024;
};

// Hook para detectar se a tela é grande (maior que 1024px)
export const useIsLargeScreen = (): boolean => {
  const { screenWidth } = useResponsive();
  return screenWidth >= 1024;
};
