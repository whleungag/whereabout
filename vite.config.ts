import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import path from 'path';

// https://vitejs.dev/config/
export default defineConfig({
  plugins: [react()],
  base: './', // 確保 Electron 環境下的相對路徑能正確載入資源
  resolve: {
    alias: {
      '@': path.resolve(process.cwd(), './src'), // 讓 Vite 能夠識別 @/ 指向 src/ 目錄
    },
  },
  optimizeDeps: {
    exclude: ['lucide-react'],
  },
});
