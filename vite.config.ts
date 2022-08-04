import { rmSync } from 'fs'
import { join, resolve } from 'path'
import { defineConfig } from 'vite'
import vue from '@vitejs/plugin-vue'
import electron from 'vite-plugin-electron'
import pkg from './package.json'
import copy from 'rollup-plugin-copy'
import ElementPlus from 'unplugin-element-plus/vite'

rmSync('dist', { recursive: true, force: true }) // v14.14.0

const alias = { '@shared': resolve('electron/shared') }

// https://vitejs.dev/config/
export default defineConfig({
  resolve: {
    alias
  },
  plugins: [
    vue({
      template: {
        compilerOptions: {
          isCustomElement: tag => tag === 'webview'
        }
      }
    }),
    electron({
      main: {
        entry: 'electron/main/index.ts',
        vite: {
          resolve: {
            alias
          },
          build: {
            outDir: 'dist/electron/main'
          },
          plugins: [
            copy({ targets: [{ src: 'electron/main/assets', dest: 'dist/electron/main' }] })
          ]
        }
      },
      preload: {
        input: {
          // You can configure multiple preload here
          index: join(__dirname, 'electron/preload/index.ts')
        },
        vite: {
          build: {
            // For debug
            sourcemap: 'inline',
            outDir: 'dist/electron/preload'
          }
        }
      },
      // Enables use of Node.js API in the Renderer-process
      renderer: {}
    }),
    ElementPlus()
  ],
  server: {
    host: pkg.env.VITE_DEV_SERVER_HOST,
    port: pkg.env.VITE_DEV_SERVER_PORT
  }
})
