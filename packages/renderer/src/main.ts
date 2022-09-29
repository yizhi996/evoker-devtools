import { createApp } from 'vue'
import App from './App.vue'
import './api'
import './tailwind.css'
import elementUI from './element-ui'
import { initialize } from './composables/useDevice'
import { useEvents } from './composables/useEvents'
import { Events } from '#shared'
import { setUseDevJSSDK } from './env'

setUseDevJSSDK(false)

const app = createApp(App)

const { dispatch } = useEvents()

window.electronAPI.onInitEnv((_, env) => {
  window.env = env
})

window.electronAPI.onOpenProject((_, project) => {
  window.project = project
  dispatch(Events.OPEN_PROJECT)
})

window.electronAPI.onReload(() => {
  dispatch(Events.RELOAD)
})

initialize().then(() => {})

app.use(elementUI)

app.mount('#app')
