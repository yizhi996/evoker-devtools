import { createApp } from 'vue'
import App from './App.vue'
// import './samples/node-api'
import { loadAppPath } from './utils'
import './bridge'

import './tailwind.css'
import { ipcRenderer } from 'electron'
import { globalAppService } from './composables/useService'

loadAppPath().then(() => {
  createApp(App)
    .mount('#app')
    .$nextTick(() => {
      postMessage({ payload: 'removeLoading' }, '*')
    })
})

ipcRenderer.on('reload', () => {})
