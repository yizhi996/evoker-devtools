import { createApp } from 'vue'
import App from './App.vue'
import './bridge'
import './tailwind.css'
import elementUI from './element-ui'
import { initialize } from './composables/useDevice'
import { ipcRenderer } from 'electron'
import { useEvents } from './composables/useEvents'
import { Events } from '@shared/event'

const app = createApp(App)

const { dispatch } = useEvents()

ipcRenderer.on('init_env', (_, env) => {
  window.env = env
})

ipcRenderer.on(Events.OPEN_PROJECT, (_, project) => {
  window.project = project
  dispatch(Events.OPEN_PROJECT)
})

ipcRenderer.on('reload', () => {
  dispatch('reload')
})

initialize().then(() => {})

app.use(elementUI)

app.mount('#app').$nextTick(() => {
  postMessage({ payload: 'removeLoading' }, '*')
})
