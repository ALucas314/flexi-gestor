import { defineConfig } from "vite";
import react from "@vitejs/plugin-react-swc";
import path from "path";
import { componentTagger } from "lovable-tagger";

// https://vitejs.dev/config/
export default defineConfig(({ mode }) => ({
  server: {
    host: "::",
    port: 8080,
    // Melhorar HMR (Hot Module Replacement) - FORÇAR ATUALIZAÇÃO
    hmr: {
      overlay: true, // Mostrar erros na tela
      protocol: 'ws', // WebSocket
      host: 'localhost',
      port: 8080,
      clientPort: 8080,
      client: {
        reconnect: 5, // Tentar reconectar até 5 vezes
        overlay: true,
      },
    },
    // Watch options para auto-reload funcionar melhor
    watch: {
      usePolling: false, // Desabilitar polling - reduz uso de CPU
      ignored: ['**/node_modules/**', '**/.git/**', '**/dist/**'], // Ignorar pastas desnecessárias
    },
    // Força reload completo se HMR falhar
    strictPort: false, // Permitir usar outra porta se 8080 estiver ocupada
    // Melhorar timeout para evitar desconexões
    warmup: {
      clientFiles: ['./src/main.tsx', './src/App.tsx', './index.html'],
    },
  },
  plugins: [
    react({
      // Fast Refresh para evitar full reload
      fastRefresh: true,
      // Não exigir export default
      jsxRuntime: 'automatic',
    }),
    mode === 'development' &&
    componentTagger(),
  ].filter(Boolean),
  // Otimizações para evitar reloads desnecessários
  optimizeDeps: {
    exclude: ['lovable-tagger'], // Excluir plugins de dev
  },
  resolve: {
    alias: {
      "@": path.resolve(__dirname, "./src"),
    },
  },
  define: {
    'import.meta.env.VITE_API_URL': JSON.stringify(
      process.env.VITE_API_URL || 'https://flexi-gestor-production.up.railway.app/api'
    ),
  },
}));
