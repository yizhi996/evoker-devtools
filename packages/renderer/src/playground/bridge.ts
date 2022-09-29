import { isString } from '@vue/shared'

interface InvokeArgs {
  event: string
  params: string
  callbackId: number
}

export class Bridge {
  container?: Electron.WebviewTag

  constructor(container?: Electron.WebviewTag) {
    this.container = container
  }

  invokeCallback(event: string, callbackId: number, errMsg: string, data?: Record<string, any>) {
    if (!this.container) {
      return
    }
    const result = JSON.stringify({
      id: callbackId,
      event,
      errMsg,
      data: data || {}
    })

    this.container.executeJavaScript(`JSBridge.invokeCallbackHandler(${result})`)
  }

  invokeCallbackSuccess(args: InvokeArgs, result?: Record<string, any>) {
    this.invokeCallback(args.event, args.callbackId, '', result)
  }

  invokeCallbackFail(args: InvokeArgs, error: string) {
    this.invokeCallback(args.event, args.callbackId, error)
  }

  subscribeHandler(method: string, data: string | Record<string, any>, webViewId: number = 0) {
    if (!this.container) {
      return
    }
    const message = isString(data) ? data : JSON.stringify(data)
    this.container.executeJavaScript(
      `JSBridge.subscribeHandler('${method}', ${message}, ${webViewId})`
    )
  }
}
