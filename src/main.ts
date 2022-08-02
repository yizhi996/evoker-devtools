import { createApp } from 'vue'
import App from './App.vue'
import './bridge'

import './tailwind.css'

const app = createApp(App)

import { initialize } from './composables/useDevice'
import { ipcRenderer } from 'electron'
import { useEvents } from './composables/useEvents'

ipcRenderer.on('init_env', (_, env) => {
  window.env = env
  useEvents().dispatch('open-project')
})

initialize().then(() => {
  app.mount('#app').$nextTick(() => {
    postMessage({ payload: 'removeLoading' }, '*')
  })
})
