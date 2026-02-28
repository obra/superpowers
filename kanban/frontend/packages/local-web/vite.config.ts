import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import { tanstackRouter } from '@tanstack/router-plugin/vite'
import path from 'path'

export default defineConfig({
  publicDir: path.resolve(__dirname, '../public'),
  plugins: [
    tanstackRouter({ target: 'react', autoCodeSplitting: false }),
    react(),
  ],
  resolve: {
    alias: [
      { find: '@web', replacement: path.resolve(__dirname, 'src') },
      { find: '@app', replacement: path.resolve(__dirname, '../app-core/src') },
    ],
  },
  server: {
    port: parseInt(process.env.FRONTEND_PORT || '5173'),
    proxy: {
      '/api': {
        target: `http://localhost:${process.env.BACKEND_PORT || '3001'}`,
        changeOrigin: true,
        ws: true,
      },
    },
    fs: {
      allow: [path.resolve(__dirname, '.'), path.resolve(__dirname, '../..')],
    },
  },
  build: { sourcemap: true },
})
