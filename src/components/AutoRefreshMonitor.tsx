/**
 * 🔄 Monitor de Auto-Refresh Global
 * 
 * Detecta quando a página não está respondendo ou a conexão está perdida
 * e recarrega automaticamente após um período de inatividade.
 * Funciona tanto em desenvolvimento quanto em produção.
 */

import { useEffect, useRef } from 'react';
import { supabase } from '@/lib/supabase';

export const AutoRefreshMonitor = () => {
  const isReloadingRef = useRef(false);
  const lastActivityRef = useRef(Date.now());
  const lastConnectionCheckRef = useRef(Date.now());
  const connectionCheckIntervalRef = useRef<NodeJS.Timeout | null>(null);

  useEffect(() => {
    // Detectar atividades do usuário
    const updateActivity = () => {
      lastActivityRef.current = Date.now();
    };

    // Listener de atividade (movimento do mouse, rolagem, cliques, teclado)
    const events = ['mousemove', 'scroll', 'click', 'keydown', 'touchstart', 'touchmove'];
    events.forEach(event => {
      document.addEventListener(event, updateActivity, { passive: true });
    });

    // Função para verificar conexão com Supabase
    const checkConnection = async (): Promise<boolean> => {
      try {
        // Verificar se há sessão ativa
        const { error: sessionError } = await supabase.auth.getSession();
        if (sessionError) {
          return false;
        }

        // Testar conexão fazendo uma query simples com timeout usando Promise.race
        const queryPromise = supabase
          .from('produtos')
          .select('id')
          .limit(1);

        const timeoutPromise = new Promise<never>((_, reject) => {
          setTimeout(() => reject(new Error('Timeout')), 5000); // Timeout de 5 segundos
        });

        try {
          const { error: testError } = await Promise.race([queryPromise, timeoutPromise]);
          return !testError;
        } catch (error: any) {
          // Timeout ou outro erro - conexão perdida ou muito lenta
          return false;
        }
      } catch (error) {
        return false;
      }
    };

    // Função de monitoramento
    const performHealthCheck = async () => {
      if (isReloadingRef.current) return;

      const now = Date.now();
      const timeSinceLastActivity = now - lastActivityRef.current;
      const timeSinceLastConnection = now - lastConnectionCheckRef.current;

      // Verificar conexão a cada 30 segundos
      if (timeSinceLastConnection > 30000) {
        const isConnected = await checkConnection();
        lastConnectionCheckRef.current = now;

        if (!isConnected) {
          console.warn('⚠️ [AutoRefresh] Conexão perdida detectada');
          
          // Se não está conectado e usuário está ocioso há mais de 10 segundos
          if (timeSinceLastActivity > 10000) {
            console.log('🔄 [AutoRefresh] Recarregando página automaticamente...');
            isReloadingRef.current = true;
            window.location.reload();
            return;
          }
        }
      }

      // Se a página não teve atividade há mais de 5 minutos E não há conexão há mais de 2 minutos
      // Recarregar automaticamente (página pode estar travada)
      if (timeSinceLastActivity > 300000 && timeSinceLastConnection > 120000) {
        const isConnected = await checkConnection();
        if (!isConnected) {
          console.log('🔄 [AutoRefresh] Página inativa há muito tempo e sem conexão. Recarregando...');
          isReloadingRef.current = true;
          window.location.reload();
        }
      }
    };

    // Health check inicial
    checkConnection().then(() => {
      lastConnectionCheckRef.current = Date.now();
    });

    // Configurar intervalo de health check (a cada 15 segundos)
    connectionCheckIntervalRef.current = setInterval(performHealthCheck, 15000);

    // Monitorar também eventos de visibilidade da página
    const handleVisibilityChange = () => {
      if (document.visibilityState === 'visible') {
        // Quando a página volta a ficar visível, verificar conexão
        checkConnection().then(() => {
          lastConnectionCheckRef.current = Date.now();
        });
        lastActivityRef.current = Date.now();
      }
    };

    document.addEventListener('visibilitychange', handleVisibilityChange);

    // Monitorar eventos online/offline do navegador
    const handleOnline = () => {
      console.log('✅ [AutoRefresh] Conexão de rede restaurada');
      checkConnection().then(() => {
        lastConnectionCheckRef.current = Date.now();
      });
    };

    const handleOffline = () => {
      console.warn('⚠️ [AutoRefresh] Conexão de rede perdida');
      // Não recarregar imediatamente, aguardar health check
    };

    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);

    return () => {
      events.forEach(event => {
        document.removeEventListener(event, updateActivity);
      });
      if (connectionCheckIntervalRef.current) {
        clearInterval(connectionCheckIntervalRef.current);
      }
      document.removeEventListener('visibilitychange', handleVisibilityChange);
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
    };
  }, []);

  // Componente invisível
  return null;
};

