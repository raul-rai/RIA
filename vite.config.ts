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
    build: {
      rollupOptions: {
        output: {
          /**
           * Divisão por VIDA ÚTIL, não por rota.
           *
           * Saía um arquivo só, com tudo dentro. Uma vírgula mexida em qualquer
           * componente trocava o hash do pacote inteiro, e o visitante que
           * voltava rebaixava os 450 KB de novo — inclusive o React, que não
           * mudou desde a instalação. O cache do navegador existia e nunca era
           * usado.
           *
           * O critério destes três grupos é com que FREQUÊNCIA cada coisa muda:
           * o React muda quando se atualiza o React (raro), o motion quando se
           * atualiza o motion (raro), o app muda toda semana. Separados, uma
           * publicação nova invalida só o último.
           *
           * NÃO é divisão por rota, e a diferença importa. Dividir por rota
           * exigiria `lazy` nas páginas, e as páginas são renderizadas no
           * servidor pelo prerender — que usa `renderToString`, síncrono, sem
           * como esperar um módulo assíncrono. Um `lazy` no caminho do
           * prerender derruba o build, e desistir do prerender custaria a
           * legibilidade por crawler que é o produto da Frente 1. Aqui o
           * primeiro acesso baixa os mesmos bytes, em paralelo; quem volta
           * baixa só o que mudou.
           */
          manualChunks(id) {
            if (!id.includes('node_modules')) return;
            const caminho = id.split('\\').join('/');
            if (/\/node_modules\/(react|react-dom|scheduler)\//.test(caminho)) return 'react';
            if (/\/node_modules\/(motion|framer-motion|motion-dom|motion-utils)\//.test(caminho)) {
              return 'motion';
            }
            if (/\/node_modules\/react-router/.test(caminho)) return 'router';
          },
        },
      },
    },
    server: {
      // HMR desativado no AI Studio via DISABLE_HMR.
      hmr: process.env.DISABLE_HMR !== 'true',
    },
  };
});
