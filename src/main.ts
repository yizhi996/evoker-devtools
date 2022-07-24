import { createApp } from 'vue'
import App from './App.vue'
// import './samples/node-api'
import { loadAppPath } from './utils'

import './tailwind.css'

loadAppPath().then(() => {
  createApp(App)
    .mount('#app')
    .$nextTick(() => {
      postMessage({ payload: 'removeLoading' }, '*')
    })
})
