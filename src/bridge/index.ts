import { ipcRenderer } from 'electron'
import { globalAppService } from '../composables/useService'

const apis: { [x: string]: Function } = {
  navigateTo
}

interface NavigateToParams {
  url: string
}

function navigateTo(params: NavigateToParams) {
  if (!globalAppService) {
    return
  }
  globalAppService.push(params.url)
}

ipcRenderer.on('API_INVOKE', (_, event: string, params: Record<string, any>) => {
  const api = apis[event]
  api && api(params)
})
