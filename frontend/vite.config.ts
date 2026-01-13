import react from '@vitejs/plugin-react';
import tailwindcss from '@tailwindcss/vite';
import { defineConfig, loadEnv } from 'vite';

export default defineConfig(({ mode }) => {
  const env = loadEnv(mode, process.cwd(), '');
  return {
    plugins: [react(), tailwindcss()],
    server: {
      port: 5173,
      strictPort: true,
      cors: {
        origin: env.VITE_PUBLIC_URL || 'http://localhost:5173',
        credentials: true,
      }
    },
    resolve: {
      alias: {
        '@': '/src',
      },
    },
    build: {
      sourcemap: true,
    },
  };
});
