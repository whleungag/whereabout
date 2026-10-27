import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';

// https://vitejs.dev/config/
export default defineConfig({
  plugins: [react()],
  base: './', // Ensures assets load correctly in Electron file:// protocol
  optimizeDeps: {
    exclude: ['lucide-react'],
  },
});
