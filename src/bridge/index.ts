import { ipcRenderer } from 'electron'
import { globalAppService } from '../composables/service'

const apis: { [x: string]: Function } = {
  navigateTo,
  navigateBack
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

interface NavigateBackParams {
  delta?: number
}

function navigateBack(params: NavigateBackParams) {
  if (!globalAppService) {
    return
  }
  globalAppService.back(params.delta || 1)
}

ipcRenderer.on('API_INVOKE', (_, event: string, params: Record<string, any>) => {
  const api = apis[event]
  api && api(params)
})
