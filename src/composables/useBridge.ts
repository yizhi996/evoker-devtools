import { Ref } from 'vue'
import { AppService } from './useService'
import { isString } from '@vue/shared'

interface InvokeArgs {
  event: string
  params: string
  callbackId: number
}

interface PublishArgs {
  event: string
  params: string
  webViewId: number
}

export interface Bridge {
  invokeCallback: (
    event: string,
    callbackId: number,
    errMsg: string,
    data?: Record<string, any>
  ) => void

  invokeCallbackSuccess: (args: InvokeArgs, result?: Record<string, any>) => void

  invokeCallbackFail: (args: InvokeArgs, error: string) => void

  subscribeHandler: (method: string, data: string | Record<string, any>, webViewId?: number) => void
}

export function useBridge(
  service: AppService,
  containerEl: Ref<Electron.WebviewTag | undefined>
): Bridge {
  const onInvoke = (args: InvokeArgs) => {
    console.log(args)
  }

  const onPublish = (args: PublishArgs) => {
    const { event, params, webViewId } = args
    if (
      event === 'vdSync' ||
      event === 'invokeAppServiceMethod' ||
      event === 'callbackWebViewMethod'
    ) {
      service.bridge.subscribeHandler(event, params, webViewId)
    } else if (event === 'callbackAppServiceMethod' || event === 'invokeWebViewMethod') {
      const webPage = service.findPage(webViewId)
      webPage && webPage.bridge.subscribeHandler(event, params, webViewId)
    }
  }

  const invokeCallback = (
    event: string,
    callbackId: number,
    errMsg: string,
    data?: Record<string, any>
  ) => {
    const container = containerEl.value
    if (!container) {
      return
    }
    const result = JSON.stringify({
      id: callbackId,
      event,
      errMsg,
      data: data || {}
    })

    container.executeJavaScript(`JSBridge.invokeCallbackHandler(${result})`)
  }

  const invokeCallbackSuccess = (args: InvokeArgs, result?: Record<string, any>) => {
    invokeCallback(args.event, args.callbackId, '', result)
  }

  const invokeCallbackFail = (args: InvokeArgs, error: string) => {
    invokeCallback(args.event, args.callbackId, error)
  }

  const subscribeHandler = (
    method: string,
    data: string | Record<string, any>,
    webViewId: number = 0
  ) => {
    const container = containerEl.value
    if (!container) {
      return
    }
    const message = isString(data) ? data : JSON.stringify(data)
    container.executeJavaScript(`JSBridge.subscribeHandler('${method}', ${message}, ${webViewId})`)
  }

  return {
    invokeCallback,
    invokeCallbackSuccess,
    invokeCallbackFail,
    subscribeHandler
  }
}
