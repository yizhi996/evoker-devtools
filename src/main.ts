import { createApp } from 'vue'
import App from './App.vue'
import './bridge'

import './tailwind.css'

const app = createApp(App)

app.mount('#app').$nextTick(() => {
  postMessage({ payload: 'removeLoading' }, '*')
})
