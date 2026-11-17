import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

// https://vite.dev/config/
export default defineConfig({
  plugins: [react()],
  server: {
    proxy: {
      '/payglocal-api': {
        target: 'https://api.uat.payglocal.in',
        changeOrigin: true,
        secure: false,
        headers: {
          Origin: 'http://localhost:3000',
        },
        rewrite: (path) => path.replace(/^\/payglocal-api/, ''),
      },
    },
  },
  build: {
    commonjsOptions: {
      include: [/node_modules/]
    }
  }
})
