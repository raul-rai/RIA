import tailwindcss from '@tailwindcss/vite';
import react from '@vitejs/plugin-react';
import path from 'path';
import { defineConfig } from 'vite';

export default defineConfig(() => {
  return {
    /**
     * Caminho base do site. '/' na home; '/v2/' quando o build vai para o
     * subdiretório de avaliação.
     *
     * Precisa vir daqui porque o Vite reescreve no HTML as URLs dos assets com
     * este prefixo — sem ele o /v2 pediria /assets/index.js e receberia o
     * bundle da home, que é outra versão do site inteiro.
     */
    base: process.env.SITE_BASE || '/',
    plugins: [react(), tailwindcss()],
    resolve: {
      alias: {
        '@': path.resolve(__dirname, '.'),
      },
    },
    server: {
      // HMR desativado no AI Studio via DISABLE_HMR.
      hmr: process.env.DISABLE_HMR !== 'true',
    },
  };
});
