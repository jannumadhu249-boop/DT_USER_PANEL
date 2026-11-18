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
          Origin: 'http://72.61.116.4:3003',
        },
        rewrite: (path) => path.replace(/^\/payglocal-api/, ''),
      },
    },
  },
  preview: {
    proxy: {
      '/payglocal-api': {
        target: 'https://api.uat.payglocal.in',
        changeOrigin: true,
        secure: false,
        headers: {
          Origin: 'http://72.61.116.4:3003',
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
