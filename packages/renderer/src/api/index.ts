import { globalAppService } from '../playground/service'

const apis: { [x: string]: Function } = {
  navigateTo,
  navigateBack,
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

window.electronAPI.onApiInvoke((_, event, params) => {
  console.log(event, params)
  const api = apis[event]
  api && api(params)
})
