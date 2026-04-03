import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

import { loadEnv } from 'vite'

// https://vite.dev/config/
export default defineConfig(({ mode }) => {
  const env = loadEnv(mode, process.cwd(), '')
  return {
    plugins: [react()],
    define: {
      'import.meta.env.VITE_HF_ACCESS_TOKEN': JSON.stringify(env.HF_ACCESS_TOKEN || env.VITE_HF_ACCESS_TOKEN || '')
    },
  server: {
    proxy: {
      '/api/huggingface': {
        target: 'https://router.huggingface.co',
        changeOrigin: true,
        rewrite: (path) => path.replace(/^\/api\/huggingface/, ''),
      },
    },
  },
  }
})
